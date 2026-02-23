require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function testAddCategory() {
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

    const testName = `TEST_${Date.now()}`

    console.log(`📥 Testing INSERT with name: "${testName}"\n`)

    // Test INSERT
    const [insertResult] = await connection.execute(
      'INSERT INTO DanhMuc (tenDanhMuc) VALUES (?)',
      [testName]
    )

    console.log('Insert result:', insertResult)
    console.log('Insert ID:', insertResult.insertId)

    // Test LAST_INSERT_ID()
    const [lastIdResult] = await connection.execute('SELECT LAST_INSERT_ID() as id')
    console.log('LAST_INSERT_ID():', lastIdResult[0].id)

    // Get the inserted record
    const [category] = await connection.execute(
      'SELECT id, tenDanhMuc FROM DanhMuc WHERE id = ?',
      [insertResult.insertId]
    )

    console.log('\n✅ Category created successfully:')
    console.log('   ID:', category[0].id)
    console.log('   Name:', category[0].tenDanhMuc)

    // Verify it exists
    const [verify] = await connection.execute(
      'SELECT COUNT(*) as count FROM DanhMuc WHERE id = ?',
      [insertResult.insertId]
    )

    console.log('\n✅ Verification:')
    console.log('   Record exists:', verify[0].count > 0 ? 'YES' : 'NO')

    // Clean up - delete test record
    await connection.execute('DELETE FROM DanhMuc WHERE id = ?', [insertResult.insertId])
    console.log('\n🧹 Test record deleted')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Error code:', error.code)
    console.error('SQL State:', error.sqlState)
  } finally {
    if (connection) {
      await connection.end()
      console.log('\n🔌 Connection closed')
    }
  }
}

testAddCategory()
