import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { NewsEvent } from '@/lib/models'

export async function GET() {
  try {
    // Table NewsEvents không tồn tại trong shop_online
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
    console.error('Error fetching news:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, excerpt, image, date, content } = body

    await queryNamed(
      `INSERT INTO NewsEvents (title, excerpt, image, date, content)
       VALUES (@title, @excerpt, @image, @date, @content)`,
      { title, excerpt, image, date, content }
    )

    // Get the inserted record
    const result = await queryNamed<NewsEvent>(
      `SELECT * FROM NewsEvents WHERE id = LAST_INSERT_ID()`
    )

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating news:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
