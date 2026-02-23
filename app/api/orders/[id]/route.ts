import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { Order, OrderItem } from '@/lib/models'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const session = await requireAuth()
    
    const { id } = await params

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
      WHERE id = @id`,
      { id: parseInt(id) }
    )

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    const order = orders[0]

    // Verify user can only access their own orders (unless admin)
    if (session.role !== 'ADMIN' && session.userId !== order.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only access your own orders' },
        { status: 403 }
      )
    }

    // Lấy chi tiết đơn hàng
    const items = await queryNamed<OrderItem>(
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
      { orderId: parseInt(id) }
    )

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        items,
      },
    })
  } catch (error: any) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const session = await requireAuth()
    
    const { id } = await params
    const body = await request.json()
    const { status: newStatus, paidAt } = body

    // Verify user is admin
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only admins can update orders' },
        { status: 403 }
      )
    }

    // Kiểm tra đơn hàng có tồn tại không
    const existingOrders = await queryNamed(
      `SELECT id, idUser as userId FROM HoaDon WHERE id = @id`,
      { id: parseInt(id) }
    )

    if (existingOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Update order status
    if (newStatus !== undefined) {
      await queryNamed(
        `UPDATE HoaDon SET trangThai = @status WHERE id = @id`,
        { status: parseInt(newStatus), id: parseInt(id) }
      )
    }

    // Update paidAt nếu có
    if (paidAt !== undefined) {
      await queryNamed(
        `UPDATE HoaDon SET ngayThanhToan = @paidAt WHERE id = @id`,
        { paidAt: paidAt ? new Date(paidAt) : null, id: parseInt(id) }
      )
    }

    // Lấy lại đơn hàng đã cập nhật
    const updatedOrders = await queryNamed<any>(
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
      WHERE id = @id`,
      { id: parseInt(id) }
    )

    return NextResponse.json({ success: true, data: updatedOrders[0] })
  } catch (error: any) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const session = await requireAuth()
    
    const { id } = await params

    // Verify user is admin
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only admins can delete orders' },
        { status: 403 }
      )
    }

    // Kiểm tra đơn hàng có tồn tại không
    const existingOrders = await queryNamed(
      `SELECT id FROM HoaDon WHERE id = @id`,
      { id: parseInt(id) }
    )

    if (existingOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Soft delete: Set status to 0 (cancelled)
    await queryNamed(
      `UPDATE HoaDon SET trangThai = 0 WHERE id = @id`,
      { id: parseInt(id) }
    )

    return NextResponse.json({ success: true, message: 'Order deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
