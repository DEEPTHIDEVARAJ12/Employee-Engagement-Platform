# Role-Based Kanban Board Application

## Overview

A comprehensive role-based Kanban board system with two distinct user roles: **HR/Admin** and **Employee**. Built with React for the frontend and Node.js/Express with MongoDB for the backend.

## Features

### 🎯 Core Functionality

- **Drag-and-drop** task cards between columns
- **Real-time** task updates (WebSocket)
- **Comments** on tasks with user tracking
- **File attachments** for tasks
- **Task prioritization** (Low, Medium, High, Urgent)
- **Due dates** with visual indicators
- **Task status tracking** across workflow columns
- **Performance reports** for HR/Admin

---

## Role-Based Permissions Matrix

### HR/Admin Permissions

| Feature | Permission |
|---------|-----------|
| Create/Edit/Delete Boards | ✅ |
| Add/Edit/Delete Columns | ✅ |
| Create/Edit/Delete Tasks | ✅ |
| Assign Tasks (multiple) | ✅ |
| View All Tasks | ✅ |
| Move Any Task | ✅ |
| Generate Reports | ✅ |
| Archive Completed Tasks | ✅ |
| View Employee Boards | ✅ |
| Delete Comments | ✅ |

### Employee Permissions

| Feature | Permission |
|---------|-----------|
| Create Boards | ❌ |
| Create Columns | ❌ |
| Create Tasks | ❌ |
| Assign Tasks | ❌ |
| View Own Tasks | ✅ |
| View Assigned Tasks | ✅ |
| Move Assigned Tasks | ✅ |
| Update Task Status | ✅ |
| Add Comments | ✅ |
| Add Attachments | ✅ |
| Delete Tasks | ❌ |
| View Other Employees' Tasks | ❌ |

---

## API Endpoints

### Board Management

#### Get All Boards
```
GET /api/kanban/boards
Authorization: Bearer <token>
```
- **HR/Admin**: Returns all boards
- **Employee**: Returns boards they're assigned to + public boards

#### Get Single Board
```
GET /api/kanban/boards/:boardId
Authorization: Bearer <token>
```

#### Create Board (HR/Admin only)
```
POST /api/kanban/boards
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Project Alpha",
  "description": "Engagement activities Q1",
  "boardType": "global",
  "members": ["userId1", "userId2"]
}
```

#### Update Board (HR/Admin only)
```
PUT /api/kanban/boards/:boardId
Authorization: Bearer <token>
```

#### Delete Board (HR/Admin only, Archive)
```
DELETE /api/kanban/boards/:boardId
Authorization: Bearer <token>
```

### Column Management

#### Add Column (HR/Admin only)
```
POST /api/kanban/boards/:boardId/columns
Authorization: Bearer <token>

{
  "title": "In Review",
  "description": "Tasks pending approval",
  "color": "#3498db"
}
```

#### Update Columns (HR/Admin only)
```
PUT /api/kanban/boards/:boardId/columns
Authorization: Bearer <token>

{
  "columns": [
    { "id": "col-1", "title": "To Do", ... },
    { "id": "col-2", "title": "In Progress", ... }
  ]
}
```

#### Delete Column (HR/Admin only)
```
DELETE /api/kanban/boards/:boardId/columns/:columnId
Authorization: Bearer <token>
```

### Task/Card Management

#### Create Card (HR/Admin only)
```
POST /api/kanban/boards/:boardId/cards
Authorization: Bearer <token>

{
  "title": "Organize team building event",
  "description": "Plan and execute Q1 team building",
  "columnId": "col-todo",
  "priority": "High",
  "dueDate": "2026-03-15",
  "assignees": ["empId1", "empId2"],
  "visibility": "public"
}
```

#### Get Card Details
```
GET /api/kanban/boards/:boardId/cards/:cardId
Authorization: Bearer <token>
```

#### Update Card
```
PUT /api/kanban/boards/:boardId/cards/:cardId
Authorization: Bearer <token>

{
  "title": "Updated title",
  "description": "Updated description",
  "priority": "Medium",
  "columnId": "col-inprogress",
  "status": "in-progress"
}
```
- **Employees**: Can only update `columnId` and `status` for assigned tasks
- **HR/Admin**: Can update all fields including assignments

#### Delete Card (HR/Admin only)
```
DELETE /api/kanban/boards/:boardId/cards/:cardId
Authorization: Bearer <token>
```

#### Bulk Move Cards (Drag-Drop)
```
PUT /api/kanban/boards/:boardId/cards-bulk
Authorization: Bearer <token>

{
  "updates": [
    { "cardId": "card-1", "columnId": "col-inprogress" },
    { "cardId": "card-2", "columnId": "col-review" }
  ]
}
```

### Comments

#### Add Comment
```
POST /api/kanban/boards/:boardId/cards/:cardId/comments
Authorization: Bearer <token>

{
  "text": "Started working on this task"
}
```

#### Delete Comment (Owner or HR/Admin)
```
DELETE /api/kanban/boards/:boardId/cards/:cardId/comments/:commentId
Authorization: Bearer <token>
```

### Attachments

#### Add Attachment
```
POST /api/kanban/boards/:boardId/cards/:cardId/attachments
Authorization: Bearer <token>

{
  "fileName": "document.pdf",
  "fileUrl": "https://storage.example.com/file.pdf"
}
```

#### Delete Attachment
```
DELETE /api/kanban/boards/:boardId/cards/:cardId/attachments/:attachmentId
Authorization: Bearer <token>
```

### Reports & Analytics

#### Get Board Report (HR/Admin only)
```
GET /api/kanban/boards/:boardId/report
Authorization: Bearer <token>
```

**Response**:
```json
{
  "boardName": "Project Alpha",
  "totalCards": 24,
  "cardsByColumn": {
    "col-todo": 5,
    "col-inprogress": 8,
    "col-review": 4,
    "col-done": 7
  },
  "cardsByPriority": {
    "Low": 3,
    "Medium": 10,
    "High": 8,
    "Urgent": 3
  },
  "cardsByAssignee": {
    "emp1": 5,
    "emp2": 8,
    "emp3": 11
  },
  "overdueTasks": [...],
  "completedTasks": [...],
  "inProgressTasks": [...]
}
```

#### Archive Completed Tasks (HR/Admin only)
```
POST /api/kanban/boards/:boardId/archive-completed
Authorization: Bearer <token>
```

---

## Frontend Components

### Kanban.jsx (Main Page)
Located: `client/src/pages/Kanban.jsx`

**Features**:
- Board selection from sidebar
- Column-based task display
- Drag-and-drop support
- Task creation/editing
- Role-based action visibility

**Key Functions**:
- `handleDragStart()`: Initiates drag
- `handleDrop()`: Moves card to new column
- `handleEditCard()`: Opens task modal
- `handleDeleteCard()`: Removes task (HR/Admin only)
- `handleAddCard()`: Creates new task (HR/Admin only)

### TaskModal Component
**Features**:
- Display full task details
- Edit title, description, priority
- Change due date
- Update status/column
- View and add comments
- Assign tasks (HR/Admin only)
- Role-based edit permissions

### Card Component
**Features**:
- Display task preview
- Show priority with color indicator
- Display due date
- Show assignment count
- Show comment count
- Drag handle
- Edit/delete buttons (contextual)

---

## Database Schema

### Kanban Board
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  boardType: 'global' | 'team' | 'personal',
  createdBy: String (userId),
  members: [String], // Array of user IDs
  columns: [{
    id: String,
    title: String,
    description: String,
    order: Number,
    color: String (hex)
  }],
  cards: Map<cardId, Card>,
  isActive: Boolean,
  archived: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Card
```javascript
{
  id: String,
  title: String,
  description: String,
  priority: 'Low' | 'Medium' | 'High' | 'Urgent',
  status: String,
  columnId: String,
  assignees: [String], // Array of user IDs
  dueDate: Date,
  createdBy: String (userId),
  createdAt: Date,
  comments: [Comment],
  attachments: [Attachment],
  archived: Boolean,
  visibility: 'public' | 'private' | 'assigned'
}
```

### Comment
```javascript
{
  id: String,
  userId: String,
  userName: String,
  text: String,
  createdAt: Date
}
```

### Attachment
```javascript
{
  id: String,
  fileName: String,
  fileUrl: String,
  uploadedBy: String (userId),
  uploadedAt: Date
}
```

---

## WebSocket Events

Real-time updates via Socket.IO:

```javascript
// Broadcast Events
io.emit('kanban:boardCreated', { board })
io.emit('kanban:boardUpdated', { board })
io.emit('kanban:boardDeleted', { boardId })
io.emit('kanban:columnAdded', { boardId, column })
io.emit('kanban:columnDeleted', { boardId, columnId })
io.emit('kanban:cardCreated', { boardId, card })
io.emit('kanban:cardUpdated', { boardId, card })
io.emit('kanban:cardDeleted', { boardId, cardId })
io.emit('kanban:cardsUpdated', { boardId })
io.emit('kanban:commentAdded', { boardId, cardId, comment })
io.emit('kanban:commentDeleted', { boardId, cardId, commentId })
io.emit('kanban:attachmentAdded', { boardId, cardId, attachment })
io.emit('kanban:attachmentDeleted', { boardId, cardId, attachmentId })
io.emit('kanban:tasksArchived', { boardId, count })
```

---

## UI/UX Features

### Visual Feedback
- **Drag-over states**: Column highlights when dragging over
- **Hover effects**: Cards elevate on hover
- **Loading states**: Spinner during data fetch
- **Success indicators**: Toast notifications for actions
- **Priority colors**: Visual priority indicators on cards

### Responsive Design
- **Desktop**: Full grid layout with all columns visible
- **Tablet**: Horizontal scrolling columns
- **Mobile**: Optimized touch interactions, stacked layout

### Accessibility
- Keyboard navigation support
- ARIA labels for screen readers
- Color contrast compliance
- Focus indicators
- Semantic HTML structure

---

## Security Features

### Authentication
- JWT token-based authentication
- Bearer token in Authorization header
- Automatic token refresh

### Authorization
- Role-based access control (RBAC)
- Resource-level permission checks
- User ownership verification for personal resources
- Board membership verification

### Data Privacy
- Employees see only assigned/public tasks
- Private tasks hidden from unauthorized users
- Comments/attachments inherit task visibility
- Audit trail for actions (createdBy, timestamps)

---

## Getting Started

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- npm or yarn

### Installation

1. **Backend Setup**
```bash
cd server
npm install
```

2. **Frontend Setup**
```bash
cd client
npm install
```

3. **Environment Variables**
```bash
# server/.env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/worksphere
JWT_SECRET=your-secret-key
```

### Running the Application

1. **Start Backend**
```bash
cd server
npm run dev
```

2. **Start Frontend** (in another terminal)
```bash
cd client
npm run dev
```

3. **Access**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## Usage Guide

### For HR/Admin Users

1. **Create a Board**
   - Click "New Board" button
   - Enter board name, description
   - Select board type (global/team)

2. **Add Columns**
   - Right-click board column header
   - Click "Add Column"
   - Enter column name and color

3. **Create Tasks**
   - Click "+ Add Task" in any column
   - Fill in task details
   - Assign to employees
   - Set priority and due date

4. **View Reports**
   - Go to Report tab
   - View task distribution by:
     - Column (workflow status)
     - Priority
     - Assignee
   - Identify overdue tasks

5. **Archive Completed**
   - Click "Archive Done" button
   - Automatically archives tasks in Done column for cleanup

### For Employee Users

1. **View Tasks**
   - See board with assigned tasks
   - Public tasks visible to all

2. **Update Tasks**
   - Drag task to new column
   - Click task to view details
   - Add comments for progress updates
   - Attach documents

3. **Move Tasks**
   - Drag task between columns
   - Status updates automatically
   - Triggers notifications

4. **Communicate**
   - Add comments on tasks
   - Mention colleagues using @
   - Upload attachments

---

## Performance Optimization

### Frontend
- Lazy loading of board data
- Memoized component rendering
- Efficient state management
- Debounced drag operations

### Backend
- Indexed MongoDB queries
- Connection pooling
- Batch operations support
- Redis caching (optional)

### WebSocket
- Room-based event broadcasting
- Selective event subscriptions
- Connection pooling

---

## Troubleshooting

### Common Issues

1. **Tasks not updating in real-time**
   - Check WebSocket connection in browser DevTools
   - Verify Socket.IO is running
   - Check CORS settings

2. **Permission denied errors**
   - Verify user role in User model
   - Check board membership
   - Validate JWT token

3. **Cards not dragging**
   - Check browser supports HTML5 drag-and-drop
   - Verify no JavaScript errors in console
   - Clear browser cache

4. **MongoDB connection errors**
   - Verify MongoDB is running
   - Check connection string in .env
   - Verify credentials

---

## Future Enhancements

- [ ] Task templates for common task types
- [ ] Automation rules (auto-move, auto-assign)
- [ ] Time tracking and estimation
- [ ] Recurring tasks
- [ ] Custom workflow columns
- [ ] Team collaboration features
- [ ] Mobile app
- [ ] Integrations (Slack, Teams, Calendar)
- [ ] Advanced analytics and dashboards
- [ ] Bulk import/export

---

## Support & Documentation

For issues or questions:
1. Check this documentation
2. Review API endpoint examples
3. Check browser console for errors
4. Review server logs

---

## License

This project is part of the Employee Engagement Platform.

---

## Version History

**v1.0.0** (February 2026)
- Initial release
- Core Kanban functionality
- Role-based access control
- Comments and attachments
- Basic reporting

---

## Contributing

When extending the Kanban board:
1. Follow existing code patterns
2. Add role checks for sensitive operations
3. Update this documentation
4. Test with both HR and Employee roles
5. Verify WebSocket events broadcast correctly
