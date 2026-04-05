import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import * as api from '../api'
import './Announcements.css'

export default function Announcements() {
  const { id } = useParams()
  const isDetail = !!id
  const { isAdmin } = useAuth()
  const [list, setList] = useState([])
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [pinned, setPinned] = useState(false)
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentSending, setCommentSending] = useState(false)

  useEffect(() => {
    api.announcements
      .list()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (isDetail && id) {
      api.announcements.get(id).then(setDetail).catch(() => setDetail(null))
      api.comments.list(id).then(setComments).catch(() => setComments([]))
    } else {
      setDetail(null)
      setComments([])
    }
  }, [id, isDetail])

  async function handleAddComment(e) {
    e.preventDefault()
    if (!commentText.trim() || !id) return
    setCommentSending(true)
    try {
      const c = await api.comments.add(id, commentText.trim())
      setComments((prev) => [...prev, c])
      setCommentText('')
    } finally {
      setCommentSending(false)
    }
  }

  function openCreate() {
    setEditId(null)
    setTitle('')
    setContent('')
    setPinned(false)
    setShowForm(true)
  }

  function openEdit(a) {
    setEditId(a._id)
    setTitle(a.title)
    setContent(a.content)
    setPinned(a.pinned)
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editId) {
        await api.announcements.update(editId, { title, content, pinned })
      } else {
        await api.announcements.create({ title, content, pinned })
      }
      setShowForm(false)
      api.announcements.list().then(setList)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(aid) {
    if (!confirm('Delete this announcement?')) return
    try {
      await api.announcements.delete(aid)
      setList((l) => l.filter((x) => x._id !== aid))
      setDetail(null)
    } catch (err) {
      setError(err.message)
    }
  }

  if (isDetail && detail) {
    return (
      <motion.div className="announcements-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="page-header">
          <h1>{detail.title}</h1>
          {isAdmin && (
            <div className="announcements__actions">
              <button type="button" className="btn btn-ghost" onClick={() => openEdit(detail)}>Edit</button>
              <button type="button" className="btn btn-ghost btn-danger" onClick={() => handleDelete(detail._id)}>Delete</button>
            </div>
          )}
        </div>
        <div className="announcement-detail card">
          {detail.pinned && <span className="announcement-detail__pinned">Pinned</span>}
          <div className="announcement-detail__content">{detail.content}</div>
          <p className="announcement-detail__meta">By {detail.createdBy?.name} · {new Date(detail.createdAt).toLocaleString()}</p>
        </div>
        <div className="announcement-comments card">
          <h3>Comments</h3>
          <form onSubmit={handleAddComment} className="announcement-comments__form">
            <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment…" rows={2} className="form-input form-textarea" />
            <button type="submit" className="btn btn-primary" disabled={commentSending || !commentText.trim()}>{commentSending ? 'Sending…' : 'Post'}</button>
          </form>
          <ul className="announcement-comments__list">
            {comments.map((c) => (
              <li key={c._id}>
                <strong>{c.user?.name}</strong> <span className="announcement-comments__date">{new Date(c.createdAt).toLocaleString()}</span>
                <p>{c.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div className="announcements-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <h1>Announcements</h1>
        {isAdmin && (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            New announcement
          </button>
        )}
      </div>

      {showForm && (
        <motion.form
          className="card announcement-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error && <div className="form-error">{error}</div>}
          <label className="form-label">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="form-input"
            required
          />
          <label className="form-label">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="form-input form-textarea"
            rows={5}
            required
          />
          <label className="form-check">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            Pin to top
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editId ? 'Update' : 'Publish'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      {loading ? (
        <div className="page-loading">Loading…</div>
      ) : list.length === 0 ? (
        <div className="empty-state">
          <p>No announcements yet.</p>
        </div>
      ) : (
        <ul className="announcements-list">
          {list.map((a) => (
            <motion.li
              key={a._id}
              className="announcement-card card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Link to={`/dashboard/announcements/${a._id}`} className="announcement-card__link">
                <h3>{a.title}</h3>
                <p className="announcement-card__preview">{a.content?.slice(0, 120)}{a.content?.length > 120 ? '…' : ''}</p>
                <div className="announcement-card__meta">
                  {a.pinned && <span className="announcement-card__pinned">Pinned</span>}
                  <span>{a.createdBy?.name} · {new Date(a.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
              {isAdmin && (
                <div className="announcement-card__actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(a)}>Edit</button>
                  <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDelete(a._id)}>Delete</button>
                </div>
              )}
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
