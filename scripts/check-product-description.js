require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function checkDescription() {
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
    
    // Check ChiTietSanPham structure
    const [columns] = await connection.execute('DESCRIBE ChiTietSanPham')
    console.log('📊 ChiTietSanPham table structure:')
    columns.forEach(col => {
      if (col.Field === 'ghiChu') {
        console.log(`  ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`)
      }
    })
    
    // Check product ID 2 description
    const [products] = await connection.execute(
      `SELECT ctsp.ghiChu, LENGTH(ctsp.ghiChu) as length
       FROM ChiTietSanPham ctsp
       WHERE ctsp.idSP = 2 AND ctsp.trangThai = 1
       LIMIT 1`
    )
    
    if (products.length > 0) {
      const desc = products[0].ghiChu
      console.log(`\n📝 Product ID 2 description:`)
      console.log(`  Length: ${products[0].length} characters`)
      console.log(`  Content: ${desc || '(NULL)'}`)
      console.log(`  First 200 chars: ${desc?.substring(0, 200) || '(empty)'}`)
      console.log(`  Last 200 chars: ${desc?.substring(Math.max(0, desc.length - 200)) || '(empty)'}`)
      
      // Check for MEDIA tag
      if (desc && desc.includes('[MEDIA:')) {
        console.log(`\n✅ Found [MEDIA: tag in description`)
        const match = desc.match(/\[MEDIA:([^\]]+)\]/s)
        if (match) {
          const urls = match[1].split(',').map(u => u.trim())
          console.log(`  Extracted ${urls.length} URLs:`, urls)
        } else {
          console.log(`  ⚠️ MEDIA tag found but regex failed`)
        }
      } else {
        console.log(`\n⚠️ No [MEDIA: tag found in description`)
      }
    } else {
      console.log('\n⚠️ No ChiTietSanPham found for product ID 2')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (connection) await connection.end()
  }
}

checkDescription()
