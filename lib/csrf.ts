/**
 * CSRF Protection Utility
 * Generate và verify CSRF tokens
 */

import crypto from 'crypto'

// In-memory storage cho CSRF tokens (có thể migrate sang database/Redis sau)
const csrfTokens = new Map<string, { token: string; expiresAt: Date }>()

const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 giờ

/**
 * Generate CSRF token cho một session
 */
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS)
  
  csrfTokens.set(sessionId, { token, expiresAt })
  
  return token
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokens.get(sessionId)
  
  if (!stored) {
    return false
  }
  
  // Check expiry
  if (new Date() > stored.expiresAt) {
    csrfTokens.delete(sessionId)
    return false
  }
  
  // Verify token
  return stored.token === token
}

/**
 * Xóa CSRF token (sau khi sử dụng hoặc logout)
 */
export function removeCSRFToken(sessionId: string): void {
  csrfTokens.delete(sessionId)
}

/**
 * Cleanup expired tokens (có thể gọi định kỳ)
 */
export function cleanupExpiredTokens(): void {
  const now = new Date()
  for (const [sessionId, data] of Array.from(csrfTokens.entries())) {
    if (now > data.expiresAt) {
      csrfTokens.delete(sessionId)
    }
  }
}
