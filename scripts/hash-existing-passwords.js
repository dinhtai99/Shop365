/**
 * Script để hash lại password của các user hiện tại trong database
 * Chạy script này để fix các password đã được lưu plain text
 */

require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')
const bcrypt = require('bcrypt')

async function hashExistingPasswords() {
  let connection

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_DATABASE || 'shop_online',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '3306'),
    })

    console.log('✅ Connected to MySQL database\n')

    // Get all users
    const [users] = await connection.execute(
      `SELECT id, email, matKhau FROM TaiKhoan WHERE trangThai = 1`
    )

    console.log(`📋 Tìm thấy ${users.length} tài khoản đang hoạt động\n`)

    let updatedCount = 0
    let skippedCount = 0

    for (const user of users) {
      const password = user.matKhau

      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      if (password && password.startsWith('$2')) {
        console.log(`⏭️  User ${user.email} - Password đã được hash, bỏ qua`)
        skippedCount++
        continue
      }

      // If password is plain text, hash it
      if (password && password.length > 0) {
        try {
          const saltRounds = 10
          const hashedPassword = await bcrypt.hash(password, saltRounds)

          await connection.execute(
            `UPDATE TaiKhoan SET matKhau = ? WHERE id = ?`,
            [hashedPassword, user.id]
          )

          console.log(`✅ Đã hash password cho user: ${user.email}`)
          updatedCount++
        } catch (error) {
          console.error(`❌ Lỗi khi hash password cho user ${user.email}:`, error.message)
        }
      } else {
        console.log(`⚠️  User ${user.email} - Không có password, bỏ qua`)
        skippedCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log(`✅ Hoàn thành!`)
    console.log(`   - Đã hash: ${updatedCount} tài khoản`)
    console.log(`   - Đã bỏ qua: ${skippedCount} tài khoản`)
    console.log('='.repeat(60))
    console.log('\n💡 Bây giờ bạn có thể đăng nhập với password gốc của mình')

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   ⚠️  Lỗi xác thực MySQL. Kiểm tra lại DB_USER và DB_PASSWORD trong .env.local')
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   ⚠️  Database không tồn tại. Kiểm tra lại DB_DATABASE trong .env.local')
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   ⚠️  Không thể kết nối MySQL. Đảm bảo MySQL server đang chạy')
    }
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

hashExistingPasswords()
