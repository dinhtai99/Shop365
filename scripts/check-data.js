/**
 * Kiểm tra data trong database và API
 */

require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function checkData() {
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
    console.log('='.repeat(60))
    
    // Check products
    console.log('\n📦 Checking Products (SanPham)...')
    const [products] = await connection.execute(
      `SELECT COUNT(*) as count FROM SanPham`
    )
    console.log(`   Total products: ${products[0].count}`)
    
    if (products[0].count > 0) {
      const [sampleProducts] = await connection.execute(
        `SELECT sp.id, sp.ten, sp.ma, sp.idDanhMuc 
         FROM SanPham sp 
         LIMIT 5`
      )
      console.log(`   Sample products:`)
      sampleProducts.forEach((p: any) => {
        console.log(`     - ID: ${p.id}, Name: ${p.ten}, Code: ${p.ma}`)
      })
    }
    
    // Check product details
    console.log('\n📋 Checking Product Details (ChiTietSanPham)...')
    const [details] = await connection.execute(
      `SELECT COUNT(*) as count FROM ChiTietSanPham WHERE trangThai = 1`
    )
    console.log(`   Active product details: ${details[0].count}`)
    
    // Check categories
    console.log('\n📁 Checking Categories (DanhMuc)...')
    const [categories] = await connection.execute(
      `SELECT COUNT(*) as count FROM DanhMuc`
    )
    console.log(`   Total categories: ${categories[0].count}`)
    
    if (categories[0].count > 0) {
      const [sampleCategories] = await connection.execute(
        `SELECT id, tenDanhMuc FROM DanhMuc LIMIT 5`
      )
      console.log(`   Sample categories:`)
      sampleCategories.forEach((c: any) => {
        console.log(`     - ID: ${c.id}, Name: ${c.tenDanhMuc}`)
      })
    }
    
    // Check products with details
    console.log('\n🔗 Checking Products with Details...')
    const [productsWithDetails] = await connection.execute(
      `SELECT COUNT(DISTINCT sp.id) as count
       FROM SanPham sp
       LEFT JOIN ChiTietSanPham ctsp ON sp.id = ctsp.idSP AND (ctsp.trangThai = 1 OR ctsp.trangThai IS NULL)
       LEFT JOIN DanhMuc dm ON sp.idDanhMuc = dm.id
       WHERE (ctsp.trangThai = 1 OR ctsp.trangThai IS NULL)`
    )
    console.log(`   Products with active details: ${productsWithDetails[0].count}`)
    
    if (productsWithDetails[0].count > 0) {
      const [sample] = await connection.execute(
        `SELECT 
          sp.id,
          sp.ten as name,
          sp.ma as code,
          sp.idDanhMuc as categoryId,
          dm.tenDanhMuc as category,
          COALESCE(ctsp.gia, 0) as price,
          COALESCE(ctsp.ghiChu, '') as description
        FROM SanPham sp
        LEFT JOIN ChiTietSanPham ctsp ON sp.id = ctsp.idSP AND (ctsp.trangThai = 1 OR ctsp.trangThai IS NULL)
        LEFT JOIN DanhMuc dm ON sp.idDanhMuc = dm.id
        WHERE (ctsp.trangThai = 1 OR ctsp.trangThai IS NULL)
        LIMIT 3`
      )
      console.log(`   Sample products with details:`)
      sample.forEach((p: any) => {
        console.log(`     - ${p.name} (${p.code}): ${p.price} VND, Category: ${p.category || 'N/A'}`)
      })
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('\n💡 Nếu không có data:')
    console.log('   1. Chạy script import data: node scripts/import-data.js')
    console.log('   2. Hoặc thêm sản phẩm qua admin panel')
    
  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   ⚠️  Lỗi xác thực MySQL. Kiểm tra lại DB_USER và DB_PASSWORD')
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   ⚠️  Database không tồn tại. Kiểm tra lại DB_DATABASE')
    }
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

checkData()
