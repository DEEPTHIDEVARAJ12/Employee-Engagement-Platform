import RBACColumn from '../models/RBACColumn.js'
import RBACBoard from '../models/RBACBoard.js'
import RBACTask from '../models/RBACTask.js'
import { asyncHandler } from '../middleware/errorHandler.js'

// Get all columns for a board
export const getColumnsByBoard = asyncHandler(async (req, res) => {
  const { boardId } = req.params

  const columns = await RBACColumn.find({ boardId }).sort({ order: 1 })

  res.status(200).json({
    success: true,
    count: columns.length,
    columns,
  })
})

// Get single column
export const getColumnById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const column = await RBACColumn.findById(id)

  if (!column) {
    return res.status(404).json({
      success: false,
      message: 'Column not found',
    })
  }

  // Get tasks in this column
  const tasks = await RBACTask.find({ columnId: id, archived: false }).select('-comments')

  res.status(200).json({
    success: true,
    column: {
      ...column.toObject(),
      taskCount: tasks.length,
    },
    tasks,
  })
})

// Create new column (HR only)
export const createColumn = asyncHandler(async (req, res) => {
  const { boardId } = req.params
  const { title, description, color } = req.validatedData

  // Check if board exists
  const board = await RBACBoard.findById(boardId)
  if (!board) {
    return res.status(404).json({
      success: false,
      message: 'Board not found',
    })
  }

  // Get the highest order value
  const lastColumn = await RBACColumn.findOne({ boardId }).sort({ order: -1 })
  const nextOrder = lastColumn ? lastColumn.order + 1 : 1

  // Create column
  const column = await RBACColumn.create({
    title,
    description: description || '',
    boardId,
    color: color || '#3498db',
    order: nextOrder,
  })

  // Add column to board
  await RBACBoard.findByIdAndUpdate(boardId, {
    $push: { columns: column._id },
  })

  res.status(201).json({
    success: true,
    message: 'Column created successfully',
    column,
  })
})

// Update column (HR only)
export const updateColumn = asyncHandler(async (req, res) => {
  const { id } = req.params
  const updateData = req.validatedData

  const column = await RBACColumn.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })

  if (!column) {
    return res.status(404).json({
      success: false,
      message: 'Column not found',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Column updated successfully',
    column,
  })
})

// Delete column (HR only)
export const deleteColumn = asyncHandler(async (req, res) => {
  const { id } = req.params

  const column = await RBACColumn.findById(id)
  if (!column) {
    return res.status(404).json({
      success: false,
      message: 'Column not found',
    })
  }

  const boardId = column.boardId

  // Move all tasks from this column to the first column before deletion
  const firstColumn = await RBACColumn.findOne({ boardId }).sort({ order: 1 })
  if (firstColumn) {
    await RBACTask.updateMany({ columnId: id }, { columnId: firstColumn._id })
  }

  // Remove column from board
  await RBACBoard.findByIdAndUpdate(boardId, {
    $pull: { columns: id },
  })

  // Delete column
  await RBACColumn.findByIdAndDelete(id)

  res.status(200).json({
    success: true,
    message: 'Column deleted successfully',
  })
})

// Reorder columns (HR only)
export const reorderColumns = asyncHandler(async (req, res) => {
  const { boardId } = req.params
  const { columns } = req.body // Array of { id, order }

  if (!Array.isArray(columns) || columns.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid columns data',
    })
  }

  // Update order for each column
  const updatePromises = columns.map((col) =>
    RBACColumn.findByIdAndUpdate(col.id, { order: col.order }, { new: true })
  )

  await Promise.all(updatePromises)

  const updatedColumns = await RBACColumn.find({ boardId }).sort({ order: 1 })

  res.status(200).json({
    success: true,
    message: 'Columns reordered successfully',
    columns: updatedColumns,
  })
})
