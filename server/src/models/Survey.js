import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['text', 'rating', 'scale', 'choice'], default: 'text' },
  options: [{ type: String }],
  required: { type: Boolean, default: true },
}, { _id: true })

const surveySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  questions: [questionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
  anonymous: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('Survey', surveySchema)
