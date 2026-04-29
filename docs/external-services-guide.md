<!-- Version: 1 | Date: 2026-04-29 | Changes: Initial all-in-one external-services guide. Free tiers + tipping points + paid tier costs as of pilot prep. Re-verify pricing at each service's site before launch and quarterly thereafter. -->

# Hearth — External Services Guide

> All-in-one operator's reference for every third-party service Hearth depends on. Each section answers four questions: *what does this do for Hearth, what's free, when does it tip to paid, and where do I look mid-incident?*
>
> **Pricing accuracy:** numbers below were captured 2026-04 from each provider's public pricing page. Re-verify at each provider before any deploy that depends on the count. Treat thresholds as soft — set your own internal alerts at ~70 % of the limit.

## Quick legend

- 🟢 **headroom** — pilot scale (10–20 families) sits well within free tier
- 🟡 **watch** — within free tier but worth monitoring
- 🔴 **upgrade gate** — concrete trigger that forces a paid plan
- 💰 **next tier** — what the first paid step actually costs

## Table of services

1. [Vercel](#1-vercel) — hosting + crons + edge
2. [Neon](#2-neon) — PostgreSQL + PITR
3. [Clerk](#3-clerk) — authentication
4. [Sanity](#4-sanity) — content (modules, packs, capability threads)
5. [Anthropic](#5-anthropic) — Claude API (Haiku enrichment)
6. [Sentry](#6-sentry) — error reporting
7. [PostHog](#7-posthog) — product analytics
8. [Vercel Blob](#8-vercel-blob) — evidence media storage
9. [Voyage AI](#9-voyage-ai) — embeddings (optional, off by default)
10. [GitHub](#10-github) — source + CI

---

## 1. Vercel

**What it does:** Hosts the Next.js app, runs scheduled crons (`/api/admin/retention`, `/api/admin/invitations/expire`), serves edge functions, hosts the public landing page.

**Account:** <https://vercel.com> · project `hearth` (set region to **`syd1`**)

**Free tier (Hobby):**
- 100 GB bandwidth / month 🟢
- 6 000 build minutes / month 🟢
- 1 M edge-function invocations / month 🟢
- 2 cron jobs, any cron expression 🟡 *(we use exactly 2)*
- 12 serverless functions max per deployment 🟢
- 50 deployments / day 🟢
- Custom domains: yes 🟢
- Team members: 0 (solo only) 🔴 *(forces upgrade if you add a collaborator)*
- No commercial use clause — Hobby is for personal projects 🔴 *(forces upgrade once Hearth charges anyone money)*

**Tip points to Pro ($20 / member / month):**
- 🔴 Adding any collaborator (Vercel commercial-use rule)
- 🔴 Charging users (Hobby is non-commercial)
- 🔴 Cron count > 2
- 🟡 Bandwidth approaching ~80 GB / month
- 🟡 Need for multi-region deployment (also triggers tracker #30 Redis migration)

**Mid-incident dashboards:**
- Deployments + logs — `https://vercel.com/<your-org>/hearth/deployments`
- Cron history — `https://vercel.com/<your-org>/hearth/settings/crons`
- Function logs — `https://vercel.com/<your-org>/hearth/logs`
- Usage — `https://vercel.com/<your-org>/usage`

**Hearth env vars from this:** `CRON_SECRET` (you generate), region pinning (`syd1`).

---

## 2. Neon

**What it does:** Serverless PostgreSQL. Holds every byte of family / learner / entry / snapshot data. Branching is core to integration tests + risky-migration staging.

**Account:** <https://console.neon.tech> · project `hearth` · region **AWS Asia Pacific 2 (Sydney)**

**Free tier:**
- 0.5 GB storage 🟡 *(pilot families consume ~5–15 MB each; ~30 MB seed/system)*
- 100 compute hours / month (CU-hrs) 🟢 *(autoscale 0.25–2 CU; pilot uses ~3 CU-hrs / month)*
- 5 GB network transfer / month 🟢
- 10 branches max 🟡 *(integration tests create ephemeral branches; cleaned up automatically)*
- 6 hour history retention (PITR) 🔴 *(see tracker #24 — concrete restore drill)*
- Postgres 17 ✓

**Tip points to Launch tier ($19 / month):**
- 🔴 Storage > 0.5 GB (10 GB on Launch). Hits at roughly **30–50 active pilot families** depending on entry length + photo evidence URLs.
- 🔴 Need for > 6 hour PITR (Launch gives 7 days).
- 🟡 Compute > 80 CU-hrs / month (sustained traffic).
- 🟡 Branches > 8 (integration tests + a couple of long-lived dev branches).

**Mid-incident dashboards:**
- Project dashboard — `https://console.neon.tech/app/projects/<id>`
- Branches + restore from PITR — same project → Branches tab
- SQL editor — same project → SQL Editor

**Hearth env vars from this:** `DATABASE_URL` (pooled prod URL), plus `NEON_API_KEY` / `NEON_PROJECT_ID` / `NEON_PARENT_BRANCH_ID` for the integration test branch script.

---

## 3. Clerk

**What it does:** Authentication. Sign-up / sign-in / session management / password resets / email verification. Provides the Clerk user ID that every Hearth row keys off.

**Account:** <https://dashboard.clerk.com> · instance `hearth` (single instance, **must be on live keys not test keys**)

**Free tier:**
- 10 000 monthly active users 🟢 *(pilot: 10–20)*
- 100 monthly active orgs 🟢
- All auth methods (email, Google, Apple, magic link, etc.) 🟢
- Custom domain on production instance ✓
- Basic email + SMS sender (Clerk-branded) 🟡 *("via Clerk" in email From line)*

**Tip points to Pro ($25 / month):**
- 🔴 MAU > 10 000. **Far** above pilot ceiling — only relevant if Hearth grows to mid-hundreds of families.
- 🟡 Want to remove "via Clerk" branding from auth emails (custom email sender domain).
- 🟡 Need MFA-enforced session policies.

**Mid-incident dashboards:**
- Users — `https://dashboard.clerk.com/apps/<id>/users`
- API keys (where you check `pk_live_…` vs `pk_test_…`) — same → Configure → API Keys
- Email logs — same → Configure → Email & SMS

**Hearth env vars from this:** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live_…`), `CLERK_SECRET_KEY` (`sk_live_…`), the four redirect URL vars (`/sign-in`, `/sign-up`, `/dashboard`, `/onboarding`).

---

## 4. Sanity

**What it does:** Headless CMS for portable content (modules, approaches, activities, packs, capability threads, badges, projects, commons texts). Content is editorially curated; user data does NOT live here.

**Account:** <https://www.sanity.io/manage> · project `hearth` · dataset `production`

**Free tier:**
- 3 users on the project 🟢 *(solo + 2 if needed)*
- 10 000 documents 🟡 *(57 capability threads + ~50–200 modules + activities ≈ 500–1500 docs at pilot)*
- 5 GB asset storage 🟢
- 100 GB asset bandwidth / month 🟢
- 200 000 API CDN requests / month 🟢
- 10 000 API requests (non-CDN) / day 🟢
- 1 dataset 🟡 *(we have one — `production`)*

**Tip points to Growth ($99 / month):**
- 🔴 Need a second dataset (e.g. `staging` for editorial review before promoting). Solo pilot can dodge by editing `production` directly with Studio's draft mode.
- 🔴 Documents > 10 000 — when the content library scales beyond the alpha catalogue.
- 🟡 Want webhooks fan-out, scheduled publishing, or query history.

**Mid-incident dashboards:**
- Studio (visual editing) — `https://<your-project>.sanity.studio/`
- Project Manage — `https://www.sanity.io/manage/personal/project/<id>`
- API tokens — same → API → Tokens (rotate quarterly per #25)
- Usage — same → Usage

**Hearth env vars from this:** `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET=production`, `SANITY_API_TOKEN` (write scope, server-only).

---

## 5. Anthropic

**What it does:** Claude API. Powers write-time enrichment in `src/lib/ai/enrich.ts` (saved entry → capability threads + curriculum descriptors) and the debounced draft insights in the Logger.

**Account:** <https://console.anthropic.com>

**Free tier:** none. Usage is pay-as-you-go from day one. The "free trial credit" Anthropic occasionally offers is small ($5–10) and not part of any plan.

**Pricing (per million tokens, Apr 2026):**
- Haiku 4.5: $0.80 input / $4 output 🟢 *(this is what enrichment uses)*
- Sonnet 4 family: $3 input / $15 output (≈ 3.75× Haiku)
- Opus 4 family: $15 input / $75 output (≈ 18× Haiku)

**Pilot estimate** (per [`docs/incident-runbook.md` §2](./incident-runbook.md)):
- ~100 calls / family / month for draft insights
- ~50 calls / family / month for write-time enrichment
- ≈ $2 / family / month at Haiku rates
- 20-family pilot ≈ **$40 / month** of expected Haiku spend

**Tip points to "I should care":**
- 🔴 Workspace **monthly spend cap** (set in console → Settings → Limits). Tracker #18 — set this to e.g. $50 for a 20-family pilot. When hit, the API returns 429 and the app's fallback keyword matcher takes over.
- 🟡 Daily spend > $3 / family on rolling 7-day window. Soft alert; investigate via [`/admin/analytics`](../src/app/api/admin/analytics/) AI Cost panel.
- 🟡 A model fallback (Haiku → Sonnet) silently triples the bill. PR #16 made the cost dashboard model-aware to surface this.

**Mid-incident dashboards:**
- Usage — `https://console.anthropic.com/settings/usage`
- Limits — `https://console.anthropic.com/settings/limits`
- API keys — `https://console.anthropic.com/settings/keys`
- Internal: `/admin/analytics` → AI Cost panel

**Hearth env vars from this:** `ANTHROPIC_API_KEY`. Plus `DRAFT_INSIGHTS_ENABLED` (kill switch — flip to `false` for emergency cost containment).

---

## 6. Sentry

**What it does:** Error reporting. Captures unhandled exceptions, slow transactions, deploy markers. No PII or entry content (per privacy posture).

**Account:** <https://sentry.io> · project `hearth-prod`, platform Next.js

**Free tier (Developer):**
- 5 000 errors / month 🟢 *(pilot: typically < 50 errors / month)*
- 10 000 performance units / month 🟡 *(transaction sampling — Hearth defaults to 0.1 sample rate)*
- 50 replays / month 🔴 *(we don't use Replay)*
- 1 GB attachments / month 🟢
- 1 user 🟡 *(solo pilot fine)*

**Tip points to Team ($26 / month):**
- 🔴 More than 1 user needs access (collaborator on triage).
- 🔴 Errors approach 4 000 / month — usually means a bug regression, not pilot growth.
- 🟡 Want longer event retention (Free retains 30 days; Team retains 90 days).

**Mid-incident dashboards:**
- Issues — `https://sentry.io/organizations/<org>/projects/hearth-prod/issues/`
- Performance — same → Performance
- Project settings — same → Settings → Projects → hearth-prod
- Quota — same → Settings → Subscription

**Hearth env vars from this:** `NEXT_PUBLIC_SENTRY_DSN` (public), plus optional `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` for source-map upload at build time.

---

## 7. PostHog

**What it does:** Product analytics. Funnels (entry creation, badge award, report export), retention, family-level grouping. Events are an explicit allowlist; identifiers are SHA-256 hashed (privacy posture per Decision D).

**Account:** <https://app.posthog.com> (Cloud) — alternative is the self-hosted instance per Decision E.

**Free tier (Cloud):**
- 1 000 000 events / month 🟢 *(pilot: ~50 events / family / month → 1 000 events / month at 20 families)*
- 5 000 session recordings / month 🔴 *(we don't use; autocapture is OFF)*
- 1 GB feature flag bandwidth 🟡 *(we don't use feature flags)*
- 1 year data retention 🟢
- Unlimited group analytics ✓ *(family grouping per PR #15)*

**Tip points to Scale (~$0.000248 per event after free tier):**
- 🔴 Events > 1 M / month — at pilot rates this is **~ 1 000× headroom**. Will not happen in alpha.
- 🟡 Want longer than 1-year retention.
- 🟡 Want SAML / SOC 2 reports — Scale tier or above.

**Self-hosting note:** Decision E specified self-hosting on the project's own infrastructure (privacy posture). If self-hosted, ignore Cloud limits — the constraint becomes whatever VM you run PostHog on. Free at the software-licence level, you pay only for the compute you provide.

**Mid-incident dashboards:**
- Live events — `https://app.posthog.com/project/<id>/events` (or your host)
- Insights — same → Insights
- Persons + Groups — same → Persons (and Groups → family)
- Project usage — same → Project → Usage

**Hearth env vars from this:** `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`.

---

## 8. Vercel Blob

**What it does:** Object storage for evidence photos parents attach to entries. The endpoint `/api/evidence/upload` returns 503 cleanly if the token isn't set — the app degrades to "no photo upload" rather than crashing.

**Account:** Vercel project → Storage tab → Blob

**Free tier (bundled with Vercel Hobby):**
- 1 GB storage 🟢 *(pilot: ~10 photos / family / month at ~1 MB each ≈ 200 MB / 20 families / 12 months)*
- 1 GB bandwidth / month 🟢
- Unlimited operations 🟢

**Tip points to paid (storage tier add-on):**
- 🔴 Storage > 1 GB. Hits at roughly **20 families × 12 months × 5 MB / family / month**. Year-1 alpha unlikely to trip.
- 🟡 Bandwidth > 800 MB / month sustained.
- 🟡 Need cross-region access (single region is the current posture).

**Mid-incident dashboards:**
- Vercel project → Storage → Blob → Files / Logs

**Hearth env vars from this:** `BLOB_READ_WRITE_TOKEN` (server-only). Optional — endpoint 503s without it but doesn't crash.

---

## 9. Voyage AI

**What it does:** Embeddings provider for the pedagogy knowledge-base retrieval feature (`src/lib/pedagogy/embedding.ts`). Wraps pedagogy reference snippets into a vector index that the enricher pulls from when `PEDAGOGY_KB_ENABLED=true`.

**Status today:** **OFF by default.** `PEDAGOGY_KB_ENABLED=false` (or unset) skips the entire path. Hearth runs without it.

**Account:** <https://www.voyageai.com>

**Free tier:**
- 50 M tokens / month free for `voyage-3-lite` (the model we'd use) 🟢
- Higher-quality `voyage-3` is ~$0.06 / M tokens once free credits exhaust 🟢

**Tip points to "now I care":**
- 🔴 Flipping `PEDAGOGY_KB_ENABLED=true` without funding the workspace. Voyage will throw on first call.
- 🟡 KB grows past ~3 M tokens per refresh (multiple full re-embed runs / week). Pilot scale uses < 0.1 M tokens — wide headroom.

**Mid-incident dashboards:**
- Usage — `https://dash.voyageai.com/usage`
- API keys — `https://dash.voyageai.com/api-keys`

**Hearth env vars from this:** `VOYAGE_API_KEY`, `PEDAGOGY_KB_ENABLED`.

---

## 10. GitHub

**What it does:** Source-of-truth repo, PR review surface, GitHub Actions CI (lint + typecheck + unit + integration on every PR).

**Account:** <https://github.com> · repo `Glorptraag/hearth`

**Free tier (Free):**
- Private repo: unlimited collaborators ✓
- 2 000 GitHub Actions minutes / month for private repos 🟢 *(our 4-job CI takes ~3 minutes / push)*
- 500 MB Actions storage 🟢
- Branch protection rules: advisory only on Free tier 🔴 *(can't enforce checks-must-pass without Team or going public)*
- Codespaces: 60 hours / month free 🟢 *(if you ever use them)*

**Tip points to Team ($4 / user / month):**
- 🔴 Want enforced branch protection on private repos (e.g. require checks to pass before merging to `main`).
- 🟡 Actions minutes > 1 600 / month (≈ 500 pushes / month assuming our CI footprint).

**Mid-incident dashboards:**
- Actions runs — `https://github.com/Glorptraag/hearth/actions`
- Insights → Network — `https://github.com/Glorptraag/hearth/network`
- Usage — `https://github.com/settings/billing` (personal)

**Hearth env vars from this:** none directly. CI pulls Neon vars from repo secrets (`NEON_API_KEY`, `NEON_PROJECT_ID`, `NEON_PARENT_BRANCH_ID`).

---

## Cumulative cost — what alpha launch actually costs

If everything stays on free tiers and Anthropic is the only paid line item:

| Service | Free tier monthly cost | Realistic pilot monthly cost |
|---|---:|---:|
| Vercel Hobby | $0 | $0 |
| Neon Free | $0 | $0 |
| Clerk Free | $0 | $0 |
| Sanity Free | $0 | $0 |
| **Anthropic** | n/a | **~$40** *(20 families × $2 each)* |
| Sentry Developer | $0 | $0 |
| PostHog Cloud Free | $0 | $0 |
| Vercel Blob (Hobby allotment) | $0 | $0 |
| Voyage (off) | $0 | $0 |
| GitHub Free | $0 | $0 |
| **Total** | | **~$40 / month** |

That's the realistic alpha-pilot run rate. The first thing to break free tier is **Neon storage** (probably around 30–50 active families) — that's the +$19 / month moment. Everything else has 10× headroom.

## Audit cadence

Quarterly (set a calendar reminder on the same day you rotate `SANITY_API_TOKEN` per #25):

1. Re-verify each provider's free-tier limits — they shift annually.
2. Cross-check current usage against the tip-points above.
3. Update this guide if any number moved more than ±10 %.
4. Confirm `docs/oncall-cheatsheet.md` dashboard URLs still resolve.

---

## See also

- [`docs/deployment-runbook.md`](./deployment-runbook.md) — first-deploy walkthrough that uses these accounts in order.
- [`docs/oncall-cheatsheet.md`](./oncall-cheatsheet.md) — what to click first mid-incident.
- [`docs/incident-runbook.md`](./incident-runbook.md) — depth on each failure mode.
- [`.env.example`](../.env.example) — authoritative list of every env var the app reads.
- [`docs/production-readiness-tracker.md`](./production-readiness-tracker.md) — current status of #3 / #4 / #18 / #24 / #25 and the rest.
