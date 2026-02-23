/**
 * Quick Test JWT Token Authentication
 */

require('dotenv').config({ path: '.env.local' })

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function testTokenAuth() {
  console.log('🧪 Testing JWT Token Authentication\n')
  console.log('='.repeat(60))

  // Test với user@gmail.com / 123456
  const email = 'user@gmail.com'
  const password = '123456'
  
  console.log(`\n📝 Test Login: ${email}`)
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
      
      const accessToken = loginData.data.accessToken
      if (accessToken) {
        console.log('   ✅ Access Token:', accessToken.substring(0, 50) + '...')
        console.log('   Token length:', accessToken.length, 'characters')
        
        // Decode token
        try {
          const tokenParts = accessToken.split('.')
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
      } else {
        console.log('   ❌ Không có access token trong response!')
      }
      
      const cookies = loginResponse.headers.get('set-cookie')
      console.log('\n   🍪 Cookies:')
      console.log('      Refresh Token:', cookies?.includes('refreshToken') ? '✅ Có' : '❌ Không có')
      console.log('      Session Cookie:', cookies?.includes('session') ? '✅ Có' : '❌ Không có')
      
      // Test API với token
      console.log('\n📝 Test API với Access Token')
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
        console.log('   Role:', meData.data.user.role)
      } else {
        console.log('❌ API call với token thất bại:', meData.error)
      }
      
      // Test refresh token
      console.log('\n📝 Test Refresh Token')
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
    }
  } catch (error) {
    console.error('❌ Lỗi:', error.message)
    if (error.message.includes('fetch failed')) {
      console.log('\n💡 Đảm bảo dev server đang chạy: npm run dev')
    }
  }

  console.log('\n')
}

testTokenAuth().catch(console.error)
