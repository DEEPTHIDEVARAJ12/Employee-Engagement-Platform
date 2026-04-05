import { Router } from 'express'
import User from '../models/User.js'
import { auth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/profile', auth, async (req, res) => {
  try {
    const { name, department, jobTitle, avatar } = req.body
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (name != null) user.name = name.trim()
    if (department != null) user.department = department.trim()
    if (jobTitle != null) user.jobTitle = jobTitle.trim()
    if (avatar != null) user.avatar = avatar
    await user.save()
    const updated = await User.findById(user._id).select('-password')
    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/peers', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } })
      .select('name email')
      .sort({ name: 1 })
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (req.role === 'employee' && req.params.id !== req.userId) {
      return res.status(403).json({ message: 'Access denied' })
    }
    res.json(user)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
