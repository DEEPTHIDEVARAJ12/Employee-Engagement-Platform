import RBACComment from '../models/RBACComment.js'
import RBACAttachment from '../models/RBACAttachment.js'
import RBACTask from '../models/RBACTask.js'
import RBACNotification from '../models/RBACNotification.js'
import { asyncHandler } from '../middleware/errorHandler.js'

// ==================== COMMENTS ====================

// Add comment to task
export const addComment = asyncHandler(async (req, res) => {
  const taskId = req.params.taskId || req.params.id
  const { message } = req.validatedData

  // Verify task exists
  const task = await RBACTask.findById(taskId)
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    })
  }

  // Create comment
  const comment = await RBACComment.create({
    taskId,
    userId: req.userId,
    message,
  })

  const populatedComment = await RBACComment.findById(comment._id).populate('userId', 'name email')

  // Add comment to task
  await RBACTask.findByIdAndUpdate(taskId, {
    $push: { comments: comment._id },
  })

  // Send notification to task creator and assignees
  const notificationUsers = [task.createdBy, ...task.assignees]
  const uniqueUsers = [...new Set(notificationUsers.map((u) => u.toString()))]

  const notifications = uniqueUsers
    .filter((userId) => userId !== req.userId) // Don't notify the commenter
    .map((userId) => ({
      userId,
      type: 'comment_added',
      taskId,
      message: `A new comment was added to "${task.title}"`,
      triggeredBy: req.userId,
    }))

  await RBACNotification.insertMany(notifications)

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    comment: populatedComment,
  })
})

// Get comments for a task
export const getComments = asyncHandler(async (req, res) => {
  const taskId = req.params.taskId || req.params.id

  // Verify task exists
  const task = await RBACTask.findById(taskId)
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    })
  }

  const comments = await RBACComment.find({ taskId })
    .populate('userId', 'name email avatar')
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    count: comments.length,
    comments,
  })
})

// Delete comment
export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params

  const comment = await RBACComment.findById(commentId)
  if (!comment) {
    return res.status(404).json({
      success: false,
      message: 'Comment not found',
    })
  }

  // Check authorization - only comment owner, HR, or Admin can delete
  if (
    comment.userId.toString() !== req.userId &&
    req.userRole !== 'HR' &&
    req.userRole !== 'Admin'
  ) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own comments',
    })
  }

  // Remove comment from task
  await RBACTask.findByIdAndUpdate(comment.taskId, {
    $pull: { comments: commentId },
  })

  // Delete comment
  await RBACComment.findByIdAndDelete(commentId)

  res.status(200).json({
    success: true,
    message: 'Comment deleted successfully',
  })
})

// ==================== ATTACHMENTS ====================

// Upload attachment to task
export const uploadAttachment = asyncHandler(async (req, res) => {
  const taskId = req.params.taskId || req.params.id

  // Verify task exists
  const task = await RBACTask.findById(taskId)
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    })
  }

  // Check authorization - Employees can only upload to assigned tasks
  const isAssigned = task.assignees.some((a) => a.toString() === req.userId.toString())
  if (req.userRole === 'Employee' && !isAssigned) {
    return res.status(403).json({
      success: false,
      message: 'You can only upload to assigned tasks',
    })
  }

  // In production, you would handle file upload here
  // For now, we'll accept file details from the request
  const { fileName, fileUrl, fileSize, fileType } = req.body

  if (!fileName || !fileUrl) {
    return res.status(400).json({
      success: false,
      message: 'fileName and fileUrl are required',
    })
  }

  const attachment = await RBACAttachment.create({
    taskId,
    fileName,
    fileUrl,
    fileSize: fileSize || 0,
    fileType: fileType || 'application/octet-stream',
    uploadedBy: req.userId,
  })

  // Add attachment to task
  await RBACTask.findByIdAndUpdate(taskId, {
    $push: { attachments: attachment._id },
  })

  const populatedAttachment = await RBACAttachment.findById(attachment._id).populate(
    'uploadedBy',
    'name email'
  )

  res.status(201).json({
    success: true,
    message: 'Attachment uploaded successfully',
    attachment: populatedAttachment,
  })
})

// Get attachments for a task
export const getAttachments = asyncHandler(async (req, res) => {
  const { taskId } = req.params

  // Verify task exists
  const task = await RBACTask.findById(taskId)
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    })
  }

  const attachments = await RBACAttachment.find({ taskId })
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    count: attachments.length,
    attachments,
  })
})

// Delete attachment
export const deleteAttachment = asyncHandler(async (req, res) => {
  const { attachmentId } = req.params

  const attachment = await RBACAttachment.findById(attachmentId)
  if (!attachment) {
    return res.status(404).json({
      success: false,
      message: 'Attachment not found',
    })
  }

  // Check authorization - only uploader, HR, or Admin can delete
  if (
    attachment.uploadedBy.toString() !== req.userId &&
    req.userRole !== 'HR' &&
    req.userRole !== 'Admin'
  ) {
    return res.status(403).json({
      success: false,
      message: 'You can only delete your own attachments',
    })
  }

  // Remove attachment from task
  await RBACTask.findByIdAndUpdate(attachment.taskId, {
    $pull: { attachments: attachmentId },
  })

  // Delete attachment document
  await RBACAttachment.findByIdAndDelete(attachmentId)

  // In production, you would also delete the actual file from storage

  res.status(200).json({
    success: true,
    message: 'Attachment deleted successfully',
  })
})
