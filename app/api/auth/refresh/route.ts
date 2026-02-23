import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyRefreshToken, generateAccessToken } from '@/lib/jwt'

/**
 * Refresh access token bằng refresh token
 * POST /api/auth/refresh
 */
export async function POST() {
  try {
    const cookieStore = await cookies()
    const refreshTokenCookie = cookieStore.get('refreshToken')

    if (!refreshTokenCookie) {
      console.log('❌ No refresh token cookie found')
      return NextResponse.json(
        { success: false, error: 'No refresh token provided' },
        { status: 401 }
      )
    }

    console.log('🔄 Attempting to refresh token...')

    // Verify refresh token
    let payload
    try {
      payload = await verifyRefreshToken(refreshTokenCookie.value)
      console.log('✅ Refresh token verified:', { userId: payload.userId, email: payload.email })
    } catch (verifyError: any) {
      console.error('❌ Refresh token verification failed:', verifyError.message)
      return NextResponse.json(
        { success: false, error: 'Invalid or expired refresh token' },
        { status: 401 }
      )
    }

    // Generate new access token
    const newAccessToken = await generateAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      fullName: payload.fullName,
    })

    console.log('✅ New access token generated')

    return NextResponse.json({
      success: true,
      data: {
        accessToken: newAccessToken,
      },
    })
  } catch (error: any) {
    console.error('❌ Refresh token error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      { 
        success: false, 
        error: process.env.NODE_ENV === 'development' 
          ? `Refresh failed: ${error.message}` 
          : 'Invalid or expired refresh token' 
      },
      { status: 401 }
    )
  }
}
