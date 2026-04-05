import express from 'express'
import { authenticate, authorize } from '../middleware/rbac-auth.js'
import { getActiveEmployees } from '../controllers/rbac-user-controller.js'

const router = express.Router()

// Return active employees only for assignment (HR/Admin)
router.get('/active', authenticate, authorize('HR', 'Admin'), getActiveEmployees)

export default router
