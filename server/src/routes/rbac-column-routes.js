import express from 'express'
import {
  getColumnsByBoard,
  getColumnById,
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
} from '../controllers/rbac-column-controller.js'
import { authenticate, authorize, isHR } from '../middleware/rbac-auth.js'
import { validate, validateObjectId } from '../middleware/validation.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get all columns for a board
router.get('/board/:boardId', validateObjectId, getColumnsByBoard)

// Get single column
router.get('/:id', validateObjectId, getColumnById)

// Create new column (Admin only)
router.post('/board/:boardId', authorize('Admin'), validateObjectId, validate('createColumn'), createColumn)

// Update column (Admin only)
router.put('/:id', authorize('Admin'), validateObjectId, validate('updateColumn'), updateColumn)

// Delete column (Admin only)
router.delete('/:id', authorize('Admin'), validateObjectId, deleteColumn)

// Reorder columns (Admin only)
router.post('/board/:boardId/reorder', authorize('Admin'), validateObjectId, reorderColumns)

export default router
