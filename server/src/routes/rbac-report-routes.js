import express from 'express'
import {
  getBoardTaskReport,
  getEmployeePerformanceReport,
  getOrganizationReport,
} from '../controllers/rbac-report-controller.js'
import { authenticate, authorize } from '../middleware/rbac-auth.js'
import { validateObjectId } from '../middleware/validation.js'

const router = express.Router()

// All routes require authentication and Admin role
router.use(authenticate)
router.use(authorize('Admin'))

// Get board task report
router.get('/board/:boardId', validateObjectId, getBoardTaskReport)

// Get employee performance report
router.get('/employee/:userId', validateObjectId, getEmployeePerformanceReport)

// Get organization-wide report
router.get('/organization', getOrganizationReport)

export default router
