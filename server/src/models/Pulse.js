import mongoose from 'mongoose'

const pulseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true, min: 1, max: 5 },
  date: { type: Date, required: true },
  comment: { type: String, default: '' },
}, { timestamps: true })

pulseSchema.index({ user: 1, date: 1 }, { unique: true })

export default mongoose.model('Pulse', pulseSchema)
