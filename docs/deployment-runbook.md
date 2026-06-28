<!-- Version: 2 | Date: 2026-06-06 | Changes: Migrations now run automatically in the Vercel build (`db:migrate:deploy` → drizzle-kit migrate, production-guarded, then drift-verified) before `next build`. Replaces the manual-from-laptop policy after the 2026-06-06 portfolio incident (prod drifted behind on 0023_evidence_sort_order). Manual path retained for risky migrations. | Version: 1 | Date: 2026-04-20 | Initial deploy runbook for Vercel + Neon + Sanity + Clerk + Anthropic. Pilot-scale (10-20 families). Secrets stay in Vercel UI. -->

# Hearth — Deployment Runbook

> Target: alpha pilot (10–20 families) on Vercel + Neon + Sanity. Solo operator.
> Scope: first production deploy + recurring deploy checklist.
> Pair with: [`docs/incident-runbook.md`](./incident-runbook.md) for post-deploy issues, and [`docs/external-services-guide.md`](./external-services-guide.md) for free-tier limits + paid-tier tip points on every provider this runbook touches.

## Decisions this runbook assumes

- **Secrets live in the Vercel project UI** (not Doppler/1Password). If this changes later, update the Environment Variables section.
- **Migrations run automatically in the Vercel build** on every production deploy. `vercel.json` `buildCommand` is `npm run db:migrate:deploy && next build`: `db:migrate:deploy` (`scripts/deploy-migrate.mjs`) applies pending Drizzle migrations against the production `DATABASE_URL`, verifies no drift remains, and only then does `next build` run. A failed migration aborts the build, so a schema-behind deployment is never promoted. The manual laptop path (§1.4) is retained for risky migrations you want to stage first.
- **One production branch: `main`.** Feature branches get Vercel preview deploys; PRs into main trigger the production pipeline.
- **Single Vercel region.** The in-memory rate limiter (`src/lib/rate-limit.ts` fallback) is single-instance until Redis lands.

---

## 1. First-deploy checklist

Walk this top-to-bottom for a brand-new project. For recurring deploys, jump to §3.

### 1.1 Accounts & projects

> **Hearth is a prod-only deployment.** There is no separate dev environment — the project went straight to production from day one (no users to migrate). The checklist below is shaped accordingly: verify what exists is configured for production use, and add the small handful of services that probably weren't wired up during development.

- [ ] **Vercel** — Hobby (free) is sufficient at pilot scale. Hobby supports the two crons in `vercel.json` (current Vercel cron policy as of 2024+). Project should be set to **single region `syd1`** in Settings → Functions to match Neon Sydney. Revisit if cron count exceeds 2, you need team membership, or sustained DB egress passes ~10 GB/mo.
- [ ] **Neon** — one project with a `production` branch (already set up: `hearth/production`, AWS Asia Pacific 2 Sydney, Postgres 17). Free tier gives 6h point-in-time recovery; paid tier extends to 7 days — flagged at tracker #24. Copy the **pooled** connection string from the production branch's Connect modal for `DATABASE_URL`.
- [ ] **Sanity** — existing project, `production` dataset. Generate a write-scoped API token if one isn't already in use (Sanity Manage → API → Tokens). Copy for `SANITY_API_TOKEN`. Rotate quarterly per #25.
- [ ] **Clerk** — single instance, but **the keys must be live, not test**. Open Clerk dashboard → API Keys; if the publishable key starts with `pk_test_…` you're running test mode in production and email/SMS won't behave properly for real families. Promote the instance to Production (Clerk dashboard → instance dropdown → "Switch to production" or "Create production instance"). Live keys start with `pk_live_…` and `sk_live_…`. Configure sign-in / sign-up URLs to match `NEXT_PUBLIC_CLERK_SIGN_IN_URL` etc. in `.env.example`.
- [ ] **Anthropic API key** — set a hard monthly spend cap on the workspace (Anthropic console → Settings → Limits). This also closes tracker #18. Haiku is the dominant spend lever; see §4.
- [ ] **Sentry** — free tier (5k errors/mo) is plenty. Platform = Next.js. Likely a *new* signup if Sentry wasn't wired up during pre-launch development. Copy the DSN for `NEXT_PUBLIC_SENTRY_DSN`.
- [ ] **PostHog** — Cloud free tier (1M events/mo) covers the alpha indefinitely; self-hosted per Decision E is also valid. Likely a *new* signup. Copy project key + host URL for `NEXT_PUBLIC_POSTHOG_KEY` / `NEXT_PUBLIC_POSTHOG_HOST`.
- [ ] **GitHub** — `main` branch protection enabled (see [`docs/branch-hygiene.md`](./branch-hygiene.md)).

**Genuinely new signups for most operators:** Sentry + PostHog. Everything else is already in place — the audit is whether each is on production-tier configuration.

### 1.2 Environment variables

Copy each key below into Vercel → Project → Settings → Environment Variables. Use the authoritative list in [`.env.example`](../.env.example) — this table just marks which environments each belongs to.

| Variable | Prod | Preview | Dev | Notes |
|---|---|---|---|---|
| `DATABASE_URL` | ✅ | ✅ (branch DB) | — | Neon main branch in prod; ephemeral branch in preview. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | ✅ | — | Live key in prod, test key elsewhere. |
| `CLERK_SECRET_KEY` | ✅ | ✅ | — | Matches the publishable key. |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` etc. | ✅ | ✅ | — | Keep defaults unless routing changes. |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | ✅ | ✅ | — | Same value across envs. |
| `NEXT_PUBLIC_SANITY_DATASET` | ✅ | ✅ | — | `production`. |
| `SANITY_API_TOKEN` | ✅ | ✅ | — | Only for server writes (seeding, publish API). |
| `ANTHROPIC_API_KEY` | ✅ | ✅ | — | Scoped to workspace with spend cap. |
| `DRAFT_INSIGHTS_ENABLED` | ✅ | ✅ | — | Default `true`. Flip to `false` as emergency kill switch. |
| `BLOB_READ_WRITE_TOKEN` | ✅ | ✅ | — | **Provision by connecting the `hearth-evidence` store (Storage → Connect Project) or `vercel env add` — a value in `.env.local` is local-only and never reaches a deployment.** Verify with `vercel env ls`. Without it `/api/evidence/upload` returns 503 *and* the `/api/evidence` read proxy can't serve previews. Now set in Preview too (shares the prod evidence store — fine at pilot scale; isolate with a separate store if preview test uploads shouldn't mix with real children's photos). Was missing in prod 5–28 Jun 2026 (R19). |
| `CRON_SECRET` | ✅ | — | — | Vercel injects this as the Bearer token for scheduled invocations. |
| `ADMIN_CLERK_IDS` | ✅ | ✅ | — | Comma-separated Clerk user IDs. Gates `/admin/*` routes and the production seed endpoints. |
| `NEXT_PUBLIC_SENTRY_DSN` | ✅ | ✅ | — | DSN is safe to expose; it's write-only. |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | ✅ | — | — | Enables source-map upload on deploy. |
| `NEXT_PUBLIC_POSTHOG_KEY` | ✅ | ✅ | — | |
| `NEXT_PUBLIC_POSTHOG_HOST` | ✅ | ✅ | — | Self-hosted URL. |
| `STRIPE_SECRET_KEY` | ✅ | ✅ | ✅ | `sk_live_…` in prod, `sk_test_…` everywhere else. Created in Stripe → Developers → API keys. |
| `STRIPE_WEBHOOK_SECRET` | ✅ | ✅ | ✅ | `whsec_…` from the endpoint config in Stripe → Developers → Webhooks (different secret per endpoint — prod URL and `stripe listen` give you separate values). |

After populating, click **Redeploy** on the latest production deployment so it picks up the new values (env changes don't hot-swap into running functions).

### 1.3 Sanity studio

- [ ] Visit `https://your-sanity-project.sanity.studio/` and confirm you can sign in with the project's auth.
- [ ] If the dataset is empty, run the seed scripts locally with `SANITY_API_TOKEN` set: `npx tsx src/scripts/seed-capability-threads.ts` (and any other seed scripts present). The `publish` API (`/api/modules/publish`) can also be driven manually for ad-hoc content.
- [ ] **Rotate `SANITY_API_TOKEN` quarterly** (or immediately after a laptop loss). In Sanity Manage → API → Tokens → create new → revoke old. Update the Vercel env var.

### 1.4 Database migrations (automatic on deploy)

Drizzle migrations live in `./drizzle/*.sql`. `drizzle.config.ts` reads `DATABASE_URL` (from Vercel's build env in production, or `.env.local` locally).

**Default path — nothing to do.** Every production deploy runs `npm run db:migrate:deploy` before `next build` (see `vercel.json` `buildCommand`). That step:

1. Skips unless `VERCEL_ENV === 'production'` — production is the only environment that auto-migrates. Only `main` auto-deploys (per `vercel.json`); the preview Neon branch DB (built for the constellations rebuild) is migrated by hand, so the guard keeps this step from touching it from a stray non-prod `vercel` build.
2. Runs `drizzle-kit migrate` against the prod `DATABASE_URL`. Idempotent — drizzle tracks applied migrations in `drizzle.__drizzle_migrations`, so an up-to-date deploy is a near-no-op; only unapplied migrations run.
3. Verifies with `check-migration-drift.mjs` that the live DB now matches the journal and every `schema.ts` table physically exists. Real drift aborts the build; a verifier connectivity blip is logged but non-fatal.

If migrate fails, the build aborts and the previous working deployment stays promoted — the broken schema is never served. This is the guard that the 2026-06-06 incident lacked: `0023_evidence_sort_order` had been authored and merged but never applied to prod, so `GET /api/entries` 500'd and portfolios degraded to "Your story starts here".

**Manual path — for risky migrations only.** Drops, `NOT NULL` on populated tables, and type changes should be staged before the deploy that depends on them:

```
# From the operator's laptop, with .env.local pointing at the prod DB:
npm run db:migrate

# Confirm the journal matches the live DB:
npm run db:check-drift
```

**Rules:**

1. For an additive migration, just merge — the deploy applies it. Migrations are forward-compatible against the previous code, so there's no window where prod code crashes on missing columns.
2. If a migration is risky (drops / NOT NULL on populated tables / type changes), copy it to a staging Neon branch first: `npx drizzle-kit migrate` with `DATABASE_URL` pointed at the branch, smoke-test the app against that branch, then merge and let the deploy apply it to main (or run `npm run db:migrate` against prod yourself just ahead of the merge).
3. **Rollback** — `drizzle-kit` does not generate down-migrations. Roll back by writing a new forward migration that inverts the change, or by restoring from a Neon point-in-time snapshot (Neon dashboard → Branches → Restore).

The `src/lib/db/migrations/*.sql` folder contains ad-hoc historical one-offs (e.g. `add_pedagogy_values_practices.sql`). New migrations should go through `drizzle-kit generate` + `migrate`, not that folder.

#### Provider codes (HEU registration validation)

`provider_codes` is a read-only lookup table (see [src/lib/db/schema.ts](../src/lib/db/schema.ts) and [`/api/provider-code/validate`](../src/app/api/provider-code/validate/route.ts)). It has no admin UI; seed and rotate via SQL or Drizzle on the prod branch.

```sql
-- Add a new provider
INSERT INTO provider_codes (code, label, state, active)
VALUES ('HEU-QLD-2026', 'Queensland HEU 2026', 'QLD', true);

-- Rotate (deactivate an old code, leave the row for audit)
UPDATE provider_codes SET active = false WHERE code = 'HEU-QLD-2025';
```

Codes are case-sensitive and validated against `active = true`. Keep at least one active QLD code at all times during pilot.

#### Stripe (premium pack purchases)

One-time pack purchases (no subscriptions, no recurring billing). Three moving parts: API key, a Sanity `stripePriceId` per pack, and a webhook endpoint that writes the entitlement row.

**Stripe dashboard setup (first deploy):**

1. **API keys** — Stripe → Developers → API keys. Copy the **Secret key** for the active mode (`sk_live_…` for prod, `sk_test_…` for preview/dev) into `STRIPE_SECRET_KEY` per the env-vars table.
2. **Products + prices** — For each premium pack, create a Stripe Product with a single one-time Price (mode `payment`, currency `AUD`). Copy the price ID (`price_…`) into the matching Sanity pack document's `stripePriceId` field. The checkout route refuses to start a session for any pack missing this field.
3. **Webhook endpoint** — Stripe → Developers → Webhooks → Add endpoint. URL: `https://<prod-domain>/api/stripe/webhook`. Events to send: `checkout.session.completed` (only — anything else is ignored by the handler, so don't subscribe to noise). After saving, reveal the signing secret (`whsec_…`) and paste into `STRIPE_WEBHOOK_SECRET`.

**Local development:**

```
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

The CLI prints a one-off `whsec_…` — put it in `.env.local` as `STRIPE_WEBHOOK_SECRET` so local webhook receipts verify. (This secret is **separate** from the prod endpoint's secret. Don't reuse.)

Then trigger a test purchase from the Stripe dashboard or:

```
stripe trigger checkout.session.completed
```

Smoke test, end-to-end:

1. From `/explore/marketplace`, click **Get Pack** on a premium pack with a `stripePriceId`.
2. Complete checkout with test card `4242 4242 4242 4242` (any future date / any CVC).
3. Confirm an `entitlements` row exists for the family with `stripe_session_id` matching the session, and the card now reads **Owned** on next page load.
4. PostHog should show a `pack_purchased` event identified by the hashed family ID within ~30s.

**Idempotency** is enforced at the DB layer — `entitlements` has UNIQUE `(family_id, sanity_pack_id)` and UNIQUE `(stripe_session_id)` indexes plus `.onConflictDoNothing()` in the handler. Stripe retries on transient handler failures, so this matters.

### 1.5 First Vercel deploy

- [ ] Link the repo to the Vercel project (Import Git Repository).
- [ ] Confirm the branch-to-env mapping in `vercel.json`: `main` deploys to prod, other branches are preview-only. (Already in the repo — don't edit.)
- [ ] Trigger a deploy from `main` and watch the build log for:
  - `[deploy-migrate]` lines confirming migrations applied (or "0 to apply") and the drift check passed, **before** the Next build output. If this step errors, the build aborts and the prior deployment stays live — fix the migration and redeploy.
  - No missing env var warnings.
  - Sentry source-map upload succeeded if `SENTRY_AUTH_TOKEN` is set.
  - Cron routes registered: Vercel → Project → Settings → Crons should show two entries (`/api/admin/retention` Sun 02:00 UTC, `/api/admin/invitations/expire` daily 20:00 UTC).

### 1.6 Smoke test (every first deploy, every release with migrations)

Run through this in order — each step gates the next.

1. **Landing loads.** Visit the prod URL; landing renders, theme auto-switches by local time, no console errors.
2. **Sign in.** Sign up a disposable test user via Clerk, land on `/onboarding`.
3. **Onboarding.** Complete family + children + the 4-step pedagogy wizard. Confirm family, learners, and `family_settings` rows exist in Neon (pooler → SQL editor).
4. **One entry end-to-end.** From `/log` submit a real entry (≥60 chars so Haiku trips). Confirm:
   - Entry row appears in `learning_entries`.
   - Within ~10s, `ai_pipeline_logs` gains a row with `model_used` starting with `claude-haiku-...` and `status = 'ok'`.
   - `family_intelligence_snapshots` row for the family has `updated_at` within the last minute.
5. **Sentry event captured.** From the browser console on the prod URL: `window.Sentry?.captureMessage('deploy-smoke-test')`. Confirm the event appears in Sentry. Delete / resolve it afterwards.
6. **PostHog event captured.** After step 4, the `entry_created` event should show up in the PostHog live-events panel, identified by the hashed user ID.
7. **Cron reachability.** Call `curl -H "Authorization: Bearer $CRON_SECRET" https://<prod-domain>/api/admin/retention` and `.../api/admin/invitations/expire`. Both should return 200 with a summary payload. Without the Bearer they should return 401.
8. **Delete the test user.** Clerk dashboard → remove; the `/api/account/delete` path is the in-app version used during real pilots.

If anything fails, jump to [`docs/incident-runbook.md`](./incident-runbook.md).

---

## 2. Recurring deploy checklist (every PR to main)

Short version — see §1.6 for the full smoke test, only run it after risky changes.

- [ ] PR green on CI (typecheck + unit tests required; lint is non-blocking until the 22 pre-existing errors are cleared — see `.github/workflows/test.yml`). The typecheck job runs `npm run db:check-schema`, which fails the PR if a new `pgTable` in `schema.ts` has no `CREATE TABLE` migration — the pre-merge guard against "added a table, forgot the migration".
- [ ] If the PR adds an **additive** Drizzle migration, just merge — the production deploy runs `db:migrate:deploy` and applies it before `next build`. No manual step.
- [ ] If the PR adds a **risky** migration (drops / `NOT NULL` on populated tables / type changes), stage it per §1.4 rule 2 before merging.
- [ ] After a deploy that touched `drizzle/` or `src/lib/db/schema.ts`, confirm the build log shows the `[deploy-migrate]` migrate + drift-check lines went green. For an extra check you can still run `npm run db:check-drift` against prod from your laptop. (The in-build verify already catches the failure mode that broke PR #60 — code expected `learner_dlo_status`; prod never ran 0015 — and the 2026-06-06 portfolio outage from the unapplied 0023.)
- [ ] If the PR touches `/api/admin/retention` or `/api/admin/invitations/expire`, manually trigger both after deploy (step 1.6 #7) to make sure nothing regresses silently until the next cron tick.
- [ ] If the PR touches AI enrichment (`src/lib/ai/*`), run step 1.6 #4 and then check `ai_pipeline_logs` for a fresh row.
- [ ] Delete merged feature branches (or rely on GitHub auto-delete, per `docs/branch-hygiene.md`).

---

## 3. Cost + quota watch (weekly during pilot)

**First stop:** `/admin/analytics` → **AI Cost** tab. Gives you window totals, daily stacked bar (full vs draft), and top-20 families by spend in one view. Pricing is model-aware via `priceFor()` in `src/config/ai-pricing.ts` — update `PRICING_PER_MTOK` there if Anthropic's rates change or a new model is wired into `src/lib/ai/*`.

| Signal | Where | Action if tripped |
|---|---|---|
| Haiku spend | `/admin/analytics` → AI Cost tab (primary) or `SELECT sum(input_tokens), sum(output_tokens), count(*) FROM ai_pipeline_logs WHERE created_at > now() - interval '7 days'` | At 50% of monthly cap, investigate call volume per family. At 80%, flip `DRAFT_INSIGHTS_ENABLED=false`. |
| Draft-insight spend specifically | AI Cost tab → "Draft insights" totals card; or SQL `... WHERE model_used LIKE '%-draft'` | Flip `DRAFT_INSIGHTS_ENABLED=false` in Vercel; it's a runtime read. Soft threshold: $3/family/month. |
| Noisy single family | AI Cost tab → "Top families by spend" table | Cross-reference the truncated family ID via `/admin/families`. Tighten that route's `rateLimit()` if abuse pattern. |
| Sentry quota (5k events/mo free) | Sentry → Stats | Triage noisy issues; sample `beforeSend` if a specific pipeline is spamming. |
| Vercel function invocations / bandwidth | Vercel → Usage | If approaching Pro limits, triage longest routes in the Analytics tab. |
| Neon compute hours | Neon → Usage | Pilot should stay well under free-tier compute; investigate any query above 500ms in the slow-query log. |

---

## 4. Product analytics — pilot event list

All events are opt-in (only fire when `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` are set). Schema is enforced by the `HearthEvent` union in `src/lib/analytics/posthog.ts`; add there first when extending. Every event is identified by SHA-256-hashed Clerk user ID (same for client + server events so they join per person).

| Event | Source | Where it fires |
|---|---|---|
| `entry_created` | client | Logger save handler (`src/app/(auth)/log/page.tsx`) |
| `entry_enriched` | server | `/api/entries` POST, after `enrichEntry()` resolves or throws |
| `logger_completed_50pct` | client | Logger, once per session when completeness first ≥ 50 |
| `module_added_to_library` | client | Marketplace "Add to Library" click (`src/app/(auth)/explore/marketplace/page.tsx`) |
| `badge_awarded`, `badge_deferred` | client | Badge assessment page |
| `report_exported` | client | HEU report Export button (`src/app/(auth)/our-story/report/page.tsx`) |
| `pedagogy_set` | client | Onboarding wizard save, Settings wizard save, Settings inline philosophy selector (each tagged with `source`) |
| `pack_purchased` | server | Stripe webhook (`/api/stripe/webhook`) after the entitlement row is written |

Privacy posture: no entry text, no learner names, no email, no free-form strings (the `sanitise()` helpers on both client and server drop anything >40 chars or with 2+ consecutive spaces).

---

## 5. Known gotchas

- **Cron secret rotation.** Changing `CRON_SECRET` in Vercel does not retroactively authorise past cron invocations — only new ones. Expect a brief window where the next cron run succeeds with the new token; old curl commands must use the new value.
- **Clerk v7 Sign-in contrast** has a theme regression — see commits `c590d41` / `06bfee1`. If sign-in text reads low-contrast on either theme, re-check `src/app/clerk-theme.ts`.
- **`DRAFT_INSIGHTS_ENABLED` is read at runtime**, so flipping the Vercel env var takes effect on the next cold-start. Force it sooner by redeploying (no code change required — just click Redeploy).
- **Stripe webhook signature uses the raw body.** `/api/stripe/webhook` calls `request.text()` (not `.json()`) because the HMAC is computed over the original bytes. Don't add middleware that re-parses or normalises the body for that route — it will silently break signature verification.
- **Open caveats for pilot launch** are tracked in `docs/alpha-readiness-pickup.md` → "Honest caveats / known limitations". Skim it before the first deploy and before the weekly cost watch.
