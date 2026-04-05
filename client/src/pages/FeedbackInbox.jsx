import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import * as api from '../api'
import './FeedbackInbox.css'

export default function FeedbackInbox() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    api.feedback.list(filter || undefined).then(setList).catch(() => setList([])).finally(() => setLoading(false))
  }, [filter])

  async function setStatus(id, status) {
    try {
      await api.feedback.updateStatus(id, status)
      setList((l) => l.map((f) => (f._id === id ? { ...f, status } : f)))
    } catch {}
  }

  async function createTaskFromFeedback(f) {
    try {
      // Load a default board (first accessible)
      let board = null
      const boards = await api.kanban.listBoards().catch(() => [])
      if (Array.isArray(boards) && boards.length > 0) {
        const b = boards[0]
        board = await api.kanban.getBoardById(b._id || b.id).catch(() => b)
      } else {
        // fallback to existing helper which may throw if none
        board = await api.kanban.getBoard().catch(() => null)
      }
      if (!board) {
        alert('No Activity tracker board available. Please ask an Admin to create a board first.')
        return
      }
      const boardId = board._id || board.id
      const todoCol = (board.columns || []).find(c => /todo/i.test(String(c.title || '')))
      const columnId = todoCol ? (todoCol._id || todoCol.id) : (board.columns?.[0]?._id || board.columns?.[0]?.id)
      const title = (f.message || '').substring(0, 120) || 'Suggestion'
      const taskData = {
        title,
        description: f.message || '',
        priority: 'Medium',
        deadline: null,
        columnId,
        boardId,
        assignees: [], // Admin-created unassigned task allowed by server
        tags: ['suggestion']
      }
      await api.kanban.createCard(boardId, taskData)
      alert('Created task on Activity tracker board')
      // mark feedback as read
      await api.feedback.updateStatus(f._id, 'read')
      setList((l) => l.map((it) => (it._id === f._id ? { ...it, status: 'read' } : it)))
    } catch (err) {
      console.error('Failed to create task from feedback', err)
      alert(err.message || 'Failed to create Activity tracker task')
    }
  }

  return (
    <motion.div className="feedback-inbox-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <h1>Feedback inbox</h1>
      </div>
      <div className="tabs">
        {['', 'new', 'read', 'archived'].map((s) => (
          <button key={s || 'all'} type="button" className={`tabs__btn ${filter === s ? 'tabs__btn--active' : ''}`} onClick={() => setFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="page-loading">Loading…</div>
      ) : list.length === 0 ? (
        <div className="empty-state">No feedback.</div>
      ) : (
        <ul className="feedback-inbox-list">
          {list.map((f) => (
            <motion.li key={f._id} className={`card feedback-inbox-item feedback-inbox-item--${f.status}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <p className="feedback-inbox-item__message">{f.message}</p>
              <div className="feedback-inbox-item__meta">
                {f.anonymous ? <span>Anonymous</span> : <span>{f.fromUser?.name} ({f.fromUser?.email})</span>}
                <span>{f.category}</span>
                <span>{new Date(f.createdAt).toLocaleString()}</span>
              </div>
              <div className="feedback-inbox-item__actions">
                {f.status !== 'read' && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStatus(f._id, 'read')}>Mark read</button>}
                {f.status !== 'archived' && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStatus(f._id, 'archived')}>Archive</button>}
                {f.category === 'suggestions' && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => createTaskFromFeedback(f)}>
                    Create Activity Tracker Task
                  </button>
                )}
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
