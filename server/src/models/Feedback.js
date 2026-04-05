import mongoose from 'mongoose'

const feedbackSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  message: { type: String, required: true },
  anonymous: { type: Boolean, default: true },
  category: { type: String, default: 'general' },
  status: { type: String, enum: ['new', 'read', 'archived'], default: 'new' },
}, { timestamps: true })

export default mongoose.model('Feedback', feedbackSchema)
