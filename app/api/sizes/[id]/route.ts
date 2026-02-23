import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
import { Size } from '@/lib/models'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const sizes = await queryNamed<Size>(
      `SELECT 
        id,
        tenKichCo as name
      FROM KichCo
      WHERE id = @id`,
      { id: parseInt(id) }
    )

    if (sizes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Size not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: sizes[0] })
  } catch (error: any) {
    console.error('Error fetching size:', error)
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
    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Tên kích cỡ không được để trống' },
        { status: 400 }
      )
    }

    // Update size
    await queryNamed(
      `UPDATE KichCo 
       SET tenKichCo = @name
       WHERE id = @id`,
      { id: parseInt(id), name: name.trim() }
    )

    // Get the updated record
    const result = await queryNamed<Size>(
      `SELECT id, tenKichCo as name FROM KichCo WHERE id = @id`,
      { id: parseInt(id) }
    )

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Size not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error: any) {
    console.error('Error updating size:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi cập nhật kích cỡ' },
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

    // Check if size exists
    const sizes = await queryNamed(
      `SELECT id FROM KichCo WHERE id = @id`,
      { id: parseInt(id) }
    )

    if (sizes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Size not found' },
        { status: 404 }
      )
    }

    // Check if size is being used by products
    const products = await queryNamed(
      `SELECT COUNT(*) as count FROM ChiTietSanPham WHERE kichThuoc = @id`,
      { id: parseInt(id) }
    )

    if (products[0]?.count > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Không thể xóa kích cỡ này vì có ${products[0].count} sản phẩm đang sử dụng` 
        },
        { status: 400 }
      )
    }

    // Delete size
    await queryNamed(
      `DELETE FROM KichCo WHERE id = @id`,
      { id: parseInt(id) }
    )

    return NextResponse.json({ success: true, message: 'Size deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting size:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi xóa kích cỡ' },
      { status: 500 }
    )
  }
}
