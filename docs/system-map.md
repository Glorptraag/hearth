# System Map

> **Charted against:** main `82e3c51` (build 2026-10-19, in production). Table and schema counts below are as of that build; `docs/PROJECT_STATUS.md` § Data Layer is authoritative when they drift.

## 1. System Overview
Hearth is a Learning Management System (LMS) specifically tailored for Australian homeschool families, particularly those complying with Queensland (HEU) regulations. Unlike traditional "forward-planning" LMS platforms, Hearth prioritizes **retrospective logging**—capturing learning as it happens and using AI to map those "moments" to formal educational capabilities and compliance requirements.

## 2. Architecture Layers
- **Frontend:** Next.js 16 (App Router) using React 19. Styled with Tailwind CSS v4 using a custom "Mont Blanc Dark Coffee" theme.
- **Backend:** Next.js Server Components and API Routes. Authentication is handled by Clerk (Family-based model with RBAC: owner/editor/viewer).
- **Data:** PostgreSQL (Neon serverless) managed via Drizzle ORM (41 tables, plus the raw-SQL `pedagogy_knowledge_chunks` pgvector table for pedagogy retrieval). Content management is handled by Sanity CMS (content, capability taxonomy and the pedagogy knowledge base).
- **Payments:** Stripe for marketplace pack purchases.
- **Integrations:**
    - **Clerk:** Identity and multi-user family accounts with co-facilitator invites.
    - **Sanity:** Portable, philosophy-neutral learning content (Pack → Module → Approach → Activity hierarchy, plus Projects and Pedagogy Overlays).
    - **Anthropic (Claude Haiku):** Write-time AI enrichment — no runtime LLM calls. Enriches entries with subject detection, capability mapping, AC V9 descriptors and candidate DLO links, grounded by pedagogy passages retrieved from the PKB.
    - **Voyage AI:** embeddings for the pedagogy knowledge base (write-time and reembed only).
    - **Vercel Blob:** Evidence photo/document storage.

## 3. Key Modules
- `src/app/(auth)`: Core application experience — 20+ screens:
  - **Home:** Dashboard (learner rows, moments grid, desktop panel)
  - **Our Story:** Portfolio, HEU Report, Capabilities Constellation, Learner Profile
  - **Log:** Retrospective Logger (voice input, multi-child, subject selection)
  - **Explore:** Activity Discovery, Marketplace
  - **Build:** Module Builder (5 pathways), Badge Creator
  - **Experience:** Module Experience (prep/facilitate/log modes), Project Experience (multi-stage), Badge Assessment
  - **Settings:** Family Settings (pedagogy, HEU, notifications), Notification Centre
- `src/app/api`: 48 route files (65 handlers) — entries, badges, capabilities, planner, notifications, report, family, modules, stripe, admin.
- `src/components`: Shared UI primitives (`ui/`), layout components (`layout/`), screen-specific groups (`screens/`).
- `src/lib/db`: Drizzle schema (41 tables), client, migrations.
- `src/lib/ai`: AI enrichment pipeline — `enrich.ts` (Haiku enrichment, reads the family snapshot for active threads), `subjects-normalise.ts` (fills subjects from enrichment when the parent gave none), `pedagogy-context.ts` (PKB retrieval for the prompt), `keyword-matcher.ts` (fallback), `snapshot-rebuild.ts` (aggregation), `insights-feed.ts` (deterministic per-child "Hearth noticed" feed), `dlo-persistence.ts` (DLO rollup).
- `src/lib/pedagogy`: Pedagogy vocabulary adapter — maps 6 pedagogies (Charlotte Mason, Classical, Montessori, Waldorf, Unschooling, Eclectic) to UI terminology — plus the PKB engine (`retrieval.ts`, `embedding.ts`, `situational-signals.ts` mapping Logger chips to corpus tags) and the corpus compiler (`corpus/`).
- `src/sanity/schemas`: content schemas (pack, module, approach, activity, project, badge, assets), the capability taxonomy (domain, thread, discrete learning objective) and the pedagogy knowledge base (framework, source excerpt, practice pattern, observational marker, facilitation vocabulary, contraindication, worked example).
- `corpus/pedagogy/`: git-versioned PKB authoring vault (one markdown file = one Sanity document), licence-gated by `sources.json`.
- `docs/`: Canonical specifications and architectural decision logs.
- `prototypes/`: Original HTML/JSX prototypes (visual reference only).

## 4. Data Flow

### Primary: Retrospective Logging
1. **Capture:** Parent records a "Learning Moment" in the **Retrospective Logger** (or completes a **Module Experience** / **Project Stage**). The Logger's taps — activity type, observation chips, where, how long — travel with the entry.
2. **Persistence:** Entry saved to `learning_entries` in PostgreSQL with source tracking (`logger` | `module` | `project` | `import`) and the tapped context in `logger_context`.
3. **Retrieval:** `situational-signals.ts` maps the chips and child ages to corpus tags; `pedagogy-context.ts` pulls reviewed pedagogy passages from `pedagogy_knowledge_chunks` (behind `PEDAGOGY_KB_ENABLED`).
4. **Enrichment:** AI pipeline (Haiku) analyses the entry with the parent's structured notes, the child's active threads from the snapshot and the retrieved passages — detects subjects, maps capability threads and candidate DLOs, identifies AC V9 curriculum descriptors. DLO links land in `observation_dlo_links`. Token usage logged to `ai_pipeline_logs`.
5. **Synthesis:** `rebuildSnapshot()` aggregates entries into per-child capability profiles in `family_intelligence_snapshots` — active threads with first-evidence dates and trajectory, the per-child `recent_insights` feed, `weekStats`, and a monthly narrative that is regenerated only when its inputs change. `learner_dlo_status` is recomputed from the DLO links (parent confirmations count). Triggers badge threshold checks.
6. **Output:** Pre-computed data rendered across Dashboard ("Hearth noticed", This Week), Capabilities Constellation, HEU Report, and Portfolio — no runtime AI calls.

### Secondary: Module/Project Experience
1. Parent selects module/project from library or marketplace.
2. **Prep mode** shows materials, facilitator guidance, understanding indicators.
3. **Facilitate mode** runs a session timer, displays activity steps.
4. **Log mode** captures per-child engagement, discoveries, understanding level — creates a `learning_entry` with `sourceModuleId` / `sourceProjectId`.
5. Entry flows through standard enrichment pipeline.

### Tertiary: Compliance Reporting
1. Parent creates a compliance report (`compliance_reports` table) for a learner + year.
2. Six work sample slots created (`work_samples`): early/later writing, maths, choice area.
3. Parent assigns entries to slots, adds annotations (`work_sample_annotations`).
4. PDF export generates compliance document with curriculum coverage, work samples, and gap analysis.

## 5. Capability Mapping
- **Retrospective Logger** → `learning_entries` + Web Speech API (en-AU).
- **Module Experience** → `learning_entries` (source=module) + Sanity module/approach/activity content.
- **Project Experience** → `learning_entries` (source=project) + Sanity project/stage content + artifact capture.
- **Weekly Planner** → `planner_entries` + Sanity module library.
- **Our Story (Portfolio)** → `learning_entries` (filtered for evidence) + `learners` profile data.
- **Capabilities Constellation** → `family_intelligence_snapshots` (active threads, trajectory, first evidence) + `learner_dlo_status` + `observation_dlo_links` (Moments, incl. parent confirmations) + Sanity DLO catalogue.
- **Compliance Report** → `compliance_reports` + `work_samples` + `work_sample_annotations` + PDF generation.
- **Badges** → `badge_definitions` + `badge_awards` + `badge_assessment_logs` + threshold checks.
- **Compliance Tracking** → `capability_threads.ts` static data + AI enrichment layer.
- **Pedagogy Overlay** → Sanity `pedagogyOverlay` documents + `familySettings.pedagogyPreference` + vocabulary adapter.

## 6. Known Risks / Fragility
- **AI Latency:** Heavy reliance on AI for enrichment requires the snapshot caching strategy to maintain the "5-minute rule." All screens read pre-computed data.
- **Design Drift:** Risk of divergence if `hearth-canonical-design-tokens-v1.md` is not strictly followed. Conformance pass completed 2026-03-20.
- **Offline Support:** PWA service worker, `/offline` route and an IndexedDB Logger outbox (Aug 2026); photo evidence is not queued offline.

## 7. System Maturity
- **Phase:** Pre-Launch Hardening (Phase 1 MVP)
- **Screens:** 20+ auth-protected routes implemented, all conformant to design system.
- **Schema:** 41 Drizzle tables (through migration 0030) supporting family model, AI pipeline, outcome evidence (DLO links + status), badges, planner, compliance reports, community hearths, native push tokens; plus the raw-SQL PKB vector table.
- **Content:** Starter Pack seeded (121 Sanity docs, 79 activities).
- **RBAC:** `checkWritePermission()` gates all write endpoints to owner/editor roles.
- **Launch target:** 10-20 test families in Queensland, Australia.

## 8. Visual Diagrams (Mermaid)

### System Structure
```mermaid
graph TD
    User((Parent)) --> NextJS[Next.js 16 App Router]
    NextJS --> Clerk[Clerk Auth + RBAC]
    NextJS --> Drizzle[Drizzle ORM]
    Drizzle --> Neon[(Neon PostgreSQL — 41 tables)]
    Neon --- PKB[(pedagogy_knowledge_chunks — pgvector)]
    NextJS --> Sanity[Sanity CMS — content, capability taxonomy, PKB]
    NextJS --> AI[Anthropic Haiku — write-time only]
    AI --> Drizzle
    PKB -. retrieved passages .-> AI
    Sanity -- publish webhook, reviewed entries only --> Voyage[Voyage embeddings]
    Voyage --> PKB
    Vault[corpus/pedagogy vault] -- seed --> Sanity
    NextJS --> Blob[Vercel Blob — evidence storage]
    NextJS --> Stripe[Stripe — web-only pack payments]
```

### Core Data Flow (build 2026-10-19)
```mermaid
sequenceDiagram
    actor Parent
    Parent->>Logger: Log moment (text + chips, where, how long)
    Parent->>Module: Complete Module Activity
    Logger->>DB: Save entry + logger_context
    Module->>DB: Save entry (source=module)
    DB->>Signals: Chips + ages → corpus situation tags
    Signals->>PKB: Retrieve reviewed passages (flag-gated)
    DB->>AI: Enrich (notes, snapshot threads, passages)
    PKB-->>AI: Pedagogy context
    AI-->>DB: Capability threads, descriptors, observation_dlo_links
    DB->>Snapshot: Rebuild (threads, trajectory, recent_insights, weekStats)
    Note over Snapshot: Monthly narrative reused unless its inputs changed
    DB->>DLO: Recompute learner_dlo_status
    Parent->>Constellation: Confirm a DLO
    Constellation->>DB: observation_dlo_links (asserted)
    Snapshot-->>Dashboard: Hearth noticed + This Week
    Snapshot-->>Constellation: Threads, New / recent / trajectory
    DLO-->>Constellation: Four DLO states + Next to watch for
    DLO-->>Report: Coverage rollup
```
