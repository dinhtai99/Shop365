import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { Cart, CartItem } from '@/lib/models'

export async function GET(request: Request) {
  try {
    // Require authentication
    const session = await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    // Verify user can only access their own cart (unless admin)
    if (session.role !== 'ADMIN' && session.userId !== parseInt(userId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only access your own cart' },
        { status: 403 }
      )
    }

    // Lấy giỏ hàng active của user
    const carts = await queryNamed<Cart>(
      `SELECT 
        id,
        idUser as userId,
        ngayTao as createdAt,
        tongGia as totalPrice,
        trangThai as status
      FROM GioHang
      WHERE idUser = @userId AND trangThai = 1
      ORDER BY ngayTao DESC
      LIMIT 1`,
      { userId: parseInt(userId) }
    )

    if (carts.length === 0) {
      return NextResponse.json({ success: true, data: null })
    }

    const cart = carts[0]

    // Lấy chi tiết giỏ hàng
    const items = await queryNamed<CartItem>(
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
      WHERE ghct.idGioHang = @cartId AND ghct.trangThai = 1`,
      { cartId: cart.id }
    )

    return NextResponse.json({
      success: true,
      data: {
        ...cart,
        items,
      },
    })
  } catch (error: any) {
    console.error('Error fetching cart:', error)
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
    const { userId, productDetailId, quantity } = body

    if (!userId || !productDetailId || !quantity) {
      return NextResponse.json(
        { success: false, error: 'userId, productDetailId, and quantity are required' },
        { status: 400 }
      )
    }

    // Verify user can only add to their own cart (unless admin)
    if (session.role !== 'ADMIN' && session.userId !== parseInt(userId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only add to your own cart' },
        { status: 403 }
      )
    }

    // Kiểm tra ChiTietSanPham có tồn tại không
    const productDetails = await queryNamed(
      `SELECT ctsp.id, ctsp.gia, sp.id as productId, sp.ten as productName
       FROM ChiTietSanPham ctsp
       LEFT JOIN SanPham sp ON ctsp.idSP = sp.id
       WHERE ctsp.id = @productDetailId AND ctsp.trangThai = 1`,
      { productDetailId }
    )

    if (productDetails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product detail not found or inactive' },
        { status: 404 }
      )
    }

    const productDetail = productDetails[0]
    const unitPrice = parseFloat(productDetail.gia) || 0
    const totalPrice = unitPrice * parseInt(quantity)

    // Tìm hoặc tạo giỏ hàng active
    let carts = await queryNamed<Cart>(
      `SELECT id FROM GioHang 
       WHERE idUser = @userId AND trangThai = 1 
       ORDER BY ngayTao DESC LIMIT 1`,
      { userId: parseInt(userId) }
    )

    let cartId: number

    if (carts.length === 0) {
      // Tạo giỏ hàng mới
      await queryNamed(
        `INSERT INTO GioHang (idUser, ngayTao, tongGia, trangThai)
         VALUES (@userId, CURDATE(), 0, 1)`,
        { userId: parseInt(userId) }
      )
      const inserted = await queryNamed('SELECT LAST_INSERT_ID() as id')
      cartId = inserted[0]?.id
    } else {
      cartId = carts[0].id
    }

    // Kiểm tra item đã tồn tại trong giỏ hàng chưa
    const existingItems = await queryNamed(
      `SELECT id, soLuong FROM GioHangChiTiet
       WHERE idGioHang = @cartId AND idCTSP = @productDetailId AND trangThai = 1`,
      { cartId, productDetailId }
    )

    if (existingItems.length > 0) {
      // Cập nhật số lượng
      const existingItem = existingItems[0]
      const newQuantity = existingItem.soLuong + parseInt(quantity)
      const newTotalPrice = unitPrice * newQuantity

      await queryNamed(
        `UPDATE GioHangChiTiet
         SET soLuong = @quantity, thanhTien = @totalPrice
         WHERE id = @itemId`,
        {
          quantity: newQuantity,
          totalPrice: newTotalPrice,
          itemId: existingItem.id,
        }
      )
    } else {
      // Thêm item mới
      await queryNamed(
        `INSERT INTO GioHangChiTiet 
         (idCTSP, idGioHang, soLuong, donGia, thanhTien, trangThai, ngayThem)
         VALUES (@productDetailId, @cartId, @quantity, @unitPrice, @totalPrice, 1, CURDATE())`,
        {
          productDetailId,
          cartId,
          quantity: parseInt(quantity),
          unitPrice,
          totalPrice,
        }
      )
    }

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

    // Lấy lại giỏ hàng đã cập nhật
    const updatedCart = await queryNamed<Cart>(
      `SELECT 
        id,
        idUser as userId,
        ngayTao as createdAt,
        tongGia as totalPrice,
        trangThai as status
      FROM GioHang
      WHERE id = @cartId`,
      { cartId }
    )

    const items = await queryNamed<CartItem>(
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
      WHERE ghct.idGioHang = @cartId AND ghct.trangThai = 1`,
      { cartId }
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          ...updatedCart[0],
          items,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
