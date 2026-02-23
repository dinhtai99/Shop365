import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { CartItem } from '@/lib/models'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const session = await requireAuth()
    
    const { id } = await params
    const body = await request.json()
    const { quantity } = body

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { success: false, error: 'quantity must be at least 1' },
        { status: 400 }
      )
    }

    // Lấy thông tin item và cart owner
    const items = await queryNamed<any>(
      `SELECT ghct.id, ghct.donGia as unitPrice, ghct.idGioHang as cartId, gh.idUser as userId
       FROM GioHangChiTiet ghct
       LEFT JOIN GioHang gh ON ghct.idGioHang = gh.id
       WHERE ghct.id = @itemId AND ghct.trangThai = 1`,
      { itemId: parseInt(id) }
    )

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      )
    }

    const item = items[0]

    // Verify user can only update their own cart items (unless admin)
    if (session.role !== 'ADMIN' && session.userId !== item.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only update your own cart items' },
        { status: 403 }
      )
    }
    const newTotalPrice = parseFloat(item.unitPrice) * parseInt(quantity)

    // Cập nhật số lượng và thành tiền
    await queryNamed(
      `UPDATE GioHangChiTiet
       SET soLuong = @quantity, thanhTien = @totalPrice
       WHERE id = @itemId`,
      {
        quantity: parseInt(quantity),
        totalPrice: newTotalPrice,
        itemId: parseInt(id),
      }
    )

    // Cập nhật tổng giá giỏ hàng
    const cartTotal = await queryNamed(
      `SELECT COALESCE(SUM(thanhTien), 0) as total
       FROM GioHangChiTiet
       WHERE idGioHang = @cartId AND trangThai = 1`,
      { cartId: item.cartId }
    )

    await queryNamed(
      `UPDATE GioHang SET tongGia = @totalPrice WHERE id = @cartId`,
      {
        totalPrice: cartTotal[0]?.total || 0,
        cartId: item.cartId,
      }
    )

    // Lấy lại item đã cập nhật
    const updatedItems = await queryNamed<CartItem>(
      `SELECT 
        ghct.id as id,
        ghct.idGioHang as cartId,
        ghct.idCTSP as productDetailId,
        sp.id as productId,
        sp.ten as productName,
        sp.ma as productCode,
        ghct.soLuong as quantity,
        ghct.donGia as unitPrice,
        ghct.thanhTien as totalPrice,
        ghct.trangThai as status,
        ghct.ngayThem as addedDate
      FROM GioHangChiTiet ghct
      LEFT JOIN ChiTietSanPham ctsp ON ghct.idCTSP = ctsp.id
      LEFT JOIN SanPham sp ON ctsp.idSP = sp.id
      WHERE ghct.id = @itemId`,
      { itemId: parseInt(id) }
    )

    return NextResponse.json({ success: true, data: updatedItems[0] })
  } catch (error: any) {
    console.error('Error updating cart item:', error)
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

    // Lấy thông tin item và cart owner
    const items = await queryNamed<any>(
      `SELECT ghct.idGioHang as cartId, gh.idUser as userId
       FROM GioHangChiTiet ghct
       LEFT JOIN GioHang gh ON ghct.idGioHang = gh.id
       WHERE ghct.id = @itemId AND ghct.trangThai = 1`,
      { itemId: parseInt(id) }
    )

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart item not found' },
        { status: 404 }
      )
    }

    const item = items[0]

    // Verify user can only delete their own cart items (unless admin)
    if (session.role !== 'ADMIN' && session.userId !== item.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only delete your own cart items' },
        { status: 403 }
      )
    }

    const cartId = item.cartId

    // Soft delete item
    await queryNamed(
      `UPDATE GioHangChiTiet SET trangThai = 0 WHERE id = @itemId`,
      { itemId: parseInt(id) }
    )

    // Cập nhật tổng giá giỏ hàng
    const cartTotal = await queryNamed(
      `SELECT COALESCE(SUM(thanhTien), 0) as total
       FROM GioHangChiTiet
       WHERE idGioHang = @cartId AND trangThai = 1`,
      { cartId }
    )

    await queryNamed(
      `UPDATE GioHang SET tongGia = @totalPrice WHERE id = @cartId`,
      {
        totalPrice: cartTotal[0]?.total || 0,
        cartId,
      }
    )

    return NextResponse.json({ success: true, message: 'Item removed from cart' })
  } catch (error: any) {
    console.error('Error deleting cart item:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
