import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as api from '../api'
import './SurveyResponses.css'

export default function SurveyResponses() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [survey, setSurvey] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.surveys.get(id), api.surveys.getResponses(id)])
      .then(([s, r]) => {
        setSurvey(s)
        setResponses(r)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="page-loading">Loading responses…</div>
  if (error) return <div className="page-error">{error}</div>
  if (!survey) return null

  const questions = survey.questions || []

  return (
    <motion.div
      className="survey-responses-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <h1>Responses: {survey.title}</h1>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard/surveys')}>
          Back to surveys
        </button>
      </div>

      <p className="survey-responses__count">{responses.length} response(s)</p>

      {responses.length === 0 ? (
        <div className="empty-state">No responses yet.</div>
      ) : (
        <div className="responses-list">
          {responses.map((r, idx) => (
            <motion.div
              key={r._id}
              className="response-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <div className="response-card__meta">
                #{idx + 1}
                {r.submittedBy ? (
                  <span>{r.submittedBy?.name || r.submittedBy?.email}</span>
                ) : (
                  <span className="response-card__anon">Anonymous</span>
                )}
                <span className="response-card__date">
                  {new Date(r.submittedAt).toLocaleString()}
                </span>
              </div>
              <div className="response-card__answers">
                {r.answers?.map((a, i) => {
                  const q = questions[a.questionId]
                  return (
                    <div key={i} className="response-answer">
                      <strong>{q?.text ?? `Q${a.questionId + 1}`}</strong>
                      <span>{typeof a.value === 'object' ? JSON.stringify(a.value) : String(a.value)}</span>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
