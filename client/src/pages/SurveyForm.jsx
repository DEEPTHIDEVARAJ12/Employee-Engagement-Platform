import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as api from '../api'
import './SurveyForm.css'

const QUESTION_TYPES = [
  { value: 'text', label: 'Short text' },
  { value: 'rating', label: 'Rating (1-5)' },
  { value: 'scale', label: 'Scale (1-10)' },
  { value: 'choice', label: 'Single choice' },
]

export default function SurveyForm() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [questions, setQuestions] = useState([
    { text: '', type: 'text', options: [], required: true },
  ])

  useEffect(() => {
    if (!isEdit) return
    api.surveys
      .get(id)
      .then((s) => {
        setTitle(s.title)
        setDescription(s.description || '')
        setAnonymous(s.anonymous !== false)
        setQuestions(
          s.questions?.length
            ? s.questions.map((q) => ({
                text: q.text,
                type: q.type || 'text',
                options: q.options || [],
                required: q.required !== false,
              }))
            : [{ text: '', type: 'text', options: [], required: true }]
        )
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  function addQuestion() {
    setQuestions((q) => [...q, { text: '', type: 'text', options: [], required: true }])
  }

  function updateQuestion(i, field, value) {
    setQuestions((q) => {
      const next = [...q]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  function removeQuestion(i) {
    if (questions.length <= 1) return
    setQuestions((q) => q.filter((_, j) => j !== i))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = {
      title: title.trim(),
      description: description.trim(),
      anonymous,
      questions: questions
        .filter((q) => q.text.trim())
        .map((q) => ({
          text: q.text.trim(),
          type: q.type,
          options: q.options.filter(Boolean),
          required: q.required,
        })),
    }
    if (payload.questions.length === 0) {
      setError('Add at least one question with text.')
      setSaving(false)
      return
    }
    try {
      if (isEdit) {
        await api.surveys.update(id, payload)
      } else {
        await api.surveys.create(payload)
      }
      navigate('/dashboard/surveys')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handlePublish() {
    api.surveys
      .update(id, { status: 'published' })
      .then(() => navigate('/dashboard/surveys'))
      .catch((e) => setError(e.message))
  }

  if (loading) return <div className="page-loading">Loading…</div>

  return (
    <motion.div
      className="survey-form-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <h1>{isEdit ? 'Edit survey' : 'Create survey'}</h1>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard/surveys')}>
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="survey-form">
        {error && <div className="form-error">{error}</div>}
        <label className="form-label">
          Title
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Survey title"
            required
            className="form-input"
          />
        </label>
        <label className="form-label">
          Description (optional)
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
            rows={2}
            className="form-input form-textarea"
          />
        </label>
        <label className="form-check">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
          />
          Anonymous responses
        </label>

        <h3 className="survey-form__questions-title">Questions</h3>
        {questions.map((q, i) => (
          <div key={i} className="question-block">
            <div className="question-block__row">
              <input
                type="text"
                value={q.text}
                onChange={(e) => updateQuestion(i, 'text', e.target.value)}
                placeholder="Question text"
                className="form-input question-input"
              />
              <select
                value={q.type}
                onChange={(e) => updateQuestion(i, 'type', e.target.value)}
                className="form-select question-type"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <label className="form-check-inline">
                <input
                  type="checkbox"
                  checked={q.required}
                  onChange={(e) => updateQuestion(i, 'required', e.target.checked)}
                />
                Required
              </label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeQuestion(i)}>
                Remove
              </button>
            </div>
            {q.type === 'choice' && (
              <div className="question-options">
                <span className="question-options-label">Options (one per line):</span>
                <textarea
                  value={(q.options || []).join('\n')}
                  onChange={(e) =>
                    updateQuestion(
                      i,
                      'options',
                      e.target.value.split('\n').map((s) => s.trim()).filter(Boolean)
                    )
                  }
                  placeholder="Option A\nOption B"
                  rows={3}
                  className="form-input form-textarea"
                />
              </div>
            )}
          </div>
        ))}
        <button type="button" className="btn btn-ghost" onClick={addQuestion}>
          + Add question
        </button>

        <div className="survey-form__actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create survey'}
          </button>
          {isEdit && (
            <button type="button" className="btn btn-secondary" onClick={handlePublish}>
              Save & publish
            </button>
          )}
        </div>
      </form>
    </motion.div>
  )
}
