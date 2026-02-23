import { cookies, headers } from 'next/headers'
import { verifySession, SessionUser } from '@/lib/session'
import { verifyAccessToken } from '@/lib/jwt'

export type { SessionUser }

/**
 * Get session từ cookie hoặc Authorization header
 * Hỗ trợ cả cookie-based và token-based authentication
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    // 1. Thử lấy token từ Authorization header (Bearer token)
    const headersList = await headers()
    const authHeader = headersList.get('authorization')
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const payload = await verifyAccessToken(token)
        return payload
      } catch {
        // Token invalid, fallback to cookie
      }
    }
    
    // 2. Fallback: Lấy từ cookie (signed session)
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')

    if (!sessionCookie) {
      return null
    }

    // Verify signed session token
    const sessionData = await verifySession(sessionCookie.value)
    
    return sessionData
  } catch (error) {
    // Invalid or expired session
    return null
  }
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth()
  if (session.role !== 'ADMIN') {
    throw new Error('Forbidden: Admin access required')
  }
  return session
}

export async function requireUser(): Promise<SessionUser> {
  const session = await requireAuth()
  if (session.role !== 'USER' && session.role !== 'ADMIN') {
    throw new Error('Forbidden: User access required')
  }
  return session
}

export async function requireRole(role: 'ADMIN' | 'USER' | ('ADMIN' | 'USER')[]): Promise<SessionUser> {
  const session = await requireAuth()
  const allowedRoles = Array.isArray(role) ? role : [role]
  if (!allowedRoles.includes(session.role)) {
    throw new Error(`Forbidden: Access requires role ${allowedRoles.join(' or ')}`)
  }
  return session
}
