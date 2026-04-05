import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import * as api from '../api'
import './DashboardHome.css'

const ROLE_LABELS = { admin: 'Admin', hr: 'HR Manager', employee: 'Employee' }

export default function DashboardHome() {
  const { user, isAdmin, isHR, isEmployee } = useAuth()
  const [summary, setSummary] = useState(null)
  const roleLabel = ROLE_LABELS[user?.role] || 'User'

  useEffect(() => {
    api.dashboard.summary().then(setSummary).catch(() => setSummary(null))
  }, [])

  const quickLinks = [
    { to: '/dashboard/surveys', label: 'Surveys', icon: '📋' },
    { to: '/dashboard/recognitions', label: 'Recognition', icon: '🏆' },
    { to: '/dashboard/leaderboard', label: 'Leaderboard', icon: '🥇' },
    { to: '/dashboard/announcements', label: 'Announcements', icon: '📢' },
    { to: '/dashboard/events', label: 'Events', icon: '📅' },
    { to: '/dashboard/profile', label: 'My profile', icon: '👤' },
    { to: '/dashboard/pulse', label: 'Pulse', icon: '💚' },
    { to: '/dashboard/feedback', label: 'Feedback', icon: '💬' },
  ]
  if (isAdmin || isHR) quickLinks.push({ to: '/dashboard/analytics', label: 'Analytics', icon: '📈' })
  if (isAdmin) quickLinks.push({ to: '/dashboard/users', label: 'Employees', icon: '👥' })
  if (isAdmin || isHR) quickLinks.push({ to: '/dashboard/feedback-inbox', label: 'Feedback inbox', icon: '📥' })
  if (isAdmin) quickLinks.push({ to: '/dashboard/rewards', label: 'Reward config', icon: '⚙️' })

  return (
    <motion.div
      className="dashboard-home"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h1>Welcome back, {user?.name?.split(' ')[0]}.</h1>
      <p className="dashboard-home__sub">You're signed in as <strong>{roleLabel}</strong>.</p>

      {summary && (
        <div className="dashboard-home__widgets">
          {isEmployee && summary.pendingSurveys?.length > 0 && (
            <div className="widget card">
              <h3>📋 Pending surveys</h3>
              <ul>
                {summary.pendingSurveys.map((s) => (
                  <li key={s._id}>
                    <Link to={`/dashboard/surveys/${s._id}/take`}>{s.title}</Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {summary.latestAnnouncement && (
            <div className="widget card">
              <h3>📢 Latest announcement</h3>
              <Link to={`/dashboard/announcements/${summary.latestAnnouncement._id}`}>
                <strong>{summary.latestAnnouncement.title}</strong>
              </Link>
              <p className="widget__preview">{summary.latestAnnouncement.content?.slice(0, 100)}…</p>
            </div>
          )}
          {summary.recentRecognition && (
            <div className="widget card">
              <h3>🏆 Recent recognition</h3>
              <p className="widget__quote">"{summary.recentRecognition.message}"</p>
              <span>— {summary.recentRecognition.fromUser?.name}</span>
            </div>
          )}
          <div className="widget card widget--stat">
            <span className="widget__value">{summary.recognitionsReceivedCount ?? 0}</span>
            <span className="widget__label">Recognitions received</span>
          </div>
        </div>
      )}

      <h2 className="dashboard-home__section">Quick links</h2>
      <div className="dashboard-home__grid">
        {quickLinks.map((link, i) => (
          <motion.div
            key={link.to}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Link to={link.to} className="dashboard-home__card">
              <span className="dashboard-home__card-icon">{link.icon}</span>
              <span className="dashboard-home__card-label">{link.label}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
