import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { cached } from '@/lib/cache'

export async function GET() {
  try {
    await requireAdmin()

    // Cache stats trong 1 phút (thay đổi thường xuyên nhưng không cần real-time)
    const stats = await cached(
      'admin:stats',
      async () => {
        // Revenue stats
        const [todayRevenue] = await queryNamed(
          `SELECT COALESCE(SUM(tongGiaSauPGG), 0) as total
           FROM HoaDon
           WHERE DATE(ngayTao) = CURDATE() AND trangThai != 0`,
          {}
        )

        const [monthRevenue] = await queryNamed(
          `SELECT COALESCE(SUM(tongGiaSauPGG), 0) as total
           FROM HoaDon
           WHERE YEAR(ngayTao) = YEAR(CURDATE()) 
           AND MONTH(ngayTao) = MONTH(CURDATE())
           AND trangThai != 0`,
          {}
        )

        const [yearRevenue] = await queryNamed(
          `SELECT COALESCE(SUM(tongGiaSauPGG), 0) as total
           FROM HoaDon
           WHERE YEAR(ngayTao) = YEAR(CURDATE())
           AND trangThai != 0`,
          {}
        )

        // Order counts
        const [pendingOrders] = await queryNamed(
          `SELECT COUNT(*) as count FROM HoaDon WHERE trangThai = 1`,
          {}
        )

        const [processingOrders] = await queryNamed(
          `SELECT COUNT(*) as count FROM HoaDon WHERE trangThai = 2`,
          {}
        )

        const [shippingOrders] = await queryNamed(
          `SELECT COUNT(*) as count FROM HoaDon WHERE trangThai = 3`,
          {}
        )

        const [completedOrders] = await queryNamed(
          `SELECT COUNT(*) as count FROM HoaDon WHERE trangThai = 4`,
          {}
        )

        // Product count
        const [productCount] = await queryNamed(
          `SELECT COUNT(DISTINCT sp.id) as count
           FROM SanPham sp
           LEFT JOIN ChiTietSanPham ctsp ON sp.id = ctsp.idSP
           WHERE ctsp.trangThai = 1 OR ctsp.trangThai IS NULL`,
          {}
        )

        // User count
        const [userCount] = await queryNamed(
          `SELECT COUNT(*) as count FROM TaiKhoan WHERE trangThai = 1`,
          {}
        )

        // Recent orders
        const recentOrders = await queryNamed(
          `SELECT 
            id,
            maHoaDon as orderCode,
            idUser as userId,
            tongGiaSauPGG as totalPrice,
            trangThai as status,
            ngayTao as createdAt
          FROM HoaDon
          WHERE trangThai != 0
          ORDER BY ngayTao DESC
          LIMIT 5`,
          {}
        )

        // Top products
        const topProducts = await queryNamed(
          `SELECT 
            sp.id,
            sp.ten as name,
            SUM(hdct.soLuong) as totalSold
          FROM SanPham sp
          LEFT JOIN ChiTietSanPham ctsp ON sp.id = ctsp.idSP
          LEFT JOIN HoaDonChiTiet hdct ON ctsp.id = hdct.idCTSP
          LEFT JOIN HoaDon hd ON hdct.idHoaDon = hd.id AND hd.trangThai = 4
          GROUP BY sp.id, sp.ten
          ORDER BY totalSold DESC
          LIMIT 5`,
          {}
        )

        return {
          revenue: {
            today: parseFloat(todayRevenue[0]?.total || 0),
            month: parseFloat(monthRevenue[0]?.total || 0),
            year: parseFloat(yearRevenue[0]?.total || 0),
          },
          orders: {
            pending: parseInt(pendingOrders[0]?.count || 0),
            processing: parseInt(processingOrders[0]?.count || 0),
            shipping: parseInt(shippingOrders[0]?.count || 0),
            completed: parseInt(completedOrders[0]?.count || 0),
          },
          products: parseInt(productCount[0]?.count || 0),
          users: parseInt(userCount[0]?.count || 0),
          recentOrders,
          topProducts,
        }
      },
      60 // Cache 1 phút
    )

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.message?.includes('Admin') ? 403 : 500 }
    )
  }
}
