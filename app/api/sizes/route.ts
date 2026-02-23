import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { Size } from '@/lib/models'

export async function GET() {
  try {
    const sizes = await queryNamed<Size>(
      `SELECT 
        id,
        tenKichCo as name
      FROM KichCo 
      ORDER BY id ASC`
    )

    return NextResponse.json({ success: true, data: sizes })
  } catch (error: any) {
    console.error('Error fetching sizes:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
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
        { success: false, error: 'Tên kích cỡ không được để trống' },
        { status: 400 }
      )
    }

    await queryNamed(
      `INSERT INTO KichCo (tenKichCo)
       VALUES (@name)`,
      { name: name.trim() }
    )

    const result = await queryNamed<Size>(
      `SELECT id, tenKichCo as name FROM KichCo WHERE id = LAST_INSERT_ID()`
    )

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating size:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
