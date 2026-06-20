/**
 * In-memory, single-region rate limiter (Map of token buckets).
 *
 * GUARD: this is correct ONLY under our single Vercel-region assumption. The
 * moment we run in more than one region each region keeps its own Map, so the
 * effective ceiling multiplies by the region count — do NOT trust this for
 * global enforcement once that changes. The migration is designed but
 * deliberately deferred (tracker item #30): see docs/redis-rate-limiter-plan.md
 * for the Upstash plan + flip conditions, gated behind a `LIMITER_BACKEND`
 * switch (memory default → redis). Board card f3.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  { limit = 60, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): { success: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0 };
  }

  bucket.count++;
  return { success: true, remaining: limit - bucket.count };
}

// Cleanup stale buckets every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(key);
    }
  }, 5 * 60_000);
}
