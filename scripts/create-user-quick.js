require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')
const bcrypt = require('bcrypt')

async function createQuickUser() {
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

    // Default user data
    const email = 'user@gmail.com'
    const password = '123456'
    const fullName = 'Người dùng Test'
    const phone = '0987654321'
    const address = '123 Đường ABC, Quận XYZ, TP.HCM'
    const gender = 'Nam'
    const dateOfBirth = '1990-01-01'

    // Check if email already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM TaiKhoan WHERE email = ?',
      [email]
    )

    // Hash password trước khi lưu
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)
    console.log('🔐 Đã hash password\n')

    if (existingUsers.length > 0) {
      console.log(`⚠️  Email "${email}" đã tồn tại!`)
      console.log('💡 Đang cập nhật thông tin tài khoản...\n')
      
      // Update existing user với password đã hash
      await connection.execute(
        `UPDATE TaiKhoan 
         SET matKhau = ?, hoTen = ?, gioiTinh = ?, ngaySinh = ?, sdt = ?, diaChi = ?, role = 'USER', trangThai = 1
         WHERE email = ?`,
        [hashedPassword, fullName, gender, dateOfBirth, phone, address, email]
      )
      
      console.log('✅ Đã cập nhật tài khoản!')
    } else {
      // Insert new user với password đã hash
      await connection.execute(
        `INSERT INTO TaiKhoan 
         (email, matKhau, hoTen, gioiTinh, ngaySinh, sdt, diaChi, role, trangThai)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'USER', 1)`,
        [email, hashedPassword, fullName, gender, dateOfBirth, phone, address]
      )
      
      console.log('✅ Tạo tài khoản thành công!')
    }

    // Get user
    const [users] = await connection.execute(
      `SELECT 
        id,
        email,
        hoTen as fullName,
        gioiTinh as gender,
        ngaySinh as dateOfBirth,
        sdt as phone,
        diaChi as address,
        role,
        trangThai as status
      FROM TaiKhoan WHERE email = ?`,
      [email]
    )

    const user = users[0]

    console.log('\n📋 Thông tin tài khoản:')
    console.log('='.repeat(60))
    console.log(`   ID: ${user.id}`)
    console.log(`   📧 Email: ${user.email}`)
    console.log(`   🔑 Mật khẩu: ${password}`)
    console.log(`   👤 Họ tên: ${user.fullName}`)
    console.log(`   🔑 Role: ${user.role}`)
    console.log(`   📱 SĐT: ${user.phone}`)
    console.log(`   🏠 Địa chỉ: ${user.address}`)
    console.log(`   ⚧️  Giới tính: ${user.gender}`)
    console.log(`   📅 Ngày sinh: ${user.dateOfBirth}`)
    console.log(`   ✅ Trạng thái: ${user.status === 1 ? 'Hoạt động' : 'Không hoạt động'}`)
    console.log('='.repeat(60))
    console.log('\n💡 Bạn có thể đăng nhập với:')
    console.log(`   Email: ${email}`)
    console.log(`   Mật khẩu: ${password}`)

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

createQuickUser()
