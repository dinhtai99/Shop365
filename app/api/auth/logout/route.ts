import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Xóa tất cả session cookies
    cookieStore.delete('session')
    cookieStore.delete('refreshToken')

    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch (error: any) {
    console.error('Error logging out:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
