const BASE_URL = 'http://localhost:5000/api/rbac'

async function test() {
  try {
    console.log('Testing registration response structure...')
    
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
    console.log('Response keys:', Object.keys(data))
    console.log('User data:', JSON.stringify(data.user, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
  }
}

test()
