import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as api from '../api'
import './SurveyTake.css'

export default function SurveyTake() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [survey, setSurvey] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState({})

  useEffect(() => {
    api.surveys
      .get(id)
      .then(setSurvey)
      .catch((e) => {
        if (e.message.includes('Already submitted')) navigate('/dashboard/surveys')
        else setError(e.message)
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  function setAnswer(qIndex, value) {
    setAnswers((a) => ({ ...a, [qIndex]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const questions = survey?.questions || []
    const required = questions.filter((q, i) => q.required)
    for (const q of required) {
      const i = questions.indexOf(q)
      if (answers[i] === undefined || answers[i] === '' || (Array.isArray(answers[i]) && !answers[i].length)) {
        setError(`Please answer: ${q.text}`)
        return
      }
    }
    setError('')
    setSubmitting(true)
    const answerArray = questions.map((q, i) => ({
      questionId: i,
      value: answers[i] ?? '',
    }))
    try {
      await api.surveys.submitResponse(id, answerArray)
      navigate('/dashboard/surveys', { state: { submitted: true } })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="page-loading">Loading survey…</div>
  if (error && !survey) return <div className="page-error">{error}</div>
  if (!survey) return null

  return (
    <motion.div
      className="survey-take-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <h1>{survey.title}</h1>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard/surveys')}>
          Back to surveys
        </button>
      </div>
      {survey.description && <p className="survey-take__desc">{survey.description}</p>}
      {survey.anonymous && <p className="survey-take__anon">This survey is anonymous.</p>}

      <form onSubmit={handleSubmit} className="survey-take-form">
        {error && <div className="form-error">{error}</div>}
        {(survey.questions || []).map((q, i) => (
          <div key={i} className="survey-take__q">
            <label className="survey-take__q-label">
              {q.text}
              {q.required && <span className="required">*</span>}
            </label>
            {q.type === 'text' && (
              <input
                type="text"
                value={answers[i] ?? ''}
                onChange={(e) => setAnswer(i, e.target.value)}
                className="form-input"
                placeholder="Your answer"
              />
            )}
            {q.type === 'rating' && (
              <div className="survey-take__rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="survey-take__rating-opt">
                    <input
                      type="radio"
                      name={`q-${i}`}
                      checked={answers[i] === n}
                      onChange={() => setAnswer(i, n)}
                    />
                    <span>{n}</span>
                  </label>
                ))}
              </div>
            )}
            {q.type === 'scale' && (
              <div className="survey-take__scale">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={answers[i] ?? 5}
                  onChange={(e) => setAnswer(i, Number(e.target.value))}
                />
                <span>{answers[i] ?? 5}</span>
              </div>
            )}
            {q.type === 'choice' && (
              <div className="survey-take__choice">
                {(q.options || []).map((opt, j) => (
                  <label key={j} className="survey-take__choice-opt">
                    <input
                      type="radio"
                      name={`q-${i}`}
                      value={opt}
                      checked={answers[i] === opt}
                      onChange={() => setAnswer(i, opt)}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
        <div className="survey-take__actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard/surveys')}>
            Cancel
          </button>
        </div>
      </form>
    </motion.div>
  )
}
