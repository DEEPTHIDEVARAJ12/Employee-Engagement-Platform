import mongoose from 'mongoose'

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, default: null },
  location: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  allDay: { type: Boolean, default: false },
}, { timestamps: true })

eventSchema.index({ startDate: 1 })

export default mongoose.model('Event', eventSchema)
