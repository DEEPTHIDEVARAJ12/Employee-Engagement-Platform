import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import './Landing.css'

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    const handleMove = (e) => setMouse({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  const features = [
    {
      icon: '📊',
      title: 'Surveys & Feedback',
      desc: 'Measure satisfaction and collect anonymous feedback.',
    },
    {
      icon: '🏆',
      title: 'Recognition & Rewards',
      desc: 'Recognize peers and celebrate wins together.',
    },
    {
      icon: '📢',
      title: 'Announcements',
      desc: 'Stay informed with company-wide updates.',
    },
    {
      icon: '📈',
      title: 'Engagement Analytics',
      desc: 'Insights and reports for HR and leadership.',
    },
  ]

  return (
    <div className="landing">
      <div
        className="landing__cursor-glow"
        style={{
          '--mx': `${mouse.x}px`,
          '--my': `${mouse.y}px`,
        }}
      />

      <header className="landing__header">
        <motion.div
          className="landing__logo"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="landing__logo-icon">◇</span>
          WorkSphere
        </motion.div>
        <motion.nav
          className="landing__nav"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link to="/login" className="landing__nav-link">Log in</Link>
          <Link to="/register" className="landing__nav-btn">Get started</Link>
        </motion.nav>
      </header>

      <main className="landing__main">
        <section className="landing__hero">
          <motion.div
            className="landing__hero-badge"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            Employee Engagement Platform
          </motion.div>
          <motion.h1
            className="landing__hero-title"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Connect. Engage.
            <br />
            <span className="landing__hero-title-accent">Thrive.</span>
          </motion.h1>
          <motion.p
            className="landing__hero-sub"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            Surveys, feedback, recognition, and analytics in one place.
            <br />
            Built for teams that want to grow together.
          </motion.p>
          <motion.div
            className="landing__hero-cta"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <Link to="/register">
              <motion.span
                className="landing__cta-primary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Create account
              </motion.span>
            </Link>
            <Link to="/login">
              <motion.span
                className="landing__cta-secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Sign in
              </motion.span>
            </Link>
          </motion.div>
        </section>

        <section className="landing__features">
          <motion.h2
            className="landing__features-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5 }}
          >
            Everything you need to boost engagement
          </motion.h2>
          <div className="landing__features-grid">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="landing__feature-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
              >
                <span className="landing__feature-icon">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="landing__roles">
          <motion.h2
            className="landing__roles-title"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            For every role
          </motion.h2>
          <motion.div
            className="landing__roles-list"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="landing__role">
              <span className="landing__role-dot landing__role-dot--admin" />
              <strong>Admin</strong> — Manage users, settings & reports
            </div>
            <div className="landing__role">
              <span className="landing__role-dot landing__role-dot--hr" />
              <strong>HR Manager</strong> — Surveys, analytics & employee data
            </div>
            <div className="landing__role">
              <span className="landing__role-dot landing__role-dot--employee" />
              <strong>Employee</strong> — Surveys, feedback & recognition
            </div>
          </motion.div>
          <motion.div
            className="landing__roles-cta"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Link to="/register" className="landing__final-cta">
              Join WorkSphere
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="landing__footer">
        <p>WorkSphere — Employee Engagement Platform</p>
      </footer>
    </div>
  )
}
