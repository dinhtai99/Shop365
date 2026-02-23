/**
 * Session management với signed tokens
 * Sử dụng jose library để sign và verify session tokens
 */

import { SignJWT, jwtVerify } from 'jose'

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'gia-dung-365-secret-key-change-in-production-min-32-chars'
)

export interface SessionUser {
  userId: number
  email: string
  role: 'ADMIN' | 'USER'
  fullName: string
  [key: string]: unknown // Index signature for jose compatibility
}

/**
 * Tạo signed session token
 */
export async function createSession(payload: SessionUser): Promise<string> {
  const session = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .setIssuer('gia-dung-365')
    .setAudience('gia-dung-365-users')
    .sign(SECRET_KEY)
  
  return session
}

/**
 * Verify và decode session token
 */
export async function verifySession(session: string): Promise<SessionUser> {
  try {
    const { payload } = await jwtVerify(session, SECRET_KEY, {
      issuer: 'gia-dung-365',
      audience: 'gia-dung-365-users',
    })
    
    return payload as SessionUser
  } catch (error) {
    throw new Error('Invalid or expired session')
  }
}

/**
 * Kiểm tra session có hợp lệ không
 */
export async function isValidSession(session: string): Promise<boolean> {
  try {
    await verifySession(session)
    return true
  } catch {
    return false
  }
}
