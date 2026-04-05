#!/usr/bin/env node

// Test script to verify Kanban task creation with mandatory employee assignments

async function test() {
  const BASE_URL = 'http://localhost:5000/api/rbac'
  let hrToken, emp1Token, emp2Token
  let hrUserId, emp1UserId, emp2UserId, boardId, columnId

  try {
    // Register and login users
    console.log('\n=== REGISTRATION & LOGIN ===')

    // Register HR
    let res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test HR',
        email: `hr-${Date.now()}@test.com`,
        password: 'password123',
        role: 'HR'
      })
    })
    let data = await res.json()
    if (!res.ok) throw new Error(`HR register failed: ${data.message}`)
    hrUserId = data.user.id
    hrToken = data.token
    console.log('✓ HR registered:', data.user.email)

    // Register Employee 1
    res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Employee One',
        email: `emp1-${Date.now()}@test.com`,
        password: 'password123',
        role: 'Employee'
      })
    })
    data = await res.json()
    if (!res.ok) throw new Error(`Employee 1 register failed: ${data.message}`)
    emp1UserId = data.user.id
    emp1Token = data.token
    console.log('✓ Employee 1 registered:', data.user.email)

    // Register Employee 2
    res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Employee Two',
        email: `emp2-${Date.now()}@test.com`,
        password: 'password123',
        role: 'Employee'
      })
    })
    data = await res.json()
    if (!res.ok) throw new Error(`Employee 2 register failed: ${data.message}`)
    emp2UserId = data.user.id
    emp2Token = data.token
    console.log('✓ Employee 2 registered:', data.user.email)

    // Create board as HR
    console.log('\n=== BOARD CREATION ===')
    res = await fetch(`${BASE_URL}/boards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        title: 'Test Board',
        description: 'Testing task assignments'
      })
    })
    data = await res.json()
    if (!res.ok) throw new Error(`Board creation failed: ${data.message}`)
    boardId = data.board._id
    columnId = data.board.columns[0]._id
    console.log('✓ Board created:', boardId)
    console.log('  Column 1:', columnId)

    // Add employees to board
    console.log('\n=== ADDING BOARD MEMBERS ===')
    res = await fetch(`${BASE_URL}/boards/${boardId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hrToken}`
      },
      body: JSON.stringify({ userId: emp1UserId })
    })
    data = await res.json()
    if (!res.ok) throw new Error(`Add member 1 failed: ${data.message}`)
    console.log('✓ Employee 1 added to board')

    res = await fetch(`${BASE_URL}/boards/${boardId}/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hrToken}`
      },
      body: JSON.stringify({ userId: emp2UserId })
    })
    data = await res.json()
    if (!res.ok) throw new Error(`Add member 2 failed: ${data.message}`)
    console.log('✓ Employee 2 added to board')

    // Test Case 1: Create task WITHOUT assignees (should FAIL)
    console.log('\n=== TEST CASE 1: Create task WITHOUT assignees (should FAIL) ===')
    res = await fetch(`${BASE_URL}/boards/${boardId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        title: 'Task Without Assignees',
        description: 'This should fail',
        columnId: columnId,
        priority: 'Medium',
        assignees: []
      })
    })
    data = await res.json()
    console.log(`Status: ${res.status}`)
    console.log(`Response:`, data)
    if (res.ok) {
      console.log('❌ FAILED: Task was created without assignees (should have been rejected)')
    } else {
      console.log('✓ PASSED: Task creation correctly rejected without assignees')
      console.log(`  Error message: ${data.message}`)
    }

    // Test Case 2: Create task WITH assignees (should SUCCEED)
    console.log('\n=== TEST CASE 2: Create task WITH assignees (should SUCCEED) ===')
    res = await fetch(`${BASE_URL}/boards/${boardId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${hrToken}`
      },
      body: JSON.stringify({
        title: 'Task With Assignees',
        description: 'Assigned to employees 1 and 2',
        columnId: columnId,
        priority: 'High',
        assignees: [emp1UserId, emp2UserId]
      })
    })
    data = await res.json()
    console.log(`Status: ${res.status}`)
    if (!res.ok) {
      console.log('❌ FAILED:', data.message)
    } else {
      console.log('✓ PASSED: Task created successfully with assignees')
      console.log(`  Task ID: ${data.task._id}`)
      console.log(`  Title: ${data.task.title}`)
      console.log(`  Assignees: ${data.task.assignees.map(a => a.name).join(', ')}`)
    }

    // Test Case 3: Employee can see assigned task
    console.log('\n=== TEST CASE 3: Employees can see assigned tasks ===')
    res = await fetch(`${BASE_URL}/boards/${boardId}/tasks`, {
      headers: { 'Authorization': `Bearer ${emp1Token}` }
    })
    data = await res.json()
    if (!res.ok) {
      console.log('❌ FAILED: Could not fetch tasks as employee')
    } else {
      console.log('✓ PASSED: Employee can fetch assigned tasks')
      console.log(`  Tasks visible to employee: ${data.tasks.length}`)
      if (data.tasks.length > 0) {
        console.log(`  Task names: ${data.tasks.map(t => t.title).join(', ')}`)
      }
    }

    // Test Case 4: Employee cannot create task
    console.log('\n=== TEST CASE 4: Employees cannot create tasks ===')
    res = await fetch(`${BASE_URL}/boards/${boardId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${emp1Token}`
      },
      body: JSON.stringify({
        title: 'Employee Task',
        columnId: columnId,
        assignees: [emp1UserId]
      })
    })
    data = await res.json()
    if (res.ok) {
      console.log('❌ FAILED: Employee was able to create a task')
    } else {
      console.log('✓ PASSED: Employee correctly denied task creation')
      console.log(`  Error: ${data.message}`)
    }

    console.log('\n=== ALL TESTS COMPLETED ===\n')

  } catch (err) {
    console.error('Test error:', err.message)
    process.exit(1)
  }
}

test()
