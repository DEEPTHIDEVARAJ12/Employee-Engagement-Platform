const BASE_URL = 'http://localhost:5000/api/rbac'

async function test() {
  try {
    console.log('\n=== KANBAN FRONTEND INTEGRATION TEST ===\n')

    // 1. Create test user and board
    console.log('1. Setting up test board...')
    let res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: `test-${Date.now()}@test.com`,
        password: 'password123',
        role: 'HR',
      }),
    })
    let data = await res.json()
    const token = data.token

    // Create board
    res = await fetch(`${BASE_URL}/boards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Integration Board',
        description: 'Test board for frontend',
      }),
    })
    data = await res.json()
    const boardId = data.board._id
    console.log(`✓ Board created: ${boardId}`)

    // 2. Register employee
    console.log('\n2. Registering employee...')
    res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Employee Test',
        email: `emp-${Date.now()}@test.com`,
        password: 'password123',
        role: 'Employee',
      }),
    })
    data = await res.json()
    const empId = data.user.id
    console.log(`✓ Employee created: ${empId}`)

    // 3. Fetch board like frontend does
    console.log('\n3. Fetching board (simulating frontend)...')
    res = await fetch(`${BASE_URL}/boards`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    data = await res.json()
    
    if (!data.boards || data.boards.length === 0) {
      throw new Error('No boards returned')
    }
    console.log(`✓ Got ${data.boards.length} boards`)
    
    // 4. Fetch full board
    console.log('\n4. Fetching full board details...')
    res = await fetch(`${BASE_URL}/boards/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    data = await res.json()
    const board = data.board

    console.log(`✓ Board loaded: ${board.title}`)
    console.log(`  - Columns: ${board.columns.length}`)
    
    // 5. Verify column structure
    console.log('\n5. Verifying column structure for frontend...')
    board.columns.forEach((col, idx) => {
      if (!col._id && !col.id) throw new Error(`Column ${idx} missing ID`)
      if (!col.title) throw new Error(`Column ${idx} missing title`)
      console.log(`  ✓ Column "${col.title}": _id="${col._id}"`)
    })

    // 6. Test task creation WITHOUT assignees (should fail)
    console.log('\n6. Testing task creation WITHOUT assignees (should fail)...')
    res = await fetch(`${BASE_URL}/boards/${boardId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Task without assignees',
        description: 'This should fail',
        priority: 'High',
        columnId: board.columns[0]._id,
        assignees: [],
      }),
    })
    data = await res.json()
    if (res.status === 400) {
      console.log(`✓ Task creation correctly rejected (status ${res.status})`)
      console.log(`  Error: ${data.message}`)
    } else {
      throw new Error(`Expected status 400 but got ${res.status}`)
    }

    // 7. Test task creation WITH assignees (should succeed)
    console.log('\n7. Testing task creation WITH assignees (should succeed)...')
    res = await fetch(`${BASE_URL}/boards/${boardId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Task with assignee',
        description: 'This should succeed',
        priority: 'High',
        columnId: board.columns[0]._id,
        assignees: [empId],
      }),
    })
    data = await res.json()
    if (res.status === 201) {
      console.log(`✓ Task created successfully (status ${res.status})`)
      console.log(`  Task ID: ${data.task._id}`)
      console.log(`  Assigned to: ${data.task.assignees.map(a => a.name).join(', ')}`)
    } else {
      throw new Error(`Expected status 201 but got ${res.status}: ${data.message}`)
    }

    // 8. Verify frontend normalize structure
    console.log('\n8. Verifying frontend data transformation...')
    console.log(`  Board structure:`)
    console.log(`    - title: ${board.title}`)
    console.log(`    - columns[0]._id: ${board.columns[0]._id}`)
    console.log(`    - columns[0].title: ${board.columns[0].title}`)
    console.log(`    - columns[0].color: ${board.columns[0].color}`)

    console.log('\n=== INTEGRATION TEST PASSED ===\n')
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

test()
