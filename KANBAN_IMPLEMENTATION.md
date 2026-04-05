# Kanban Board Implementation Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Kanban.jsx - Main Page Component                     │  │
│  ├─ TaskModal.jsx - Edit/View Details                  │  │
│  ├─ Card.jsx - Draggable Task Card                     │  │
│  └─ Kanban.css - Trello-like Styling                   │  │
└─────────────────────────────────────────────────────────────┘
                            │
                   HTTP + WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Node.js/Express)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ kanban-new.js - 350+ Lines of API Routes            │  │
│  ├─ Boards Management (CRUD)                           │  │
│  ├─ Columns Management                                 │  │
│  ├─ Cards/Tasks Management                             │  │
│  ├─ Comments & Attachments                             │  │
│  ├─ Reports & Analytics                                │  │
│  └─ WebSocket Event Broadcasting                       │  │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  MongoDB Database                            │
│  ├─ Kanban Collection (Boards & Cards)                │  │
│  ├─ User Collection (Authentication)                  │  │
│  └─ Indexes for Performance                           │  │
└─────────────────────────────────────────────────────────────┘
```

## Code Examples

### 1. Creating a Task (HR/Admin)

**Frontend (React)**:
```javascript
const handleAddCard = async (columnId) => {
  const title = prompt('Task title:')
  if (!title) return

  try {
    const newCard = await api.post(
      `/kanban/boards/${selectedBoard._id}/cards`,
      {
        title,
        columnId,
        priority: 'Medium',
        assignees: selectedAssignees,
        dueDate: selectedDate
      }
    )
    // Card added, board updates via WebSocket
  } catch (err) {
    console.error('Error creating card:', err)
  }
}
```

**Backend (Express)**:
```javascript
router.post('/boards/:boardId/cards', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const { boardId } = req.params
    const { title, description, columnId, priority, dueDate, assignees } = req.body
    const userId = req.userId

    const board = await Kanban.findById(boardId)
    if (!board) return res.status(404).json({ message: 'Board not found' })

    const cardId = `card-${Date.now()}`
    const newCard = {
      id: cardId,
      title: title || 'Untitled Task',
      description: description || '',
      priority: priority || 'Medium',
      columnId: columnId || board.columns[0]?.id,
      assignees: Array.isArray(assignees) ? assignees : [],
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: userId,
      comments: [],
      attachments: [],
      visibility: 'public',
    }

    board.cards.set(cardId, newCard)
    await board.save()

    res.status(201).json(newCard)
    if (io) io.emit('kanban:cardCreated', { boardId, card: newCard })
  } catch (err) {
    res.status(500).json({ message: 'Error creating card', error: err.message })
  }
})
```

### 2. Drag-and-Drop Implementation

**Frontend (React)**:
```javascript
const handleDragStart = (e, cardId) => {
  setDraggedCard(cardId)
  e.dataTransfer.effectAllowed = 'move'
}

const handleDrop = async (e, columnId) => {
  e.preventDefault()
  setDragOver({ ...dragOver, [columnId]: false })

  if (!draggedCard || !board) return

  const card = Object.values(board.cards).find(c => c.id === draggedCard)
  if (!card) return

  // Check permissions - employees can only move assigned tasks
  if (isEmployee && !card.assignees.includes(user.id)) {
    alert('You can only move your assigned tasks')
    return
  }

  const updated = { ...card, columnId }
  try {
    await api.put(
      `/kanban/boards/${board._id}/cards/${draggedCard}`,
      { columnId }
    )
    setBoard({ ...board, cards: { ...board.cards, [draggedCard]: updated } })
  } catch (err) {
    console.error('Error moving card:', err)
  }
  setDraggedCard(null)
}

// In JSX:
{Object.values(board.cards)
  .filter((c) => c.columnId === col.id)
  .map((c) => (
    <Card
      key={c.id}
      card={c}
      onDragStart={handleDragStart}
      onEdit={handleEditCard}
      onDelete={handleDeleteCard}
    />
  ))}
```

### 3. Comments Feature

**Adding Comment (Frontend)**:
```javascript
const handleAddComment = async (text) => {
  if (!text.trim()) return
  
  try {
    const response = await api.post(
      `/kanban/boards/${board._id}/cards/${card.id}/comments`,
      { text }
    )
    
    setComments([...comments, response.data])
    setNewComment('')
  } catch (err) {
    console.error('Error adding comment:', err)
  }
}
```

**Backend (Express)**:
```javascript
router.post('/boards/:boardId/cards/:cardId/comments', auth, async (req, res) => {
  try {
    const { boardId, cardId } = req.params
    const { text } = req.body
    const userId = req.userId

    const board = await Kanban.findById(boardId)
    if (!board) return res.status(404).json({ message: 'Board not found' })

    const card = board.cards.get(cardId)
    if (!card) return res.status(404).json({ message: 'Card not found' })

    // Check authorization
    const isAssigned = card.assignees.includes(userId)
    if (card.visibility === 'private' && !isAssigned) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const user = await User.findById(userId)
    const comment = {
      id: `comment-${Date.now()}`,
      userId,
      userName: user?.name || 'Unknown',
      text: text || '',
      createdAt: new Date(),
    }

    card.comments.push(comment)
    board.markModified('cards')
    await board.save()

    res.status(201).json(comment)
    if (io) io.emit('kanban:commentAdded', { boardId, cardId, comment })
  } catch (err) {
    res.status(500).json({ message: 'Error adding comment', error: err.message })
  }
})
```

### 4. Role-Based Permission Check

**Backend Middleware (auth.js)**:
```javascript
export const auth = (req, res, next) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' })
  }

  const token = header.split(' ')[1]
  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'worksphere-secret'
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.userId
    req.role = payload.role
    next()
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
  }
}

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' })
    }
    next()
  }
}
```

**Usage in Routes**:
```javascript
// Only HR/Admin can create boards
router.post('/boards', auth, requireRole('admin', 'hr'), async (req, res) => {
  // ...
})

// Only HR/Admin can delete cards
router.delete('/boards/:boardId/cards/:cardId', auth, requireRole('admin', 'hr'), async (req, res) => {
  // ...
})

// Employees can update cards but with restrictions
router.put('/boards/:boardId/cards/:cardId', auth, async (req, res) => {
  const role = req.role
  const userId = req.userId

  if (role === 'employee') {
    const allowedFields = ['columnId', 'status']
    const restrictedUpdates = Object.keys(updates).filter(key => !allowedFields.includes(key))
    if (restrictedUpdates.length > 0) {
      return res.status(403).json({ 
        message: `Employees cannot modify: ${restrictedUpdates.join(', ')}` 
      })
    }
  }
  // ... rest of logic
})
```

### 5. Generating Reports

**Frontend (React)**:
```javascript
const generateReport = async () => {
  try {
    const response = await api.get(
      `/kanban/boards/${selectedBoard._id}/report`
    )
    
    console.log('Report Generated:')
    console.log(`Total Cards: ${response.data.totalCards}`)
    console.log('By Column:', response.data.cardsByColumn)
    console.log('By Priority:', response.data.cardsByPriority)
    console.log('Overdue Tasks:', response.data.overdueTasks)
    
    // Display in UI or export as PDF/CSV
  } catch (err) {
    console.error('Error generating report:', err)
  }
}
```

**Backend (Express)**:
```javascript
router.get('/boards/:boardId/report', auth, requireRole('admin', 'hr'), async (req, res) => {
  try {
    const { boardId } = req.params

    const board = await Kanban.findById(boardId)
    if (!board) return res.status(404).json({ message: 'Board not found' })

    const report = {
      boardName: board.name,
      totalCards: board.cards.size,
      cardsByColumn: {},
      cardsByPriority: { Low: 0, Medium: 0, High: 0, Urgent: 0 },
      cardsByAssignee: {},
      overdueTasks: [],
      completedTasks: [],
      inProgressTasks: [],
    }

    // Process all cards
    for (const [cardId, card] of board.cards) {
      if (card.archived) continue

      // Count by column
      if (!report.cardsByColumn[card.columnId]) report.cardsByColumn[card.columnId] = 0
      report.cardsByColumn[card.columnId]++

      // Count by priority
      if (report.cardsByPriority.hasOwnProperty(card.priority)) {
        report.cardsByPriority[card.priority]++
      }

      // Identify overdue tasks
      if (card.dueDate && new Date(card.dueDate) < new Date()) {
        report.overdueTasks.push({ 
          id: cardId, 
          title: card.title, 
          dueDate: card.dueDate, 
          assignees: card.assignees 
        })
      }
    }

    res.json(report)
  } catch (err) {
    res.status(500).json({ message: 'Error generating report', error: err.message })
  }
})
```

### 6. Real-Time WebSocket Integration

**Backend (Socket.IO)**:
```javascript
import http from 'http'
import { Server } from 'socket.io'

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: ['http://localhost:5173'], credentials: true }
})

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)
  
  // Join room for specific board
  socket.on('join:board', (boardId) => {
    socket.join(`board:${boardId}`)
    socket.emit('joined', { boardId })
  })
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// Broadcast events
io.emit('kanban:cardCreated', { boardId, card: newCard })
io.emit('kanban:cardUpdated', { boardId, card: updatedCard })
io.emit('kanban:commentAdded', { boardId, cardId, comment })
```

**Frontend (React)**:
```javascript
useEffect(() => {
  // Connect to WebSocket
  const socket = io('http://localhost:5000')
  
  // Join board room
  socket.emit('join:board', selectedBoard._id)
  
  // Listen for updates
  socket.on('kanban:cardCreated', ({ boardId, card }) => {
    if (boardId === selectedBoard._id) {
      setBoard(prev => ({
        ...prev,
        cards: { ...prev.cards, [card.id]: card }
      }))
    }
  })
  
  socket.on('kanban:cardUpdated', ({ boardId, card }) => {
    if (boardId === selectedBoard._id) {
      setBoard(prev => ({
        ...prev,
        cards: { ...prev.cards, [card.id]: card }
      }))
    }
  })
  
  return () => socket.disconnect()
}, [selectedBoard._id])
```

## Data Flow Diagram

```
User Action (e.g., Drag Task)
         │
         ▼
React Component Handler
         │
         ▼
HTTP Request to API (/api/kanban/boards/:id/cards/:id)
         │
    ┌────┴────┐
    │          │
    ▼          ▼
Auth Check   Validate Input
    │          │
    └────┬────┘
         │
         ▼
Permission Check (Role-based)
         │
    ┌────┴────────────────┐
    │                     │
   ✅ Allowed           ❌ Forbidden
    │                     │
    ▼                     ▼
Update MongoDB      Return 403 Error
    │
    ▼
Save to DB
    │
    ▼
Broadcast via WebSocket
    │
    ▼
All Connected Clients Receive Update (Real-time)
    │
    ▼
React State Updates
    │
    ▼
UI Re-renders with New Data
```

## Performance Optimizations

### Database Indexes
```javascript
// In Kanban.js
KanbanBoardSchema.index({ createdBy: 1 })
KanbanBoardSchema.index({ 'cards.assignees': 1 })
KanbanBoardSchema.index({ archived: 1 })
```

### Frontend Optimizations
```javascript
// Use React.memo for Cards
const Card = React.memo(({ card, onDragStart, onEdit, onDelete }) => {
  // Component only re-renders if props change
})

// Debounce save operations
const debouncedSave = useCallback(
  debounce((newData) => api.put(..., newData), 300),
  []
)
```

## Testing Scenarios

### Test Case 1: Employee Sees Only Their Tasks
```bash
# Login as employee
# Navigate to Kanban
# ✅ Should see only tasks where assignees includes their ID
# ❌ Should NOT see private tasks of other employees
```

### Test Case 2: HR Can Create Board
```bash
# Login as HR
# Click "Create Board"
# Fill form and submit
# ✅ Should create board
# ✅ Should have default columns
```

### Test Case 3: Drag-Drop Permissions
```bash
# Login as employee
# Try to drag unassigned task
# ❌ Should show permission error
# ✅ Should allow drag for assigned task
```

### Test Case 4: Real-Time Updates
```bash
# Open board in two windows
# In window 1: Add comment to task
# In window 2:
# ✅ Should see comment appear instantly (no refresh needed)
```

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Cards not dragging | HTML5 drag disabled | Check browser support |
| Permission denied | Wrong role | Verify user role in MongoDB |
| Real-time not working | WebSocket disconnected | Check Socket.IO connection |
| Data not persisting | MongoDB error | Verify connection string |

---

**Implementation complete! 🎉**
