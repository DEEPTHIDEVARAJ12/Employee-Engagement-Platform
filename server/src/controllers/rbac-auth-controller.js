import RBACUser from '../models/RBACUser.js'
import { generateToken } from '../middleware/rbac-auth.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'

// Register new user
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.validatedData

  // Check if user already exists
  const existingUser = await RBACUser.findOne({ email })
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered. Please use a different email.',
    })
  }

  // Create new user
  const user = await RBACUser.create({
    name,
    email,
    password,
    role,
  })

  // Generate token
  const token = generateToken(user._id, user.role)

  // Send response
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })
})

// Login user
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validatedData

  // Find user by email and select password field
  const user = await RBACUser.findOne({ email }).select('+password')
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Please check your email and password.',
    })
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated. Please contact HR.',
    })
  }

  // Compare passwords
  const isPasswordCorrect = await user.comparePassword(password)
  if (!isPasswordCorrect) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials. Please check your email and password.',
    })
  }

  // Generate token
  const token = generateToken(user._id, user.role)

  // Send response
  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  })
})

// Get current user profile
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await RBACUser.findById(req.userId)
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    })
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
  })
})
