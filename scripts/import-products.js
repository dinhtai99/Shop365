require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

// Sample products data
const sampleProducts = [
  {
    name: 'Máy xay sinh tố đa năng Sunhouse SHD5329',
    code: 'SP001',
    categoryId: 5, // Đồ dùng nhà bếp
    price: 1290000,
    description: 'Máy xay sinh tố đa năng với công suất mạnh, phù hợp cho gia đình',
    quantity: 50,
  },
  {
    name: 'Nồi cơm điện tử Sharp KS-COM18EV',
    code: 'SP002',
    categoryId: 5, // Đồ dùng nhà bếp
    price: 2450000,
    description: 'Nồi cơm điện tử công nghệ Nhật Bản, nấu cơm ngon',
    quantity: 30,
  },
  {
    name: 'Bếp từ đôi Sunhouse SHD6155',
    code: 'SP003',
    categoryId: 5, // Đồ dùng nhà bếp
    price: 3890000,
    description: 'Bếp từ đôi hiện đại, tiết kiệm điện',
    quantity: 25,
  },
  {
    name: 'Máy ép trái cây tốc độ chậm Kangaroo KG521',
    code: 'SP004',
    categoryId: 5, // Đồ dùng nhà bếp
    price: 1950000,
    description: 'Máy ép trái cây tốc độ chậm, giữ nguyên dinh dưỡng',
    quantity: 40,
  },
  {
    name: 'Lò vi sóng Sharp R-209VN',
    code: 'SP005',
    categoryId: 5, // Đồ dùng nhà bếp
    price: 2190000,
    description: 'Lò vi sóng Sharp dung tích 20L',
    quantity: 35,
  },
  {
    name: 'Máy lọc không khí Xiaomi Air Purifier',
    code: 'SP006',
    categoryId: 1, // Thiết bị điện gia dụng trong nhà
    price: 3500000,
    description: 'Máy lọc không khí thông minh, lọc bụi mịn PM2.5',
    quantity: 20,
  },
  {
    name: 'Quạt điều hòa không khí',
    code: 'SP007',
    categoryId: 1, // Thiết bị điện gia dụng trong nhà
    price: 1200000,
    description: 'Quạt điều hòa làm mát không khí',
    quantity: 45,
  },
]

async function importProducts() {
  let connection

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_DATABASE || 'shop_online',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: parseInt(process.env.DB_PORT || '3306'),
    })

    console.log('✅ Connected to MySQL database\n')

    // Check if categories exist
    const [categories] = await connection.execute(
      'SELECT id FROM DanhMuc ORDER BY id LIMIT 1'
    )

    if (categories.length === 0) {
      console.log('⚠️  Chưa có danh mục nào. Vui lòng tạo danh mục trước.')
      return
    }

    console.log(`📥 Importing ${sampleProducts.length} products...\n`)

    let imported = 0
    let skipped = 0

    for (const product of sampleProducts) {
      try {
        // Check if product code already exists
        const [existing] = await connection.execute(
          'SELECT id FROM SanPham WHERE ma = ?',
          [product.code]
        )

        if (existing.length > 0) {
          console.log(`⏭️  Skipping ${product.code} - already exists`)
          skipped++
          continue
        }

        // Check if category exists
        const [catCheck] = await connection.execute(
          'SELECT id FROM DanhMuc WHERE id = ?',
          [product.categoryId]
        )

        const categoryId = catCheck.length > 0 
          ? product.categoryId 
          : categories[0].id // Use first category if specified doesn't exist

        // Insert into SanPham
        const [result] = await connection.execute(
          'INSERT INTO SanPham (ten, ma, idDanhMuc) VALUES (?, ?, ?)',
          [product.name, product.code, categoryId]
        )

        const productId = result.insertId

        // Insert into ChiTietSanPham
        await connection.execute(
          `INSERT INTO ChiTietSanPham 
           (idSP, gia, ghiChu, trangThai, soLuong) 
           VALUES (?, ?, ?, 1, ?)`,
          [
            productId,
            product.price,
            product.description || '',
            product.quantity || 0,
          ]
        )

        console.log(`✅ Imported: ${product.name} (${product.code})`)
        imported++
      } catch (error) {
        console.error(`❌ Error importing ${product.code}:`, error.message)
      }
    }

    console.log('\n✨ Import completed!')
    console.log(`   ✅ Imported: ${imported}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
  } catch (error) {
    console.error('❌ Database error:', error)
  } finally {
    if (connection) {
      await connection.end()
      console.log('🔌 Connection closed')
    }
  }
}

// Run import
importProducts()
