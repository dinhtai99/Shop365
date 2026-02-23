require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function createUser() {
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

    // Get user input
    const email = await question('📧 Email: ')
    const password = await question('🔑 Mật khẩu: ')
    const fullName = await question('👤 Họ và tên: ')
    const phone = await question('📱 Số điện thoại (Enter để bỏ qua): ') || null
    const address = await question('🏠 Địa chỉ (Enter để bỏ qua): ') || null
    const gender = await question('⚧️  Giới tính (Nam/Nữ/Khác, Enter để bỏ qua): ') || null
    const dateOfBirth = await question('📅 Ngày sinh (YYYY-MM-DD, Enter để bỏ qua): ') || null

    if (!email || !password || !fullName) {
      console.log('\n❌ Email, mật khẩu và họ tên là bắt buộc!')
      rl.close()
      return
    }

    // Check if email already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM TaiKhoan WHERE email = ?',
      [email]
    )

    if (existingUsers.length > 0) {
      console.log(`\n❌ Email "${email}" đã tồn tại!`)
      rl.close()
      return
    }

    // Insert user
    await connection.execute(
      `INSERT INTO TaiKhoan 
       (email, matKhau, hoTen, gioiTinh, ngaySinh, sdt, diaChi, role, trangThai)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'USER', 1)`,
      [email, password, fullName, gender, dateOfBirth, phone, address]
    )

    // Get created user
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

    console.log('\n✅ Tạo tài khoản thành công!')
    console.log('='.repeat(60))
    console.log(`   ID: ${user.id}`)
    console.log(`   📧 Email: ${user.email}`)
    console.log(`   👤 Họ tên: ${user.fullName}`)
    console.log(`   🔑 Role: ${user.role}`)
    console.log(`   📱 SĐT: ${user.phone || '(chưa có)'}`)
    console.log(`   🏠 Địa chỉ: ${user.address || '(chưa có)'}`)
    console.log(`   ⚧️  Giới tính: ${user.gender || '(chưa có)'}`)
    console.log(`   📅 Ngày sinh: ${user.dateOfBirth || '(chưa có)'}`)
    console.log(`   ✅ Trạng thái: ${user.status === 1 ? 'Hoạt động' : 'Không hoạt động'}`)
    console.log('='.repeat(60))
    console.log('\n💡 Bạn có thể đăng nhập với email và mật khẩu vừa tạo')

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
    rl.close()
  }
}

createUser()
