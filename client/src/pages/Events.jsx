import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import * as api from '../api'
import './Events.css'

export default function Events() {
  const { isAdmin, isHR } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const from = new Date()
    from.setMonth(from.getMonth() - 1)
    const to = new Date()
    to.setFullYear(to.getFullYear() + 1)
    api.events.list(from.toISOString(), to.toISOString()).then(setEvents).catch(() => setEvents([])).finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim() || !startDate) return
    setSaving(true)
    try {
      await api.events.create({ title, description, startDate, endDate: endDate || undefined, location })
      setShowForm(false)
      setTitle('')
      setDescription('')
      setStartDate('')
      setEndDate('')
      setLocation('')
      const from = new Date()
      from.setMonth(from.getMonth() - 1)
      const to = new Date()
      to.setFullYear(to.getFullYear() + 1)
      api.events.list(from.toISOString(), to.toISOString()).then(setEvents)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this event?')) return
    try {
      await api.events.delete(id)
      setEvents((e) => e.filter((x) => x._id !== id))
    } catch {}
  }

  return (
    <motion.div className="events-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <h1>Events</h1>
        {(isAdmin || isHR) && (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Add event'}
          </button>
        )}
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="card events-form">
          <label className="form-label">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" required />
          <label className="form-label">Start date & time</label>
          <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="form-input" required />
          <label className="form-label">End date & time (optional)</label>
          <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="form-input" />
          <label className="form-label">Location</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className="form-input" />
          <label className="form-label">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="form-input form-textarea" rows={2} />
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add event'}</button>
        </form>
      )}
      {loading ? (
        <div className="page-loading">Loading…</div>
      ) : events.length === 0 ? (
        <div className="empty-state">No upcoming events.</div>
      ) : (
        <ul className="events-list">
          {events.map((ev) => (
            <motion.li key={ev._id} className="card events-item" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="events-item__date">
                <span className="events-item__day">{new Date(ev.startDate).toLocaleDateString('en', { day: 'numeric' })}</span>
                <span className="events-item__month">{new Date(ev.startDate).toLocaleDateString('en', { month: 'short' })}</span>
              </div>
              <div className="events-item__main">
                <h3>{ev.title}</h3>
                {ev.location && <p className="events-item__location">{ev.location}</p>}
                {ev.description && <p className="events-item__desc">{ev.description}</p>}
                <span className="events-item__time">{new Date(ev.startDate).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {(isAdmin || isHR) && (
                <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDelete(ev._id)}>Delete</button>
              )}
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
