<!-- Version: 1 | Date: 2026-04-26 | Changes: Initial Phase-2 design doc for Redis-backed rate limiting (#30). -->

# Redis-backed rate limiting — Phase 2 design

> Tracker item #30. Phase 2 prep — gates multi-region. Code change goes in alongside any genuine multi-region need (high-volume traffic, latency goals, or paid Vercel tier). Until then, the in-memory limiter is correct under our single-region assumption.

## Why this exists

[`src/lib/rate-limit.ts`](../src/lib/rate-limit.ts) is a tiny in-memory bucket map: per-key counters with a sliding window, lazy expiry every 5 minutes. It works because the deployment runbook commits to a **single Vercel region**. Once we deploy multi-region (any of: paid Pro tier with edge regions, intentional global routing, or Vercel auto-distributing the project across geographies), each region gets its own bucket map. A user calling 60× in `apse1` and 60× in `iad1` looks like 60 calls to each region's limiter — effectively 120/min globally, double the configured ceiling.

This isn't a vulnerability today. It will be the moment we cross any of those triggers.

## Trigger conditions to flip this

Land the Redis change when **any** of the following becomes true:

- **Vercel tier moves to Pro** for any reason other than this — Pro means functions can fan out across regions automatically.
- **Sustained 5+ req/s** on any rate-limited endpoint — the in-memory limiter starts losing precision because of cold starts.
- **Multi-region deploy decision** is made for latency (e.g. adding `syd1` for Australian users while keeping a US region for failover).
- **Real abuse incident** — single user hammering an endpoint with retries; the noisy-family detector (#28) names them but the inline limiter can't fully shape the traffic.

If none of these are true, **don't ship this**. The migration adds latency to every API call (one Redis round trip), an external dependency, and a new failure mode (Redis down → choose between fail-open and fail-closed).

## Picking a backend: Upstash vs alternatives

| Option | Why pick | Why skip |
|---|---|---|
| **Upstash Redis (REST)** | Recommended. HTTP-based — no TCP, no connection pooling. Vercel partner; near-zero config. Free tier covers 10k commands/day, paid tier well below the cost of any other option. | Slightly higher latency per call (~10–25 ms) than native Redis. Per-region pricing model. |
| **Upstash Redis (TCP)** | Lower latency. | Vercel functions are short-lived; connection pooling fights against the function lifetime. Not worth the complexity for our scale. |
| **Vercel KV** | Very tight Vercel integration. | Beta, pricing not stable, and locked into Vercel even more than we already are. |
| **Self-managed Redis (Fly, Railway, Hetzner)** | Cheapest at high volume. | Operational burden. Solo-dev pilot can't justify it. |
| **Neon for rate limits** | Already provisioned. | Postgres is the wrong tool for high-frequency atomic counters; we'd rebuild it badly. |

**Pick Upstash REST.** Aligns with single-developer ops, matches the Vercel posture, free tier covers the alpha pilot indefinitely.

## Algorithm: keep the sliding window

The current limiter is a fixed window with lazy reset (`if (now >= bucket.resetAt) { ... }`). That's sloppy at the boundary — a user can fire 60 requests at second 59 and another 60 at second 0 of the next minute. For pilot scale that's fine.

For Redis, switch to a **sorted-set sliding window**, which is closer to the user's intent and barely more code:

```
ZADD rl:<key> <now> <unique-id>
ZREMRANGEBYSCORE rl:<key> 0 (<now-windowMs>)
ZCARD rl:<key>
EXPIRE rl:<key> <windowMs / 1000>
```

Pipeline these in a single Upstash REST round trip; total ~10–25 ms p50.

## API surface — keep it identical

The current `rateLimit(key, { limit, windowMs })` signature is exactly what every call site expects. The new module preserves it:

```ts
// src/lib/rate-limit.ts (Phase 2 shape — illustrative, not yet shipped)
export async function rateLimit(
  key: string,
  opts: { limit?: number; windowMs?: number } = {},
): Promise<{ success: boolean; remaining: number }> { … }
```

**Note the async.** Every existing call site already uses `await rateLimit(...)` because of how the route handlers are written today, so the migration is mechanical.

## Failure modes

Decide up front:

- **Redis down → fail open.** Pilot scale doesn't have a strong abuse story; failing closed would block legitimate users when our infra hiccups. Wrap the call in `try/catch` and return `{ success: true, remaining: -1 }` on error. Log to Sentry as a warning.
- **Redis slow (> 200 ms).** `AbortSignal.timeout(200)` — if Redis can't answer in 200 ms we'd rather skip the check than hold up the user's save. Same fail-open path.
- **Cold start.** Upstash REST has no connection state; nothing to warm.

## Migration plan

This goes live as a single PR with three commits, behind an env flag so we can roll back:

1. **`feat(rate-limit): introduce Upstash REST client + new sliding-window backend`**
   - Adds `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` env vars.
   - New module `src/lib/rate-limit-redis.ts` — Upstash sliding-window implementation.
   - Tests: unit test the algorithm with a mocked Upstash client (covers happy path, exhaustion, fail-open).
   - **No call sites touched yet.** This commit is dead code until commit 3.

2. **`refactor(rate-limit): make existing API async + add LIMITER_BACKEND switch`**
   - Wraps both backends behind a `getLimiter()` factory keyed by `process.env.LIMITER_BACKEND` (`memory` default, `redis` when set).
   - All `rateLimit(...)` call sites already `await`, so the public surface doesn't change. Verify with `grep -r 'rateLimit(' src/`.
   - Default still `memory` — this commit is a no-op functionally.

3. **`feat(rate-limit): default LIMITER_BACKEND=redis in prod env`**
   - Set `LIMITER_BACKEND=redis` + the two `UPSTASH_*` env vars in Vercel → prod (and preview if you want it there too).
   - Redeploy. Watch Sentry for `[rate-limit] redis-fallthrough` warnings; if quiet for a week, delete the in-memory backend and the env switch in a follow-up.

The flag-based rollout means you can flip back to `memory` instantly if Upstash misbehaves on day one. Once it's been stable for a fortnight, drop the in-memory path.

## Touch points to verify before merging

When the time comes:

- **Per-route limits.** All current `rateLimit(...)` calls in `src/app/api/*` use the same shape. Audit:
  ```sh
  rg "rateLimit\(" src/
  ```
  Today's hits: `entries`, `account/delete`, `notifications/trigger`, plus any others added since.
- **Test platform.** Integration tests in [`src/app/api/*/route.integration.test.ts`](../src/app/api/) use distinct UUIDs per call to avoid hitting the per-test-user 3/hour limit on `account/delete`. Same trick continues to work with Redis; the fail-open path keeps tests green even when no Upstash creds are set.
- **Documentation.** Update [`docs/incident-runbook.md` §3](./incident-runbook.md) — drop the "single Vercel region" caveat once Redis lands; add Upstash to the symptom-table escalation list.
- **`docs/oncall-cheatsheet.md`** — add an Upstash dashboard URL to the "Critical dashboards" list.
- **`docs/deployment-runbook.md` §1.2** — add the two `UPSTASH_*` env vars + the `LIMITER_BACKEND` switch.

## Cost envelope

Pilot scale (10–20 families, ~100 entries / family / month, plus Logger drafts at 5×/entry, plus admin / read-only routes) lands around 200k Redis commands per month. Upstash free tier (10k commands/day = 300k/month) covers it. First paid tier kicks in at $0.20/100k commands; even a ~20× traffic spike still costs under $5/month.

## What this doc is NOT

- Not a green light. Don't ship until one of the trigger conditions is true.
- Not the test plan. The PR that lands this gets its own test plan with a real Upstash dev instance — don't write tests against a mocked client and call it done.
- Not a Phase-3 distributed-rate-limit primer. This is the smallest change that closes the multi-region gap; later, fancier (per-tenant fairness, leaky-bucket, etc.) is its own project.
