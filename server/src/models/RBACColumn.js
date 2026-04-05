import mongoose from 'mongoose'

const ColumnSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a column title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RBACBoard',
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: '#3498db',
    },
    taskCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

export default mongoose.model('RBACColumn', ColumnSchema)
