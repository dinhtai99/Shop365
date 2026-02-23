import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { ProductCombo } from '@/lib/models'

export async function GET() {
  try {
    // Table ProductCombos không tồn tại trong shop_online
    // Trả về empty array tạm thời
    return NextResponse.json(
      { success: true, data: [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error: any) {
    console.error('Error fetching combos:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, image, price, description } = body

    await queryNamed(
      `INSERT INTO ProductCombos (name, image, price, description)
       VALUES (@name, @image, @price, @description)`,
      { name, image, price, description }
    )

    // Get the inserted record
    const result = await queryNamed<ProductCombo>(
      `SELECT * FROM ProductCombos WHERE id = LAST_INSERT_ID()`
    )

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating combo:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
