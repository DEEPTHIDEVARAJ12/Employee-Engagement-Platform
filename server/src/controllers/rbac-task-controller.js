import RBACTask from '../models/RBACTask.js'
import RBACBoard from '../models/RBACBoard.js'
import RBACColumn from '../models/RBACColumn.js'
import RBACNotification from '../models/RBACNotification.js'
import RBACUser from '../models/RBACUser.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { getIO } from '../utils/io.js'

function normalizeColumnTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function findWorkflowColumn(columns, key) {
  const matcher = normalizeColumnTitle(key)
  return (columns || []).find((col) => {
    const value = normalizeColumnTitle(col.title)
    return value === matcher || value.includes(matcher)
  })
}

async function validateAssignableEmployees(assigneeIds) {
  if (!Array.isArray(assigneeIds) || assigneeIds.length === 0) {
    return { ok: false, message: 'Please assign the task to at least one employee.' }
  }

  const uniqueIds = [...new Set(assigneeIds.map((id) => id.toString()))]
  const users = await RBACUser.find({
    _id: { $in: uniqueIds },
    role: 'Employee',
    $or: [{ status: 'Active' }, { status: { $exists: false }, isActive: true }],
  }).select('_id')

  if (users.length !== uniqueIds.length) {
    return { ok: false, message: 'One or more selected assignees are invalid, inactive, or not employees.' }
  }

  return { ok: true, assignees: uniqueIds }
}

// Create new task (HR only)
export const createTask = asyncHandler(async (req, res) => {
  const boardId = req.params.boardId || req.validatedData?.boardId || req.body?.boardId
  const { title, description, priority, deadline, columnId, assignees, tags } = req.validatedData || {}

  // Validate assignees are provided and non-empty for non-admins.
  // Allow Admin to create unassigned tasks (e.g., when converting suggestions to tasks).
  let assigneeValidation = { ok: true, assignees: [] }
  if (!assignees || assignees.length === 0) {
    if (req.userRole !== 'Admin') {
      return res.status(400).json({
        success: false,
        message: 'Please assign the task to at least one employee.',
      })
    }
    // Admin: allow empty assignees (unassigned task)
    assigneeValidation = { ok: true, assignees: [] }
  } else {
    assigneeValidation = await validateAssignableEmployees(assignees)
    if (!assigneeValidation.ok) {
      return res.status(400).json({
        success: false,
        message: assigneeValidation.message,
      })
    }
  }

  // Verify board exists
  const board = await RBACBoard.findById(boardId).populate('columns')
  if (!board) {
    return res.status(404).json({
      success: false,
      message: 'Board not found',
    })
  }

  // Verify column exists
  const column = await RBACColumn.findById(columnId)
  if (!column) {
    return res.status(404).json({
      success: false,
      message: 'Column not found',
    })
  }

  if (req.userRole === 'HR') {
    const todoColumn = findWorkflowColumn(board.columns, 'todo')
    const todoColumnId = todoColumn?._id?.toString?.()
    if (todoColumnId && columnId.toString() !== todoColumnId) {
      return res.status(403).json({
        success: false,
        message: 'HR can create tasks only in the To Do column.',
      })
    }
  }

  // Create task with validated assignees
  const task = await RBACTask.create({
    title,
    description: description || '',
    priority: priority || 'Medium',
    deadline: deadline || null,
    columnId,
    boardId,
    createdBy: req.userId,
    assignees: assigneeValidation.assignees,
    tags: tags || [],
  })

  // Ensure assigned employees can access the board in their Kanban view.
  await RBACBoard.findByIdAndUpdate(boardId, {
    $addToSet: { members: { $each: assigneeValidation.assignees } },
  })

  // Populate the task
  const populatedTask = await RBACTask.findById(task._id)
    .populate('createdBy', 'name email')
    .populate('assignees', 'name email')

  // Send notifications to assignees
  if (assignees && assignees.length > 0) {
    const notifications = assignees.map((userId) => ({
      userId,
      type: 'task_assigned',
      taskId: task._id,
      boardId,
      message: `You have been assigned a new task: "${title}"`,
      triggeredBy: req.userId,
    }))
    await RBACNotification.insertMany(notifications)
    // Emit realtime notification event when socket.io is available
    try {
      const io = getIO()
      if (io) {
        notifications.forEach((n) => io.emit('notification', { to: n.userId?.toString?.() || n.userId, payload: n }))
      }
    } catch (e) {
      console.warn('Failed to emit task_assigned notifications via socket:', e)
    }
  }

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    task: populatedTask,
  })
})

// Get all tasks for a board
export const getTasks = asyncHandler(async (req, res) => {
  const boardId = req.params.boardId || req.query.boardId
  const { columnId, priority, assignedTo, search } = req.query || {}

  // Debug: log incoming query to help trace 'match' errors
  console.debug('getTasks() params:', { params: req.params, query: req.query, userId: req.userId, userRole: req.userRole })

  let query = { archived: false }

  if (boardId) query.boardId = boardId

  // Filter by column if provided
  if (columnId) {
    query.columnId = columnId
  }

  // Filter by priority if provided
  if (priority) {
    query.priority = priority
  }

  // Filter by assignee
  if (assignedTo) {
    query.assignees = assignedTo
  }

  // Search by title or description
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ]
  }

  // Employees can only see tasks assigned to them
  if (req.userRole === 'Employee') {
    query.assignees = req.userId
  }

  const tasks = await RBACTask.find(query)
    .populate('createdBy', 'name email')
    .populate('assignees', 'name email')
    .populate('columnId', 'title')
    .sort({ createdAt: -1 })

  res.status(200).json({
    success: true,
    count: tasks.length,
    tasks,
  })
})

// Get single task
export const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params

  const task = await RBACTask.findById(id)
    .populate('createdBy', 'name email')
    .populate('assignees', 'name email')
    .populate('columnId')
    .populate('comments')
    .populate('attachments')

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    })
  }

  // Check access - Employees can only see their assigned tasks
  if (req.userRole === 'Employee' && !task.assignees.some((a) => a._id.toString() === req.userId)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this task',
    })
  }

  res.status(200).json({
    success: true,
    task,
  })
})

// Update task
export const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { title, description, priority, deadline, assignees, tags } = req.validatedData

  const task = await RBACTask.findById(id)
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    })
  }

  // Check authorization - HR can update all, Employees can only update assigned tasks
  const isAssigned = task.assignees.some((a) => a.toString() === req.userId.toString())
  if (req.userRole === 'Employee' && !isAssigned) {
    return res.status(403).json({
      success: false,
      message: 'You can only update assigned tasks',
    })
  }

  // Employees can't update assignees
  const updateData = { title, description, priority, deadline, tags }
  if (assignees && (req.userRole === 'HR' || req.userRole === 'Admin')) {
    const assigneeValidation = await validateAssignableEmployees(assignees)
    if (!assigneeValidation.ok) {
      return res.status(400).json({
        success: false,
        message: assigneeValidation.message,
      })
    }
    updateData.assignees = assigneeValidation.assignees
    await RBACBoard.findByIdAndUpdate(task.boardId, {
      $addToSet: { members: { $each: assigneeValidation.assignees } },
    })
  }

  const updatedTask = await RBACTask.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('createdBy', 'name email')
    .populate('assignees', 'name email')

  const notificationUsers = updatedTask.assignees.map((u) => u._id?.toString?.() || u.toString())
  const notifications = [...new Set(notificationUsers)]
    .filter((userId) => userId !== req.userId.toString())
    .map((userId) => ({
      userId,
      type: 'task_updated',
      taskId: updatedTask._id,
      boardId: updatedTask.boardId,
      message: `Task "${updatedTask.title}" was updated`,
      triggeredBy: req.userId,
    }))
  if (notifications.length > 0) await RBACNotification.insertMany(notifications)

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    task: updatedTask,
  })
})

// Move task to another column
export const moveTask = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { columnId } = req.validatedData

  const task = await RBACTask.findById(id)
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    })
  }

  // Verify that Employees can only move assigned tasks
  const isAssigned = task.assignees.some((a) => a.toString() === req.userId.toString())
  if (req.userRole === 'Employee' && !isAssigned) {
    return res.status(403).json({
      success: false,
      message: 'You can only move assigned tasks',
    })
  }

  // Verify column exists
  const column = await RBACColumn.findById(columnId)
  if (!column) {
    return res.status(404).json({
      success: false,
      message: 'Column not found',
    })
  }

  // Load board columns to enforce role-based workflow transitions
  const board = await RBACBoard.findById(task.boardId).populate('columns')
  if (!board) {
    return res.status(404).json({ success: false, message: 'Board not found' })
  }

  const toDoColumn = findWorkflowColumn(board.columns, 'todo')
  const inProgressColumn = findWorkflowColumn(board.columns, 'inprogress')
  const reviewColumn = findWorkflowColumn(board.columns, 'review')
  const completedColumn = findWorkflowColumn(board.columns, 'completed')

  const toDoId = toDoColumn?._id?.toString?.()
  const inProgressId = inProgressColumn?._id?.toString?.()
  const reviewId = reviewColumn?._id?.toString?.()
  const completedId = completedColumn?._id?.toString?.()
  const fromId = task.columnId?.toString?.()
  const toId = columnId?.toString?.()

  if (req.userRole === 'Employee') {
    const allowed =
      (fromId === toDoId && toId === inProgressId) ||
      (fromId === inProgressId && toId === reviewId)
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          'Employees can only move tasks from To Do to In Progress, and In Progress to Review.',
      })
    }
  }

  if (req.userRole === 'HR') {
    const allowed =
      fromId === reviewId && (toId === completedId || toId === inProgressId)
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message:
          'HR can only move tasks from Review to Completed (approve) or back to In Progress (reject).',
      })
    }
  }

  const oldColumnId = task.columnId.toString()
  task.columnId = columnId

  // Mark as completed if moved to Completed column
  if (completedId && toId === completedId) {
    task.completedAt = new Date()
  } else {
    task.completedAt = null
  }

  await task.save()

  // If moved to Review column, notify HR members
    try {
      if (column.title && String(column.title).toLowerCase().includes('review')) {
        // Prefer notifying the task creator if they are HR/Admin (i.e., the assigner)
        let recipientIds = []
        try {
          const creator = await RBACUser.findById(task.createdBy).select('_id role')
          if (creator && ['HR', 'Admin'].includes(creator.role)) {
            recipientIds.push(creator._id)
          }
        } catch (e) {
          // ignore
        }

        // Fallback: notify all HR/Admin members of the board
        if (recipientIds.length === 0) {
          const reviewers = await RBACUser.find({
            _id: { $in: board.members || [] },
            role: { $in: ['HR', 'Admin'] },
          }).select('_id')
          recipientIds = (reviewers || []).map((u) => (u && u._id ? u._id.toString() : String(u)))
        }

        // Deduplicate and remove falsy
        recipientIds = [...new Set((recipientIds || []).filter(Boolean).map((id) => id.toString()))]

        const hrNotifications = recipientIds.map((userId) => ({
          userId,
          type: 'task_submitted_for_review',
          taskId: task._id,
          boardId: task.boardId,
          message: `Task "${task.title}" was submitted for review`,
          triggeredBy: req.userId,
        }))

        if (hrNotifications.length > 0) await RBACNotification.insertMany(hrNotifications)
        // Emit realtime notification to HR recipients (per-user rooms when available)
        try {
          const io = getIO()
          if (io) {
            hrNotifications.forEach((n) => {
              const target = n.userId?.toString?.() || n.userId
              // Prefer room delivery; fall back to broadcast
              if (target && io.to) {
                io.to(target).emit('notification', { to: target, payload: n })
              } else {
                io.emit('notification', { to: target, payload: n })
              }
            })
          }
        } catch (e) {
          console.warn('Failed to emit HR review notifications via socket:', e)
        }
      }
    } catch (notifErr) {
      console.error('Failed to send HR review notifications:', notifErr)
    }

  // Send notifications to assignees
  const assigneeNotifications = task.assignees.map((userId) => ({
    userId,
    type: 'task_moved',
    taskId: task._id,
    message: `Task "${task.title}" was moved to ${column.title}`,
    triggeredBy: req.userId,
  }))
  await RBACNotification.insertMany(assigneeNotifications)
  try {
    const io = getIO()
    if (io) {
      assigneeNotifications.forEach((n) => io.emit('notification', { to: n.userId?.toString?.() || n.userId, payload: n }))
    }
  } catch (e) {
    console.warn('Failed to emit assignee notifications via socket:', e)
  }

  const updatedTask = await RBACTask.findById(id)
    .populate('createdBy', 'name email')
    .populate('assignees', 'name email')
    .populate('columnId')

  res.status(200).json({
    success: true,
    message: 'Task moved successfully',
    task: updatedTask,
  })
})

// Delete task (HR only)
export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params

  const task = await RBACTask.findByIdAndUpdate(id, { archived: true }, { new: true })

  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    })
  }

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
  })
})

// Archive all completed tasks (HR only)
export const archiveCompletedTasks = asyncHandler(async (req, res) => {
  const { boardId } = req.params

  // Find the last column (typically "Completed")
  const board = await RBACBoard.findById(boardId).populate('columns')
  if (!board) {
    return res.status(404).json({
      success: false,
      message: 'Board not found',
    })
  }

  const completedColumn = board.columns[board.columns.length - 1]

  const result = await RBACTask.updateMany(
    { boardId, columnId: completedColumn._id, archived: false },
    { archived: true, completedAt: new Date() }
  )

  res.status(200).json({
    success: true,
    message: 'Completed tasks archived',
    archivedCount: result.modifiedCount,
  })
})

// Get task statistics
export const getTaskStats = asyncHandler(async (req, res) => {
  const { boardId } = req.params

  const totalTasks = await RBACTask.countDocuments({ boardId, archived: false })
  const completedTasks = await RBACTask.countDocuments({
    boardId,
    archived: false,
    completedAt: { $ne: null },
  })
  const tasksByPriority = await RBACTask.aggregate([
    { $match: { boardId: boardId, archived: false } },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
  ])
  const overdueTasks = await RBACTask.countDocuments({
    boardId,
    archived: false,
    deadline: { $lt: new Date() },
    completedAt: null,
  })

  res.status(200).json({
    success: true,
    stats: {
      total: totalTasks,
      completed: completedTasks,
      pending: totalTasks - completedTasks,
      overdue: overdueTasks,
      byPriority: tasksByPriority,
    },
  })
})
