/**
 * Test JWT Token Authentication
 * Kiểm tra login, token generation, và API authentication
 */

require('dotenv').config({ path: '.env.local' })

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function testTokenAuth() {
  console.log('🧪 Testing JWT Token Authentication\n')
  console.log('='.repeat(60))

  // Test 1: Login và lấy access token
  console.log('\n📝 Test 1: Login và lấy tokens')
  console.log('-'.repeat(60))
  
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@gadung365.vn', // Thử với admin account
        password: 'admin123', // Thử với password mặc định
      }),
    })

    const loginData = await loginResponse.json()
    
    if (loginData.success) {
      console.log('✅ Login thành công!')
      console.log('   User:', loginData.data.user.email)
      console.log('   Role:', loginData.data.user.role)
      console.log('   Access Token:', loginData.data.accessToken ? '✅ Có' : '❌ Không có')
      console.log('   Token length:', loginData.data.accessToken?.length || 0)
      
      const accessToken = loginData.data.accessToken
      const cookies = loginResponse.headers.get('set-cookie')
      
      console.log('   Refresh Token Cookie:', cookies?.includes('refreshToken') ? '✅ Có' : '❌ Không có')
      console.log('   Session Cookie:', cookies?.includes('session') ? '✅ Có' : '❌ Không có')
      
      // Test 2: Sử dụng access token để gọi API
      console.log('\n📝 Test 2: Gọi API với Access Token')
      console.log('-'.repeat(60))
      
      const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      
      const meData = await meResponse.json()
      
      if (meData.success) {
        console.log('✅ API call với token thành công!')
        console.log('   User:', meData.data.user.email)
      } else {
        console.log('❌ API call với token thất bại:', meData.error)
      }
      
      // Test 3: Gọi API với cookie (backward compatibility)
      console.log('\n📝 Test 3: Gọi API với Cookie (backward compat)')
      console.log('-'.repeat(60))
      
      const cookieHeader = cookies?.split(',')[0] || ''
      const sessionCookie = cookieHeader.split(';')[0]
      
      const meCookieResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Cookie': sessionCookie,
        },
      })
      
      const meCookieData = await meCookieResponse.json()
      
      if (meCookieData.success) {
        console.log('✅ API call với cookie thành công!')
        console.log('   User:', meCookieData.data.user.email)
      } else {
        console.log('❌ API call với cookie thất bại:', meCookieData.error)
      }
      
      // Test 4: Refresh token
      console.log('\n📝 Test 4: Refresh Access Token')
      console.log('-'.repeat(60))
      
      const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Cookie': cookies || '',
        },
      })
      
      const refreshData = await refreshResponse.json()
      
      if (refreshData.success) {
        console.log('✅ Refresh token thành công!')
        console.log('   New Access Token:', refreshData.data.accessToken ? '✅ Có' : '❌ Không có')
        console.log('   Token length:', refreshData.data.accessToken?.length || 0)
      } else {
        console.log('❌ Refresh token thất bại:', refreshData.error)
      }
      
      // Test 5: Decode token để xem payload
      console.log('\n📝 Test 5: Decode Token Payload')
      console.log('-'.repeat(60))
      
      try {
        const tokenParts = accessToken.split('.')
        if (tokenParts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(tokenParts[1], 'base64url').toString('utf-8')
          )
          console.log('✅ Token payload:')
          console.log('   User ID:', payload.userId)
          console.log('   Email:', payload.email)
          console.log('   Role:', payload.role)
          console.log('   Issued At:', new Date(payload.iat * 1000).toLocaleString())
          console.log('   Expires At:', new Date(payload.exp * 1000).toLocaleString())
          console.log('   Expires In:', Math.round((payload.exp - payload.iat) / 60), 'phút')
        }
      } catch (err) {
        console.log('❌ Không thể decode token:', err.message)
      }
      
    } else {
      console.log('❌ Login thất bại:', loginData.error)
      console.log('\n💡 Hãy kiểm tra:')
      console.log('   1. Email và password có đúng không?')
      console.log('   2. User có tồn tại trong database không?')
      console.log('   3. Password đã được hash chưa?')
    }
  } catch (error) {
    console.error('❌ Lỗi:', error.message)
    console.log('\n💡 Hãy đảm bảo:')
    console.log('   1. Dev server đang chạy (npm run dev)')
    console.log('   2. Database đã được setup')
    console.log('   3. Có user trong database')
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Test hoàn thành!\n')
}

// Chạy test
testTokenAuth().catch(console.error)
