# Hearth — Context Handback
*Generated 2026-10-06 · branch `main` (checkout is a detached HEAD at `origin/main`) · HEAD `cb830cd "feat(native): env-gated universal-link manifests (#283)"` · run #1*
*Project genesis: 2026-03-25 (`b5d4a83 Initial commit from Create Next App`). Point-in-time snapshot — re-run rosetta to refresh.*

> **Read this first.** `main` has not moved since 2026-08-10 (eight weeks before this capture), but the repo is not idle: six branches carry work newer than `main`, five of them pushed **today** as stacked draft PRs (#284–#288), plus the Capacitor-scaffold PR #281 (last touched 2026-09-29). Everything below describes `main` unless a section says "in flight". See **Current State → In flight on branches**.

---

## Orientation

Hearth is a learning management system for Australian homeschool families, built by one developer (Drew, GitHub `Glorptraag`) with Claude Code as the primary build tool. Its founding bet is that parents who educate at home carry an "am I doing enough?" anxiety with an institutional face (state regulators such as Queensland's Home Education Unit), and that the antidote is *retrospective logging*: a parent captures what happened after it happened, a write-time Haiku call turns it into capability evidence, and every screen reads from a pre-computed per-family snapshot rather than calling an LLM at view time. The platform is deliberately pedagogy-neutral at the content layer (six traditions are applied as runtime lenses), philosophically Christian in worldview without being missional, and bound by a "5-minute rule" on every parent-facing interaction.

Stack in one line: Next.js 16 App Router + React 19 + TypeScript, Tailwind v4 tokens in `globals.css`, Clerk auth, Neon Postgres via Drizzle (41 tables), Sanity as the content CMS (31 schemas, Studio mounted at `/studio`), Anthropic Haiku 4.5 for write-time enrichment, Vercel hosting, Sentry + PostHog, Vitest unit + real-Postgres integration tests in CI.

Stage: **pre-pilot hardening**. The app is feature-complete for its Phase 1 scope (33 auth pages, 136 API route files, community "Hearths", module runner, module builder, badges, planner, compliance report with deterministic curriculum coverage, admin panel) and deployed to production (`hearth-lms.com`), but as of `main` the repo holds **no evidence of a real pilot family** — the persona doc's "Captured profiles" section says "none yet", and every research-log entry is an operator walkthrough or a code audit. The current work (today's PRs) is a value pass on the Constellation, the insights engine, and the pedagogy knowledge base (PKB) corpus, alongside a slow-moving native App Store / Play Store pivot that is blocked on Drew's local toolchain.

The one thing to know before touching anything: the docs are unusually disciplined (decisions log, research log with a bug→regression-test rule, a refactor post-mortem that binds a one-PR-one-deliverable re-land pattern), but several status claims in `PROJECT_STATUS.md` and `CLAUDE.md` trail the code — most visibly on Stripe, the retired Content Studio, and raw counts. When a doc and `git log` disagree, the repo's own convention says `git log` wins.

---

## Stack & Services

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js `16.2.1`, React `19.2.4`, TypeScript `5.9`, React Compiler on (`reactCompiler: true`) | App Router only. Turbopack build (this ruled out webpack-only PWA plugins). `AGENTS.md` warns this Next version differs from training data — read `node_modules/next/dist/docs/`. |
| Styling | Tailwind CSS v4 via `@tailwindcss/postcss`; tokens in `src/app/globals.css` `@theme` (192 custom properties) | No `tailwind.config.ts`. Two themes via `data-theme` (dark default, "gathering" parchment 6am–6pm). `styled-components` is in deps only because Sanity Studio needs it; app code never uses it. |
| Auth | Clerk `@clerk/nextjs ^7` | Route protection in `src/proxy.ts` (Next 16's middleware file). Admin gated separately by `ADMIN_CLERK_IDS` in `src/lib/auth/admin.ts`. |
| Database | Neon serverless Postgres, Drizzle ORM `0.45`, `drizzle-kit` migrations (`drizzle/0000`–`0029`) | Migrations run at Vercel build time (`scripts/deploy-migrate.mjs`). pgvector used for PKB chunks. |
| CMS | Sanity (`@sanity/client ^7`, `next-sanity ^12`), Studio at `/studio` | All learning content. Webhook → `/api/revalidate/sanity` and `/api/pedagogy/sanity-webhook`. |
| AI | `@anthropic-ai/sdk ^0.80`: `claude-haiku-4-5-20251001` primary, `claude-sonnet-4-20250514` fallback for rich entries; Voyage `voyage-3` embeddings (PKB, flag-gated); Deepgram Nova STT (Logger voice) + Aura TTS (write-time read-aloud) | Pricing table in `src/config/ai-pricing.ts`. |
| Payments | Stripe `^22` — hosted Checkout + webhook → `entitlements` table | Live code since 2026-05-24. Stripped from native builds (see D1, D3). |
| Storage | Vercel Blob (private) behind authed `/api/evidence` read proxy | Evidence photos; client-side compression via `sharp`-free browser path (`src/lib/images/compress-image.ts`). |
| Observability | Sentry (`@sentry/nextjs ^10`, tunnel route `/monitoring`), PostHog (client + server, hashed IDs) | |
| PDF | `jspdf` + `jspdf-autotable` + `pdf-lib` | Report export and print bundles. |
| Hosting | Vercel; crons: weekly retention (`/api/admin/retention`), daily invitation expiry | `vercel.json` only deploys `main`. |
| Package manager | **npm** (`package-lock.json`); Node `24.x` via `.nvmrc` | `README.md` still says `pnpm install` — stale. |
| Tests | Vitest 4 (jsdom unit, node integration), Playwright (e2e, not in CI) | See Conventions. |

---

## Architecture Map

```
src/
  app/
    (public)/        landing, /welcome, /onboarding (4-step incl. pedagogy wizard), sign-in/up, /privacy, /terms
    (auth)/          Clerk-protected family surfaces:
                       /dashboard, /log (Logger), /planner, /settings, /notifications
                       /our-story{,/portfolio,/report,/capabilities,/learner/[id]}
                       /explore/{activities,marketplace}, /library, /pack/[id]
                       /build/{modules,badges}, /badges/assess/[id]
                       /module/[id] (runner: Prep → Facilitate → Log), /project/[id]
                       /hearths/[hearthId]{,/sessions/[sessionId]}, /hearths/join/[code], /invite
                       /constellation (vestigial scaffold, unlinked — see D12), /admin/tokens
    (admin)/admin/   ops dashboard, analytics, content QA, families, invitations, snapshots, audit log, feedback
    api/             136 route files (see Runtime & Entry Points)
    demo/, dev-preview/   Clerk-free mock-data copies of the main screens (demo = static flows; dev-preview = design review)
    offline/         service-worker fallback page (no Clerk, no network)
    studio/          Sanity Studio
    .well-known/     Apple AASA + Android assetlinks (env-gated, for native universal links)
  components/
    nav/             5-tab mobile bottom nav; navConfig.ts is the single source of truth
    logger/, log/    PostSaveSurface, insights rail, voice, evidence
    planner/         PlannerGrid (drag), MoveSheet (touch picker), BottomSheet catalog
    report/, pack/, module/, hearth/, pedagogy/ (PedagogyWizard + data), settings/, dashboard/
    ui/              primitives incl. LearnerAvatar (LEARNER_COLOUR_MAP — the only child-colour map)
    icons/           curated Phosphor re-export (~140) + IconProvider
    platform/        NativeProvider / useIsNative (Capacitor detection, resolved once per request)
  lib/
    ai/              enrich.ts (the write-time pipeline), snapshot-rebuild.ts (Family Intelligence Snapshot),
                     dlo-persistence.ts, thread-links.ts, draft-insight.ts, annotation-draft.ts,
                     hearth-narrative.ts, pedagogy-context.ts, enrich-module.ts (builder drafts)
    logger/          entry-payload, badge-check, enrichment-poll, draft, completeness, outbox (IndexedDB offline queue), coaching/
    report/          deterministic-coverage.ts (DLO status × regulatory mapping → coverage), coverage, export-slots, staleness
    pedagogy/        adapter.ts (lens vocabulary), retrieval/embedding/chunk-builder (PKB engine), corpus/ (vault compiler)
    sanity/          client, queries (GROQ, all gated on status == "published"), mutations, helpers, read-allowlist
    db/              schema.ts (41 tables), index.ts (lazy Neon client, ConfigError)
    module-builder/  types, normalize, publish-payload, session-templates
    platform/native.ts, crypto/field-encryption.ts (AES-GCM facilitator notes), stripe/client.ts
    api-helpers.ts   routeHandler wrapper + authenticatedFamily + parseBody — every route must use it (CI-enforced)
    rate-limit.ts    in-process limiter (Redis plan exists, not triggered)
    capability-universe-v2.ts, capability-alpha-suppression.ts (H6 First Nations thread held back)
  sanity/schemas/    31 document types (see Domain Model)
  config/            jurisdictions.ts (all 8 states/territories), ai-pricing.ts
  hooks/             use-theme, use-logger-*, use-speech-recognition, use-audio-transcription, use-online-status, use-focus-trap…
  test/              clerk-helpers (asUser/asSignedOut/asEditor/asViewer/asOtherFamily), factories, db-factories, integration-db, db-test-shim
corpus/pedagogy/     PKB authoring vault: one .md = one Sanity doc; sources.json is the licence registry (28 sources)
docs/                87 docs + archive/ + audits/ (the planning record — see Where To Look)
prototypes/          27 HTML/JSX prototypes (visual reference only)
scripts/             ~45 operator scripts: seeds, backfills, verifiers, CI guards, corpus compiler
drizzle/             SQL migrations 0000–0029 + meta journal
e2e/                 3 Playwright specs (critical flows, co-facilitator, offline PWA)
.claude/plans/       pharao plan + status JSON files (PKB completion program is the live one: 5/87 tasks done)
.codex/, AGENTS.md, GEMINI.md   secondary-agent guidance (Codex is support-mode only; must not edit CLAUDE.md or .claude/)
```

### How an action moves through the system

**The heartbeat — a Logger save.** `/log` is a composition root over `useLoggerDraft`, `useLearnersFetch`, `useScaffoldFetch`, `useKeywordMatch`, `useCoachHints`, `useCompletenessUi`. While typing, client-side keyword matching (no LLM) drives the live insights rail; a debounced Haiku "draft insight" call exists behind `DRAFT_INSIGHTS_ENABLED`. On save, `buildEntrySavePayload` → `POST /api/entries` → row in `learning_entries` (one entry, per-learner engagement/discoveries keyed by learner id) → `enrichEntry()` in `src/lib/ai/enrich.ts` assembles context (family profile, pedagogy lens, snapshot signals, optional PKB retrieval), makes **one Haiku call** (Sonnet fallback on truncation), validates, persists subject/thread/DLO links (`dlo-persistence.ts`: declared opportunities from completed targeted runs, corroboration promotes them to observed), then `rebuildSnapshot()` recomputes the `family_intelligence_snapshots` row (per-child thread tiers derived from observed DLO evidence only, recommendations, momentum, gaps) and runs badge threshold checks and notification triggers. The client polls `/api/entries/[id]/enrich` and renders the PostSaveSurface. If offline, the save goes to an IndexedDB outbox and replays on reconnect.

**Everything else reads the snapshot.** Dashboard, Our Story hub, Constellation, Portfolio (a filtered view of entries — no separate store), Planner "suggested next", Library status board, and the Report all read Postgres + snapshot; content they display comes from Sanity via GROQ (`src/lib/sanity/queries.ts`), always filtered `status == "published"` — a CI script fails the build if a query forgets.

**Reporting.** `/our-story/report` builds a `compliance_reports` row per learner per period; `deterministic-coverage.ts` crosses `learner_dlo_status` with Sanity `regulatoryFramework` mappings (`ac-v9-qld` tranche 1 authored, ~17 of 57 threads) to produce coverage; two scoped runtime Haiku touchpoints (work-sample annotation drafts, progression summaries) have edit-protection; PDF structure switches on the jurisdiction's `reportTier` (`cd_level` vs `learning_area`).

**Content flows in two ways.** Parents: Module Builder → `POST /api/modules/publish` (auto-sets `authorFamilyId`, Haiku-enriched drafts in `module_drafts`). Editors: Sanity Studio directly, or the external **kindling** repo's orchestrator (a sibling checkout on Drew's machine, detached from this repo 2026-05-31) writing deterministic-ID documents.

**Community.** Hearths (multi-family groups) have sessions, RSVP, evidence, suggested observations that fan out to member families' loggers via `source_session_id`, reflections, and an AI term narrative cached in hearth settings.

---

## Domain Model & Data Layer

### Postgres (41 Drizzle tables, `src/lib/db/schema.ts`) — "life", never portable content

| Group | Tables | Notes |
|---|---|---|
| Identity | `families` (clerkUserId, familyName, onboardingComplete, welcomeCompletedAt, **loggerDefaultMode**), `learners` (name, DOB, shapeIcon, colourToken, profileData JSONB incl. tierOverrides), `family_settings`, `family_members` (co-facilitators: owner/editor/viewer) | Children are abstract shapes + colours, no photos by default. |
| Learning record | `learning_entries` (title, description, dateOccurred, subjects, learnerIds, engagement/discoveries per learner, evidenceUrls, source{Module,Activity,Approach,Project,Stage,Session}Ids, moduleRunId, plannerEntryId, observationDetails, aiEnrichment JSONB, workSampleCandidate/Quality, threadLinks), `learning_entry_evidence` (photo/quote/note/link), `logger_drafts` (cross-device mirror, 7-day TTL), `module_runs` (live since July: open/touch/finish) | Entry = one row for a multi-child moment. |
| Intelligence | `family_intelligence_snapshots`, `ai_pipeline_logs` (tokens, latency, model_used, confidence) | Snapshot shape: per-child thread tiers, `recommendations: {suggested_next, subject_balance}`, momentum, gaps. |
| Capability universe v2 | `learner_dlo_status`, `observation_dlo_links` (provenance: inferred / declared / asserted / observed; claimed_tier), `custom_threads`, `library_upgrade_events` | 15 domains × 57 threads × 171 DLOs are **Sanity** docs; Postgres holds per-learner state. |
| Badges | `badge_definitions`, `badge_awards`, `badge_assessment_logs` | Parent-controlled assessment queue; defer/retract. |
| Planning & library | `planner_entries`, `family_library`, `family_library_state`, `family_pack_state`, `module_drafts` | Library soft-delete; status board derives in_flight/abandoned from `module_runs`. |
| Compliance | `compliance_reports`, `work_samples`, `work_sample_annotations`, `facilitator_notes` (AES-256-GCM encrypted, excluded from exports and AI) | |
| Commerce | `entitlements` (UNIQUE family+pack, UNIQUE stripe_session_id) | Written by the Stripe webhook. |
| Community | `hearths`, `hearth_memberships`, `hearth_sessions`, `session_attendance`, `session_evidence`, `suggested_observations`, `session_reflections`, `hearth_invites` | `hearths.created_by_family_id` NOT NULL — the crux of the account-deletion defect. |
| Platform | `notifications`, `provider_codes`, `invitations` (beta codes), `admin_audit_log`, `feedback`, `device_tokens` (push registration, 2026-08-10; no sender yet) | |

Schema hygiene is enforced: `scripts/check-schema-vs-migrations.mjs` (every `pgTable` has a CREATE TABLE in the chain) and `db:check-drift` run in CI. All 27 foreign keys into `families` are `ON DELETE no action` — the deletion route therefore 500s (see D13).

### Sanity (31 schemas, `src/sanity/schemas/`) — "what families can learn", never user data

- **Content hierarchy:** `pack` → `module` → `approach` → `activity` (+ `kit` for physical kits with prices, `asset`, `commonsText` with read-aloud audio, `moduleSkeleton`, `bannedPhraseSet`, `strand`, `prerequisiteEdge`, `practice`). Activities carry `capabilityTargets: [{thread, tier}]` (the "declared contract") and optional `workbench` flags.
- **Projects:** `project`, `projectStage` (sequential multi-stage builds — see D4).
- **Capability universe:** `capabilityDomain`, `capabilityThread`, `discreteLearningObjective`, `atomicCapability`, `regulatoryFramework` (DLO→AC9 mappings per jurisdiction).
- **Badges:** `badge`.
- **Pedagogy:** `pedagogicalFramework`, `pedagogyLensBundle` (per module per pedagogy), `methodologyOverlay` + `lensSurfaceMap`, `pedagogyOverlay`, and the 6-layer PKB: `pedagogySourceExcerpt`, `pedagogyPracticePattern`, `pedagogyObservationalMarker`, `pedagogyFacilitationVocabulary`, `pedagogyContraindication`, `pedagogyWorkedExample` (each now carrying retrieval metadata: ageRange, capabilityThreads, activityType, tags).
- Content seeded on prod per status doc: Starter Pack (121 docs, 79 activities); three further sample packs exist as drafts; 171 DLO docs seeded 2026-05-23. Whether Starter Pack activities carry `capabilityTargets` on prod is **not determinable from the repo** (the handoff doc flags it as an open prod-data question).

### Schema work in flight
- Branch `claude/constellation-value-pass` (PR #288) adds "four DLO states, parent confirmations as moments, recency + trajectory" — 70 files, 9 in `src/lib/ai`; not yet inspected for migrations in this capture.
- `feat/site-copy-sanity` (PR #284) adds a `siteCopy` Sanity schema and `src/lib/copy/` to move static web copy into Sanity.

---

## Runtime & Entry Points

**Boot:** `src/app/layout.tsx` (root) runs the inline theme flash-prevention script, mounts `ClerkThemeProvider`, `IconProvider`, `NativeProvider` (native verdict resolved server-side once per request), `ServiceWorkerRegistrar` (production only; `NEXT_PUBLIC_DISABLE_SW=1` kill switch). `src/proxy.ts` is the Clerk middleware; public matcher covers `/`, onboarding, sign-in/up, `/admin(.*)` (admin layout re-checks `isAdmin`), `/studio`, `/demo`, `/dev-preview`, `/offline`, `/.well-known`, and the self-authenticating webhooks.

**Scripts that matter** (`package.json`):

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Standard Next. `build` on Vercel is preceded by `db:migrate:deploy`. |
| `npm test` (= `test:unit`) | Vitest jsdom, `*.test.ts(x)`, everything external mocked via `vitest.setup.ts`. |
| `npm run test:integration:local` | Spins `pgvector/pgvector:pg16` in Docker, migrates, runs `*.integration.test.ts` under transaction-rollback isolation. `test:integration` = Neon ephemeral branch variant. |
| `npm run test:e2e` | Playwright; **not in CI** (decision M, April). Offline spec needs a production server. |
| `npm run lint` / `npx tsc --noEmit` | Lint is a required CI check (0 errors since 2026-05-25). |
| `db:migrate`, `db:check-drift`, `db:check-schema`, `db:encrypt-notes` | Drizzle ops + one-off facilitator-notes backfill. |
| `check:route-handlers`, `check:sanity-gating` | CI guards: every API route uses `routeHandler`; every GROQ query gates on published. |
| `corpus:check` / `corpus:review` / `corpus:confirm` / `seed:pedagogy:corpus` / `seed:pedagogy:reembed` / `verify:pkb` | PKB vault compile → Sanity → Voyage embeddings pipeline. |
| `seed:packs`, `promote:packs`, `audit:published-packs`, `audit:content-readiness`, `generate:audio`, `verify:sanity` | Content ops. |
| Unscripted but important: `scripts/apply-capability-targets.ts`, `verify-starter-targets.mjs`, `seed-dlo-mappings*.{ts,mjs}`, `seed-dlos.ts`, `eval-dlo-mapping.mjs`, `verify-opportunity-loop.mjs`, `audit-stale-branches.mjs`, `generate-app-icons.mjs` | Outcomes-spine content + verification. |

**CI** (`.github/workflows/test.yml`): two jobs on PR and push to main — `checks` (npm ci, lint, tsc, schema-vs-migrations, route-handler guard, Sanity-gating guard, unit tests + coverage artifact) and `integration` (Postgres service container, `drizzle-kit migrate`, integration suite). Node 24 from `.nvmrc`.

**API surface (136 route files)** by domain: entries (+ `/enrich`, `/draft-insight`, `/import`, `/complete`), learners (+ encrypted facilitator notes), capabilities (`/[learnerId]`, `/dlo-evidence`, `/dlo/[dloId]/confirm`, `/override`), badges (award/defer/retract/history/check-thresholds), planner, notifications, dashboard + snapshot sub-views (`/snapshot/{freshness,gaps,momentum,next,zero-state,trajectory/[learnerId]}`), family + members + invite, settings, modules (`/drafts`, `/drafts/[id]`, `/publish`, `/[id]/detail`), module-runs, library (`/status`, `/modules`, `/materials`), marketplace search, entitlements + family-pack-state, evidence (+ upload), report (`/[reportId]`, `/samples`, `/samples/[sampleId]/draft`, `/progression`, `/coverage`, `/export`), portfolio export, print bundle, commons render, assets download, stripe (checkout, webhook), transcribe (Deepgram), logger (draft, coach-hints), scaffolds + observations (hearth fan-out), hearths (16 routes), onboarding/welcome complete, invitations validate/redeem, provider-code validate, pedagogy (retrieve with bearer secret, sanity-webhook), revalidate/sanity, sanity/read (authed proxy for dark dotted-id reads), seed/*, skeletons, device-tokens, account export/delete, feedback, and ~25 admin routes (analytics incl. ai-cost, dlo-integrity, tier-comparison; families; invitations; snapshots; QA; retention cron; audit log; ops summary; tokens).

**Environment variables (names only; see `.env.example`):** `DATABASE_URL`, `FACILITATOR_NOTES_ENCRYPTION_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`, `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN`, `SANITY_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`, `DRAFT_INSIGHTS_ENABLED`, `VOYAGE_API_KEY`, `PEDAGOGY_KB_ENABLED`, `PEDAGOGY_RETRIEVAL_SECRET`, `DEEPGRAM_API_KEY` (+ `DEEPGRAM_STT_MODEL`, `DEEPGRAM_STT_LANGUAGE`, `DEEPGRAM_TTS_MODEL`), `BLOB_READ_WRITE_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`, `ADMIN_CLERK_IDS`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `NOISY_FAMILY_TOKEN_THRESHOLD`, `NEXT_PUBLIC_DISABLE_SW`, `APPLE_TEAM_ID`, `ANDROID_CERT_SHA256`; test-only: `NEON_TEST_BRANCH_ID`, `NEON_BRANCH_NAME`, `ENRICH_TAPE`, `HEARTH_TEST_TIMING`.

---

## Current State

Grounded in `PROJECT_STATUS.md` (last updated 2026-08-06) cross-checked against code at `cb830cd`. "Shipped" below means real logic behind the route with tests; shells are called out.

### Shipped and real (on `main`)
- **Onboarding** (`/welcome` → `/onboarding`: family name pre-filled from Clerk, children, state/territory, 4-step pedagogy wizard with localStorage draft) → Dashboard.
- **Logger** — two-tier (Quick Log default, Full Log opt-in), sections decomposed into `_components/`, voice via server-side Deepgram STT, photo/quote/note/link evidence, cross-device drafts, offline banner + IndexedDB outbox replay, post-save surface with enrichment polling and honest failure/retry states. `page.tsx` is still 1,108 lines (CLAUDE.md calls it a "thin composition root"; it is thinner than the 1,566-line original, not thin).
- **Enrichment → snapshot pipeline** — Haiku with Sonnet fallback, keyword fallback when AI unavailable, DLO links with provenance, incremental snapshot rebuild on library change, Sentry capture on rebuild failure, noisy-family detection cron.
- **Our Story**: hub, Portfolio (journey/milestone cards, audio player, mis-tag correction), Capabilities Constellation (L1–L3 drill-down to DLOs with "From {module}" provenance, tier override API, H6 suppressed), Learner Profile, **Report** (persisted slots, "edited since export" pill, deterministic coverage, PDF export per jurisdiction tier).
- **Explore**: Activity Discovery, Marketplace (packs + standalone modules, search, Pack Indicators for printables/materials, kit prices), Pack detail with entitlement-aware CTA, Library with status board, soft-delete/restore, suggested-next.
- **Module runner** `/module/[id]` — Prep → Facilitate (session timer, QuickCapture photo) → Log mode with repeat-attempt prompt shifts; `module_runs` persisted; planner cards open the runner with provenance.
- **Module Builder** `/build/modules` — five pathways (`material | process | inquiry | retrospective | understanding`, the last labelled "Goal-Forward"); publish is pre-validated and awaited since #280 (6 Aug); resumable drafts with Haiku-filled suggestions. Known follow-ups: `watchFor`/`pivot` have no home in the Sanity module; capability picker lists 12 of 57 threads.
- **Badge Creator** `/build/badges` (real form, POSTs to `/api/badges`) and **Badge Assessment** queue.
- **Weekly Planner** — week grid keyed by local date, drag on desktop, touch "Move to…" picker, catalog bottom sheet, subject balance.
- **Hearths (community)** — groups, invites/join codes, sessions, RSVP, evidence, cross-family suggested observations into member loggers, reflections, AI term narrative. Shipped 2026-04-03. Facilitator *capture UI* (quick-capture during sessions, attendance marking) is API-only — UI deferred.
- **Settings** — family, children, co-facilitators (owner/editor/viewer), pedagogy re-run, jurisdiction, account export, account delete (UI exists; route broken — see D13), in-app feedback entry.
- **Notifications** — in-app centre with tiers, triggers (badge ready, module nudge after 10 retro entries, recommendations-refreshed notice), quiet-day cooldowns. No push *delivery* yet (registration endpoint only).
- **Admin** `(admin)/admin/*` — all eight pages are tiny server shells that mount a real `*Client.tsx` (the "<400 bytes" scan hits are false positives). Analytics (thread coverage, abandonment, activity heat, pack adoption, AI cost with model-aware pricing, tier comparison, DLO integrity), Content QA (read-only, non-gating), families (search/view/snapshot rebuild), beta invitations, snapshot health, audit log, feedback inbox.
- **Commerce** — Stripe hosted Checkout + signed webhook writing `entitlements`; premium packs "barely live"; native builds show no purchase affordance and the checkout route 403s native UAs before auth.
- **Privacy/compliance plumbing** — private blobs, encrypted facilitator notes, account export, PostHog hashed ids, privacy + terms pages.
- **PWA Phase 1** — hand-rolled `public/sw.js`, `/offline` route, app icons regenerated; navigations deliberately not cached.
- **Design system v2 + v2.1**, Phosphor icons, dual theme, motion utilities, WCAG-AA-adjacent contrast; 5-tab trayed mobile nav.

### In progress / partial
- **Outcomes spine** (declared targets → opportunity → corroboration → tier → transposer): code-complete and wired on the save path per the 2026-08-01 handoff, but **unproven with real content**. Transposer mapping content is QLD tranche-1 only (~17/57 threads); tranche-2 QLD + NSW demo seed scripts exist and wait on Drew's publish gate (`D-publish`). WS-3 "needs a fresh verify pass". D-OS5 post-run "saw it" tap not built, decision open. Tier rubric copy held (D12).
- **Pedagogy Knowledge Base** — engine (retrieval, Voyage embeddings, webhook, enrichment integration, eclectic multi-lens with tension surfacing, all six layers rendered in Logger attribution) shipped and **flag-gated off** (`PEDAGOGY_KB_ENABLED`). Corpus vault on `main`: Charlotte Mason 45 (human-confirmed), Unschooling 24 (template, awaiting review), Montessori 18 (pt2 survivors; pt1 lost), Classical 0, Waldorf/Steiner 0. PKB completion program: 5 of 87 tasks done on `main`. PR #287 (today) adds Montessori pt1 rebuild, Classical, Waldorf and Unschooling W5 calibration batches.
- **Native pivot** — Phase 1 (offline/PWA) and 2a (native detection + commerce strip) merged; Phase 2b (Capacitor scaffold) staged on PR #281 and **blocked on Drew's machine** (no Xcode/CocoaPods/JDK); Phase 3 (push, camera, biometrics) only has `device_tokens` registration; Phase 4 store compliance has the open deletion defect as a hard blocker.
- **Jurisdiction decoupling** — config covers all 8 states; "HEU stragglers" remain (`compliance_status` snapshot key, jurisdiction-aware annotation prompt, residual copy).
- **Editorial content** — three sample packs (`First Term Foundations`, `Outdoor Naturalist`, `Storytellers`) still draft; AC mapping pending.
- **Pilot** — production live, ops runbooks and onboarding packet exist, but no captured family profiles and no family-sourced research-log entries. Journey-stage instrumentation beyond Stage 2 is deliberately deferred until families reach those stages.

### Stubbed / vestigial / untouched
- `/constellation` — 155-line unlinked scaffold for a pedagogy-weighted thread list; kept deliberately (parked decision D-sidebar-2).
- `/dev-preview/log` is explicitly a placeholder ("requires API"); `demo/*` and `dev-preview/*` are mock-data mirrors, not product.
- Push notification *sending*, native camera, biometric lock — Phase 3, not started.
- Audio evidence capture (MediaRecorder), contextual log proposals, Sanity `sessionType`/`idleDaysBeforeAutoClose`/`previewActivityRef` fields — lost in the June refactor reset, catalogued for re-design, not re-landed.
- Learner-facing views, facilitator pedagogical dashboard, planner hearth-session card type — shelved (Phase 2+).
- Redis rate limiter — plan only; in-process limiter in use.

### In flight on branches (not on `main` — verify before planning against them)
| PR | Branch (base) | What it claims | Size |
|---|---|---|---|
| #284 draft (2026-10-06) | `feat/site-copy-sanity` (main) | Non-generative web copy moved into a Sanity `siteCopy` schema, `src/lib/copy/` | 26 files, +1,446 |
| #285 draft (2026-10-06) | `claude/insights-engine-pass` (main) | Cached narrative, snapshot-backed enrichment context, "Hearth noticed" dashboard feed | 21 files, +1,278 |
| #286 draft (2026-10-06) | `claude/pkb-logger-context` (stacked on #285) | Logger context persisted and fed to PKB retrieval as situational signals, webhook gate, E8 verifier | +2 commits |
| #288 draft (2026-10-06) | `claude/constellation-value-pass` (stacked on #286) | Four DLO states, parent confirmations rendered as moments, recency + trajectory, deep links, phone fallback | 70 files cumulative, +3,991 |
| #287 draft (2026-10-06) | `claude/corpus-calibration-batches` (main) | PKB corpus calibration batches (Montessori pt1 rebuild, Classical, Waldorf, Unschooling W5) | 56 files |
| #281 open (Aug–Sep) | `feat/native-capacitor-scaffold` (main) | `capacitor.config.ts`, `NATIVE_APP_ID`, shell pointed at canonical www origin | 7 files |
| #232/#233/#234 "DO NOT MERGE" (June) | copy/docs branches | Regulator PDF disclaimer, AI content label + care note, cultural/religious sourcing policy — all need Drew (and legal) | small |

Also on the remote: `recovery/*` branches from the June incident and `claude/pack-modules-docs-cleanup-bFdKV` (readiness audit + pack-level retract) — stale, no PR.

---

## Drift Register

**Anchor:** the earliest tracked intent is the 2026-03-25 doc batch seeded from the planning Project — `hearth-founding-brief-v1.md` (authored 2026-03-23; purpose/mission/values), the screen specs (`hearth-logger-spec-v1.md`, `hearth-marketplace-spec-v1.md`, `hearth-weekly-planner-spec-v1.md`, `hearth-notification-system-spec.md`, `hearth-portfolio-spec-v1.md`, `hearth-module-builder-pathways-architecture-v2.md`), `Hearth_System_Interaction_Map.md` (Feb 2026 draft), `hearth-hcms-strategy-v1.md` (2026-03-09), `hearth-canonical-design-tokens-v1.md`, and `PROJECT_STATUS.md` v1. Note the founding brief cites `Hearth_LMS_Brand_Guide.md`, `hearth_dashboard_design_decisions.md`, `Hearth_LMS_Design_Philosophy___Decision_Summary.md` and `hearth-starter-pack-plan-v2.md` — **none of those are in the repo**; they presumably live only in the Project's knowledge, so the repo cannot check drift against them.

### D1 · Product · Purchases went from "stubbed for MVP" to live Stripe, and the status doc never caught up — new (run #1)
Marketplace spec §7.2 (03-25): purchase stubbed for MVP (toast "Opening purchase flow…"), Stripe hosted Checkout post-MVP with a `purchases` table. Actual: stubbed 2026-04-06 (`636796c`), then real on 2026-05-24 — `stripe` SDK added (`227d54e`), checkout + webhook routes (`87f7adb`), `entitlements` table (`48b2777`, migration 0018) instead of `purchases`; no confirmation page, Stripe redirects straight back. `PROJECT_STATUS.md` "Known Gaps → Payment processing" still says *STUBBED, routes return 503, Stripe package removed* — contradicted by `package.json` and by its own August milestone describing the live checkout 403-ing native requests. Then the native pivot (D3) decided v1 native builds carry **no** digital purchase path at all (AU storefront mandates IAP). Why: premium packs were "barely live" and IAP wasn't worth it for v1.

### D2 · Product · Community ("Hearths") shipped in Phase 1 though planned for Phase 2 — new (run #1)
PROJECT_STATUS v1's shelved table listed co-ops/group modules/forums as Phase 2 (50–100 families). Shipped 2026-04-03 (`ea61e27`, 16 API routes) with sessions, scaffold fan-out, reflections, narrative, invites. Facilitator capture UI and planner hearth-session cards remain deferred. Consequence: `hearths.created_by_family_id NOT NULL` is now the reason account deletion needs a product decision (D13). The founding brief's "community forums / pedagogy wiki" remain unbuilt.

### D3 · Product · Native App Store / Play pivot — not in any March doc — new (run #1)
No March doc contemplates native apps; the notification spec explicitly scoped push as "Not MVP". Plan `hearth-native-app-plan-v1.md` approved 2026-08-03: Capacitor shell over the production web app. Shipped: Phase 1 offline/PWA (#277), Phase 2a native detection + commerce strip (#278), universal-link manifests (#283), `device_tokens` + registration endpoint (#282). Blocked: Phase 2b scaffold (PR #281) on local toolchain. Not started: push sending, camera, biometrics (Phase 3), store compliance (Phase 4, blocked by D13). Two rules now bind ordinary work: no digital purchases in native builds; the app must survive airplane mode.

### D4 · Product · Projects content type specced with six blueprints; surface built, content not determinable — new (run #1)
`hearth-project-design-specification.md` (03-26) specs `hearthProject`/`hearthProjectStage`, six project blueprints, five implementation phases. Code has `project` + `projectStage` Sanity schemas, `PROJECT_DETAIL_QUERY`, a 534-line `/project/[id]` experience, `sourceProjectId`/`sourceStageNumber` on entries, and a `demo/project` mock. Whether any published project exists in Sanity, and whether Phase 2 ("hand-craft first project") happened, is **not determinable from the repo**. The Interaction Map and nav don't route to project discovery; projects do not appear in the Marketplace spec.

### D5 · Product · QLD-only intent generalised to all eight jurisdictions — new (run #1)
Founding brief near-term vision: "Queensland families … HEU-compliant documentation". `PLAN-multi-state.md` (2026-04-06) moved the presentation layer to a static jurisdiction config (`src/config/jurisdictions.ts`, two report tiers). Landed; founding brief amended 2026-06-10 to generalise the compliance paragraph. Residual HEU-specific stragglers are priority #3 in PROJECT_STATUS. The pilot remains QLD-anchored.

### D6 · Product · Six pedagogies promised; PKB engine gated off, corpus covers three — new (run #1)
CLAUDE.md and the pedagogy engine spec name six traditions (Charlotte Mason, Classical, Montessori, Waldorf/Steiner, Unschooling, Eclectic) and the wizard offers them; the lens *adapter* (`src/lib/pedagogy/adapter.ts`) covers vocabulary for all. But the retrieval-augmented PKB is `PEDAGOGY_KB_ENABLED` off by default, and the licence-gated corpus on `main` has 0 Classical and 0 Waldorf entries (CM 45, Unschooling 24, Montessori 18). The PKB completion program is 5/87 tasks done; PR #287 (today) starts filling Classical/Waldorf. Unschooling operational layers are reserved for commissioned authors (PKB12/13). The architecture doc (2026-05-13) also reframed the whole layer as "interpretive, not prescriptive" — no branching modules, no forward task lists — which is narrower than the March engine spec's ambitions.

### D7 · Product · The pilot has no family evidence in the repo yet — new (run #1)
Target since the founding brief: 10–20 test families. Production is live and the onboarding packet, research log, feedback table and personas exist, but `hearth-pilot-personas-v1.md` §7 reads "none yet", and all 26 research-log entries are operator walkthroughs (R1–R6, April) or code audits (R9–R26). R7 is a meta-finding that the feedback channel captured zero feature/UX findings. The refactor post-mortem's entry criterion for the next structural pass (≥3 captured pilot profiles) is therefore unmet. A planning chat should not assume Stage 2+ journey signals exist.

### D8 · UX · Navigation: 6-item top nav specced, 5-tab trayed bottom nav shipped; its spec doc is missing — new (run #1)
Interaction Map Part 1 specs Home / Our Story / Explore / Log / Build / Settings. Shipped 2026-05-06: Home / Story / Log / **Plan** (tray: Badge Creator, Module Builder, Weekly Planner) / **Explore** (tray), Settings reached from the header. `docs/hearth-mobile-bottom-nav-spec-v1.md` is cited by CLAUDE.md and PROJECT_STATUS as the spec but **does not exist in the repo**; `navConfig.ts` is the only source of truth.

### D9 · UX · Logger: one structured workspace specced, a two-tier Logger with server-side voice shipped — new (run #1)
Logger spec v1 (03-25): single workspace, two-column with live insights, 50% completeness gate, Web Speech API voice (en-AU), per-child differentiation. Shipped divergences, each with a decision-log entry: post-save second screen (D-LPS-1…7, April–June); cross-device drafts (D-LPS-8); multi-child fan-out note (D-LPS-9); completeness ring reframed as readiness, not a grade (D-LPS-11, R14); voice moved to **server-side Deepgram STT** because Web Speech was Chrome/Edge-only on a mobile-first audience (D-LPS-12, R17, #228); and the **Quick Log default / Full Log opt-in** split after the operator found the Logger "crept back over the 5-minute promise" (D-LPS-13, R18, #238) — persisted as `families.loggerDefaultMode`. Audio capture and photo-offline queueing stay deferred (D-LPS-10).

### D10 · UX · Module Builder pathways: names and trust chain drifted — new (run #1)
Pathways architecture v2 (03-25) merged six paths into five with "Goal-Forward" (aspiration + capability modes); PROJECT_STATUS's decisions table still lists the older five names ("Understanding-First … Retrospective Lift"). Code: `Pathway = 'material' | 'process' | 'inquiry' | 'retrospective' | 'understanding'`, with `'understanding'` surfaced as "Goal-Forward". Until #280 (2026-08-06) the publish path silently failed whenever subjects were selected while showing "Module published", and drafts landed in a table no UI read — the builder's "nothing is lost" promise was false for months. Still open: `watchFor`/`pivot` have no Sanity home; capability picker shows 12/57 threads.

### D11 · UX · Planner: drag-and-drop specced; touch needed a separate picker — new (run #1)
Planner spec §4 is drag-and-drop. `PlannerGrid` implements drag, but on touch it wasn't usable, so a "Move to…" sheet was added 2026-08-01 (#275) and the remove button made reachable (#276); week columns are now keyed by local date (UTC bug). Planner cards open the runner with `plannerEntryId` provenance (#252). Undecided: whether finishing a run auto-completes the planner entry.

### D12 · UX · Constellation promises a growth bar the code doesn't enforce; H6 held back; vestigial scaffold — new (run #1)
`hearth-tier-rubric-drift-v1.md` (2026-06-21): the Constellation empty state promises threads "grow as evidence builds", but the tier bar the code enforces (`PRODUCTION_TIER_BAR`, observed-evidence-only, D-OS4 default "≥1 declared/asserted OR ≥2 inferred on distinct days") is not the bar a plain-language rubric would describe — rubric copy is held for Drew's decision. Separately, thread H6 "First Nations Australian Perspectives" is suppressed from all parent-facing reads during alpha pending cultural consultation (`capability-alpha-suppression.ts`, #249; evidence writes untouched). The original archived constellation spec is superseded by `hearth-constellation-architecture-v1.md` (2026-08-01). `/constellation` is an unlinked scaffold kept on purpose.

### D13 · UX · Account deletion is marked RESOLVED in status but 500s for most real families — new (run #1)
Interaction Map open question #14 "data deletion" is listed as resolved in PROJECT_STATUS. `hearth-account-deletion-defect-v1.md` (2026-08-05): all 27 FKs into `families` are `ON DELETE no action`, the route deletes 13 of 25 dependent tables, the Clerk user is never deleted, and evidence blobs are never removed (`del` appears nowhere). Pinned by `orphan-tables.integration.test.ts` via `it.fails`. Not fixed because `hearths.created_by_family_id NOT NULL` forces a product choice (delete the Hearth / transfer ownership / block deletion) that is Drew's. Blocks App Store / Play submission (Guideline 5.1.1(v)).

### D14 · Technical · Design system v1 → v2/v2.1 and Lucide → Phosphor — new (run #1)
Tokens v1 (03-25): Crimson Text + Inter, ember-tinted borders, ember card halos, v1 shadows. Superseded 2026-05-01 (#31): Fraunces (SOFT axis) + DM Sans, cream-tinted borders, no default card shadow, desaturated status palette, motion tokens, gathering theme (v2.1) with dark kept as default (a documented divergence from the addendum). Icons: spec S8 said Lucide; decision S14 chose Phosphor (#32). Older screen specs (e.g. marketplace spec "Crimson Text serif") are stale on typography; two token values deviate from v2 for WCAG AA (`--text-muted`, gathering `--text-inverse`).

### D15 · Technical · In-app editorial Content Studio built then retired; status doc still lists it — new (run #1)
Content Studio + `/api/admin/content/publish` with workbench soft-flags shipped 8 May (#37), retired 1 June (#117, migration 0021 drops `content_studio_drafts`). Editorial authoring moved to Sanity Studio at `/studio` (status doc's "Development Workflow" row still says `/admin`), guardrails ported into Sanity schemas, read-only Content QA survives. PROJECT_STATUS's API table and Postgres list still include `/api/admin/content/drafts|publish` and `contentStudioDrafts`. The kindling orchestrator lived in this repo (PR #30, 2026-05-01) and was detached to a sibling repo 2026-05-31 (#109).

### D16 · Technical · The June intelligence refactor: 35-task plan merged, broke the tree, reset and re-landed piecemeal — new (run #1)
~3 June a 6-phase refactor merged; 5 June main was reset to `39ece6b` (#144) and features re-landed as small green PRs (schema foundation, snapshot sub-views, pedagogy-aware recommend, library status board, marketplace search). Ghost `module_runs` schema (readers, no writers) was resolved in July (#251). Not re-landed: audio evidence capture, contextual log proposals, Sanity session-type fields, IndexedDB blob persistence. `hearth-refactor-postmortem-v1.md` binds the one-deliverable-per-PR pattern and sets entry criteria for any next structural pass — do not salvage the old plan.

### D17 · Technical · Repo self-description counts and paths trail the code — new (run #1)
CLAUDE.md / PROJECT_STATUS vs `main`: Sanity schemas **31** (docs say 19 / "4 + 15 supporting"); Drizzle tables **41** (docs say 38 and 40); API route files **136** (doc says 103); `src/components/layout/` is named in CLAUDE.md but does not exist (nav lives in `components/nav/`); AI pricing constants moved from the ai-cost route to `src/config/ai-pricing.ts`; README says `pnpm` but the lockfile is npm; `/log` is called a thin composition root at 1,108 lines. `COMPONENT_REGISTRY.md` was last verified 2026-06-10 "light pass".

### D18 · Technical · "No runtime AI" is now a principle with five scoped exceptions — new (run #1)
Architecture principle 4 (and CLAUDE.md still): LLM at write-time only, no runtime calls in UI. Code has deliberate, logged exceptions: debounced Haiku draft insights while typing (`/api/entries/draft-insight`, kill switch `DRAFT_INSIGHTS_ENABLED`, $3/month soft ceiling); Deepgram STT per voice clip (D-LPS-12); coach hints via a pluggable provider (retrieval default, Haiku scaffolded); report-time annotation drafts and progression summaries (reporting pipeline doc, with edit protection); Sonnet fallback inside enrichment. The inviolable rule has effectively become "one Haiku call per Logger save; everything else is gated, capped, or parent-initiated".

### D19 · Technical · Capability model rebuilt as "universe v2" + outcomes spine; code-complete, content-incomplete — new (run #1)
Archived March constellation/thread specs → v2 universe (2026-05-22: 15 domains, 57 threads, 171 DLOs in Sanity, `learner_dlo_status`), then the outcomes-spine plan (2026-06-11): declared `capabilityTargets` on activities (WS-6), opportunity-then-corroboration evidence (D-OS1), per-learner attribution (D-OS2), one progression model (WS-4), deterministic transposer (WS-5). The 2026-08-01 handoff verified every link is wired on the save path, but: targets may not be applied on prod Sanity (unknown), the loop has never been proven on a real Starter-Pack run, mapping breadth is ~17/57 threads, WS-3 needs re-verification, D-OS5 is undecided. PR #288 (today) extends the Constellation on top of this.

### D20 · Technical · Testing moved from "trust Vercel preview" to a four-layer CI contract — new (run #1)
April decisions: E2E skipped in CI (M), migrations gated manually (L). Since: Vitest unit + real-Postgres integration (transaction rollback, `src/test/db-test-shim.ts`), schema/migration drift checks, route-handler and Sanity-gating guards, deploy-time migrations (June), lint required (May). E2E still not in CI; mobile-profile e2e and multi-session auth are open coverage gaps per the research log matrix.

---

## Conventions & Patterns

- **Read before you build.** `CLAUDE.md`'s reference table is binding: tokens v2 + v2.1 addendum + motion system for any UI; reporting pipeline doc before `src/lib/report/`; outcomes-spine plan before capability work (cite a persona + journey stage in the PR); native plan before PWA/offline work; account-deletion defect doc before touching deletion; refactor post-mortem before proposing multi-phase work; test-pilot runbook before writing tests.
- **One deliverable per PR, green in the same PR** (post-mortem §4). No parallel merges of interdependent PRs. Commit messages `type(scope): summary`, e.g. `feat(logger): …`, `fix(native): …`, `docs(pkb): …`. PRs reference `R<n>` research-log entries and `D-*`/`C-*` decision IDs.
- **Every confirmed bug gets a regression test at the layer it breaks** (research log convention): unit (`*.test.ts(x)`, jsdom, everything mocked), integration (`*.integration.test.ts`, real Postgres, Clerk/Sanity/Anthropic mocked), or e2e. Never collapse the two Vitest configs. Use `@/test/clerk-helpers` (`asUser`, `asSignedOut`, `asEditor`, `asViewer`, `asOtherFamily`) — never hand-roll Clerk mocks; Clerk v7 is async (`mockResolvedValue`). Factories in `src/test/factories.ts` (pure) and `db-factories.ts` (insert). Update both when the schema changes.
- **API routes:** every `route.ts` wraps handlers in `routeHandler()` from `@/lib/api-helpers` (CI fails otherwise); use `authenticatedFamily({ rateLimitKey })` for family-scoped routes, `parseBody(request, zodSchema)` for JSON, `requireAdmin()` for admin, and return JSON on every error (the 2026-05-25 white-screen incident class). `src/lib/db` throws `ConfigError` lazily, never at import.
- **Sanity reads:** every runtime GROQ for pack/module/activity/approach/asset/commonsText/project filters `status == "published"` (CI guard; `count()` sub-expressions included). Dark dotted-id reads go through the authed `/api/sanity/read` proxy or `client-read.ts`. Writes use `src/lib/sanity/mutations.ts` + `helpers.ts` (`keyedRefs`, `blockText`, `autoSlug`).
- **Postgres vs Sanity:** never user data in Sanity, never portable content in Postgres. Portfolio is a filtered view of entries — no "add to portfolio". Curriculum codes are backend-only; parents see threads and plain-language descriptors.
- **Design rules (enforced in review):** ember = actions only; sage = growth only; default cards have no shadow; weight 700 only for the wordmark and greeting; serif (Fraunces) for what parents read, sans (DM Sans) for what they operate; radii 6/10/16/24 only; motion via `var(--motion-*)` / `var(--ease-*)` or `.hearth-*` utilities, never inline `cubic-bezier`; borders `border-border-subtle` default; `backdrop-modal` for modal backdrops; `text-text-inverse` on coloured backgrounds; icons only from `@/components/icons`; child colours only from `LEARNER_COLOUR_MAP`; mobile-first, `min-w-0` on flex columns that contain horizontal scrollers; `overflow-x: clip` guard stays.
- **Theme:** dark is the default (deliberate divergence from v2.1), auto-switch to gathering 6am–6pm, `useTheme()` + the inline flash script own it; Clerk gets a hardcoded palette from `clerk-theme.ts`.
- **Copy voice:** first-person gentle friend; no freemium language; no judgement of sparse logging; "practices" in UI where the architecture says "methodology"; no AI tells (a June "strip AI tells" pass).
- **Logger architecture:** `/log/page.tsx` orchestrates; state in `src/hooks/use-logger-*`; pure save/derivation logic in `src/lib/logger/` (tested); sections in `log/_components/`.
- **Pedagogy:** interpretive not prescriptive (C-PA1…C-PA5). Exactly one Haiku call per Logger save; PKB work never adds an LLM call. Copyright is a lookup in `corpus/pedagogy/sources.json`, never a debate. Workers never set `suggestedDraft: false`.
- **Docs discipline:** `PROJECT_STATUS.md` updated in the same PR or the claim carries a "trails reality" caveat; research log and decisions log are append-only; `hearth-local-runs-v1.md` is where cloud sessions hand browser/credential tasks to Drew instead of attempting them.
- **Agents:** Claude Code is the author; Codex (`AGENTS.md`, `.codex/`) is support-mode only and must not edit `CLAUDE.md` or `.claude/`; pharao plans in `.claude/plans/` route tasks by model label (`[HAIKU]`/`[SONNET]`/`[OPUS]`/`[DREW]`).

---

## Open Threads

**Decisions waiting on Drew (block dependent work)**
- Account deletion: delete / transfer / block when a deleting family owns a Hearth (`hearth-account-deletion-defect-v1.md` §3). Blocks store submission.
- D-OS5: build the post-run "saw it" corroboration tap behind a flag, or validate with a family first.
- Tier rubric: which "what moves a thread" bar is canonical (`hearth-tier-rubric-drift-v1.md`).
- `D-publish`: publish tranche-2 QLD + NSW-demo DLO mappings to prod Sanity; mapping breadth target (pilot-logged threads vs full 171).
- Whether `apply-capability-targets.ts` has been run against prod (prod-data question; T1 of the fortnight handoff).
- Planner-entry auto-complete on run finish; keep or delete `/constellation`; annotation optimistic locking (parked).
- The three June "DO NOT MERGE" PRs: regulator PDF disclaimer (#232, needs legal), AI content label + care note (#233), cultural/religious sourcing policy (#234).
- H6 First Nations thread: cultural consultation before un-suppressing.

**Native pivot**
- Phase 2b scaffold needs Xcode + CocoaPods + JDK/Android SDK on Drew's machine (PR #281 staged). Apple sign-in / Clerk social connection work rides with it.
- Phase 3: push sender (APNs/FCM) over `device_tokens`; camera; biometric lock. Offline photo evidence deliberately not queued.
- Phase 4: Apple 5.1.1(v) deletion compliance is blocked by D13.

**Outcomes spine / content**
- Prove the declared loop end-to-end on a real Starter-Pack run (never done). WS-3 re-verification. Three sample packs still draft with AC mapping pending. `hearth-capability-dlo-reference.md` regenerate after mapping changes.
- Builder: `watchFor`/`pivot` homes in Sanity; capability picker to 57 threads.

**PKB**
- 82 of 87 program tasks pending on `main`: corpus waves W1–W5 with Drew's calibration "go" gates, Montessori pt1 rebuild, persist pedagogy sources → `PedagogyAttribution`, Layer-5 lens signals (C-PL6 spec exists), then the ops flag-flip sequence in the vault architecture doc §5. PR #287 and #286 move several of these.

**Hygiene / docs**
- Refresh counts and stale rows in `PROJECT_STATUS.md` (Stripe, Content Studio, `/admin` Studio path, table/schema/route counts) and `CLAUDE.md` (schema count, `components/layout`, pricing location, missing nav spec doc, runtime-AI exceptions). Restore or re-point `hearth-mobile-bottom-nav-spec-v1.md`. README `pnpm` → `npm`.
- Research-log coverage gaps still open: mobile-profile e2e, multi-session auth e2e, analytics payload fidelity, device-level offline verification.
- Only two code markers in the tree (`portfolio/page.tsx` BUG-04 note, `dlo-regulatory-mappings.ts` resolved prefix-map note) — TODO debt is low.
- Ops cadence items: Neon PITR restore drill, quarterly `SANITY_API_TOKEN` rotation, Redis limiter only on trigger conditions.

---

## Where To Look

- Project status and priorities → `docs/PROJECT_STATUS.md` (then `git log`, which wins)
- Why Hearth exists, values, who it is not for → `docs/hearth-founding-brief-v1.md`
- Who it serves and the journey stages → `docs/hearth-pilot-personas-v1.md`, `docs/hearth-parent-journey-v1.md`
- Every pilot finding and its regression test → `docs/hearth-research-log.md`
- Every decision ID (S14, C-PL1, C-PA1–5, D-LPS-1–13, PR-1) → `docs/hearth-decisions-log-v1.md`
- The next fortnight's plan (outcomes spine T1–T3) → `docs/hearth-next-fortnight-handoff-v1.md`; strategic arc → `docs/hearth-outcomes-spine-plan-v1.md`
- Native app plan and blockers → `docs/hearth-native-app-plan-v1.md`
- Account deletion defect → `docs/hearth-account-deletion-defect-v1.md`
- Refactor incident and the binding re-land pattern → `docs/hearth-refactor-postmortem-v1.md`
- Build rules for agents → `CLAUDE.md` (primary), `AGENTS.md` (Codex), `GEMINI.md`
- Design tokens → `docs/hearth-canonical-design-tokens-v2.md`, `docs/hearth-design-system-v2.1-addendum.md`, `docs/hearth-motion-system-v1.md`, `docs/hearth-icon-system-v1.md`; implementation `src/app/globals.css`, `src/app/hearth-motion-utilities.css`
- Screen inventory → `docs/COMPONENT_REGISTRY.md`, `docs/SITEMAP.md`; cross-screen flows → `docs/Hearth_System_Interaction_Map.md`
- Postgres schema → `src/lib/db/schema.ts`; migrations `drizzle/`; snapshot recovery `docs/drizzle-snapshot-recovery.md`
- Sanity schemas → `src/sanity/schemas/index.ts`; GROQ → `src/lib/sanity/queries.ts`; writes → `src/lib/sanity/mutations.ts`; content hierarchy → `docs/hearth-pack-data-architecture-v1.md`; Sanity vs Postgres boundary → `docs/hearth-data-architecture-overview-v1.md`, `docs/hearth-hcms-strategy-v1.md`
- Enrichment pipeline → `src/lib/ai/enrich.ts`, `src/lib/ai/snapshot-rebuild.ts`, `src/lib/ai/dlo-persistence.ts`; architecture `docs/Hearth_AI_Intelligence_Layer_Architecture.md`
- Capability universe and DLOs → `src/lib/capability-universe-v2.ts`, `src/types/capability-universe.ts`, `docs/hearth-capability-dlo-reference.md`, `docs/hearth-capability-universe-v2-architecture-spec-v1.md`, `docs/hearth-constellation-architecture-v1.md`
- Reporting → `docs/hearth-reporting-pipeline-v1.md`, `src/lib/report/deterministic-coverage.ts`, `src/app/api/report/*`
- Logger → `src/app/(auth)/log/page.tsx`, `src/hooks/use-logger-*`, `src/lib/logger/`; specs `docs/hearth-logger-spec-v1.md`, `docs/hearth-logger-short-mode-spec-v1.md`, `docs/hearth-ux-use-cases-logger-portfolio-capabilities-v1.md`
- Module runner → `src/app/(auth)/module/[id]/_components/`; builder → `src/app/(auth)/build/modules/page.tsx`, `src/lib/module-builder/`; pathways `docs/hearth-module-builder-pathways-architecture-v2.md`
- Pedagogy system → `docs/hearth-pedagogy-system-architecture-v1.md` (map), `src/lib/pedagogy/`, `src/components/pedagogy/`, corpus `corpus/pedagogy/README.md`, `docs/hearth-pedagogy-corpus-vault-architecture-v1.md`, program `.claude/plans/PLAN-pkb-completion.md` + `status-pkb-completion.json`
- Jurisdictions → `src/config/jurisdictions.ts`, `.claude/plans/PLAN-multi-state.md`
- Mobile nav → `src/components/nav/navConfig.ts`
- Native/offline → `src/lib/platform/native.ts`, `src/components/platform/`, `public/sw.js`, `src/lib/logger/outbox.ts`, `e2e/offline-pwa.spec.ts`
- Auth + admin → `src/proxy.ts`, `src/lib/auth/`, `src/lib/admin/`
- API conventions → `src/lib/api-helpers.ts`, `scripts/check-route-handlers.mjs`, `scripts/check-sanity-gating.mjs`
- Testing → `docs/test-pilot-runbook.md`, `vitest.setup.ts`, `vitest.integration.setup.ts`, `src/test/`
- Ops → `docs/deployment-runbook.md`, `docs/incident-runbook.md`, `docs/oncall-cheatsheet.md`, `docs/external-services-guide.md`, `docs/hearth-local-runs-v1.md`, `docs/branch-hygiene.md`
- Env vars → `.env.example`
- Prototypes (visual reference only) → `prototypes/`

---

## Suggested Re-Entry Prompt

> "You've got the full context for Hearth in the Project knowledge (handback run #1, HEAD `cb830cd`, 2026-10-06). `main` is at the August native-pivot work; five stacked draft PRs (#284–#288) landed today on the insights engine, PKB logger context, Constellation DLO states and site copy in Sanity, and PR #281 stages the Capacitor shell. The pilot has no captured family evidence yet. The three decisions blocking the most work are account-deletion semantics for Hearth owners (blocks store submission), the D-OS5 post-run corroboration tap, and the tier-rubric bar. Help me think through {next thing}, citing the persona and journey stage it serves and respecting the one-deliverable-per-PR rule."

---

## Handback Log
- run #1 · 2026-10-06 · HEAD `cb830cd` · initial capture (full history fetched; repo was a shallow clone — chronology now from git). 20 drift items opened across product (7), UX (6), technical (7). Six unmerged branches / nine open PRs noted as in-flight.
