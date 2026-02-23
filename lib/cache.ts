/**
 * Simple In-Memory Cache
 * Cho development, production nên dùng Redis
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<any>>()

/**
 * Get cached data
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  
  if (!entry) {
    return null
  }
  
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  
  return entry.data as T
}

/**
 * Set cached data
 */
export function setCached<T>(key: string, data: T, ttlSeconds: number = 300): void {
  const expiresAt = Date.now() + (ttlSeconds * 1000)
  cache.set(key, { data, expiresAt })
}

/**
 * Clear cache
 */
export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key)
    console.log(`🗑️  Cache cleared for key: ${key}`)
  } else {
    const size = cache.size
    cache.clear()
    console.log(`🗑️  All cache cleared (${size} entries)`)
  }
}

/**
 * Clear cache by pattern (useful for clearing all product-related cache)
 */
export function clearCacheByPattern(pattern: string): void {
  const keysToDelete: string[] = []
  for (const key of Array.from(cache.keys())) {
    if (key.includes(pattern)) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => cache.delete(key))
  if (keysToDelete.length > 0) {
    console.log(`🗑️  Cache cleared for pattern "${pattern}": ${keysToDelete.length} entries`)
  }
}

/**
 * Cleanup expired entries (có thể gọi định kỳ)
 */
export function cleanupExpired(): void {
  const now = Date.now()
  for (const [key, entry] of Array.from(cache.entries())) {
    if (now > entry.expiresAt) {
      cache.delete(key)
    }
  }
}

/**
 * Cache wrapper cho async functions
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = getCached<T>(key)
  if (cached !== null) {
    return cached
  }
  
  const data = await fetcher()
  setCached(key, data, ttlSeconds)
  return data
}
