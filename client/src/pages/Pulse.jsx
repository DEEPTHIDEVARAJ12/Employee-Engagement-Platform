import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import * as api from '../api'
import './Pulse.css'

export default function Pulse() {
  const { isAdmin } = useAuth()
  const [mine, setMine] = useState(null)
  const [score, setScore] = useState(null)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [analytics, setAnalytics] = useState(null)

  useEffect(() => {
    if (!isAdmin) {
      api.pulse.getMine().then(setMine).catch(() => setMine(null))
      return
    }
    setMine(null)
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin) api.pulse.getAnalytics(30).then(setAnalytics).catch(() => setAnalytics(null))
  }, [isAdmin])

  async function handleSubmit(e) {
    e.preventDefault()
    if (score == null) return
    setSaving(true)
    try {
      const p = await api.pulse.submit({ score, comment })
      setMine(p)
    } finally {
      setSaving(false)
    }
  }

  const trendData = (analytics?.byDate || []).slice(-6)
  const chartWidth = 700
  const chartHeight = 360
  const leftPad = 22
  const rightPad = 22
  const topPad = 26
  const bottomPad = 42
  const plotWidth = chartWidth - leftPad - rightPad
  const plotHeight = chartHeight - topPad - bottomPad
  const hasTrend = trendData.length > 0
  const points = trendData.map((d, idx) => {
    const x = trendData.length === 1
      ? leftPad + (plotWidth / 2)
      : leftPad + (idx / (trendData.length - 1)) * plotWidth
    const y = topPad + ((5 - Number(d.avg || 0)) / 4) * plotHeight
    return {
      x,
      y,
      label: d._id,
      avg: Number(d.avg || 0),
      count: Number(d.count || 0),
      respondents: Array.isArray(d.respondents) ? d.respondents : [],
    }
  })
  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')
  const sprintLabels = points.map((_, idx) => `Sprint ${idx + 1}`)

  return (
    <motion.div className="pulse-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1>How are you today?</h1>
      <p className="pulse-page__sub">Share your pulse (1-5). One submission per day.</p>
      {isAdmin ? (
        <div className="card pulse-page__done">
          <p>Admins can view pulse analytics, but cannot submit daily pulse responses.</p>
        </div>
      ) : mine ? (
        <div className="card pulse-page__done">
          <p>You already submitted today: <strong>{mine.score}/5</strong></p>
          {mine.comment && <p className="pulse-page__comment">{mine.comment}</p>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card pulse-page__form">
          <label className="pulse-page__label">Score (1 = low, 5 = great)</label>
          <div className="pulse-page__radios">
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="pulse-page__radio">
                <input type="radio" name="score" value={n} checked={score === n} onChange={() => setScore(n)} />
                <span>{n}</span>
              </label>
            ))}
          </div>
          <label className="form-label">Optional comment</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} className="form-input form-textarea" rows={2} placeholder="Anything to add?" />
          <button type="submit" className="btn btn-primary" disabled={saving || score == null}>
            {saving ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      )}
      {isAdmin && analytics && (
        <div className="pulse-page__analytics">
          {!hasTrend ? (
            <p className="chart-empty">No pulse data yet</p>
          ) : (
            <section className="happiness-graph" aria-label="The happiness graph">
              <h2 className="happiness-graph__title">The Happiness Graph</h2>
              <div className="happiness-graph__body">
                <div className="happiness-graph__levels">
                  {['\u{1F604}', '\u{1F642}', '\u{1F610}', '\u{1F641}', '\u{1F620}'].map((face) => (
                    <span key={face} className="happiness-graph__emoji">{face}</span>
                  ))}
                </div>
                <div className="happiness-graph__canvas-wrap">
                  <svg className="happiness-graph__canvas" viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Happiness trend line">
                    {[0, 1, 2, 3, 4].map((n) => {
                      const y = topPad + (n / 4) * plotHeight
                      return (
                        <line
                          key={n}
                          x1={leftPad}
                          x2={chartWidth - rightPad}
                          y1={y}
                          y2={y}
                          className="happiness-graph__grid"
                        />
                      )
                    })}
                    <polyline points={polylinePoints} className="happiness-graph__line" />
                    {points.map((p) => (
                      <circle key={p.label} cx={p.x} cy={p.y} r="6" className="happiness-graph__dot">
                        <title>{`${new Date(p.label).toLocaleDateString('en', { month: 'short', day: 'numeric' })}: ${p.avg.toFixed(1)} avg (${p.count} responses)`}</title>
                      </circle>
                    ))}
                  </svg>
                  <div className="happiness-graph__labels">
                    {sprintLabels.map((label, idx) => (
                      <span key={`${label}-${idx}`}>{label}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="happiness-graph__responses">
                <h3 className="happiness-graph__responses-title">Who responded</h3>
                <div className="happiness-graph__responses-list">
                  {points.map((p, idx) => (
                    <div key={`${p.label}-responses`} className="happiness-graph__responses-item">
                      <strong>{sprintLabels[idx]}:</strong> {p.respondents.length ? p.respondents.join(', ') : 'No names available'}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </motion.div>
  )
}
