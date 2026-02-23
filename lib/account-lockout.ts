/**
 * Account Lockout Utility
 * Khóa tài khoản sau nhiều lần login sai
 */

import { queryNamed } from './db'

interface FailedLoginAttempt {
  email: string
  attempts: number
  lastAttempt: Date
  lockedUntil?: Date
}

// In-memory cache cho failed attempts (có thể migrate sang database sau)
const failedAttemptsCache = new Map<string, FailedLoginAttempt>()

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 30 * 60 * 1000 // 30 phút

/**
 * Ghi nhận một lần login thất bại
 */
export async function recordFailedLogin(email: string): Promise<void> {
  const now = new Date()
  const existing = failedAttemptsCache.get(email)
  
  if (existing) {
    // Reset nếu đã quá 15 phút từ lần thử cuối
    const timeSinceLastAttempt = now.getTime() - existing.lastAttempt.getTime()
    if (timeSinceLastAttempt > 15 * 60 * 1000) {
      failedAttemptsCache.set(email, {
        email,
        attempts: 1,
        lastAttempt: now,
      })
      return
    }
    
    // Tăng số lần thử
    const newAttempts = existing.attempts + 1
    
    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      // Lock account
      const lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS)
      failedAttemptsCache.set(email, {
        email,
        attempts: newAttempts,
        lastAttempt: now,
        lockedUntil,
      })
      
      // Có thể update database để lock account
      // await queryNamed(
      //   `UPDATE TaiKhoan SET trangThai = 0 WHERE email = @email`,
      //   { email }
      // )
    } else {
      failedAttemptsCache.set(email, {
        email,
        attempts: newAttempts,
        lastAttempt: now,
      })
    }
  } else {
    // Lần đầu thất bại
    failedAttemptsCache.set(email, {
      email,
      attempts: 1,
      lastAttempt: now,
    })
  }
}

/**
 * Xóa failed attempts sau khi login thành công
 */
export function clearFailedAttempts(email: string): void {
  failedAttemptsCache.delete(email)
}

/**
 * Clear all lockouts (for admin use)
 */
export function clearAllLockouts(): void {
  failedAttemptsCache.clear()
}

/**
 * Kiểm tra xem account có bị lock không
 */
export function isAccountLocked(email: string): { locked: boolean; lockedUntil?: Date } {
  const attempt = failedAttemptsCache.get(email)
  
  if (!attempt) {
    return { locked: false }
  }
  
  // Nếu có lockedUntil và chưa hết hạn
  if (attempt.lockedUntil) {
    const now = new Date()
    if (now < attempt.lockedUntil) {
      return { locked: true, lockedUntil: attempt.lockedUntil }
    } else {
      // Hết hạn lock, reset
      failedAttemptsCache.delete(email)
      return { locked: false }
    }
  }
  
  // Nếu đã đạt max attempts nhưng chưa có lockedUntil (shouldn't happen)
  if (attempt.attempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS)
    attempt.lockedUntil = lockedUntil
    failedAttemptsCache.set(email, attempt)
    return { locked: true, lockedUntil }
  }
  
  return { locked: false }
}

/**
 * Lấy số lần thử còn lại
 */
export function getRemainingAttempts(email: string): number {
  const attempt = failedAttemptsCache.get(email)
  if (!attempt) {
    return MAX_FAILED_ATTEMPTS
  }
  
  if (attempt.lockedUntil && new Date() < attempt.lockedUntil) {
    return 0
  }
  
  return Math.max(0, MAX_FAILED_ATTEMPTS - attempt.attempts)
}
