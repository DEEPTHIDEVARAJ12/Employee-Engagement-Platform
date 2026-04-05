# Testing Guide - Role-Based Kanban Board

## Test Accounts

Use these credentials to test the system:

### HR Account
- **Email**: hr@company.com
- **Password**: password123
- **Role**: hr

### Employee Account  
- **Email**: employee@company.com
- **Password**: password123
- **Role**: employee

---

## Test Scenarios

### Scenario 1: HR Creates a Board

**Steps**:
1. Login with HR account
2. Navigate to Kanban Board page
3. Click "New Board" button
4. Fill in form:
   - Name: "Q1 Engagement Activities"
   - Description: "All engagement activities for Q1 2026"
   - Board Type: "Global"
5. Click "Create Board"

**Expected Results**:
- ✅ Board created successfully
- ✅ Board has 4 default columns: To Do, In Progress, Review, Done
- ✅ Board appears in board list
- ✅ Can see "New Board" option again to create another

**Real-Time Test** (Optional):
- Open Kanban in another browser tab as same user
- Create board in first tab
- ✅ Should appear instantly in second tab (WebSocket event)

---

### Scenario 2: HR Creates and Assigns Tasks

**PreRequisite**: Have a board created

**Steps**:
1. Click "+ Add Task" button in "To Do" column
2. Enter task details:
   - Title: "Plan team building event"
   - Priority: "High"
   - Due Date: "2026-03-15"
3. Click "Save"
4. Click on the task card to open modal
5. In modal, scroll down to "Assign To" section
6. Select employee(s) from dropdown
7. Click "Save Changes"

**Expected Results**:
- ✅ Task appears in "To Do" column
- ✅ Can see task in modal
- ✅ Can assign to employees
- ✅ Task shows assignee count on card

**Test Edit**:
1. Click on task again
2. Change priority to "Medium"
3. Change due date to later date
4. Update description
5. Click "Save Changes"

**Expected Results**:
- ✅ All changes persist
- ✅ Card updates in real-time
- ✅ Priority color changes

---

### Scenario 3: Employee Views Only Assigned Tasks

**Steps**:
1. Logout from HR account
2. Login as Employee
3. Navigate to Kanban Board page

**Expected Results**:
- ✅ Employee sees only tasks they're assigned to
- ✅ Cannot see unassigned tasks
- ✅ Cannot see "New Board" or "+ Add Task" buttons
- ✅ Can see assigned task from Scenario 2

**Verify Permissions**:
1. Click on assigned task to open modal
2. Try to edit title field
   - ✅ Should be disabled (grayed out)
3. Try to change "Assign To"
   - ✅ Should not see this field

---

### Scenario 4: Drag-and-Drop (Employee)

**PreRequisite**: Employee has assigned task visible

**Steps**:
1. Login as Employee
2. On Kanban board, drag task from "To Do" to "In Progress"
3. Drop the card

**Expected Results**:
- ✅ Card moves to new column
- ✅ Update appears in real-time
- ✅ Status changes to "In Progress"
- ✅ Column counts update

**Test Permission Denial**:
1. Try to drag unassigned task
2. Drop it somewhere
   - ✅ Should show alert: "You can only move your assigned tasks"
   - ✅ Card returns to original position

---

### Scenario 5: Comments Feature

**Steps**:
1. Login as Employee
2. Click on their assigned task to open modal
3. Scroll down to "Comments" section
4. In comment box, type: "Started working on this"
5. Click "Add Comment"

**Expected Results**:
- ✅ Comment appears immediately
- ✅ Shows Employee name and timestamp
- ✅ Comment count on card increments

**Test as HR**:
1. Logout and login as HR
2. View same task
3. See the Employee's comment
4. Add your own comment

**Expected Results**:
- ✅ HR sees Employee's comment
- ✅ HR can add own comment
- ✅ Multiple comments visible in thread

---

### Scenario 6: Attachments

**Steps**:
1. In task modal, scroll to "Attachments" section
2. Click "Add Attachment"
3. Enter file details:
   - File Name: "Budget Spreadsheet"
   - File URL: "https://example.com/budget.xlsx"
4. Click "Save"

**Expected Results**:
- ✅ Attachment appears in modal
- ✅ Shows file name and uploader
- ✅ Can delete attachment (X button)

---

### Scenario 7: Task Visibility & Permissions

**Test Private Task** (HR only):
1. HR creates new task
2. In modal, set visibility to "private"
3. Assign to specific employee
4. Save

**As Employee**:
1. Login as different employee (not assigned)
2. View Kanban
3. Should NOT see private task

**As Assigned Employee**:
1. Login as assigned employee
2. Should see private task
3. Can comment and move

---

### Scenario 8: Generate Report (HR Only)

**Steps**:
1. Login as HR
2. Click on board you created
3. Look for "Report" button at top (if implemented)
4. Click "Report"

**Expected Results**:
- ✅ See total task count
- ✅ See breakdown by column:
  - Tasks in To Do
  - Tasks in In Progress
  - Tasks in Review
  - Tasks in Done
- ✅ See breakdown by priority
- ✅ See breakdown by assignee
- ✅ See list of overdue tasks

**Test Employee Cannot Access**:
1. Login as Employee
2. Try to access report endpoint directly
3. Should get 403 "Insufficient permissions" error

---

### Scenario 9: Archive Completed Tasks (HR)

**Setup**:
1. HR creates a few tasks
2. Move some to "Done" column
3. Add comments to mark complete

**Steps**:
1. Click "Archive Done" button (if visible)
2. Or use API: `POST /api/kanban/boards/{boardId}/archive-completed`

**Expected Results**:
- ✅ Tasks in "Done" column are archived
- ✅ Count shown: "Archived X tasks"
- ✅ Archived tasks no longer visible in board
- ✅ Archived tasks still in database (can be restored if needed)

---

### Scenario 10: Multiple Users Real-Time

**Setup**:
- Open Kanban board in 2 browser windows/tabs
- Login as same HR user in both

**Steps**:
1. In Window 1: Create new task "Test Real-Time"
2. Watch Window 2

**Expected Results**:
- ✅ Task appears instantly in Window 2
- ✅ No need to refresh
- ✅ WebSocket working properly

**Test Drag-Drop**:
1. In Window 1: Drag task to different column
2. Watch Window 2
- ✅ Task moves instantly in Window 2

**Test Comments**:
1. In Window 1: Click task and add comment
2. Watch Window 2
- ✅ Comment appears in real-time

---

### Scenario 11: Browser Responsiveness

**Desktop (1920x1080)**:
1. Open Kanban in full browser
2. ✅ All columns visible side-by-side
3. ✅ Can scroll horizontally if many columns
4. ✅ All buttons/controls visible

**Tablet (768x1024)**:
1. Resize browser to tablet width
2. ✅ Columns stack or scroll horizontally
3. ✅ Touch-friendly spacing maintained
4. ✅ Modal works on touch

**Mobile (375x667)**:
1. Resize browser to mobile width
2. ✅ Single column visible at a time
3. ✅ Horizontal scrolling works
4. ✅ Modal optimized for small screen
5. ✅ All touch interactions smooth

---

### Scenario 12: Error Handling

**Test Permission Denied**:
1. Employee tries API call to create board
   - `POST /api/kanban/boards` with employee token
2. ✅ Should get 403 "Insufficient permissions"

**Test Not Found**:
1. Try to access non-existent board
   - `GET /api/kanban/boards/invalid-id`
2. ✅ Should get 404 "Board not found"

**Test Validation**:
1. Try to create task without title
2. ✅ Should show validation error

---

### Scenario 13: Workflow Example - Complete Task Lifecycle

**Complete Scenario**:
```
HR Perspective:
  1. Create board "Q1 Activities"
  2. Create task "Plan event" -> assign to Employee A
  3. Task starts in "To Do" column
  
Employee A Perspective:
  1. See task in Kanban
  2. Drag to "In Progress"
  3. Add comment: "Starting tomorrow"
  4. Add attachment: "Event Budget.xlsx"
  
HR Perspective (Real-time):
  1. See task move to "In Progress"
  2. See comment appear
  3. See attachment added
  4. Generate report showing 1 task in progress
  
Employee A Perspective:
  5. Drag task to "Review"
  6. Add comment: "Ready for approval"
  
HR Perspective:
  1. See task in Review column
  2. Review details and comments
  3. Drag to "Done" to approve
  
Employee A Perspective (Real-time):
  1. See task moved to Done
  2. Task is complete!
  
HR Perspective:
  1. Click "Archive Done" button
  2. Task archived
  3. Report updated: 0 tasks in progress, 1 completed
```

---

## Performance Testing

### Load Test
1. Create 100+ tasks in a board
2. ✅ Board still loads in <2 seconds
3. ✅ Drag-drop still smooth
4. ✅ No lag when scrolling

### Real-Time Stress Test
1. Open Kanban in 3+ browser windows
2. Rapidly add comments in one window
3. ✅ All windows update in <500ms
4. ✅ No missed updates
5. ✅ No duplicate messages

### Network Latency Test
1. Open DevTools Network tab
2. Simulate 3G network
3. Try drag-drop operation
4. ✅ Still responsive (might be slightly slower)
5. ✅ No errors or timeouts

---

## Browser Compatibility

Test in:
- [x] Chrome/Chromium (Latest)
- [x] Firefox (Latest)
- [x] Safari (Latest)
- [x] Edge (Latest)
- [x] Mobile Chrome
- [x] Mobile Safari

**Expected**: All tests pass in all browsers

---

## Database Verification

### MongoDB Check
1. Connect to MongoDB:
   ```bash
   mongosh mongodb://localhost:27017/worksphere
   ```

2. Check Kanban collection:
   ```javascript
   db.kanbans.find().pretty()
   ```

3. ✅ Should see created boards with full structure

4. Check cards are embedded:
   ```javascript
   db.kanbans.findOne().cards
   ```

5. ✅ Should see all cards with comments and attachments

---

## API Testing with Postman/cURL

### Create Board (HR)
```bash
curl -X POST http://localhost:5000/api/kanban/boards \
  -H "Authorization: Bearer {HR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Board",
    "description": "Testing",
    "boardType": "global"
  }'
```

**Expected**: 201 Created

### Create Task (HR)
```bash
curl -X POST http://localhost:5000/api/kanban/boards/{BOARD_ID}/cards \
  -H "Authorization: Bearer {HR_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "columnId": "col-todo",
    "priority": "High",
    "assignees": ["{EMP_ID}"]
  }'
```

**Expected**: 201 Created

### Update Task (Employee)
```bash
curl -X PUT http://localhost:5000/api/kanban/boards/{BOARD_ID}/cards/{CARD_ID} \
  -H "Authorization: Bearer {EMP_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "columnId": "col-inprogress",
    "status": "in-progress"
  }'
```

**Expected**: 200 OK

### Generate Report (HR)
```bash
curl -X GET http://localhost:5000/api/kanban/boards/{BOARD_ID}/report \
  -H "Authorization: Bearer {HR_TOKEN}"
```

**Expected**: 200 OK with report data

---

## Final Checklist

Before declaring success, verify:

- [x] Backend API running without errors
- [x] Frontend loads without console errors
- [x] Database connected and saving data
- [x] WebSocket connected (check Network tab)
- [x] HR features all working
- [x] Employee features all working
- [x] Permissions enforced correctly
- [x] Real-time updates working
- [x] Comments working
- [x] Attachments working
- [x] Reports generating correctly
- [x] Responsive on all devices
- [x] No SQL injection vulnerabilities
- [x] No XSS vulnerabilities
- [x] CORS properly configured
- [x] JWT tokens valid
- [x] MongoDB indexes working
- [x] All documentation complete

---

## Troubleshooting During Testing

| Issue | Solution |
|-------|----------|
| "Board not found" | Verify board ID is correct |
| "Access denied" | Check user role and board permissions |
| No real-time update | Check WebSocket connection in DevTools |
| Task won't drag | Check browser supports HTML5 drag-drop |
| Can't select assignees | Make sure you're logged in as HR |
| Comments not saving | Check authentication token is valid |
| Modal won't close | Click X button or press Escape |
| Page won't load | Check backend server is running |

---

## Test Report Template

```
Kanban Board Testing Report
Date: [TEST_DATE]
Tester: [YOUR_NAME]

Overall Status: [PASS/FAIL]

Features Tested:
[ ] Board Creation
[ ] Task Creation
[ ] Drag-and-Drop
[ ] Comments
[ ] Attachments
[ ] Permissions (HR)
[ ] Permissions (Employee)
[ ] Real-Time Updates
[ ] Reports
[ ] Responsive Design

Issues Found:
[List any bugs or issues]

Observations:
[Any additional notes]

Recommendation:
[ ] Ready for Production
[ ] Needs Fixes Before Production
[ ] Major Issues - Cannot Deploy
```

---

## Congratulations! 🎉

If all tests pass, your Kanban board system is **production-ready**!

For any issues, refer to KANBAN_DOCUMENTATION.md for detailed troubleshooting.

**Happy Testing! 🧪**
