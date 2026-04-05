import express from 'express'
import {
  addComment,
  getComments,
  deleteComment,
  uploadAttachment,
  getAttachments,
  deleteAttachment,
} from '../controllers/rbac-comments-attachments-controller.js'
import { authenticate } from '../middleware/rbac-auth.js'
import { validate, validateObjectId } from '../middleware/validation.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// ==================== COMMENTS ====================

// Get comments for a task
router.get('/task/:taskId/comments', validateObjectId, getComments)

// Add comment to task
router.post('/task/:taskId/comments', validateObjectId, validate('createComment'), addComment)

// Delete comment
router.delete('/comments/:commentId', validateObjectId, deleteComment)

// ==================== ATTACHMENTS ====================

// Get attachments for a task
router.get('/task/:taskId/attachments', validateObjectId, getAttachments)

// Upload attachment to task
router.post('/task/:taskId/attachments', validateObjectId, uploadAttachment)

// Delete attachment
router.delete('/attachments/:attachmentId', validateObjectId, deleteAttachment)

export default router
