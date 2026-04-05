import express from 'express'
import Kanban from '../models/Kanban.js'
import User from '../models/User.js'
import { auth, requireRole } from '../middleware/auth.js'

export default function (io) {
  const router = express.Router()

  // ==================== BOARDS ====================

  // Get all boards (HR/Admin see all, employees see assigned/public boards)
  router.get('/boards', auth, async (req, res) => {
    try {
      const userId = req.userId
      const role = req.role

      let query = { isActive: true, archived: false }

      if (role === 'hr' || role === 'admin') {
        // HR/Admin see all active boards
      } else if (role === 'employee') {
        // Employees see boards where they are members or public boards
        query = {
          ...query,
          $or: [
            { members: userId },
            { boardType: 'global' }
          ]
        }
      }

      const boards = await Kanban.find(query).select('_id name description boardType createdBy createdAt members')
      res.json(boards)
    } catch (err) {
      res.status(500).json({ message: 'Error fetching boards', error: err.message })
    }
  })

  // Get single board
  router.get('/boards/:boardId', auth, async (req, res) => {
    try {
      const { boardId } = req.params
      const userId = req.userId
      const role = req.role

      const board = await Kanban.findById(boardId)
      if (!board) return res.status(404).json({ message: 'Board not found' })

      // Check access
      const isMember = board.members.includes(userId)
      const isPublic = board.boardType === 'global'
      const isCreator = board.createdBy === userId

      if (role === 'employee' && !isMember && !isPublic) {
        return res.status(403).json({ message: 'Access denied to this board' })
      }

      res.json(board)
    } catch (err) {
      res.status(500).json({ message: 'Error fetching board', error: err.message })
    }
  })

  // Create board (HR/Admin only)
  router.post('/boards', auth, requireRole('admin', 'hr'), async (req, res) => {
    try {
      const { name, description, boardType, members } = req.body
      const userId = req.userId

      if (!name) return res.status(400).json({ message: 'Board name is required' })

      const defaultColumns = [
        { id: 'col-todo', title: '📝 To Do', description: 'Planned tasks', order: 1, color: '#e74c3c' },
        { id: 'col-inprogress', title: '🚧 In Progress', description: 'Currently being worked on', order: 2, color: '#f39c12' },
        { id: 'col-review', title: '👀 Review', description: 'Waiting for approval', order: 3, color: '#3498db' },
        { id: 'col-done', title: '✅ Done', description: 'Completed tasks', order: 4, color: '#2ecc71' },
      ]

      const board = new Kanban({
        name,
        description: description || '',
        boardType: boardType || 'global',
        createdBy: userId,
        members: Array.isArray(members) ? members : [],
        columns: defaultColumns,
        cards: new Map(),
      })

      await board.save()
      res.status(201).json(board)

      // Emit event
      if (io) io.emit('kanban:boardCreated', { board })
    } catch (err) {
      res.status(500).json({ message: 'Error creating board', error: err.message })
    }
  })

  // Update board (HR/Admin only)
  router.put('/boards/:boardId', auth, requireRole('admin', 'hr'), async (req, res) => {
    try {
      const { boardId } = req.params
      const { name, description, members } = req.body

      const board = await Kanban.findByIdAndUpdate(
        boardId,
        {
          name: name || undefined,
          description: description !== undefined ? description : undefined,
          members: Array.isArray(members) ? members : undefined,
          updatedAt: Date.now(),
        },
        { new: true }
      )

      if (!board) return res.status(404).json({ message: 'Board not found' })

      res.json(board)
      if (io) io.emit('kanban:boardUpdated', { board })
    } catch (err) {
      res.status(500).json({ message: 'Error updating board', error: err.message })
    }
  })

  // Delete board (HR/Admin only)
  router.delete('/boards/:boardId', auth, requireRole('admin', 'hr'), async (req, res) => {
    try {
      const { boardId } = req.params
      await Kanban.findByIdAndUpdate(boardId, { archived: true, isActive: false })
      res.json({ ok: true })

      if (io) io.emit('kanban:boardDeleted', { boardId })
    } catch (err) {
      res.status(500).json({ message: 'Error deleting board', error: err.message })
    }
  })

  // ==================== COLUMNS ====================

  // Update columns (HR/Admin only)
  router.put('/boards/:boardId/columns', auth, requireRole('admin', 'hr'), async (req, res) => {
    try {
      const { boardId } = req.params
      const { columns } = req.body

      const board = await Kanban.findByIdAndUpdate(
        boardId,
        { columns, updatedAt: Date.now() },
        { new: true }
      )

      if (!board) return res.status(404).json({ message: 'Board not found' })

      res.json(board)
      if (io) io.emit('kanban:columnsUpdated', { boardId, columns })
    } catch (err) {
      res.status(500).json({ message: 'Error updating columns', error: err.message })
    }
  })

  // Add column (HR/Admin only)
  router.post('/boards/:boardId/columns', auth, requireRole('admin', 'hr'), async (req, res) => {
    try {
      const { boardId } = req.params
      const { title, description, color } = req.body

      const board = await Kanban.findById(boardId)
      if (!board) return res.status(404).json({ message: 'Board not found' })

      const newColumn = {
        id: `col-${Date.now()}`,
        title: title || 'New Column',
        description: description || '',
        color: color || '#3498db',
        order: board.columns.length + 1,
      }

      board.columns.push(newColumn)
      await board.save()

      res.status(201).json(newColumn)
      if (io) io.emit('kanban:columnAdded', { boardId, column: newColumn })
    } catch (err) {
      res.status(500).json({ message: 'Error adding column', error: err.message })
    }
  })

  // Delete column (HR/Admin only)
  router.delete('/boards/:boardId/columns/:columnId', auth, requireRole('admin', 'hr'), async (req, res) => {
    try {
      const { boardId, columnId } = req.params

      const board = await Kanban.findById(boardId)
      if (!board) return res.status(404).json({ message: 'Board not found' })

      board.columns = board.columns.filter(col => col.id !== columnId)
      
      // Move all cards from this column to first column
      const firstColumnId = board.columns[0]?.id
      if (firstColumnId) {
        for (const [cardId, card] of board.cards) {
          if (card.columnId === columnId) {
            card.columnId = firstColumnId
          }
        }
      }

      await board.save()
      res.json({ ok: true })
      if (io) io.emit('kanban:columnDeleted', { boardId, columnId })
    } catch (err) {
      res.status(500).json({ message: 'Error deleting column', error: err.message })
    }
  })

  // ==================== CARDS/TASKS ====================

  // Create card (HR/Admin only)
  router.post('/boards/:boardId/cards', auth, requireRole('admin', 'hr'), async (req, res) => {
    try {
      const { boardId } = req.params
      const { title, description, columnId, priority, dueDate, assignees, visibility } = req.body
      const userId = req.userId

      const board = await Kanban.findById(boardId)
      if (!board) return res.status(404).json({ message: 'Board not found' })

      const cardId = `card-${Date.now()}`
      const newCard = {
        id: cardId,
        title: title || 'Untitled Task',
        description: description || '',
        priority: priority || 'Medium',
        columnId: columnId || board.columns[0]?.id,
        assignees: Array.isArray(assignees) ? assignees : [],
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: userId,
        comments: [],
        attachments: [],
        visibility: visibility || 'public',
      }

      board.cards.set(cardId, newCard)
      await board.save()

      res.status(201).json(newCard)
      if (io) io.emit('kanban:cardCreated', { boardId, card: newCard })
    } catch (err) {
      res.status(500).json({ message: 'Error creating card', error: err.message })
    }
  })

  // Get card details
  router.get('/boards/:boardId/cards/:cardId', auth, async (req, res) => {
    try {
      const { boardId, cardId } = req.params
      const userId = req.userId
      const role = req.role

      const board = await Kanban.findById(boardId)
      if (!board) return res.status(404).json({ message: 'Board not found' })

      const card = board.cards.get(cardId)
      if (!card) return res.status(404).json({ message: 'Card not found' })

      // Check access
      if (role === 'employee') {
        const isAssigned = card.assignees.includes(userId)
        const isPublic = card.visibility === 'public'
        if (!isAssigned && !isPublic) {
          return res.status(403).json({ message: 'Access denied to this card' })
        }
      }

      res.json(card)
    } catch (err) {
      res.status(500).json({ message: 'Error fetching card', error: err.message })
    }
  })

  // Update card
  router.put('/boards/:boardId/cards/:cardId', auth, async (req, res) => {
    try {
      const { boardId, cardId } = req.params
      const userId = req.userId
      const role = req.role
      const updates = req.body

      const board = await Kanban.findById(boardId)
      if (!board) return res.status(404).json({ message: 'Board not found' })

      const card = board.cards.get(cardId)
      if (!card) return res.status(404).json({ message: 'Card not found' })

      // Authorization check
      if (role === 'employee') {
        const isAssigned = card.assignees.includes(userId)
        if (!isAssigned) {
          return res.status(403).json({ message: 'You can only move your assigned tasks' })
        }

        // Employees can only update certain fields
        const allowedFields = ['columnId', 'status']
        const restrictedUpdates = Object.keys(updates).filter(key => !allowedFields.includes(key))
        if (restrictedUpdates.length > 0) {
          return res.status(403).json({ message: `Employees cannot modify: ${restrictedUpdates.join(', ')}` })
        }
      }

      // Update card fields
      if (updates.title !== undefined) card.title = updates.title
      if (updates.description !== undefined) card.description = updates.description
      if (updates.columnId !== undefined) card.columnId = updates.columnId
      if (updates.priority !== undefined) card.priority = updates.priority
      if (updates.status !== undefined) card.status = updates.status
      if (updates.dueDate !== undefined) card.dueDate = updates.dueDate ? new Date(updates.dueDate) : null
      if (updates.assignees !== undefined && role !== 'employee') card.assignees = Array.isArray(updates.assignees) ? updates.assignees : []
      if (updates.visibility !== undefined && role !== 'employee') card.visibility = updates.visibility
      if (updates.archived !== undefined && role !== 'employee') card.archived = updates.archived

      board.markModified('cards')
      await board.save()

      res.json(card)
      if (io) io.emit('kanban:cardUpdated', { boardId, card })
    } catch (err) {
      res.status(500).json({ message: 'Error updating card', error: err.message })
    }
  })

  // Delete card (HR/Admin only)
  router.delete('/boards/:boardId/cards/:cardId', auth, requireRole('admin', 'hr'), async (req, res) => {
    try {
      const { boardId, cardId } = req.params

      const board = await Kanban.findById(boardId)
      if (!board) return res.status(404).json({ message: 'Board not found' })

      board.cards.delete(cardId)
      board.markModified('cards')
      await board.save()

      res.json({ ok: true })
      if (io) io.emit('kanban:cardDeleted', { boardId, cardId })
    } catch (err) {
      res.status(500).json({ message: 'Error deleting card', error: err.message })
    }
  })

  // Bulk move cards (drag and drop)
  router.put('/boards/:boardId/cards-bulk', auth, async (req, res) => {
    try {
      const { boardId } = req.params
      const { updates } = req.body // Array of { cardId, columnId }
      const userId = req.userId
      const role = req.role

      const board = await Kanban.findById(boardId)
      if (!board) return res.status(404).json({ message: 'Board not found' })

      for (const update of updates) {
        const card = board.cards.get(update.cardId)
        if (!card) continue

        // Check authorization
        if (role === 'employee') {
          const isAssigned = card.assignees.includes(userId)
          if (!isAssigned) continue
        }

        card.columnId = update.columnId
      }

      board.markModified('cards')
      await board.save()

      res.json({ ok: true })
      if (io) io.emit('kanban:cardsUpdated', { boardId })
    } catch (err) {
      res.status(500).json({ message: 'Error updating cards', error: err.message })
    }
  })

  // ==================== COMMENTS ====================

  // Add comment
  router.post('/boards/:boardId/cards/:cardId/comments', auth, async (req, res) => {
    try {
      const { boardId, cardId } = req.params
      const { text } = req.body
      const userId = req.userId

      const board = await Kanban.findById(boardId)
      if (!board) return res.status(404).json({ message: 'Board not found' })

      const card = board.cards.get(cardId)
      if (!card) return res.status(404).json({ message: 'Card not found' })

      // Check authorization
      const isAssigned = card.assignees.includes(userId)
      if (card.visibility === 'private' && !isAssigned) {
        return res.status(403).json({ message: 'Access denied' })
      }

      // Get user info
      const user = await User.findById(userId)
      const comment = {
        id: `comment-${Date.now()}`,
        userId,
        userName: user?.name || 'Unknown',
        text: text || '',
        createdAt: new Date(),
      }

      card.comments.push(comment)
      board.markModified('cards')
      await board.save()

      res.status(201).json(comment)
      if (io) io.emit('kanban:commentAdded', { boardId, cardId, comment })
    } catch (err) {
      res.status(500).json({ message: 'Error adding comment', error: err.message })
    }
  })

  // Delete comment (HR/Admin or owner)
  router.delete('/boards/:boardId/cards/:cardId/comments/:commentId', auth, async (req, res) => {
    try {
      const { boardId, cardId, commentId } = req.params
      const userId = req.userId
      const role = req.role

      const board = await Kanban.findById(boardId)
      if (!board) return res.status(404).json({ message: 'Board not found' })

      const card = board.cards.get(cardId)
      if (!card) return res.status(404).json({ message: 'Card not found' })

      const comment = card.comments.find(c => c.id === commentId)
      if (!comment) return res.status(404).json({ message: 'Comment not found' })

      // Only owner or HR/Admin can delete
      if (role !== 'hr' && role !== 'admin' && comment.userId !== userId) {
        return res.status(403).json({ message: 'Cannot delete other users\' comments' })
      }

      card.comments = card.comments.filter(c => c.id !== commentId)
      board.markModified('cards')
      await board.save()

      res.json({ ok: true })
      if (io) io.emit('kanban:commentDeleted', { boardId, cardId, commentId })
    } catch (err) {
      res.status(500).json({ message: 'Error deleting comment', error: err.message })
    }
  })

  // ==================== ATTACHMENTS ====================

  // Add attachment
  router.post('/boards/:boardId/cards/:cardId/attachments', auth, async (req, res) => {
    try {
      const { boardId, cardId } = req.params
      const { fileName, fileUrl } = req.body
      const userId = req.userId

      const board = await Kanban.findById(boardId)
      if (!board) return res.status(404).json({ message: 'Board not found' })

      const card = board.cards.get(cardId)
      if (!card) return res.status(404).json({ message: 'Card not found' })

      const attachment = {
        id: `att-${Date.now()}`,
        fileName,
        fileUrl,
        uploadedBy: userId,
        uploadedAt: new Date(),
      }

      card.attachments.push(attachment)
      board.markModified('cards')
      await board.save()

      res.status(201).json(attachment)
      if (io) io.emit('kanban:attachmentAdded', { boardId, cardId, attachment })
    } catch (err) {
      res.status(500).json({ message: 'Error adding attachment', error: err.message })
    }
  })

  // Delete attachment
  router.delete('/boards/:boardId/cards/:cardId/attachments/:attachmentId', auth, async (req, res) => {
    try {
      const { boardId, cardId, attachmentId } = req.params

      const board = await Kanban.findById(boardId)
      if (!board) return res.status(404).json({ message: 'Board not found' })

      const card = board.cards.get(cardId)
      if (!card) return res.status(404).json({ message: 'Card not found' })

      card.attachments = card.attachments.filter(a => a.id !== attachmentId)
      board.markModified('cards')
      await board.save()

      res.json({ ok: true })
      if (io) io.emit('kanban:attachmentDeleted', { boardId, cardId, attachmentId })
    } catch (err) {
      res.status(500).json({ message: 'Error deleting attachment', error: err.message })
    }
  })

  // ==================== REPORTS ====================

  // Get board report (HR/Admin only)
  router.get('/boards/:boardId/report', auth, requireRole('admin', 'hr'), async (req, res) => {
    try {
      const { boardId } = req.params

      const board = await Kanban.findById(boardId)
      if (!board) return res.status(404).json({ message: 'Board not found' })

      const report = {
        boardName: board.name,
        totalCards: board.cards.size,
        cardsByColumn: {},
        cardsByPriority: { Low: 0, Medium: 0, High: 0, Urgent: 0 },
        cardsByAssignee: {},
        overdueTasks: [],
        completedTasks: [],
        inProgressTasks: [],
      }

      // Process all cards
      for (const [cardId, card] of board.cards) {
        if (card.archived) continue

        // Count by column
        if (!report.cardsByColumn[card.columnId]) report.cardsByColumn[card.columnId] = 0
        report.cardsByColumn[card.columnId]++

        // Count by priority
        if (report.cardsByPriority.hasOwnProperty(card.priority)) {
          report.cardsByPriority[card.priority]++
        }

        // Count by assignee
        for (const assignee of card.assignees) {
          report.cardsByAssignee[assignee] = (report.cardsByAssignee[assignee] || 0) + 1
        }

        // Overdue tasks
        if (card.dueDate && new Date(card.dueDate) < new Date() && card.columnId !== board.columns.find(c => c.title.includes('Done'))?.id) {
          report.overdueTasks.push({ id: cardId, title: card.title, dueDate: card.dueDate, assignees: card.assignees })
        }

        // Completed tasks
        if (card.columnId === board.columns.find(c => c.title.includes('Done'))?.id) {
          report.completedTasks.push({ id: cardId, title: card.title })
        }

        // In progress
        if (card.columnId === board.columns.find(c => c.title.includes('Progress'))?.id) {
          report.inProgressTasks.push({ id: cardId, title: card.title, assignees: card.assignees })
        }
      }

      res.json(report)
    } catch (err) {
      res.status(500).json({ message: 'Error generating report', error: err.message })
    }
  })

  // Archive completed tasks (HR/Admin only)
  router.post('/boards/:boardId/archive-completed', auth, requireRole('admin', 'hr'), async (req, res) => {
    try {
      const { boardId } = req.params

      const board = await Kanban.findById(boardId)
      if (!board) return res.status(404).json({ message: 'Board not found' })

      const doneColumnId = board.columns.find(c => c.title.includes('Done'))?.id
      let archivedCount = 0

      for (const [cardId, card] of board.cards) {
        if (card.columnId === doneColumnId && !card.archived) {
          card.archived = true
          archivedCount++
        }
      }

      board.markModified('cards')
      await board.save()

      res.json({ ok: true, archivedCount })
      if (io) io.emit('kanban:tasksArchived', { boardId, count: archivedCount })
    } catch (err) {
      res.status(500).json({ message: 'Error archiving tasks', error: err.message })
    }
  })

  return router
}
