import { redis } from './upstash'
import { Ratelimit } from '@upstash/ratelimit'

/**
 * Redis-backed rate limiter using Upstash.
 * @param key       Unique identifier (e.g. IP address)
 * @param limit     Max requests allowed within the window
 * @param windowMs  Time window in milliseconds
 * @returns true if the request is allowed, false if rate limited
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (!redis) {
    // If Redis is not configured, we allow the request to prevent app breakage
    return true
  }

  try {
    // Upstash Ratelimit expects a time string like "10 s", "1 m", "1 h"
    // We'll convert ms to seconds
    const seconds = Math.floor(windowMs / 1000)
    const windowStr = `${seconds} s`

    // Create a specific limiter instance for this request configuration
    // Note: Upstash recommendation is to reuse instances where possible, 
    // but for the sake of mirroring the original API, we create one here.
    // In a high-traffic app, we should use a Map to cache these instances.
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, windowStr as any),
      analytics: true,
      prefix: '@upstash/ratelimit',
    })

    const { success } = await limiter.limit(key)
    return success
  } catch (error) {
    console.error('Rate limit error:', error)
    // Fallback: deny the request when Redis is unavailable to prevent bypass.
    // If this causes issues in production, set RATE_LIMIT_FAIL_OPEN=true to revert.
    return process.env.RATE_LIMIT_FAIL_OPEN === 'true'
  }
}
