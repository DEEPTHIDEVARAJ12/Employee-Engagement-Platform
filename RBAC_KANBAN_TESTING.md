# 🧪 RBAC Kanban Board - Complete Testing Guide

## Test Accounts

Use these accounts for testing:

### HR Account
```
Email:    hr@company.com
Password: HRPassword123
Role:     HR
```

### Employee Account 1
```
Email:    employee1@company.com
Password: EmpPassword123
Role:     Employee
```

### Employee Account 2
```
Email:    employee2@company.com
Password: EmpPassword456
Role:     Employee
```

---

## Setup Steps

### 1. Start the Server
```bash
cd server
npm install
npm start
```

Server should be running on `http://localhost:5000`

### 2. Reset Data (Optional)
If you want to start fresh:
```bash
# Delete all data from MongoDB (development only)
# Connect to MongoDB and run:
db.users.deleteMany({})
db.boards.deleteMany({})
db.columns.deleteMany({})
db.tasks.deleteMany({})
db.comments.deleteMany({})
db.attachments.deleteMany({})
db.notifications.deleteMany({})
```

---

## Test Scenarios

### Scenario 1: User Registration & Login

#### Test 1.1: Register HR User
```bash
curl -X POST http://localhost:5000/api/rbac/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice HR Manager",
    "email": "hr@company.com",
    "password": "HRPassword123",
    "role": "HR"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123456...",
    "name": "Alice HR Manager",
    "email": "hr@company.com",
    "role": "HR"
  }
}
```

**Test:** ✅ Save the token for subsequent requests

#### Test 1.2: Register Employee Users
```bash
# Employee 1
curl -X POST http://localhost:5000/api/rbac/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Developer",
    "email": "employee1@company.com",
    "password": "EmpPassword123",
    "role": "Employee"
  }'

# Employee 2
curl -X POST http://localhost:5000/api/rbac/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Carol Designer",
    "email": "employee2@company.com",
    "password": "EmpPassword456",
    "role": "Employee"
  }'
```

**Expected Response:** Same format as 1.1, save both tokens

#### Test 1.3: Login
```bash
curl -X POST http://localhost:5000/api/rbac/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hr@company.com",
    "password": "HRPassword123"
  }'
```

**Expected:** Returns token and user info

**Test:** ✅ Token should allow authenticated requests

#### Test 1.4: Get Current User
```bash
curl -X GET http://localhost:5000/api/rbac/auth/me \
  -H "Authorization: Bearer HR_TOKEN"
```

**Expected:** Returns current user details

---

### Scenario 2: Board Management (HR Only)

#### Test 2.1: Create Board
```bash
curl -X POST http://localhost:5000/api/rbac/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer HR_TOKEN" \
  -d '{
    "title": "Q1 2024 Project",
    "description": "Main project for Q1 planning and execution"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Board created successfully",
  "board": {
    "_id": "BOARD_ID",
    "title": "Q1 2024 Project",
    "columns": [
      { "_id": "COL1", "title": "To Do", "order": 1 },
      { "_id": "COL2", "title": "In Progress", "order": 2 },
      { "_id": "COL3", "title": "Review", "order": 3 },
      { "_id": "COL4", "title": "Completed", "order": 4 }
    ]
  }
}
```

**Test:** ✅ Save BOARD_ID and column IDs for next tests

#### Test 2.2: Get All Boards
```bash
curl -X GET http://localhost:5000/api/rbac/boards \
  -H "Authorization: Bearer HR_TOKEN"
```

**Expected:** HR sees all boards, Employee sees only assigned boards

#### Test 2.3: Get Board Details
```bash
curl -X GET http://localhost:5000/api/rbac/boards/BOARD_ID \
  -H "Authorization: Bearer HR_TOKEN"
```

**Expected:** Full board details with columns

#### Test 2.4: Add Board Members
```bash
curl -X POST http://localhost:5000/api/rbac/boards/BOARD_ID/members \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer HR_TOKEN" \
  -d '{
    "userId": "EMPLOYEE1_ID"
  }'
```

**Test:** ✅ Make both employees board members

#### Test 2.5: Update Board
```bash
curl -X PUT http://localhost:5000/api/rbac/boards/BOARD_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer HR_TOKEN" \
  -d '{
    "title": "Q1 2024 Project - Updated",
    "description": "Updated description"
  }'
```

**Expected:** Board title and description updated

#### Test 2.6: Get Board Statistics
```bash
curl -X GET http://localhost:5000/api/rbac/boards/BOARD_ID/stats \
  -H "Authorization: Bearer HR_TOKEN"
```

**Expected:** Task statistics (total, completed, pending, etc.)

---

### Scenario 3: Task Management

#### Test 3.1: Create Task (HR Only)
```bash
curl -X POST http://localhost:5000/api/rbac/tasks/board/BOARD_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer HR_TOKEN" \
  -d '{
    "title": "Design UI Mockups",
    "description": "Create mockups for the new dashboard",
    "priority": "High",
    "deadline": "2024-02-15",
    "columnId": "COL1",
    "assignees": ["EMPLOYEE1_ID"],
    "tags": ["design", "ui"]
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "task": {
    "_id": "TASK1_ID",
    "title": "Design UI Mockups",
    "assignees": [{ "id": "EMPLOYEE1_ID", "name": "Bob Developer" }]
  }
}
```

**Test:** ✅ Employee1 should receive notification

#### Test 3.2: Create Multiple Tasks
```bash
# Task 2 - Assigned to Employee 2
curl -X POST http://localhost:5000/api/rbac/tasks/board/BOARD_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer HR_TOKEN" \
  -d '{
    "title": "Implement Payment Module",
    "description": "Add payment processing to the system",
    "priority": "Urgent",
    "deadline": "2024-02-10",
    "columnId": "COL1",
    "assignees": ["EMPLOYEE2_ID"],
    "tags": ["backend", "payment"]
  }'

# Task 3 - Assigned to both employees
curl -X POST http://localhost:5000/api/rbac/tasks/board/BOARD_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer HR_TOKEN" \
  -d '{
    "title": "API Documentation",
    "description": "Document all APIs",
    "priority": "Medium",
    "deadline": "2024-02-20",
    "columnId": "COL1",
    "assignees": ["EMPLOYEE1_ID", "EMPLOYEE2_ID"],
    "tags": ["documentation"]
  }'
```

#### Test 3.3: Get Tasks (Employee View)
```bash
curl -X GET http://localhost:5000/api/rbac/tasks/board/BOARD_ID \
  -H "Authorization: Bearer EMPLOYEE1_TOKEN"
```

**Expected:** Employee1 sees only tasks assigned to them (Task 1 and Task 3)

**Test:** ✅ RBAC working - Employee2 won't see Task 1

#### Test 3.4: Get Single Task
```bash
curl -X GET http://localhost:5000/api/rbac/tasks/TASK1_ID \
  -H "Authorization: Bearer EMPLOYEE1_TOKEN"
```

**Expected:** Full task details with comments and attachments

#### Test 3.5: Update Task
```bash
curl -X PUT http://localhost:5000/api/rbac/tasks/TASK1_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer EMPLOYEE1_TOKEN" \
  -d '{
    "title": "Design UI Mockups - Updated",
    "priority": "Medium",
    "description": "Updated description with more details"
  }'
```

**Expected:** Task updated successfully (Employee can update assigned tasks)

#### Test 3.6: Move Task
```bash
curl -X PATCH http://localhost:5000/api/rbac/tasks/TASK1_ID/move \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer EMPLOYEE1_TOKEN" \
  -d '{
    "columnId": "COL2"
  }'
```

**Expected:** Task moved to "In Progress" column

**Test:** ✅ HR gets notification about task movement

---

### Scenario 4: Comments & Collaboration

#### Test 4.1: Add Comment
```bash
curl -X POST http://localhost:5000/api/rbac/comments-attachments/task/TASK1_ID/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer EMPLOYEE1_TOKEN" \
  -d '{
    "message": "I is started working on the mockups. Will have initial designs ready by tomorrow."
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "comment": {
    "_id": "COMMENT_ID",
    "message": "I started working on the mockups...",
    "userId": { "id": "EMPLOYEE1_ID", "name": "Bob Developer", "email": "..." },
    "createdAt": "2024-01-23T10:30:00Z"
  }
}
```

**Test:** ✅ HR (task creator) gets notification

#### Test 4.2: Add More Comments
```bash
curl -X POST http://localhost:5000/api/rbac/comments-attachments/task/TASK1_ID/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer HR_TOKEN" \
  -d '{
    "message": "Great progress! Please make sure to consider accessibility in the design."
  }'
```

#### Test 4.3: Get Comments
```bash
curl -X GET http://localhost:5000/api/rbac/comments-attachments/task/TASK1_ID/comments \
  -H "Authorization: Bearer EMPLOYEE1_TOKEN"
```

**Expected:** All comments in reverse chronological order

#### Test 4.4: Upload Attachment
```bash
curl -X POST http://localhost:5000/api/rbac/comments-attachments/task/TASK1_ID/attachments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer EMPLOYEE1_TOKEN" \
  -d '{
    "fileName": "UI_Mockups_v1.pdf",
    "fileUrl": "https://storage.example.com/mockups/UI_Mockups_v1.pdf",
    "fileSize": 2048576,
    "fileType": "application/pdf"
  }'
```

**Expected:** Attachment created and linked to task

#### Test 4.5: Get Attachments
```bash
curl -X GET http://localhost:5000/api/rbac/comments-attachments/task/TASK1_ID/attachments \
  -H "Authorization: Bearer EMPLOYEE1_TOKEN"
```

**Expected:** List of attachments with upload details

---

### Scenario 5: Notifications

#### Test 5.1: Get Notifications
```bash
curl -X GET http://localhost:5000/api/rbac/notifications \
  -H "Authorization: Bearer EMPLOYEE1_TOKEN"
```

**Expected:** List of notifications (task assigned, comments, task movements, etc.)

**Example:**
```json
{
  "success": true,
  "total": 5,
  "unreadCount": 3,
  "notifications": [
    {
      "_id": "NOT1",
      "type": "task_assigned",
      "message": "You have been assigned a new task: \"Design UI Mockups\"",
      "isRead": false,
      "createdAt": "2024-01-23T10:00:00Z"
    },
    {
      "_id": "NOT2",
      "type": "task_moved",
      "message": "Task \"Design UI Mockups\" was moved to In Progress",
      "isRead": false
    }
  ]
}
```

#### Test 5.2: Get Unread Count
```bash
curl -X GET http://localhost:5000/api/rbac/notifications/unread-count \
  -H "Authorization: Bearer EMPLOYEE1_TOKEN"
```

**Expected:** `{ "success": true, "unreadCount": 3 }`

#### Test 5.3: Mark as Read
```bash
curl -X PATCH http://localhost:5000/api/rbac/notifications/NOT1/read \
  -H "Authorization: Bearer EMPLOYEE1_TOKEN"
```

**Expected:** Notification marked as read

#### Test 5.4: Mark All as Read
```bash
curl -X PATCH http://localhost:5000/api/rbac/notifications/read-all \
  -H "Authorization: Bearer EMPLOYEE1_TOKEN"
```

---

### Scenario 6: Task Completion & Archiving

#### Test 6.1: Move Task to Completed
```bash
curl -X PATCH http://localhost:5000/api/rbac/tasks/TASK1_ID/move \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer EMPLOYEE1_TOKEN" \
  -d '{
    "columnId": "COL4"
  }'
```

**Expected:** Task marked as completed (`completedAt` set)

#### Test 6.2: Archive Completed Tasks (HR Only)
```bash
curl -X POST http://localhost:5000/api/rbac/tasks/board/BOARD_ID/archive-completed \
  -H "Authorization: Bearer HR_TOKEN"
```

**Expected:** Completed tasks archived

---

### Scenario 7: Reports & Analytics (HR Only)

#### Test 7.1: Get Board Report
```bash
curl -X GET "http://localhost:5000/api/rbac/reports/board/BOARD_ID?startDate=2024-01-01&endDate=2024-02-28" \
  -H "Authorization: Bearer HR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "report": {
    "board": { "id": "...", "title": "Q1 2024 Project" },
    "taskStats": {
      "total": 3,
      "completed": 1,
      "pending": 2,
      "completionRate": "33.33%",
      "overdue": 0
    },
    "byPriority": [
      { "_id": "High", "count": 1 },
      { "_id": "Urgent", "count": 1 },
      { "_id": "Medium", "count": 1 }
    ],
    "byAssignee": [...],
    "avgCompletionDays": "1.50"
  }
}
```

#### Test 7.2: Get Employee Performance Report
```bash
curl -X GET "http://localhost:5000/api/rbac/reports/employee/EMPLOYEE1_ID" \
  -H "Authorization: Bearer HR_TOKEN"
```

**Expected:** Employee's task completion stats and metrics

#### Test 7.3: Get Organization Report
```bash
curl -X GET "http://localhost:5000/api/rbac/reports/organization" \
  -H "Authorization: Bearer HR_TOKEN"
```

**Expected:** Organization-wide statistics

---

### Scenario 8: User Management (HR Only)

#### Test 8.1: Get All Users
```bash
curl -X GET http://localhost:5000/api/rbac/users \
  -H "Authorization: Bearer HR_TOKEN"
```

**Expected:** List all active users

#### Test 8.2: Get User Statistics
```bash
curl -X GET http://localhost:5000/api/rbac/users/stats \
  -H "Authorization: Bearer HR_TOKEN"
```

**Expected:**
```json
{
  "success": true,
  "stats": {
    "total": 3,
    "hr": 1,
    "employees": 2,
    "active": 3,
    "inactive": 0
  }
}
```

#### Test 8.3: Search Users
```bash
curl -X GET "http://localhost:5000/api/rbac/users?search=Bob" \
  -H "Authorization: Bearer HR_TOKEN"
```

**Expected:** Filtered user list

---

### Scenario 9: Permission Testing

#### Test 9.1: Employee Cannot Create Board
```bash
curl -X POST http://localhost:5000/api/rbac/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer EMPLOYEE1_TOKEN" \
  -d '{
    "title": "Unauthorized Board",
    "description": "This should fail"
  }'
```

**Expected Error:**
```json
{
  "success": false,
  "message": "This action is only available to HR users."
}
```

**Test:** ✅ RBAC enforcement working

#### Test 9.2: Employee Cannot Create Task
```bash
curl -X POST http://localhost:5000/api/rbac/tasks/board/BOARD_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer EMPLOYEE1_TOKEN" \
  -d '{
    "title": "Unauthorized Task",
    "columnId": "COL1"
  }'
```

**Expected Error:** 403 Forbidden

#### Test 9.3: Employee Cannot See Other Employee's Tasks
```bash
curl -X GET http://localhost:5000/api/rbac/tasks/board/BOARD_ID \
  -H "Authorization: Bearer EMPLOYEE2_TOKEN"
```

**Expected:** Employee2 only sees Task 3 (the one assigned to them)

#### Test 9.4: Missing Authorization Token
```bash
curl -X GET http://localhost:5000/api/rbac/boards
```

**Expected Error:**
```json
{
  "success": false,
  "message": "No token provided. Please authenticate first."
}
```

---

### Scenario 10: Error Handling

#### Test 10.1: Invalid Email on Registration
```bash
curl -X POST http://localhost:5000/api/rbac/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "invalid-email",
    "password": "password123",
    "role": "HR"
  }'
```

**Expected Error:** Validation error for email format

#### Test 10.2: Duplicate Email
```bash
curl -X POST http://localhost:5000/api/rbac/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Another HR",
    "email": "hr@company.com",
    "password": "AnotherPassword123",
    "role": "HR"
  }'
```

**Expected Error:** Email already registered

#### Test 10.3: Invalid Task ID
```bash
curl -X GET http://localhost:5000/api/rbac/tasks/invalid-id \
  -H "Authorization: Bearer HR_TOKEN"
```

**Expected Error:** Invalid ID format

#### Test 10.4: Non-existent Resource
```bash
curl -X GET http://localhost:5000/api/rbac/tasks/507f1f77bcf86cd799999999 \
  -H "Authorization: Bearer HR_TOKEN"
```

**Expected Error:** Task not found (404)

---

## Test Results Summary

### Checklist
- [ ] User Registration & Login (Scenario 1) 
- [ ] Board Management (Scenario 2)
- [ ] Task Management (Scenario 3)
- [ ] Comments & Attachments (Scenario 4)
- [ ] Notifications (Scenario 5)
- [ ] Task Completion & Archiving (Scenario 6)
- [ ] Reports & Analytics (Scenario 7)
- [ ] User Management (Scenario 8)
- [ ] Permission Testing (Scenario 9)
- [ ] Error Handling (Scenario 10)

### Performance Benchmarks
- Average response time: < 200ms
- Authentication: < 100ms
- Task creation: < 150ms
- Report generation: < 500ms

### Known Limitations
- File storage is reference-based (URLs in database)
- Real file upload requires S3/cloud storage integration
- Real-time notifications require WebSocket upgrade
- Rate limiting not implemented (add in production)

---

## Troubleshooting

### Issue: "MongoDB connection failed"
**Solution:** 
```bash
# Make sure MongoDB is running
mongod

# Or check MONGO_URI in .env
MONGO_URI=mongodb://127.0.0.1:27017/worksphere
```

### Issue: "Invalid token"
**Solution:** 
- Regenerate token with login
- Check token hasn't expired (7 days max)
- Include "Bearer " prefix in Authorization header

### Issue: "Email already registered"
**Solution:** Use different email or delete user from database

### Issue: "Validation error"
**Solution:** Check all required fields are present and correct data types

---

**All tests passing = Production ready! 🚀**
