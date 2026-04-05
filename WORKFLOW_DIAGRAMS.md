# Submit for Review - Visual Workflow Diagrams

## 1. User Role Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                         KANBAN BOARD WORKFLOW                    │
└─────────────────────────────────────────────────────────────────┘

EMPLOYEE PERSPECTIVE:
┌────────────┐     ┌─────────────────┐     ┌────────┐     ┌───────────┐
│  Assigned  │────▶│   In Progress   │────▶│ Submit │────▶│  Review   │
│   to Me    │     │   (working on)  │     │  for   │     │ (waiting) │
└────────────┘     │                 │     │ Review │     │   for HR  │
      ✅            │   Can drag or   │     │ button │     │           │
      See           │   modify here   │     │  ✅    │     │ Cannot go │
                    └─────────────────┘     └────────┘     │to Complete
                            ✅                              │automatically
                         Can move                           └───────────┘


HR PERSPECTIVE:
┌────────────┐     ┌─────────────────┐     ┌────────────┐     ┌───────────┐
│  Create &  │────▶│  Assign Tasks   │────▶│   Review   │────▶│ Completed │
│   Manage   │     │  to Employees   │     │ (Approve)  │     │  (Closed) │
└────────────┘     │                 │     │            │     │           │
      ✅            │  Monitor work   │     │ Notified   │     │    ✅     │
   Full            │  in progress    │     │ when ready │     │ Mark Done │
  Control          └─────────────────┘     └────────────┘     └───────────┘
                           ✅                      ✅               ✅
                      Full access              Full access      Full access
```

---

## 2. Component Communication Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Kanban Page (Kanban.jsx)                                │   │
│  │  - Displays columns and cards                            │   │
│  │  - Manages board state: { cards: {...} }                │   │
│  │  - Handles drag-drop                                      │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                           │
│                       │ handleEditCard(card)                     │
│                       ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  TaskModal Component                                      │   │
│  │  - Shows task details                                    │   │
│  │  - Conditionally renders "Submit for Review" button      │   │
│  │  - Implements handleSubmitForReview()                    │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                           │
│                       │ onClick: Submit for Review                │
│                       ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  kanbanApi.moveCard(boardId, taskId, {columnId})         │   │
│  │  - Makes PATCH request to backend                        │   │
│  │  - Returns moved task object                             │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                           │
└───────────────────────┼───────────────────────────────────────────┘
                        │ HTTP PATCH
                        │ /api/rbac/boards/{id}/tasks/{id}/move
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (Node.js)                          │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  rbac-task-controller.js: moveTask()                      │   │
│  │  1. Validate authentication & permissions                 │   │
│  │  2. Check if employee → Completed? Return 403            │   │
│  │  3. Find HR/Admin if column = "Review"                   │   │
│  │  4. Create RBACNotification for each HR                  │   │
│  │  5. Return updated task object                           │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                           │
│                       ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  MongoDB                                                  │   │
│  │  - Update task.columnId                                  │   │
│  │  - Insert RBACNotification documents                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                        │
                        │ Response: { success: true, task: {...} }
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (React)                           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  handleMoveTask(movedTask)                                │   │
│  │  - Normalize task object                                 │   │
│  │  - Update board.cards[taskId] with new columnId          │   │
│  │  - Close modal                                           │   │
│  │  - Trigger re-render                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                       ▼                                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Kanban Page Re-renders                                   │   │
│  │  - Task moves from "In Progress" to "Review" column       │   │
│  │  - UI shows task in new column                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. State Transition Diagram

```
TASK LIFECYCLE WITH ROLE-BASED CONSTRAINTS:

                    ┌────────────────┐
                    │   To Do        │
                    │  (Created)     │
                    └────────┬───────┘
                      ✅ HR creates
                      ✅ HR assigns
                      ✅ Any move

                             │
                    ┌────────▼────────┐
                    │  In Progress    │
                    │  (Employee      │
                    │   working)      │
                    └────────┬────────┘
         ┌──────────────────┴──────────────────┐
         │                                      │
         │ (Employee can)                       │ (HR can)
         │ - Edit task                          │ - Move anywhere
         │ - Submit Review ◀─────────────┐      │ - Edit task
         │                                │      │ - Delete task
         │                                │      │
         │                         ┌──────┴─────┐
         │                         │  Review    │
         │                         │  (Pending  │
         │                         │   approval)│
         │                         └──────┬─────┘
         │                                │
         │                    (HR only can move)
         │                                │
         └────────────────────────────────┤
                                          │
                                   ┌──────▼────────┐
                                   │  Completed    │
                                   │  (Finished)   │
                                   └───────────────┘

KEY TRANSITIONS:
═══════════════════════════════════════════════════════════════════
Event                    | From              | To        | Who
─────────────────────────┼───────────────────┼───────────┼──────────
Create task              | (none)            | To Do     | HR
Assign to employee       | To Do             | To Do     | HR
Start work               | To Do             | In Prog   | HR/Emp
Submit for review        | In Prog          | Review    | Employee
HR approves              | Review            | Complete  | HR
Employee direct move*    | In Prog           | -none-    | Employee
                         |                   | (BLOCKED) | (403 error)

* Attempting to move from In Progress or any state directly to Completed
```

---

## 4. Approval Workflow Diagram

```
TIME ──────────────────────────────────────────────────────────────▶

EMPLOYEE SUBMISSION FLOW:
═════════════════════════════════════════════════════════════════════

Task Created by HR
         │
         │ Task visible to assigned Employee
         │
         ▼
Employee Opens Task
         │
         ├─ Employee is assigned? YES ✓
         ├─ Task in Review already? NO ✓
         ├─ Employee is not HR? YES ✓
         │
         │ (Button conditions met)
         │
         ▼
Show "Submit for Review" Button
         │
         │ Employee clicks
         │
         ▼
API Call: moveCard(boardId, taskId, {columnId: reviewId})
         │
         ▼
Backend moveTask():
    ├─ Check: Is employee? YES
    ├─ Check: Moving to Completed? NO ✓
    ├─ Check: Moving to Review? YES
    ├─ Create notifications:
    │   └─ For each HR member on board:
    │       └─ RBACNotification {
    │           type: 'task_submitted_for_review',
    │           message: 'Task "X" submitted for review'
    │         }
    └─ Return: Updated task with new columnId
         │
         ▼
Frontend Updates:
    ├─ handleMoveTask() called with response
    ├─ normalizes task data
    ├─ Updates board.cards state
    ├─ Closes modal
    └─ Re-renders UI
         │
         ▼
Task Appears in Review Column
         │
         │ +1 Notification sent to each HR member
         │


HR APPROVAL FLOW:
═════════════════════════════════════════════════════════════════════

HR Gets Notification
    ├─ Type: task_submitted_for_review
    ├─ Message: "Task 'X' was submitted for review"
    └─ (Also visible in Notifications dropdown)
         │
         │ HR clicks notification or opens task
         │
         ▼
HR Views Task in Review Column
         │
         │ (HR is HR, so can move anywhere)
         │
         ▼
HR Drags Task to Completed OR Uses Modal Control
         │
         ├─ If drag: No guard (HR can drag)
         └─ If modal: No "Submit for Review" button (only for Employees)
         │
         ▼
API Call: moveCard/updateCard to Completed Column
         │
         ▼
Backend Checks: Is HR? YES ✓ (proceed)
         │
         ├─ No notification created (not moving to Review)
         └─ Task updated, returned
         │
         ▼
Frontend Updates State:
    └─ Task now in Completed Column
         │
         ▼
Task Marked as Complete
         │
         │ +1 Notification to assignee (optional)
```

---

## 5. Permission Matrix

```
┌───────────────────────────────────────────────────────────────────┐
│              TASK ACTION PERMISSIONS BY ROLE                       │
├───────────────────┬──────────┬──────────┬──────────┬───────────────┤
│ Action            │ Employee │ Manager  │ HR       │ Admin         │
├───────────────────┼──────────┼──────────┼──────────┼───────────────┤
│ View own tasks    │    ✅    │    ✅    │    ✅    │      ✅       │
│ View all tasks    │    ❌    │    ✅    │    ✅    │      ✅       │
│ Create task       │    ❌    │    ✅    │    ✅    │      ✅       │
│ Assign task       │    ❌    │    ✅    │    ✅    │      ✅       │
│ Edit own task     │    ✅    │    ✅    │    ✅    │      ✅       │
│ Edit any task     │    ❌    │    ✅    │    ✅    │      ✅       │
│ Delete task       │    ❌    │    ✅    │    ✅    │      ✅       │
├───────────────────┼──────────┼──────────┼──────────┼───────────────┤
│ Move: To Do►Prog  │   ✅*    │    ✅    │    ✅    │      ✅       │
│ Move: Prog►Review │   ✅*    │    ✅    │    ✅    │      ✅       │
│ Move: Rev►Complete│   ❌ 403 │    ✅    │    ✅    │      ✅       │
│ Submit for Review │   ✅*    │    ✅    │    ❌    │      ❌       │
├───────────────────┼──────────┼──────────┼──────────┼───────────────┤
│ View comment      │    ✅    │    ✅    │    ✅    │      ✅       │
│ Approve/Complete  │    ❌    │    ✅    │    ✅    │      ✅       │
│ Mark as urgent    │    ❌    │    ✅    │    ✅    │      ✅       │
│ Archive task      │    ❌    │    ✅    │    ✅    │      ✅       │
└───────────────────┴──────────┴──────────┴──────────┴───────────────┘

Legend:
✅ = Allowed
❌ = Not allowed
* = Only if assigned to the task
403 = Blocked with HTTP 403 error message
```

---

## 6. Data Flow During Submit for Review

```
STEP 1: BUTTON CLICK
═══════════════════════════════════════════════════════════════════

TaskModal.jsx Component State:
{
  card: {
    id: "task_123",
    title: "Design Homepage",
    columnId: "col_2",           ◀── "In Progress"
    assignees: ["emp_1", "emp_2"]
  },
  board: {
    columns: [
      {id: "col_1", title: "To Do"},
      {id: "col_2", title: "In Progress"},
      {id: "col_3", title: "Review"},         ◀── TARGET
      {id: "col_4", title: "Completed"}
    ]
  },
  user: { id: "emp_1", ... }    ◀── Logged in employee
  isHR: false,
  isAdmin: false,
  columnId: "col_2"              ◀── Current column
}

Button Condition Check:
  !isHR                          ✅ false (Employee)
  !isAdmin                       ✅ false (Employee)
  assignees.includes("emp_1")    ✅ true (Is assigned)
  columnId !== reviewId          ✅ true ("col_2" !== "col_3")

Result: BUTTON SHOWS ✅


STEP 2: onClick → handleSubmitForReview()
═══════════════════════════════════════════════════════════════════

Find Review Column:
  board.columns.find(c => /review/i.test(c.title))
  Result: {id: "col_3", title: "Review"}

Extract Column ID:
  colId = "col_3"

API Call:
  await kanbanApi.moveCard(
    boardId: "board_123",
    taskId: "task_123",
    body: { columnId: "col_3" }
  )


STEP 3: NETWORK REQUEST
═══════════════════════════════════════════════════════════════════

HTTP Request:
┌─────────────────────────────────────────────────────────────┐
│ PATCH /api/rbac/boards/board_123/tasks/task_123/move       │
├─────────────────────────────────────────────────────────────┤
│ Headers:                                                     │
│   Authorization: Bearer eyJ...                              │
│   Content-Type: application/json                            │
├─────────────────────────────────────────────────────────────┤
│ Body:                                                        │
│ {                                                            │
│   "columnId": "col_3"                                       │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘


STEP 4: BACKEND PROCESSING
═══════════════════════════════════════════════════════════════════

rbac-task-controller.js: moveTask()
{
  1. Extract: userId="emp_1", userRole="Employee",
              columnId="col_3"
  
  2. Validate: ObjectId? ✅
  
  3. Check membership: Is emp_1 member of board_123? ✅
  
  4. Load task from DB:
     { _id: "task_123", title: "Design Homepage",
       columnId: "col_2", assignees: ["emp_1", "emp_2"] }
  
  5. Load board columns
  
  6. CHECK PERMISSION:
     isEmployee = true
     lastColumn = board.columns[3] = {id: "col_4", title: "Completed"}
     columnId (col_3) === lastColumn.id (col_4)? NO ✓
     Proceed ✅
  
  7. UPDATE DATABASE:
     db.RBACTask.updateOne(
       {_id: "task_123"},
       {columnId: "col_3"}
     )
  
  8. CHECK IF NOTIFY HR:
     column.title = "Review"
     /review/i.test("Review") ? YES ✅
     
     Find HR/Admin on board:
       RBACBoardMember.find({
         boardId: "board_123",
         role: {$in: ["HR", "Admin"]}
       })
       Result: [{userId: "hr_1"}, {userId: "admin_1"}]
     
     Create notifications:
       db.RBACNotification.insertMany([
         {
           userId: "hr_1",
           type: "task_submitted_for_review",
           taskId: "task_123",
           message: "Task \"Design Homepage\" was submitted for review",
           triggeredBy: "emp_1"
         },
         {
           userId: "admin_1",
           type: "task_submitted_for_review",
           taskId: "task_123",
           message: "Task \"Design Homepage\" was submitted for review",
           triggeredBy: "emp_1"
         }
       ])
  
  9. FETCH UPDATED TASK:
     RBACTask.findById("task_123")
            .populate("assignees")
            .populate("columnId")
     Result:
     {
       _id: "task_123",
       title: "Design Homepage",
       columnId: {
         _id: "col_3",
         title: "Review"
       },
       assignees: [
         {_id: "emp_1", name: "John"}
         {_id: "emp_2", name: "Jane"}
       ],
       createdAt: "2024-01-15T10:30:00Z"
     }
  
  10. SEND RESPONSE:
      {
        "success": true,
        "message": "Task moved successfully",
        "task": {...}
      }
}


STEP 5: FRONTEND RESPONSE HANDLING
═══════════════════════════════════════════════════════════════════

Response Received (in api.js then component):
{
  "task": {
    "_id": "task_123",
    "title": "Design Homepage",
    "columnId": {..._id: "col_3", title: "Review"},
    "assignees": [{_id: "emp_1", ...}, {_id: "emp_2", ...}]
  }
}

handleMoveTask(movedTask) EXECUTES:
{
  1. Extract IDs:
     cardId = "task_123"
  
  2. Normalize response:
     normalizedCard = {
       id: "task_123",
       columnId: "col_3",                    ◀── NEW
       assignees: ["emp_1", "emp_2"],        ◀── Extracted IDs
       ...otherFields
     }
  
  3. Update state:
     setBoard({
       ...board,
       cards: {
         ...board.cards,
         ["task_123"]: normalizedCard         ◀── UPDATED
       }
     })
  
  4. Close modal:
     setShowModal(false)
}


STEP 6: UI FINAL STATE
═══════════════════════════════════════════════════════════════════

Re-render Kanban Component:
  board.cards["task_123"].columnId = "col_3"  ◀── "Review"

Kanban.jsx render logic:
  visibleCards = board.cards
                 filtered by current column showing
  
  When rendering "Review" column:
    ✅ Card appears (columnId matches)
  
  When rendering "In Progress" column:
    ❌ Card does NOT appear (columnId doesn't match)

FINAL RESULT:
┌─────────────────────────────────────────────────────────────┐
│ KANBAN BOARD                                                 │
├────────────┬──────────────┬────────┬──────────┤
│ To Do      │ In Progress  │ Review │Completed │
├────────────┼──────────────┼────────┼──────────┤
│ [empty]    │ [empty]      │ Design │ [empty]  │
│            │              │ Home   │          │
│            │              │ page ✅ │         │
└────────────┴──────────────┴────────┴──────────┘

HR Member Notifications:
├─ "Task \"Design Homepage\" was submitted for review" (hr_1)
└─ "Task \"Design Homepage\" was submitted for review" (admin_1)
```

---

## 7. Error Cases

```
SCENARIO 1: Employee tries to move to Completed
════════════════════════════════════════════════

Request:
  columnId = "col_4" (Completed)
  user.role = "Employee"

Backend Check:
  lastColumn.id = "col_4"
  columnId === lastColumn.id? YES ❌
  
Response:
  HTTP 403
  {
    "success": false,
    "message": "Employees cannot mark tasks as Completed. 
                Submit the task to Review for HR to complete."
  }

Frontend Handling (in try-catch):
  catch(err) {
    alert("Employees cannot mark tasks as Completed...")
  }


SCENARIO 2: Task already in Review
══════════════════════════════════

Button Condition:
  columnId !== reviewId?
  "col_3" !== "col_3"? NO
  
Result:
  Button does NOT render ❌


SCENARIO 3: No "Review" column in board
════════════════════════════════════════

handleSubmitForReview():
  reviewCol = board.columns.find(c => /review/i.test(c.title))
  Result: undefined
  
  if (!reviewCol) {
    alert('Review column not found on this board')
    return
  }

Result:
  Alert shown, no API call made ❌


SCENARIO 4: Invalid token
═════════════════════════

Request: PATCH /api/.../move
  Authorization: Bearer invalid_token

Backend Auth Middleware:
  verify(token) throws error
  
Response:
  HTTP 401
  {
    "success": false,
    "message": "Invalid token. Please authenticate."
  }

Frontend:
  alert("Failed to submit for review")


SCENARIO 5: Not assigned to task
════════════════════════════════

TaskModal Props:
  assignees = ["emp_2"]  (Different employee)
  user.id = "emp_1"      (Current user)

Button Condition:
  assignees.includes("emp_1")? NO
  
Result:
  Button does NOT render ❌
```

---

## Summary

The "Submit for Review" workflow ensures:
1. **Clear role separation** - Employees submit, HR approves
2. **Proper notifications** - HR knows when tasks need review
3. **Secure backend** - API enforces rules regardless of frontend
4. **Good UX** - Buttons only appear when valid
5. **Audit trail** - All actions logged with timestamps

---
