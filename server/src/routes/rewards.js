import { Router } from 'express'
import RewardConfig from '../models/RewardConfig.js'
import { auth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const rewards = await RewardConfig.find({ active: true }).sort({ name: 1 })
    res.json(rewards)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/admin', auth, requireRole('admin'), async (req, res) => {
  try {
    const rewards = await RewardConfig.find().sort({ name: 1 })
    res.json(rewards)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, icon = '🏆', points = 0 } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Name required' })
    const reward = await RewardConfig.create({
      name: name.trim(),
      description: description || '',
      icon: icon || '🏆',
      points: Number(points) || 0,
    })
    res.status(201).json(reward)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { name, description, icon, points, active } = req.body
    const reward = await RewardConfig.findById(req.params.id)
    if (!reward) return res.status(404).json({ message: 'Reward not found' })
    if (name != null) reward.name = name.trim()
    if (description != null) reward.description = description
    if (icon != null) reward.icon = icon
    if (points != null) reward.points = Number(points)
    if (active != null) reward.active = !!active
    await reward.save()
    res.json(reward)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const reward = await RewardConfig.findByIdAndDelete(req.params.id)
    if (!reward) return res.status(404).json({ message: 'Reward not found' })
    res.json({ message: 'Reward deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
