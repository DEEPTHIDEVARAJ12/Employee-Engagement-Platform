import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'kanban-rbac-secret-key-change-in-production'
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d'

// Generate JWT token
export const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRE })
}

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (err) {
    return null
  }
}

// Authentication middleware - verifies JWT token
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please authenticate first.',
      })
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)

    req.user = {
      id: decoded.userId,
      role: decoded.role,
    }
    req.userId = decoded.userId
    req.userRole = decoded.role

    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
      })
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please authenticate.',
    })
  }
}

// Authorization middleware - checks if user has required role
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'User information not found. Please authenticate.',
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      })
    }

    next()
  }
}

// Check if user is HR
export const isHR = (req, res, next) => {
  if (req.user && req.user.role === 'HR') {
    return next()
  }
  return res.status(403).json({
    success: false,
    message: 'This action is only available to HR users.',
  })
}

// Check if user is Employee
export const isEmployee = (req, res, next) => {
  if (req.user && req.user.role === 'Employee') {
    return next()
  }
  return res.status(403).json({
    success: false,
    message: 'This action is only available to employees.',
  })
}
