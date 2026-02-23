require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function checkRecords() {
  let connection
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_DATABASE || 'shop_online',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '3306'),
    })
    
    console.log('✅ Connected to database\n')
    
    // Check all ChiTietSanPham records for product ID 2
    const [records] = await connection.execute(
      `SELECT id, idSP, gia, ghiChu, trangThai, LENGTH(ghiChu) as len
       FROM ChiTietSanPham
       WHERE idSP = 2
       ORDER BY id DESC`
    )
    
    console.log(`📊 Found ${records.length} ChiTietSanPham record(s) for product ID 2:\n`)
    
    records.forEach((record, index) => {
      console.log(`Record ${index + 1}:`)
      console.log(`  ID: ${record.id}`)
      console.log(`  idSP: ${record.idSP}`)
      console.log(`  trangThai: ${record.trangThai}`)
      console.log(`  Description length: ${record.len}`)
      console.log(`  Description (first 200): ${record.ghiChu?.substring(0, 200) || '(NULL)'}`)
      console.log(`  Has MEDIA tag: ${record.ghiChu?.includes('[MEDIA:') ? 'YES ✅' : 'NO ❌'}`)
      console.log('')
    })
    
    // Check which record would be selected by current query
    const [selected] = await connection.execute(
      `SELECT ctsp.id, ctsp.ghiChu, LENGTH(ctsp.ghiChu) as len
       FROM SanPham sp
       LEFT JOIN ChiTietSanPham ctsp ON sp.id = ctsp.idSP AND ctsp.trangThai = 1
       WHERE sp.id = 2
       ORDER BY ctsp.id DESC
       LIMIT 1`
    )
    
    if (selected.length > 0) {
      console.log('🔍 Record selected by current GET query:')
      console.log(`  ID: ${selected[0].id}`)
      console.log(`  Description length: ${selected[0].len}`)
      console.log(`  Description: ${selected[0].ghiChu?.substring(0, 200) || '(NULL)'}`)
      console.log(`  Has MEDIA tag: ${selected[0].ghiChu?.includes('[MEDIA:') ? 'YES ✅' : 'NO ❌'}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (connection) await connection.end()
  }
}

checkRecords()
