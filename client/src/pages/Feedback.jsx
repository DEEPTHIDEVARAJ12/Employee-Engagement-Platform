import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import * as api from '../api'
import './Feedback.css'

export default function Feedback() {
  const { isAdmin, isHR } = useAuth()
  const [message, setMessage] = useState('')
  const [anonymous, setAnonymous] = useState(true)
  const [category, setCategory] = useState('general')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const reviewerLabel = isAdmin ? 'HR and admins' : isHR ? 'admins and HR leaders' : 'HR and admins'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) return
    setError('')
    setSending(true)
    try {
      await api.feedback.submit({ message: message.trim(), anonymous, category })
      setSent(true)
      setMessage('')
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <motion.div className="feedback-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="card feedback-page__success">
          <h2>Thank you</h2>
          <p>Your feedback has been submitted. {reviewerLabel} will review it.</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div className="feedback-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1>Submit feedback</h1>
      <p className="feedback-page__sub">Share your thoughts anonymously or with your name. {reviewerLabel} will see your feedback.</p>
      <form onSubmit={handleSubmit} className="card feedback-page__form">
        {error && <div className="form-error">{error}</div>}
        <label className="form-label">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="form-input">
          <option value="general">General</option>
          <option value="workplace">Workplace</option>
          <option value="culture">Culture</option>
          <option value="suggestions">Suggestions</option>
        </select>
        <label className="form-label">Message</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="form-input form-textarea" rows={4} required placeholder="Your feedback…" />
        <label className="form-check">
          <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
          Submit anonymously
        </label>
        <button type="submit" className="btn btn-primary" disabled={sending}>{sending ? 'Sending…' : 'Submit feedback'}</button>
      </form>
    </motion.div>
  )
}
