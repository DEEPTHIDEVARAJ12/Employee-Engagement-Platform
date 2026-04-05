import RBACNotification from '../models/RBACNotification.js'
import { asyncHandler } from '../middleware/errorHandler.js'

// Get user notifications
export const getNotifications = asyncHandler(async (req, res) => {
  const { limit, skip, isRead } = req.query
  const userId = req.userId

  let query = { userId }

  if (isRead !== undefined) {
    query.isRead = isRead === 'true'
  }

  const notifications = await RBACNotification.find(query)
    .populate('triggeredBy', 'name email')
    .populate('taskId', 'title')
    .populate('boardId', 'title')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit) || 20)
    .skip(parseInt(skip) || 0)

  const total = await RBACNotification.countDocuments(query)
  const unreadCount = await RBACNotification.countDocuments({ userId, isRead: false })

  res.status(200).json({
    success: true,
    total,
    unreadCount,
    notifications,
  })
})

// Mark notification as read
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId

  const notification = await RBACNotification.findOneAndUpdate(
    { _id: id, userId },
    { isRead: true },
    { new: true }
  )

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    notification,
  })
})

// Mark all notifications as read
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.userId

  const result = await RBACNotification.updateMany({ userId, isRead: false }, { isRead: true })

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
    modifiedCount: result.modifiedCount,
  })
})

// Get unread notification count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.userId

  const unreadCount = await RBACNotification.countDocuments({ userId, isRead: false })

  res.status(200).json({
    success: true,
    unreadCount,
  })
})

// Delete notification
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params
  const userId = req.userId

  const notification = await RBACNotification.findOneAndDelete({ _id: id, userId })

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'Notification not found',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted',
  })
})

// Clear all notifications
export const clearAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.userId

  const result = await RBACNotification.deleteMany({ userId })

  res.status(200).json({
    success: true,
    message: 'All notifications cleared',
    deletedCount: result.deletedCount,
  })
})
