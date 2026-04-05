import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import * as api from '../api'
import './Users.css'

const ROLE_LABELS = { admin: 'Admin', hr: 'HR Manager', employee: 'Employee' }

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.users
      .list()
      .then(setUsers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-loading">Loading employees…</div>
  if (error) return <div className="page-error">{error}</div>

  return (
    <motion.div className="users-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-header">
        <h1>Employees</h1>
      </div>
      {users.length === 0 ? (
        <div className="empty-state">No users found.</div>
      ) : (
        <div className="users-table-wrap card">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Job title</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td className="users-table__name">{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`users-table__role users-table__role--${u.role}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td>{u.department || '—'}</td>
                  <td>{u.jobTitle || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  )
}
