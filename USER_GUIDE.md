# User Guide: Employee Task Review Workflow

## For Business Users & Project Managers

This guide explains how the new **"Submit for Review"** feature works for employees and HR managers.

---

## 📌 What is This Feature?

The **Submit for Review** feature ensures that employees cannot mark their own work as complete. Instead, they submit tasks to an HR manager for approval.

**Before This Feature:**
- Employees could move their own tasks directly to "Completed"
- No approval process
- No HR oversight

**After This Feature:**
- Employees submit work to "Review" column
- HR reviews and approves
- Only HR can mark tasks as "Completed"
- Clear approval workflow

---

## 👨‍💼 For Employees

### How to Submit Your Work for Review

**Step 1: Work on Your Task**
1. Open the **Kanban** page
2. Find your task in the "In Progress" column
3. Click on the task to open it
4. Edit task details as needed (description, status, etc.)

**Step 2: Submit for Review**
1. When your work is done, look for the yellow button: **"Submit for Review"**
   - This button only appears when:
     - The task is assigned to you
     - You are logged in as an employee (not HR)
     - The task is NOT already in the Review column
2. Click the **"Submit for Review"** button
3. The modal will close
4. Your task will automatically move to the **"Review"** column

**Step 3: Wait for HR Approval**
1. Your task is now in the Review column
2. HR will review your work
3. When approved, it will move to "Completed"
4. You can see its status in the Kanban board

### What You CAN Do
✅ Edit task details (title, description, priority)  
✅ Add comments to task  
✅ Move task between "To Do" → "In Progress" → "Review"  
✅ Submit task for HR review with one click  
✅ See all your assigned tasks  

### What You CANNOT Do
❌ Mark task as "Completed" (only HR can do this)  
❌ Drag task directly to "Completed" column  
❌ See tasks assigned to other employees  
❌ Create or delete tasks  
❌ Assign tasks to others  

### What if the Button Doesn't Appear?

**Scenario 1: You're logged in as HR**
- Solution: HR users don't need to submit. They can move tasks directly to Completed.

**Scenario 2: You're not assigned to the task**
- Solution: Ask HR to assign the task to you.

**Scenario 3: Task is already in Review**
- Solution: The task is waiting for HR approval. No need to submit again.

**Scenario 4: No "Review" column**
- Solution: Ask your HR manager to add a "Review" column to the board.

---

## 👔 For HR Managers

### How to Manage the Task Review Process

**Step 1: Create and Assign Tasks**
1. Open the **Kanban** page
2. Click **"+ Add Task"** in the appropriate column (usually "To Do")
3. Fill in task details:
   - Title
   - Description
   - Priority
   - **IMPORTANT: Assign to at least one employee**
4. Click **Create**
5. Task appears on the board, assigned to selected employee

**Step 2: Monitor Submitted Tasks**
1. Watch the **"Review"** column for submitted tasks
2. Check **Notifications dropdown** (bell icon) for alerts like:
   - "Task 'Design Homepage' was submitted for review"
3. This means an employee submitted their work for you to approve

**Step 3: Review and Approve**
1. Click on the task in the Review column
2. Examine the work:
   - Read task title and description
   - Check comments from employee
   - Review attachments if any
3. Decision time:
   - If approved: **Move to Completed column**
   - If needs work: **Move back to In Progress** (comment to employee why)

**Step 4: Move to Completed**
1. Open the task from Review column
2. Drag the task to **"Completed"** column, OR
3. Use any other move option available
4. Task is now marked as done

### What You CAN Do
✅ Create new tasks  
✅ Assign tasks to employees  
✅ Edit any task  
✅ Delete tasks  
✅ Move tasks between ANY columns (including Completed)  
✅ See ALL tasks on the board  
✅ Add comments  
✅ Receive notifications when employees submit for review  
✅ Reject work (move back to In Progress)  

### What You CANNOT Do
❌ Nothing - HR has full control

---

## 📊 Task Workflow Diagram for Everyone

```
EMPLOYEE PATH:
┌─────────────────────────────────────────────────┐
│                                                  │
│  To Do  →  In Progress  →  Submit for Review   │
│                              (button click)     │
│                                  ↓             │
│                              Review            │
│                         (waiting for approval)  │
│                                                 │
└─────────────────────────────────────────────────┘


HR APPROVAL:
┌─────────────────────────────────────────────────┐
│                                                  │
│        Review (see notification)                │
│            ↓                                    │
│        Approve?                                │
│        ├─ YES: Move to Completed              │
│        └─ NO: Move back to In Progress        │
│                                                 │
│                                                 │
│        Completed                               │
│        (Task is finished)                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 💡 Common Scenarios

### Scenario 1: Employee Finishes Work
```
EMPLOYEE:
1. Working on "Design Homepage" task
2. Finishes the work
3. Opens task modal
4. Sees "Submit for Review" button
5. Clicks it
6. Task moves to Review column automatically

HR:
1. Gets notification: "Task 'Design Homepage' was submitted for review"
2. Opens task from Review column
3. Reviews the design mockups
4. Approves work
5. Moves task to Completed
6. Task is marked as done
```

### Scenario 2: Work Needs Changes
```
EMPLOYEE:
1. Submitted task "Write API Documentation"
2. Task is in Review column

HR:
1. Reviews documentation
2. Finds some issues
3. Decides work needs revision
4. Moves task back to "In Progress"
5. Adds comment: "Please add examples for each endpoint"
6. Employee sees task back in In Progress

EMPLOYEE:
1. Sees task moved back
2. Reads HR's comment
3. Makes the required changes
4. Submits for review again
5. Task goes back to Review

HR:
1. Reviews changes
2. Approves this time
3. Moves to Completed
```

### Scenario 3: Employee Tries Wrong Action
```
EMPLOYEE:
1. Task is in "In Progress"
2. Tries to drag to "Completed" directly
3. Gets alert: "Employees cannot move tasks to Completed. 
                Submit the task to Review for HR to complete."
4. Employee cannot move it

EMPLOYEE:
1. Has to click "Submit for Review" button instead
2. Task moves to Review
3. Waits for HR approval
```

---

## 🔔 Notifications

### What Notifications You Get

**If You're an Employee:**
- Task moved to a different column
- HR added a comment to your task
- Task marked as completed

**If You're HR:**
- Employee submitted task for review
- Task moved (if you set up alerts)
- Comment added to task

### How to See Notifications

1. Look for **bell icon 🔔** in the top right
2. Click the bell to see all notifications
3. Recent notifications appear at the top
4. Click a notification to open that task

---

## 📋 Board Setup (For HR)

Your board should have these columns in this order:

1. **"To Do"** - New tasks waiting to start
2. **"In Progress"** - Tasks currently being worked on
3. **"Review"** - Tasks submitted for HR approval
4. **"Completed"** - Finished tasks

**Important:** The system looks for a column with "**Review**" in the name (case doesn't matter):
- ✅ Works: "Review", "Under Review", "For Review", "Task Review"
- ❌ Doesn't work: "ReCheck", "Reviewed", "Reviewing"

---

## 🆘 Troubleshooting

### "I don't see the Submit for Review button"

**Check 1: Are you an employee?**
- HR managers don't see this button (they have full control)
- Login as an employee account

**Check 2: Is the task assigned to you?**
- Only your assigned tasks show the button
- Ask HR to assign the task to you

**Check 3: Is the task already in Review?**
- If task already in Review, button doesn't show
- Submit happens only once per cycle

**Check 4: Does the board have a Review column?**
- Board must have a column named "Review" or similar
- Ask your HR manager to add one

### "I accidentally moved my task to the wrong column"

**What to Do:**
1. Don't panic - your work isn't lost
2. Open the task
3. If you can move it back, do so
4. If you can't, notify HR to help fix it

**For HR:**
- No problem - you can move any task back to the correct column
- Just click and drag, or open the task and move it

### "I submitted but HR didn't see my submission"

**Check:**
1. Did the task move to the "Review" column?
2. Is there a "Review" column on the board?
3. Does HR have notifications turned on?
4. Try refreshing the page (press F5)

**For HR:**
1. Check the Notifications dropdown (bell 🔔)
2. Look for tasks in the Review column
3. If no notifications, click the bell to enable

---

## 🔒 Security & Privacy

**Your Work is Protected:**
- Only you can edit your own content
- Only assigned employees can see unfinished tasks
- HR can see everything (they manage the team)
- All changes are logged with timestamps

**Your Privacy:**
- Never mark own work complete (proper oversight)
- HR reviews before completion (quality control)
- Clear approval trail (accountability)

---

## 📞 Need Help?

### Employee Questions
- Where's my task? → Check your assigned tasks in Kanban
- Can't submit? → See troubleshooting above
- Button disappeared? → Task likely moved out of In Progress

### HR Questions
- Task won't move? → Check user permissions and board setup
- Notifications missing? → Check bell icon, enable if needed
- Employee locked out? → Verify they're assigned and logged in as employee

### Technical Issues
- Server down? → Wait a few minutes, refresh page
- Lost work? → Refresh the page - data is saved
- Still stuck? → Contact your IT support team

---

## 📈 Benefits of This Workflow

**For Employees:**
- Clear process - know exactly what to do when work is done
- No confusion - button appears when ready to submit
- Feedback - get comments from HR if changes needed
- Recognition - completed work is formally approved

**For HR/Managers:**
- Quality control - review before marking complete
- Oversight - know what's being completed
- Accountability - clear approval trail
- Notifications - don't miss submitted work

**For Organization:**
- Process compliance - proper approval for all work
- Quality assurance - HR reviews everything
- Clear records - track who completed what and when
- Efficiency - streamlined workflow

---

## Quick Reference Card

```
EMPLOYEE CHECKLIST:
□ Task assigned to me - YES
□ Task in "In Progress" - YES
□ Work is complete - YES
□ "Submit for Review" button visible - YES
→ CLICK BUTTON!

HR CHECKLIST:
□ Employee submitted work - YES (see notification)
□ Task in "Review" column - YES
□ Work is approved - YES
→ MOVE TO "COMPLETED"
→ DONE!
```

---

## Summary

### What Changed?
Previously, employees could mark their own work complete. Now they must submit for HR approval.

### How It Works?
1. Employee submits with one button click
2. Task moves to Review automatically
3. HR gets notified
4. HR reviews and approves
5. Task moves to Completed

### Why This Way?
- Ensures quality (HR reviews work)
- Maintains oversight (nothing complete without approval)
- Clear accountability (approval trail)
- Simple process (one button click)

---

**Status:** ✅ Feature is live and ready to use!

**For Technical Details:** See [README_IMPLEMENTATION.md](./README_IMPLEMENTATION.md)

**For Non-Technical Use:** You're reading it now!

---

*Last Updated: January 2024*
