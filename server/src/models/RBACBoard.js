import mongoose from 'mongoose'

const BoardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a board title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RBACUser',
      required: true,
    },
    columns: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RBACColumn',
      },
    ],
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RBACUser',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

export default mongoose.model('RBACBoard', BoardSchema)
