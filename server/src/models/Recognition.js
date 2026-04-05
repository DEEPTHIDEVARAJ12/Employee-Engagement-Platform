import mongoose from 'mongoose'

const recognitionSchema = new mongoose.Schema({
  // Use RBACUser model for references so population returns RBAC user docs
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'RBACUser', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'RBACUser', required: true },
  message: { type: String, required: true, trim: true },
  category: { type: String, default: 'general' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true })

recognitionSchema.index({ toUser: 1, createdAt: -1 })
recognitionSchema.index({ fromUser: 1, createdAt: -1 })

export default mongoose.model('Recognition', recognitionSchema)
