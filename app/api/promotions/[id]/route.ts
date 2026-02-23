import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { Promotion } from '@/lib/models'
import { requireAdmin } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const promotions = await queryNamed<Promotion>(
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
      WHERE id = @id`,
      { id: parseInt(id) }
    )

    if (promotions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Promotion not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: promotions[0] })
  } catch (error: any) {
    console.error('Error fetching promotion:', error)
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
    const { id } = await params
    const body = await request.json()
    const {
      name,
      type,
      discountValue,
      maxDiscount,
      minOrderAmount,
      quantity,
      status,
      expiresAt,
    } = body

    const updateFields: string[] = []
    const updateParams: Record<string, any> = { id: parseInt(id) }

    if (name !== undefined) {
      updateFields.push('ten = @name')
      updateParams.name = name
    }
    if (type !== undefined) {
      updateFields.push('loai = @type')
      updateParams.type = type
    }
    if (discountValue !== undefined) {
      updateFields.push('giaTriGiam = @discountValue')
      updateParams.discountValue = parseFloat(discountValue)
    }
    if (maxDiscount !== undefined) {
      updateFields.push('giamToiDa = @maxDiscount')
      updateParams.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null
    }
    if (minOrderAmount !== undefined) {
      updateFields.push('dieuKienAD = @minOrderAmount')
      updateParams.minOrderAmount = minOrderAmount ? parseFloat(minOrderAmount) : null
    }
    if (quantity !== undefined) {
      updateFields.push('soLuong = @quantity')
      updateParams.quantity = parseInt(quantity)
    }
    if (status !== undefined) {
      updateFields.push('trangThai = @status')
      updateParams.status = parseInt(status)
    }
    if (expiresAt !== undefined) {
      updateFields.push('ngayHetHan = @expiresAt')
      updateParams.expiresAt = expiresAt || null
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    await queryNamed(
      `UPDATE PhieuGiamGia SET ${updateFields.join(', ')} WHERE id = @id`,
      updateParams
    )

    // Lấy lại promotion đã cập nhật
    const promotions = await queryNamed<Promotion>(
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
      WHERE id = @id`,
      { id: parseInt(id) }
    )

    return NextResponse.json({ success: true, data: promotions[0] })
  } catch (error: any) {
    console.error('Error updating promotion:', error)
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
    // Check if user is admin
    try {
      await requireAdmin()
    } catch (authError: any) {
      return NextResponse.json(
        { success: false, error: authError.message || 'Unauthorized' },
        { status: authError.message.includes('Admin') ? 403 : 401 }
      )
    }

    const { id } = await params

    // Check if promotion exists
    const promotions = await queryNamed(
      `SELECT id FROM PhieuGiamGia WHERE id = @id`,
      { id: parseInt(id) }
    )

    if (promotions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Promotion not found' },
        { status: 404 }
      )
    }

    // Soft delete: Set trangThai = 0
    await queryNamed(
      `UPDATE PhieuGiamGia SET trangThai = 0 WHERE id = @id`,
      { id: parseInt(id) }
    )

    return NextResponse.json({ success: true, message: 'Promotion deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting promotion:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
