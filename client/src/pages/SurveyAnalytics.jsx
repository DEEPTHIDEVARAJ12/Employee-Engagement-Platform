import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as api from '../api'
import './SurveyAnalytics.css'

export default function SurveyAnalytics() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.surveys.getAnalytics(id).then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="page-loading">Loading analytics…</div>
  if (error) return <div className="page-error">{error}</div>
  if (!data) return null

  return (
    <motion.div className="survey-analytics-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <h1>Survey analytics: {data.surveyTitle}</h1>
        <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard/surveys')}>Back to surveys</button>
      </div>
      <p className="survey-analytics-page__total">{data.totalResponses} response(s)</p>
      <div className="survey-analytics-page__questions">
        {data.questions?.map((q, i) => (
          <div key={i} className="card survey-analytics-q">
            <h3>Q{i + 1}: {q.questionText}</h3>
            <p className="survey-analytics-q__meta">{q.responseCount} responses</p>
            {q.average != null && <p className="survey-analytics-q__avg">Average: <strong>{q.average}</strong></p>}
            {q.distribution && Object.keys(q.distribution).length > 0 && (
              <div className="survey-analytics-q__dist">
                {Object.entries(q.distribution).map(([val, count]) => (
                  <div key={val} className="survey-analytics-q__bar-wrap">
                    <span>{val}</span>
                    <div className="survey-analytics-q__bar-bg"><div className="survey-analytics-q__bar" style={{ width: `${(count / data.totalResponses) * 100}%` }} /></div>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}
