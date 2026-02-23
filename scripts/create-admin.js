require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function createAdmin() {
  let connection

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'shop_online',
      port: parseInt(process.env.DB_PORT || '3306'),
    })

    console.log('✅ Connected to MySQL database\n')

    // Thông tin admin mặc định
    const adminEmail = process.argv[2] || 'admin@gia dung365.com'
    const adminPassword = process.argv[3] || 'admin123'
    const adminName = process.argv[4] || 'Administrator'

    console.log('📝 Creating admin account...')
    console.log(`   Email: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
    console.log(`   Name: ${adminName}\n`)

    // Kiểm tra email đã tồn tại chưa
    const [existing] = await connection.execute(
      'SELECT id, email, role FROM TaiKhoan WHERE email = ?',
      [adminEmail]
    )

    if (existing.length > 0) {
      const existingUser = existing[0]
      console.log(`⚠️  Email ${adminEmail} đã tồn tại!`)
      console.log(`   ID: ${existingUser.id}`)
      console.log(`   Role hiện tại: ${existingUser.role}`)

      if (existingUser.role === 'ADMIN') {
        console.log('   ✅ Đã là ADMIN rồi!')
        
        // Hỏi có muốn cập nhật password không
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout,
        })

        return new Promise((resolve) => {
          readline.question('\n   Bạn có muốn cập nhật mật khẩu? (y/n): ', async (answer) => {
            if (answer.toLowerCase() === 'y') {
              await connection.execute(
                'UPDATE TaiKhoan SET matKhau = ?, hoTen = ? WHERE id = ?',
                [adminPassword, adminName, existingUser.id]
              )
              console.log('   ✅ Đã cập nhật mật khẩu và tên!')
            }
            readline.close()
            resolve()
          })
        })
      } else {
        // Cập nhật role thành ADMIN
        await connection.execute(
          'UPDATE TaiKhoan SET role = "ADMIN", matKhau = ?, hoTen = ? WHERE id = ?',
          [adminPassword, adminName, existingUser.id]
        )
        console.log('   ✅ Đã cập nhật thành ADMIN!')
      }
    } else {
      // Tạo tài khoản admin mới
      const [result] = await connection.execute(
        `INSERT INTO TaiKhoan 
         (email, matKhau, hoTen, role, trangThai) 
         VALUES (?, ?, ?, 'ADMIN', 1)`,
        [adminEmail, adminPassword, adminName]
      )

      console.log(`✅ Tạo admin thành công!`)
      console.log(`   ID: ${result.insertId}`)
      console.log(`   Email: ${adminEmail}`)
      console.log(`   Password: ${adminPassword}`)
      console.log(`   Role: ADMIN`)
    }

    // Hiển thị danh sách tất cả admin
    console.log('\n📋 Danh sách tất cả ADMIN trong hệ thống:')
    const [admins] = await connection.execute(
      'SELECT id, email, hoTen, role, trangThai FROM TaiKhoan WHERE role = "ADMIN" ORDER BY id'
    )

    if (admins.length === 0) {
      console.log('   ⚠️  Không có admin nào')
    } else {
      admins.forEach((admin) => {
        console.log(`   - ID: ${admin.id}, Email: ${admin.email}, Tên: ${admin.hoTen}, Status: ${admin.trangThai === 1 ? 'Active' : 'Inactive'}`)
      })
    }

    console.log('\n✨ Hoàn thành!')
  } catch (error) {
    console.error('❌ Error:', error.message)
    if (error.code) console.error('   Error code:', error.code)
    if (error.sqlState) console.error('   SQL State:', error.sqlState)
  } finally {
    if (connection) {
      await connection.end()
      console.log('🔌 Connection closed')
    }
  }
}

createAdmin()
