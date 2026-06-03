# Plan: Hearth Three-Modes-of-Intelligence Refactor

> Pharao output — generated 2026-06-02. Source: `/Users/drewdouglas/.claude/plans/q1latter-q2-facilitate-entry-fuzzy-barto.md` (approved).
> 35 tasks across 6 phases. Designed for 2–4 parallel Claude Code terminals.

## Overview

Coordinated refactor that (a) fixes six concrete bugs (evidence persistence, module-run telemetry, in-module Logger redundancy, contextually-blind Logger, offline photo upload, planner↔logger join), (b) pivots Marketplace, Library, and Explore into distinct intelligence modes, and (c) puts a structured-subview snapshot API underneath all of them. Phase 1 lays additive schema. Phase 2 ships the fixes. Phase 3 builds the subview API + pedagogy-aware ranking. Phase 4 turns Library into a status board with an expansive Browse tab. Phase 5 strips Explore's catalog function and rebuilds it as snapshot-driven insight. Phase 6 wires the Marketplace.

---

## Phases

### Phase 1 — Data Foundations

Additive, reversible, no UI impact. Drizzle migration + Sanity schema fields land here.

#### Task 1.1: Drizzle migration — module_runs, evidence, FKs, soft-delete `[OPUS]`
- **Description**: Single additive migration adds `module_runs` table (id, familyId FK, sanityModuleId, approachId, learnerIds uuid[], state text CHECK in ['active','paused','finished','abandoned'], sessionType text, startedAt, lastActiveAt, finishedAt, materialsState jsonb, device text, indexes on (familyId,state) and (familyId,sanityModuleId)); `learning_entry_evidence` table (id, entryId FK, kind text CHECK in ['photo','quote','note','link','audio'], content, caption, metadata jsonb, createdAt, index on entryId); nullable `moduleRunId uuid` FK and `plannerEntryId uuid` FK on `learning_entries`; nullable `removedAt timestamp` on `family_library`. Drops existing partial unique indexes on `family_library` and rewrites them with `WHERE removedAt IS NULL` so re-adds after soft-delete succeed. No `quickCaptureCache` column (Q4).
- **Files**: `drizzle/0022_module_runs_evidence_library.sql` (or next-numbered)
- **Done when**: `npm run db:push` (or drizzle-kit migrate) applies clean against a fresh Neon branch; down-migration reverses without orphaning data; integration smoke-test inserting one row of each new table survives a truncate cycle.
- **Parallel group**: A

#### Task 1.2: Mirror new tables in `src/lib/db/schema.ts` `[SONNET]`
- **Description**: Add `moduleRuns` and `learningEntryEvidence` `pgTable` definitions with full column types, FKs, and `InferSelectModel`/`InferInsertModel` exports. Add `moduleRunId` + `plannerEntryId` columns to `learningEntries`. Add `removedAt` to `familyLibrary` and re-declare its partial unique indexes to match 1.1's SQL.
- **Files**: `src/lib/db/schema.ts`
- **Done when**: `npm run typecheck` passes; new types importable from elsewhere.
- **Gate**: Blocked on 1.1 — SQL truth precedes TS mirror.
- **Parallel group**: B

#### Task 1.3: Extend vitest integration truncate list `[SONNET]`
- **Description**: Add `module_runs` and `learning_entry_evidence` to `TABLES_TO_TRUNCATE` in the integration setup. Ordering must respect FK dependencies (truncate evidence before entries before runs).
- **Files**: `vitest.integration.setup.ts`
- **Done when**: All existing integration tests still green; new tables truncate cleanly between tests.
- **Gate**: Blocked on 1.1.
- **Parallel group**: B

#### Task 1.4: Test factories for runs and evidence `[SONNET]`
- **Description**: Add `createModuleRun(db, {...})` and `createEvidence(db, {...})` to `src/test/db-factories.ts`. Add `seedActiveModuleRun(db)` scenario seeder bundling a family + learner + library row + active run + one quick-capture evidence row.
- **Files**: `src/test/db-factories.ts`
- **Done when**: A new throwaway integration test uses the seeders, creates a run with evidence, and retrieves it.
- **Gate**: Blocked on 1.2.
- **Parallel group**: C

#### Task 1.5: Sanity module schema additions `[SONNET]`
- **Description**: Add to `src/sanity/schemas/module.ts`: `sessionType` list field (options `[{value:'sustained',title:'Active sustained session'},{value:'open_ended',title:'Open-ended drop-and-pickup'}]`, `initialValue: 'sustained'`); sibling `idleDaysBeforeAutoClose number` (default 14 for sustained, null for open_ended); `previewActivityRef` reference to activity; `availability` list (included|premium) mirroring pack. No reads change yet.
- **Files**: `src/sanity/schemas/module.ts`
- **Done when**: Sanity Studio renders new fields; `sanity deploy` succeeds; existing modules unaffected.
- **Parallel group**: A

#### Task 1.6: Sanity backfill script `[SONNET]`
- **Description**: Node script using Sanity client + write token, sets `sessionType='sustained'` on every published module where the field is null. Accepts a flag list (CLI arg or editorial JSON in `scripts/data/open-ended-modules.json`) to set specific slugs to `open_ended` (initial list: nature journal, sketchbook practice, instrument practice, garden observations — finalize with editorial). Idempotent.
- **Files**: `scripts/sanity-backfill-session-type.mjs` (new), `scripts/data/open-ended-modules.json` (new)
- **Done when**: GROQ `*[_type=="module" && !defined(sessionType)]` returns empty.
- **Gate**: Blocked on 1.5.
- **Parallel group**: B

---

### Phase 2 — Critical Fixes

Five fix streams. Feature-flag the `module_runs` writes via `MODULE_RUNS_ENABLED=true`.

#### Task 2.1: Evidence persistence transaction + audio upload route `[OPUS]`
- **Description**: Refactor `POST /api/entries` to accept `evidence: [{kind, content, caption?, metadata?}]` alongside legacy `evidenceUrls`. Single transaction: insert entry → insert evidence rows. Keep writing photo URLs into `evidenceUrls` for backward-compat (2-cycle deprecation window; comment the cleanup target). Rename `derivePhotoEvidenceUrls` → `derivePhotoEvidenceUrlsLegacy`; add `deriveEvidenceRows`. Extend `GET /api/entries/[id]` to join evidence. New `POST /api/evidence/audio-upload` mirroring photo upload route — accepts audio blob (webm/m4a), pushes to Vercel Blob, returns signed URL.
- **Files**: `src/app/api/entries/route.ts`, `src/app/api/entries/[id]/route.ts`, `src/lib/logger/entry-payload.ts`, `src/app/api/evidence/audio-upload/route.ts` (new)
- **Done when**: Integration test POSTs an entry with all five evidence kinds, GETs it back, all five present; legacy `evidenceUrls` still populated for photos.
- **Gate**: Blocked on 1.4.
- **Parallel group**: D

#### Task 2.2: EvidenceModal audio branch `[SONNET]`
- **Description**: Add audio capture mode to `EvidenceModal`. Use `MediaRecorder` for in-browser record (start/stop, level meter optional) with `<input type="file" accept="audio/*">` fallback for browsers without permission. Uploads via 2.1's audio-upload route. Stores `{durationMs, mimeType}` in metadata. Caption field works the same as photo.
- **Files**: `src/app/(auth)/log/_components/EvidenceModal.tsx`
- **Done when**: Manual: record 5s audio, save entry, entry persists `learning_entry_evidence` row with kind='audio' and a playable URL.
- **Gate**: Blocked on 2.1.
- **Parallel group**: E

#### Task 2.3: module_runs API surface `[OPUS]`
- **Description**: Four routes (all Clerk-auth, family-scoped via the request user's `familyId`):
  - `POST /api/module-runs` — body `{sanityModuleId, approachId, learnerIds, sessionType, device?}`. Creates row with `state='active'`, returns `{id, ...}`.
  - `PATCH /api/module-runs/[id]` — body `{lastActiveAt?, materialsState?, state?}`. Touches `lastActiveAt`. State transitions validated (no jumping past abandoned).
  - `POST /api/module-runs/[id]/finish` — transitions `state='finished'`, sets `finishedAt`.
  - `POST /api/module-runs/[id]/abandon` — transitions `state='abandoned'`, sets `finishedAt`.
  - `GET /api/module-runs?state=active` — list for current family.
- **Files**: `src/app/api/module-runs/route.ts` (new), `src/app/api/module-runs/[id]/route.ts` (new), `src/app/api/module-runs/[id]/finish/route.ts` (new), `src/app/api/module-runs/[id]/abandon/route.ts` (new)
- **Done when**: Integration test exercises `start → patch (multiple) → finish` for a sustained run, and `start → patch → patch → second-day-resume (same id returned by GET)` for an open_ended run.
- **Gate**: Blocked on 1.4.
- **Parallel group**: D

#### Task 2.4: FacilitateMode lifecycle wiring `[OPUS]`
- **Description**: On the Start click in Facilitate, POST to `/api/module-runs` and store `runId` in component state + localStorage. Debounced PATCH on activity index change (lastActiveAt + state-stay). For `sessionType==='open_ended'`, Finish button copy changes to "Pause for now / Wrap up" and Pause leaves state `active`; for `sessionType==='sustained'`, Finish transitions to `finished`. Carry `runId` into LogMode via shared parent state. Resume path: if a localStorage `runId` exists and `GET /api/module-runs?state=active` returns it, reattach instead of starting a new run.
- **Files**: `src/app/(auth)/module/[id]/_components/FacilitateMode.tsx`
- **Done when**: A run started in Facilitate appears in `GET /api/module-runs?state=active`; open_ended pause → return next session → resume same runId.
- **Gate**: Blocked on 2.3.
- **Parallel group**: F

#### Task 2.5: Extract CaptureTray + wire as Capture button in FacilitateMode `[SONNET]`
- **Description**: Pull the modality-aware capture body out of `EvidenceModal` into a new shared `<CaptureTray />` component (five tabs: photo, quote, note, link, audio). `EvidenceModal` composes the tray with its existing chrome (no behavior change). Replace the existing in-module "Logger" button in `FacilitateMode` with a Capture button that opens `CaptureTray` inline. Captures persist to `localStorage` during the run (Q4); they're carried into LogMode at Finish via shared parent state, pre-populating the evidence section. Delete the in-module full-Logger entry point.
- **Files**: `src/components/log/CaptureTray.tsx` (new), `src/app/(auth)/log/_components/EvidenceModal.tsx`, `src/app/(auth)/module/[id]/_components/FacilitateMode.tsx`
- **Done when**: EvidenceModal renders identically from user POV; manual flow in Facilitate: Capture → quote → entered into localStorage → enters LogMode → evidence section pre-populated.
- **Gate**: Blocked on 2.4 (Capture button is added to the same FacilitateMode rewrite touched by 2.4 — sequence to avoid merge churn).
- **Parallel group**: F

#### Task 2.6: Logger contextual proposals banner `[OPUS]`
- **Description**: On `/log` mount, fetch `GET /api/module-runs?state=active`, `GET /api/library?recentlyAdded=7d`, `GET /api/planner?days=2`. If any matches found, render a `<ContextualProposals />` banner above the form: "Attach to: [active run X] / [planned Y today at 9am] / [pack Z added Tuesday]". Tapping an item pre-fills `sourceModuleId`, `moduleRunId`, `plannerEntryId`, and `sourceActivityIds` in the entry payload. Reuses `AttachToModuleModal`'s mental model but proactively, not opt-in post-save.
- **Files**: `src/app/(auth)/log/page.tsx`, `src/components/log/ContextualProposals.tsx` (new)
- **Done when**: Manual: start a run in Facilitate, exit without finishing → open `/log` → banner offers to attach; attach → save → entry row has `moduleRunId` populated.
- **Gate**: Blocked on 2.3.
- **Parallel group**: G

#### Task 2.7: Offline queue for photo + audio `[OPUS]`
- **Description**: Extend `src/lib/offline-queue.ts` to enqueue `{file, kind, captureContext}` when upload fetch rejects or `navigator.onLine === false`. Render `local://` pseudo-URL previews via `URL.createObjectURL`. `useOnlineStatus`-driven retry drains queue on reconnect, POSTs to the appropriate upload route, swaps `local://` → remote URL in any in-flight draft. Save with pending uploads still allowed: entry row's evidence persists with `pending_upload: true` metadata; sweep on next online patches the row with real URLs.
- **Files**: `src/lib/offline-queue.ts`, `src/app/(auth)/log/_components/EvidenceModal.tsx`, `src/components/log/CaptureTray.tsx`
- **Done when**: Manual airplane-mode test: capture photo + audio in Facilitate, save entry, entry persists with placeholders, reconnect, evidence rows patched.
- **Gate**: Blocked on 2.1 + 2.2 + 2.5.
- **Parallel group**: H

#### Task 2.8: LogMode runId + plannerEntryId carry `[SONNET]`
- **Description**: Read `runId` and (if applicable) `plannerEntryId` from parent state, include in entry POST body. Update entry-create payload type. Evidence array now includes pre-populated quick captures from FacilitateMode's localStorage.
- **Files**: `src/app/(auth)/module/[id]/_components/LogMode.tsx`
- **Done when**: Integration test: full module → log flow produces `learning_entries` row with `moduleRunId` populated; quick-captured evidence persists.
- **Gate**: Blocked on 2.1 + 2.4.
- **Parallel group**: F

#### Task 2.9: Phase 2 test sweep `[SONNET]`
- **Description**: Unit cover `deriveEvidenceRows` for all 5 kinds in `src/lib/logger/entry-payload.test.ts`. Integration extend `src/app/api/entries/route.integration.test.ts` for the 5-kind round-trip including dual-write to `evidenceUrls`. New `src/app/api/module-runs/route.integration.test.ts` for lifecycle (sustained start→finish, open_ended pause/resume). Offline queue retry test if testable at integration level (mock `navigator.onLine`).
- **Files**: `src/lib/logger/entry-payload.test.ts`, `src/app/api/entries/route.integration.test.ts`, `src/app/api/module-runs/route.integration.test.ts` (new)
- **Done when**: All new tests green; pre-existing tests still green.
- **Gate**: Blocked on 2.1 + 2.3 + 2.4 + 2.5 + 2.6 + 2.7 + 2.8.
- **Parallel group**: I

---

### Phase 3 — Snapshot Intelligence Subview API

Read-only surface. Substrate (`snapshot-rebuild.ts`, `family_intelligence_snapshots`) stays. Subviews are projections; incrementalization deferred.

#### Task 3.1: Restore pedagogyValues in use-pedagogy hook `[SONNET]`
- **Description**: One-line fix — include `pedagogyValues` from the `/api/family` (or wherever it's read) response in the returned state of `usePedagogy()`. Downstream consumers (zero-state, recommend) will read it.
- **Files**: `src/hooks/use-pedagogy.ts`
- **Done when**: Hook returns `pedagogyValues`; typecheck passes.
- **Parallel group**: J

#### Task 3.2: Extend module GROQ queries for lens bundles + MODULE_BROWSE_QUERY `[SONNET]`
- **Description**: Project `pedagogyLensBundles[]` and `methodologyOverlays[]` in `MODULE_DETAIL_QUERY`. Add new `MODULE_BROWSE_QUERY` that lists all modules across the family's library packs + standalone modules, with the same projection plus subject/age/modality summary and `sessionType`.
- **Files**: `src/lib/sanity/queries.ts`
- **Done when**: Queries return new fields; both queries usable from API routes.
- **Parallel group**: J

#### Task 3.3: Pedagogy-aware scoreModules + RecommendationReason `[OPUS]`
- **Description**: Add optional `pedagogyContext: {pedagogyKey, values, practices}` arg to `scoreModules`. Introduce `W_PEDAGOGY = 0.15`. Rebalance to spark 0.30 / gap 0.25 / pedagogy 0.15 / repeat 0.12 / energy 0.08 / recency 0.10. Pedagogy score = overlap of `module.methodAffinity.pedagogies` with family `pedagogyKey` + proportional overlap of `module.methodAffinity.interpretivePatterns` with family `pedagogyPractices`, **added not gated**. Add `'pedagogy_match'` to `RecommendationReason` union; extend `buildReasonText` to phrase via pedagogy adapter. Unit test the Q10 invariant: Montessori family + book-heavy CM module still surfaces on spark/gap merit.
- **Files**: `src/lib/ai/recommend.ts`, `src/lib/ai/recommend.test.ts`, `src/types/snapshot.ts`
- **Done when**: All recommend tests green; invariant test explicit; pedagogy_match appears in reason output when applicable.
- **Gate**: Blocked on 3.1 + 3.2.
- **Parallel group**: K

#### Task 3.4: `/api/snapshot/gaps` `[SONNET]`
- **Description**: Projects `children[*].gap_analysis.underserved_subjects` + `suggested_focus_threads`. Adds cross-learner aggregate (subjects underserved for ALL learners vs ONE).
- **Files**: `src/app/api/snapshot/gaps/route.ts` (new)
- **Done when**: Returns shape per `src/types/snapshot.ts` extension; integration test against seeded family.
- **Parallel group**: J

#### Task 3.5: `/api/snapshot/trajectory/[learnerId]` `[SONNET]`
- **Description**: Per-learner projection of `active_threads[*]` with `trajectory`, `recent_evidence_quality`, `next_badge_progress`.
- **Files**: `src/app/api/snapshot/trajectory/[learnerId]/route.ts` (new)
- **Done when**: Returns shape; integration test.
- **Parallel group**: J

#### Task 3.6: `/api/snapshot/next` (pedagogy-aware) `[OPUS]`
- **Description**: Runs `scoreModules` with `pedagogyContext` server-side, filters to in-library inventory (joins `family_library`), returns top N modules. Each result includes `primary_reason` and human-phrased reason.
- **Files**: `src/app/api/snapshot/next/route.ts` (new)
- **Done when**: Returns module list with reasons; pedagogy_match surfaces when applicable; in-library filter holds.
- **Gate**: Blocked on 3.3.
- **Parallel group**: K

#### Task 3.7: `/api/snapshot/momentum` `[SONNET]`
- **Description**: Pure SQL — capability threads with ≥2 entries in last 14 days, joined to `thread_links`. Returns ranked list with sample evidence entry IDs.
- **Files**: `src/app/api/snapshot/momentum/route.ts` (new)
- **Done when**: Returns shape; integration test seeds 3 entries on one thread and asserts inclusion.
- **Parallel group**: J

#### Task 3.8: `/api/snapshot/freshness` `[SONNET]`
- **Description**: Per-learner last-evidence-by-thread; surfaces threads with no recent evidence (>21d configurable). Pure SQL.
- **Files**: `src/app/api/snapshot/freshness/route.ts` (new)
- **Done when**: Returns shape; integration test.
- **Parallel group**: J

#### Task 3.9: `/api/snapshot/zero-state` (Q3 moment-to-win) `[OPUS]`
- **Description**: Used when `family.total_entries === 0` (or `total_entries < 3`). Blends `family_settings.{pedagogyPreference, pedagogyValues, pedagogyPractices}` + each learner's `profileData.interests` + Sanity `pedagogyLensBundles` (matched by `pedagogyKey`) to produce 5 strong starter recommendations. Reads pedagogy directly; does NOT require a snapshot rebuild. Reuses `scoreModules` with `pedagogyContext` but with `W_PEDAGOGY` boosted to 0.40 since spark/gap signal is absent.
- **Files**: `src/app/api/snapshot/zero-state/route.ts` (new)
- **Done when**: New-family integration test (zero entries) returns a non-empty, pedagogy-aligned list with reasons phrased via the adapter.
- **Gate**: Blocked on 3.1 + 3.2 + 3.3.
- **Parallel group**: K

---

### Phase 4 — Library as Status Board

Library absorbs the catalog-browse function so Phase 5 can strip Explore.

#### Task 4.1: `/api/library/status` derived endpoint `[OPUS]`
- **Description**: Returns `LibraryItem & {status, lastActivityAt, openRunId?, plannedDates?[], runCount, materialsReady?: boolean}` for every library item. Status derived: `in_flight` (open `module_runs` row), `planned` (planner row within 7d), `recently_used` (entry within 14d), `abandoned` (open run with `lastActiveAt` older than `idleDaysBeforeAutoClose`, OR no entry in 30d after start), `untouched` (never run/planned). Reads pure SQL across `module_runs` + `planner_entries` + `learning_entries`.
- **Files**: `src/app/api/library/status/route.ts` (new)
- **Done when**: Integration test with seeded mixed-history family returns correct status for each item.
- **Gate**: Blocked on 2.3 (module_runs writes happening).
- **Parallel group**: L

#### Task 4.2: Soft-delete library + includeRemoved `[SONNET]`
- **Description**: New `DELETE /api/library/[id]` sets `removedAt = now()`. `GET /api/library` filters `WHERE removedAt IS NULL` by default; `?includeRemoved=true` returns all. Re-add path checks for a soft-deleted row and clears `removedAt` instead of inserting a duplicate (partial unique index would block insert anyway). Idempotent.
- **Files**: `src/app/api/library/route.ts`, `src/app/api/library/[id]/route.ts` (new)
- **Done when**: Integration test covers remove → re-add round-trip; partial unique index unviolated.
- **Gate**: Blocked on 1.1.
- **Parallel group**: M

#### Task 4.3: Materials aggregation helper `[SONNET]`
- **Description**: New `src/lib/sanity/materials-aggregate.ts` walks `module.approaches[].activities[].materials[]` inline rows, dedupes by name, returns canonical list with `{name, required, alternative?}`. Powers per-run checklist.
- **Files**: `src/lib/sanity/materials-aggregate.ts` (new)
- **Done when**: Unit test against fixture module yields deduped material list with required flags preserved.
- **Parallel group**: N

#### Task 4.4: PrepMode per-run materials checklist `[SONNET]`
- **Description**: Render checklist from materials-aggregate output. Persist `{haveIt: boolean, source?: 'kit'|'home'|'sub'}` per material key into `module_runs.materialsState` via PATCH (existing route from 2.3). Disabled before run exists. For sustained sessionType, checklist appears before Start; for open_ended, accessible from PrepMode anytime. "Materials ready" flag derived from all required materials being ticked.
- **Files**: `src/app/(auth)/module/[id]/_components/PrepMode.tsx`
- **Done when**: Manual: tick a material in PrepMode → reload → check persists; `materialsReady` derives correctly.
- **Gate**: Blocked on 2.3 + 4.3.
- **Parallel group**: N

#### Task 4.5: LibraryClient 4-tab restructure `[OPUS]`
- **Description**: Restructure existing 3-tab interface to 4 tabs. "Modules (in use)" filters status to `in_flight | planned | recently_used`, sorted by `lastActivityAt`, status badges visible. Packs tab gains status rollup ("3 modules in flight"). Materials tab extended with per-run checklist links (deep link to PrepMode). Browse tab is a placeholder shell that 4.6 fills.
- **Files**: `src/app/(auth)/library/LibraryClient.tsx`
- **Done when**: All existing functions intact; 4th tab placeholder renders; status badges show.
- **Gate**: Blocked on 4.1.
- **Parallel group**: L

#### Task 4.6: Library Browse tab — expansive catalog `[OPUS]`
- **Description**: Full catalog browser of every module in the family's owned packs + standalone library-modules. Subject / age-range / modality filters. Sort by relevance (calls `/api/snapshot/next`), newest, or "for our pedagogy" (re-sorts by pedagogy score only). Card preview opens module preview modal; "Start Now" routes to `/module/[id]`; "+ Planner" adds to today's planner. Uses `MODULE_BROWSE_QUERY` from 3.2. This is the new home of what `/explore/activities` currently does.
- **Files**: `src/app/(auth)/library/_components/BrowseTab.tsx` (new), `src/app/(auth)/library/LibraryClient.tsx`
- **Done when**: Every module reachable today via `/explore/activities` is reachable here; relevance sort uses pedagogyContext; "Start Now" + "+ Planner" both round-trip.
- **Gate**: Blocked on 4.5 + 3.2 + 3.6.
- **Parallel group**: O

#### Task 4.7: Recently-removed drawer + restore CTA `[SONNET]`
- **Description**: New `<RecentlyRemovedDrawer />` fetches `GET /api/library?includeRemoved=true&status=removed` and lists soft-deleted items with a Restore button (POSTs to `/api/library` with the original `sanityPackId`/`sanityModuleId`, which clears `removedAt`).
- **Files**: `src/app/(auth)/library/_components/RecentlyRemovedDrawer.tsx` (new), `src/app/(auth)/library/LibraryClient.tsx`
- **Done when**: Manual remove → drawer shows → restore → item back in main lists.
- **Gate**: Blocked on 4.2 + 4.5.
- **Parallel group**: M

#### Task 4.8: Phase 4 integration tests `[SONNET]`
- **Description**: Full status-board lifecycle (add → plan → start → log → soft-delete → orphan-tolerance). Re-add after soft-delete works. Stale module-title tolerance in `/our-story` and `/portfolio` reads (orphan entry renders gracefully).
- **Files**: `src/app/api/library/status/route.integration.test.ts` (new), `src/app/api/library/route.integration.test.ts` (extend)
- **Done when**: All green.
- **Gate**: Blocked on 4.1 + 4.2 + 4.6 + 4.7.
- **Parallel group**: P

---

### Phase 5 — Explore Pivot

Strip `/explore/activities`, rebuild `/explore` as snapshot-driven insight.

#### Task 5.1: Delete /explore/activities + permanent redirect `[SONNET]`
- **Description**: Delete `src/app/(auth)/explore/activities/page.tsx` and any sibling files. Add a 308 redirect from `/explore/activities` → `/library?tab=browse` in `next.config.ts` (or middleware). Stale bookmarks resolve.
- **Files**: delete `src/app/(auth)/explore/activities/page.tsx`, edit `next.config.ts`
- **Done when**: GET `/explore/activities` 308s to `/library?tab=browse`.
- **Gate**: Blocked on 4.6 (Browse tab fully functional and parity-verified).
- **Parallel group**: Q

#### Task 5.2: Rebuild `/explore` as insight surface `[OPUS]`
- **Description**: Five cards in a vertical stack on mobile, grid on desktop:
  1. *What's emerging* — `/api/snapshot/momentum` — 3 hot threads, one-line evidence each.
  2. *What's working* — engagement-positive entries last 14d (filter `learning_entries.engagementPerLearner` to `loved | engaged`, dedupe by activity).
  3. *Worth doing next* — `/api/snapshot/next` — 3 module cards, link to module detail; pedagogy lens as badge + one-line reason (Q10: lens, not filter).
  4. *Quiet corners* — `/api/snapshot/freshness` — threads or learners with no recent evidence.
  5. *Zero state opener* — only when `family.total_entries === 0` — `/api/snapshot/zero-state` as hero card: "Most [pedagogy] families start with…" (Q3 moment-to-win).
  Apply `getPedagogyVocabulary`, `adaptGapMessage`, `adaptCelebration` from the adapter to every heading and reason.
- **Files**: `src/app/(auth)/explore/page.tsx`
- **Done when**: Page renders for seeded families at week 0 / week 4 / week 12 with materially different content; zero-state only shows when entries empty; adapter copy reflects pedagogy.
- **Gate**: Blocked on 3.4 + 3.6 + 3.7 + 3.8 + 3.9.
- **Parallel group**: R

#### Task 5.3: Explore snapshot/component tests `[SONNET]`
- **Description**: Snapshot tests for `/explore` rendered at week 0 (zero-state), week 4 (mixed), week 12 (full). Assert pedagogy-adapter copy differs between two pedagogies on identical data.
- **Files**: `src/app/(auth)/explore/page.test.tsx` (new)
- **Done when**: Tests green.
- **Gate**: Blocked on 5.2.
- **Parallel group**: S

---

### Phase 6 — Marketplace Intelligence

#### Task 6.1: Family Fit wired via `/api/snapshot/gaps` `[OPUS]`
- **Description**: Replace the client-side stub in `MarketplaceShell` with server data from `/api/snapshot/gaps`. Per-pack fit score = pedagogy boost + gap overlap + spark overlap (mirrors recommend.ts weights). No filtering — chip colors card and feeds order of the "recommended" lane. Q10 invariant: pedagogy is additive only; every pack remains visible.
- **Files**: `src/app/(auth)/explore/marketplace/MarketplaceShell.tsx`
- **Done when**: Family with Science gaps sees Science-heavy packs rise; Montessori family still sees book-heavy CM packs surface (Q10 invariant test in 6.6).
- **Gate**: Blocked on 3.4.
- **Parallel group**: T

#### Task 6.2: Marketplace search via Postgres FTS `[SONNET]`
- **Description**: New `GET /api/marketplace/search?q=...` — Postgres full-text over pack/module title + subjects + thread descriptors. May require a small SQL migration enabling `pg_trgm` and adding a tsvector column or index. No Sanity GROQ search.
- **Files**: `src/app/api/marketplace/search/route.ts` (new), possibly `drizzle/0023_marketplace_fts.sql`
- **Done when**: Search round-trips for title fragment, subject, thread descriptor.
- **Parallel group**: U

#### Task 6.3: Module-only browse in Marketplace `[SONNET]`
- **Description**: Add `?kind=module` filter to marketplace grid. Surface standalone modules as first-class items using their `availability` field (added in 1.5). Reuse pack card patterns. Minimum viable list-as-cards; full module-marketplace UX deferred.
- **Files**: `src/app/(auth)/explore/marketplace/MarketplaceShell.tsx`
- **Done when**: Toggle filter to "modules" shows standalone modules; "packs" shows packs.
- **Gate**: Blocked on 6.1.
- **Parallel group**: T

#### Task 6.4: Preview-before-add `[SONNET]`
- **Description**: If `module.previewActivityRef` is set (Phase 1 schema addition), surface a preview activity from the pack detail page (or standalone module detail). Reuses activity rendering primitives.
- **Files**: `src/components/pack/PackDetail.tsx`, `src/app/(auth)/explore/marketplace/_components/ModulePreview.tsx` (new if needed)
- **Done when**: Manual: open a pack whose first module has `previewActivityRef` set → preview surfaces in detail page.
- **Parallel group**: V

#### Task 6.5: Soft-removal CTA in Library + Marketplace `[SONNET]`
- **Description**: Add "Remove" affordance on library cards (Library Modules + Packs tabs) and the "In Library" state on pack detail in Marketplace. POSTs to `DELETE /api/library/[id]`. Confirms with a tiny modal.
- **Files**: `src/app/(auth)/library/LibraryClient.tsx`, `src/components/pack/PackDetailCta.tsx`
- **Done when**: Manual round-trip remove → re-add from both surfaces.
- **Gate**: Blocked on 4.2 + 4.5.
- **Parallel group**: W

#### Task 6.6: Phase 6 integration tests `[SONNET]`
- **Description**: Q10 invariant test — Montessori family still sees book-heavy CM packs surface. Family-fit ordering test. Search round-trips. Soft-removal round-trips through Marketplace surface.
- **Files**: `src/app/(auth)/explore/marketplace/marketplace.integration.test.ts` (new), `src/app/api/marketplace/search/route.integration.test.ts` (new)
- **Done when**: All green.
- **Gate**: Blocked on 6.1 + 6.2 + 6.3 + 6.4 + 6.5.
- **Parallel group**: X

---

## Dependency Graph

```
Phase 1 (data foundations)
  1.1 ──┬──► 1.2 ──┬──► 1.3
        │         └──► 1.4
        └──► 4.2 (soft-delete uses removedAt)
  1.5 ──► 1.6
  1.5 ──► 6.4 (previewActivityRef)

Phase 2 (critical fixes)
  1.4 ──► 2.1 ──┬──► 2.2 ──┐
                ├──► 2.7 ──┤
                ├──► 2.8 ──┤
                └──► 2.9   │
  1.4 ──► 2.3 ──┬──► 2.4 ──┬──► 2.5 ──► 2.7
                │          ├──► 2.8
                │          └──► 2.9
                └──► 2.6 ──► 2.9
  2.5, 2.6, 2.7, 2.8 ──► 2.9

Phase 3 (subview API)
  3.1 ──┐
  3.2 ──┴──► 3.3 ──┬──► 3.6
                   └──► 3.9
  3.4, 3.5, 3.7, 3.8 — independent subviews

Phase 4 (status board)
  2.3 ──► 4.1 ──► 4.5 ──► 4.6 ──► 4.8
  1.1 ──► 4.2 ──► 4.7 ──► 4.8
  4.3 ──► 4.4
  2.3 ──► 4.4
  3.2, 3.6 ──► 4.6

Phase 5 (Explore pivot)
  4.6 ──► 5.1
  3.4, 3.6, 3.7, 3.8, 3.9 ──► 5.2 ──► 5.3

Phase 6 (Marketplace)
  3.4 ──► 6.1 ──► 6.3 ──► 6.6
  4.2 + 4.5 ──► 6.5 ──► 6.6
  6.2, 6.4 ──► 6.6
```

---

## Parallel Execution Guide

Phases gate at boundaries: Phase 2 starts after Phase 1 is fully green; Phase 4 starts after Phase 2 has baked ~1 week against test families (per the plan's risk note); Phase 5 starts after Phase 4 Browse tab is parity-verified.

| Terminal | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 |
|----------|---------|---------|---------|---------|---------|---------|
| T1 | 1.1 → 1.2 → 1.3 | 2.1 → 2.2 → 2.7 | 3.3 → 3.6 → 3.9 | 4.1 → 4.5 → 4.6 | 5.2 → 5.3 | 6.1 → 6.3 → 6.6 |
| T2 | 1.5 → 1.6 | 2.3 → 2.4 → 2.5 → 2.8 | 3.1 + 3.2 → 3.4 | 4.2 → 4.7 | 5.1 | 6.2 → 6.5 |
| T3 |  (1.4 after 1.2) | 2.6 | 3.5, 3.7, 3.8 | 4.3 → 4.4 | — | 6.4 |
| T4 | — | 2.9 (sweep at phase end) | — | 4.8 (sweep at phase end) | — | — |

**Notes on this assignment:**
- T1 carries the Opus-heavy spine; T2 carries the schema/API parallel work; T3 handles lightweight extractions and SQL routes; T4 is a roving test/integration terminal that activates at phase-end sweeps.
- Within Phase 3, T1's 3.3 (pedagogy recommend refactor) unblocks T1's 3.6 + 3.9; T3 runs the four independent subview endpoints (3.4 / 3.5 / 3.7 / 3.8) in any order.
- Phase 2 sequencing on T1/T2 is set so 2.4 lands before 2.5 (CaptureTray wiring sits inside the same FacilitateMode rewrite — avoid merge churn).

---

## Status

| Task | Status | Completed By |
|------|--------|-------------|
| 1.1 | ✅ | T1 |
| 1.2 | ✅ | T1 |
| 1.3 | ✅ | T1 (auto via schema.ts) |
| 1.4 | ✅ | T1 |
| 1.5 | ✅ | T1 |
| 1.6 | ✅ | T1 (script + execution) |
| 2.1 | ✅ | T1 |
| 2.2 | ✅ | T1 |
| 2.3 | ✅ | T2 |
| 2.4 | ✅ | T2 |
| 2.5 | ✅ | T2 (CaptureTray merged with T1 audio) |
| 2.6 | ✅ | main-session |
| 2.7 | ✅ | main-session |
| 2.8 | ✅ | main-session |
| 2.9 | ✅ | main-session |
| 3.1 | ✅ | T2 |
| 3.2 | ✅ | T2 |
| 3.3 | ✅ | main-session |
| 3.4 | ✅ | T2 |
| 3.5 | ✅ | main-session |
| 3.6 | ✅ | main-session |
| 3.7 | ✅ | main-session |
| 3.8 | ✅ | main-session |
| 3.9 | ✅ | main-session |
| 4.1 | ✅ | main-session |
| 4.2 | ✅ | main-session |
| 4.3 | ✅ | main-session |
| 4.4 | ✅ | main-session |
| 4.5 | ✅ | main-session |
| 4.6 | ✅ | main-session |
| 4.7 | ✅ | main-session |
| 4.8 | ✅ | main-session |
| 5.1 | ⬜ |  |
| 5.2 | ⬜ |  |
| 5.3 | ⬜ |  |
| 6.1 | ⬜ |  |
| 6.2 | ⬜ |  |
| 6.3 | ⬜ |  |
| 6.4 | ⬜ |  |
| 6.5 | ⬜ |  |
| 6.6 | ⬜ |  |

---

## Session Prompts

Each terminal: paste once. The session will read the plan + status file, claim a task, run gates, do the work, update status, and pick the next task in its column.

**Worktree coordination.** The canonical status file lives at the absolute path
`/Users/drewdouglas/Desktop/Codebases/hearth/.claude/plans/status-intelligence-refactor.json`
in the **main** repo (branch `refactor/intelligence`). All four terminals read
and write that one file regardless of which worktree they're cd'd into. Each
worktree's local `.claude/plans/status-intelligence-refactor.json` is a stale
snapshot from when the worktree branch was created — ignore it. Same rule for
the PLAN file (Status table updates go to the canonical PLAN.md).

### Terminal 1 (Opus — architecture spine)
> Read `/Users/drewdouglas/Desktop/Codebases/hearth/.claude/plans/PLAN-intelligence-refactor.md` and `/Users/drewdouglas/Desktop/Codebases/hearth/.claude/plans/status-intelligence-refactor.json` (canonical copies in the main repo, not your worktree's local copies).
> You are Terminal T1. Pick the next pending task in column T1 of the Parallel Execution Guide.
> Before starting: confirm every task in your task's `Gate` line shows status "done" in status-intelligence-refactor.json. If not, pick a later task in your column that has no unmet gates, or pause and report blocking.
> Execute the task per its Description and Files list. Honor `Done when`.
> When done: set the task's status to "done", add the ISO timestamp and "T1" as completed_by in the canonical status JSON, and update the Status table in the canonical PLAN.md to ✅.
> Then pick the next task in column T1 and repeat.

### Terminal 2 (Sonnet — schema + API parallel work)
> Read `/Users/drewdouglas/Desktop/Codebases/hearth/.claude/plans/PLAN-intelligence-refactor.md` and `/Users/drewdouglas/Desktop/Codebases/hearth/.claude/plans/status-intelligence-refactor.json` (canonical copies in the main repo, not your worktree's local copies).
> You are Terminal T2. Pick the next pending task in column T2 of the Parallel Execution Guide.
> Before starting: confirm every task in your task's `Gate` line shows status "done" in status-intelligence-refactor.json. If not, pick a later task in your column that has no unmet gates, or pause and report blocking.
> Execute the task per its Description and Files list. Honor `Done when`.
> When done: set the task's status to "done", add the ISO timestamp and "T2" as completed_by in the canonical status JSON, and update the Status table in the canonical PLAN.md to ✅.
> Then pick the next task in column T2 and repeat.

### Terminal 3 (Sonnet — extractions + SQL routes)
> Read `/Users/drewdouglas/Desktop/Codebases/hearth/.claude/plans/PLAN-intelligence-refactor.md` and `/Users/drewdouglas/Desktop/Codebases/hearth/.claude/plans/status-intelligence-refactor.json` (canonical copies in the main repo, not your worktree's local copies).
> You are Terminal T3. Pick the next pending task in column T3 of the Parallel Execution Guide.
> Before starting: confirm every task in your task's `Gate` line shows status "done" in status-intelligence-refactor.json. If not, pick a later task in your column that has no unmet gates, or pause and report blocking.
> Execute the task per its Description and Files list. Honor `Done when`.
> When done: set the task's status to "done", add the ISO timestamp and "T3" as completed_by in the canonical status JSON, and update the Status table in the canonical PLAN.md to ✅.
> Then pick the next task in column T3 and repeat.

### Terminal 4 (Sonnet — phase-end test sweeps)
> Read `/Users/drewdouglas/Desktop/Codebases/hearth/.claude/plans/PLAN-intelligence-refactor.md` and `/Users/drewdouglas/Desktop/Codebases/hearth/.claude/plans/status-intelligence-refactor.json` (canonical copies in the main repo, not your worktree's local copies).
> You are Terminal T4. Your tasks are the phase-end test sweeps: 2.9, 4.8, and any future test-sweep tasks added.
> Watch status-intelligence-refactor.json. When all gates for your next sweep task are met, claim it and run.
> When done: set the task's status to "done", add the ISO timestamp and "T4" as completed_by in the canonical status JSON, and update the Status table in the canonical PLAN.md to ✅.

---

## Phase Boundaries — Bake Notes

- **Phase 1 → Phase 2**: as soon as 1.1 + 1.2 + 1.3 + 1.4 land and 1.5 + 1.6 deploy to Sanity. Verify drizzle migration up/down on a throwaway Neon branch before Phase 2 routes start writing.
- **Phase 2 → Phase 4**: per the plan's risk note, bake module_runs writes for ~1 week against test families before Phase 4's status endpoint starts deriving from them. Phase 3 (read-only API) can run in parallel with this bake window — start Phase 3 immediately after Phase 2's tests pass.
- **Phase 4 → Phase 5**: 4.6 must be parity-verified (every module reachable in `/explore/activities` reachable in `/library?tab=browse`) before 5.1 deletes the old route. Run a parity diff manually before merging 5.1.
- **Phase 5 / Phase 6**: independent after 4.6 and 3.4 are done. Can run concurrently.

---

## Deferred Scope (carry-over from source plan)

- Snapshot rebuild incrementalization
- Junction tables for `engagementPerLearner` / `discoveriesPerLearner`
- Audio playback / waveform UI
- Full module-marketplace UX parity
- Sanity GROQ search
- Photo-metadata activity auto-detection
- Library/Explore nav consolidation (Q8)
- Cross-device Facilitate sync — server `quickCaptureCache` (Q4)
- Cron-driven abandonment sweep — derived at read time
- `module_runs` history endpoint for per-family analytics
