import mongoose from 'mongoose'

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RBACUser',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'task_assigned',
        'task_updated',
        'comment_added',
        'task_moved',
        'task_completed',
        'task_submitted_for_review',
        'task_rejected',
        'task_approved',
      ],
      required: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RBACTask',
      default: null,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RBACBoard',
      default: null,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RBACUser',
      default: null,
    },
  },
  { timestamps: true }
)

// Index for faster queries
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 })

export default mongoose.model('RBACNotification', NotificationSchema)
