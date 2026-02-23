/**
 * Add Database Indexes để tối ưu query performance
 */

require('dotenv').config({ path: '.env.local' })
const mysql = require('mysql2/promise')

async function addIndexes() {
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
    console.log('📊 Adding indexes để tối ưu performance...\n')

    const indexes = [
      // SanPham indexes
      {
        name: 'idx_sanpham_category',
        table: 'SanPham',
        columns: 'idDanhMuc',
        description: 'Index cho category filtering',
      },
      {
        name: 'idx_sanpham_search',
        table: 'SanPham',
        columns: 'ten, ma',
        description: 'Index cho search functionality',
      },
      
      // ChiTietSanPham indexes
      {
        name: 'idx_chitiet_product',
        table: 'ChiTietSanPham',
        columns: 'idSP, trangThai',
        description: 'Index cho product details lookup',
      },
      {
        name: 'idx_chitiet_price',
        table: 'ChiTietSanPham',
        columns: 'gia',
        description: 'Index cho price sorting',
      },
      
      // DanhMuc indexes
      {
        name: 'idx_danhmuc_name',
        table: 'DanhMuc',
        columns: 'tenDanhMuc',
        description: 'Index cho category name lookup',
      },
      
      // GioHang indexes
      {
        name: 'idx_giohang_user',
        table: 'GioHang',
        columns: 'idUser, trangThai',
        description: 'Index cho cart lookup by user',
      },
      
      // GioHangChiTiet indexes
      {
        name: 'idx_giohangchitiet_cart',
        table: 'GioHangChiTiet',
        columns: 'idGioHang, trangThai',
        description: 'Index cho cart items lookup',
      },
      
      // HoaDon indexes
      {
        name: 'idx_hoadon_user',
        table: 'HoaDon',
        columns: 'idUser',
        description: 'Index cho order lookup by user',
      },
      {
        name: 'idx_hoadon_status',
        table: 'HoaDon',
        columns: 'trangThai',
        description: 'Index cho order status filtering',
      },
      {
        name: 'idx_hoadon_date',
        table: 'HoaDon',
        columns: 'ngayTao',
        description: 'Index cho order date sorting',
      },
      
      // TaiKhoan indexes
      {
        name: 'idx_taikhoan_email',
        table: 'TaiKhoan',
        columns: 'email',
        description: 'Index cho email lookup (login)',
      },
      {
        name: 'idx_taikhoan_status',
        table: 'TaiKhoan',
        columns: 'trangThai',
        description: 'Index cho user status filtering',
      },
    ]

    let successCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const index of indexes) {
      try {
        // Check if index exists
        const [existing] = await connection.execute(
          `SHOW INDEX FROM ${index.table} WHERE Key_name = ?`,
          [index.name]
        )

        if (existing.length > 0) {
          console.log(`⏭️  ${index.name} - Đã tồn tại, bỏ qua`)
          skippedCount++
          continue
        }

        // Create index
        await connection.execute(
          `CREATE INDEX ${index.name} ON ${index.table} (${index.columns})`
        )
        console.log(`✅ ${index.name} - Created (${index.description})`)
        successCount++
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`⏭️  ${index.name} - Đã tồn tại, bỏ qua`)
          skippedCount++
        } else {
          console.error(`❌ ${index.name} - Error:`, error.message)
          errorCount++
        }
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Hoàn thành!')
    console.log(`   - Đã tạo: ${successCount} indexes`)
    console.log(`   - Đã bỏ qua: ${skippedCount} indexes (đã tồn tại)`)
    if (errorCount > 0) {
      console.log(`   - Lỗi: ${errorCount} indexes`)
    }
    console.log('='.repeat(60))
    console.log('\n💡 Database queries sẽ nhanh hơn đáng kể!')

  } catch (error) {
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

addIndexes()
