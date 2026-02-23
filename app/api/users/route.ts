import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { User } from '@/lib/models'
import bcrypt from 'bcrypt'

export async function GET(request: Request) {
  try {
    // Require authentication
    const session = await requireAuth()
    
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const role = searchParams.get('role')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // If not admin, only return their own user data
    if (session.role !== 'ADMIN') {
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
        { id: session.userId }
      )
      return NextResponse.json({ success: true, data: users })
    }

    let query = `SELECT 
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
    WHERE 1=1`

    const params: Record<string, any> = {}

    if (email) {
      query += ' AND email = @email'
      params.email = email
    }

    if (role) {
      query += ' AND role = @role'
      params.role = role
    }

    if (activeOnly) {
      query += ' AND trangThai = 1'
    }

    query += ' ORDER BY id DESC'

    const users = await queryNamed<User>(query, params)

    return NextResponse.json({ success: true, data: users })
  } catch (error: any) {
    console.error('Error fetching users:', error)
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
      email,
      password,
      fullName,
      gender,
      dateOfBirth,
      phone,
      address,
      role = 'USER',
    } = body

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { success: false, error: 'email, password, and fullName are required' },
        { status: 400 }
      )
    }

    // BẢO VỆ: Không cho phép tạo tài khoản ADMIN qua API đăng ký
    // Chỉ có thể tạo ADMIN qua script create-admin.js
    if (role === 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Không thể tạo tài khoản ADMIN qua đăng ký. Vui lòng liên hệ quản trị viên.' },
        { status: 403 }
      )
    }

    // Đảm bảo role luôn là USER khi đăng ký qua form
    const finalRole = 'USER'

    // Kiểm tra số lượng admin hiện tại (giới hạn 2 admin)
    const [adminCount] = await queryNamed(
      `SELECT COUNT(*) as count FROM TaiKhoan WHERE role = 'ADMIN' AND trangThai = 1`
    )
    
    if (adminCount[0].count >= 2) {
      // Nếu đã có 2 admin, không cho phép tạo thêm admin (dù có cố gắng)
      if (role === 'ADMIN') {
        return NextResponse.json(
          { success: false, error: 'Đã đạt giới hạn số lượng tài khoản ADMIN (tối đa 2). Không thể tạo thêm.' },
          { status: 403 }
        )
      }
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUsers = await queryNamed(
      `SELECT id FROM TaiKhoan WHERE email = @email`,
      { email }
    )

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Email already exists' },
        { status: 400 }
      )
    }

    // Hash password before storing
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    await queryNamed(
      `INSERT INTO TaiKhoan 
       (email, matKhau, hoTen, gioiTinh, ngaySinh, sdt, diaChi, role, trangThai)
       VALUES (@email, @password, @fullName, @gender, @dateOfBirth, @phone, @address, @role, 1)`,
      {
        email,
        password: hashedPassword,
        fullName,
        gender: gender || null,
        dateOfBirth: dateOfBirth || null,
        phone: phone || null,
        address: address || null,
        role: finalRole,
      }
    )

    const result = await queryNamed<User>(
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
      FROM TaiKhoan WHERE id = LAST_INSERT_ID()`
    )

    return NextResponse.json({ success: true, data: result[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
