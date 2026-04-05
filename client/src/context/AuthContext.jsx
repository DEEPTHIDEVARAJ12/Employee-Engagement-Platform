import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'worksphere_token'
const USER_KEY = 'worksphere_user'

function normalizeRole(role) {
  if (!role) return role
  const value = String(role).toLowerCase()
  // Accept common variants and normalize to simple keys used across the app
  if (value === 'hr' || value === 'human resources' || value === 'h r') return 'hr'
  if (value === 'employee' || value === 'staff' || value === 'user') return 'employee'
  if (value === 'admin' || value === 'administrator' || value === 'superadmin') return 'admin'
  return value
}

function normalizeUser(userData) {
  if (!userData) return userData
  return { ...userData, role: normalizeRole(userData.role) }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY))

  useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    auth
      .me()
      .then((data) => {
        const u = normalizeUser(data.user || data)
        console.debug('[Auth] fetched profile:', u?.role)
        setUser(u)
        setLoading(false)
      })
      .catch(() => {
        logout()
        setLoading(false)
      })
  }, [token])

  function login(userData, authToken) {
    const normalizedUser = normalizeUser(userData)
    localStorage.setItem(TOKEN_KEY, authToken)
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser))
    setToken(authToken)
    console.debug('[Auth] login set role:', normalizedUser?.role)
    setUser(normalizedUser)
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  function updateUser(userData) {
    const normalizedUser = normalizeUser(userData)
    setUser(normalizedUser)
    localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser))
  }

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAdmin: user?.role === 'admin',
    isHR: user?.role === 'hr',
    isEmployee: user?.role === 'employee',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
