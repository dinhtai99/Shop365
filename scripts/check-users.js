require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function checkUsers() {
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

    // Check total users
    const [totalUsers] = await connection.execute('SELECT COUNT(*) as count FROM TaiKhoan')
    const userCount = totalUsers[0].count
    console.log(`👥 Tổng số tài khoản (TaiKhoan): ${userCount} bản ghi\n`)

    if (userCount > 0) {
      // Get all users
      const [users] = await connection.execute(
        `SELECT 
          id,
          email,
          matKhau as password,
          hoTen as fullName,
          gioiTinh as gender,
          ngaySinh as dateOfBirth,
          sdt as phone,
          diaChi as address,
          role,
          trangThai as status
        FROM TaiKhoan 
        ORDER BY id`
      )

      console.log('📋 Danh sách tất cả tài khoản:')
      console.log('='.repeat(100))
      
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ID: ${user.id}`)
        console.log(`   📧 Email: ${user.email}`)
        console.log(`   🔐 Mật khẩu: ${user.password || '(chưa có)'}`)
        console.log(`   👤 Họ tên: ${user.fullName || '(chưa có)'}`)
        console.log(`   🔑 Role: ${user.role === 'ADMIN' ? '🔴 ADMIN' : '🔵 USER'}`)
        console.log(`   📱 SĐT: ${user.phone || '(chưa có)'}`)
        console.log(`   🏠 Địa chỉ: ${user.address ? (user.address.length > 50 ? user.address.substring(0, 50) + '...' : user.address) : '(chưa có)'}`)
        console.log(`   ⚧️  Giới tính: ${user.gender || '(chưa có)'}`)
        console.log(`   📅 Ngày sinh: ${user.dateOfBirth || '(chưa có)'}`)
        console.log(`   ✅ Trạng thái: ${user.status === 1 ? '🟢 Hoạt động' : '🔴 Không hoạt động'}`)
        console.log('-'.repeat(100))
      })

      // Statistics
      const [adminCount] = await connection.execute("SELECT COUNT(*) as count FROM TaiKhoan WHERE role = 'ADMIN'")
      const [userRoleCount] = await connection.execute("SELECT COUNT(*) as count FROM TaiKhoan WHERE role = 'USER'")
      const [activeCount] = await connection.execute('SELECT COUNT(*) as count FROM TaiKhoan WHERE trangThai = 1')
      const [inactiveCount] = await connection.execute('SELECT COUNT(*) as count FROM TaiKhoan WHERE trangThai != 1')

      console.log('\n📊 Thống kê:')
      console.log('='.repeat(100))
      console.log(`   🔴 Admin: ${adminCount[0].count} tài khoản`)
      console.log(`   🔵 User: ${userRoleCount[0].count} tài khoản`)
      console.log(`   🟢 Hoạt động: ${activeCount[0].count} tài khoản`)
      console.log(`   🔴 Không hoạt động: ${inactiveCount[0].count} tài khoản`)
      console.log('='.repeat(100))

      // Check if there are any admin accounts
      if (adminCount[0].count === 0) {
        console.log('\n⚠️  CHƯA CÓ TÀI KHOẢN ADMIN!')
        console.log('\n💡 Tạo tài khoản admin:')
        console.log('   npm run create:admin')
      }

      // Check if there are any active accounts
      if (activeCount[0].count === 0) {
        console.log('\n⚠️  KHÔNG CÓ TÀI KHOẢN NÀO ĐANG HOẠT ĐỘNG!')
      }

    } else {
      console.log('⚠️  CHƯA CÓ TÀI KHOẢN NÀO!')
      console.log('\n💡 Tạo tài khoản:')
      console.log('   1. Qua trang đăng ký: http://localhost:3000/register')
      console.log('   2. Tạo admin: npm run create:admin')
      console.log('   3. Hoặc thêm trực tiếp vào database')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
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

checkUsers()
