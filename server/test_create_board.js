(async () => {
  try {
    const loginRes = await fetch('http://localhost:5000/api/rbac/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hr@company.com', password: 'HRPassword123' }),
    })
    const loginText = await loginRes.text()
    console.log('LOGIN status', loginRes.status)
    console.log('LOGIN body:', loginText)

    const loginJson = JSON.parse(loginText)
    const token = loginJson.token

    const createRes = await fetch('http://localhost:5000/api/rbac/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Q1 2024 Project', description: 'Main project for Q1' }),
    })
    const createText = await createRes.text()
    console.log('CREATE status', createRes.status)
    console.log('CREATE body:', createText)
      const createJson = JSON.parse(createText)
      const boardId = createJson.board._id
      const firstColumnId = createJson.board.columns[0]._id

      // Add members (employee1, employee2)
      await fetch('http://localhost:5000/api/rbac/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'employee1@company.com', password: 'EmpPassword123' }),
      })
      const emp1Login = await fetch('http://localhost:5000/api/rbac/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'employee1@company.com', password: 'EmpPassword123' }),
      })
      const emp1Json = await emp1Login.json()
      const emp1Id = emp1Json.user.id

      const emp2Login = await fetch('http://localhost:5000/api/rbac/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'employee2@company.com', password: 'EmpPassword456' }),
      })
      const emp2Json = await emp2Login.json()
      const emp2Id = emp2Json.user.id

      const add1 = await fetch(`http://localhost:5000/api/rbac/boards/${boardId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: emp1Id }),
      })
      console.log('ADD MEMBER1 status', add1.status)
      const add2 = await fetch(`http://localhost:5000/api/rbac/boards/${boardId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: emp2Id }),
      })
      console.log('ADD MEMBER2 status', add2.status)

      // Create a task assigned to employee1
      const taskRes = await fetch(`http://localhost:5000/api/rbac/tasks/board/${boardId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: 'Design UI Mockups', description: 'Create mockups', priority: 'High', deadline: '2024-02-15', columnId: firstColumnId, assignees: [emp1Id], tags: ['design','ui'] }),
      })
      const taskText = await taskRes.text()
      console.log('TASK status', taskRes.status)
      console.log('TASK body', taskText)

      // Fetch tasks as employee1
      const emp1TasksRes = await fetch(`http://localhost:5000/api/rbac/tasks/board/${boardId}`, { headers: { Authorization: `Bearer ${emp1Json.token}` } })
      console.log('EMP1 TASKS status', emp1TasksRes.status)
      console.log('EMP1 TASKS body', await emp1TasksRes.text())
  } catch (err) {
    console.error('ERR', err)
  }
})()
