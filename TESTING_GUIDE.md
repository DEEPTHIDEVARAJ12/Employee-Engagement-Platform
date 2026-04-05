# Quick Start: Testing the Submit for Review Workflow

## Prerequisites Verification

Before testing, ensure:
- [ ] Backend is running on http://localhost:5000
- [ ] Frontend is running on http://localhost:5181
- [ ] MongoDB is connected (check backend logs for "Connected to MongoDB")
- [ ] You have two test user accounts (one HR, one Employee)

## Quick Test: 5 Minutes

### Step 1: Setup (1 min)
```bash
# Terminal 1 - Backend already running? Check:
# (Keep running in background)

# Terminal 2 - Frontend already running? Check:
# (Keep running in background)
```

Visit `http://localhost:5181` in your browser.

### Step 2: Create Test Board (1 min)
1. Login as **HR user**
2. Navigate to **Kanban** page
3. Create new board named "Test Board"
4. Add columns:
   - "To Do"
   - "In Progress"  
   - "Review"
   - "Completed"

### Step 3: Create Task (1 min)
1. Click "Add Task" button (visible in a column header for HR users)
2. Fill in:
   - **Title:** "Test Task for Review"
   - **Description:** "This is a test task"
   - **Priority:** "Medium"
   - **Assign to:** Select the **Employee user** (requirement: must assign)
3. Click "Create"
4. Verify task appears in "To Do" column

### Step 4: Test Employee View (1 min)
1. Logout
2. Login as **Employee user**
3. Navigate to **Kanban**
4. Verify you can see the board
5. Verify you can see the "Test Task for Review" task
6. Click on the task to open the modal

### Step 5: Test Submit for Review Button (1 min)
**While task modal is open:**

> **Expected:** You should see a yellow "Submit for Review" button in the modal footer

**If button appears:**
1. Click "Submit for Review"
2. Modal should close
3. Task should move from "To Do" to "Review" column
4. ✅ **SUCCESS** - Workflow is working!

**If button does NOT appear:**
- Check: Are you logged in as the assigned Employee?
- Check: Is task already in Review column?
- Check: Are you actually an Employee (not HR)?
- If none of these, see **Troubleshooting** below

---

## Comprehensive Test: 10-15 Minutes

### Test 1: Task Assignment Validation
**Requirement:** Task cannot be created without assigning to employee

**Test steps:**
1. Login as HR
2. Go to "Add Task" modal
3. Try to create task WITHOUT selecting any assignees
4. **Expected Result:** Submit button disabled or error message "At least one assignee required"
5. Assign to employee
6. **Expected Result:** Submit button becomes enabled, task created

**Result:** ✅ PASS / ❌ FAIL

---

### Test 2: Employee Task Visibility
**Requirement:** Employee only sees tasks assigned to them

**Test steps:**
1. HR creates 2 tasks:
   - Task A assigned to Employee1
   - Task B assigned to Employee2
2. Login as Employee1
3. Go to Kanban
4. **Expected Result:** Only Task A is visible
5. Login as Employee2
6. Go to Kanban
7. **Expected Result:** Only Task B is visible

**Result:** ✅ PASS / ❌ FAIL

---

### Test 3: Submit for Review Button Conditions
**Requirement:** Button appears only for assigned employees, non-HR, and when task not in Review

**Test steps:**

1. As Employee (assigned to task in "In Progress"):
   - Open task modal
   - **Expected:** "Submit for Review" button visible ✓

2. As HR user:
   - Open same task modal
   - **Expected:** NO "Submit for Review" button (only HR see different buttons) ✓

3. Move task to Review column, then as Employee:
   - Open task modal
   - **Expected:** NO "Submit for Review" button (already reviewed) ✓

4. Create new task, don't assign to this Employee:
   - Login as that Employee
   - Try to view task from Kanban
   - **Expected:** Task not visible at all ✓

**Result:** ✅ PASS / ❌ FAIL

---

### Test 4: Submit for Review Action
**Requirement:** Clicking button moves task to Review column and creates HR notification

**Test steps:**

1. As Employee:
   - Open task modal for assigned task
   - Note current column (should NOT be Review)
   - Click "Submit for Review"
   - **Expected:** Modal closes, task moves to Review column ✓

2. As HR:
   - Check Notifications dropdown (bell icon)
   - **Expected:** New notification "Task '{TaskTitle}' was submitted for review" ✓

3. Click notification
   - **Expected:** Opens task in modal from Review column ✓

**Result:** ✅ PASS / ❌ FAIL

---

### Test 5: Employee Cannot Complete Tasks
**Requirement:** Employee blocked from moving task to Completed column

**Test steps:**

1. Create task, assign to Employee
2. Move task to "In Progress" (as HR or Employee)
3. As Employee, try to drag task to "Completed" column
   - **Expected:** Alert: "Employees cannot move tasks to Completed. Submit the task to Review for HR to complete." ✓
   - Task does NOT move ✓

4. Open task modal and try button action
   - **Expected:** No such button exists for Completed column ✓

**Result:** ✅ PASS / ❌ FAIL

---

### Test 6: HR Can Complete Tasks
**Requirement:** HR can move tasks from Review to Completed

**Test steps:**

1. Employee submits task to Review (from Test 4)
2. As HR:
   - Open task from Review column
   - Drag task to "Completed" column
   - **Expected:** Task moves successfully ✓
3. Close modal
   - **Expected:** Task now visible in "Completed" column ✓

**Result:** ✅ PASS / ❌ FAIL

---

### Test 7: Multiple Assignees
**Requirement:** All assigned employees can see "Submit for Review" button

**Test steps:**

1. Create task assigned to Employee1 AND Employee2
2. As Employee1:
   - Open task
   - Click "Submit for Review"
   - Task moves to Review
3. As Employee2:
   - Go to Kanban
   - **Expected:** Task no longer visible in "In Progress" (it's in Review)
   - Navigate to Review column
   - Task is visible there
   - Open task
   - **Expected:** No "Submit for Review" button (task already reviewed) ✓

**Result:** ✅ PASS / ❌ FAIL

---

## Code-Level Verification

If automated tests pass but manual tests fail, check these code sections:

### Check 1: Backend moveTask Implementation
**File:** `server/src/controllers/rbac-task-controller.js` lines 280-410

**Verify:**
- [ ] Line ~305: Checks if user is Employee
- [ ] Line ~310: Compares columnId to last column (Completed)
- [ ] Line ~315: Returns 403 if employee tries to move to Completed
- [ ] Line ~375: Checks if column title contains "review"
- [ ] Line ~380: Creates RBACNotification with type 'task_submitted_for_review'

### Check 2: Frontend API Method
**File:** `client/src/api.js` line 220

**Verify:**
```javascript
async moveCard(boardId, taskId, body) {
  const id = this.normalizeBoardId(boardId);
  return await api(`/rbac/boards/${id}/tasks/${taskId}/move`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }).then(res => res.task || res);
}
```

### Check 3: TaskModal Component
**File:** `client/src/pages/Kanban.jsx` lines 215-510

**Verify:**
- [ ] Line 215: Function has `onMove` prop
- [ ] Line 248: `userId` extracted from user
- [ ] Line 315-328: `handleSubmitForReview()` function exists
- [ ] Line 495-506: Button renders only when:
  - `!isHR && !isAdmin` (not HR/Admin)
  - `assignees.includes(userId)` (is assigned)
  - `columnId !== reviewId` (not already reviewed)

### Check 4: Kanban Component
**File:** `client/src/pages/Kanban.jsx` lines 829-950

**Verify:**
- [ ] Line 829-850: `handleMoveTask()` function exists
- [ ] Line 845: Updates board state with moved task
- [ ] Line 943: `onMove={handleMoveTask}` passed to TaskModal

---

## Browser Console Debugging

While testing, open browser DevTools (F12) and check console for these helpful logs:

1. **When clicking "Submit for Review":**
   ```
   Should see: No errors
   Should see: Task moved successfully response
   ```

2. **When task modal closes:**
   ```
   Should see: Board state updated
   Should see: Task in new column
   ```

3. **Error debugging:**
   ```
   // Copy-paste in console to check button state:
   // (Note: This is simplified, real implementation may vary)
   console.log('Current column ID:', columnId);
   console.log('User ID:', userId);
   console.log('Is HR:', isHR);
   console.log('Is Admin:', isAdmin);
   console.log('Assignees:', assignees);
   console.log('Button should show:', !isHR && !isAdmin && assignees.includes(userId));
   ```

---

## Troubleshooting

### Problem: "Submit for Review" button not appearing

**Check List:**
1. [ ] Are you viewing task as the **assigned Employee** (not HR)?
   - Error message in modal if not assigned: Check browser console

2. [ ] Is the task **NOT already in Review column**?
   - Click another column's task, then back to original task
   - Button should reappear if task was moved out of Review

3. [ ] Is there a **Review column in the board**?
   - Open board columns
   - Look for column with "Review" in the name (case-insensitive)
   - If missing, add it

4. [ ] Is the **review column ID properly loaded**?
   - Check browser console:
     ```javascript
     // When TaskModal opens, manually check:
     console.log(board.columns); // Should include Review column
     ```

5. [ ] Are **assignees being normalized to IDs**?
   - Check browser console in Kanban component:
     ```javascript
     console.log('Card assignees:', card.assignees); // Should be array of ID strings
     console.log('userId:', userId); // Should be string ID
     console.log('Match?', card.assignees.includes(userId));
     ```

### Problem: Submit for Review clicks but nothing happens

**Check List:**
1. [ ] No errors in browser console? If errors, what do they say?
   - Share error message for debugging

2. [ ] Is the API call reaching the backend?
   - Open Network tab (F12 > Network)
   - Click "Submit for Review"
   - Look for PATCH request to `/rbac/boards/.../tasks/.../move`
   - Check response status code (should be 200, not 403/404/500)

3. [ ] Is the backend returning the task correctly?
   - Network tab > Click the PATCH request
   - Go to Response tab
   - Should show `{ success: true, task: {...} }`
   - If error, note error message

### Problem: Employee can drag task to Completed

**Check List:**
1. [ ] Drag guard might not be checking correctly
   - Check console for alert message
   - If no alert, function might not be executing

2. [ ] Column ID comparison might be wrong
   - Last column might have different ID format (string vs ObjectId)
   - Check browser console:
     ```javascript
     console.log('Last column ID:', board.columns?.[board.columns.length - 1]?.id);
     console.log('Dragging to column:', columnId);
     ```

### Problem: HR not receiving notification

**Check List:**
1. [ ] Is the command title spelled correctly?
   - Column must have "Review" in title (case-insensitive, regex: `/review/i`)
   - Examples that work: "Review", "REVIEW", "Task Review", "Under Review", "For Review"
   - Examples that don't: "ReCheck", "Reviewed", "Reviewing"

2. [ ] Are there HR/Admin users on the board?
   - Check board members
   - At least one must have role "HR" or "Admin"

3. [ ] Check notifications endpoint working:
   - Go to http://localhost:5000/api/rbac/notifications
   - Should return list of notifications (if authenticated)

---

## What to Report If Issues Occur

If tests fail, provide:

1. **Screenshot of:**
   - Task modal when "Submit for Review" button should appear
   - Column after clicking button (task moved or stayed?)
   - HR notifications dropdown

2. **Browser Console Error (F12):**
   - Copy full error message
   - Include stack trace if visible

3. **Network Request Details (F12 > Network):**
   - Request: `PATCH /rbac/boards/.../tasks/.../move`
   - Status code (200, 403, 404, 500?)
   - Response body (success or error?)

4. **User Info:**
   - Is the logged-in user HR or Employee?
   - Is the test user assigned to the task?
   - What column was the task in before clicking button?

---

## Quick Validation Checklist

```
✅ Backend running on port 5000
✅ Frontend running on port 5181
✅ Can create board with Review column
✅ Can create task and assign to employee
✅ Employee sees "Submit for Review" button
✅ Button click moves task to Review column
✅ Modal closes after move
✅ HR receives notification
✅ HR can move task from Review to Completed
✅ Employee cannot drag to Completed
```

If all ✅, implementation is **CORRECT** and **WORKING**.

---
