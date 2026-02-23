/**
 * Script để kiểm tra và hash lại password của user
 * Usage: node scripts/check-user-password.js <email>
 */

require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')
const bcrypt = require('bcrypt')

async function checkUserPassword() {
  const email = process.argv[2]
  
  if (!email) {
    console.log('❌ Vui lòng cung cấp email: node scripts/check-user-password.js <email>')
    process.exit(1)
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'shop_365',
    port: parseInt(process.env.DB_PORT || '3306'),
  })

  try {
    console.log(`🔍 Đang kiểm tra user: ${email}`)
    
    const [users] = await connection.execute(
      `SELECT id, email, matKhau as password, hoTen as fullName, role, trangThai as status
       FROM TaiKhoan
       WHERE LOWER(TRIM(email)) = LOWER(TRIM(?))`,
      [email]
    )

    if (users.length === 0) {
      console.log(`❌ Không tìm thấy user với email: ${email}`)
      process.exit(1)
    }

    const user = users[0]
    console.log(`\n✅ Tìm thấy user:`)
    console.log(`   - ID: ${user.id}`)
    console.log(`   - Email: ${user.email}`)
    console.log(`   - Họ tên: ${user.fullName}`)
    console.log(`   - Role: ${user.role}`)
    console.log(`   - Status: ${user.status === 1 ? 'Active' : 'Inactive'}`)
    console.log(`   - Password length: ${user.password ? user.password.length : 0}`)
    console.log(`   - Password preview: ${user.password ? user.password.substring(0, 20) + '...' : 'NULL'}`)
    
    // Kiểm tra xem password có được hash không
    const isHashed = user.password && user.password.startsWith('$2')
    console.log(`\n🔐 Password status:`)
    console.log(`   - Is hashed: ${isHashed ? '✅ Yes' : '❌ No (plain text)'}`)
    
    if (!isHashed) {
      console.log(`\n⚠️  Password chưa được hash!`)
      console.log(`   Password hiện tại: "${user.password}"`)
      
      // Hỏi có muốn hash lại không
      const readline = require('readline')
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })
      
      rl.question('\n❓ Bạn có muốn hash lại password này không? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          try {
            const saltRounds = 10
            const hashedPassword = await bcrypt.hash(user.password, saltRounds)
            
            await connection.execute(
              `UPDATE TaiKhoan SET matKhau = ? WHERE id = ?`,
              [hashedPassword, user.id]
            )
            
            console.log(`\n✅ Đã hash và cập nhật password thành công!`)
            console.log(`   Hash preview: ${hashedPassword.substring(0, 30)}...`)
          } catch (error) {
            console.error(`\n❌ Lỗi khi hash password:`, error.message)
          }
        } else {
          console.log(`\n⏭️  Bỏ qua hash password`)
        }
        
        rl.close()
        await connection.end()
        process.exit(0)
      })
    } else {
      console.log(`\n✅ Password đã được hash đúng cách`)
      
      // Test với một password mẫu
      const testPassword = process.argv[3]
      if (testPassword) {
        console.log(`\n🧪 Testing password: "${testPassword}"`)
        const isValid = await bcrypt.compare(testPassword, user.password)
        console.log(`   Result: ${isValid ? '✅ Match' : '❌ No match'}`)
      }
      
      await connection.end()
      process.exit(0)
    }
  } catch (error) {
    console.error('❌ Lỗi:', error)
    await connection.end()
    process.exit(1)
  }
}

checkUserPassword()
