import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import * as api from '../api'
import './Recognitions.css'

export default function Recognitions() {
  const { user, isAdmin, isHR } = useAuth()
  const [tab, setTab] = useState('received')
  const [list, setList] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [toUserId, setToUserId] = useState('')
  const [message, setMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [sending, setSending] = useState(false)

  const canViewAll = isAdmin || isHR

  useEffect(() => {
    const load = () => {
      setLoading(true)
      if (canViewAll && tab === 'all') {
        api.recognitions.listAll().then(setList).catch(() => setList([])).finally(() => setLoading(false))
      } else {
        api.recognitions.list(tab).then(setList).catch(() => setList([])).finally(() => setLoading(false))
      }
    }
    load()
  }, [tab, canViewAll])

  useEffect(() => {
    if (showForm) {
      (canViewAll ? api.users.list() : api.users.peers())
        .then(setUsers)
        .catch(() => setUsers([]))
    }
  }, [showForm, canViewAll])

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    setSending(true)
    try {
      await api.recognitions.create({ toUserId, message: message.trim() })
      setMessage('')
      setToUserId('')
      setShowForm(false)
      if (canViewAll && tab === 'all') api.recognitions.listAll().then(setList)
      else api.recognitions.list(tab).then(setList)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSending(false)
    }
  }

  const currentUserId = String(user?.id || user?._id || '')
  const filteredUsers = users.filter((u) => {
    const uid = String(u?._id || u?.id || '')
    if (!uid || uid === currentUserId) return false
    // If logged-in user is HR, only show employees as possible recipients
    if (isHR) return String(u.role || u.roleName || '').toLowerCase() === 'employee'
    // Admins see everyone (except themselves); other roles see peers list already provided
    return true
  })

  return (
    <motion.div
      className="recognitions-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <h1>Recognition</h1>
        <div className="recognitions-page__actions">
          {canViewAll && (
            <button type="button" className="btn btn-ghost" onClick={() => api.exportApi.recognitions().catch(() => setSubmitError('Export failed'))}>
              Export CSV
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Give recognition'}
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tabs__btn ${tab === 'received' ? 'tabs__btn--active' : ''}`}
          onClick={() => setTab('received')}
        >
          Received
        </button>
        <button
          type="button"
          className={`tabs__btn ${tab === 'given' ? 'tabs__btn--active' : ''}`}
          onClick={() => setTab('given')}
        >
          Given
        </button>
        {canViewAll && (
          <button
            type="button"
            className={`tabs__btn ${tab === 'all' ? 'tabs__btn--active' : ''}`}
            onClick={() => setTab('all')}
          >
            All
          </button>
        )}
      </div>

      {showForm && (
        <motion.form
          className="recognition-form card"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          {submitError && <div className="form-error">{submitError}</div>}
          <label className="form-label">
            Recognize
            <select
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              className="form-input"
              required
            >
              <option value="">Select colleague</option>
              {filteredUsers.map((u) => (
                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </label>
          <label className="form-label">
            Message
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Thanks for..."
              rows={3}
              className="form-input form-textarea"
              required
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={sending}>
            {sending ? 'Sending…' : 'Send recognition'}
          </button>
        </motion.form>
      )}

      {loading ? (
        <div className="page-loading">Loading…</div>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <p>{tab === 'received' ? 'No recognition received yet.' : tab === 'given' ? "You haven't given any recognition yet." : 'No recognition in the system.'}</p>
          {!showForm && <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>Give recognition</button>}
        </div>
      ) : (
        <ul className="recognitions-list">
          {list.map((r) => (
            <motion.li
              key={r._id}
              className="recognition-card card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="recognition-card__body">
                <p className="recognition-card__message">"{r.message}"</p>
                <div className="recognition-card__meta">
                  From <strong>{r.fromUser?.name}</strong>
                  {' → '}
                  To <strong>{r.toUser?.name}</strong>
                  <span className="recognition-card__date">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
