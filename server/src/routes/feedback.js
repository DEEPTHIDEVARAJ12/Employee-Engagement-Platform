import { Router } from 'express'
import Feedback from '../models/Feedback.js'
import { auth, requireRole } from '../middleware/auth.js'

const router = Router()

router.post('/', auth, async (req, res) => {
  try {
    const { message, anonymous = true, category = 'general' } = req.body
    if (!message?.trim()) return res.status(400).json({ message: 'Message required' })
    const feedback = await Feedback.create({
      fromUser: anonymous ? null : req.userId,
      message: message.trim(),
      anonymous: !!anonymous,
      category: category || 'general',
    })
    res.status(201).json(feedback)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const { status, limit = 50 } = req.query
    const filter = status ? { status } : {}
    const list = await Feedback.find(filter)
      .populate('fromUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
    res.json(list)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/:id/status', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const { status } = req.body
    if (!['new', 'read', 'archived'].includes(status)) return res.status(400).json({ message: 'Invalid status' })
    const f = await Feedback.findByIdAndUpdate(req.params.id, { status }, { new: true })
    if (!f) return res.status(404).json({ message: 'Not found' })
    res.json(f)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
