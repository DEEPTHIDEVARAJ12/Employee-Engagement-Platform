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
        email: `test-hr-${Date.now()}@test.com`,
        password: 'password123',
        role: 'HR',
      }),
    })
    let data = await res.json()
    const token = data.token
    console.log(`✓ Registered with token: ${token.substring(0, 20)}...`)

    // Fetch boards
    console.log('\nFetching boards...')
    res = await fetch(`${BASE_URL}/boards`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    console.log(`Status: ${res.status}`)
    console.log(`Content-Type: ${res.headers.get('content-type')}`)
    
    data = await res.json()
    console.log(`Response keys: ${Object.keys(data).join(', ')}`)
    console.log(`Response structure:`, JSON.stringify(data, null, 2).substring(0, 500))

    console.log('\n✓ API test successful')
  } catch (error) {
    console.error('Test failed:', error.message)
  }
}

test()
