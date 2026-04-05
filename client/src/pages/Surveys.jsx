import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import * as api from '../api'
import './Surveys.css'

export default function Surveys() {
  const { isAdmin, isHR } = useAuth()
  const location = useLocation()
  const canManage = isAdmin || isHR
  const [surveys, setSurveys] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [templates, setTemplates] = useState([])
  const [templateOpen, setTemplateOpen] = useState(false)
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false)
  const navigate = useNavigate()
  const justSubmitted = location.state?.submitted

  useEffect(() => {
    if (canManage) api.surveys.getTemplates().then(setTemplates).catch(() => setTemplates([]))
  }, [canManage])

  useEffect(() => {
    api.surveys
      .list()
      .then(setSurveys)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    if (!confirm('Delete this survey and all responses?')) return
    try {
      await api.surveys.delete(id)
      setSurveys((s) => s.filter((x) => x._id !== id))
    } catch (e) {
      setError(e.message)
    }
  }

  async function createFromTemplate(templateId, title) {
    setTemplateOpen(false)
    setCreatingFromTemplate(true)
    try {
      const s = await api.surveys.createFromTemplate(templateId, title)
      setSurveys((prev) => [s, ...prev])
      navigate(`/dashboard/surveys/${s._id}/edit`)
    } catch (e) {
      setError(e.message)
    } finally {
      setCreatingFromTemplate(false)
    }
  }

  function handleExportSurvey(id) {
    api.exportApi.surveyResponses(id).catch(() => setError('Export failed'))
  }

  if (loading) return <div className="page-loading">Loading surveys…</div>
  if (error) return <div className="page-error">{error}</div>

  return (
    <motion.div
      className="surveys-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <h1>Surveys</h1>
        {canManage && (
          <div className="surveys-page__actions">
            <div className="surveys-page__create">
              <button type="button" className="btn btn-secondary" onClick={() => setTemplateOpen(!templateOpen)} disabled={creatingFromTemplate}>
                {creatingFromTemplate ? 'Creating…' : 'From template'}
              </button>
              {templateOpen && (
                <div className="surveys-page__template-dropdown">
                  {templates.map((t) => (
                    <button key={t.id} type="button" onClick={() => createFromTemplate(t.id, t.name)}>{t.name}</button>
                  ))}
                </div>
              )}
            </div>
            <Link to="/dashboard/surveys/new" className="btn btn-primary">Create survey</Link>
          </div>
        )}
      </div>
      {justSubmitted && (
        <p className="surveys-submitted-msg">Thank you for submitting the survey.</p>
      )}

      {surveys.length === 0 ? (
        <div className="empty-state">
          <p>No surveys yet.</p>
          {canManage && (
            <Link to="/dashboard/surveys/new" className="btn btn-primary">
              Create the first survey
            </Link>
          )}
        </div>
      ) : (
        <ul className="surveys-list">
          {surveys.map((s) => (
            <motion.li
              key={s._id}
              className="survey-card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="survey-card__main">
                <h3>{s.title}</h3>
                {s.description && <p className="survey-card__desc">{s.description}</p>}
                <div className="survey-card__meta">
                  <span className={`survey-card__status survey-card__status--${s.status}`}>
                    {s.status}
                  </span>
                  {s.questions?.length > 0 && (
                    <span>{s.questions.length} question{s.questions.length !== 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
              <div className="survey-card__actions">
                {canManage && s.status === 'published' && (
                  <>
                    <Link to={`/dashboard/surveys/${s._id}/responses`} className="btn btn-ghost">Responses</Link>
                    <Link to={`/dashboard/surveys/${s._id}/analytics`} className="btn btn-ghost">Analytics</Link>
                    <button type="button" className="btn btn-ghost" onClick={() => handleExportSurvey(s._id)}>Export CSV</button>
                  </>
                )}
                {canManage && (
                  <>
                    <Link to={`/dashboard/surveys/${s._id}/edit`} className="btn btn-ghost">Edit</Link>
                    <button type="button" className="btn btn-ghost btn-danger" onClick={() => handleDelete(s._id)}>Delete</button>
                  </>
                )}
                {!canManage && s.status === 'published' && (
                  <Link to={`/dashboard/surveys/${s._id}/take`} className="btn btn-primary">
                    Take survey
                  </Link>
                )}
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
