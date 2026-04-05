import mongoose from 'mongoose'

const CommentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false })

const AttachmentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false })

const CardSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, default: 'task' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  status: { type: String, default: 'open' },
  columnId: { type: String, required: true },
  laneId: { type: String, default: 'default' },
  assignees: [{ type: String }],
  dueDate: { type: Date, default: null },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  comments: [CommentSchema],
  attachments: [AttachmentSchema],
  archived: { type: Boolean, default: false },
  visibility: { type: String, enum: ['public', 'private', 'assigned'], default: 'public' },
}, { _id: false })

const ColumnSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 },
  color: { type: String, default: '#3498db' },
}, { _id: false })

const KanbanBoardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  createdBy: { type: String, required: true }, // userId of the HR who created it
  boardType: { type: String, enum: ['global', 'team', 'personal'], default: 'global' },
  ownerId: { type: String, default: null, index: true }, // null for global/team boards
  members: [{ type: String }], // array of userIds with access
  columns: [ColumnSchema],
  cards: { type: Map, of: CardSchema, default: new Map() },
  isActive: { type: Boolean, default: true },
  archived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true })

const Kanban = mongoose.model('Kanban', KanbanBoardSchema)
export default Kanban
