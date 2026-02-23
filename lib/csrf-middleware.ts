/**
 * CSRF Middleware Helper
 * Verify CSRF token trong API requests
 */

import { NextResponse } from 'next/server'
import { verifyCSRFToken } from './csrf'
import { getSession } from './auth'

/**
 * Verify CSRF token từ request
 * Token có thể được gửi trong:
 * - Header: X-CSRF-Token
 * - Body: csrfToken
 */
export async function verifyCSRF(request: Request): Promise<boolean> {
  try {
    // Lấy session để có sessionId
    const session = await getSession()
    if (!session) {
      return false // Không có session thì không cần CSRF (đã được auth middleware block)
    }

    const sessionId = `session:${session.userId}`

    // Thử lấy token từ header
    const headerToken = request.headers.get('X-CSRF-Token')
    if (headerToken) {
      return verifyCSRFToken(sessionId, headerToken)
    }

    // Thử lấy token từ body (cho POST requests)
    try {
      const body = await request.json()
      const bodyToken = body.csrfToken
      if (bodyToken) {
        return verifyCSRFToken(sessionId, bodyToken)
      }
    } catch {
      // Body không phải JSON hoặc đã được parse rồi
    }

    return false
  } catch {
    return false
  }
}

/**
 * Wrapper để protect API routes với CSRF
 * Chỉ apply cho POST, PUT, DELETE, PATCH methods
 */
export async function requireCSRF(
  request: Request,
  handler: (req: Request) => Promise<NextResponse>
): Promise<NextResponse> {
  const method = request.method

  // Chỉ verify CSRF cho state-changing methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const isValid = await verifyCSRF(request)

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }
  }

  return handler(request)
}
