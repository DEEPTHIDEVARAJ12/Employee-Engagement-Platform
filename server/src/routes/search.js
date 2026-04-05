import { Router } from 'express'
import Survey from '../models/Survey.js'
import Announcement from '../models/Announcement.js'
import User from '../models/User.js'
import { auth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    const { q = '', type = 'all' } = req.query
    const query = String(q).trim()
    if (!query) return res.json({ surveys: [], announcements: [], users: [] })

    const searchRegex = new RegExp(query, 'i')
    const results = { surveys: [], announcements: [], users: [] }

    if (type === 'all' || type === 'surveys') {
      results.surveys = await Survey.find({
        $or: [{ title: searchRegex }, { description: searchRegex }],
      })
        .select('title status createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
    }
    if (type === 'all' || type === 'announcements') {
      results.announcements = await Announcement.find({
        $or: [{ title: searchRegex }, { content: searchRegex }],
      })
        .select('title createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
    }
    if (type === 'all' || type === 'users') {
      const canSearchUsers = req.role === 'admin' || req.role === 'hr'
      if (canSearchUsers) {
        results.users = await User.find({
          $or: [{ name: searchRegex }, { email: searchRegex }, { department: searchRegex }],
        })
          .select('name email department role')
          .limit(10)
      }
    }

    res.json(results)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
