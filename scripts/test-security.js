/**
 * Test Security Features
 * Test Rate Limiting, Account Lockout, Security Headers, CSRF Protection
 */

require('dotenv').config({ path: '.env.local' })

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function testSecurityFeatures() {
  console.log('🔒 Testing Security Features\n')
  console.log('='.repeat(60))

  // Test 1: Security Headers
  console.log('\n📝 Test 1: Security Headers')
  console.log('-'.repeat(60))
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/me`)
    const headers = response.headers
    
    const requiredHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-xss-protection': '1; mode=block',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'content-security-policy': 'default-src',
    }
    
    let allHeadersPresent = true
    for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
      const value = headers.get(header)
      if (value) {
        if (expectedValue === 'default-src') {
          console.log(`   ✅ ${header}: ${value.substring(0, 50)}...`)
        } else {
          const match = value.toLowerCase().includes(expectedValue.toLowerCase())
          console.log(`   ${match ? '✅' : '❌'} ${header}: ${value}`)
          if (!match) allHeadersPresent = false
        }
      } else {
        console.log(`   ❌ ${header}: Missing`)
        allHeadersPresent = false
      }
    }
    
    if (allHeadersPresent) {
      console.log('\n   ✅ Tất cả security headers đều có mặt!')
    } else {
      console.log('\n   ⚠️  Một số security headers bị thiếu')
    }
  } catch (error) {
    console.log('   ❌ Lỗi khi test security headers:', error.message)
  }

  // Test 2: Rate Limiting - Login
  console.log('\n📝 Test 2: Rate Limiting (Login)')
  console.log('-'.repeat(60))
  
  try {
    let rateLimited = false
    let attempts = 0
    
    // Thử login nhiều lần với password sai
    for (let i = 0; i < 7; i++) {
      attempts++
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'user@gmail.com',
          password: 'wrongpassword',
        }),
      })
      
      const data = await response.json()
      
      if (response.status === 429) {
        rateLimited = true
        console.log(`   ✅ Rate limit triggered sau ${attempts} attempts`)
        console.log(`   Message: ${data.error}`)
        break
      }
      
      // Small delay để không spam quá nhanh
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    if (!rateLimited) {
      console.log(`   ⚠️  Rate limit không được trigger sau ${attempts} attempts`)
      console.log('   💡 Có thể cần đợi một chút để rate limit reset')
    }
  } catch (error) {
    console.log('   ❌ Lỗi khi test rate limiting:', error.message)
  }

  // Test 3: Account Lockout
  console.log('\n📝 Test 3: Account Lockout')
  console.log('-'.repeat(60))
  
  try {
    const testEmail = 'user@gmail.com'
    let accountLocked = false
    
    // Thử login sai nhiều lần
    for (let i = 0; i < 6; i++) {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'wrongpassword',
        }),
      })
      
      const data = await response.json()
      
      if (response.status === 423) {
        accountLocked = true
        console.log(`   ✅ Account bị lock sau ${i + 1} lần thử sai`)
        console.log(`   Message: ${data.error}`)
        break
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    if (!accountLocked) {
      console.log('   ⚠️  Account lockout không được trigger')
      console.log('   💡 Có thể account đã được unlock hoặc cache đã reset')
    }
  } catch (error) {
    console.log('   ❌ Lỗi khi test account lockout:', error.message)
  }

  // Test 4: CSRF Token Generation
  console.log('\n📝 Test 4: CSRF Token Generation')
  console.log('-'.repeat(60))
  
  try {
    // First, login để có session
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@gmail.com',
        password: '123456',
      }),
    })
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json()
      const cookies = loginResponse.headers.get('set-cookie')
      
      // Get CSRF token từ /api/auth/me
      const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Cookie': cookies || '',
        },
      })
      
      const meData = await meResponse.json()
      
      if (meData.success && meData.data.csrfToken) {
        console.log('   ✅ CSRF token được generate thành công')
        console.log(`   Token: ${meData.data.csrfToken.substring(0, 20)}...`)
        console.log(`   Length: ${meData.data.csrfToken.length} characters`)
      } else {
        console.log('   ❌ CSRF token không được trả về')
      }
    } else {
      console.log('   ⚠️  Không thể login để test CSRF token')
      console.log('   💡 Đảm bảo user@gmail.com / 123456 tồn tại và password đã được hash')
    }
  } catch (error) {
    console.log('   ❌ Lỗi khi test CSRF token:', error.message)
  }

  // Test 5: Rate Limiting - Register
  console.log('\n📝 Test 5: Rate Limiting (Register)')
  console.log('-'.repeat(60))
  
  try {
    let rateLimited = false
    
    // Thử register nhiều lần
    for (let i = 0; i < 5; i++) {
      const response = await fetch(`${BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: 'test123',
          fullName: 'Test User',
        }),
      })
      
      if (response.status === 429) {
        rateLimited = true
        const data = await response.json()
        console.log(`   ✅ Rate limit triggered sau ${i + 1} attempts`)
        console.log(`   Message: ${data.error}`)
        break
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    if (!rateLimited) {
      console.log('   ⚠️  Rate limit không được trigger (có thể do IP khác nhau)')
    }
  } catch (error) {
    console.log('   ❌ Lỗi khi test register rate limiting:', error.message)
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Security tests hoàn thành!\n')
  
  console.log('💡 Lưu ý:')
  console.log('   - Rate limiting có thể cần đợi một chút để reset')
  console.log('   - Account lockout sẽ tự động unlock sau 30 phút')
  console.log('   - CSRF token cần được gửi trong header X-CSRF-Token cho POST/PUT/DELETE')
  console.log('')
}

// Chạy tests
testSecurityFeatures().catch(console.error)
