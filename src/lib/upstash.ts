import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

// Create Redis client only if credentials are provided
export const redis = redisUrl && redisToken
  ? new Redis({
      url: redisUrl,
      token: redisToken,
    })
  : null

/**
 * Global rate limiter instance. 
 * Default: 10 requests per 10 seconds.
 * 
 * Note: Each specific use case (auth, login, etc.) can define its own 
 * duration and count by using Ratelimit directly or wrapping it.
 */
export const ratelimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  : null

if (!redis) {
  console.warn(
    '[@upstash/ratelimit] UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are missing. Rate limiting is disabled.'
  )
}
