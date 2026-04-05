import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import NotificationsDropdown from './NotificationsDropdown'
import './DashboardLayout.css'

const ROLE_LABELS = { admin: 'Admin', hr: 'HR Manager', employee: 'Employee' }
const ROLE_COLORS = { admin: '#f59e0b', hr: '#06b6d4', employee: '#6366f1' }

export default function DashboardLayout() {
  const { user, logout, isAdmin, isHR } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [searchQ, setSearchQ] = useState('')
  const roleLabel = ROLE_LABELS[user?.role] || 'User'
  const roleColor = ROLE_COLORS[user?.role] || '#6366f1'

  const navItems = [
    { to: '/dashboard', label: 'Home', icon: '◇' },
    { to: '/dashboard/kanban', label: 'Activity tracker', icon: '🗂️' },
    { to: '/dashboard/recognitions', label: 'Recognition', icon: '🏆' },
    { to: '/dashboard/leaderboard', label: 'Leaderboard', icon: '🥇' },
    { to: '/dashboard/announcements', label: 'Announcements', icon: '📢' },
    { to: '/dashboard/events', label: 'Events', icon: '📅' },
    { to: '/dashboard/profile', label: 'My profile', icon: '👤' },
    { to: '/dashboard/pulse', label: 'Pulse', icon: '💚' },
    { to: '/dashboard/feedback', label: 'Feedback', icon: '💬' },
  ]
  if (isAdmin || isHR) {
    navItems.push({ to: '/dashboard/analytics', label: 'Analytics', icon: '📈' })
    navItems.push({ to: '/dashboard/feedback-inbox', label: 'Feedback inbox', icon: '📥' })
  }
  if (isAdmin) {
    navItems.push({ to: '/dashboard/users', label: 'Employees', icon: '👥' })
    navItems.push({ to: '/dashboard/rewards', label: 'Reward config', icon: '⚙️' })
  }
  navItems.push({ to: '/dashboard/surveys', label: 'Surveys', icon: '📋' })

  function handleSearch(e) {
    e.preventDefault()
    if (searchQ.trim()) navigate(`/dashboard/search?q=${encodeURIComponent(searchQ.trim())}`)
  }

  return (
    <div className="layout">
      <aside className="layout__sidebar">
        <Link to="/dashboard" className="layout__logo">
          <span className="layout__logo-icon">◇</span>
          WorkSphere
        </Link>
        <span className="layout__role" style={{ '--role-color': roleColor }}>
          {roleLabel}
        </span>
        <nav className="layout__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                'layout__nav-link' + (isActive ? ' layout__nav-link--active' : '')
              }
            >
              <span className="layout__nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="layout__user">
          <span className="layout__user-name">{user?.name}</span>
          <motion.button
            type="button"
            className="layout__logout"
            onClick={logout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign out
          </motion.button>
        </div>
      </aside>
      <main className="layout__main">
        <div className="layout__topbar">
          <form className="layout__search" onSubmit={handleSearch}>
            <input
              type="search"
              placeholder="Search surveys, announcements…"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="layout__search-input"
            />
            <button type="submit" className="layout__search-btn">Search</button>
          </form>
          <div className="layout__topbar-actions">
            <NotificationsDropdown />
            <button
              type="button"
              className="layout__theme-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
