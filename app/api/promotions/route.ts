import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { Promotion } from '@/lib/models'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let query = `SELECT 
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
    WHERE 1=1`

    const params: Record<string, any> = {}

    if (code) {
      query += ' AND maPhieu = @code'
      params.code = code
    }

    if (activeOnly) {
      query += ' AND trangThai = 1 AND (ngayHetHan IS NULL OR ngayHetHan >= CURDATE()) AND soLuong > 0'
    }

    query += ' ORDER BY ngayTao DESC'

    const promotions = await queryNamed<Promotion>(query, params)

    return NextResponse.json({ success: true, data: promotions })
  } catch (error: any) {
    console.error('Error fetching promotions:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      code,
      name,
      type,
      discountValue,
      maxDiscount,
      minOrderAmount,
      quantity,
      expiresAt,
    } = body

    if (!code || !name || !type || !discountValue) {
      return NextResponse.json(
        { success: false, error: 'code, name, type, and discountValue are required' },
        { status: 400 }
      )
    }

    await queryNamed(
      `INSERT INTO PhieuGiamGia 
       (maPhieu, ten, loai, giaTriGiam, giamToiDa, dieuKienAD, soLuong, trangThai, ngayTao, ngayHetHan)
       VALUES (@code, @name, @type, @discountValue, @maxDiscount, @minOrderAmount, @quantity, 1, CURDATE(), @expiresAt)`,
      {
        code,
        name,
        type,
        discountValue: parseFloat(discountValue),
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
        quantity: quantity || 0,
        expiresAt: expiresAt || null,
      }
    )

    const result = await queryNamed<Promotion>(
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
      FROM PhieuGiamGia WHERE id = LAST_INSERT_ID()`
    )

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating promotion:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
