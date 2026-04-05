import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { auth } from '../api'
import './Auth.css'

const ROLES = [
  { value: 'employee', label: 'Employee', desc: 'Participate in surveys & recognition' },
  { value: 'hr', label: 'HR Manager', desc: 'Create surveys & view analytics' },
  { value: 'admin', label: 'Admin', desc: 'Manage users & system settings' },
]

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('employee')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Map UI role to backend enum
      const roleMap = { admin: 'Admin', hr: 'HR', employee: 'Employee' }
      const mappedRole = roleMap[role] || 'Employee'
      const data = await auth.register({ name, email, password, role: mappedRole })
      login(data.user, data.token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__bg" />
      <motion.div
        className="auth-card auth-card--wide"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link to="/" className="auth-card__logo">
          <span className="auth-card__logo-icon">◇</span>
          WorkSphere
        </Link>
        <h1 className="auth-card__title">Create account</h1>
        <p className="auth-card__sub">Choose your role and get started.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <motion.div
              className="auth-form__error"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          <div className="auth-form__roles">
            <span className="auth-form__roles-label">I am a...</span>
            <div className="auth-form__roles-options">
              {ROLES.map((r) => (
                <motion.label
                  key={r.value}
                  className={`auth-form__role-option ${role === r.value ? 'auth-form__role-option--active' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={(e) => setRole(e.target.value)}
                    className="auth-form__role-input"
                  />
                  <span className="auth-form__role-title">{r.label}</span>
                  <span className="auth-form__role-desc">{r.desc}</span>
                </motion.label>
              ))}
            </div>
          </div>

          <label className="auth-form__label">
            Full name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              required
              autoComplete="name"
              className="auth-form__input"
            />
          </label>
          <label className="auth-form__label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoComplete="email"
              className="auth-form__input"
            />
          </label>
          <label className="auth-form__label">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
              autoComplete="new-password"
              className="auth-form__input"
            />
          </label>
          <motion.button
            type="submit"
            className="auth-form__submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </motion.button>
        </form>

        <p className="auth-card__footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </motion.div>
      <Link to="/" className="auth-page__back">← Back to home</Link>
    </div>
  )
}
