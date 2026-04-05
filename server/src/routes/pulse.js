import { Router } from 'express'
import Pulse from '../models/Pulse.js'
import { auth, requireRole } from '../middleware/auth.js'

const router = Router()

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

router.get('/mine', auth, async (req, res) => {
  try {
    const today = startOfDay(new Date())
    const pulse = await Pulse.findOne({ user: req.userId, date: today })
    res.json(pulse || null)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    if (String(req.role || '').toLowerCase() === 'admin') {
      return res.status(403).json({ message: 'Admins cannot submit pulse responses' })
    }
    const { score, comment = '' } = req.body
    if (score == null || score < 1 || score > 5) {
      return res.status(400).json({ message: 'Score must be 1-5' })
    }
    const today = startOfDay(new Date())
    const pulse = await Pulse.findOneAndUpdate(
      { user: req.userId, date: today },
      { score: Number(score), comment: String(comment).trim() },
      { new: true, upsert: true }
    )
    res.json(pulse)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/analytics', auth, requireRole('admin'), async (req, res) => {
  try {
    const { days = 30 } = req.query
    const since = new Date()
    since.setDate(since.getDate() - Number(days))
    const pulses = await Pulse.aggregate([
      { $match: { date: { $gte: since } } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userDoc',
        },
      },
      {
        $lookup: {
          from: 'rbacusers',
          localField: 'user',
          foreignField: '_id',
          as: 'rbacUserDoc',
        },
      },
      {
        $addFields: {
          responderName: {
            $ifNull: [
              { $arrayElemAt: ['$userDoc.name', 0] },
              { $arrayElemAt: ['$rbacUserDoc.name', 0] },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$date',
          avg: { $avg: '$score' },
          count: { $sum: 1 },
          respondents: {
            $addToSet: { $ifNull: ['$responderName', 'Unknown user'] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ])
    const byScore = await Pulse.aggregate([
      { $match: { date: { $gte: since } } },
      { $group: { _id: '$score', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    res.json({ byDate: pulses, byScore })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
