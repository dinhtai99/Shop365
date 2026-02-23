/**
 * Detailed Security Test
 * Test với account khác để tránh conflict
 */

require('dotenv').config({ path: '.env.local' })

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function testAccountLockout() {
  console.log('🔒 Testing Account Lockout\n')
  console.log('='.repeat(60))

  // Test với admin account
  const testEmail = 'admin@gmail.com'
  
  console.log(`\n📝 Testing với email: ${testEmail}`)
  console.log('-'.repeat(60))
  
  try {
    // Thử login sai 6 lần
    for (let i = 1; i <= 6; i++) {
      console.log(`\n   Attempt ${i}/6:`)
      
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: 'wrongpassword',
        }),
      })
      
      const data = await response.json()
      
      console.log(`   Status: ${response.status}`)
      console.log(`   Message: ${data.error || 'N/A'}`)
      
      if (response.status === 423) {
        console.log(`\n   ✅ Account bị lock sau ${i} lần thử sai!`)
        console.log(`   Lock message: ${data.error}`)
        return
      }
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    console.log('\n   ⚠️  Account không bị lock sau 6 lần thử')
    console.log('   💡 Có thể do:')
    console.log('      - Cache đã reset')
    console.log('      - Logic lockout cần điều chỉnh')
    
  } catch (error) {
    console.log('   ❌ Lỗi:', error.message)
  }
}

async function testCSRFToken() {
  console.log('\n\n🔒 Testing CSRF Token\n')
  console.log('='.repeat(60))
  
  try {
    // Login với user account
    console.log('\n📝 Step 1: Login')
    console.log('-'.repeat(60))
    
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@gmail.com',
        password: '123456',
      }),
    })
    
    if (!loginResponse.ok) {
      console.log('   ❌ Login thất bại')
      const data = await loginResponse.json()
      console.log(`   Error: ${data.error}`)
      return
    }
    
    console.log('   ✅ Login thành công')
    
    // Get cookies
    const cookies = loginResponse.headers.get('set-cookie')
    console.log('   Cookies:', cookies ? '✅ Có' : '❌ Không có')
    
    // Get CSRF token
    console.log('\n📝 Step 2: Get CSRF Token')
    console.log('-'.repeat(60))
    
    const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Cookie': cookies || '',
      },
    })
    
    const meData = await meResponse.json()
    
    if (meData.success && meData.data.csrfToken) {
      console.log('   ✅ CSRF token được trả về')
      console.log(`   Token preview: ${meData.data.csrfToken.substring(0, 30)}...`)
      console.log(`   Token length: ${meData.data.csrfToken.length} characters`)
    } else {
      console.log('   ❌ CSRF token không được trả về')
      console.log('   Response:', JSON.stringify(meData, null, 2))
    }
    
  } catch (error) {
    console.log('   ❌ Lỗi:', error.message)
  }
}

async function testRateLimitDetails() {
  console.log('\n\n🔒 Testing Rate Limit Details\n')
  console.log('='.repeat(60))
  
  console.log('\n📝 Test: Login Rate Limit (5 attempts / 15 minutes)')
  console.log('-'.repeat(60))
  
  try {
    let successCount = 0
    let rateLimitedCount = 0
    
    for (let i = 1; i <= 7; i++) {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `test${Date.now()}@example.com`,
          password: 'wrong',
        }),
      })
      
      if (response.status === 429) {
        rateLimitedCount++
        const data = await response.json()
        console.log(`   Attempt ${i}: ❌ Rate Limited - ${data.error}`)
      } else {
        successCount++
        console.log(`   Attempt ${i}: ✅ Allowed (status: ${response.status})`)
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`\n   Summary:`)
    console.log(`   - Allowed: ${successCount}`)
    console.log(`   - Rate Limited: ${rateLimitedCount}`)
    
    if (rateLimitedCount > 0) {
      console.log(`   ✅ Rate limiting hoạt động!`)
    } else {
      console.log(`   ⚠️  Rate limiting không được trigger`)
    }
    
  } catch (error) {
    console.log('   ❌ Lỗi:', error.message)
  }
}

// Run all tests
async function runAllTests() {
  await testAccountLockout()
  await testCSRFToken()
  await testRateLimitDetails()
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ All tests completed!\n')
}

runAllTests().catch(console.error)
