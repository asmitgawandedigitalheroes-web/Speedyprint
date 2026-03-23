interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

/**
 * Simple in-memory rate limiter.
 * @param key     Unique identifier (e.g. IP address)
 * @param limit   Max requests allowed within the window
 * @param windowMs Time window in milliseconds
 * @returns true if the request is allowed, false if rate limited
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}
