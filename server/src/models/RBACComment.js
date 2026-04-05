import mongoose from 'mongoose'

const CommentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RBACTask',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RBACUser',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Please provide a comment message'],
      trim: true,
    },
    mention: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RBACUser',
      },
    ],
  },
  { timestamps: true }
)

// Index for faster queries
CommentSchema.index({ taskId: 1, createdAt: -1 })

export default mongoose.model('RBACComment', CommentSchema)
