# Employee Task Review Workflow - Complete Implementation Guide

## Overview
This document provides a comprehensive guide to the "Submit for Review" workflow implementation where:
- **HR/Admin users** create tasks and assign them to employees
- **Employees** can submit assigned tasks to a "Review" column
- **HR/Admin users** review and mark tasks as "Completed"
- **System prevents** employees from directly marking tasks as Completed via backend 403 error + frontend UI guard

---

## Architecture Diagram

```
Employee Workflow:
┌─────────────────────────────────────────────────────────────────┐
│ TaskModal Component (Frontend)                                   │
│  ├─ Displays task details                                        │
│  ├─ Shows "Submit for Review" button (if assigned employee)     │
│  └─ Calls handleSubmitForReview()                               │
└──────────────────┬──────────────────────────────────────────────┘
                   │ onClick: Submit for Review
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ API Layer (kanban.moveCard)                                      │
│  ├─ Validates boardId is 24-char MongoDB ObjectId              │
│  ├─ Calls PATCH /rbac/boards/{boardId}/tasks/{taskId}/move     │
│  └─ Body: { columnId: reviewColumnId }                          │
└──────────────────┬──────────────────────────────────────────────┘
                   │ HTTP PATCH
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend: moveTask Controller                                     │
│  ├─ [Step 1] Extract taskId, columnId from request             │
│  ├─ [Step 2] Load task and column from database                │
│  ├─ [Step 3] Check user role:                                   │
│  │            if Employee && columnId == Completed              │
│  │            └─ Return 403 "Employees cannot mark as Completed"│
│  ├─ [Step 4] If column title contains "review":                │
│  │            ├─ Find all HR/Admin board members                │
│  │            ├─ Create RBACNotification for each:              │
│  │            │  type: 'task_submitted_for_review'              │
│  │            │  message: "Task \"X\" was submitted for review" │
│  │            └─ Store notifications in database                │
│  ├─ [Step 5] Save task with new columnId                       │
│  └─ [Step 6] Return updated task (populated)                   │
└──────────────────┬──────────────────────────────────────────────┘
                   │ Response: { task: {...} }
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: handleMoveTask Callback                                │
│  ├─ Normalizes returned task object                            │
│  ├─ Updates Kanban.jsx state with moved task                   │
│  ├─ Closes TaskModal                                            │
│  └─ UI re-renders with task in Review column                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### 1. Backend: Role-Based Task Movement (`server/src/controllers/rbac-task-controller.js`)

**Function:** `moveTask` (lines 280-410)

**Key Logic:**

```javascript
// Check if employee trying to move task to Completed column
const lastColumn = board.columns[board.columns.length - 1];
if (isEmployee && (columnId === lastColumn._id || columnId === lastColumn.id)) {
  return res.status(403).json({
    success: false,
    message: 'Employees cannot mark tasks as Completed. Submit the task to Review for HR to complete.'
  });
}

// If task moved to Review column, notify all HR/Admin members
if (/review/i.test(column.title)) {
  const reviewers = await RBACBoardMember.find({
    boardId: mongoose.Types.ObjectId(boardId),
    role: { $in: ['HR', 'Admin'] }
  }).select('_id');
  
  const hrNotifications = reviewers.map(u => ({
    userId: u._id,
    type: 'task_submitted_for_review',
    taskId: task._id,
    boardId: boardId,
    message: `Task "${task.title}" was submitted for review`,
    triggeredBy: req.userId
  }));
  
  if (hrNotifications.length > 0) {
    await RBACNotification.insertMany(hrNotifications);
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task moved successfully",
  "task": {
    "_id": "...",
    "title": "...",
    "columnId": {..._id, title, etc.},
    "assignees": [{_id, name, email}, ...],
    "...": "other fields"
  }
}
```

### 2. Frontend: API Wrapper (`client/src/api.js`)

**Function:** `moveCard` (line 220)

```javascript
async moveCard(boardId, taskId, body) {
  const id = this.normalizeBoardId(boardId);  // Validate 24-char ObjectId
  return await api(`/rbac/boards/${id}/tasks/${taskId}/move`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(res => res.task || res);
}
```

**Usage:**
```javascript
const moved = await kanbanApi.moveCard(boardId, taskId, { columnId: reviewColId });
```

### 3. Frontend: TaskModal Component (`client/src/pages/Kanban.jsx`)

**TaskModal Props:**
```javascript
function TaskModal({
  card,          // Card data with assignees array
  board,         // Board with columns array
  onClose,       // Callback to close modal
  onMove,        // NEW: Callback when task moved
  user,          // Current user {id/_id, ...}
  isHR,          // Boolean
  isAdmin,       // Boolean
  ...others
})
```

**State Setup (lines 225-245):**
```javascript
const [assignees, setAssignees] = useState(card.assignees || []);
const userId = user?.id || user?._id;
```

**handleSubmitForReview Function (lines 315-328):**
```javascript
const handleSubmitForReview = async () => {
  try {
    // Find Review column by title
    const reviewCol = (board.columns || []).find(c => 
      /review/i.test(String(c.title || ''))
    );
    if (!reviewCol) {
      alert('Review column not found on this board');
      return;
    }
    
    const colId = reviewCol.id || reviewCol._id;
    
    // Call API to move task
    const moved = await kanbanApi.moveCard(boardId, card.id, { 
      columnId: colId 
    });
    
    // Notify parent component to update state
    if (onMove) onMove(moved);
    onClose();
    
  } catch (err) {
    console.error('Error submitting for review:', err);
    alert(err.message || 'Failed to submit for review');
  }
};
```

**Submit Button Rendering (lines 495-506):**
```javascript
{/* Show for employees only, if assigned to this task, and not already reviewed */}
{!isHR && !isAdmin && assignees.includes(userId) && (() => {
  const reviewCol = (board.columns || []).find(c => 
    /review/i.test(String(c.title || ''))
  );
  const reviewId = reviewCol ? (reviewCol.id || reviewCol._id) : null;
  
  if (reviewId && (columnId !== reviewId)) {
    return (
      <button 
        className="btn btn-warning" 
        onClick={handleSubmitForReview}
        style={{ marginRight: 8 }}
      >
        Submit for Review
      </button>
    );
  }
  return null;
})()}
```

**Note:** Button only appears if:
- User is NOT HR or Admin
- User ID is in task's assignees array
- Task is NOT already in Review column

### 4. Frontend: Kanban State Update (`client/src/pages/Kanban.jsx`)

**handleMoveTask Callback (lines 829-850):**
```javascript
const handleMoveTask = (movedTask) => {
  // Normalize task response from backend
  const cardId = movedTask._id || movedTask.id;
  const normalizedCard = {
    id: cardId,
    title: movedTask.title,
    description: movedTask.description,
    priority: movedTask.priority,
    columnId: movedTask.columnId?._id || movedTask.columnId,
    assignees: (movedTask.assignees || []).map(a => a._id || a),
    assigneeNames: (movedTask.assignees || []).map(a => a?.name).filter(Boolean),
    comments: movedTask.comments || [],
    attachments: movedTask.attachments || [],
    dueDate: movedTask.deadline || movedTask.dueDate,
    createdAt: movedTask.createdAt,
    createdBy: movedTask.createdBy,
  };
  
  // Update Kanban board state
  setBoard({
    ...board,
    cards: { ...board.cards, [cardId]: normalizedCard }
  });
  
  setShowModal(false);
};
```

**TaskModal Render with Callback (line 943):**
```javascript
{showModal && selectedCard && (
  <TaskModal
    card={selectedCard}
    board={board}
    onClose={() => setShowModal(false)}
    onMove={handleMoveTask}  // NEW: Pass callback
    onUpdate={handleUpdateTask}
    onAddComment={handleAddComment}
    onAddAttachment={handleAddAttachment}
    user={user}
    isHR={isHR}
    isAdmin={isAdmin}
  />
)}
```

### 5. Frontend: Drag-Drop Guard (lines 645-652)

**Prevent Employee Completing via Drag:**
```javascript
// Get last column ID
const lastColId = board.columns?.[board.columns.length - 1]?.id ||
                  board.columns?.[board.columns.length - 1]?._id;

// Check if employee trying to drag to Completed
if (isEmployee && columnId === lastColId) {
  alert('Employees cannot move tasks to Completed. Submit the task to Review for HR to complete.');
  return;
}
```

---

## Data Flow Example

### Scenario: Employee submits task for review

```
1. INITIAL STATE
   Task: "Design Homepage"
   Column: "In Progress" (columnId: col_2)
   Assignees: [emp_123]
   
2. USER OPENS TASKMODAL
   ✅ Button appears: "Submit for Review" (user is emp_123, task in In Progress, not Review)
   
3. USER CLICKS "SUBMIT FOR REVIEW"
   → handleSubmitForReview() executes
   → Finds Review column: {id: col_3, title: "Review"}
   → Calls kanbanApi.moveCard(boardId, taskId, {columnId: col_3})
   
4. API REQUEST SENT
   PATCH /rbac/boards/{boardId}/tasks/{taskId}/move
   Headers: Authorization: Bearer {jwt}
   Body: {"columnId": "col_3"}
   
5. BACKEND PROCESSING
   ✅ Task loaded from DB
   ✅ Column loaded from DB
   ✅ Check: isEmployee && columnId == lastColumn? NO (col_3 != Completed)
   ✅ Check: column.title contains "review"? YES
   ✅ Find all HR/Admin members of this board
   ✅ Create RBACNotification for each HR user:
      type: 'task_submitted_for_review'
      message: 'Task "Design Homepage" was submitted for review'
   ✅ Save task with columnId: col_3
   ✅ Return updated task with populated fields
   
6. RESPONSE RECEIVED
   {
     "success": true,
     "task": {
       "_id": "task_456",
       "title": "Design Homepage",
       "columnId": {
         "_id": "col_3",
         "title": "Review"
       },
       "assignees": [{
         "_id": "emp_123",
         "name": "John Employee"
       }]
     }
   }
   
7. FRONTEND STATE UPDATE
   handleMoveTask(movedTask) called
   → Normalizes task to card format
   → Updates board.cards[task_456] with new data
   → setShowModal(false) closes modal
   → UI re-renders: card now appears in Review column
   
8. FINAL STATE
   Task: "Design Homepage"
   Column: "Review" ✅
   Assignees: [emp_123]
   + HR Notifications created ✅
   
9. HR USER NOTIFICATIONS
   When HR logs in, they see notification:
   "Task 'Design Homepage' was submitted for review"
   HR opens task and can now move it to "Completed" column
```

---

## Testing Checklist

### Backend Tests (Automated)
- [x] moveTask endpoint exists at `/rbac/boards/{boardId}/tasks/{taskId}/move`
- [x] Returns 403 when employee tries to move to Completed column
- [x] Creates RBACNotification when task moved to Review column
- [x] Endpoint requires authentication
- [x] Response includes fully populated task object

### Frontend Tests (Manual)

#### Setup:
1. Start frontend: `npm run dev` in `/client` (running on port 5181)
2. Create two test accounts: HR user and Employee user
3. HR creates a Kanban board with columns: "To Do", "In Progress", "Review", "Completed"

#### Test 1: HR Creates Task
- [ ] HR creates task titled "Test Task"
- [ ] HR assigns task to Employee user
- [ ] Employee receives task in "To Do" or "In Progress" column

#### Test 2: Employee Views Task
- [ ] Employee logs in
- [ ] Employee opens Kanban page
- [ ] Employee's assigned task is visible
- [ ] Employee clicks on task to open modal

#### Test 3: Submit for Review Button Visibility
- [ ] "Submit for Review" button appears for assigned employee
- [ ] Button does NOT appear for HR/Admin users (only HR controls workflow)
- [ ] Button does NOT appear if task already in Review column

#### Test 4: Submit for Review Action
- [ ] Employee clicks "Submit for Review" button
- [ ] Modal closes
- [ ] Task appears in "Review" column
- [ ] Task disappears from "In Progress" column
- [ ] No console errors in browser dev tools

#### Test 5: HR Notification
- [ ] HR logs in
- [ ] HR checks notifications dropdown
- [ ] Notification "Task 'Test Task' was submitted for review" appears
- [ ] HR can click notification to open task

#### Test 6: HR Completes Task
- [ ] HR opens task from Review column
- [ ] Task modal shows all task details
- [ ] HR can drag task to "Completed" OR move via modal
- [ ] Task moves to Completed successfully

#### Test 7: Employee Cannot Complete
- [ ] Employee tries to drag task from "In Progress" to "Completed"
- [ ] Alert appears: "Employees cannot move tasks to Completed"
- [ ] Task does NOT move
- [ ] Task remains in "In Progress"

#### Test 8: Multiple Employees
- [ ] Task assigned to 2+ employees
- [ ] Each employee sees "Submit for Review" button
- [ ] First to submit → task moves to Review
- [ ] Second employee's "Submit for Review" button disappears (task no longer in In Progress)

---

## Code Files Reference

| File | Location | Role | Key Functions/Components |
|------|----------|------|--------------------------|
| **Backend** |
| rbac-task-controller.js | server/src/controllers/ | Task operations | `moveTask(req, res)` (lines 280-410) |
| RBACTask.js | server/src/models/ | Task schema | Task validation & structure |
| RBACNotification.js | server/src/models/ | Notification storage | Stores `type: 'task_submitted_for_review'` |
| **Frontend** |
| api.js | client/src/ | API wrapper | `moveCard(boardId, taskId, body)` (line 220) |
| Kanban.jsx | client/src/pages/ | Main component | `TaskModal`, `handleMoveTask`, `Kanban` (main) |
| TaskModal (in Kanban.jsx) | client/src/pages/ | Task details modal | `handleSubmitForReview()` (line 315) |

---

## Environment Requirements

**Backend:**
- Node.js v20+
- Express
- MongoDB (local or Cloud)
- Port: 5000

**Frontend:**
- Node.js v20+
- React 18+
- Vite
- Port: 5181 (or next available)

---

## Common Issues & Solutions

### Issue: "Submit for Review" button not appearing
**Possible causes:**
1. User is HR/Admin → Employees only see this button
2. Task not assigned to current user → Check task assignees
3. Task already in Review column → Button only shows if task isn't in Review
4. assignees array contains objects not IDs → Check normalization in handleMoveTask

**Debug:**
```javascript
// In browser console while TaskModal is open:
console.log('User ID:', userId);
console.log('Is HR?', isHR);
console.log('Is Admin?', isAdmin);
console.log('Assignees:', assignees);
console.log('Current column ID:', columnId);
console.log('Review column found:', board.columns?.find(c => /review/i.test(c.title)));
```

### Issue: Move fails with "Employees cannot mark tasks as Completed"
**This is correct behavior.** The button should not appear for Completed column. If it does:
1. Check that last column is correctly identified
2. Verify columnId comparison is correct (string vs ObjectId)

### Issue: HR not receiving notifications
**Possible causes:**
1. Column title doesn't contain "Review" → Rename to include "Review"
2. No HR/Admin members on board → Add HR user to board
3. Notifications endpoint not working → Check `/api/rbac/notifications` endpoint

---

## Performance Considerations

- **Task normalization:** `handleMoveTask` normalizes the backend response to card format for local state
- **Notification system:** Creates one notification per HR/Admin member, should be acceptable for boards with < 100 members
- **API call:** Single PATCH request, efficient
- **State update:** Only updates one card in board state, minimal re-render

---

## Future Enhancements

1. **Email notifications:** Send email to HR when task submitted for review
2. **Comments in Review:** Allow commenting in Review column only
3. **SLA tracking:** Track how long tasks stay in Review
4. **Auto-complete workflow:** Complete tasks after certain time in Completed
5. **Approval flow:** Multi-level approvals (Employee → Lead → HR)

---

