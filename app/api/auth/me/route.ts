import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { generateCSRFToken } from '@/lib/csrf'

export async function GET() {
  try {
    console.log('🔍 Checking authentication...')
    const session = await getSession()

    if (!session) {
      console.log('❌ No session found')
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log('✅ Session found:', { userId: session.userId, email: session.email, role: session.role })

    // Generate CSRF token cho session này
    const csrfToken = generateCSRFToken(`session:${session.userId}`)

    return NextResponse.json({
      success: true,
      data: {
        user: session,
        csrfToken, // Trả về CSRF token để client dùng cho các POST/PUT/DELETE requests
      },
    })
  } catch (error: any) {
    console.error('❌ Auth check error:', error)
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
    })
    return NextResponse.json(
      { 
        success: false, 
        error: process.env.NODE_ENV === 'development' 
          ? `Auth check failed: ${error.message}` 
          : 'Not authenticated' 
      },
      { status: 401 }
    )
  }
}
