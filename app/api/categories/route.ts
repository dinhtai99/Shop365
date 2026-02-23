import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { cached } from '@/lib/cache'

export async function GET() {
  try {
    // Cache categories trong 10 phút (ít thay đổi)
    const categories = await cached(
      'categories:all',
      async () => {
        return await queryNamed(
          `SELECT 
            id,
            tenDanhMuc as name
          FROM DanhMuc 
          ORDER BY id ASC`
        )
      },
      600 // 10 phút
    )

    return NextResponse.json(
      { success: true, data: categories },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        },
      }
    )
  } catch (error: any) {
    console.error('❌ Error fetching categories:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
    })
    // Return empty array instead of error to prevent page crash
    return NextResponse.json(
      { success: true, data: [] }, // Return success with empty array
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  }
}

export async function POST(request: Request) {
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

    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tên danh mục không được để trống' },
        { status: 400 }
      )
    }

    console.log('Creating category with name:', name)

    // Insert category
    const insertResult = await queryNamed(
      `INSERT INTO DanhMuc (tenDanhMuc)
       VALUES (@name)`,
      { name: name.trim() }
    )

    console.log('Insert result:', insertResult)

    // Get the inserted ID using LAST_INSERT_ID()
    const result = await queryNamed(
      `SELECT id, tenDanhMuc as name FROM DanhMuc WHERE id = LAST_INSERT_ID()`
    )

    console.log('Created category:', result)

    if (!result || result.length === 0) {
      // Fallback: get by name if LAST_INSERT_ID() doesn't work
      const fallbackResult = await queryNamed(
        `SELECT id, tenDanhMuc as name FROM DanhMuc WHERE tenDanhMuc = @name ORDER BY id DESC LIMIT 1`,
        { name: name.trim() }
      )
      
      if (fallbackResult && fallbackResult.length > 0) {
        return NextResponse.json({ success: true, data: fallbackResult[0] }, { status: 201 })
      }
      
      return NextResponse.json(
        { success: false, error: 'Không thể lấy thông tin danh mục vừa tạo' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating category:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
    })
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tạo danh mục' },
      { status: 500 }
    )
  }
}
