import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  // Link notifications to RBAC users so population is consistent across RBAC features
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'RBACUser', required: true },
  type: { type: String, required: true }, // 'recognition', 'survey', 'announcement', 'feedback_reply'
  title: { type: String, required: true },
  body: { type: String, default: '' },
  link: { type: String, default: '' },
  read: { type: Boolean, default: false },
}, { timestamps: true })

notificationSchema.index({ user: 1, createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)
