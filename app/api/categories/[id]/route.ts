import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const categories = await queryNamed(
      `SELECT 
        id,
        tenDanhMuc as name
      FROM DanhMuc
      WHERE id = @id`,
      { id: parseInt(id) }
    )

    if (categories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: categories[0] })
  } catch (error: any) {
    console.error('Error fetching category:', error)
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
        { success: false, error: 'Tên danh mục không được để trống' },
        { status: 400 }
      )
    }

    // Update category
    await queryNamed(
      `UPDATE DanhMuc 
       SET tenDanhMuc = @name
       WHERE id = @id`,
      { id: parseInt(id), name: name.trim() }
    )

    // Get the updated record
    const result = await queryNamed(
      `SELECT id, tenDanhMuc as name FROM DanhMuc WHERE id = @id`,
      { id: parseInt(id) }
    )

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error: any) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi cập nhật danh mục' },
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

    // Check if category exists
    const categories = await queryNamed(
      `SELECT id FROM DanhMuc WHERE id = @id`,
      { id: parseInt(id) }
    )

    if (categories.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category is being used by products
    const products = await queryNamed(
      `SELECT COUNT(*) as count FROM SanPham WHERE idDanhMuc = @id`,
      { id: parseInt(id) }
    )

    if (products[0]?.count > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Không thể xóa danh mục này vì có ${products[0].count} sản phẩm đang sử dụng` 
        },
        { status: 400 }
      )
    }

    // Delete category
    await queryNamed(
      `DELETE FROM DanhMuc WHERE id = @id`,
      { id: parseInt(id) }
    )

    return NextResponse.json({ success: true, message: 'Category deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi xóa danh mục' },
      { status: 500 }
    )
  }
}
