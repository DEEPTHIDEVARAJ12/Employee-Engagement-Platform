import { Router } from 'express'
import Comment from '../models/Comment.js'
import Announcement from '../models/Announcement.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/announcement/:announcementId', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ announcement: req.params.announcementId })
      .populate('user', 'name')
      .sort({ createdAt: 1 })
    res.json(comments)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/announcement/:announcementId', auth, async (req, res) => {
  try {
    const { text } = req.body
    if (!text?.trim()) return res.status(400).json({ message: 'Text required' })
    const ann = await Announcement.findById(req.params.announcementId)
    if (!ann) return res.status(404).json({ message: 'Announcement not found' })
    const comment = await Comment.create({
      announcement: ann._id,
      user: req.userId,
      text: text.trim(),
    })
    const populated = await Comment.findById(comment._id).populate('user', 'name')
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id, user: req.userId })
    if (!comment) return res.status(404).json({ message: 'Not found' })
    await comment.deleteOne()
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
