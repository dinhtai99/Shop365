/**
 * Script để test đăng nhập của user
 * Usage: node scripts/test-login-user.js <email> <password>
 */

require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')
const bcrypt = require('bcrypt')

async function testLogin() {
  const email = process.argv[2]
  const password = process.argv[3]
  
  if (!email || !password) {
    console.log('❌ Usage: node scripts/test-login-user.js <email> <password>')
    process.exit(1)
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_DATABASE || 'shop_online',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '3306'),
  })

  try {
    console.log(`\n🔐 Testing login for:`)
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}\n`)
    
    // Normalize email như trong API
    const normalizedEmail = email.trim().toLowerCase()
    const trimmedPassword = password.trim()
    
    console.log(`📧 Normalized email: "${normalizedEmail}"`)
    console.log(`🔑 Trimmed password: "${trimmedPassword}"\n`)
    
    // Query như trong API
    const [users] = await connection.execute(
      `SELECT 
        id,
        email,
        matKhau as password,
        hoTen as fullName,
        role,
        trangThai as status
      FROM TaiKhoan
      WHERE LOWER(TRIM(email)) = ?`,
      [normalizedEmail]
    )

    if (users.length === 0) {
      console.log(`❌ Không tìm thấy user với email: ${normalizedEmail}`)
      console.log(`\n💡 Kiểm tra:`)
      console.log(`   - Email có đúng không?`)
      console.log(`   - Có khoảng trắng thừa không?`)
      
      // Try to find similar emails
      const [similarUsers] = await connection.execute(
        `SELECT email FROM TaiKhoan WHERE email LIKE ? LIMIT 5`,
        [`%${normalizedEmail.split('@')[0]}%`]
      )
      
      if (similarUsers.length > 0) {
        console.log(`\n📋 Các email tương tự:`)
        similarUsers.forEach(u => console.log(`   - ${u.email}`))
      }
      
      process.exit(1)
    }

    const user = users[0]
    console.log(`✅ Tìm thấy user:`)
    console.log(`   - ID: ${user.id}`)
    console.log(`   - Email trong DB: "${user.email}"`)
    console.log(`   - Full name: ${user.fullName}`)
    console.log(`   - Role: ${user.role}`)
    console.log(`   - Status: ${user.status === 1 ? 'Active ✅' : 'Inactive ❌'}`)
    
    if (user.status !== 1) {
      console.log(`\n❌ Tài khoản đã bị khóa!`)
      process.exit(1)
    }
    
    console.log(`\n🔍 Kiểm tra password:`)
    console.log(`   - Password length: ${user.password ? user.password.length : 0}`)
    console.log(`   - Password preview: ${user.password ? user.password.substring(0, 30) + '...' : 'NULL'}`)
    
    // Check if password is hashed
    const isPasswordHashed = user.password && user.password.startsWith('$2')
    console.log(`   - Is hashed: ${isPasswordHashed ? '✅ Yes' : '❌ No (plain text)'}`)
    
    let isValidPassword = false
    
    if (isPasswordHashed) {
      console.log(`\n🔐 So sánh với bcrypt.compare...`)
      isValidPassword = await bcrypt.compare(trimmedPassword, user.password)
      console.log(`   Result: ${isValidPassword ? '✅ Match' : '❌ No match'}`)
      
      if (!isValidPassword) {
        console.log(`\n⚠️  Password không khớp!`)
        console.log(`\n💡 Kiểm tra:`)
        console.log(`   - Password bạn nhập có đúng không?`)
        console.log(`   - Có khoảng trắng thừa không?`)
        console.log(`   - Có ký tự đặc biệt không?`)
        
        // Test với password gốc từ DB (nếu là plain text)
        if (!user.password.startsWith('$2')) {
          console.log(`\n🧪 Testing với password từ DB (plain text):`)
          const directMatch = trimmedPassword === user.password
          console.log(`   Direct match: ${directMatch ? '✅ Yes' : '❌ No'}`)
          console.log(`   DB password: "${user.password}"`)
          console.log(`   Input password: "${trimmedPassword}"`)
        }
      }
    } else {
      console.log(`\n⚠️  Password chưa được hash!`)
      console.log(`   So sánh trực tiếp (plain text)...`)
      isValidPassword = trimmedPassword === user.password
      console.log(`   Result: ${isValidPassword ? '✅ Match' : '❌ No match'}`)
      
      if (!isValidPassword) {
        console.log(`\n❌ Password không khớp!`)
        console.log(`   DB password: "${user.password}"`)
        console.log(`   Input password: "${trimmedPassword}"`)
        console.log(`   Length DB: ${user.password.length}, Input: ${trimmedPassword.length}`)
      } else {
        console.log(`\n💡 Password khớp nhưng chưa được hash!`)
        console.log(`   Chạy: node scripts/hash-existing-passwords.js để hash lại`)
      }
    }
    
    if (isValidPassword) {
      console.log(`\n✅ Đăng nhập thành công!`)
      console.log(`\n📋 Thông tin user:`)
      console.log(`   - ID: ${user.id}`)
      console.log(`   - Email: ${user.email}`)
      console.log(`   - Full name: ${user.fullName}`)
      console.log(`   - Role: ${user.role}`)
    } else {
      console.log(`\n❌ Đăng nhập thất bại!`)
      process.exit(1)
    }
    
  } catch (error) {
    console.error('\n❌ Lỗi:', error)
    console.error('   Message:', error.message)
    console.error('   Code:', error.code)
    process.exit(1)
  } finally {
    await connection.end()
  }
}

testLogin()
