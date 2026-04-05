import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import * as api from '../api'
import './Rewards.css'

export default function Rewards() {
  const [rewards, setRewards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🏆')
  const [points, setPoints] = useState(0)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  function load() {
    api.rewards.listAdmin().then(setRewards).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setEditId(null)
    setName('')
    setDescription('')
    setIcon('🏆')
    setPoints(0)
    setShowForm(true)
  }

  function openEdit(r) {
    setEditId(r._id)
    setName(r.name)
    setDescription(r.description || '')
    setIcon(r.icon || '🏆')
    setPoints(r.points || 0)
    setShowForm(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        await api.rewards.update(editId, { name, description, icon, points })
      } else {
        await api.rewards.create({ name, description, icon, points })
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this reward type?')) return
    try {
      await api.rewards.delete(id)
      setRewards((r) => r.filter((x) => x._id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleActive(r) {
    try {
      await api.rewards.update(r._id, { active: !r.active })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div className="page-loading">Loading reward config…</div>

  return (
    <motion.div className="rewards-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <h1>Reward configuration</h1>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          Add reward type
        </button>
      </div>
      {error && <div className="form-error">{error}</div>}

      {showForm && (
        <motion.form
          className="rewards-form card"
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h3>{editId ? 'Edit reward' : 'New reward type'}</h3>
          <label className="form-label">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            required
          />
          <label className="form-label">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-input"
          />
          <label className="form-label">Icon (emoji)</label>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="form-input"
            maxLength={2}
          />
          <label className="form-label">Points</label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(Number(e.target.value) || 0)}
            className="form-input"
            min={0}
          />
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editId ? 'Update' : 'Add'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </motion.form>
      )}

      {rewards.length === 0 && !showForm ? (
        <div className="empty-state">
          <p>No reward types configured.</p>
          <button type="button" className="btn btn-primary" onClick={openCreate}>Add reward type</button>
        </div>
      ) : (
        <ul className="rewards-list">
          {rewards.map((r) => (
            <motion.li
              key={r._id}
              className={`reward-card card ${!r.active ? 'reward-card--inactive' : ''}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="reward-card__icon">{r.icon}</span>
              <div className="reward-card__main">
                <h4>{r.name}</h4>
                {r.description && <p>{r.description}</p>}
                <span className="reward-card__points">{r.points} pts</span>
              </div>
              <div className="reward-card__actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleActive(r)}>
                  {r.active ? 'Deactivate' : 'Activate'}
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}>Edit</button>
                <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={() => handleDelete(r._id)}>Delete</button>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
