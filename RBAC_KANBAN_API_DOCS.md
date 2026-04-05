# 🎯 Role-Based Kanban Board API Documentation

## Overview

This is a comprehensive **Role-Based Access Control (RBAC)** Kanban Board backend system built with **Node.js**, **Express.js**, and **MongoDB (Mongoose)**.

### Key Features
- **JWT-based Authentication** with secure password hashing (bcryptjs)
- **Role-Based Access Control** (HR and Employee roles)
- **Complete Kanban functionality** with boards, columns, and tasks
- **Comments system** with user mentions
- **File attachments** support
- **Notification system** for task assignments and updates
- **Comprehensive reporting** and analytics for HR
- **Input validation** with Joi
- **Error handling** middleware

---

## Architecture

### Project Structure

```
server/src/
├── models/
│   ├── RBACUser.js              # User model with authentication
│   ├── RBACBoard.js             # Board model
│   ├── RBACColumn.js            # Column model
│   ├── RBACTask.js              # Task model
│   ├── RBACComment.js           # Comment model
│   ├── RBACAttachment.js        # Attachment model
│   └── RBACNotification.js      # Notification model
├── controllers/
│   ├── rbac-auth-controller.js          # Authentication logic
│   ├── rbac-user-controller.js          # User management
│   ├── rbac-board-controller.js         # Board CRUD & management
│   ├── rbac-column-controller.js        # Column CRUD & management
│   ├── rbac-task-controller.js          # Task CRUD & management
│   ├── rbac-comments-attachments-controller.js  # Comments & attachments
│   ├── rbac-notification-controller.js          # Notifications
│   └── rbac-report-controller.js                # Reports & analytics
├── routes/
│   ├── rbac-auth-routes.js
│   ├── rbac-user-routes.js
│   ├── rbac-board-routes.js
│   ├── rbac-column-routes.js
│   ├── rbac-task-routes.js
│   ├── rbac-comments-attachments-routes.js
│   ├── rbac-notification-routes.js
│   └── rbac-report-routes.js
├── middleware/
│   ├── rbac-auth.js             # JWT & role authentication middleware
│   ├── validation.js            # Input validation middleware (Joi)
│   └── errorHandler.js          # Global error handling
└── index.js                     # Server entry point
```

---

## Authentication

### User Registration

**Endpoint:** `POST /api/rbac/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "HR" // or "Employee"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "HR"
  }
}
```

### User Login

**Endpoint:** `POST /api/rbac/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "HR",
    "department": "Human Resources"
  }
}
```

### Get Current User

**Endpoint:** `GET /api/rbac/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "HR",
    "department": "Human Resources",
    "avatar": "https://...",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## User Management

### Get All Users (HR Only)

**Endpoint:** `GET /api/rbac/users`

**Query Parameters:**
- `role` - Filter by role (HR, Employee)
- `department` - Filter by department
- `search` - Search by name or email

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "count": 25,
  "users": [...]
}
```

### Get User by ID

**Endpoint:** `GET /api/rbac/users/:id`

**Headers:**
```
Authorization: Bearer <token>
```

### Create User (HR Only)

**Endpoint:** `POST /api/rbac/users`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "password": "password123",
  "role": "Employee",
  "department": "Engineering"
}
```

### Update Profile

**Endpoint:** `PATCH /api/rbac/users/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Doe Updated",
  "department": "HR"
}
```

### Get User Statistics (HR Only)

**Endpoint:** `GET /api/rbac/users/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 50,
    "hr": 5,
    "employees": 45,
    "active": 48,
    "inactive": 2
  }
}
```

---

## Board Management

### Get All Boards

**Endpoint:** `GET /api/rbac/boards`

**Headers:**
```
Authorization: Bearer <token>
```

**Note:** HR users see all boards. Employees only see boards they're members of.

**Response:**
```json
{
  "success": true,
  "count": 5,
  "boards": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "title": "Q1 2024 Planning",
      "description": "Project planning for Q1",
      "createdBy": { "id": "...", "name": "John Doe", "email": "..." },
      "members": [...],
      "columns": [...],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Single Board

**Endpoint:** `GET /api/rbac/boards/:id`

**Headers:**
```
Authorization: Bearer <token>
```

### Create Board (HR Only)

**Endpoint:** `POST /api/rbac/boards`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Q1 2024 Planning",
  "description": "Project planning for Q1 initiatives"
}
```

**Note:** Default columns are automatically created (To Do, In Progress, Review, Completed)

### Update Board (HR Only)

**Endpoint:** `PUT /api/rbac/boards/:id`

**Request Body:**
```json
{
  "title": "Q1 2024 Planning Updated",
  "description": "Updated description"
}
```

### Delete Board (HR Only)

**Endpoint:** `DELETE /api/rbac/boards/:id`

**Note:** Soft delete - board is archived but not permanently deleted

### Add Board Member (HR Only)

**Endpoint:** `POST /api/rbac/boards/:id/members`

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439012"
}
```

### Get Board Statistics

**Endpoint:** `GET /api/rbac/boards/:id/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalTasks": 45,
    "completedTasks": 28,
    "pendingTasks": 17,
    "tasksByPriority": [
      { "_id": "High", "count": 15 },
      { "_id": "Medium", "count": 20 },
      { "_id": "Low", "count": 10 }
    ]
  }
}
```

---

## Task Management

### Get All Tasks for a Board

**Endpoint:** `GET /api/rbac/tasks/board/:boardId`

**Query Parameters:**
- `columnId` - Filter by column
- `priority` - Filter by priority (Low, Medium, High, Urgent)
- `assignedTo` - Filter by assignee ID
- `search` - Search by title or description

**Headers:**
```
Authorization: Bearer <token>
```

**Note:** Employees only see tasks assigned to them

### Create Task (HR Only)

**Endpoint:** `POST /api/rbac/tasks/board/:boardId`

**Request Body:**
```json
{
  "title": "Design new homepage",
  "description": "Create mockups and wireframes for homepage redesign",
  "priority": "High",
  "deadline": "2024-02-15",
  "columnId": "507f1f77bcf86cd799439013",
  "assignees": ["507f1f77bcf86cd799439014", "507f1f77bcf86cd799439015"],
  "tags": ["design", "website"]
}
```

### Get Single Task

**Endpoint:** `GET /api/rbac/tasks/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "task": {
    "_id": "507f1f77bcf86cd799439016",
    "title": "Design new homepage",
    "description": "Create mockups for homepage",
    "priority": "High",
    "deadline": "2024-02-15",
    "columnId": { "_id": "...", "title": "In Progress" },
    "boardId": "507f1f77bcf86cd799439011",
    "createdBy": { "id": "...", "name": "John Doe" },
    "assignees": [...],
    "comments": [...],
    "attachments": [...],
    "tags": ["design", "website"],
    "archived": false,
    "completedAt": null,
    "createdAt": "2024-01-20T14:30:00Z"
  }
}
```

### Update Task

**Endpoint:** `PUT /api/rbac/tasks/:id`

**Request Body:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "Medium",
  "deadline": "2024-02-20",
  "assignees": ["507f1f77bcf86cd799439014"],
  "tags": ["design"]
}
```

**Note:** Employees can only update assigned tasks (not assignees). HR can update all fields.

### Move Task to Another Column

**Endpoint:** `PATCH /api/rbac/tasks/:id/move`

**Request Body:**
```json
{
  "columnId": "507f1f77bcf86cd799439018"
}
```

**Note:** Employees can only move assigned tasks. Moving to "Completed" column marks task as completed.

### Delete Task (HR Only)

**Endpoint:** `DELETE /api/rbac/tasks/:id`

**Note:** Soft delete - task is archived

### Archive All Completed Tasks (HR Only)

**Endpoint:** `POST /api/rbac/tasks/board/:boardId/archive-completed`

### Get Task Statistics

**Endpoint:** `GET /api/rbac/tasks/board/:boardId/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 45,
    "completed": 28,
    "pending": 17,
    "overdue": 3,
    "byPriority": [
      { "_id": "High", "count": 15 }
    ]
  }
}
```

---

## Comments & Attachments

### Get Comments for a Task

**Endpoint:** `GET /api/rbac/comments-attachments/task/:taskId/comments`

**Response:**
```json
{
  "success": true,
  "count": 3,
  "comments": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "taskId": "...",
      "userId": { "id": "...", "name": "John Doe", "email": "..." },
      "message": "Great progress on this task!",
      "createdAt": "2024-01-22T10:15:00Z"
    }
  ]
}
```

### Add Comment to Task

**Endpoint:** `POST /api/rbac/comments-attachments/task/:taskId/comments`

**Request Body:**
```json
{
  "message": "Looking good! Please make sure to test this thoroughly"
}
```

### Delete Comment

**Endpoint:** `DELETE /api/rbac/comments-attachments/comments/:commentId`

**Note:** Only comment author or HR can delete

### Upload Attachment

**Endpoint:** `POST /api/rbac/comments-attachments/task/:taskId/attachments`

**Request Body:**
```json
{
  "fileName": "design-mockup.pdf",
  "fileUrl": "https://storage.example.com/files/design-mockup.pdf",
  "fileSize": 2048576,
  "fileType": "application/pdf"
}
```

### Get Attachments for a Task

**Endpoint:** `GET /api/rbac/comments-attachments/task/:taskId/attachments`

### Delete Attachment

**Endpoint:** `DELETE /api/rbac/comments-attachments/attachments/:attachmentId`

---

## Notifications

### Get Notifications

**Endpoint:** `GET /api/rbac/notifications`

**Query Parameters:**
- `limit` - Number of notifications (default: 20)
- `skip` - Number to skip for pagination
- `isRead` - Filter by read status (true/false)

**Response:**
```json
{
  "success": true,
  "total": 15,
  "unreadCount": 3,
  "notifications": [
    {
      "_id": "...",
      "userId": "...",
      "type": "task_assigned",
      "taskId": { "_id": "...", "title": "Design homepage" },
      "message": "You have been assigned a new task: \"Design homepage\"",
      "isRead": false,
      "triggeredBy": { "id": "...", "name": "John Doe" },
      "createdAt": "2024-01-23T10:30:00Z"
    }
  ]
}
```

### Mark Notification as Read

**Endpoint:** `PATCH /api/rbac/notifications/:id/read`

### Mark All as Read

**Endpoint:** `PATCH /api/rbac/notifications/read-all`

### Get Unread Count

**Endpoint:** `GET /api/rbac/notifications/unread-count`

**Response:**
```json
{
  "success": true,
  "unreadCount": 3
}
```

### Delete Notification

**Endpoint:** `DELETE /api/rbac/notifications/:id`

### Clear All Notifications

**Endpoint:** `DELETE /api/rbac/notifications`

---

## Reports & Analytics (HR Only)

### Get Board Task Report

**Endpoint:** `GET /api/rbac/reports/board/:boardId`

**Query Parameters:**
- `startDate` - ISO format date
- `endDate` - ISO format date

**Response:**
```json
{
  "success": true,
  "report": {
    "board": { "id": "...", "title": "Q1 Planning" },
    "taskStats": {
      "total": 45,
      "completed": 28,
      "pending": 17,
      "completionRate": "62.22%",
      "overdue": 2
    },
    "byPriority": [...],
    "byAssignee": [...],
    "avgCompletionDays": "3.45"
  }
}
```

### Get Employee Performance Report

**Endpoint:** `GET /api/rbac/reports/employee/:userId`

**Query Parameters:**
- `startDate` - ISO format date
- `endDate` - ISO format date

### Get Organization-Wide Report

**Endpoint:** `GET /api/rbac/reports/organization`

**Query Parameters:**
- `startDate` - ISO format date
- `endDate` - ISO format date

**Response:**
```json
{
  "success": true,
  "report": {
    "overview": {
      "totalBoards": 15,
      "totalUsers": 50,
      "hrUsers": 5,
      "employeeUsers": 45
    },
    "taskStats": {...},
    "byPriority": [...],
    "topPerformers": [...]
  }
}
```

---

## Error Handling

All endpoints return errors in consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## Authentication Headers

All authenticated endpoints require:

```
Authorization: Bearer <JWT_TOKEN>
```

Token expires in 7 days. Users must login again to obtain a new token.

---

## Role-Based Permissions

### HR Role Can:
- ✅ Create, edit, delete boards
- ✅ Create, edit, delete columns
- ✅ Create, edit, delete tasks
- ✅ Assign tasks to employees
- ✅ View all tasks across all boards
- ✅ View all users
- ✅ Create users
- ✅ Delete comments/attachments
- ✅ Generate reports and analytics
- ✅ Archive completed tasks

### Employee Role Can:
- ✅ View only assigned tasks
- ✅ Move assigned tasks between columns
- ✅ Add comments to assigned tasks
- ✅ Upload attachments to assigned tasks
- ✅ View only their own profile
- ❌ Cannot create tasks
- ❌ Cannot assign tasks
- ❌ Cannot delete tasks
- ❌ Cannot view other employees' tasks
- ❌ Cannot access reports

---

## Example Workflow

### 1. Register
```
POST /api/rbac/auth/register
→ Get JWT token
```

### 2. Login (next time)
```
POST /api/rbac/auth/login
→ Get JWT token
```

### 3. Create Board (HR)
```
POST /api/rbac/boards
→ Board created with default columns
```

### 4. Create Task (HR)
```
POST /api/rbac/tasks/board/:boardId
→ Task created and notifications sent to assignees
```

### 5. Employee Receives Notification
```
GET /api/rbac/notifications
→ See task assignment notification
```

### 6. Employee Updates Task Status
```
PATCH /api/rbac/tasks/:taskId/move
→ Move task to "In Progress" column
```

### 7. Employee Adds Comment
```
POST /api/rbac/comments-attachments/task/:taskId/comments
→ Comment added, notifications sent to task creator and other assignees
```

### 8. HR Generates Report
```
GET /api/rbac/reports/board/:boardId
→ View task completion rates, statistics, etc.
```

---

## Installation & Setup

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env

# Connect to MongoDB
# Ensure MongoDB is running on localhost:27017 or update MONGO_URI

# Start server
npm start

# Development mode with auto-reload
npm run dev
```

---

## Security Best Practices

✅ **Implemented:**
- JWT token-based authentication
- Bcrypt password hashing (10 salt rounds)
- Role-Based Access Control (RBAC)
- Input validation with Joi
- Secure error messages (no sensitive data leaked)
- MongoDB injection prevention
- CORS configured

⚠️ **Additional Recommendations:**
- Use rate limiting middleware
- Implement API keys for third-party access
- Add logging and monitoring
- Use HTTPS in production
- Add two-factor authentication (2FA)
- Regular security audits

---

## License

MIT

---

**Built with ❤️ using Node.js, Express, and MongoDB**
