import RBACTask from '../models/RBACTask.js'
import RBACBoard from '../models/RBACBoard.js'
import RBACComment from '../models/RBACComment.js'
import RBACUser from '../models/RBACUser.js'
import { asyncHandler } from '../middleware/errorHandler.js'

// Get board task report
export const getBoardTaskReport = asyncHandler(async (req, res) => {
  const { boardId } = req.params
  const { startDate, endDate } = req.query

  // Verify board exists
  const board = await RBACBoard.findById(boardId)
  if (!board) {
    return res.status(404).json({
      success: false,
      message: 'Board not found',
    })
  }

  let query = { boardId, archived: false }

  // Date filter
  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) query.createdAt.$gte = new Date(startDate)
    if (endDate) query.createdAt.$lte = new Date(endDate)
  }

  // Get task statistics
  const totalTasks = await RBACTask.countDocuments(query)
  const completedTasks = await RBACTask.countDocuments({
    ...query,
    completedAt: { $ne: null },
  })
  const tasksByPriority = await RBACTask.aggregate([
    { $match: query },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
  ])

  const tasksByAssignee = await RBACTask.aggregate([
    { $match: query },
    { $unwind: '$assignees' },
    { $group: { _id: '$assignees', count: { $sum: 1 } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'assignee' } },
  ])

  const overdueTasks = await RBACTask.countDocuments({
    ...query,
    deadline: { $lt: new Date() },
    completedAt: null,
  })

  const avgCompletionTime = await RBACTask.aggregate([
    { $match: { ...query, completedAt: { $ne: null } } },
    {
      $group: {
        _id: null,
        avgDays: {
          $avg: {
            $divide: [
              { $subtract: ['$completedAt', '$createdAt'] },
              1000 * 60 * 60 * 24, // Convert to days
            ],
          },
        },
      },
    },
  ])

  res.status(200).json({
    success: true,
    report: {
      board: {
        id: board._id,
        title: board.title,
      },
      period: { startDate, endDate },
      taskStats: {
        total: totalTasks,
        completed: completedTasks,
        pending: totalTasks - completedTasks,
        completionRate:
          totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) + '%' : '0%',
        overdue: overdueTasks,
      },
      byPriority: tasksByPriority,
      byAssignee: tasksByAssignee,
      avgCompletionDays:
        avgCompletionTime.length > 0 ? avgCompletionTime[0].avgDays.toFixed(2) : 'N/A',
    },
  })
})

// Get employee performance report
export const getEmployeePerformanceReport = asyncHandler(async (req, res) => {
  const { userId } = req.params
  const { startDate, endDate } = req.query

  // Verify user exists
  const user = await RBACUser.findById(userId)
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    })
  }

  let query = { assignees: userId, archived: false }

  // Date filter
  if (startDate || endDate) {
    query.createdAt = {}
    if (startDate) query.createdAt.$gte = new Date(startDate)
    if (endDate) query.createdAt.$lte = new Date(endDate)
  }

  // Get task statistics
  const totalAssignedTasks = await RBACTask.countDocuments(query)
  const completedTasks = await RBACTask.countDocuments({
    ...query,
    completedAt: { $ne: null },
  })
  const overdueTasks = await RBACTask.countDocuments({
    ...query,
    deadline: { $lt: new Date() },
    completedAt: null,
  })

  const tasksByPriority = await RBACTask.aggregate([
    { $match: query },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
  ])

  const commentsMade = await RBACComment.countDocuments({
    userId,
  })

  const avgCompletionTime = await RBACTask.aggregate([
    { $match: { ...query, completedAt: { $ne: null } } },
    {
      $group: {
        _id: null,
        avgDays: {
          $avg: {
            $divide: [
              { $subtract: ['$completedAt', '$createdAt'] },
              1000 * 60 * 60 * 24,
            ],
          },
        },
      },
    },
  ])

  res.status(200).json({
    success: true,
    report: {
      employee: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
      },
      period: { startDate, endDate },
      taskStats: {
        assigned: totalAssignedTasks,
        completed: completedTasks,
        pending: totalAssignedTasks - completedTasks,
        completionRate:
          totalAssignedTasks > 0
            ? ((completedTasks / totalAssignedTasks) * 100).toFixed(2) + '%'
            : '0%',
        overdue: overdueTasks,
      },
      byPriority: tasksByPriority,
      commentsMade,
      avgCompletionDays:
        avgCompletionTime.length > 0 ? avgCompletionTime[0].avgDays.toFixed(2) : 'N/A',
    },
  })
})

// Get organization-wide report
export const getOrganizationReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query

  let taskQuery = {}

  // Date filter
  if (startDate || endDate) {
    taskQuery.createdAt = {}
    if (startDate) taskQuery.createdAt.$gte = new Date(startDate)
    if (endDate) taskQuery.createdAt.$lte = new Date(endDate)
  }

  // Get overall statistics
  const totalBoards = await RBACBoard.countDocuments({ archived: false })
  const totalTasks = await RBACTask.countDocuments(taskQuery)
  const completedTasks = await RBACTask.countDocuments({
    ...taskQuery,
    completedAt: { $ne: null },
  })
  const overdueTasks = await RBACTask.countDocuments({
    ...taskQuery,
    deadline: { $lt: new Date() },
    completedAt: null,
  })

  const totalUsers = await RBACUser.countDocuments({ isActive: true })
  const hrUsers = await RBACUser.countDocuments({ role: 'HR', isActive: true })
  const employeeUsers = await RBACUser.countDocuments({ role: 'Employee', isActive: true })

  const tasksByPriority = await RBACTask.aggregate([
    { $match: taskQuery },
    { $group: { _id: '$priority', count: { $sum: 1 } } },
  ])

  const topPerformers = await RBACTask.aggregate([
    { $match: taskQuery },
    { $unwind: '$assignees' },
    { $group: { _id: '$assignees', completedCount: { $sum: 1 } } },
    { $sort: { completedCount: -1 } },
    { $limit: 10 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
  ])

  res.status(200).json({
    success: true,
    report: {
      period: { startDate, endDate },
      overview: {
        totalBoards,
        totalUsers,
        hrUsers,
        employeeUsers,
      },
      taskStats: {
        total: totalTasks,
        completed: completedTasks,
        pending: totalTasks - completedTasks,
        completionRate:
          totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(2) + '%' : '0%',
        overdue: overdueTasks,
      },
      byPriority: tasksByPriority,
      topPerformers: topPerformers.map((performer) => ({
        userId: performer._id,
        name: performer.user[0]?.name,
        completedTasks: performer.completedCount,
      })),
    },
  })
})
