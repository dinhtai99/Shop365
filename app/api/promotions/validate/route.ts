import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, orderAmount } = body

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Promotion code is required' },
        { status: 400 }
      )
    }

    const promotions = await queryNamed(
      `SELECT 
        id,
        maPhieu as code,
        ten as name,
        loai as type,
        giaTriGiam as discountValue,
        giamToiDa as maxDiscount,
        dieuKienAD as minOrderAmount,
        soLuong as quantity,
        trangThai as status,
        ngayTao as createdAt,
        ngayHetHan as expiresAt
      FROM PhieuGiamGia
      WHERE maPhieu = @code`,
      { code }
    )

    if (promotions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          error: 'Mã giảm giá không tồn tại',
        },
      })
    }

    const promotion = promotions[0]

    // Kiểm tra promotion có hợp lệ không
    const checks = {
      isActive: promotion.status === 1,
      hasQuantity: promotion.quantity > 0,
      notExpired: !promotion.expiresAt || new Date(promotion.expiresAt) >= new Date(),
      meetsMinAmount: !promotion.minOrderAmount || (orderAmount && orderAmount >= parseFloat(promotion.minOrderAmount)),
    }

    const isValid = Object.values(checks).every((check) => check === true)

    if (!isValid) {
      let errorMessage = 'Mã giảm giá không hợp lệ'
      const errors: string[] = []
      if (!checks.isActive) errors.push('mã đã bị vô hiệu hóa')
      if (!checks.hasQuantity) errors.push('đã hết lượt sử dụng')
      if (!checks.notExpired) errors.push('đã hết hạn')
      if (!checks.meetsMinAmount) errors.push(`đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(promotion.minOrderAmount)}₫`)

      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          error: errorMessage + (errors.length > 0 ? ': ' + errors.join(', ') : ''),
        },
      })
    }

    // Tính toán giá trị giảm giá
    const orderTotal = orderAmount || 0
    let discount = 0

    if (promotion.type === 'PERCENT' || promotion.type === 'PHANTRAM') {
      discount = (orderTotal * parseFloat(promotion.discountValue)) / 100
      if (promotion.maxDiscount && discount > parseFloat(promotion.maxDiscount)) {
        discount = parseFloat(promotion.maxDiscount)
      }
    } else if (promotion.type === 'AMOUNT' || promotion.type === 'SOTIEN') {
      discount = parseFloat(promotion.discountValue)
      if (promotion.maxDiscount && discount > parseFloat(promotion.maxDiscount)) {
        discount = parseFloat(promotion.maxDiscount)
      }
    }

    const finalAmount = Math.max(0, orderTotal - discount)

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        promotion: {
          id: promotion.id,
          code: promotion.code,
          name: promotion.name,
          type: promotion.type === 'PERCENT' || promotion.type === 'PHANTRAM' ? 'PERCENTAGE' : 'FIXED',
          discountValue: parseFloat(promotion.discountValue),
          maxDiscount: promotion.maxDiscount ? parseFloat(promotion.maxDiscount) : undefined,
        },
        originalAmount: orderTotal,
        discount,
        finalAmount,
      },
    })
  } catch (error: any) {
    console.error('Error validating promotion:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
