import { Router } from 'express'
import Notification from '../models/Notification.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const { limit = 20 } = req.query
    const list = await Notification.find({ user: req.userId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
    res.json(list)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ user: req.userId, read: false })
    res.json({ count })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/:id/read', auth, async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { read: true },
      { new: true }
    )
    if (!n) return res.status(404).json({ message: 'Not found' })
    res.json(n)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.userId }, { read: true })
    res.json({ message: 'OK' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
