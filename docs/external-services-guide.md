<!-- Version: 2 | Date: 2026-04-29 | Changes: Added "what it is / why this service / why not the alternatives" rationale to every service section, plus a top-level architecture-decisions preamble that ties the choices together. -->

# Hearth — External Services Guide

> All-in-one operator's reference for every third-party service Hearth depends on. Each section answers six questions: *what is this service in the world, what do we use it for, why this provider, what's free, when does it tip to paid, and where do I look mid-incident?*
>
> **Pricing accuracy:** numbers below were captured 2026-04 from each provider's public pricing page. Re-verify at each provider before any deploy that depends on the count. Treat thresholds as soft — set your own internal alerts at ~70 % of the limit.

## Architecture decisions driving these choices

Every service below was picked against four cross-cutting constraints. When you read the per-service rationale, these are the rules each provider had to satisfy:

1. **Solo-developer ergonomics.** Drew is the only operator. A service had to be either zero-config to wire up or replace 1–2 weeks of bespoke code. Anything that demanded its own dedicated runbook beyond what Hearth's own runbooks cover was out.
2. **Australian data sovereignty + privacy posture (Decisions D & E).** Family identifiers SHA-256 hashed before transit. No PII or entry text in analytics events. Australian or nearby region preferred where the provider exposes the choice. Self-host option preferred for analytics so we never ship household data to a US-only multi-tenant platform.
3. **Two-layer AI architecture.** Expensive LLM calls at write-time only — never at runtime in front of a user. This means the AI provider has to be solid for *batch-style* once-per-save calls and a graceful fallback to keyword matching when it's not. Latency at p99 matters less than cost-per-call.
4. **Pilot-affordable, alpha-graceful.** Every service must have a free tier that covers the 10–20 family pilot with at least 5× headroom on the metric most likely to grow. Where it doesn't (Anthropic), the failure mode at the cap has to be benign (429 + fallback, not data loss).

A fifth cross-cutting principle keeps showing up in the per-service rationale: **prefer one-billing-relationship bundles where they exist** (Vercel hosting + Vercel Blob + Vercel cron). Multi-vendor sprawl is real ops cost.

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

**What it is:** A platform-as-a-service for full-stack JavaScript apps. Built by the team that maintains Next.js, so the integration between framework and platform is tighter than anywhere else. Provides hosting, serverless functions, edge functions, scheduled crons, blob storage, image optimisation, preview deploys per branch, and a built-in CDN, all under one dashboard.

**What we use it for:** Hosts the Next.js app, runs scheduled crons (`/api/admin/retention`, `/api/admin/invitations/expire`), serves edge functions, hosts the public landing page, and provides preview deploys per PR for visual review before merging to `main`.

**Why this over alternatives:**
- **Vs. Netlify, Cloudflare Pages:** Vercel makes Next.js. Same company. Build behaviour, runtime, edge functions, image optimisation, and `Image`/`Link` components are all tuned for the framework's exact assumptions. Netlify/Cloudflare can run Next.js but you fight every release of Next that ships a new feature.
- **Vs. AWS Amplify, self-hosted Node on EC2/Fly:** ops cost. Amplify forces you to learn AWS IAM and CloudFormation. Self-hosting means caring about TLS, autoscaling, the load balancer, log shipping. Solo-dev pilot can't pay that tax.
- **Vs. Render, Railway:** comparable for the basic "run my app" job, but neither has Next.js-specific edge runtime support, neither offers preview deploys at the same level of polish, and neither bundles cron + blob in one bill.
- **Lock-in awareness:** Next.js is open source and runs anywhere. The vendor-specific bits — image optimisation API, `vercel.json` cron schedules, Vercel Blob — are isolated enough that a future migration to Fly/AWS is a 1–2 week project, not a rewrite. We accept the lock-in for the ergonomic win during alpha.

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

**What it is:** Serverless Postgres. Same Postgres you'd run yourself, but with separated storage + compute, instant copy-on-write branching, point-in-time recovery, and a connection-pooled HTTP-based driver that doesn't fight against short-lived serverless functions.

**What we use it for:** Holds every byte of family / learner / entry / snapshot data — i.e. all of Hearth's transactional state. Drives the integration test platform via ephemeral branches: each test run forks `production` schema-only into a throwaway branch, runs against that real Postgres, then deletes the branch. Same branching is the staging mechanism for risky migrations (drops, NOT NULL on populated tables, type changes).

**Why this over alternatives:**
- **Vs. Supabase:** Supabase bundles Postgres + Auth + Storage + Realtime. We picked Clerk for auth and Vercel Blob for storage, so most of Supabase's value is unused. Supabase's branching is also younger and less ergonomic than Neon's, and the integration with Drizzle + serverless functions is rougher. Neon's HTTP driver (`@neondatabase/serverless`) was designed for Vercel's exact runtime model.
- **Vs. AWS RDS, Aurora Serverless v2:** RDS is fine if you have AWS people. We don't. Aurora Serverless v2 still requires VPC + subnet groups + IAM. Neon's "click new project, copy connection string" ergonomics are 10× faster.
- **Vs. PlanetScale (MySQL):** PlanetScale's branching is genuinely the inspiration for Neon's, but it's MySQL. We need Postgres for `jsonb` (snapshots, AI enrichment results), array columns (capability thread IDs), and the analytics queries the admin dashboard runs. Postgres feature set is the reason.
- **Vs. Render Postgres, Railway Postgres:** comparable hosting tier but no branching. Branching is the killer feature for our test platform — we'd lose the integration test architecture that makes refactors safe.
- **Vs. self-hosted Postgres on Fly/Hetzner:** ops cost. Backups, replication, PITR, monitoring all become our problem.
- **Trade-off acknowledged:** the free tier's 6h PITR window is tighter than ideal for a prod deployment that doesn't have a separate dev branch. Tracker #24 is the restore drill that confirms it's enough; tracker line acknowledges paid Launch tier ($19/mo) extends to 7 days when warranted.

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

**What it is:** A managed authentication and user-management service. Provides hosted sign-up / sign-in flows, session management, password resets, email verification, OAuth provider integrations, MFA, organisations + memberships, webhooks for user lifecycle events, and pre-built UI components (`<SignIn />`, `<UserButton />`) that drop into Next.js with one line.

**What we use it for:** Every interactive surface in `/(auth)/*` is gated by Clerk middleware. The `userId` Clerk returns is the foreign key on `families.clerkUserId` — all of Hearth's per-user data lookups start by hashing that ID. Clerk's pre-built `<SignUp />` component is what new pilot families actually see. Co-facilitator invites are a thin layer on top of Clerk's organisation/membership primitives via our own `family_members` table.

**Why this over alternatives:**
- **Vs. NextAuth (now Auth.js):** NextAuth is a library, not a service. We'd own session storage, password hashing, email-verification token lifecycles, password-reset flows, MFA UX, account-deletion confirmation, and every edge case of OAuth callback errors. For a solo dev that's 2–3 weeks of bespoke security code, plus indefinite maintenance liability. Clerk is the single biggest "buy not build" decision in the stack.
- **Vs. Auth0:** Clerk's free tier (10k MAU) is much more generous than Auth0's (7.5k MAU). Auth0's UI components are dated; Clerk's are React-first and theme via `clerk-theme.ts` cleanly into Hearth's design tokens. Auth0 also has a reputation for steep pricing once you cross the free line.
- **Vs. Supabase Auth, Firebase Auth:** both are tightly coupled to their parent platforms. We're not using Supabase for the database, and we explicitly avoid Firebase (Google data-sharing concerns for an Australian children's-data product). Standalone auth providers respect the rest of our stack better.
- **Vs. AWS Cognito:** Cognito is correct in the AWS-native world. We're not in that world.
- **Trade-off acknowledged:** the free tier sends auth emails from a Clerk-branded "via Clerk" address. Acceptable for the alpha pilot; flagged in this doc as a Pro-tier ($25/mo) trigger if a pilot family complains.

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

**What it is:** A headless CMS with schema-as-code, a hosted real-time editing studio, GROQ as a query language, and a content-delivery API CDN. Schemas live in your repo as TypeScript, content lives in Sanity's cloud. Editors collaborate in Studio with real-time presence; engineers query the same data via GROQ from any runtime.

**What we use it for:** The reusable, portable content layer — modules, approaches, activities, packs, capability threads, badges, projects, commons texts, pedagogy overlays. The hierarchy is Pack > Module > Approach > Activity (per [`docs/hearth-pack-data-architecture-v1.md`](./hearth-pack-data-architecture-v1.md)). Anyone editing curriculum material works in Studio; the app reads the published content via GROQ at request time. No user data lives here — that's Postgres's job.

**Why this over alternatives:**
- **Vs. Contentful:** Contentful's schema is GUI-defined and hard to version-control cleanly. Sanity's schema-as-code (TypeScript objects committed to `src/sanity/schemas/`) means content shape changes ship via PR review like any other code. For a solo dev that's a huge audit-trail win.
- **Vs. Strapi, Payload (self-hosted):** both require hosting + auth + backups + version control of the runtime, not just the schema. Sanity hosts it. We pay only for the seats and storage.
- **Vs. Postgres tables (i.e. "skip the CMS"):** the killer use case for the CMS is *editorial UX without a custom admin dashboard*. If we put modules/activities/packs in Postgres we'd write our own Studio, which is months of UI work. Sanity is the buy-not-build call.
- **Vs. Notion-as-CMS, Airtable-as-CMS:** both have ergonomic editing but neither has a real schema enforcement layer or a sane query language. Capability-thread relationships (prerequisites, enables) are a graph; GROQ handles graph queries cleanly, Notion does not.
- **Architectural note (per [`docs/hearth-data-architecture-overview-v1.md`](./hearth-data-architecture-overview-v1.md)):** the "Sanity = reusable content. Postgres = user/transactional data." rule is a hard architectural constraint. Two stores forces the boundary to be explicit, but it also keeps content portable — a future where Hearth packs ship to other LMS platforms doesn't require an export script.
- **Trade-off acknowledged:** maintaining two data stores means we own a small content-cache layer (`src/lib/sanity/sanity-thread-cache.ts`). That's the cost.

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

**What it is:** The maker of Claude — a family of large language models (Haiku, Sonnet, Opus) accessible via a REST API. Anthropic positions itself around Constitutional AI: alignment training that makes the models safer and more steerable on long-form, structured outputs than the typical instruction-tuned generation.

**What we use it for:** Two specific call sites. (1) Write-time enrichment in `src/lib/ai/enrich.ts` — when a parent saves a complete entry, the entry text plus their pedagogy profile goes to Haiku 4.5, which returns capability threads, curriculum descriptors, and an insight summary. The result is stored in `learning_entries.aiEnrichment` and powers the Capabilities Constellation, the report PDFs, and the family intelligence snapshot. (2) Draft insights in `src/lib/ai/draft-insight.ts` — a debounced (2 s) call fired while the parent is typing, returning the "Hearth is noticing" panel that softly nudges them toward richer reflection. Both are write-time only; **no Claude call ever happens at read time** (architecture rule per `CLAUDE.md`).

**Why this over alternatives:**
- **Vs. OpenAI (GPT-4o, GPT-4-turbo):** comparable raw capability for our task. Anthropic wins on three Hearth-specific axes: (a) Constitutional alignment is well-suited to philosophy-neutral content generation — Claude resists drifting into prescriptive parenting advice in a way that GPT does not by default; (b) safety profile for children's-data context — Anthropic's terms forbid training on customer data, which we cite in the Privacy Policy; (c) Haiku's price/quality ratio for the "structured JSON out of a few paragraphs of text" task is currently the cheapest in its tier.
- **Vs. Google Gemini:** trust posture. Hearth carries Australian children's data and the parent contract explicitly avoids Google. Independent of the model's quality, the optics matter.
- **Vs. Mistral, Cohere:** smaller ecosystem, less tooling around structured-output reliability, and fewer published evals on educational content. Mistral specifically has been improving fast, but the "stable JSON in, stable JSON out, with retries that recover from prose" plumbing in `enrich.ts` was easier to build and validate against Claude.
- **Vs. self-hosted (Llama 3.1 70B, Qwen 2.5):** running our own model means owning a GPU instance with 80 GB+ VRAM, plus the inference server. Operational cost is wildly higher than the ~$40/mo we pay Anthropic. Plus the structured-output reliability of mid-size open models is still meaningfully behind Haiku.
- **Architectural commitment:** the two-layer AI rule (write-time only, never runtime) lets us treat Anthropic as a *batch-style* dependency. If Anthropic is down, entries still save — the fallback keyword matcher in `enrich.ts` produces less rich enrichment, but the user-facing flow doesn't break. That property is what makes external AI dependence acceptable.

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

**What it is:** An error-monitoring and performance-tracing platform. Catches unhandled exceptions and slow transactions, deduplicates them by stack trace fingerprint, attaches breadcrumbs (recent console + network activity) to each event, and lets you triage / assign / resolve from a hosted dashboard. Source-map upload at deploy time means production stack traces show real line numbers in your code, not minified gibberish.

**What we use it for:** Catch errors we don't otherwise see — anything that throws and isn't caught in Hearth's API routes, anything that breaks during Haiku enrichment, anything that fails in the cron handlers. The noisy-family detector (PR #18) writes `console.error` lines that Sentry surfaces as warning breadcrumbs. Sentry is also the destination for the deploy-smoke-test marker we throw during the §1.6 walkthrough. **Privacy posture:** autocapture off, no PII in event metadata, no entry text or learner names ever in a Sentry payload.

**Why this over alternatives:**
- **Vs. Datadog, New Relic:** these are excellent but priced for ops teams, not solo devs. Datadog's free tier gives you ~5 hosts of infrastructure monitoring but very little APM headroom. Sentry's free tier gives 5 000 errors/mo, which is the metric we actually care about.
- **Vs. Bugsnag, Rollbar:** comparable feature set, less aggressive Next.js integration. Sentry's `@sentry/nextjs` SDK auto-instruments edge runtime, server components, and middleware in a way Bugsnag doesn't bother with. Source-map upload is also turnkey.
- **Vs. console.log + grep through Vercel function logs:** what we'd default to without Sentry. Loses deduplication, loses breadcrumbs, loses release tracking, and means we'd discover regressions only when a family complains. The cost of the free tier vs. the cost of a missed bug is not close.
- **Vs. self-hosted Sentry:** the open-source Sentry stack is real but operationally heavy (Postgres + Kafka + ClickHouse). Free SaaS tier is a much better fit for solo-dev operational reality.
- **Why it's optional:** the SDK is wired in, but `NEXT_PUBLIC_SENTRY_DSN` being unset cleanly no-ops the whole thing. Local dev runs without it. That's deliberate — we'd rather a developer who hasn't set up Sentry get a working app than a confusing init error.

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

**What it is:** A product-analytics platform — funnels, retention curves, group analytics, feature flags, session replay, surveys, all under one open-source codebase. SaaS-hosted at `app.posthog.com` or self-hostable (Docker / Kubernetes) on your own infrastructure. The whole platform is open source under MIT, which matters for self-host viability.

**What we use it for:** Three questions, per the test-family onboarding packet: (1) does retrospective logging stick as a habit (≥3 entries/family/week)? (2) does the curriculum coverage feel honest (do families actually export the report)? (3) what pedagogy patterns emerge across philosophies? Every answer comes from a small allowlist of explicit events — `entry_created`, `entry_enriched`, `badge_awarded`, `pedagogy_set`, `report_exported`, etc. Family-level grouping (PR #15) means two co-facilitators on one household roll up into one analytic unit for funnels and retention.

**Why this over alternatives:**
- **Vs. Mixpanel, Amplitude:** both are commercial-only, cloud-only, US-hosted. Decision E commits Hearth to a self-hostable analytics path so we can move household data off a US multi-tenant platform if a family asks. Neither Mixpanel nor Amplitude offers that.
- **Vs. Google Analytics 4:** absolutely not. GA4 is opinionated about what you're measuring (page views, marketing funnels), not about explicit event allowlists. Privacy implications for Australian children's data make GA4 a non-starter regardless of feature fit.
- **Vs. Plausible, Fathom:** Plausible is a wonderful tool for "how many uniques saw the landing page" but it doesn't do funnels, retention cohorts, or group analytics. We need household-level retention curves to know if Hearth is actually working — that's PostHog's wheelhouse, not Plausible's.
- **Vs. building our own analytics on Postgres:** we'd write our own funnel SQL, our own retention cohort logic, our own dashboard UI. That's months of work for a tool PostHog gives us free.
- **SaaS vs. self-host trade-off (Decision E):** Cloud free tier (1 M events/mo) covers the alpha pilot 1000× over. Decision E says we self-host *eventually*, but during alpha the Cloud tier keeps the operator load low. The migration from PostHog Cloud to self-hosted is a single env-var change (`NEXT_PUBLIC_POSTHOG_HOST`) — we keep the option open without paying for it now.
- **Privacy posture preserved across both modes:** identifiers SHA-256 hashed before transit, no autocapture, no entry text in events, family group ID also hashed (per `src/lib/analytics/posthog.ts`).

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

**What it is:** Vercel's object-storage product. Stores arbitrary binary blobs (photos, files), returns public URLs, integrates with Vercel hosting under one billing relationship. Backed by Cloudflare R2 under the hood, so the durability + CDN profile is good.

**What we use it for:** Evidence photos parents attach to learning entries. The Logger lets a parent snap a phone photo and tack it onto an entry; the file goes to `/api/evidence/upload`, the route stashes it in Blob, and the blob *pathname* (`evidence/<familyId>/<file>`, **not** a public URL) is stored on `learning_entries.evidenceUrls`. Report PDFs reference only the evidence *count* per entry — the photo bytes are never embedded in the PDF. **Graceful degradation:** if `BLOB_READ_WRITE_TOKEN` is unset, the upload route returns 503 with a clear message and the app continues without photo support. Local dev runs cleanly without it.

**Access control (children's photos — read this before changing it):** Evidence photos are children's photos, so they are **not** public-by-obscurity. Uploads are stored as **private** blobs (`access: 'private'`); the browser never holds a blob URL, only a same-origin reference (`/api/evidence?ref=<pathname>`). Reads go through the authenticated proxy `GET /api/evidence` ([`src/app/api/evidence/route.ts`](../src/app/api/evidence/route.ts)), which checks the Clerk session and then **family ownership by path prefix** — the owning family id is baked into the pathname, so a family can only read blobs under its own prefix (`src/lib/evidence.ts:authorizeEvidenceRef`). `Cache-Control: private` keeps the bytes out of shared caches/CDNs while still letting the parent's own browser cache them; this trades CDN edge-caching for genuine per-family access control (immaterial at pilot scale). If the store doesn't support private access, the upload route falls back to **public** blobs — the proxy still gates client access, so the URL is never exposed either way, but the object is then only obscure rather than truly private. **Caveat:** private Blob is a newer feature; confirm it's enabled on the current Vercel plan/store (the SDK requires ≥ `@vercel/blob` 2.4.0 for `get()` + private access). Legacy rows holding a full public blob URL (pre-private) still render directly via the `evidenceSrc()` passthrough. **Not yet covered (follow-ups):** the co-op session-evidence surface (`/api/hearths/[id]/sessions/[sessionId]/evidence`) is still public, and blob `del()` is not wired into account/entry deletion (orphaned photos persist — an APP 11.2 retention gap).

**Why this over alternatives:**
- **Vs. AWS S3 directly:** S3 is the obvious alternative and the standard answer. We picked Blob for the bundling — one Vercel bill, no IAM policy juggling, no S3 bucket policy footguns, no cross-account upload-URL signing. For a solo dev the operational simplicity is the point.
- **Vs. Cloudflare R2:** under the hood Blob *is* R2. Going direct buys minor cost savings at scale, but means setting up another vendor relationship, another dashboard, another bill. At pilot scale not worth it.
- **Vs. Supabase Storage:** see Supabase entry under Neon — we're not using Supabase elsewhere, so its storage product doesn't get a discount.
- **Vs. base64-in-Postgres:** would work for very small uploads but kills query plan ergonomics, balloons backup size, and means every page load that references an entry pulls megabytes of binary data. Not viable past a handful of test families.
- **Lock-in awareness:** Vercel Blob's API is small and S3-shaped. If we ever leave Vercel, switching the upload route to S3-compatible store is ~30 lines of code. The lock-in is acceptable.
- **Architectural note:** photos + storage URLs are the only "binary" data Hearth handles. Everything else is rows in Postgres or documents in Sanity. That single-purpose use of Blob keeps the surface area small and the dependency easy to swap.

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

**What it is:** A specialist embeddings provider. Their `voyage-3-lite` and `voyage-3` models are domain-tuned text embedders that produce vector representations of short strings; the vectors then go into a similarity-search index (e.g. pgvector) for retrieval-augmented generation. Voyage's stated angle is best-quality embeddings per token at the small-model end.

**What we use it for:** The retrieval-augmented pedagogy knowledge base (`src/lib/pedagogy/embedding.ts`, `src/lib/ai/pedagogy-context.ts`, `src/lib/logger/coaching/retrieval-provider.ts`). When `PEDAGOGY_KB_ENABLED=true`, we embed snippets of pedagogy reference material (Charlotte Mason, Classical, Montessori, Waldorf, Unschooling, Eclectic) into a vector index. At enrichment time, we pull the most relevant snippets for the entry being saved and feed them into the Haiku prompt so the resulting capability/curriculum tagging reflects the family's pedagogy lens.

**Status today:** **OFF by default.** `PEDAGOGY_KB_ENABLED=false` (or unset) skips the entire path. Hearth runs without it. Tracker doesn't expect this on for alpha pilot — it's a Phase 2+ feature.

**Why this over alternatives:**
- **Vs. OpenAI `text-embedding-3-small`:** OpenAI's embeddings are perfectly fine but require us to have an OpenAI account in addition to Anthropic. Voyage gives us a single embeddings vendor without crossing into the broader OpenAI relationship.
- **Vs. Cohere embeddings:** comparable quality. Voyage's free tier (50 M tokens/mo) is more generous than Cohere's free tier for prototyping. Both are commercial-grade enough.
- **Vs. self-hosted (sentence-transformers, BGE):** we'd own a Python service or a heavy Node embedding loader. Pilot scale doesn't justify the ops cost. If we ever need full data sovereignty over embeddings (some pilot family flags concern), self-hosting BGE is the planned migration path — wrap is thin enough.
- **Why a *thin* wrap (`src/lib/pedagogy/embedding.ts`):** the file is intentionally small so swapping providers is one PR. We don't deeply integrate Voyage-specific features (reranking, multimodal). Embedding API is commoditised; we treat it as such.
- **Why this isn't on for the pilot:** the knowledge base content needs editorial curation before it produces useful retrievals. Cart-before-horse to flip the flag with thin/wrong content. Tracker captures this implicitly under the broader content-curation work.

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

**What it is:** The default source-control hosting platform. Git repository hosting, pull-request review surface, issue tracking, GitHub Actions CI/CD, branch protection rules, code search, packages, releases. Effectively the table-stakes infrastructure layer for any modern software project.

**What we use it for:** Single repo `Glorptraag/hearth`. Every change is a PR; every PR runs the four-job CI pipeline (lint + typecheck + unit + integration tests against an ephemeral Neon branch). Branch protection rules require all four to pass before merge — though see the trade-off note. Issue tracker is currently used informally; the production-readiness tracker doc is doing most of that work in markdown.

**Why this over alternatives:**
- **Vs. GitLab, Bitbucket:** network effects. The Vercel↔GitHub integration is one click; the open-source ecosystem (Sentry actions, Codecov, dependabot) all assumes GitHub. Choosing GitLab buys nothing for a solo dev and costs in friction every time we adopt a tool.
- **Vs. self-hosted (Forgejo, Gitea):** ops cost. We'd own backups, TLS, the runner pool. Free SaaS tier is much cheaper than the time.
- **Why GitHub Actions and not CircleCI/Buildkite:** Actions is bundled. Free tier covers our 4-job CI footprint with 10× headroom. CircleCI is more powerful at scale but at our scale not worth a separate billing relationship.
- **Trade-off acknowledged:** branch protection on private repos is *advisory* on the Free tier — the "Require checks to pass before merging" rule is configured but won't actually block merges until the repo upgrades to Team/Enterprise or goes public. Solo-dev pilot is OK with this; the operator is also the merger. Worth flipping to Team ($4/mo) the moment a second person can hit the Merge button.
- **Why this isn't a "decision" the way the others are:** GitHub is the path of least resistance, and the only reason to weigh alternatives is a specific compliance constraint (sovereign-cloud GitLab, etc.) we don't have.

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
