import { NextResponse } from 'next/server'
import { queryNamed } from '@/lib/db'
import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'
import { createSession } from '@/lib/session'
import { generateAccessToken, generateRefreshToken } from '@/lib/jwt'
import { isAccountLocked, recordFailedLogin, clearFailedAttempts } from '@/lib/account-lockout'

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập người dùng
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Thiếu thông tin đăng nhập
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Email hoặc mật khẩu không đúng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: Request) {
  try {
    console.log('🔐 Login API called')
    
    let body
    try {
      body = await request.json()
    } catch (parseError: any) {
      console.error('❌ JSON parse error:', parseError)
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }
    
    const { email, password } = body
    
    // Normalize email: trim whitespace và lowercase
    const normalizedEmail = email?.trim().toLowerCase()
    const trimmedPassword = password?.trim()
    
    console.log('📧 Login attempt for email:', normalizedEmail)

    if (!normalizedEmail || !trimmedPassword) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Check if account is locked
    const lockStatus = isAccountLocked(normalizedEmail)
    if (lockStatus.locked) {
      const minutesLeft = Math.ceil(
        (lockStatus.lockedUntil!.getTime() - Date.now()) / (60 * 1000)
      )
      return NextResponse.json(
        { 
          success: false, 
          error: `Tài khoản đã bị khóa tạm thời do quá nhiều lần đăng nhập sai. Vui lòng thử lại sau ${minutesLeft} phút.` 
        },
        { status: 423 } // 423 Locked
      )
    }

    // Find user by email (case-insensitive)
    console.log('🔍 Querying database for user:', normalizedEmail)
    let users
    try {
      users = await queryNamed(
        `SELECT 
          id,
          email,
          matKhau as password,
          hoTen as fullName,
          role,
          trangThai as status
        FROM TaiKhoan
        WHERE LOWER(TRIM(email)) = @email`,
        { email: normalizedEmail }
      )
      console.log('✅ Database query successful, found users:', users.length)
    } catch (dbError: any) {
      console.error('❌ Database query error:', dbError)
      console.error('Error details:', {
        message: dbError.message,
        code: dbError.code,
        sqlState: dbError.sqlState,
      })
      return NextResponse.json(
        { 
          success: false, 
          error: process.env.NODE_ENV === 'development' 
            ? `Database error: ${dbError.message}` 
            : 'Lỗi kết nối database. Vui lòng thử lại sau.' 
        },
        { status: 500 }
      )
    }

    if (users.length === 0) {
      // Record failed attempt
      await recordFailedLogin(normalizedEmail)
      return NextResponse.json(
        { success: false, error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    const user = users[0]

    // Check if account is active
    if (user.status !== 1) {
      return NextResponse.json(
        { success: false, error: 'Tài khoản đã bị khóa' },
        { status: 403 }
      )
    }

    // Verify password
    // Kiểm tra xem password có phải là bcrypt hash không (bắt đầu với $2a$, $2b$, $2y$)
    const isPasswordHashed = user.password && user.password.startsWith('$2')
    
    let isValidPassword = false
    
    if (isPasswordHashed) {
      // Password đã được hash, dùng bcrypt.compare
      isValidPassword = await bcrypt.compare(trimmedPassword, user.password)
    } else {
      // Password là plain text (backward compatibility)
      // So sánh trực tiếp (chỉ cho phép trong development hoặc migration)
      if (process.env.NODE_ENV === 'development') {
        isValidPassword = trimmedPassword === user.password
        console.log('⚠️  Warning: Password is plain text. Please hash it using hash-existing-passwords.js script')
      } else {
        // Production: không cho phép plain text password
        isValidPassword = false
      }
    }

    if (!isValidPassword) {
      // Record failed attempt
      await recordFailedLogin(normalizedEmail)
      
      // Check if account should be locked now
      const newLockStatus = isAccountLocked(normalizedEmail)
      if (newLockStatus.locked) {
        const minutesLeft = Math.ceil(
          (newLockStatus.lockedUntil!.getTime() - Date.now()) / (60 * 1000)
        )
        return NextResponse.json(
          { 
            success: false, 
            error: `Tài khoản đã bị khóa tạm thời do quá nhiều lần đăng nhập sai. Vui lòng thử lại sau ${minutesLeft} phút.` 
          },
          { status: 423 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      )
    }

    // Login thành công - clear failed attempts
    clearFailedAttempts(normalizedEmail)

    // Create session data
    const sessionData = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    }

    // Generate tokens
    console.log('🔑 Generating tokens...')
    let accessToken, refreshToken, sessionToken
    try {
      accessToken = await generateAccessToken(sessionData)
      refreshToken = await generateRefreshToken(sessionData)
      sessionToken = await createSession(sessionData)
      console.log('✅ Tokens generated successfully')
    } catch (tokenError: any) {
      console.error('❌ Token generation error:', tokenError)
      return NextResponse.json(
        { 
          success: false, 
          error: process.env.NODE_ENV === 'development' 
            ? `Token generation error: ${tokenError.message}` 
            : 'Lỗi tạo token. Vui lòng thử lại sau.' 
        },
        { status: 500 }
      )
    }

    console.log('🍪 Setting cookies...')
    let cookieStore
    try {
      cookieStore = await cookies()
    } catch (cookieError: any) {
      console.error('❌ Cookie store error:', cookieError)
      return NextResponse.json(
        { 
          success: false, 
          error: process.env.NODE_ENV === 'development' 
            ? `Cookie error: ${cookieError.message}` 
            : 'Lỗi thiết lập session. Vui lòng thử lại sau.' 
        },
        { status: 500 }
      )
    }
    
    // Set refresh token in httpOnly cookie (bảo mật hơn)
    try {
      cookieStore.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
      console.log('✅ Refresh token cookie set')
    } catch (cookieError: any) {
      console.error('❌ Error setting refresh token cookie:', cookieError)
      // Continue anyway - token is still returned in response
    }
    
    // Set session cookie (backward compatibility)
    try {
      cookieStore.set('session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
      console.log('✅ Session cookie set')
    } catch (cookieError: any) {
      console.error('❌ Error setting session cookie:', cookieError)
      // Continue anyway - token is still returned in response
    }
    
    console.log('✅ Login successful:', { userId: sessionData.userId, email: sessionData.email, role: sessionData.role })

    return NextResponse.json({
      success: true,
      data: {
        user: sessionData,
        accessToken, // Trả về access token để client lưu và dùng
        // Refresh token đã được set trong cookie, không cần trả về
      },
    })
  } catch (error: any) {
    console.error('Login error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    })
    return NextResponse.json(
      { 
        success: false, 
        error: process.env.NODE_ENV === 'development' 
          ? `Lỗi đăng nhập: ${error.message}` 
          : 'Lỗi đăng nhập. Vui lòng thử lại sau.' 
      },
      { status: 500 }
    )
  }
}
