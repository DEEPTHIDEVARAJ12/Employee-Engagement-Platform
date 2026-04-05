import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import * as api from '../api'
import './Analytics.css'

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.analytics
      .get()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loading">Loading analytics…</div>
  if (error) return <div className="page-error">{error}</div>
  if (!data) return null

  const { overview, recognitionsByMonth, surveyResponsesByMonth, topRecognized } = data
  const maxRec = Math.max(1, ...recognitionsByMonth.map((x) => x.count))
  const maxResp = Math.max(1, ...surveyResponsesByMonth.map((x) => x.count))

  return (
    <motion.div className="analytics-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <h1>Engagement analytics</h1>
      </div>

      <div className="analytics-overview">
        <div className="stat-card">
          <span className="stat-card__value">{overview.totalUsers}</span>
          <span className="stat-card__label">Total users</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{overview.employeeCount}</span>
          <span className="stat-card__label">Employees</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{overview.totalSurveys}</span>
          <span className="stat-card__label">Surveys</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{overview.publishedSurveys}</span>
          <span className="stat-card__label">Published</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{overview.totalResponses}</span>
          <span className="stat-card__label">Survey responses</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{overview.participationRate}%</span>
          <span className="stat-card__label">Participation rate</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{overview.totalRecognitions}</span>
          <span className="stat-card__label">Recognitions</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{overview.totalAnnouncements}</span>
          <span className="stat-card__label">Announcements</span>
        </div>
      </div>

      <div className="analytics-charts">
        <div className="chart-card card">
          <h3>Recognitions (last 6 months)</h3>
          <div className="chart-bars">
            {recognitionsByMonth.length === 0 ? (
              <p className="chart-empty">No data yet</p>
            ) : (
              recognitionsByMonth.map((d) => (
                <div key={`${d._id.year}-${d._id.month}`} className="chart-bar-row">
                  <span className="chart-bar-label">{d._id.month}/{d._id.year}</span>
                  <div className="chart-bar-wrap">
                    <motion.div
                      className="chart-bar"
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.count / maxRec) * 100}%` }}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="chart-bar-value">{d.count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="chart-card card">
          <h3>Survey responses (last 6 months)</h3>
          <div className="chart-bars">
            {surveyResponsesByMonth.length === 0 ? (
              <p className="chart-empty">No data yet</p>
            ) : (
              surveyResponsesByMonth.map((d) => (
                <div key={`${d._id.year}-${d._id.month}`} className="chart-bar-row">
                  <span className="chart-bar-label">{d._id.month}/{d._id.year}</span>
                  <div className="chart-bar-wrap">
                    <motion.div
                      className="chart-bar chart-bar--accent"
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.count / maxResp) * 100}%` }}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="chart-bar-value">{d.count}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="chart-card card">
        <h3>Top recognized employees</h3>
        {topRecognized.length === 0 ? (
          <p className="chart-empty">No recognitions yet</p>
        ) : (
          <ul className="top-list">
            {topRecognized.map((t, i) => (
              <li key={i} className="top-list__item">
                <span className="top-list__rank">{i + 1}</span>
                <span className="top-list__name">{t.name}</span>
                <span className="top-list__count">{t.count} recognition{t.count !== 1 ? 's' : ''}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  )
}
