import { Router } from 'express'
import Recognition from '../models/Recognition.js'
import RBACUser from '../models/RBACUser.js'
import Notification from '../models/Notification.js'
import { auth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const { type = 'received', limit = 50 } = req.query
    const filter = type === 'given' ? { fromUser: req.userId } : { toUser: req.userId }
    const recognitions = await Recognition.find(filter)
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
    res.json(recognitions)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/all', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const recognitions = await Recognition.find()
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(200)
    res.json(recognitions)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { limit = 20 } = req.query
    const userCollection = RBACUser.collection.name
    const top = await Recognition.aggregate([
      { $group: { _id: '$toUser', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: Number(limit) },
      { $lookup: { from: userCollection, localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', email: '$user.email', count: 1, _id: 0 } },
    ])
    res.json(top)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { toUserId, message, category = 'general' } = req.body
    if (!toUserId || !message?.trim()) {
      return res.status(400).json({ message: 'Recipient and message required' })
    }
    if (toUserId === req.userId) {
      return res.status(400).json({ message: 'Cannot recognize yourself' })
    }
    // Try to locate recipient in RBAC users (admin/HR flows use RBACUser collection)
    const toUser = await RBACUser.findById(toUserId).select('_id name role')
    if (!toUser) return res.status(404).json({ message: 'Recipient not found' })
    // Enforce recognition rules:
    // - Employees: cannot send recognitions at all
    // - HR: can recognize only Employees
    // - Admin: can recognize anyone
    const senderRole = String(req.role || '').toLowerCase()
    const recipientRole = String(toUser.role || '').toLowerCase()

    if (senderRole === 'employee') {
      return res.status(403).json({ message: 'Employees are not allowed to send recognitions.' })
    }

    if (senderRole === 'hr' && recipientRole !== 'employee') {
      return res.status(403).json({ message: 'HR can only recognize employees.' })
    }
    const recognition = await Recognition.create({
      fromUser: req.userId,
      toUser: toUserId,
      message: message.trim(),
      category,
    })
    const fromUserDoc = await RBACUser.findById(req.userId).select('name')
    await Notification.create({
      user: toUserId,
      type: 'recognition',
      title: 'New recognition',
      body: `from:${fromUserDoc?.name || 'Someone'} to:${toUser.name} — "${message.trim().slice(0, 80)}${message.length > 80 ? '…' : ''}"`,
      link: '/dashboard/recognitions',
    })
    const populated = await Recognition.findById(recognition._id)
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
