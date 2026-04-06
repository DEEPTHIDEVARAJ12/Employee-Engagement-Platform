import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'

// Original routes (RBAC-enabled system uses separate rbac-* routes instead)
// import authRoutes from './routes/auth.js'  // Use RBAC auth routes instead
// import userRoutes from './routes/users.js'  // Use RBAC user routes instead
import surveyRoutes from './routes/surveys.js'
import recognitionRoutes from './routes/recognitions.js'
import announcementRoutes from './routes/announcements.js'
import rewardRoutes from './routes/rewards.js'
import analyticsRoutes from './routes/analytics.js'
import notificationsRoutes from './routes/notifications.js'
import pulseRoutes from './routes/pulse.js'
import feedbackRoutes from './routes/feedback.js'
import eventsRoutes from './routes/events.js'
import commentsRoutes from './routes/comments.js'
import searchRoutes from './routes/search.js'
import exportRoutes from './routes/export.js'
import dashboardRoutes from './routes/dashboard.js'
import kanbanRoutes from './routes/kanban-new.js'
import employeesRoutes from './routes/employees.js'

// RBAC Kanban Board routes
import rbacAuthRoutes from './routes/rbac-auth-routes.js'
import rbacUserRoutes from './routes/rbac-user-routes.js'
import rbacBoardRoutes from './routes/rbac-board-routes.js'
import rbacColumnRoutes from './routes/rbac-column-routes.js'
import rbacTaskRoutes from './routes/rbac-task-routes.js'
import rbacCommentsAttachmentsRoutes from './routes/rbac-comments-attachments-routes.js'
import rbacNotificationRoutes from './routes/rbac-notification-routes.js'
import rbacReportRoutes from './routes/rbac-report-routes.js'

// Error handling
import { errorHandler } from './middleware/errorHandler.js'

import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()
const PORT = process.env.PORT || 5000
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://deepthidevaraj2005_db_user:1bX1oSAXfeprbuR7@worksphere.ojifpxg.mongodb.net/?appName=worksphere'

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5179', 'http://localhost:5180'], credentials: true }))
app.use(express.json())

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err))

// Mount routes
// app.use('/api/auth', authRoutes)  // Use RBAC auth routes instead
// app.use('/api/users', userRoutes)  // Use RBAC user routes instead
app.use('/api/surveys', surveyRoutes)
app.use('/api/recognitions', recognitionRoutes)
app.use('/api/announcements', announcementRoutes)
app.use('/api/rewards', rewardRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/pulse', pulseRoutes)
app.use('/api/feedback', feedbackRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/comments', commentsRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/employees', employeesRoutes)

// ==================== RBAC KANBAN BOARD ROUTES ====================
app.use('/api/rbac/auth', rbacAuthRoutes)
app.use('/api/rbac/users', rbacUserRoutes)
app.use('/api/rbac/boards', rbacBoardRoutes)
app.use('/api/rbac/columns', rbacColumnRoutes)
app.use('/api/rbac/tasks', rbacTaskRoutes)
app.use('/api/rbac/comments-attachments', rbacCommentsAttachmentsRoutes)
app.use('/api/rbac/notifications', rbacNotificationRoutes)
app.use('/api/rbac/reports', rbacReportRoutes)

// ==================== ERROR HANDLING ====================
app.use(errorHandler)

app.get('/api/health', (req, res) => res.json({ ok: true }))

const server = http.createServer(app)

let io = null

async function startServer() {
  // try to load socket.io dynamically; if unavailable, continue without realtime
  try {
    const sio = await import('socket.io')
    const IOServer = sio.Server || sio.default?.Server || sio
    io = new IOServer(server, { cors: { origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5179', 'http://localhost:5180'], credentials: true } })
    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id)
      // Allow clients to identify themselves so we can join per-user rooms
      socket.on('identify', (userId) => {
        try {
          if (userId) {
            socket.join(String(userId))
            console.log('Socket', socket.id, 'joined room for user', userId)
          }
        } catch (e) {
          console.warn('Failed to join user room', e)
        }
      })

      socket.on('disconnect', () => console.log('Socket disconnected:', socket.id))
    })
    try {
      // Lazy-set global IO for controllers to emit events
      const { setIO } = await import('./utils/io.js')
      setIO(io)
    } catch (e) {
      console.warn('Failed to set global io instance:', e)
    }
  } catch (err) {
    console.warn('socket.io not available; realtime disabled')
  }

  // attach kanban routes (routes handle missing io)
  app.use('/api/kanban', kanbanRoutes(io))

  // Serve built client when available (enables SPA refresh fallback)
  try {
    // Resolve client dist relative to repository root (two levels up from this file)
    const __dirname = path.dirname(fileURLToPath(import.meta.url))
    const clientDist = path.resolve(__dirname, '..', '..', 'client', 'dist')
    if (fs.existsSync(clientDist)) {
      app.use(express.static(clientDist))
      // Fallback for client-side routing — but avoid overriding API routes
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) return next()
        res.sendFile(path.join(clientDist, 'index.html'))
      })
      console.log('Serving client from', clientDist)
    }
  } catch (err) {
    console.warn('Error while trying to serve client:', err)
  }

  server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
}

startServer().catch((err) => {
  console.error('Failed to start server', err)
  process.exit(1)
})
