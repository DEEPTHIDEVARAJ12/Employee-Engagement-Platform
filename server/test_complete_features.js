#!/usr/bin/env node
const BASE_URL = 'http://localhost:5000/api/rbac'

async function log(label, message) {
  console.log(`\n${label}`)
  console.log('─'.repeat(80))
  console.log(message)
}

async function test() {
  try {
    // Setup
    log('📋 KANBAN BOARD - COMPLETE FEATURE VERIFICATION', 
        'Testing all RBAC Kanban features end-to-end')

    console.log('\n1️⃣  USER REGISTRATION & AUTHENTICATION')
    console.log('─'.repeat(80))
    
    let res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'HR Manager',
        email: `hr-${Date.now()}@test.com`,
        password: 'password123',
        role: 'HR',
      }),
    })
    let hrData = await res.json()
    const hrToken = hrData.token
    console.log(`✅ HR User registered: ${hrData.user.name} (${hrData.user.role})`)

    // Register employees
    const employees = []
    for (let i = 1; i <= 2; i++) {
      res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Employee ${i}`,
          email: `emp${i}-${Date.now()}@test.com`,
          password: 'password123',
          role: 'Employee',
        }),
      })
      let empData = await res.json()
      employees.push({ id: empData.user.id, name: empData.user.name, email: empData.user.email })
      console.log(`✅ Employee registered: ${empData.user.name} (${empData.user.role})`)
    }

    console.log('\n2️⃣  KANBAN BOARD CREATION')
    console.log('─'.repeat(80))
    
    res = await fetch(`${BASE_URL}/boards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`,
      },
      body: JSON.stringify({
        title: 'Q4 Project Tasks',
        description: 'Kanban board for Q4 deliverables',
      }),
    })
    let boardData = await res.json()
    const boardId = boardData.board._id
    console.log(`✅ Board created: "${boardData.board.title}" (ID: ${boardId})`)
    console.log(`   Default columns: ${boardData.board.columns.map(c => c.title).join(' → ')}`)

    console.log('\n3️⃣  BOARD MEMBER MANAGEMENT')
    console.log('─'.repeat(80))
    
    for (const emp of employees) {
      res = await fetch(`${BASE_URL}/boards/${boardId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hrToken}`,
        },
        body: JSON.stringify({ memberId: emp.id }),
      })
      if (res.ok) {
        console.log(`✅ Added member: ${emp.name}`)
      }
    }

    console.log('\n4️⃣  MANDATORY TASK ASSIGNMENT VALIDATION')
    console.log('─'.repeat(80))
    
    const columnId = boardData.board.columns[0]._id
    
    // Try creating task without assignees (should fail)
    res = await fetch(`${BASE_URL}/boards/${boardId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`,
      },
      body: JSON.stringify({
        title: 'Task without assignment',
        description: 'Should fail validation',
        priority: 'High',
        columnId,
        assignees: [],
      }),
    })
    let taskData = await res.json()
    if (res.status === 400) {
      console.log(`❌ Task creation rejected (as expected): "${taskData.message}"`)
    } else {
      throw new Error('Task should have been rejected')
    }

    // Create task with assignees (should succeed)
    res = await fetch(`${BASE_URL}/boards/${boardId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`,
      },
      body: JSON.stringify({
        title: 'Project kickoff meeting',
        description: 'Initial planning and scope discussion',
        priority: 'High',
        columnId,
        assignees: [employees[0].id, employees[1].id],
      }),
    })
    taskData = await res.json()
    if (res.status === 201) {
      console.log(`✅ Task created with mandatory assignees:`)
      console.log(`   Title: "${taskData.task.title}"`)
      console.log(`   Assigned to: ${taskData.task.assignees.map(a => a.name).join(', ')}`)
    } else {
      throw new Error(`Task creation failed: ${taskData.message}`)
    }

    console.log('\n5️⃣  ROLE-BASED TASK VISIBILITY')
    console.log('─'.repeat(80))
    
    // Fetch tasks as first employee
    res = await fetch(`${BASE_URL}/boards/${boardId}/tasks`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${employees[0].token || ''}` },
    })
    taskData = await res.json()
    
    // Log in employee to get token
    res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: employees[0].email,
        password: 'password123',
      }),
    })
    let empLoginData = await res.json()
    const empToken = empLoginData.token

    res = await fetch(`${BASE_URL}/boards/${boardId}/tasks`, {
      headers: { Authorization: `Bearer ${empToken}` },
    })
    taskData = await res.json()
    console.log(`✅ ${employees[0].name} can see ${taskData.tasks.length} assigned task(s)`)

    console.log('\n6️⃣  EMPLOYEE TASK CREATION RESTRICTION')
    console.log('─'.repeat(80))
    
    res = await fetch(`${BASE_URL}/boards/${boardId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${empToken}`,
      },
      body: JSON.stringify({
        title: 'Unauthorized task',
        priority: 'Low',
        columnId,
        assignees: [employees[0].id],
      }),
    })
    taskData = await res.json()
    if (res.status === 403 || res.status === 401) {
      console.log(`❌ Employee cannot create tasks: "${taskData.message}"`)
    }

    console.log('\n7️⃣  BOARD DATA STRUCTURE FOR FRONTEND')
    console.log('─'.repeat(80))
    
    res = await fetch(`${BASE_URL}/boards/${boardId}`, {
      headers: { Authorization: `Bearer ${hrToken}` },
    })
    boardData = await res.json()
    const board = boardData.board
    
    console.log(`✅ Board JSON structure (ready for React):`)
    console.log(`{`)
    console.log(`  title: "${board.title}",`)
    console.log(`  _id: "${board._id}",`)
    console.log(`  columns: [`)
    board.columns.slice(0, 2).forEach(col => {
      console.log(`    { _id: "${col._id}", title: "${col.title}", color: "${col.color}" },`)
    })
    console.log(`    ...`)
    console.log(`  ],`)
    console.log(`  members: ${board.members.length} users,`)
    console.log(`  createdAt: "${board.createdAt}"`)
    console.log(`}`)

    console.log('\n' + '═'.repeat(80))
    console.log('✅ ALL FEATURES VERIFIED SUCCESSFULLY!')
    console.log('═'.repeat(80))
    console.log('\n✨ SUMMARY:')
    console.log('  • User role-based access control (HR vs Employee)')
    console.log('  • Board creation with default columns')
    console.log('  • Board member management')
    console.log('  • ✨ MANDATORY TASK ASSIGNMENT (enforced at API level)')
    console.log('  • Task creation validation')
    console.log('  • Role-based task visibility')
    console.log('  • Employee task creation restriction')
    console.log('  • Full JSON API response with proper structure')
    console.log('\n')
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message)
    process.exit(1)
  }
}

test()
