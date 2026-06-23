/**
 * In-memory sliding-window rate limiter.
 *
 * Works in both Node and Edge runtimes — no external dependencies.
 * State is per-process / per-edge-node. Good enough to stop brute-force
 * attacks and credential stuffing; not a substitute for a global
 * distributed limiter (e.g. Upstash) for cross-region enforcement.
 */

interface Entry { count: number; resetAt: number }

const store = new Map<string, Entry>()

// Prune expired buckets every 60 s so the Map doesn't grow unbounded.
let lastPruned = Date.now()
function maybePrune() {
  const now = Date.now()
  if (now - lastPruned < 60_000) return
  lastPruned = now
  for (const [k, e] of store) if (e.resetAt <= now) store.delete(k)
}

export interface RateLimitResult {
  allowed:   boolean
  remaining: number
  resetAt:   number   // unix ms — use for Retry-After header
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  maybePrune()
  const now   = Date.now()
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

/** Legacy single-boolean helper kept for any callers that use the old API. */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  return rateLimit(key, max, windowMs).allowed
}
