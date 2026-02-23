import { NextResponse } from 'next/server'
import { queryNamed, getConnection } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { Order, OrderItem } from '@/lib/models'

export async function GET(request: Request) {
  try {
    // Require authentication
    const session = await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Admin can see all orders, regular users need userId
    if (session.role === 'ADMIN') {
      // Admin: Get all orders
      // Format datetime để đảm bảo trả về đúng format với timezone
      const orders = await queryNamed<any>(
        `SELECT 
          id,
          idUser as userId,
          idPGG as promotionId,
          maHoaDon as orderCode,
          DATE_FORMAT(ngayTao, '%Y-%m-%d %H:%i:%s') as createdAt,
          DATE_FORMAT(ngayThanhToan, '%Y-%m-%d %H:%i:%s') as paidAt,
          trangThai as status,
          tongGia as totalPrice,
          tongGiaSauPGG as totalPriceAfterPromotion
        FROM HoaDon
        ORDER BY ngayTao DESC`,
        {}
      )
      return NextResponse.json({ success: true, data: orders })
    }

    // Regular user: Need userId and can only see their own orders
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    if (session.userId !== parseInt(userId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only access your own orders' },
        { status: 403 }
      )
    }

    const orders = await queryNamed<any>(
      `SELECT 
        id,
        idUser as userId,
        idPGG as promotionId,
        maHoaDon as orderCode,
        DATE_FORMAT(ngayTao, '%Y-%m-%d %H:%i:%s') as createdAt,
        DATE_FORMAT(ngayThanhToan, '%Y-%m-%d %H:%i:%s') as paidAt,
        trangThai as status,
        tongGia as totalPrice,
        tongGiaSauPGG as totalPriceAfterPromotion
      FROM HoaDon
      WHERE idUser = @userId
      ORDER BY ngayTao DESC`,
      { userId: parseInt(userId) }
    )

    return NextResponse.json({ success: true, data: orders })
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Require authentication
    const session = await requireAuth()
    
    const body = await request.json()
    const { userId, cartId, promotionId } = body

    if (!userId || !cartId) {
      return NextResponse.json(
        { success: false, error: 'userId and cartId are required' },
        { status: 400 }
      )
    }

    // Verify user can only create orders for themselves (unless admin)
    if (session.role !== 'ADMIN' && session.userId !== parseInt(userId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only create orders for yourself' },
        { status: 403 }
      )
    }

    // Kiểm tra giỏ hàng có tồn tại và có items không
    const carts = await queryNamed(
      `SELECT id, tongGia as totalPrice FROM GioHang
       WHERE id = @cartId AND idUser = @userId AND trangThai = 1`,
      { cartId: parseInt(cartId), userId: parseInt(userId) }
    )

    if (carts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart not found or inactive' },
        { status: 404 }
      )
    }

    const cart = carts[0]

    const cartItems = await queryNamed(
      `SELECT idCTSP as productDetailId, soLuong as quantity, donGia as unitPrice
       FROM GioHangChiTiet
       WHERE idGioHang = @cartId AND trangThai = 1`,
      { cartId: parseInt(cartId) }
    )

    if (cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      )
    }

    // Generate order code
    const orderCode = `HD${Date.now()}`

    // Tính tổng giá
    let totalPrice = parseFloat(cart.totalPrice) || 0
    let totalPriceAfterPromotion = totalPrice

    // Tính promotion nếu có promotionId
    if (promotionId) {
      const promotions = await queryNamed(
        `SELECT 
          loai as type,
          giaTriGiam as discountValue,
          giamToiDa as maxDiscount,
          dieuKienAD as minOrderAmount,
          soLuong as quantity,
          trangThai as status,
          ngayHetHan as expiresAt
        FROM PhieuGiamGia
        WHERE id = @promotionId`,
        { promotionId: parseInt(promotionId) }
      )

      if (promotions.length > 0) {
        const promotion = promotions[0]

        // Kiểm tra promotion có hợp lệ không
        const isValid =
          promotion.status === 1 &&
          promotion.quantity > 0 &&
          (!promotion.expiresAt || new Date(promotion.expiresAt) >= new Date()) &&
          (!promotion.minOrderAmount || totalPrice >= parseFloat(promotion.minOrderAmount))

        if (isValid) {
          let discount = 0

          if (promotion.type === 'PERCENT' || promotion.type === 'PHANTRAM') {
            // Giảm theo phần trăm
            discount = (totalPrice * parseFloat(promotion.discountValue)) / 100
            if (promotion.maxDiscount && discount > parseFloat(promotion.maxDiscount)) {
              discount = parseFloat(promotion.maxDiscount)
            }
          } else if (promotion.type === 'AMOUNT' || promotion.type === 'SOTIEN') {
            // Giảm số tiền cố định
            discount = parseFloat(promotion.discountValue)
            if (promotion.maxDiscount && discount > parseFloat(promotion.maxDiscount)) {
              discount = parseFloat(promotion.maxDiscount)
            }
          }

          totalPriceAfterPromotion = Math.max(0, totalPrice - discount)

          // Giảm số lượng promotion
          await queryNamed(
            `UPDATE PhieuGiamGia SET soLuong = soLuong - 1 WHERE id = @promotionId`,
            { promotionId: parseInt(promotionId) }
          )
        }
      }
    }

    // Tạo hóa đơn - sử dụng connection riêng để đảm bảo LAST_INSERT_ID() hoạt động đúng
    const connection = await getConnection()
    let orderId: number
    
    try {
      // Insert order - dùng NOW() để lưu cả ngày và giờ
      const insertQuery = `INSERT INTO HoaDon 
       (idUser, idPGG, maHoaDon, ngayTao, trangThai, tongGia, tongGiaSauPGG)
       VALUES (?, ?, ?, NOW(), 1, ?, ?)`
      
      const [insertResult]: any = await connection.execute(insertQuery, [
        parseInt(userId),
        promotionId || null,
        orderCode,
        totalPrice,
        totalPriceAfterPromotion,
      ])
      
      orderId = insertResult.insertId
      
      if (!orderId) {
        throw new Error('Không thể lấy ID đơn hàng sau khi tạo')
      }
    } finally {
      connection.release()
    }

    // Tạo chi tiết hóa đơn từ giỏ hàng
    for (const item of cartItems) {
      await queryNamed(
        `INSERT INTO HoaDonChiTiet 
         (idCTSP, idHoaDon, gia, soLuong, trangThai)
         VALUES (@productDetailId, @orderId, @price, @quantity, 1)`,
        {
          productDetailId: item.productDetailId,
          orderId,
          price: parseFloat(item.unitPrice),
          quantity: parseInt(item.quantity),
        }
      )
    }

    // Đóng giỏ hàng (set trangThai = 0)
    await queryNamed(
      `UPDATE GioHang SET trangThai = 0 WHERE id = @cartId`,
      { cartId: parseInt(cartId) }
    )

    // Lấy lại đơn hàng đã tạo
    const orders = await queryNamed<any>(
      `SELECT 
        id,
        idUser as userId,
        idPGG as promotionId,
        maHoaDon as orderCode,
        DATE_FORMAT(ngayTao, '%Y-%m-%d %H:%i:%s') as createdAt,
        DATE_FORMAT(ngayThanhToan, '%Y-%m-%d %H:%i:%s') as paidAt,
        trangThai as status,
        tongGia as totalPrice,
        tongGiaSauPGG as totalPriceAfterPromotion
      FROM HoaDon
      WHERE id = @orderId`,
      { orderId }
    )

    const orderItems = await queryNamed<OrderItem>(
      `SELECT 
        hdct.id as id,
        hdct.idHoaDon as orderId,
        hdct.idCTSP as productDetailId,
        sp.id as productId,
        sp.ten as productName,
        sp.ma as productCode,
        hdct.gia as price,
        hdct.soLuong as quantity,
        hdct.trangThai as status
      FROM HoaDonChiTiet hdct
      LEFT JOIN ChiTietSanPham ctsp ON hdct.idCTSP = ctsp.id
      LEFT JOIN SanPham sp ON ctsp.idSP = sp.id
      WHERE hdct.idHoaDon = @orderId`,
      { orderId }
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          ...orders[0],
          items: orderItems,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
