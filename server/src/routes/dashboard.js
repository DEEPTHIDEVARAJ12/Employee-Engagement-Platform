import { Router } from 'express'
import Survey from '../models/Survey.js'
import SurveyResponse from '../models/SurveyResponse.js'
import Recognition from '../models/Recognition.js'
import Announcement from '../models/Announcement.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/summary', auth, async (req, res) => {
  try {
    const published = await Survey.find({ status: 'published' }).select('_id title').sort({ createdAt: -1 }).limit(5)
    const latestAnnouncement = await Announcement.findOne().sort({ pinned: -1, createdAt: -1 }).populate('createdBy', 'name').select('title content createdAt createdBy')
    let pending = []
    if (req.role === 'employee') {
      const responses = await SurveyResponse.find({
        $or: [{ responderId: req.userId }, { submittedBy: req.userId }],
      }).select('survey')
      const answeredSurveyIds = responses.map((r) => r.survey)
      pending = published.filter((s) => !answeredSurveyIds.some((id) => String(id) === String(s._id)))
    }
    const recentRecognition = await Recognition.findOne({ toUser: req.userId })
      .populate('fromUser', 'name')
      .sort({ createdAt: -1 })
      .select('message fromUser createdAt')
    res.json({
      publishedSurveys: published,
      pendingSurveys: pending.slice(0, 5),
      latestAnnouncement,
      recognitionsReceivedCount: await Recognition.countDocuments({ toUser: req.userId }),
      recentRecognition: recentRecognition || null,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
