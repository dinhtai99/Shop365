import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { User } from '@/lib/models'
import bcrypt from 'bcrypt'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const session = await requireAuth()
    
    const { id } = await params

    const users = await queryNamed<User>(
      `SELECT 
        id,
        email,
        hoTen as fullName,
        gioiTinh as gender,
        ngaySinh as dateOfBirth,
        sdt as phone,
        diaChi as address,
        role,
        trangThai as status
      FROM TaiKhoan
      WHERE id = @id`,
      { id: parseInt(id) }
    )

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify user can only access their own profile (unless admin)
    if (session.role !== 'ADMIN' && session.userId !== parseInt(id)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only access your own profile' },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, data: users[0] })
  } catch (error: any) {
    console.error('Error fetching user:', error)
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
    // Require authentication
    const session = await requireAuth()
    
    const { id } = await params
    const body = await request.json()
    const {
      email,
      password,
      fullName,
      gender,
      dateOfBirth,
      phone,
      address,
      role,
      status,
    } = body

    // Verify user can only update their own profile (unless admin)
    if (session.role !== 'ADMIN' && session.userId !== parseInt(id)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: You can only update your own profile' },
        { status: 403 }
      )
    }

    // Only admin can change role and status
    if (session.role !== 'ADMIN') {
      if (role !== undefined || status !== undefined) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Only admin can change role and status' },
          { status: 403 }
        )
      }
    }

    // BẢO VỆ: Giới hạn số lượng ADMIN (tối đa 2)
    // Chỉ có thể tạo ADMIN qua script create-admin.js
    if (role === 'ADMIN' && session.role === 'ADMIN') {
      // Kiểm tra số lượng admin hiện tại
      const [adminCount] = await queryNamed(
        `SELECT COUNT(*) as count FROM TaiKhoan WHERE role = 'ADMIN' AND trangThai = 1`
      )
      
      // Nếu đang update một user thành admin, kiểm tra xem user hiện tại có phải admin không
      const [currentUser] = await queryNamed(
        `SELECT role FROM TaiKhoan WHERE id = @id`,
        { id: parseInt(id) }
      )
      
      const isUpdatingToAdmin = currentUser.length > 0 && currentUser[0].role !== 'ADMIN' && role === 'ADMIN'
      
      if (isUpdatingToAdmin && adminCount[0].count >= 2) {
        return NextResponse.json(
          { success: false, error: 'Đã đạt giới hạn số lượng tài khoản ADMIN (tối đa 2). Không thể tạo thêm.' },
          { status: 403 }
        )
      }
    } else if (role === 'ADMIN' && session.role !== 'ADMIN') {
      // Không cho phép non-admin tạo hoặc chuyển thành admin
      return NextResponse.json(
        { success: false, error: 'Không thể tạo hoặc chuyển thành tài khoản ADMIN. Chỉ có thể tạo ADMIN qua script.' },
        { status: 403 }
      )
    }

    const updateFields: string[] = []
    const updateParams: Record<string, any> = { id: parseInt(id) }

    if (email !== undefined) {
      updateFields.push('email = @email')
      updateParams.email = email
    }
    if (password !== undefined) {
      // Hash password before storing
      const saltRounds = 10
      const hashedPassword = await bcrypt.hash(password, saltRounds)
      updateFields.push('matKhau = @password')
      updateParams.password = hashedPassword
    }
    if (fullName !== undefined) {
      updateFields.push('hoTen = @fullName')
      updateParams.fullName = fullName
    }
    if (gender !== undefined) {
      updateFields.push('gioiTinh = @gender')
      updateParams.gender = gender || null
    }
    if (dateOfBirth !== undefined) {
      updateFields.push('ngaySinh = @dateOfBirth')
      updateParams.dateOfBirth = dateOfBirth || null
    }
    if (phone !== undefined) {
      updateFields.push('sdt = @phone')
      updateParams.phone = phone || null
    }
    if (address !== undefined) {
      updateFields.push('diaChi = @address')
      updateParams.address = address || null
    }
    if (role !== undefined) {
      updateFields.push('role = @role')
      updateParams.role = role
    }
    if (status !== undefined) {
      updateFields.push('trangThai = @status')
      updateParams.status = parseInt(status)
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      )
    }

    await queryNamed(
      `UPDATE TaiKhoan SET ${updateFields.join(', ')} WHERE id = @id`,
      updateParams
    )

    // Lấy lại user đã cập nhật
    const users = await queryNamed<User>(
      `SELECT 
        id,
        email,
        hoTen as fullName,
        gioiTinh as gender,
        ngaySinh as dateOfBirth,
        sdt as phone,
        diaChi as address,
        role,
        trangThai as status
      FROM TaiKhoan
      WHERE id = @id`,
      { id: parseInt(id) }
    )

    return NextResponse.json({ success: true, data: users[0] })
  } catch (error: any) {
    console.error('Error updating user:', error)
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
    const userId = parseInt(id)

    // Check if user exists
    const users = await queryNamed(
      `SELECT id, role FROM TaiKhoan WHERE id = @id`,
      { id: userId }
    )

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent deleting admin users (optional - can be removed if needed)
    // if (users[0].role === 'ADMIN') {
    //   return NextResponse.json(
    //     { success: false, error: 'Cannot delete admin user' },
    //     { status: 400 }
    //   )
    // }

    // Soft delete: Set trangThai = 0
    await queryNamed(
      `UPDATE TaiKhoan SET trangThai = 0 WHERE id = @id`,
      { id: userId }
    )

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
