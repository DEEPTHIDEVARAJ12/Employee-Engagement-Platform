import mongoose from 'mongoose'

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a task title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    deadline: {
      type: Date,
      default: null,
    },
    columnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RBACColumn',
      required: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RBACBoard',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RBACUser',
      required: true,
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RBACUser',
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RBACComment',
      },
    ],
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RBACAttachment',
      },
    ],
    archived: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

// Index for faster queries
TaskSchema.index({ boardId: 1, archived: 1 })
TaskSchema.index({ assignees: 1 })
TaskSchema.index({ columnId: 1 })

export default mongoose.model('RBACTask', TaskSchema)
