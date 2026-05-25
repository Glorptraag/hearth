<!-- Version: 2 | Date: 2026-04-21 | Changes: Added cross-link to alpha-readiness caveats; noted cost dashboard as the first-stop for §2 investigations. -->

# Hearth — Incident Runbook

> Target: alpha pilot operator (solo). Bring any novel incident back into this doc so the next occurrence is fast.
> Mid-incident? Start with the one-page [`docs/oncall-cheatsheet.md`](./oncall-cheatsheet.md) and only come here for depth.
> Pair with: [`docs/deployment-runbook.md`](./deployment-runbook.md) for env/deploy context.
> Background reading: [`docs/alpha-readiness-pickup.md`](./alpha-readiness-pickup.md) → "Honest caveats / known limitations". Several incidents are expected consequences of known limitations — check there before treating a symptom as novel.

## How to use this doc

1. Identify the closest matching symptom in the table of contents.
2. Walk the **Detect → Investigate → Mitigate → Root cause → Postmortem** sections in order. Don't skip to mitigation without capturing what you saw — the next incident may match, and you'll want the breadcrumbs.
3. If nothing matches, jump to §6 (Unknown symptom).

---

## Table of contents

1. Enrichment pipeline failing (`entry_created` but no insights)
2. Draft-insight cost spike (Haiku spend trending over budget)
3. Rate limits tripping legitimate users
4. Anthropic outage or degraded service
5. Sentry event storm / quota pressure
6. Unknown symptom — triage from scratch

---

## 1. Enrichment pipeline failing

**Symptoms:** Parents log entries, but the AI insight panel stays empty; `family_intelligence_snapshots.updated_at` lags; the Logger UI shows stale draft insights.

### Detect

- Sentry → filter by `tags:pipeline:enrich-entry` — a cluster of errors in the last 60 minutes is the clearest signal.
- Neon SQL:
  ```sql
  SELECT status, count(*)
  FROM ai_pipeline_logs
  WHERE created_at > now() - interval '1 hour'
  GROUP BY status;
  ```
  Status other than `ok` should be <5% of calls under normal load.

### Investigate

- **Anthropic 5xx / timeouts.** Check Anthropic status page. Sentry exception message usually contains the HTTP status.
- **Schema drift.** If enrichment started failing immediately after a deploy, a recent migration may have landed without the code that consumes it (or vice versa). Cross-check the tip of `main` against the last applied migration in `drizzle/meta`.
- **Prompt regression.** If the Sentry error is a JSON parse failure, look at `src/lib/ai/enrich.ts` — Haiku occasionally returns prose. There's already a JSON-repair path; a spike suggests the prompt needs tightening.

### Mitigate

| Condition | Action |
|---|---|
| Anthropic transient outage | Do nothing — enrichment already has a fallback keyword matcher (`src/lib/ai/enrich.ts`). Entries are persisted; insights degrade gracefully. |
| Systematic prompt/parse failure | Flip `DRAFT_INSIGHTS_ENABLED=false` in Vercel (kill switch for the in-Logger draft-insights stream). Note: this only disables the live draft — the write-time enrichment path still runs. |
| Write-time enrichment systematically failing | Roll back the deploy (`vercel rollback <deployment-id>`). Do not disable enrichment silently — entries without snapshots mean stale Dashboards. |

### Root cause + postmortem

- Capture the offending input that crashed the prompt (reproduce with `src/scripts/test-enrichment.ts` if one exists, or a quick `npx tsx` harness) so the fix ships with a regression test.
- Note it below, under "Recent incidents".

---

## 2. Draft-insight cost spike

**Symptoms:** Anthropic dashboard shows daily spend above the expected baseline; weekly `ai_pipeline_logs` aggregate for `%-draft` rows jumps 5–10× the running average.

### Detect

**First stop:** `/admin/analytics` → **AI Cost** tab. Set window to 30d. The "Draft insights" totals card + daily stacked bar show the trend, and the "Top families by spend" table flags a single noisy family instantly. Only fall back to SQL when the dashboard doesn't answer the question.

```sql
-- Fallback query — same thing the dashboard runs
SELECT
  date_trunc('day', created_at) AS day,
  count(*) AS calls,
  sum(input_tokens)  AS in_toks,
  sum(output_tokens) AS out_toks
FROM ai_pipeline_logs
WHERE model_used LIKE '%-draft'
  AND created_at > now() - interval '14 days'
GROUP BY 1 ORDER BY 1;
```

Baseline (from the debounced draft-insight design): ~100 calls/family/month ≈ $2/family/month. A jump past $3/family/month on a rolling 7-day window is the soft alert.

> **Pricing note.** Dashboard USD figures use the hardcoded Haiku 4.5 rates in `PRICING_PER_MTOK` inside `/api/admin/analytics/ai-cost/route.ts`. If the model wired into `src/lib/ai/*` changes, update that constant — see caveat 10 in `docs/alpha-readiness-pickup.md`.

### Investigate

- **One noisy family.** The daily retention cron (`/api/admin/retention` Sun 02:00 UTC) now runs an automated noisy-family check and writes an `admin_audit_log` row with `action='noisy_family_alert'` for any family above `NOISY_FAMILY_TOKEN_THRESHOLD` tokens / 24h. Look there first: `SELECT target_id, reason, created_at FROM admin_audit_log WHERE action = 'noisy_family_alert' ORDER BY created_at DESC LIMIT 10;`. Also: add `family_id` to the group-by above for live numbers between cron runs.
- **Debounce regression.** Look at `src/hooks/use-draft-insight.ts` — the debounce is 2s; if a recent change dropped or shortened it, calls compound.
- **Token inflation.** If call count is flat but tokens doubled, the prompt has grown. Check recent edits to `src/lib/ai/draft-insight.ts`.

### Mitigate

- **Immediate kill switch:** Set `DRAFT_INSIGHTS_ENABLED=false` in Vercel env vars and redeploy (or wait for the next cold-start — it's a runtime read). This disables the live draft-insight endpoint cleanly; write-time enrichment continues normally.
- **Rate-shape instead of kill:** If only one family is noisy, tighten the per-family limit in the draft-insight route handler (`src/app/api/entries/draft-insight/route.ts`) and redeploy.

### Root cause + postmortem

- Log the spike, the responsible family (if isolated), and the fix in "Recent incidents". Re-enable `DRAFT_INSIGHTS_ENABLED` after the fix ships.

---

## 3. Rate limits tripping legitimate users

**Symptoms:** Users see "Too many requests" / 429 responses during normal use.

### Background

Rate limiting is in-memory only (see `src/lib/rate-limit.ts`). That means:

- Limits are per Vercel function instance. Cold starts reset counters.
- **If we ever move to multi-region**, the limiter becomes effectively permissive (each region counts separately) — but during pilot we run single-region, so it behaves approximately as intended.
- There is no Redis backing. Do not add one without also planning for Vercel cold-start behaviour.

### Detect

- Sentry → errors with tag `status:429`.
- Grep the function log in Vercel for the specific route returning 429.

### Investigate

- Is the user's client retrying aggressively? Mobile Safari will replay requests on flaky networks.
- Is the limit too low for real usage? Defaults are 60 req/min per key in `rateLimit` — legitimate for Logger auto-save storms, tight for admin scraping.

### Mitigate

- If a single route is too tight, adjust its `rateLimit()` options in the route handler and redeploy. Don't globally loosen.
- If a specific user is hitting a loop, ask them to reload (cold restart clears their bucket).

### Root cause + postmortem

- Redis-backed rate limiting is a multi-region prerequisite; capture the incident in "Recent incidents" as evidence if/when the upgrade is prioritised.

---

## 4. Anthropic outage or degraded service

**Symptoms:** All enrichment calls are 5xx; draft-insights all fail; Sentry spams `pipeline:enrich-entry` errors.

### Detect

- Anthropic status page is the fastest truth source.
- Sentry volume spikes without any other correlated change.

### Mitigate

1. **Draft insights:** Flip `DRAFT_INSIGHTS_ENABLED=false` so the Logger doesn't pound a dead endpoint with retries.
2. **Write-time enrichment:** Leave it alone. The fallback keyword matcher in `src/lib/ai/enrich.ts` already catches the failure and produces a best-effort snapshot. Entries persist, families can keep logging.
3. **Sentry noise:** Temporarily sample down the `pipeline:enrich-entry` tag. Quickest way: add a `beforeSend` check in `sentry.server.config.ts` that drops 90% of events with that tag. Remove the filter once Anthropic recovers.

### Recovery

1. Anthropic recovers → draft-insights stay disabled until you've confirmed the next 15 minutes of enrichment calls succeed.
2. Re-enable `DRAFT_INSIGHTS_ENABLED=true`.
3. If a cost impact is visible, regenerate any missed snapshots with a quick script (loop over entries where `snapshotUpdatedAt < entry.createdAt` and call `rebuildSnapshot`).

---

## 5. Sentry event storm

**Symptoms:** Sentry quota warning email; suspiciously high event volume.

### Investigate

- Sentry → Issues → sort by "Events per minute". Almost always one issue dominating.
- Check if it's a pipeline tag (see §1, §4) or a Next.js client error (usually an adblocker or user network issue).

### Mitigate

- **If the noisy issue is expected** (e.g., adblocker blocking PostHog), ignore it in Sentry (`Ignore until N events/hr`).
- **If it's a real bug**, fix forward. Don't add `beforeSend` suppression for real bugs — only for noise.
- **If quota is about to flip to paid,** sample the noisy tag in `sentry.server.config.ts` / `sentry.client.config.ts` until the fix ships.

---

## 6. Unknown symptom — triage from scratch

1. **Establish impact.** How many families, what surface (Logger, Dashboard, Report)? Ask the reporter to screenshot the browser console.
2. **Replay the action as them.** Use a disposable test account; don't poke at the reporter's data.
3. **Time-correlate.** Check Vercel deploy log for recent deploys. Almost all new incidents are caused by the last deploy.
4. **Widen the nets.** Sentry last hour; Neon slow-query log; Vercel function logs filtered to the affected route.
5. **If stuck, rollback.** `vercel rollback <previous-deployment-id>` is a safe first move during pilot — the blast radius is low and the data model is append-only (except for settings updates, which are forward-compatible).

Once resolved, append to §7 with one paragraph: symptom, cause, fix, prevention.

---

## 7. Recent incidents

> Log incidents here as they occur. Format: `### YYYY-MM-DD — one-line summary` followed by 3–5 sentences covering what happened, what we did, what we changed.

### 2026-05-25 — Unrun migration cascaded into white-screen on every client page

**Symptom.** `/our-story/portfolio` and several other dashboard pages crashed with `SyntaxError: The string did not match the expected pattern` in WebKit. The page rendered blank because React error boundaries didn't catch the synchronous parse throw.

**Cause.** Migration `0016` had landed in `drizzle/meta` but hadn't run against the deployed Neon branch. The first query against the affected table threw a Postgres `relation does not exist` error, which bubbled up as an uncaught throw from the API route. Next.js wrapped that in a default HTML 500 page. The client's `await res.json()` parser then choked on the HTML and threw synchronously inside the render path — bypassing every error boundary because the throw happened during the `.json()` await, before the response body became state.

**Amplifiers.** The root cause was the unrun migration, but the blast radius (every page that fetched anything → white screen) came from three structural problems:
1. **Server returned HTML on error.** Next.js default 500 page is HTML; we never enforced JSON.
2. **Client called `.json()` without a content-type or status guard.** Every fetch in the app assumed a JSON body on every status code.
3. **No drift checker.** Migration drift between the repo and the deployment was silent until the first runtime query.

**Fix shipped (PRs #78 → #86).**
- **#78** — guarded every client `.json()` so 5xx returns no longer parse-throw.
- **#79** — lazy db imports, error boundaries on auth-protected segments, `routeHandler` wrapper, drift checker added to deploy gate.
- **#80–#84** — mechanical sweep wrapping all 108 API route files with `routeHandler` from `src/lib/api-helpers.ts`. The wrapper catches uncaught throws and returns `NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })` plus a tagged Sentry capture (`pipeline:route-handler`, `route:<METHOD /api/path>`, `error_kind:runtime|config`).
- **#86** — `scripts/check-route-handlers.mjs` + `npm run check:route-handlers` wired into the CI typecheck job. Any new `src/app/api/**/route.ts` that lands without the `routeHandler` wrapper fails the build with a pointed error pointing back to this entry.

**Prevention.** The class of incident is now structurally impossible: every API route returns JSON on error, every client `.json()` is guarded, the drift checker fails the deploy if `drizzle/meta` is ahead of the database, and the CI route-handler gate fails the build if any new route file ships without the wrapper. If a future incident matches the symptom "white screen on dashboard pages", the first investigation step is the Vercel deploy log + the drift checker status, not the client console.
