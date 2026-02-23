/**
 * JWT Token Management
 * Tạo và verify JWT tokens cho authentication
 */

import { SignJWT, jwtVerify } from 'jose'

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET || process.env.SESSION_SECRET || 'gia-dung-365-access-secret-min-32-chars'
)

const REFRESH_TOKEN_SECRET = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET || process.env.SESSION_SECRET || 'gia-dung-365-refresh-secret-min-32-chars'
)

export interface JWTPayload {
  userId: number
  email: string
  role: 'ADMIN' | 'USER'
  fullName: string
  [key: string]: unknown // Index signature for jose compatibility
}

/**
 * Tạo Access Token (ngắn hạn - 15 phút)
 * Dùng cho các API requests thông thường
 */
export async function generateAccessToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m') // 15 phút
    .setIssuer('gia-dung-365')
    .setAudience('gia-dung-365-api')
    .sign(ACCESS_TOKEN_SECRET)
  
  return token
}

/**
 * Tạo Refresh Token (dài hạn - 30 ngày)
 * Dùng để refresh access token khi hết hạn
 */
export async function generateRefreshToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // 30 ngày
    .setIssuer('gia-dung-365')
    .setAudience('gia-dung-365-refresh')
    .sign(REFRESH_TOKEN_SECRET)
  
  return token
}

/**
 * Verify Access Token
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, ACCESS_TOKEN_SECRET, {
      issuer: 'gia-dung-365',
      audience: 'gia-dung-365-api',
    })
    
    return payload as JWTPayload
  } catch (error) {
    throw new Error('Invalid or expired access token')
  }
}

/**
 * Verify Refresh Token
 */
export async function verifyRefreshToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, REFRESH_TOKEN_SECRET, {
      issuer: 'gia-dung-365',
      audience: 'gia-dung-365-refresh',
    })
    
    return payload as JWTPayload
  } catch (error) {
    throw new Error('Invalid or expired refresh token')
  }
}

/**
 * Decode token mà không verify (chỉ để xem thông tin)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    )
    
    return payload as JWTPayload
  } catch {
    return null
  }
}
