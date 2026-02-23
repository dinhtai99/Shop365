import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { cached } from '@/lib/cache'
import { FeaturedProject } from '@/lib/models'

export async function GET() {
  try {
    // Table FeaturedProjects không tồn tại trong shop_online
    // Trả về empty array hoặc lấy từ SanPham với điều kiện đặc biệt
    // Tạm thời trả về empty để không bị lỗi
    return NextResponse.json(
      { success: true, data: [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error: any) {
    console.error('Error fetching featured projects:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, image, description } = body

    await queryNamed(
      `INSERT INTO FeaturedProjects (title, image, description)
       VALUES (@title, @image, @description)`,
      { title, image, description }
    )

    // Get the inserted record
    const result = await queryNamed<FeaturedProject>(
      `SELECT * FROM FeaturedProjects WHERE id = LAST_INSERT_ID()`
    )

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating featured project:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
