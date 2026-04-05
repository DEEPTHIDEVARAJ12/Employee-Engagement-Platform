import { Router } from 'express'
import Survey from '../models/Survey.js'
import SurveyResponse from '../models/SurveyResponse.js'
import { auth, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (req, res) => {
  try {
    if (req.role === 'admin' || req.role === 'hr') {
      const surveys = await Survey.find()
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
      return res.json(surveys)
    }
    const responses = await SurveyResponse.find({
      $or: [{ responderId: req.userId }, { submittedBy: req.userId }],
    }).select('survey')
    const answeredSurveyIds = responses.map((r) => r.survey)
    const surveys = await Survey.find({
      status: 'published',
      ...(answeredSurveyIds.length ? { _id: { $nin: answeredSurveyIds } } : {}),
    })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .select('title description questions anonymous createdAt')
    res.json(surveys)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/templates', auth, requireRole('admin', 'hr'), (req, res) => {
  const templates = [
    { id: 'engagement', name: 'Engagement pulse', description: 'Quick 5-question engagement check', questions: [
      { text: 'How satisfied are you with your role?', type: 'rating', required: true },
      { text: 'I have the resources I need to do my job well.', type: 'rating', required: true },
      { text: 'I feel valued at work.', type: 'rating', required: true },
      { text: 'My manager supports my development.', type: 'rating', required: true },
      { text: 'Any additional comments?', type: 'text', required: false },
    ]},
    { id: 'satisfaction', name: 'Job satisfaction', description: 'Rate your job satisfaction', questions: [
      { text: 'Overall job satisfaction (1-5)', type: 'rating', required: true },
      { text: 'Work-life balance', type: 'scale', required: true },
      { text: 'What would improve your experience?', type: 'text', required: false },
    ]},
    { id: 'feedback', name: 'Quick feedback', description: 'Short feedback form', questions: [
      { text: 'How are you feeling today? (1-5)', type: 'rating', required: true },
      { text: 'What went well this week?', type: 'text', required: false },
      { text: 'What could be improved?', type: 'text', required: false },
    ]},
  ]
  res.json(templates)
})

router.post('/from-template', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const { templateId, title } = req.body
    const templates = [
      { id: 'engagement', questions: [
        { text: 'How satisfied are you with your role?', type: 'rating', required: true },
        { text: 'I have the resources I need to do my job well.', type: 'rating', required: true },
        { text: 'I feel valued at work.', type: 'rating', required: true },
        { text: 'My manager supports my development.', type: 'rating', required: true },
        { text: 'Any additional comments?', type: 'text', required: false },
      ]},
      { id: 'satisfaction', questions: [
        { text: 'Overall job satisfaction (1-5)', type: 'rating', required: true },
        { text: 'Work-life balance', type: 'scale', required: true },
        { text: 'What would improve your experience?', type: 'text', required: false },
      ]},
      { id: 'feedback', questions: [
        { text: 'How are you feeling today? (1-5)', type: 'rating', required: true },
        { text: 'What went well this week?', type: 'text', required: false },
        { text: 'What could be improved?', type: 'text', required: false },
      ]},
    ]
    const t = templates.find((x) => x.id === templateId)
    if (!t) return res.status(400).json({ message: 'Invalid template' })
    const survey = await Survey.create({
      title: title || t.id,
      description: '',
      questions: t.questions,
      createdBy: req.userId,
      anonymous: true,
    })
    const populated = await Survey.findById(survey._id).populate('createdBy', 'name email')
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id).populate('createdBy', 'name email')
    if (!survey) return res.status(404).json({ message: 'Survey not found' })
    if ((req.role === 'employee' && survey.status !== 'published')) {
      return res.status(403).json({ message: 'Survey not available' })
    }
    if (req.role === 'employee') {
      const existing = await SurveyResponse.findOne({
        survey: survey._id,
        $or: [{ responderId: req.userId }, { submittedBy: req.userId }],
      })
      if (existing) return res.status(400).json({ message: 'Already submitted', submitted: true })
    }
    res.json(survey)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const { title, description, questions, anonymous = true } = req.body
    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Title and at least one question required' })
    }
    const survey = await Survey.create({
      title,
      description: description || '',
      questions: questions.map((q) => ({
        text: q.text,
        type: q.type || 'text',
        options: q.options || [],
        required: q.required !== false,
      })),
      createdBy: req.userId,
      anonymous,
    })
    const populated = await Survey.findById(survey._id).populate('createdBy', 'name email')
    res.status(201).json(populated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/:id', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const { title, description, questions, status, anonymous } = req.body
    const survey = await Survey.findById(req.params.id)
    if (!survey) return res.status(404).json({ message: 'Survey not found' })
    if (title != null) survey.title = title
    if (description != null) survey.description = description
    if (Array.isArray(questions)) survey.questions = questions.map((q) => ({
      text: q.text,
      type: q.type || 'text',
      options: q.options || [],
      required: q.required !== false,
    }))
    if (status != null) survey.status = status
    if (anonymous != null) survey.anonymous = anonymous
    await survey.save()
    const populated = await Survey.findById(survey._id).populate('createdBy', 'name email')
    res.json(populated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/:id', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id)
    if (!survey) return res.status(404).json({ message: 'Survey not found' })
    await SurveyResponse.deleteMany({ survey: survey._id })
    res.json({ message: 'Survey deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id/analytics', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id)
    if (!survey) return res.status(404).json({ message: 'Survey not found' })
    const responses = await SurveyResponse.find({ survey: survey._id })
    const questions = survey.questions || []
    const analytics = questions.map((q, qIdx) => {
      const values = responses.map((r) => {
        const a = r.answers?.find((x) => x.questionId === qIdx || x.questionId === String(qIdx))
        return a?.value
      }).filter((v) => v != null && v !== '')
      if (q.type === 'rating' || q.type === 'scale') {
        const nums = values.map(Number).filter((n) => !Number.isNaN(n))
        const avg = nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0
        const distribution = {}
        nums.forEach((n) => { distribution[n] = (distribution[n] || 0) + 1 })
        return { questionIndex: qIdx, questionText: q.text, type: q.type, responseCount: values.length, average: Math.round(avg * 100) / 100, distribution }
      }
      return { questionIndex: qIdx, questionText: q.text, type: q.type, responseCount: values.length }
    })
    res.json({ surveyTitle: survey.title, totalResponses: responses.length, questions: analytics })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id/responses', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const responses = await SurveyResponse.find({ survey: req.params.id })
      .populate('submittedBy', 'name email')
      .sort({ submittedAt: -1 })
    res.json(responses)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/:id/responses', auth, async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id)
    if (!survey) return res.status(404).json({ message: 'Survey not found' })
    if (survey.status !== 'published') return res.status(400).json({ message: 'Survey is not open for responses' })
    const existing = await SurveyResponse.findOne({
      survey: survey._id,
      $or: [{ responderId: req.userId }, { submittedBy: req.userId }],
    })
    if (existing) return res.status(400).json({ message: 'Already submitted' })
    const { answers } = req.body
    if (!Array.isArray(answers)) return res.status(400).json({ message: 'Answers array required' })
    const response = await SurveyResponse.create({
      survey: survey._id,
      answers,
      responderId: req.userId,
      submittedBy: survey.anonymous ? null : req.userId,
    })
    res.status(201).json(response)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
