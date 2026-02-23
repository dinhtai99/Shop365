require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function checkStructure() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_DATABASE || 'shop_online',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '3306'),
    })

    console.log('📦 Checking SanPham table structure...\n')
    
    // Get structure
    const [columns] = await connection.query('DESCRIBE SanPham')
    console.log('Columns in SanPham:')
    console.table(columns)

    // Get sample data
    console.log('\n📊 Sample data (first row):')
    const [rows] = await connection.query('SELECT * FROM SanPham LIMIT 1')
    if (rows.length > 0) {
      console.log(JSON.stringify(rows[0], null, 2))
    } else {
      console.log('No data found')
    }

    await connection.end()
  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkStructure()
