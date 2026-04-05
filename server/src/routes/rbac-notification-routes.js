import express from 'express'
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  deleteNotification,
  clearAllNotifications,
} from '../controllers/rbac-notification-controller.js'
import { authenticate } from '../middleware/rbac-auth.js'
import { validateObjectId } from '../middleware/validation.js'

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get user notifications
router.get('/', getNotifications)

// Get unread count
router.get('/unread-count', getUnreadCount)

// Mark notification as read
router.patch('/:id/read', validateObjectId, markNotificationAsRead)

// Mark all as read
router.patch('/read-all', markAllNotificationsAsRead)

// Delete notification
router.delete('/:id', validateObjectId, deleteNotification)

// Clear all notifications
router.delete('/', clearAllNotifications)

export default router
