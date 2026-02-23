/**
 * Rate Limiting Utility
 * Chống brute force attacks và API abuse
 */

import { LRUCache } from 'lru-cache'

interface RateLimitOptions {
  maxRequests: number
  windowMs: number // milliseconds
}

// Cache để lưu rate limit data
const rateLimitCache = new LRUCache<string, number[]>({
  max: 1000, // Max 1000 unique identifiers
  ttl: 60 * 1000, // 1 minute default TTL
})

/**
 * Kiểm tra rate limit cho một identifier (IP, email, userId, etc.)
 * 
 * @param identifier - Unique identifier (IP address, email, userId)
 * @param options - Rate limit options
 * @returns true nếu trong giới hạn, false nếu vượt quá
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 5, windowMs: 60000 }
): boolean {
  const now = Date.now()
  const key = `${identifier}:${options.maxRequests}:${options.windowMs}`
  
  // Lấy danh sách requests hiện tại
  const requests = rateLimitCache.get(key) || []
  
  // Xóa requests cũ hơn window
  const recentRequests = requests.filter(time => now - time < options.windowMs)
  
  // Kiểm tra số lượng requests
  if (recentRequests.length >= options.maxRequests) {
    return false // Rate limit exceeded
  }
  
  // Thêm request mới
  recentRequests.push(now)
  rateLimitCache.set(key, recentRequests, { ttl: options.windowMs })
  
  return true // Within limit
}

/**
 * Lấy số lần requests còn lại
 */
export function getRemainingRequests(
  identifier: string,
  options: RateLimitOptions = { maxRequests: 5, windowMs: 60000 }
): number {
  const now = Date.now()
  const key = `${identifier}:${options.maxRequests}:${options.windowMs}`
  const requests = rateLimitCache.get(key) || []
  const recentRequests = requests.filter(time => now - time < options.windowMs)
  
  return Math.max(0, options.maxRequests - recentRequests.length)
}

/**
 * Reset rate limit cho một identifier
 */
export function resetRateLimit(identifier: string): void {
  const keys = Array.from(rateLimitCache.keys()) as string[]
  keys.forEach(key => {
    if (key.startsWith(identifier + ':')) {
      rateLimitCache.delete(key)
    }
  })
}

/**
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  // Login: 5 attempts per 15 minutes
  login: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  
  // Register: 3 attempts per hour
  register: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
  
  // Refresh token: 10 requests per minute
  refresh: { maxRequests: 10, windowMs: 60 * 1000 },
  
  // General API: 100 requests per minute
  api: { maxRequests: 100, windowMs: 60 * 1000 },
  
  // Password reset: 3 attempts per hour
  passwordReset: { maxRequests: 3, windowMs: 60 * 60 * 1000 },
}
