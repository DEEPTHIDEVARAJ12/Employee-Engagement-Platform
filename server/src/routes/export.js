import { Router } from 'express'
import Survey from '../models/Survey.js'
import SurveyResponse from '../models/SurveyResponse.js'
import Recognition from '../models/Recognition.js'
import { auth, requireRole } from '../middleware/auth.js'

const router = Router()

function escapeCsv(s) {
  if (s == null) return ''
  const str = String(s)
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

router.get('/survey-responses/:id', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id)
    if (!survey) return res.status(404).json({ message: 'Survey not found' })
    const responses = await SurveyResponse.find({ survey: survey._id })
      .populate('submittedBy', 'name email')
      .sort({ submittedAt: 1 })
    const questions = survey.questions || []
    const headers = ['Submitted at', 'Submitted by', ...questions.map((q, i) => `Q${i + 1}: ${q.text}`)]
    const rows = responses.map((r) => {
      const submittedBy = r.submittedBy ? `${r.submittedBy.name} (${r.submittedBy.email})` : 'Anonymous'
      const answerCols = questions.map((_, i) => {
        const a = r.answers?.find((x) => x.questionId === i || x.questionId === String(i))
        return a?.value != null ? String(a.value) : ''
      })
      return [new Date(r.submittedAt).toISOString(), submittedBy, ...answerCols]
    })
    const csv = [headers.map(escapeCsv).join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="survey-${survey.title.slice(0, 30).replace(/[^a-z0-9]/gi, '-')}-responses.csv"`)
    res.send(csv)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/recognitions', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const recognitions = await Recognition.find()
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email')
      .sort({ createdAt: -1 })
    const headers = ['Date', 'From', 'To', 'Message', 'Category']
    const rows = recognitions.map((r) => [
      new Date(r.createdAt).toISOString(),
      r.fromUser?.name || '',
      r.toUser?.name || '',
      r.message || '',
      r.category || '',
    ])
    const csv = [headers.map(escapeCsv).join(','), ...rows.map((row) => row.map(escapeCsv).join(','))].join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="recognitions.csv"')
    res.send(csv)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
