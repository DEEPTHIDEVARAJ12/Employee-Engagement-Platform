import express from 'express'
import {
  getBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
  addBoardMember,
  removeBoardMember,
  getBoardStats,
} from '../controllers/rbac-board-controller.js'
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
import {
  addComment,
  getComments,
  uploadAttachment,
  getAttachments,
} from '../controllers/rbac-comments-attachments-controller.js'
import { getBoardTaskReport } from '../controllers/rbac-report-controller.js'
import { authenticate, authorize, isHR } from '../middleware/rbac-auth.js'
import { validate, validateObjectId } from '../middleware/validation.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get all boards
router.get('/', getBoards)

// Get board statistics
router.get('/:id/stats', validateObjectId, getBoardStats)

// Get single board
router.get('/:id', validateObjectId, getBoardById)

// Create new board (Admin only)
router.post('/', authorize('Admin'), validate('createBoard'), createBoard)

// Update board (Admin only)
router.put('/:id', authorize('Admin'), validateObjectId, validate('updateBoard'), updateBoard)

// Delete board (Admin only)
router.delete('/:id', authorize('Admin'), validateObjectId, deleteBoard)

// Add board member (Admin only)
router.post('/:id/members', authorize('Admin'), validateObjectId, addBoardMember)

// Remove board member (Admin only)
router.delete('/:id/members/:userId', authorize('Admin'), validateObjectId, removeBoardMember)

// ===== NESTED TASK ROUTES =====

// Get all tasks for a board
router.get('/:boardId/tasks', validateObjectId, getTasks)

// Create new task for board (HR/Admin)
router.post('/:boardId/tasks', authorize('HR', 'Admin'), validateObjectId, validate('createTask'), createTask)

// Get task statistics for board
router.get('/:boardId/tasks/stats', validateObjectId, getTaskStats)

// Get single task
router.get('/:boardId/tasks/:id', validateObjectId, getTaskById)

// Update task
router.patch('/:boardId/tasks/:id', validateObjectId, validate('updateTask'), updateTask)

// Move task to another column
router.patch('/:boardId/tasks/:id/move', validateObjectId, validate('moveTask'), moveTask)

// Delete task (Admin only)
router.delete('/:boardId/tasks/:id', authorize('Admin'), validateObjectId, deleteTask)

// Archive all completed tasks for board (Admin only)
router.post('/:boardId/tasks/archive-completed', authorize('Admin'), validateObjectId, archiveCompletedTasks)

// Comments for a task
router.get('/:boardId/tasks/:taskId/comments', validateObjectId, getComments)
router.post('/:boardId/tasks/:taskId/comments', validateObjectId, validate('createComment'), addComment)

// Attachments for a task
router.get('/:boardId/tasks/:taskId/attachments', validateObjectId, getAttachments)
router.post('/:boardId/tasks/:taskId/attachments', validateObjectId, uploadAttachment)

// Board report (Admin only)
router.get('/:boardId/report', authorize('Admin'), validateObjectId, getBoardTaskReport)

export default router
