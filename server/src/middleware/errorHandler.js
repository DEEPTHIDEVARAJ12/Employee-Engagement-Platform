// Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}

// Global error handling middleware
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal Server Error'

  // Wrong MongoDB ID error
  if (err.name === 'CastError') {
    const message = `Invalid ${err.path}: ${err.value}`
    return res.status(400).json({
      success: false,
      message,
    })
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    const message = `${field} already exists. Please use another value.`
    return res.status(400).json({
      success: false,
      message,
    })
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors)
      .map((error) => error.message)
      .join(', ')
    return res.status(400).json({
      success: false,
      message: messages,
    })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    })
  }

  return res.status(err.statusCode).json({
    success: false,
    message: err.message,
    // Include stack in non-production for debugging
    ...(process.env.NODE_ENV === 'production' ? {} : { stack: err.stack }),
  })
}

// Async error wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
