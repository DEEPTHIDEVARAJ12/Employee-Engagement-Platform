import express from 'express'
import { register, login, getCurrentUser } from '../controllers/rbac-auth-controller.js'
import { authenticate } from '../middleware/rbac-auth.js'
import { validate } from '../middleware/validation.js'

const router = express.Router()

// Register new user
router.post('/register', validate('register'), register)

// Login user
router.post('/login', validate('login'), login)

// Get current user profile
router.get('/me', authenticate, getCurrentUser)

export default router
