require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function testConnection() {
  let connection
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_DATABASE || 'shop_online',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '3306'),
    })
    
    console.log('✅ Database connection successful!')
    
    // Test query
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM TaiKhoan')
    console.log('✅ Query test successful. Total users:', rows[0].count)
    
    // Test admin account
    const [admins] = await connection.execute(
      'SELECT id, email, role FROM TaiKhoan WHERE role = ? LIMIT 1',
      ['ADMIN']
    )
    
    if (admins.length > 0) {
      console.log('✅ Admin account found:', admins[0])
    } else {
      console.log('⚠️  No admin account found')
    }
    
  } catch (error) {
    console.error('❌ Database connection error:')
    console.error('Message:', error.message)
    console.error('Code:', error.code)
    console.error('SQL State:', error.sqlState)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('🔌 Connection closed')
    }
  }
}

testConnection()
