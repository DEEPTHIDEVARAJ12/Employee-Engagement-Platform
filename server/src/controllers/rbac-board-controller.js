import RBACBoard from '../models/RBACBoard.js'
import RBACColumn from '../models/RBACColumn.js'
import RBACTask from '../models/RBACTask.js'
import { asyncHandler } from '../middleware/errorHandler.js'

// Get all boards accessible to user
export const getBoards = asyncHandler(async (req, res) => {
  const baseQuery = { isActive: true, archived: false }
  let boards = []

  // Employees can access boards where they are members OR have assigned tasks.
  if (req.userRole === 'Employee') {
    const assignedBoardIds = await RBACTask.distinct('boardId', {
      assignees: req.userId,
      archived: false,
    })

    boards = await RBACBoard.find({
      ...baseQuery,
      $or: [{ members: req.userId }, { _id: { $in: assignedBoardIds } }],
    })
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 })
  } else {
    boards = await RBACBoard.find(baseQuery)
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 })
  }

  res.status(200).json({
    success: true,
    count: boards.length,
    boards,
  })
})

// Get single board
export const getBoardById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const board = await RBACBoard.findById(id)
    .populate('createdBy', 'name email')
    .populate('members', 'name email')
    .populate('columns')

  if (!board) {
    return res.status(404).json({
      success: false,
      message: 'Board not found',
    })
  }

  // Check access - Employees can access board if member OR assigned any task in this board.
  if (req.userRole === 'Employee') {
    const isMember = board.members.some((m) => m._id.toString() === req.userId)
    if (!isMember) {
      const hasAssignedTask = await RBACTask.exists({
        boardId: id,
        assignees: req.userId,
        archived: false,
      })
      if (!hasAssignedTask) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this board',
        })
      }
    }
  }

  res.status(200).json({
    success: true,
    board,
  })
})

// Create new board (HR only)
export const createBoard = asyncHandler(async (req, res) => {
  const { title, description } = req.validatedData

  // Debug: log who is creating a board
  try {
    console.debug('[rbac-board] createBoard called by user:', req.userId, 'role:', req.userRole)
  } catch (e) {
    // ignore
  }

  const defaultColumns = [
    { title: 'To Do', order: 1, color: '#e74c3c' },
    { title: 'In Progress', order: 2, color: '#f39c12' },
    { title: 'Review', order: 3, color: '#3498db' },
    { title: 'Completed', order: 4, color: '#2ecc71' },
  ]

  // Create board first (columns will be created after we have boardId)
  const board = await RBACBoard.create({
    title,
    description: description || '',
    createdBy: req.userId,
    columns: [],
    members: [req.userId],
  })

  // Create columns with the boardId
  const columnDocs = await RBACColumn.insertMany(
    defaultColumns.map((col) => ({
      ...col,
      boardId: board._id,
    }))
  )

  // Attach column ids to board
  board.columns = columnDocs.map((col) => col._id)
  await board.save()

  const populatedBoard = await RBACBoard.findById(board._id)
    .populate('createdBy', 'name email')
    .populate('columns')

  res.status(201).json({
    success: true,
    message: 'Board created successfully',
    board: populatedBoard,
  })
})

// Update board (HR only)
export const updateBoard = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { title, description } = req.validatedData

  const board = await RBACBoard.findByIdAndUpdate(
    id,
    { title, description },
    { new: true, runValidators: true }
  )
    .populate('createdBy', 'name email')
    .populate('columns')

  if (!board) {
    return res.status(404).json({
      success: false,
      message: 'Board not found',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Board updated successfully',
    board,
  })
})

// Delete board (HR only) - Soft delete
export const deleteBoard = asyncHandler(async (req, res) => {
  const { id } = req.params

  const board = await RBACBoard.findByIdAndUpdate(
    id,
    { archived: true, isActive: false },
    { new: true }
  )

  if (!board) {
    return res.status(404).json({
      success: false,
      message: 'Board not found',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Board deleted successfully',
  })
})

// Add member to board (HR only)
export const addBoardMember = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { userId } = req.body

  const board = await RBACBoard.findByIdAndUpdate(
    id,
    { $addToSet: { members: userId } }, // $addToSet prevents duplicates
    { new: true }
  ).populate('members', 'name email')

  if (!board) {
    return res.status(404).json({
      success: false,
      message: 'Board not found',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Member added to board',
    board,
  })
})

// Remove member from board (HR only)
export const removeBoardMember = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { userId } = req.body

  const board = await RBACBoard.findByIdAndUpdate(
    id,
    { $pull: { members: userId } },
    { new: true }
  ).populate('members', 'name email')

  if (!board) {
    return res.status(404).json({
      success: false,
      message: 'Board not found',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Member removed from board',
    board,
  })
})

// Get board statistics
export const getBoardStats = asyncHandler(async (req, res) => {
  const { id } = req.params

  // Check if board exists
  const board = await RBACBoard.findById(id)
  if (!board) {
    return res.status(404).json({
      success: false,
      message: 'Board not found',
    })
  }

  // Get task statistics
  const totalTasks = await RBACTask.countDocuments({ boardId: id, archived: false })
  const completedTasks = await RBACTask.countDocuments({
    boardId: id,
    archived: false,
    columnId: board.columns[board.columns.length - 1], // Last column is usually "Completed"
  })
  const tasksByPriority = await RBACTask.aggregate([
    { $match: { boardId: id, archived: false } },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
  ])

  res.status(200).json({
    success: true,
    stats: {
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      tasksByPriority,
    },
  })
})
