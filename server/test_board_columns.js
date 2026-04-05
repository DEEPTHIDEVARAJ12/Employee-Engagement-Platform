const BASE_URL = 'http://localhost:5000/api/rbac'

async function test() {
  try {
    // Register test user
    console.log('Registering test HR user...')
    let res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test HR',
        email: `test-hr-single-${Date.now()}@test.com`,
        password: 'password123',
        role: 'HR',
      }),
    })
    let data = await res.json()
    const token = data.token
    console.log(`✓ Registered with token`)

    // Create a board
    console.log('\nCreating board...')
    res = await fetch(`${BASE_URL}/boards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Test Board',
        description: 'Test columns',
      }),
    })
    data = await res.json()
    const boardId = data.board._id
    console.log(`✓ Board created: ${boardId}`)

    // Fetch the board
    console.log('\nFetching board details...')
    res = await fetch(`${BASE_URL}/boards/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    console.log(`Status: ${res.status}`)
    data = await res.json()
    
    console.log(`\nBoard columns type: ${Array.isArray(data.board.columns) ? 'Array' : 'Unknown'}`)
    if (data.board.columns.length > 0) {
      const firstCol = data.board.columns[0]
      console.log(`First column type: ${typeof firstCol}`)
      console.log(`First column keys: ${typeof firstCol === 'object' ? Object.keys(firstCol).join(', ') : 'N/A (primitive)'}`)
      console.log(`First column value:`, JSON.stringify(firstCol, null, 2).substring(0, 200))
    }
  } catch (error) {
    console.error('Test failed:', error.message)
  }
}

test()
