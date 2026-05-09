# Hearth LMS — Project Status

> **Purpose:** Current state, priorities, and strategic context. Read this first before any new work.
> **Companion files:** `Hearth_System_Interaction_Map.md` for cross-screen coherence. `hearth-canonical-design-tokens-v2.md` + `hearth-design-system-v2.1-addendum.md` for design values. `production-readiness-tracker.md` for the disposable 30-step alpha pilot path.
> **Last updated:** 9 May 2026

---

## Current Phase: Alpha Pilot Path (20 / 30 done)

**Build progress:** Next.js 16 app fully implemented — 33 auth-protected pages (incl. admin + dev-preview, 68 page routes overall), 103 API route files, 30 Drizzle tables, **19 Sanity schemas** (4 content types + projects + badges + capability threads + 7-doc pedagogy knowledge base + assets / commons text / module skeletons), AI enrichment + snapshot pipeline operational. Community (Hearth) feature complete. Admin panel with analytics, content management, QA tools, invitation management, audit logging, and an editorial workbench publish path.
**Design system:** v2 + v2.1 token system **landed in code** 2026-05-01 (Fraunces + DM Sans, desaturated status palette, cream-tinted borders, motion tokens, gathering theme via `[data-theme]`). Phosphor icons adopted across all UI surfaces 2026-05-01.
**Mobile UX:** Trayed bottom nav shipped 2026-05-06 — 5 tabs (Home/Story/Log/Plan/Explore) with anchored vertical trays for Plan + Explore.
**Content:** Starter Pack seeded (121 Sanity docs, 79 activities). Three additional sample-pack drafts code-seeded (`First Term Foundations`, `Outdoor Naturalist`, `Storytellers`); editorial pass + AC mapping pending.
**Launch target:** 10-20 test families in Queensland, Australia.
**Founding Brief:** `hearth-founding-brief-v1.md` is the canonical purpose/mission/vision/values document.

### Recent Milestones (May 2026)

- **Editorial workbench publish validation** (shipped 8 May, PR #37, `2493d5e`) — Optional `workbench` on activity schema + `workbenches` on pack per `workbench-claude-code-addendum`. New `src/lib/content-studio/{types,factories,validation,sanity-transform}.ts` with Zod schemas and soft-flag helpers (id resolution, restrictive/duration/completion language, word cap). `/api/admin/content/publish` returns `workbenchFlags` (non-blocking). `/api/modules/publish` parent path unchanged.
- **Mobile bottom nav** (shipped 6 May, PR #36, `1ba1203`) — 5-tab nav with trayed Plan/Explore tabs in `src/components/nav/` (single-source-of-truth `navConfig.ts`). Staggered enter / uniform exit consuming `--motion-quick`/`--ease-default`. Focus management on tray open/close. `env(safe-area-inset-bottom)` handling.
- **Onboarding family-name pre-fill fix** (shipped 6 May, PR #35, `21bf522`) — Welcome and onboarding-complete routes derive `${user.lastName} Family` from Clerk and pass to `getOrCreateFamily`. Onboarding family-name input becomes an optional override that syncs from Clerk while untouched.
- **Stale-doc audit** (shipped 6 May, PR #34, `7e130fd`) — Archival banners on superseded v1 specs; `ui-kit-v2.md` flagged for deleted Crimson/Inter; `hearth-claude-code-transition-plan-v1.md` moved to `docs/archive/` (gitignored). All six pilot-issue "Open" items reconciled.
- **Phosphor icons across all UI** (shipped 1 May, PR #32, `64cd9df`, S14) — `@phosphor-icons/react` installed; `src/components/icons/index.tsx` (~140 icons + IconProvider) mounted at root. 75+ files migrated from emoji to Phosphor `regular` weight. `--icon-*` size tokens added.
- **Design System v2 + v2.1 applied to code** (shipped 1 May, PR #31, `781c0c9`) — Font swap, status palette desaturation, body surface warmed (`#0F0D0B → #15110D`), borders flipped from ember-tinted to cream-tinted, v1 shadow tokens deleted, motion tokens + 13-class `hearth-motion-utilities.css` shipped, three v2.1 tokens live (`--surface-input`, `--backdrop-modal`, `--backdrop-success`).
- **Production readiness tracker** (added 26 Apr, refreshed through 8 May) — Disposable 30-step path to pilot launch. **20 / 30 done**, 2 in flight, 8 open. CI green on main; lint required.
- **Operator config closeout** (PR #33, 5 May) — `CRON_SECRET`, `ADMIN_CLERK_IDS`, `SENTRY_AUTH_TOKEN` populated in Vercel; Anthropic monthly spend cap set; production env audit clean. Tracker items #3, #4, #18 closed.

### Recent Milestones (April 2026)

- **Logger Depth Coaching** (shipped 16 Apr) — Guided/Quick mode, observation chip detail fields, coach hints API behind pluggable provider interface (retrieval default, Haiku/hybrid scaffolded), snapshot-aware reflection prompts, template-driven post-save profile nudge.
- **Pedagogy Knowledge Base** (shipped 21 Apr) — Vector-search retrieval over pedagogy corpus (Charlotte Mason, Montessori, Unschooling), Voyage AI embeddings with batch rate-limit handling, richer chunk metadata, enrichment integration.
- **Alpha Readiness Sprint** (21 Apr) — Sentry + PostHog observability, debounced Haiku draft insights, badge assessment queue, pedagogy onboarding wizard, AI cost dashboard, deploy/incident runbooks.
- **Test platform pilot** (23 Apr) — Four-layer vitest with Clerk v7 async mocks (`vitest.setup.ts` + `vitest.integration.setup.ts`); ephemeral Neon branch orchestrator; 28 integration cases green against real Neon across critical API routes.
- **Pilot ops + content groundwork** (27 Apr) — Logger offline banner + offline-aware save error; PostHog family-level identification; model-aware AI cost dashboard; wizard arrow-key cycling + draft persistence; noisy-family rate-limit detection in retention cron; privacy + terms rewritten; test-family onboarding packet; oncall cheat sheet; sample-pack seed script.

---

## Implemented Routes

### Auth-Protected (`(auth)/`)
| Route | Screen |
|-------|--------|
| `/dashboard` | Dashboard (learner rows, moments grid, desktop right panel) |
| `/log` | Retrospective Logger (offline banner + autosave) |
| `/planner` | Weekly Planner |
| `/settings` | Family Settings |
| `/notifications` | Notification Centre |
| `/our-story` | Our Story Hub |
| `/our-story/portfolio` | Portfolio / Learning Journey |
| `/our-story/report` | HEU Report |
| `/our-story/capabilities` | Capabilities Constellation |
| `/our-story/learner/[id]` | Learner Profile / Identity Portrait |
| `/explore/activities` | Activity Discovery |
| `/explore/marketplace` | Marketplace |
| `/library` | Family Library (added/built modules visible) |
| `/build/modules` | Module Builder |
| `/build/badges` | Badge Creator |
| `/badges/assess/[id]` | Badge Assessment |
| `/module/[id]` | Module Experience |
| `/project/[id]` | Project Experience |
| `/invite` | Invite / Provider Codes |
| `/admin/tokens` | Admin Token Management (auth-gated, distinct from `(admin)/`) |
| `/hearths/[hearthId]` | Hearth Home (Our Story, Sessions, Members, Settings tabs) |
| `/hearths/[hearthId]/sessions/[sessionId]` | Session Detail |
| `/hearths/join/[code]` | Invite Acceptance / Join Flow |

### Admin (`(admin)/admin/`)
| Route | Screen |
|-------|--------|
| `/admin` | Admin Dashboard (ops summary) |
| `/admin/analytics` | Analytics (thread coverage, abandonment, activity heat, pack adoption, AI cost) |
| `/admin/content` | Content Studio (draft CRUD, publish to Sanity, **workbench validation**) |
| `/admin/content/qa` | Pack QA dashboard |
| `/admin/content/qa/[packId]` | Pack QA detail |
| `/admin/content/qa/issues` | QA issue list |
| `/admin/families` | Family search / view / snapshot rebuild |
| `/admin/invitations` | Beta invitation code management |
| `/admin/snapshots` | Snapshot health monitoring |
| `/admin/audit-log` | Admin action audit trail |

### Public + Other
| Route | Screen |
|-------|--------|
| `/` | Landing Page (public) |
| `/welcome` | Welcome Wizard (public) |
| `/onboarding` | Onboarding flow (public) |
| `/sign-in/[[...sign-in]]` | Clerk sign-in (public) |
| `/sign-up/[[...sign-up]]` | Clerk sign-up (public) |
| `/privacy` | Privacy Policy (public) |
| `/terms` | Terms & Conditions (public) |
| `/dev-preview/*` | Dev preview bypass routes (no Clerk) |
| `/demo/*` | Static demo flows (no Clerk) |
| `/studio/[[...tool]]` | Sanity Studio (was `/admin` — moved to `/studio`) |

---

## API Surface (103 route files, ~130 handlers)

| Domain | Endpoints |
|--------|-----------|
| Entries | `GET\|POST /api/entries`, `GET\|PATCH\|DELETE /api/entries/[id]`, `POST /api/entries/[id]/complete`, `POST /api/entries/import` |
| Learners | `GET\|POST /api/learners`, `GET\|PATCH\|DELETE /api/learners/[id]` |
| Badges | `GET\|POST /api/badges`, `GET /api/badges/[id]`, `PATCH /api/badges/[id]/retract`, `POST /api/badges/award`, `GET /api/badges/awards`, `POST /api/badges/check-thresholds`, `POST /api/badges/defer`, `GET /api/badges/history` |
| Capabilities | `GET /api/capabilities/[learnerId]`, `POST /api/capabilities/[learnerId]/override` |
| Planner | `GET\|POST /api/planner`, `PATCH\|DELETE /api/planner/[id]` |
| Notifications | `GET\|PATCH /api/notifications`, `PATCH /api/notifications/[id]`, `PATCH /api/notifications/mark-all-read`, `POST /api/notifications/trigger` |
| Dashboard | `GET /api/dashboard`, `GET /api/snapshot` |
| Family | `GET\|PATCH /api/family`, `GET\|POST\|DELETE /api/family/members`, `POST /api/family/invite` |
| Settings | `GET\|PATCH /api/settings` |
| Modules | `GET\|POST /api/modules/drafts`, `POST /api/modules/publish` (parent path — unchanged by workbench addendum) |
| Library | `GET\|POST /api/library` |
| Evidence | `POST /api/evidence/upload` |
| Report | `GET\|POST /api/report`, `PATCH /api/report/[reportId]`, `GET\|PATCH /api/report/[reportId]/samples`, `PATCH /api/report/[reportId]/samples/[sampleId]`, `GET /api/report/export` |
| Stripe | `POST /api/stripe/checkout`, `POST /api/stripe/webhook` *(stubbed — returns 503)* |
| Account | `GET /api/account/export`, `POST /api/account/delete` |
| Admin | `GET /api/admin/tokens`, `GET\|POST /api/admin/retention`, `GET /api/admin/audit-log`, `GET /api/admin/ops/summary` |
| Admin Analytics | `GET /api/admin/analytics/thread-coverage\|abandonment\|activity-heat\|pack-adoption` |
| Admin Content | `GET\|POST /api/admin/content/drafts`, `GET\|PUT\|DELETE /api/admin/content/drafts/[id]`, `POST /api/admin/content/publish` (returns `workbenchFlags` — soft non-blocking validation per addendum §5) |
| Admin Snapshots | `GET /api/admin/snapshots/stale\|health`, `POST /api/admin/snapshots/rebuild` |
| Admin Families | `GET /api/admin/families/search`, `GET /api/admin/families/[familyId]/view`, `POST /api/admin/families/[familyId]/snapshot/rebuild` |
| Admin Invitations | `GET\|POST /api/admin/invitations`, `GET /api/admin/invitations/[id]`, `POST /api/admin/invitations/[id]/revoke`, `GET /api/admin/invitations/expire` |
| Admin QA | `GET /api/admin/qa/packs`, `GET /api/admin/qa/packs/[packId]`, `POST /api/admin/qa/packs/[packId]/recheck`, `GET /api/admin/qa/issues` |
| Onboarding | `POST /api/onboarding/complete`, `POST /api/welcome/complete` |
| Invitations | `GET /api/invitations/validate`, `POST /api/invitations/redeem` |
| Pedagogy | `POST /api/pedagogy/retrieve` *(Bearer token auth)*, `POST /api/pedagogy/sanity-webhook` |
| Print/Assets | `POST /api/print/bundle`, `GET /api/assets/download`, `GET /api/commons/render` |
| Seed | `POST /api/seed/capability-threads`, `POST /api/seed/content-assets`, `POST /api/provider-code/validate`, `GET /api/skeletons` |
| Hearths | `GET\|POST /api/hearths`, `GET\|PATCH /api/hearths/[id]`, `GET /api/hearths/[id]/members`, `DELETE /api/hearths/[id]/members/[familyId]`, `POST /api/hearths/[id]/members/[familyId]/promote`, `POST /api/hearths/[id]/leave`, `POST /api/hearths/[id]/invite`, `POST /api/hearths/[id]/join`, `GET\|POST /api/hearths/[id]/sessions`, `GET\|PATCH /api/hearths/[id]/sessions/[sessionId]`, `POST /api/hearths/[id]/sessions/[sessionId]/rsvp`, `POST\|GET /api/hearths/[id]/sessions/[sessionId]/evidence`, `POST\|GET /api/hearths/[id]/sessions/[sessionId]/observations`, `POST\|GET /api/hearths/[id]/sessions/[sessionId]/reflections`, `GET /api/hearths/[id]/our-story` |
| Scaffolds | `GET /api/scaffolds`, `GET /api/scaffolds/[sessionId]`, `POST /api/scaffolds/[sessionId]/dismiss` |
| Observations | `POST /api/observations/[id]/accept`, `POST /api/observations/[id]/dismiss` |

---

## Data Layer

### PostgreSQL (Neon + Drizzle) — 30 tables
- **Identity:** `families`, `learners`, `familySettings`, `familyMembers`
- **Learning data:** `learningEntries` (includes `sourceSessionId` for hearth provenance)
- **AI:** `familyIntelligenceSnapshots`, `aiPipelineLogs`
- **Badges:** `badgeDefinitions`, `badgeAwards`, `badgeAssessmentLogs`
- **Planner:** `plannerEntries`
- **Notifications:** `notifications`
- **Content:** `familyLibrary`
- **Builder:** `moduleDrafts`
- **Notes:** `facilitatorNotes`
- **Compliance:** `complianceReports`, `workSamples`, `workSampleAnnotations`
- **Provider codes:** `providerCodes`
- **Community:** `hearths`, `hearthMemberships`, `hearthSessions`, `sessionAttendance`, `sessionEvidence`, `suggestedObservations`, `sessionReflections`, `hearthInvites`
- **Admin:** `adminAuditLog`, `invitations`, `contentStudioDrafts`

### Sanity CMS — 19 schemas
**Curriculum content (8):** `capabilityThread`, `badge`, `asset`, `commonsText`, `activity` (with optional `workbench`), `approach`, `module`, `pack` (with optional `workbenches`)
**Project / scaffolding (3):** `projectStage`, `project`, `moduleSkeleton`
**Pedagogy overlay + knowledge base (8):** `pedagogyOverlay`, `pedagogicalFramework`, `pedagogySourceExcerpt`, `pedagogyPracticePattern`, `pedagogyObservationalMarker`, `pedagogyFacilitationVocabulary`, `pedagogyContraindication`, `pedagogyWorkedExample`

### AI Pipeline
- **Enrichment** (`src/lib/ai/enrich.ts`): Claude Haiku enriches entries at save-time with subject detection, capability mapping, AC V9 descriptors, engagement scores, insight suggestions.
- **Keyword fallback** (`src/lib/ai/keyword-matcher.ts`): Baseline subject detection when AI unavailable.
- **Snapshot rebuild** (`src/lib/ai/snapshot-rebuild.ts`): Aggregates entries into per-child capability profiles, triggers badge threshold checks.
- **Pipeline logging:** Token usage, latency, confidence scores tracked in `aiPipelineLogs`.
- **Hearth narrative** (`src/lib/ai/hearth-narrative.ts`): Generates collective term narrative for community groups from session records and family reflections. Cached in hearth settings JSONB.

---

## Immediate Priorities (ordered)

> Living list lives in `docs/production-readiness-tracker.md` (20/30 done). The big rocks remaining:

1. **§1.6 first-deploy smoke test** (#5) — gated on a successful production build with full env, drizzle migrate, and Vercel deploy.
2. **Verify `CRON_SECRET` header shape post-deploy** (#19).
3. **Dry-run `/api/account/export` + `/api/account/delete`** (#21) — exercises the cascade-delete path against Neon prod branch.
4. **Manual QA pedagogy wizard (onboarding + Settings re-run)** (#11) — never clicked through end-to-end.
5. **Run Playwright `e2e/` specs against preview deploy** (#15).
6. **HEU report export vs. actual QLD HEU template diff** (#23).
7. **Editorial pass on three sample-pack drafts** (#26) — `First Term Foundations`, `Outdoor Naturalist`, `Storytellers` published as `status: 'draft'`; AC mapping required before flipping to published.
8. **Neon PITR retention + restore drill** (#24).
9. **Rotate `SANITY_API_TOKEN`; calendar quarterly** (#25).
10. **Migrate rate limiter to Redis / Upstash** (#30) — design landed, do not implement until trigger conditions hit.

---

## Architecture Decisions (Made)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CMS | Sanity (headless) | Content management without building custom CMS |
| User data | PostgreSQL (Neon serverless) | Transactional data separate from portable content |
| Content model | Three-layer: portable content → journey structure → pedagogical overlay | Philosophy-neutral content with runtime interpretation |
| Module design | UbD backward design | Enforces pedagogical coherence |
| Module Builder pathways | Five-pathway system: Understanding-First, Material-Anchored, Process/Steps, Inquiry-Driven, Retrospective Lift | All paths converge on universal module schema |
| Primary interaction | Retrospective logging, not forward planning | Matches how families actually homeschool |
| Child representation | Abstract incomparable shapes, no photos by default | Avoids comparison anxiety and privacy issues |
| Assessment | Parent-controlled with structured confidence-building questions | Respects family autonomy |
| Framework | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 | File-based routing, API routes eliminate separate backend |
| Auth | Clerk | Family account model, good free tier, Next.js middleware |
| ORM | Drizzle | TypeScript-native, works with Neon serverless driver |
| AI | Anthropic Haiku (write-time only) | Screens read from pre-computed Family Intelligence Snapshots |
| Design system | Canonical spec in `hearth-canonical-design-tokens-v2.md` + `hearth-design-system-v2.1-addendum.md` + `hearth-motion-system-v1.md` | Dual-theme (Dark + Gathering) via `data-theme` attribute. v2 + v2.1 landed in code 2026-05-01 |
| Icon library | Phosphor Icons (`@phosphor-icons/react`) per S14 | Curated re-export at `src/components/icons/index.tsx`. Adopted across all UI 2026-05-01 |
| Mobile nav | 5-tab bottom nav with trayed Plan + Explore | `src/components/nav/` with single-source-of-truth `navConfig.ts`. Spec: `hearth-mobile-bottom-nav-spec-v1.md` |
| Editorial workbench | Soft-flag publish validation in admin path | Optional `workbench` on activity, `workbenches` on pack. `/api/admin/content/publish` returns non-blocking `workbenchFlags`. `/api/modules/publish` parent path unchanged |

---

## Design System

**Theme:** Mont Blanc Dark Coffee (v2) + Gathering (v2.1)
**Canonical tokens:** `hearth-canonical-design-tokens-v2.md` + `hearth-design-system-v2.1-addendum.md` (v1 superseded but retained per versioning rules)
**Motion:** `hearth-motion-system-v1.md` — five duration tokens, four easings, 13 `.hearth-*` utility classes in `src/app/hearth-motion-utilities.css`
**Component reference:** `hearth-ui-kit-v2.md` (revision to v3 pending Dashboard Dark v3 + Dashboard Gathering v1)
**Implementation:** Tailwind v4 utility classes + CSS custom properties in `globals.css` via `@theme` (no `tailwind.config.ts`)
**Icons:** Phosphor (`@phosphor-icons/react`) via `src/components/icons/index.tsx` — emoji placeholders gone from `src/`.
**Approach:** Mobile-first. Trayed bottom nav for Plan/Explore. Auto time-of-day theme switching (Gathering 6am–6pm, Dark 6pm–6am).

---

## Core Principles (Enforce These)

- **5-minute rule** — every parent-facing interaction completable in under 5 minutes
- **Retrospective-first** — log what happened, not what you plan to do
- **Philosophy-neutral content** — pedagogy is a runtime lens, never baked into content
- **Never stuck** — learners move laterally, not blocked at checkpoints
- **Curriculum mapping is backend** — UI shows capability threads and plain-language descriptors only
- **Parent empowerment** — build confidence and teach frameworks, don't create dependency
- **First-person gentle friend tone** — warm, never clinical or institutional

---

## Development Workflow

| Concern | Tool | Notes |
|---------|------|-------|
| Architecture, code, review, deployment | Claude Code | Primary development tool |
| Content management | Sanity CMS | Studio at `/admin` route |
| User data | PostgreSQL (Neon) | Schema in `src/lib/db/schema.ts`, migrations in `drizzle/` |
| Content scaling (Phase 2) | TBD | Batch module generation after first packs hand-crafted |

---

## Known Gaps

### Technical
- **Payment processing (Stripe)** — STUBBED. API routes return 503. Marketplace UI renders but purchase flow is non-functional. Stripe package removed from dependencies. Revisit when ready to onboard paying families (Phase 3+). Requires: Stripe account, product/price IDs in Sanity, `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` env vars, restore `stripe` package and real implementations in `src/lib/stripe/client.ts`, `api/stripe/checkout`, `api/stripe/webhook`.
- **End-to-end validation** — critical path traced and verified (onboard → log → enrich → snapshot → dashboard). Capability tracking uses AC V9 descriptor counting from AI enrichment (deprecated `capabilityObservations` table removed from schema). First-deploy smoke test still pending (#5 in tracker).
- **Production error handling** — RESOLVED: `parseBody()` utility added, all JSON-accepting API routes now safely handle malformed requests. Evidence upload route handles missing blob token gracefully.
- **Photo/media storage** — Vercel Blob infrastructure wired (`@vercel/blob`). Requires `BLOB_READ_WRITE_TOKEN` in environment. Upload route returns 503 with clear message if unconfigured.
- **Offline support** — Logger autosaves drafts to `localStorage` every 10s; offline banner + offline-aware save error live (`useOnlineStatus()` hook). Full PWA / sync queue is Phase 2.
- **Rate limiting** — In-process limiter today. Redis/Upstash migration plan landed (`docs/redis-rate-limiter-plan.md`); flip behind `LIMITER_BACKEND` switch when one of the trigger conditions hits.

### Cross-Screen Coherence (Open Design Questions)
> **Source:** `Hearth_System_Interaction_Map.md` Part 6

| # | Question | Status |
|---|----------|--------|
| 7 | **Regression handling** — can parents un-confirm a DLO? | RESOLVED — tier override API at `/api/capabilities/[learnerId]/override`. Overrides stored in learner `profileData.tierOverrides`, respected in snapshot rebuild (can only lower, never raise). UI added to Constellation thread detail panel. |
| 8 | **Historical data import / batch retrospective logging** | PARTIAL — 30-day backdating exists, bulk import not designed |
| 10 | **Repeat module logging evolution** | RESOLVED — Module log mode detects attempt number, shifts prompts (Session 1: capture, Session 2: what shifted, Session 3+: deepening). Reflection prompts replace observation prompts on repeat runs. |
| 11 | **Voice input integration** | RESOLVED — Web Speech API implemented in Logger (en-AU). Other screens not applicable. |
| 12 | **Empty / first-use states per screen** | RESOLVED — Dashboard, Planner, Portfolio, Notifications, Settings, Capabilities, Report, Our Story Hub, and Explore screens all have empty states. |
| 13 | **Gentle migration from retro logging to modules** | RESOLVED — `module_nudge` notification trigger fires after 10+ retro entries with no module usage. 2-week cooldown, pedagogy-aware copy, links to marketplace. |
| 16 | **Offline / poor connectivity** | OPEN |

**Resolved:** #1 (badge logging), #2 (badge award), #3 (dashboard vs Our Story), #4 (AI architecture), #5 (notifications), #6 (HEU curation), #7 (regression/tier override), #9 (constellation drill-down), #10 (repeat module logging), #11 (voice input), #12 (empty/first-use states), #13 (module migration nudge), #14 (data deletion), #15 (learner views scoped to Phase 2).

---

## Shelved (Out of MVP Scope)

| Item | Reason | Revisit |
|------|--------|---------|
| Facilitator Pedagogical Dashboard | No distinct facilitator role in MVP | Phase 2+ |
| Learner-facing views | Phase 1 is parent-operated | Phase 2 |
| ~~Community features~~ | ~~Co-ops, group modules, forums~~ | **SHIPPED** — Hearth community feature complete (multi-family groups, sessions, scaffold logging, Our Story narrative, invites, cross-family observations) |
| Facilitator capture UI | Observation quick-capture during sessions, session completion UI, attendance marking | Phase 2 — API routes exist, UI deferred |
| Planner hearth sessions | Hearth sessions as distinct card type in weekly planner | Phase 2 |

---

## Phase Summary

| Phase | Milestone | Families | Status |
|-------|-----------|----------|--------|
| **1 — MVP** | App built, content seeded, test family launch | 10-20 | Pre-launch hardening |
| **2 — Community** | User feedback, community features | 50-100 | Core feature shipped (3 Apr 2026) |
| **3 — Scale** | Infrastructure hardening, performance | 500+ | Planned |
| **4 — Seed** | Funding readiness, growth metrics | 500+ | Planned |

---

## Market Context

- **Target:** Australian homeschool families, specifically Queensland HEU compliance
- **Differentiator:** Retrospective logging + pedagogy-neutral content + automated compliance documentation
- **Competitors:** Generic LMS platforms not designed for homeschool; manual compliance tracking via spreadsheets/folders
- **Regulatory:** Queensland Home Education Unit requires documented learning plans, work samples, and curriculum coverage evidence

---

*Updated 9 May 2026 — Added May milestones (workbench publish validation, mobile bottom nav, onboarding family-name fix, stale-doc audit, Phosphor icons, v2 + v2.1 design landing, production-readiness tracker). Refreshed routes (admin, public, demo). Bumped Sanity schema count from 10 to 19. Replaced "Known Merge Issue" + 7-item priority list with a 10-item view derived from the production-readiness tracker. Update this file when priorities shift or major decisions are made.*
