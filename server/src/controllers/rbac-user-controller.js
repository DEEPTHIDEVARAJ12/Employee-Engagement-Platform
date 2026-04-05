import RBACUser from '../models/RBACUser.js'
import { asyncHandler } from '../middleware/errorHandler.js'

// Get all users (HR only)
export const getAllUsers = asyncHandler(async (req, res) => {
  const { role, department, search } = req.query

  // Build query
  let query = { isActive: true }

  if (role) {
    query.role = role
  }

  if (department) {
    query.department = department
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
  }

  const users = await RBACUser.find(query).select('-password').sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    count: users.length,
    users,
  })
})

// Get user by ID
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const user = await RBACUser.findById(id).select('-password')
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    })
  }

  // Employees can only view their own profile
  if (req.userRole === 'Employee' && req.userId !== id) {
    return res.status(403).json({
      success: false,
      message: 'You can only view your own profile',
    })
  }

  res.status(200).json({
    success: true,
    user,
  })
})

// Create new user (HR only)
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department } = req.validatedData

  // Check if user already exists
  const existingUser = await RBACUser.findOne({ email })
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered',
    })
  }

  // Create new user
  const user = await RBACUser.create({
    name,
    email,
    password,
    role,
    department,
    status: 'Active',
  })

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  })
})

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, department } = req.validatedData
  const userId = req.userId

  const user = await RBACUser.findByIdAndUpdate(
    userId,
    { name, department },
    { new: true, runValidators: true }
  ).select('-password')

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user,
  })
})

// Deactivate user (HR only)
export const deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params

  const user = await RBACUser.findByIdAndUpdate(
    id,
    { isActive: false, status: 'Inactive' },
    { new: true }
  )

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    })
  }

  res.status(200).json({
    success: true,
    message: 'User deactivated successfully',
  })
})

// Get user statistics (HR only)
export const getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await RBACUser.countDocuments()
  const adminUsers = await RBACUser.countDocuments({ role: 'Admin' })
  const hrUsers = await RBACUser.countDocuments({ role: 'HR' })
  const employeeUsers = await RBACUser.countDocuments({ role: 'Employee' })
  const activeUsers = await RBACUser.countDocuments({ isActive: true })

  res.status(200).json({
    success: true,
    stats: {
      total: totalUsers,
      admin: adminUsers,
      hr: hrUsers,
      employees: employeeUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
    },
  })
})

// Get active employees for task assignment (HR only)
export const getActiveEmployees = asyncHandler(async (req, res) => {
  const employees = await RBACUser.find({
    role: 'Employee',
    $or: [
      { status: 'Active' },
      { status: { $exists: false }, isActive: true },
    ],
  })
    .select('name email department role status')
    .sort({ name: 1 })

  res.status(200).json({
    success: true,
    count: employees.length,
    employees,
  })
})
