import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import * as api from '../api'
import './Profile.css'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [jobTitle, setJobTitle] = useState('')

  useEffect(() => {
    api.users
      .profile()
      .then((p) => {
        setProfile(p)
        setName(p.name || '')
        setDepartment(p.department || '')
        setJobTitle(p.jobTitle || '')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const updated = await api.users.updateProfile({ name, department, jobTitle })
      setProfile(updated)
      updateUser(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="page-loading">Loading profile…</div>

  return (
    <motion.div className="profile-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <h1>My profile</h1>
      </div>
      <form onSubmit={handleSubmit} className="profile-form card">
        {error && <div className="form-error">{error}</div>}
        <label className="form-label">Full name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="form-input"
          required
        />
        <label className="form-label">Email</label>
        <input type="email" value={profile?.email || ''} className="form-input" disabled />
        <label className="form-label">Department</label>
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="form-input"
          placeholder="e.g. Engineering"
        />
        <label className="form-label">Job title</label>
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          className="form-input"
          placeholder="e.g. Software Engineer"
        />
        <p className="profile-form__role">Role: <strong>{profile?.role}</strong></p>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </motion.div>
  )
}
