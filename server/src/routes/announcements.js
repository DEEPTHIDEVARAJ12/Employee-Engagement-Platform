import { Router } from 'express'
import Announcement from '../models/Announcement.js'
import { auth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name')
      .sort({ pinned: -1, createdAt: -1 })
    res.json(announcements)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'name email')
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' })
    res.json(announcement)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', auth, requireRole('admin'), async (req, res) => {
  try {
    const { title, content, pinned = false } = req.body
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: 'Title and content required' })
    }
    const announcement = await Announcement.create({
      title: title.trim(),
      content: content.trim(),
      createdBy: req.userId,
      pinned: !!pinned,
    })
    const populated = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name email')
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const { title, content, pinned } = req.body
    const announcement = await Announcement.findById(req.params.id)
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' })
    if (title != null) announcement.title = title.trim()
    if (content != null) announcement.content = content.trim()
    if (pinned != null) announcement.pinned = !!pinned
    await announcement.save()
    const populated = await Announcement.findById(announcement._id)
      .populate('createdBy', 'name email')
    res.json(populated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id)
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' })
    res.json({ message: 'Announcement deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
