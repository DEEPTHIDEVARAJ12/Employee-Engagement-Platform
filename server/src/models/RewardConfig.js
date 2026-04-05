import mongoose from 'mongoose'

const rewardConfigSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '🏆' },
  points: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
}, { timestamps: true })

export default mongoose.model('RewardConfig', rewardConfigSchema)
