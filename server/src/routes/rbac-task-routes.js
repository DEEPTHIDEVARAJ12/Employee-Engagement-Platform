import express from 'express'
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  moveTask,
  deleteTask,
  archiveCompletedTasks,
  getTaskStats,
} from '../controllers/rbac-task-controller.js'
import { authenticate, authorize, isHR } from '../middleware/rbac-auth.js'
import { validate, validateObjectId } from '../middleware/validation.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get all tasks for a board
router.get('/board/:boardId', validateObjectId, getTasks)

// Get task statistics
router.get('/board/:boardId/stats', validateObjectId, getTaskStats)

// Get single task
router.get('/:id', validateObjectId, getTaskById)

// Create new task (HR/Admin)
router.post('/board/:boardId', authorize('HR', 'Admin'), validateObjectId, validate('createTask'), createTask)

// Update task
router.put('/:id', validateObjectId, validate('updateTask'), updateTask)

// Move task to another column
router.patch('/:id/move', validateObjectId, validate('moveTask'), moveTask)

// Delete task (Admin only)
router.delete('/:id', authorize('Admin'), validateObjectId, deleteTask)

// Archive all completed tasks (Admin only)
router.post('/board/:boardId/archive-completed', authorize('Admin'), validateObjectId, archiveCompletedTasks)

export default router
