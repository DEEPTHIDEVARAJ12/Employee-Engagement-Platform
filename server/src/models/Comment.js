import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  announcement: { type: mongoose.Schema.Types.ObjectId, ref: 'Announcement', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true },
}, { timestamps: true })

commentSchema.index({ announcement: 1, createdAt: 1 })

export default mongoose.model('Comment', commentSchema)
