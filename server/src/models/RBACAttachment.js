import mongoose from 'mongoose'

const AttachmentSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RBACTask',
      required: true,
    },
    fileName: {
      type: String,
      required: [true, 'Please provide a file name'],
    },
    fileUrl: {
      type: String,
      required: [true, 'Please provide a file URL'],
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    fileType: {
      type: String,
      default: 'application/octet-stream',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RBACUser',
      required: true,
    },
  },
  { timestamps: true }
)

// Index for faster queries
AttachmentSchema.index({ taskId: 1 })

export default mongoose.model('RBACAttachment', AttachmentSchema)
