import express from 'express'
import Kanban from '../models/Kanban.js'
import { auth, requireRole } from '../middleware/auth.js'

const DEFAULT_BOARD = {
  lanes: [ { id: 'lane-1', title: 'Default Lane' } ],
  columns: [
    { id: 'col-todo', title: '📝 To Do — Planned engagement activities' },
    { id: 'col-inprogress', title: '🚧 In Progress — Activities currently happening' },
    { id: 'col-review', title: '👀 Review/Approval — Waiting for HR/manager approval' },
    { id: 'col-done', title: '✅ Completed — Finished activities' },
  ],
  cards: {},
}

export default function (io) {
  const router = express.Router()

  async function getBoardDoc() {
    // default: global board (ownerId == null)
    let doc = await Kanban.findOne({ ownerId: null })
    if (!doc) {
      doc = new Kanban({ ...DEFAULT_BOARD, ownerId: null })
      await doc.save()
    }
    return doc
  }

  async function getBoardDocForOwner(ownerId) {
    if (!ownerId) return getBoardDoc()
    let doc = await Kanban.findOne({ ownerId })
    if (!doc) {
      doc = new Kanban({ ...DEFAULT_BOARD, ownerId })
      await doc.save()
    }
    return doc
  }

  // public board read. Supports optional query ?userId=<id> to get a specific user's board.
  router.get('/', async (req, res) => {
    try {
      const reqUserId = req.query.userId || null
      // parse optional token to know requester role/userId
      let role = null
      let requesterId = null
      try {
        const header = req.headers.authorization
        if (header && header.startsWith('Bearer ')) {
          const token = header.split(' ')[1]
          const jwt = await import('jsonwebtoken')
          const JWT_SECRET = process.env.JWT_SECRET || 'worksphere-secret-change-in-production'
          const payload = jwt.verify(token, JWT_SECRET)
          role = payload.role
          requesterId = payload.userId
        }
      } catch (e) {
        // ignore token errors — unauthenticated
      }

      // authorization: if userId requested and requester is employee, allow only if requesterId === userId
      if (reqUserId) {
        if (role === 'employee' && requesterId !== reqUserId) {
          return res.status(403).json({ message: 'Insufficient permissions to view this board' })
        }
        // admins/hr allowed
      }

      const doc = await getBoardDocForOwner(reqUserId)
      let cards = { ...doc.cards }

      if (role === 'admin' || role === 'hr') {
        // full visibility
      } else if (role === 'employee') {
        // employees see public or assigned (for the target user)
        const filtered = {}
        Object.entries(cards).forEach(([id, c]) => {
          const isPublic = !c.visibility || c.visibility === 'public'
          const assigned = Array.isArray(c.assignees) && requesterId && c.assignees.includes(requesterId)
          if (isPublic || assigned) filtered[id] = c
        })
        cards = filtered
      } else {
        // unauthenticated — only public
        const filtered = {}
        Object.entries(cards).forEach(([id, c]) => {
          const isPublic = !c.visibility || c.visibility === 'public'
          if (isPublic) filtered[id] = c
        })
        cards = filtered
      }

      res.json({ board: { lanes: doc.lanes, columns: doc.columns, cards } })
    } catch (err) {
      res.status(500).json({ message: 'Error fetching kanban' })
    }
  })

  // update whole board (only HR/Admin or owner)
  router.post('/', auth, async (req, res) => {
    try {
      const { ownerId, lanes, columns, cards } = req.body
      const requesterRole = req.role
      const requesterId = req.userId

      // allow admins/hr to update any board; allow owner to update their own board (ownerId)
      if (ownerId) {
        if (!(requesterRole === 'admin' || requesterRole === 'hr' || requesterId === ownerId)) {
          return res.status(403).json({ message: 'Insufficient permissions to update this board' })
        }
      } else {
        if (!(requesterRole === 'admin' || requesterRole === 'hr')) {
          return res.status(403).json({ message: 'Insufficient permissions to update global board' })
        }
      }

      const doc = await getBoardDocForOwner(ownerId || null)
      if (lanes) doc.lanes = lanes
      if (columns) doc.columns = columns
      if (cards) doc.cards = cards
      await doc.save()
      if (io && typeof io.emit === 'function') io.emit('kanban:update', { lanes: doc.lanes, columns: doc.columns, cards: doc.cards, ownerId: doc.ownerId })
      res.json({ ok: true, board: { lanes: doc.lanes, columns: doc.columns, cards: doc.cards } })
    } catch (err) {
      res.status(500).json({ message: 'Error saving kanban' })
    }
  })

  // create card: only HR/Admin can create cards
  router.post('/cards', auth, requireRole('admin', 'hr'), async (req, res) => {
    try {
      const doc = await getBoardDoc()
      const card = req.body
      // role and userId available from auth middleware
      const creatorId = req.userId
      const creatorRole = req.role
      const id = card.id || `card-${Date.now()}`
      const newCard = {
        id,
        title: card.title || 'Untitled',
        description: card.description || '',
        type: card.type || 'type1',
        laneId: card.laneId || doc.lanes[0]?.id,
        columnId: card.columnId || doc.columns[0]?.id,
        assignees: Array.isArray(card.assignees) ? card.assignees : [],
        priority: card.priority || 'Medium',
        dueDate: card.dueDate ? new Date(card.dueDate) : null,
        attachments: Array.isArray(card.attachments) ? card.attachments : [],
        approved: card.approved || false,
        status: card.status || 'open',
        comments: [],
        visibility: card.visibility || 'public',
        createdBy: creatorId,
        creatorRole: creatorRole || 'employee',
      }
      doc.cards = { ...doc.cards, [id]: newCard }
      await doc.save()
      if (io && typeof io.emit === 'function') io.emit('kanban:update', { lanes: doc.lanes, columns: doc.columns, cards: doc.cards })
      res.json(newCard)
    } catch (err) {
      res.status(500).json({ message: 'Error adding card' })
    }
  })

  // update a card: must be authenticated. Employees have limited edit rights.
  router.patch('/cards/:id', auth, async (req, res) => {
    try {
      const doc = await getBoardDoc()
      const id = req.params.id
      if (!doc.cards[id]) return res.status(404).json({ message: 'Card not found' })
      const patch = { ...req.body }
      // role and userId
      const role = req.role
      const userId = req.userId

      // If employee, restrict which fields they can modify
      const employeeRestrictedFields = ['title', 'priority', 'dueDate', 'assignees', 'attachments', 'createdBy', 'creatorRole', 'visibility']
      if (role === 'employee') {
        for (const f of employeeRestrictedFields) {
          if (f in patch) return res.status(403).json({ message: `Employees cannot modify field: ${f}` })
        }
        // prevent moving to completed column without approval
        if (patch.columnId === 'col-done') return res.status(403).json({ message: 'Cannot move to Completed without approval' })
      }

      // coerce dueDate if provided (admins/hr allowed)
      if (patch.dueDate) patch.dueDate = new Date(patch.dueDate)

      // Only allow delete via DELETE route
      doc.cards[id] = { ...doc.cards[id], ...patch }
      await doc.save()
      if (io && typeof io.emit === 'function') io.emit('kanban:update', { lanes: doc.lanes, columns: doc.columns, cards: doc.cards })
      res.json(doc.cards[id])
    } catch (err) {
      res.status(500).json({ message: 'Error updating card' })
    }
  })

  // delete a card: only admin/hr
  router.delete('/cards/:id', auth, requireRole('admin', 'hr'), async (req, res) => {
    try {
      const doc = await getBoardDoc()
      const id = req.params.id
      if (doc.cards[id]) delete doc.cards[id]
      await doc.save()
      if (io && typeof io.emit === 'function') io.emit('kanban:update', { lanes: doc.lanes, columns: doc.columns, cards: doc.cards })
      res.json({ ok: true })
    } catch (err) {
      res.status(500).json({ message: 'Error deleting card' })
    }
  })

  return router
}
