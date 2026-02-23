/**
 * Debug Login Issues
 * Test login API để tìm lỗi
 */

require('dotenv').config({ path: '.env.local' })

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function testLogin() {
  console.log('🔍 Testing Login API\n')
  console.log('='.repeat(60))
  
  // Test với email và password từ user
  const testEmail = process.argv[2] || 'admin@gmail.com'
  const testPassword = process.argv[3] || 'admin123'
  
  console.log(`📧 Email: ${testEmail}`)
  console.log(`🔑 Password: ${testPassword ? '*'.repeat(testPassword.length) : '(empty)'}`)
  console.log('-'.repeat(60))
  
  try {
    console.log('\n1️⃣ Testing API endpoint...')
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    })
    
    console.log(`   Status: ${response.status} ${response.statusText}`)
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()))
    
    const result = await response.json()
    console.log(`   Response:`, JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log('\n✅ Login thành công!')
      console.log(`   User: ${result.data.user?.email}`)
      console.log(`   Role: ${result.data.user?.role}`)
      console.log(`   Access Token: ${result.data.accessToken ? 'Có' : 'Không có'}`)
    } else {
      console.log('\n❌ Login thất bại!')
      console.log(`   Error: ${result.error}`)
      
      // Gợi ý fix
      if (result.error.includes('Email hoặc mật khẩu không đúng')) {
        console.log('\n💡 Gợi ý:')
        console.log('   1. Kiểm tra email và password có đúng không')
        console.log('   2. Kiểm tra password có được hash trong database không')
        console.log('   3. Chạy: node scripts/hash-existing-passwords.js')
      } else if (result.error.includes('khóa')) {
        console.log('\n💡 Gợi ý:')
        console.log('   - Tài khoản bị khóa do quá nhiều lần đăng nhập sai')
        console.log('   - Đợi 30 phút hoặc reset account lockout')
      } else if (response.status === 500) {
        console.log('\n💡 Gợi ý:')
        console.log('   - Kiểm tra database connection')
        console.log('   - Kiểm tra .env.local có đúng không')
        console.log('   - Kiểm tra MySQL server có chạy không')
      }
    }
    
  } catch (error) {
    console.log('\n❌ Lỗi khi test:')
    console.error('   ', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Gợi ý:')
      console.log('   - Next.js server chưa chạy')
      console.log('   - Chạy: npm run dev')
    } else if (error.message.includes('fetch')) {
      console.log('\n💡 Gợi ý:')
      console.log('   - Kiểm tra BASE_URL:', BASE_URL)
      console.log('   - Đảm bảo server đang chạy')
    }
  }
  
  console.log('\n' + '='.repeat(60))
}

// Test database connection
async function testDatabase() {
  console.log('\n\n🗄️  Testing Database Connection\n')
  console.log('='.repeat(60))
  
  try {
    const mysql = require('mysql2/promise')
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_DATABASE || 'shop_online',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '3306'),
    })
    
    console.log('✅ Database connected!')
    
    // Test query
    const [users] = await connection.execute(
      'SELECT id, email, role FROM TaiKhoan LIMIT 5'
    )
    
    console.log(`\n📊 Found ${users.length} users:`)
    users.forEach((user: any) => {
      console.log(`   - ${user.email} (${user.role})`)
    })
    
    await connection.end()
    
  } catch (error: any) {
    console.log('❌ Database connection failed!')
    console.error('   ', error.message)
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Gợi ý:')
      console.log('   - Kiểm tra DB_USER và DB_PASSWORD trong .env.local')
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Gợi ý:')
      console.log('   - Database không tồn tại')
      console.log('   - Kiểm tra DB_DATABASE trong .env.local')
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Gợi ý:')
      console.log('   - MySQL server chưa chạy')
      console.log('   - Khởi động MySQL server')
    }
  }
  
  console.log('='.repeat(60))
}

async function main() {
  await testDatabase()
  await testLogin()
}

main()
