# Hearth LMS — Project Status

> **Purpose:** Current state, priorities, and strategic context. Read this first before any new work.
> **Companion files:** `Hearth_System_Interaction_Map.md` for cross-screen coherence. `hearth-canonical-design-tokens-v1.md` for design values.
> **Last updated:** 2 April 2026

---

## Current Phase: Pre-Launch Hardening

**Build progress:** Next.js 16 app fully implemented — 25+ auth-protected routes, 67 API route files (85+ handlers), 27 Drizzle tables, 10 Sanity schemas, AI enrichment pipeline operational. Community (Hearth) feature complete.
**Design system:** Conformance pass complete — all screens revised to canonical tokens (2026-03-20).
**Content:** Starter Pack seeded (121 Sanity docs, 79 activities).
**Launch target:** 10-20 test families in Queensland, Australia.
**Founding Brief:** `hearth-founding-brief-v1.md` is the canonical purpose/mission/vision/values document.

---

## Implemented Routes

### Auth-Protected (`(auth)/`)
| Route | Screen |
|-------|--------|
| `/dashboard` | Dashboard (learner rows, moments grid, desktop right panel) |
| `/log` | Retrospective Logger |
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
| `/build/modules` | Module Builder |
| `/build/badges` | Badge Creator |
| `/badges/assess/[id]` | Badge Assessment |
| `/module/[id]` | Module Experience |
| `/project/[id]` | Project Experience |
| `/invite` | Invite / Provider Codes |
| `/hearths/[hearthId]` | Hearth Home (Our Story, Sessions, Members, Settings tabs) |
| `/hearths/[hearthId]/sessions/[sessionId]` | Session Detail |
| `/hearths/join/[code]` | Invite Acceptance / Join Flow |

### Other
| Route | Screen |
|-------|--------|
| `/` | Landing Page (public) |
| `/welcome` | Welcome Wizard (public) |
| `/onboarding` | Onboarding flow (public) |
| `/dev-preview/*` | Dev preview bypass routes (no Clerk) |
| `/admin` | Sanity Studio |

---

## API Surface (67 route files, 85+ handlers)

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
| Modules | `GET\|POST /api/modules/drafts`, `POST /api/modules/publish` |
| Library | `GET\|POST /api/library` |
| Evidence | `POST /api/evidence/upload` |
| Report | `GET\|POST /api/report`, `PATCH /api/report/[reportId]`, `GET\|PATCH /api/report/[reportId]/samples`, `PATCH /api/report/[reportId]/samples/[sampleId]`, `GET /api/report/export` |
| Stripe | `POST /api/stripe/checkout`, `POST /api/stripe/webhook` *(stubbed — returns 503)* |
| Account | `GET /api/account/export`, `POST /api/account/delete` |
| Admin | `GET /api/admin/tokens`, `GET\|POST /api/admin/retention` |
| Onboarding | `POST /api/onboarding/complete`, `POST /api/welcome/complete` |
| Seed | `POST /api/seed/capability-threads`, `POST /api/provider-code/validate`, `GET /api/skeletons` |
| Hearths | `GET\|POST /api/hearths`, `GET\|PATCH /api/hearths/[id]`, `GET /api/hearths/[id]/members`, `DELETE /api/hearths/[id]/members/[familyId]`, `POST /api/hearths/[id]/members/[familyId]/promote`, `POST /api/hearths/[id]/leave`, `POST /api/hearths/[id]/invite`, `POST /api/hearths/[id]/join`, `GET\|POST /api/hearths/[id]/sessions`, `GET\|PATCH /api/hearths/[id]/sessions/[sessionId]`, `POST /api/hearths/[id]/sessions/[sessionId]/rsvp`, `POST\|GET /api/hearths/[id]/sessions/[sessionId]/evidence`, `POST\|GET /api/hearths/[id]/sessions/[sessionId]/observations`, `POST\|GET /api/hearths/[id]/sessions/[sessionId]/reflections`, `GET /api/hearths/[id]/our-story` |
| Scaffolds | `GET /api/scaffolds`, `GET /api/scaffolds/[sessionId]`, `POST /api/scaffolds/[sessionId]/dismiss` |
| Observations | `POST /api/observations/[id]/accept`, `POST /api/observations/[id]/dismiss` |

---

## Data Layer

### PostgreSQL (Neon + Drizzle) — 27 tables
- **Identity:** `families`, `learners`, `familySettings`, `familyMembers`
- **Learning data:** `learningEntries` (includes `sourceSessionId` for hearth provenance)
- **AI:** `familyIntelligenceSnapshots`, `aiPipelineLogs`
- **Badges:** `badgeDefinitions`, `badgeAwards`, `badgeAssessmentLogs`
- **Planner:** `plannerEntries`
- **Notifications:** `notifications`
- **Content:** `familyLibrary`
- **Builder:** `moduleDrafts`
- **Notes:** `facilitatorNotes`
- **HEU Compliance:** `heuReports`, `workSamples`, `workSampleAnnotations`
- **Provider codes:** `providerCodes`
- **Community:** `hearths`, `hearthMemberships`, `hearthSessions`, `sessionAttendance`, `sessionEvidence`, `suggestedObservations`, `sessionReflections`, `hearthInvites`

### Sanity CMS — 10 schemas
`capabilityThread`, `badge`, `activity`, `approach`, `module`, `pack`, `projectStage`, `project`, `pedagogyOverlay`, `moduleSkeleton`

### AI Pipeline
- **Enrichment** (`src/lib/ai/enrich.ts`): Claude Haiku enriches entries at save-time with subject detection, capability mapping, AC V9 descriptors, engagement scores, insight suggestions.
- **Keyword fallback** (`src/lib/ai/keyword-matcher.ts`): Baseline subject detection when AI unavailable.
- **Snapshot rebuild** (`src/lib/ai/snapshot-rebuild.ts`): Aggregates entries into per-child capability profiles, triggers badge threshold checks.
- **Pipeline logging:** Token usage, latency, confidence scores tracked in `aiPipelineLogs`.
- **Hearth narrative** (`src/lib/ai/hearth-narrative.ts`): Generates collective term narrative for community groups from session records and family reflections. Cached in hearth settings JSONB.

---

## Immediate Priorities (ordered)

1. **End-to-end testing with real family data** — validate the full loop: onboarding → log entry → AI enrichment → snapshot rebuild → dashboard/portfolio/report
2. **Content production** — Starter Pack seeded; additional packs needed for launch diversity
3. **Resolve remaining open design questions** — 5 still fully open from System Interaction Map (regression handling #7 affects data integrity)
4. **Production deployment hardening** — error handling, rate limiting, edge cases
5. **Test family onboarding** — documentation and support flow for first 10-20 families

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
| Design system | Canonical spec in `hearth-canonical-design-tokens-v1.md` | Dual-theme (Dark + Gathering) via `data-theme` attribute |

---

## Design System

**Theme:** Mont Blanc Dark Coffee
**Canonical tokens:** `hearth-canonical-design-tokens-v1.md`
**Component reference:** `hearth-ui-kit-v2.md`
**Implementation:** Tailwind v4 utility classes + CSS custom properties in `globals.css` (no `tailwind.config.ts`)
**Approach:** Mobile-first. No custom decorative assets — emoji placeholders.

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
- **End-to-end validation** — critical path traced and verified (onboard → log → enrich → snapshot → dashboard). Capability tracking uses AC V9 descriptor counting from AI enrichment (deprecated `capabilityObservations` table removed from schema).
- **Production error handling** — RESOLVED: `parseBody()` utility added, all 19 JSON-accepting API routes now safely handle malformed requests. Evidence upload route handles missing blob token gracefully.
- **Photo/media storage** — Vercel Blob infrastructure wired (`@vercel/blob`). Requires `BLOB_READ_WRITE_TOKEN` in environment. Upload route returns 503 with clear message if unconfigured.
- **Offline support** — not addressed

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

*Updated 3 April 2026. Update this file when priorities shift or major decisions are made.*
