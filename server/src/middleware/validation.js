import Joi from 'joi'

// Validation schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
    role: Joi.string().valid('Admin', 'HR', 'Employee').required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  createBoard: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).optional(),
  }),

  updateBoard: Joi.object({
    title: Joi.string().min(3).max(100).optional(),
    description: Joi.string().max(500).optional(),
  }),

  createColumn: Joi.object({
    title: Joi.string().min(2).max(50).required(),
    description: Joi.string().max(300).optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  }),
  apiCreateColumn: Joi.object({
    title: Joi.string().min(2).max(50).required(),
    boardId: Joi.string().required(),
    description: Joi.string().max(300).optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  }),

  updateColumn: Joi.object({
    title: Joi.string().min(2).max(50).optional(),
    description: Joi.string().max(300).optional(),
    order: Joi.number().integer().min(0).optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  }),
  apiUpdateColumn: Joi.object({
    title: Joi.string().min(2).max(50).optional(),
    description: Joi.string().max(300).optional(),
    order: Joi.number().integer().min(0).optional(),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
  }),

  createTask: Joi.object({
    title: Joi.string().min(3).max(150).required(),
    description: Joi.string().max(2000).optional(),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent').optional(),
    deadline: Joi.date().iso().optional(),
    columnId: Joi.string().required(),
    assignees: Joi.array().items(Joi.string()).min(1).required(),
    tags: Joi.array().items(Joi.string()).optional(),
  }),
  apiCreateTask: Joi.object({
    title: Joi.string().min(3).max(150).required(),
    boardId: Joi.string().required(),
    description: Joi.string().max(2000).optional(),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent').optional(),
    deadline: Joi.date().iso().optional(),
    columnId: Joi.string().required(),
    assignees: Joi.array().items(Joi.string()).min(1).required(),
    tags: Joi.array().items(Joi.string()).optional(),
  }),

  updateTask: Joi.object({
    title: Joi.string().min(3).max(150).optional(),
    description: Joi.string().max(2000).optional(),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent').optional(),
    deadline: Joi.date().iso().optional(),
    assignees: Joi.array().items(Joi.string()).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }),
  apiUpdateTask: Joi.object({
    title: Joi.string().min(3).max(150).optional(),
    description: Joi.string().max(2000).optional(),
    priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent').optional(),
    deadline: Joi.date().iso().optional(),
    assignees: Joi.array().items(Joi.string()).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }),

  moveTask: Joi.object({
    columnId: Joi.string().required(),
  }),

  createComment: Joi.object({
    message: Joi.string().min(1).max(1000).required(),
  }),
  apiCreateAttachment: Joi.object({
    fileName: Joi.string().min(1).max(255).required(),
    fileUrl: Joi.string().uri().required(),
    fileSize: Joi.number().min(0).optional(),
    fileType: Joi.string().max(255).optional(),
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    department: Joi.string().max(50).optional(),
  }),
}

// Validation middleware factory
export const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName]
    if (!schema) {
      return res.status(500).json({
        success: false,
        message: 'Validation schema not found.',
      })
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    })

    if (error) {
      const messages = error.details.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }))
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages,
      })
    }

    req.validatedData = value
    next()
  }
}

// Validate MongoDB ObjectId
export const validateObjectId = (req, res, next) => {
  // Validate any route params that look like ids (id, *Id)
  const params = req.params || {}
  for (const [key, val] of Object.entries(params)) {
    if (key === 'id' || key.toLowerCase().endsWith('id')) {
      if (!val || typeof val !== 'string' || !/^[0-9a-fA-F]{24}$/.test(val)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ID format for parameter '${key}'.`,
        })
      }
    }
  }
  next()
}
