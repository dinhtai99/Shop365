import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { clearFailedAttempts, isAccountLocked } from '@/lib/account-lockout'

/**
 * Clear account lockout for a user
 * POST /api/admin/clear-lockout
 * Body: { email: string }
 */
export async function POST(request: Request) {
  try {
    // Require admin authentication
    await requireAdmin()
    
    const body = await request.json()
    const { email } = body
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      )
    }
    
    const normalizedEmail = email.trim().toLowerCase()
    
    // Check current lockout status
    const lockStatus = isAccountLocked(normalizedEmail)
    
    // Clear failed attempts
    clearFailedAttempts(normalizedEmail)
    
    return NextResponse.json({
      success: true,
      message: 'Account lockout cleared successfully',
      data: {
        email: normalizedEmail,
        wasLocked: lockStatus.locked,
        lockedUntil: lockStatus.lockedUntil?.toISOString(),
      },
    })
  } catch (error: any) {
    if (error.message?.includes('Admin') || error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'Failed to clear lockout' 
      },
      { status: 500 }
    )
  }
}
