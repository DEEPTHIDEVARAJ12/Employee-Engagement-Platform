import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleGuard({ children, allowedRoles }) {
  const { user } = useAuth()
  const allowed = allowedRoles.includes(user?.role)
  if (!allowed) return <Navigate to="/dashboard" replace />
  return children
}
