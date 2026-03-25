# Hearth LMS — Claude Code Transition Plan

> **Version:** 1 | **Date:** 2026-03-09
> **Purpose:** Step-by-step plan to move from standalone prototypes to a deployed Next.js application using Claude Code on desktop.
> **Audience:** Drew (developer) + Claude Code (execution partner)
> **Companion files:** `COMPONENT_REGISTRY.md`, `PROJECT_STATUS.md`, `Hearth_System_Interaction_Map.md`

---

## Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | **Next.js (App Router)** | File-based routing maps to 19 screens, API routes eliminate separate backend, SSR for HEU reports |
| Hosting | **Vercel** | Native Next.js host, free tier sufficient for 10-20 families, zero DevOps |
| Auth | **Clerk** | Fastest integration, family account model, good free tier, excellent Next.js middleware |
| Database | **Neon (serverless Postgres)** | Best Vercel integration, serverless driver, generous free tier |
| ORM | **Drizzle** | TypeScript-native, no build step, works with Neon serverless driver, clean generated SQL |
| CMS | **Sanity** | Headless content layer — not yet initialised, created in Phase 0 |
| Styling | **Tailwind CSS** | Already the design system approach, utility-first, no runtime cost |
| AI | **Anthropic Haiku** (write-time only) | Per architecture spec — LLM calls only on entry save, everything else reads from snapshot |

---

## Stack Summary

```
┌─────────────────────────────────────────────────────────┐
│  VERCEL (hosting + serverless functions)                 │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Next.js 14+ (App Router)                         │  │
│  │  ├── /app/(auth)        → Clerk-protected routes  │  │
│  │  ├── /app/(public)      → Landing, onboarding     │  │
│  │  ├── /app/api           → API routes              │  │
│  │  └── /components        → Shared UI components    │  │
│  └───────────────────────────────────────────────────┘  │
│           │              │              │               │
│           ▼              ▼              ▼               │
│     ┌──────────┐  ┌───────────┐  ┌──────────┐         │
│     │  Clerk   │  │   Neon    │  │  Sanity  │         │
│     │  (auth)  │  │ (Postgres)│  │  (CMS)   │         │
│     └──────────┘  └───────────┘  └──────────┘         │
│                         │                               │
│                    Drizzle ORM                           │
│                                                         │
│     ┌──────────────────────────────────────────┐       │
│     │  Anthropic API (Haiku)                    │       │
│     │  Write-time only: entry save → enrichment │       │
│     └──────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## Phase Overview

| Phase | Name | Duration | What Ships |
|-------|------|----------|-----------|
| **0** | **Foundations** | 2-3 days | Repo, tooling, accounts, empty app shell running locally |
| **1** | **Skeleton App** | 3-5 days | Routing, layout, nav, auth, design system tokens, empty page shells for all 19 screens |
| **2** | **Database + Core Models** | 3-5 days | Drizzle schemas, migrations, seed data, core API routes |
| **3** | **Core Value Loop** | 7-10 days | Logger → Portfolio → HEU Report → Capabilities pipeline — the 4 screens that prove the product |
| **4** | **Sanity + Content** | 5-7 days | Sanity project, schemas, first content pack, Module Experience + Activity Discovery connected |
| **5** | **Supporting Screens** | 5-7 days | Dashboard, Weekly Planner, Settings, Learner Profile, Notifications, Marketplace shell |
| **6** | **AI Intelligence Layer** | 3-5 days | Write-time enrichment pipeline, Family Intelligence Snapshot, keyword matcher |
| **7** | **Integration + Polish** | 5-7 days | Cross-screen data flow, badge assessment, onboarding, deploy to Vercel |

**Total estimated:** 5-8 weeks of focused work (not full-time — adjusted for solo developer pace)

---

## Phase 0: Foundations (2-3 days)

### Goal
Every tool installed, every account created, empty app running at localhost.

### 0.1 Create Accounts (if not already done)

| Service | URL | Free Tier | What You Need |
|---------|-----|-----------|---------------|
| Vercel | vercel.com | Hobby (free) | GitHub-connected deploy |
| Neon | neon.tech | Free tier (0.5 GB) | Connection string |
| Clerk | clerk.com | Free (10k MAU) | Publishable key + secret key |
| Sanity | sanity.io | Free (developer) | Project ID + dataset name |
| Anthropic | console.anthropic.com | Pay-as-you-go | API key (you likely have this already) |

### 0.2 Create GitHub Repo

```bash
# Create repo on GitHub: hearth-lms (private)
# Clone locally
git clone git@github.com:YOUR_USERNAME/hearth-lms.git
cd hearth-lms
```

### 0.3 Scaffold Next.js Project

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Choose: App Router, src/ directory, TypeScript, Tailwind, ESLint.

### 0.4 Install Core Dependencies

```bash
# Database
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

# Auth
npm install @clerk/nextjs

# CMS (defer Sanity Studio to Phase 4, but install client now)
npm install @sanity/client

# AI (write-time only)
npm install @anthropic-ai/sdk

# Utilities
npm install zod          # Runtime validation
npm install date-fns     # Date formatting (for HEU deadlines, planner)
npm install lucide-react  # Icon library (emoji placeholders where possible, lucide for nav)
```

### 0.5 Environment Variables

Create `.env.local`:

```env
# Neon
DATABASE_URL=postgresql://...@...neon.tech/hearth?sslmode=require

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=...
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

### 0.6 Initial Project Structure

```
hearth-lms/
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Clerk-protected route group
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── log/page.tsx           # Retrospective Logger
│   │   │   ├── our-story/
│   │   │   │   ├── portfolio/page.tsx
│   │   │   │   ├── report/page.tsx    # HEU Report
│   │   │   │   ├── capabilities/page.tsx
│   │   │   │   └── learner/[id]/page.tsx
│   │   │   ├── explore/
│   │   │   │   ├── activities/page.tsx
│   │   │   │   └── marketplace/page.tsx
│   │   │   ├── build/
│   │   │   │   ├── modules/page.tsx    # Module Builder
│   │   │   │   └── badges/page.tsx     # Badge Creator
│   │   │   ├── planner/page.tsx        # Weekly Planner
│   │   │   ├── module/[id]/page.tsx    # Module Experience
│   │   │   ├── project/[id]/page.tsx   # Project Experience
│   │   │   ├── notifications/page.tsx
│   │   │   ├── settings/page.tsx       # Family Settings
│   │   │   └── layout.tsx              # Auth layout with nav
│   │   ├── (public)/
│   │   │   ├── page.tsx               # Landing / marketing
│   │   │   └── onboarding/page.tsx    # Onboarding demo
│   │   ├── api/
│   │   │   ├── entries/route.ts       # Learning entries CRUD
│   │   │   ├── badges/
│   │   │   │   ├── route.ts           # Badge CRUD
│   │   │   │   └── assess/route.ts    # Badge threshold check
│   │   │   ├── snapshot/route.ts      # Family Intelligence Snapshot
│   │   │   ├── sanity/
│   │   │   │   └── webhook/route.ts   # Sanity webhook handler
│   │   │   └── ai/
│   │   │       └── enrich/route.ts    # Write-time LLM enrichment
│   │   ├── layout.tsx                 # Root layout
│   │   └── globals.css                # Tailwind + design tokens
│   ├── components/
│   │   ├── ui/                        # Shared primitives (buttons, cards, inputs)
│   │   ├── layout/                    # Nav, sidebar, header
│   │   └── screens/                   # Screen-specific component groups
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts             # Drizzle schema (all tables)
│   │   │   ├── index.ts              # Neon client + Drizzle instance
│   │   │   └── migrations/           # Drizzle migrations
│   │   ├── sanity/
│   │   │   ├── client.ts             # Sanity client config
│   │   │   └── queries.ts            # GROQ queries
│   │   ├── ai/
│   │   │   ├── enrich.ts             # Entry enrichment pipeline
│   │   │   └── keyword-matcher.ts    # Client-side keyword matcher for Logger
│   │   ├── auth/
│   │   │   └── helpers.ts            # Clerk utilities
│   │   └── utils/
│   │       ├── design-tokens.ts      # Mont Blanc token constants
│   │       └── constants.ts          # App-wide constants
│   ├── hooks/                         # Custom React hooks
│   └── types/                         # TypeScript type definitions
├── drizzle.config.ts                  # Drizzle Kit config
├── sanity/                            # Sanity Studio (Phase 4)
│   ├── sanity.config.ts
│   └── schemas/
├── public/
│   └── fonts/                         # Crimson Text + Inter
├── prototypes/                        # Original HTML/JSX prototypes (reference only)
├── docs/                              # Architecture docs from project knowledge
├── .env.local
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 0.7 Tailwind Config with Design Tokens

Extend `tailwind.config.ts` with Mont Blanc Dark Coffee tokens:

```typescript
// Key tokens from mont-blanc-style-guide.md
// Claude Code should reference the full style guide for complete values
const hearthTokens = {
  colors: {
    'bg-primary': '#1C1410',      // Dark coffee background
    'bg-secondary': '#2A1F18',    // Card/surface background
    'bg-tertiary': '#362A21',     // Elevated surfaces
    'text-primary': '#F5F0EB',    // Primary text
    'text-secondary': '#B8A99A',  // Secondary text
    'text-muted': '#8C7B6B',     // Muted/tertiary text
    'ember': '#D97B3A',           // Primary accent — reserved for primary actions only
    'ember-hover': '#E08B4A',
    'ember-muted': 'rgba(217, 123, 58, 0.15)',
    'border-default': '#3D2E24',
    'border-subtle': '#2A1F18',
    // Subject colours
    'english': '#6B8E9B',
    'mathematics': '#9B7B6B',
    'science': '#7B9B6B',
    'hass': '#9B8B6B',
    'arts': '#8B6B9B',
    'technologies': '#6B7B9B',
    'hpe': '#9B6B7B',
    'languages': '#6B9B8B',
    // Child colours (per-child differentiation)
    'child-rose': '#D4A0A0',
    'child-blue': '#7BA3C9',
    'child-sage': '#8BAA7B',
    'child-amber': '#C9A86B',
  },
  fontFamily: {
    'display': ['Crimson Text', 'serif'],
    'body': ['Inter', 'sans-serif'],
  },
}
```

### 0.8 Phase 0 Verification Checklist

```
□ `npm run dev` shows Next.js welcome page at localhost:3000
□ Tailwind classes render correctly
□ Clerk middleware blocks /dashboard without auth
□ Neon connection test: can run a SELECT 1 query
□ Git repo has initial commit pushed to GitHub
□ Vercel project connected to GitHub repo (auto-deploys on push)
□ .env.local has all keys populated
□ .gitignore includes .env.local
```

---

## Phase 1: Skeleton App (3-5 days)

### Goal
All 19 routes exist with placeholder content. Primary nav works. Auth flow works. Design system is applied globally. Someone can click through the app and see every screen shell.

### 1.1 Root Layout + Design System

Build `src/app/layout.tsx` with:
- Google Fonts: Crimson Text (display) + Inter (body)
- Global CSS with Mont Blanc tokens as CSS custom properties
- Dark coffee background applied globally
- ClerkProvider wrapping the app

Build `src/app/globals.css` with:
- Tailwind base/components/utilities
- CSS custom properties for all design tokens (so both Tailwind and raw CSS can use them)
- Base typography: body in Inter, headings in Crimson Text

### 1.2 Auth Layout with Navigation

Build `src/app/(auth)/layout.tsx`:
- Clerk-protected layout (redirects to sign-in if unauthenticated)
- Bottom nav bar (mobile) matching the prototype navigation structure:
  - 🏠 Home → /dashboard
  - 📖 Our Story → /our-story/portfolio (with sub-nav)
  - 🔍 Explore → /explore/activities
  - ✏️ Log → /log
  - 🔧 Build → /build/modules
  - ⚙️ Settings → /settings
- Notification bell in header → /notifications

### 1.3 Page Shells for All 19 Screens

Create each page.tsx with:
- Screen title matching the prototype
- A brief description of what this screen does
- "Coming soon" or placeholder content
- Correct layout nesting

Full route mapping from COMPONENT_REGISTRY:

| # | Screen | Route | Prototype Reference |
|---|--------|-------|---------------------|
| 1 | Onboarding Demo | `/onboarding` | hearth-complete-demo.html |
| 2 | Dashboard (Dark) | `/dashboard` | hearth-dashboard-dark.html |
| 3 | Dashboard (Evening) | `/dashboard` (time-adaptive) | hearth-dashboard-evening.html |
| 4 | Retrospective Logger v2 | `/log` | hearth-logger-workspace-v2.html |
| 5 | Portfolio / Learning Journey | `/our-story/portfolio` | hearth-portfolio-learning-journey.html |
| 6 | HEU Compliance Report | `/our-story/report` | hearth-report-screen.html |
| 7 | Module Experience v2 | `/module/[id]` | hearth-module-experience-v2.html |
| 8 | Module Builder v2 | `/build/modules` | hearth-module-builder-v2.jsx |
| 9 | Badge Creator | `/build/badges` | badge-creation-component.tsx |
| 10 | Pedagogy Engine | `/settings/pedagogy` (or Settings sub-section) | hearth-pedagogy-engine-responsive.jsx |
| 11 | Weekly Planner v3 | `/planner` | hearth-weekly-planner-v3.html |
| 12 | Activity Discovery v2 | `/explore/activities` | hearth-activity-discovery-v2.html |
| 13 | Capabilities Constellation v3 | `/our-story/capabilities` | hearth-capabilities-v3.html |
| 14 | Constellation Map (React) | `/our-story/capabilities` (same page, React impl) | hearth-constellation-map.jsx |
| 15 | Family Settings | `/settings` | hearth-family-settings.html |
| 16 | Learner Profile | `/our-story/learner/[id]` | hearth-learner-profile.html |
| 17 | Marketplace | `/explore/marketplace` | hearth-marketplace.html |
| 18 | Project Experience v2 | `/project/[id]` | hearth-project-experience-v2.html |
| 19 | Notification Center | `/notifications` | hearth-notification-centre-v1.html |
| 20 | Badge Assessment | `/badges/assess/[id]` (modal or secondary route) | hearth-badge-assessment.html |
| 21 | Our Story Hub | `/our-story` | hearth-our-story-hub.html |
| 22 | Dashboard Mobile | `/dashboard` (responsive) | hearth-dashboard-mobile-v1.html |

### 1.4 Shared UI Components (Foundation Set)

Extract from prototypes — these are the primitives used across multiple screens:

- `<Card>` — dark coffee surface card with border-subtle
- `<Button>` — primary (ember), secondary (ghost), destructive
- `<SubjectPill>` — coloured subject tag (English, Maths, Science, etc.)
- `<ChildChip>` — colour-coded learner selector (Emma=rose, Liam=blue)
- `<ProgressBar>` — simple bar with ember fill
- `<EmptyState>` — friendly "nothing here yet" with emoji
- `<SectionHeader>` — Crimson Text heading with optional action
- `<BottomNav>` — mobile bottom navigation bar
- `<PageHeader>` — screen title + back button + optional actions

### 1.5 Phase 1 Verification

```
□ Can sign up / sign in via Clerk
□ All routes accessible from nav
□ Dark coffee theme renders correctly on all pages
□ Bottom nav highlights current route
□ Auth redirect works (unauthenticated → sign-in)
□ Deployed to Vercel and accessible at hearth-lms.vercel.app
□ Mobile viewport renders correctly
```

---

## Phase 2: Database + Core Models (3-5 days)

### Goal
Drizzle schema matches the architecture spec. Migrations run against Neon. Seed data exists for one test family. Core API routes return real data.

### 2.1 Drizzle Schema

Build `src/lib/db/schema.ts` mapping from the existing architecture docs. Core tables:

**Identity & Auth**
- `families` — family account (linked to Clerk org)
- `learners` — children within a family (name, date_of_birth, shape_icon, colour_token)
- `family_settings` — pedagogy preference, HEU details, notification prefs

**Learning Data (the core value)**
- `learning_entries` — the central table. Every Logger and Module Log entry goes here
  - `family_id`, `learner_ids[]`, `title`, `description`, `date_occurred`
  - `subjects[]`, `engagement_per_learner` (JSONB), `discoveries_per_learner` (JSONB)
  - `source` (logger | module_log | project_stage)
  - `source_module_id`, `source_project_id`, `source_stage_number` (nullable)
  - `status` (draft | complete)
  - `ai_enrichment` (JSONB — populated by write-time pipeline)

**AI Layer**
- `family_intelligence_snapshots` — one per family, JSONB blob, rebuilt async
  - `snapshot_data`, `rebuilt_at`, `rebuild_trigger`, `snapshot_version`

**Capability Tracking**
- `capability_observations` — DLO-level observations per learner
  - `learner_id`, `thread_id`, `dlo_id`, `status` (emerging | developing | demonstrating)
  - `source_entry_id`, `observed_at`, `confirmed` (boolean — parent-confirmed vs AI-suggested)

**Badges**
- `badge_definitions` — badge templates (may also live in Sanity — TBD dual-source)
- `badge_awards` — per-learner badge achievements
- `badge_assessment_logs` — assessment question responses

**Planner**
- `planner_entries` — planned activities per day per family
  - `family_id`, `date`, `module_id`, `status` (planned | completed)

**Notifications**
- `notifications` — per-family notification queue
  - `type`, `tier`, `state` (visible | dismissed | actioned | expired), `body_data` (JSONB)

### 2.2 Drizzle Migration Setup

```bash
# drizzle.config.ts points to Neon
npx drizzle-kit generate   # Generate SQL migrations
npx drizzle-kit push        # Apply to Neon (or migrate for production)
```

### 2.3 Seed Script

Create `src/lib/db/seed.ts`:
- One test family: "The Campbells"
- Two learners: Emma (age 7, rose) and Liam (age 5, blue)
- Family settings: Eclectic philosophy, Queensland HEU, next reporting date 3 months out
- 10-15 sample learning entries spanning 2 weeks (varied subjects, both learners)
- 3-4 capability observations at different tiers
- 1 badge awarded, 1 badge near threshold

### 2.4 Core API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/entries` | GET | List entries (filtered by family, date range, learner) |
| `/api/entries` | POST | Create new learning entry (triggers AI enrichment) |
| `/api/entries/[id]` | PATCH | Update draft entry |
| `/api/entries/[id]/complete` | POST | Mark entry as complete (triggers snapshot rebuild) |
| `/api/learners` | GET | List learners for current family |
| `/api/capabilities/[learnerId]` | GET | Get capability observations for a learner |
| `/api/snapshot` | GET | Get current Family Intelligence Snapshot |
| `/api/badges/check-thresholds` | POST | Check if any badge thresholds crossed after entry save |

### 2.5 Clerk → Family Mapping

When a user signs up via Clerk, create their `family` record:
- Clerk `userId` → stored in `families.clerk_user_id`
- Clerk webhook or middleware creates the family record on first sign-in
- All subsequent API calls use `auth()` from Clerk to resolve `family_id`

### 2.6 Phase 2 Verification

```
□ Drizzle schema matches architecture spec
□ Migrations applied to Neon without errors
□ Seed data visible in Neon console
□ GET /api/entries returns seeded entries
□ POST /api/entries creates a new entry
□ Clerk user → family mapping works on sign-up
□ All API routes require auth (return 401 without Clerk session)
```

---

## Phase 3: Core Value Loop (7-10 days)

### Goal
The four screens that prove the product work end-to-end with real data: Logger → Portfolio → HEU Report → Capabilities Constellation.

This is the most important phase. If test families can log learning and see it flow through to their portfolio and compliance report, the product has value. Everything else is enhancement.

### 3.1 Retrospective Logger (the heart of Hearth)

**Reference:** `hearth-logger-workspace-v2.html`

Build the Logger as a full-featured form:

- **Left panel (form):**
  - Title field (required)
  - Date picker — defaults to today, allows backdating (retrospective-first)
  - Description — rich text area for "what happened"
  - Subject multi-select (8 Australian Curriculum areas)
  - Learner multi-select with colour-coded chips (Emma=rose, Liam=blue)
  - Per-learner engagement (emoji row: 😐🙂😊🤩) keyed by `learner_id`
  - Per-learner discoveries (text field per selected learner)
  - Evidence upload (photos — store in Neon via base64 for MVP, or use Vercel Blob)
  - Completeness gate: save button disabled until 50% of fields populated

- **Right panel (AI insights — Phase 6):**
  - Placeholder in Phase 3: "AI insights will appear here as you log"
  - In Phase 6: client-side keyword matcher populates subject suggestions and capability thread hints as parent types

- **Save flow:**
  1. POST to `/api/entries` with all fields
  2. Return entry ID immediately (optimistic save)
  3. Background: trigger AI enrichment (Phase 6) + snapshot rebuild
  4. Background: check badge thresholds → if crossed, return trigger for badge assessment

### 3.2 Portfolio / Learning Journey

**Reference:** `hearth-portfolio-learning-journey.html`

- Per-learner view (child selector at top)
- Chronological feed of learning entries (most recent first)
- Each entry card shows: title, date, subjects, engagement emoji, evidence thumbnails
- Capability threads sidebar: list of threads with observation counts
- Badge collection: earned badges with award dates
- Filter by subject, date range
- Data source: `GET /api/entries?learnerId=X` + `GET /api/capabilities/X` + badge awards

### 3.3 HEU Compliance Report

**Reference:** `hearth-report-screen.html`, `hearth-report-interaction-spec.md`

- Per-learner view
- Curriculum coverage heatmap: 8 subject areas, coverage percentage based on logged entries
- Posture badge: On Track / Needs Attention / At Risk (derived from snapshot)
- Gap analysis: subjects with low coverage highlighted
- Reporting deadline countdown
- Work sample selection (6 samples required per HEU reporting period)
- Export capability (PDF — defer full implementation, but include button)
- Data source: Family Intelligence Snapshot (`snapshot_data.gap_analysis`, `snapshot_data.curriculum_coverage`)

### 3.4 Capabilities Constellation

**Reference:** `hearth-capabilities-v3.html`, `hearth-constellation-map.jsx`

- Per-learner view
- Visual map of 57 capability threads across 8 domains
- Each thread shows progress: emerging → developing → demonstrating
- Thread drill-down: tap a thread to see the observations that support it
- Observation cards link back to source learning entries
- Progress bars with gradient fills
- Data source: `GET /api/capabilities/[learnerId]`

### 3.5 The Pipeline Test

After building all four screens, verify the complete data flow:

```
Parent logs "We spent the morning at the creek catching tadpoles.
Emma counted them into groups of ten. Liam drew pictures of the frogs."
    │
    ▼
Learning Entry created in Postgres
    │
    ├── Portfolio shows the entry immediately
    ├── HEU Report coverage updates (Science, Maths gain a data point)
    └── Capabilities Constellation: any relevant threads show new observation
```

### 3.6 Phase 3 Verification

```
□ Can create a learning entry via the Logger
□ Entry appears in Portfolio immediately
□ HEU Report shows updated curriculum coverage
□ Capabilities Constellation reflects observations
□ Per-learner filtering works on all three "Our Story" screens
□ Completeness gate prevents saving empty entries
□ Draft auto-save works (entry recoverable after leaving page)
□ Entry detail view shows all captured data
□ 5-minute rule: can complete a log entry in under 5 minutes
```

---

## Phase 4: Sanity + Content (5-7 days)

### Goal
Sanity project initialised with schemas. First content pack loaded. Module Experience and Activity Discovery connected to real CMS content.

### 4.1 Initialise Sanity

```bash
# From project root
npm create sanity@latest -- --project-id YOUR_PROJECT_ID --dataset production --output-path sanity
```

Or use the embedded Sanity Studio approach (recommended for Next.js):
- Install `next-sanity`
- Mount Studio at `/admin` route in Next.js

### 4.2 Sanity Schemas

Build schemas based on `03_CMS_Usage_Mapping.md` and `Hearth_LMS_Content_Creation_Framework.md`:

**Content Hierarchy:**
- `pack` — top-level content package (e.g., "Nature Discovery Pack")
- `module` — learning module within a pack
- `approach` — methodology variant for a module (philosophy overlays attach here at runtime)
- `activity` — individual learning activity
- `project` — multi-stage project (parallel to pack/module)
- `projectStage` — individual stage within a project

**Supporting:**
- `capabilityThread` — the 57 threads (reference data)
- `curriculumDescriptor` — Australian Curriculum V9 descriptors
- `pedagogyOverlay` — philosophy-specific framing templates
- `badgeDefinition` — system badge templates (criteria, DLO requirements)

### 4.3 First Content Pack (Hand-Crafted)

Load the "Bread Mathematics" module as the first real content:
- Source: `hearth-bread-module-v2.html` for structure
- Create in Sanity Studio manually
- This validates the schema works end-to-end

### 4.4 Module Experience

**Reference:** `hearth-module-experience-v2.html`, `Hearth_Module_Experience_UX_Flows.md`

Three modes, all pulling content from Sanity:
- **Prep mode** — materials list, prior knowledge, what to expect
- **Experience mode** — step-by-step activity guidance (approach-filtered by family pedagogy)
- **Log mode** — entry form (same per-child pattern as Logger, but pre-populated with module context)

Log mode saves a `learning_entry` with `source: 'module_log'` and `source_module_id` set.

### 4.5 Activity Discovery

**Reference:** `hearth-activity-discovery-v2.html`, `hearth-activity-discovery-docs.md`

- Browse/search Sanity content library
- Filter by subject, age range, duration, indoor/outdoor
- "Add to Library" → saves to family's My Library (Postgres)
- "Add to [Day]" → creates planner entry
- Membership-included content: no pricing shown
- Marketplace content: price displayed (connect in Phase 5)

### 4.6 Phase 4 Verification

```
□ Sanity Studio accessible at /admin (or separate URL)
□ Bread Mathematics module visible in Sanity
□ Module Experience loads content from Sanity
□ Prep → Experience → Log flow works end-to-end
□ Log mode creates a learning entry linked to the module
□ Activity Discovery shows Sanity content
□ Subject filtering works
□ Pedagogy overlay applies based on family setting (Eclectic for seed family)
```

---

## Phase 5: Supporting Screens (5-7 days)

### Goal
All remaining screens functional with real data. The app feels complete even if some features are simplified.

### 5.1 Dashboard

**Reference:** `hearth-dashboard-dark.html`, `hearth-dashboard-evening.html`, `hearth-dashboard-mobile-v1.html`

- Family-wide view (not per-child)
- Recent activity summary (last 7 days)
- Highest-priority notification card
- Quick-access buttons: Log, Explore, Planner
- Time-adaptive theme: evening variant after 6pm (CSS custom properties swap)
- Responsive: mobile layout from `hearth-dashboard-mobile-v1.html`
- Data source: Family Intelligence Snapshot

### 5.2 Weekly Planner

**Reference:** `hearth-weekly-planner-v3.html`

- Week view (Mon-Fri default, weekend optional)
- Planned → Completed toggle per entry
- Subject balance pips (visual indicator of subject distribution)
- Drag to reorder (stretch goal — simple list OK for MVP)
- "Add from Library" action → opens Activity Discovery
- Data source: `planner_entries` table

### 5.3 Family Settings

**Reference:** `hearth-family-settings.html`

- Learner management: add/edit children (name, DOB, colour, shape)
- Pedagogy preference selector (Charlotte Mason, Montessori, Unschooling, Eclectic — stored in `family_settings`)
- HEU details: reporting dates, registration info
- Notification preferences
- Account management (Clerk profile link)
- **Onboarding gate:** First-time users routed here from sign-up before Dashboard

### 5.4 Learner Profile

**Reference:** `hearth-learner-profile.html`, `hearth-learner-profile-spec.md`

- Identity portrait: who this child is as a learner
- Working style, interests, strengths (parent-entered)
- NOT progress tracking (that's Capabilities Constellation)
- Data source: `learners` table extended fields

### 5.5 Notification Center

**Reference:** `hearth-notification-centre-v1.html`, `hearth-notification-system-spec.md`

- Three-tier display: Resume → Respond → Reconnect
- Filter tabs by tier
- Swipe-to-dismiss
- "I noticed..." copy voice
- Each notification routes to its destination screen
- Data source: `notifications` table

### 5.6 Our Story Hub

**Reference:** `hearth-our-story-hub.html`

- Landing page for the Our Story navigation group
- Per-child selector
- Cards linking to: Portfolio, HEU Report, Capabilities, Learner Profile
- Summary stats per child (entries logged, badges earned, capability threads active)

### 5.7 Marketplace Shell

**Reference:** `hearth-marketplace.html`

- Browse educator-created content (Sanity)
- Price display for premium content
- "Included with membership" badge for free content
- Purchase flow: **stub only for MVP** (show price, "Coming soon" on buy button)
- No payment processing in Phase 1

### 5.8 Module Builder + Badge Creator

**Reference:** `hearth-module-builder-v2.jsx`, `badge-creation-component.tsx`

These are educator/creator tools. For MVP test families:
- Module Builder: read-only or simplified version (parents aren't creating modules in Phase 1)
- Badge Creator: functional for custom family badges
- Both can be lower-priority since test families consume content, not create it

### 5.9 Phase 5 Verification

```
□ Dashboard shows real family data
□ Evening theme activates after 6pm
□ Planner: can add, complete, and remove planned activities
□ Settings: can add a learner, change pedagogy, update HEU dates
□ New user flow: sign up → Settings → Dashboard
□ Notifications render with correct tier ordering
□ Our Story hub shows per-child summaries
□ All screens accessible via navigation
□ Mobile layouts work for all screens
```

---

## Phase 6: AI Intelligence Layer (3-5 days)

### Goal
Write-time enrichment pipeline working. Family Intelligence Snapshot rebuilding after writes. Keyword matcher providing live Logger hints.

**Reference:** `Hearth_AI_Intelligence_Layer_Architecture.md`

### 6.1 Client-Side Keyword Matcher

Build `src/lib/ai/keyword-matcher.ts`:
- Curated keyword lists per subject area and capability thread
- Runs in the browser as the parent types in the Logger
- Populates subject suggestions and capability thread hints in the right panel
- Zero cost, instant response

### 6.2 Write-Time Enrichment Pipeline

Build `src/lib/ai/enrich.ts`:
- Triggered by POST/PATCH to `/api/entries` when `status: 'complete'`
- Assembles context: entry text + family pedagogy + compressed capability thread taxonomy
- Single Haiku API call, structured JSON output
- Parses response: subject classifications, capability thread mappings, curriculum descriptors, engagement analysis
- Writes enrichment to `learning_entries.ai_enrichment` (JSONB)
- Marks all AI-suggested capability mappings as `confirmed: false`
- Target: <2,000 tokens round-trip, <3 seconds latency

### 6.3 Snapshot Rebuild Worker

Build `src/lib/ai/snapshot-rebuild.ts`:
- Triggered after entry save (async — doesn't block the save response)
- Computes per-child and family-wide fields:
  - Curriculum coverage per subject per learner
  - Gap analysis (subjects below threshold)
  - Badge threshold status
  - Dashboard summary text
  - Recommendation sort scores
  - Notification triggers (draft resume, compliance nudge, etc.)
- Writes to `family_intelligence_snapshots` table
- Vercel serverless functions can run this as a background task (or use Vercel Cron for periodic rebuilds)

### 6.4 Badge Threshold Detection

After snapshot rebuild, check badge thresholds:
- Query `badge_definitions` for badges relevant to updated capability threads
- Compare required DLO count vs confirmed observations
- If threshold crossed → create `badge_ready` notification
- Notification includes badge ID and learner ID for the assessment flow

### 6.5 Badge Assessment Flow

**Reference:** `hearth-badge-assessment.html`, `hearth-badge-assessment-spec.md`

- Secondary interface triggered by notification or post-log redirect
- 3-5 assessment questions (stored in Sanity with badge definition)
- Parent answers with confidence levels
- Award or Defer decision
- Award → creates `badge_awards` record → updates Portfolio + Constellation
- Defer → sets 14-day cooling period

### 6.6 Phase 6 Verification

```
□ Keyword matcher highlights subjects as parent types
□ Entry enrichment runs on save (verify via ai_enrichment JSONB)
□ Snapshot rebuilds after entry save
□ Badge threshold detection creates notifications
□ Badge assessment flow: question → decision → award/defer
□ Dashboard reads from snapshot (not from raw entries)
□ Total enrichment time under 3 seconds
□ Token usage per entry under 2,000 round-trip
```

---

## Phase 7: Integration + Polish (5-7 days)

### Goal
Cross-screen data flows verified. Onboarding works. Edge cases handled. Deployed and ready for test families.

### 7.1 Cross-Screen Data Flow Verification

Walk through every pipeline defined in `Hearth_System_Interaction_Map.md`:

- **Log → Portfolio → Report → Capabilities** (core loop — Phase 3, verify again)
- **Log → Badge threshold → Assessment → Award → Portfolio + Constellation**
- **Module Experience → Log mode → Entry → same pipeline as above**
- **Project Experience → Stage completion → Entry → pipeline**
- **Activity Discovery → Add to Library / Add to Planner → Planner**
- **Settings change (pedagogy) → overlay recalculation on next content load**
- **Notification → destination screen routing**

### 7.2 Onboarding Flow

**Reference:** `hearth-complete-demo.html`

- Simplified for MVP: not the full 5-branch demo, but:
  1. Welcome screen
  2. Family Settings (add children, choose pedagogy, enter HEU details)
  3. First log prompt ("Let's capture something your family learned recently")
  4. Dashboard arrival

### 7.3 Error Handling + Edge Cases

- Empty states for all screens (no entries yet, no badges, no planner items)
- Offline handling: at minimum, show a "you're offline" banner (full offline is Phase 3)
- API error handling: toast notifications for failed saves
- Auto-save for Logger drafts (save to `status: 'draft'` on 30-second interval)
- Session timeout handling (Clerk manages this)

### 7.4 Performance Check

- Lighthouse audit on key pages (Dashboard, Logger, Portfolio)
- Verify serverless function cold start times are acceptable
- Image optimisation for evidence photos (Next.js Image component)
- Sanity CDN for content images

### 7.5 Project Experience

**Reference:** `hearth-project-experience-v2.html`, `hearth-project-design-specification.md`

- Multi-stage project view
- Stage progression (sequential unlock)
- Per-stage logging via Module Experience log mode
- Artifact dependency references between stages
- Capstone synthesis entry
- Lower priority than core loop — can be simplified for MVP

### 7.6 Final Deploy + Test Family Prep

- Vercel production deployment
- Custom domain (if ready): e.g., app.hearthlearning.com.au
- Create test family accounts in Clerk
- Load 2-3 content packs in Sanity (hand-crafted)
- Write "Getting Started" guide for test families
- Set up error monitoring (Vercel Analytics + Sentry free tier)

### 7.7 Phase 7 Verification (Launch Readiness)

```
□ New user can sign up → onboard → log first entry → see it in portfolio
□ HEU report shows meaningful data after 5+ entries
□ Badge assessment triggers and completes
□ Weekly planner functional
□ Notifications appear and route correctly
□ All screens render on mobile
□ No console errors in production
□ Error monitoring active
□ 2-3 content packs loaded in Sanity
□ Test family accounts created
□ Getting Started guide written
```

---

## Claude Code Working Strategy

### How to Use This Plan with Claude Code

Each phase should be a focused Claude Code session (or series of sessions). Here's how to structure the handoff:

**Session starter prompt template:**

```
I'm building Hearth LMS. Here's the context:

Tech stack: Next.js 14 (App Router), TypeScript, Tailwind, Clerk auth,
Neon Postgres with Drizzle ORM, Sanity CMS, Vercel hosting.

Current phase: [Phase N — Name]
Current goal: [specific task from the plan]

Reference files in the repo:
- /prototypes/ — original HTML/JSX prototypes (visual reference only)
- /docs/ — architecture specs

Design system: Mont Blanc Dark Coffee theme. Key tokens:
- bg-primary: #1C1410, bg-secondary: #2A1F18
- text-primary: #F5F0EB, ember accent: #D97B3A
- Fonts: Crimson Text (headings), Inter (body)
- Mobile-first, Tailwind utility classes only
- No decorative images — emoji placeholders

[paste specific task details]
```

### Key Files to Copy Into the Repo

Copy these from your project knowledge into `/docs/` in the repo so Claude Code can reference them:

| File | Purpose |
|------|---------|
| `mont-blanc-style-guide.md` | Design tokens — Claude Code reads this for every UI task |
| `Hearth_System_Interaction_Map.md` | Cross-screen data flows — Claude Code reads this for integration |
| `Hearth_AI_Intelligence_Layer_Architecture.md` | AI pipeline — Claude Code reads this for Phase 6 |
| `03_CMS_Usage_Mapping.md` | Sanity vs Postgres boundary — Claude Code reads for data layer |
| `lms-database-schema.js` | Database schema reference |
| `lms-api-endpoints.js` | API endpoint reference |
| `hearth-badge-assessment-spec.md` | Badge flow — Claude Code reads for assessment implementation |
| `hearth-notification-system-spec.md` | Notification system — Claude Code reads for Phase 5 |
| `hearth-report-interaction-spec.md` | HEU Report interactions |
| `hearth-learner-profile-spec.md` | Learner Profile spec |
| `hearth-project-design-specification.md` | Project Experience architecture |

### Prototype Reference Strategy

Put all 19 HTML/JSX prototypes in `/prototypes/` in the repo. When building a screen, tell Claude Code:

```
Building the Retrospective Logger screen.
Visual reference: /prototypes/hearth-logger-workspace-v2.html
Extract the structure and rebuild with Tailwind and React state.
Do not copy inline styles — translate to Tailwind classes using the design tokens.
```

### Session Sizing

Each Claude Code session should target **one focused deliverable:**

- "Build the Drizzle schema for all tables"
- "Build the Logger form component"
- "Build the Portfolio feed with real data"
- "Wire up the entry save → enrichment → snapshot pipeline"

Avoid sessions that span multiple phases. Keep them scoped and verifiable.

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Drizzle schema doesn't match architecture spec | High | Review schema against `lms-database-schema.js` and AI Architecture spec before running migrations |
| Clerk family model doesn't map cleanly | Medium | Clerk Organizations could represent families — evaluate in Phase 0 |
| Sanity content model too complex for Phase 1 | Medium | Start with minimal schemas (pack, module, activity). Add depth in Phase 2 |
| Evidence photo storage on free tiers | Medium | Vercel Blob (free tier) or base64 in Postgres for MVP. Move to S3/Cloudflare R2 at scale |
| AI enrichment latency too high | Low | Haiku is fast (~1s). If slow, make enrichment fully async (user sees "processing" badge) |
| Serverless cold starts affect UX | Low | Vercel's ISR + Edge runtime for static-ish pages. API routes warm quickly |
| Single developer velocity | High | Phase 3 (core loop) is the gate. Ship that first, iterate on the rest. Don't try to ship all 19 screens at once |

---

## What to Do First (Literally Tomorrow)

1. Create the GitHub repo
2. Run `create-next-app` with the flags above
3. Sign up for Neon, Clerk, and Sanity (if not done)
4. Get `.env.local` populated with all keys
5. Copy prototype files into `/prototypes/`
6. Copy architecture docs into `/docs/`
7. Open Claude Code and start with: "Set up Tailwind config with Hearth design tokens"

You're closer than you think. The hard design work is done — now it's assembly.

---

## Appendix: Registry Discrepancy Note

PROJECT_STATUS.md says 18/19 screens (Notification Center not built). COMPONENT_REGISTRY_updated.md says 19/19 (Notification Center built with spec + prototype). The updated registry appears current — both `hearth-notification-centre-v1.html` and `hearth-notification-system-spec.md` exist in project files. **Recommend updating PROJECT_STATUS.md to reflect 19/19 complete before starting Claude Code work.**

---

*This plan is a living document. Update phase completion dates as you progress. Each phase's verification checklist is your definition of done.*
