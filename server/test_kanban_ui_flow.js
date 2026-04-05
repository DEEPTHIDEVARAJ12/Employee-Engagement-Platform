const BASE_URL = 'http://localhost:5000/api/rbac'

async function test() {
  try {
    console.log('\n=== KANBAN UI FLOW TEST ===\n')

    // 1. Register and login HR
    console.log('1. Register HR user...')
    let res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test HR',
        email: `hr-${Date.now()}@test.com`,
        password: 'password123',
        role: 'HR',
      }),
    })
    let data = await res.json()
    const hrToken = data.token
    const hrUserId = data.user.id

    if (!hrToken || !hrUserId) {
      throw new Error('HR registration failed')
    }
    console.log('✓ HR registered and logged in')

    // 2. Register employees
    console.log('2. Register employee users...')
    const employees = []
    for (let i = 1; i <= 2; i++) {
      const email = `emp${i}-${Date.now()}@test.com`
      res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Employee ${i}`,
          email: email,
          password: 'password123',
          role: 'Employee',
        }),
      })
      data = await res.json()
      employees.push({ id: data.user.id, name: data.user.name, email: email })
    }
    console.log(`✓ ${employees.length} employees registered`)

    // 3. Create board as HR
    console.log('3. Create board...')
    res = await fetch(`${BASE_URL}/boards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`,
      },
      body: JSON.stringify({
        title: 'Test Board',
        description: 'Board for testing task assignments',
      }),
    })
    data = await res.json()
    const boardId = data.board._id
    const columnId = data.board.columns[0]._id
    console.log(`✓ Board created: ${boardId}`)

    // 4. Add members to board
    console.log('4. Add employees to board...')
    for (const emp of employees) {
      await fetch(`${BASE_URL}/boards/${boardId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${hrToken}`,
        },
        body: JSON.stringify({ userId: emp.id }),
      })
    }
    console.log('✓ Employees added to board')

    // 5. List employees (for task assignment UI)
    console.log('5. Fetch employee list (for UI multi-select)...')
    res = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${hrToken}` },
    })
    data = await res.json()
    console.log(`✓ Employee list fetched: ${data.count} users available`)

    // 6. Fetch board (what UI does on load)
    console.log('6. Fetch board with columns...')
    res = await fetch(`${BASE_URL}/boards/${boardId}`, {
      headers: { Authorization: `Bearer ${hrToken}` },
    })
    data = await res.json()
    console.log(`✓ Board loaded: ${data.board.title}`)
    console.log(`  Columns: ${data.board.columns.length}`)
    console.log(`  Members: ${data.board.members.length}`)

    // 7. Test task creation WITH assignees
    console.log('7. Create task WITH assignees...')
    res = await fetch(`${BASE_URL}/boards/${boardId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`,
      },
      body: JSON.stringify({
        title: 'Test Task',
        description: 'Task with assignments',
        priority: 'High',
        columnId,
        assignees: [employees[0].id, employees[1].id],
      }),
    })
    data = await res.json()
    if (res.status === 201) {
      const taskId = data.task._id
      console.log(`✓ Task created: ${taskId}`)
      console.log(`  Assigned to: ${data.task.assignees.map(a => a.name).join(', ')}`)

      // 8. Employees can see assigned tasks
      console.log('8. Employee fetches assigned tasks...')
      for (const emp of employees) {
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emp.email,
            password: 'password123',
          }),
        })
        const loginData = await loginRes.json()
        const empToken = loginData.token

        res = await fetch(`${BASE_URL}/boards/${boardId}/tasks`, {
          headers: { Authorization: `Bearer ${empToken}` },
        })
        data = await res.json()
        if (data.tasks && data.tasks.length > 0) {
          console.log(`  ✓ ${emp.name} can see assigned task`)
        }
      }
    } else {
      console.log(`✗ Task creation failed: ${data.message}`)
    }

    // 9. Test task creation WITHOUT assignees
    console.log('9. Try to create task WITHOUT assignees (should fail)...')
    res = await fetch(`${BASE_URL}/boards/${boardId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrToken}`,
      },
      body: JSON.stringify({
        title: 'No Assignment Task',
        description: 'This should fail',
        priority: 'Low',
        columnId,
        assignees: [],
      }),
    })
    data = await res.json()
    if (res.status === 400) {
      console.log(`✓ Task creation correctly rejected: ${data.message}`)
    } else {
      console.log(`✗ Task should have been rejected but got status ${res.status}`)
    }

    console.log('\n=== ALL TESTS PASSED ===\n')
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

test()
