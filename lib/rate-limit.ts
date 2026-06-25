import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

export interface RateLimitResult {
  allowed:   boolean
  remaining: number
  resetAt:   number  // unix ms — use for Retry-After header
}

// ─── Upstash (production) ────────────────────────────────────────────────────

let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redis
}

// Cache one Ratelimit instance per (limit, window) combination.
const limiters = new Map<string, Ratelimit>()

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  const r = getRedis()
  if (!r) return null

  const cacheKey = `${limit}:${windowMs}`
  if (!limiters.has(cacheKey)) {
    limiters.set(cacheKey, new Ratelimit({
      redis:   r,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs / 1000} s`),
      prefix:  "poolos:rl",
    }))
  }
  return limiters.get(cacheKey)!
}

// ─── In-memory fallback (local dev / no Upstash configured) ─────────────────

interface Entry { count: number; resetAt: number }
const store = new Map<string, Entry>()
let lastPruned = Date.now()

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  if (now - lastPruned > 60_000) {
    lastPruned = now
    for (const [k, e] of store) if (e.resetAt <= now) store.delete(k)
  }

  const entry = store.get(key)
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
  }
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count++
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const limiter = getLimiter(limit, windowMs)

  if (!limiter) {
    return memoryRateLimit(key, limit, windowMs)
  }

  const { success, remaining, reset } = await limiter.limit(key)
  return { allowed: success, remaining, resetAt: reset }
}
