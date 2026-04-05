import express from 'express'
import {
  getAllUsers,
  getUserById,
  createUser,
  updateProfile,
  deactivateUser,
  getUserStats,
} from '../controllers/rbac-user-controller.js'
import { authenticate, authorize, isHR } from '../middleware/rbac-auth.js'
import { validate, validateObjectId } from '../middleware/validation.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get all users (Admin and HR)
router.get('/', authorize('Admin', 'HR'), getAllUsers)

// Get user statistics (Admin only)
router.get('/stats', authorize('Admin'), getUserStats)

// Get user by ID
router.get('/:id', validateObjectId, getUserById)

// Create new user (Admin only)
router.post('/', authorize('Admin'), validate('register'), createUser)

// Update own profile
router.patch('/profile', validate('updateProfile'), updateProfile)

// Deactivate user (Admin only)
router.patch('/:id/deactivate', authorize('Admin'), validateObjectId, deactivateUser)

export default router
