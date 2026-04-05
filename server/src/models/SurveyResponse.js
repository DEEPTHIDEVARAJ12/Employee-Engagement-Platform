import mongoose from 'mongoose'

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.Mixed, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
}, { _id: false })

const surveyResponseSchema = new mongoose.Schema({
  survey: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
  answers: [answerSchema],
  responderId: { type: mongoose.Schema.Types.ObjectId, index: true, select: false, default: null },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true })

surveyResponseSchema.index({ survey: 1, submittedBy: 1 }, { sparse: true })
surveyResponseSchema.index({ survey: 1, responderId: 1 }, { sparse: true })

export default mongoose.model('SurveyResponse', surveyResponseSchema)
