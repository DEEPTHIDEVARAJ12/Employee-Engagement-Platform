import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'kanban-rbac-secret-key-change-in-production'

function normalizeRole(role) {
  return String(role || '').toLowerCase()
}

export function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required' })
  }
  const token = header.split(' ')[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId
    req.role = normalizeRole(payload.role)
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export function requireRole(...roles) {
  const allowed = roles.map((r) => normalizeRole(r))
  return (req, res, next) => {
    if (!allowed.includes(normalizeRole(req.role))) {
      return res.status(403).json({ message: 'Insufficient permissions' })
    }
    next()
  }
}
