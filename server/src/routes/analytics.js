import { Router } from 'express'
import Survey from '../models/Survey.js'
import SurveyResponse from '../models/SurveyResponse.js'
import Recognition from '../models/Recognition.js'
import Announcement from '../models/Announcement.js'
import RBACUser from '../models/RBACUser.js'
import { auth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const userCollection = RBACUser.collection.name
    const [userCount, surveyCount, responseCount, recognitionCount, announcementCount] = await Promise.all([
      RBACUser.countDocuments(),
      Survey.countDocuments(),
      SurveyResponse.countDocuments(),
      Recognition.countDocuments(),
      Announcement.countDocuments(),
    ])
    const publishedSurveys = await Survey.countDocuments({ status: 'published' })
    const draftSurveys = await Survey.countDocuments({ status: 'draft' })
    const employees = await RBACUser.countDocuments({ role: /^employee$/i })
    const [respondersById, respondersByUser] = await Promise.all([
      SurveyResponse.distinct('responderId').then((ids) => ids.filter(Boolean).map((id) => String(id))),
      SurveyResponse.distinct('submittedBy').then((ids) => ids.filter(Boolean).map((id) => String(id))),
    ])
    const uniqueResponders = new Set([...respondersById, ...respondersByUser]).size
    const participationRate = employees > 0 ? Math.round((uniqueResponders / employees) * 100) : 0
    const recognitionsByMonth = await Recognition.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    const surveyResponsesByMonth = await SurveyResponse.aggregate([
      { $match: { submittedAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } } },
      { $group: { _id: { year: { $year: '$submittedAt' }, month: { $month: '$submittedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    const topRecognized = await Recognition.aggregate([
      { $group: { _id: '$toUser', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: userCollection, localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', email: '$user.email', count: 1, _id: 0 } },
    ])
    res.json({
      overview: {
        totalUsers: userCount,
        totalSurveys: surveyCount,
        publishedSurveys,
        draftSurveys,
        totalResponses: responseCount,
        totalRecognitions: recognitionCount,
        totalAnnouncements: announcementCount,
        employeeCount: employees,
        participationRate,
      },
      recognitionsByMonth,
      surveyResponsesByMonth,
      topRecognized,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
