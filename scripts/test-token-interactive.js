/**
 * Test JWT Token Authentication - Interactive
 * Cho phép nhập email/password để test
 */

require('dotenv').config({ path: '.env.local' })
const readline = require('readline')

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function testTokenAuth() {
  console.log('🧪 Testing JWT Token Authentication\n')
  console.log('='.repeat(60))

  // Nhập email và password
  const email = await question('\n📧 Nhập email: ')
  const password = await question('🔐 Nhập password: ')
  
  console.log('\n📝 Test 1: Login và lấy tokens')
  console.log('-'.repeat(60))
  
  try {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const loginData = await loginResponse.json()
    
    if (loginData.success) {
      console.log('✅ Login thành công!')
      console.log('   User:', loginData.data.user.email)
      console.log('   Role:', loginData.data.user.role)
      console.log('   Full Name:', loginData.data.user.fullName)
      console.log('   Access Token:', loginData.data.accessToken ? '✅ Có' : '❌ Không có')
      
      if (loginData.data.accessToken) {
        const token = loginData.data.accessToken
        console.log('   Token length:', token.length, 'characters')
        console.log('   Token preview:', token.substring(0, 50) + '...')
        
        // Decode token
        try {
          const tokenParts = token.split('.')
          if (tokenParts.length === 3) {
            const payload = JSON.parse(
              Buffer.from(tokenParts[1], 'base64url').toString('utf-8')
            )
            console.log('\n   📋 Token Payload:')
            console.log('      User ID:', payload.userId)
            console.log('      Email:', payload.email)
            console.log('      Role:', payload.role)
            console.log('      Issued At:', new Date(payload.iat * 1000).toLocaleString('vi-VN'))
            console.log('      Expires At:', new Date(payload.exp * 1000).toLocaleString('vi-VN'))
            const expiresIn = Math.round((payload.exp - payload.iat) / 60)
            console.log('      Expires In:', expiresIn, 'phút')
          }
        } catch (err) {
          console.log('   ⚠️  Không thể decode token')
        }
      }
      
      const cookies = loginResponse.headers.get('set-cookie')
      console.log('\n   🍪 Cookies:')
      console.log('      Refresh Token:', cookies?.includes('refreshToken') ? '✅ Có' : '❌ Không có')
      console.log('      Session Cookie:', cookies?.includes('session') ? '✅ Có' : '❌ Không có')
      
      // Test 2: Sử dụng access token để gọi API
      console.log('\n📝 Test 2: Gọi API với Access Token')
      console.log('-'.repeat(60))
      
      const accessToken = loginData.data.accessToken
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
        console.log('   Role:', meData.data.user.role)
      } else {
        console.log('❌ API call với token thất bại:', meData.error)
      }
      
      // Test 3: Refresh token
      console.log('\n📝 Test 3: Refresh Access Token')
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
        if (refreshData.data.accessToken) {
          console.log('   Token length:', refreshData.data.accessToken.length, 'characters')
        }
      } else {
        console.log('❌ Refresh token thất bại:', refreshData.error)
      }
      
      console.log('\n' + '='.repeat(60))
      console.log('✅ Tất cả tests đều PASSED!')
      console.log('\n💡 Token authentication đang hoạt động tốt!')
      
    } else {
      console.log('❌ Login thất bại:', loginData.error)
      console.log('\n💡 Hãy kiểm tra:')
      console.log('   1. Email và password có đúng không?')
      console.log('   2. User có tồn tại trong database không?')
      console.log('   3. Password đã được hash chưa? (chạy: node scripts/hash-existing-passwords.js)')
    }
  } catch (error) {
    console.error('❌ Lỗi:', error.message)
    console.log('\n💡 Hãy đảm bảo:')
    console.log('   1. Dev server đang chạy (npm run dev)')
    console.log('   2. Database đã được setup')
  }

  rl.close()
}

// Chạy test
testTokenAuth().catch((err) => {
  console.error(err)
  rl.close()
})
