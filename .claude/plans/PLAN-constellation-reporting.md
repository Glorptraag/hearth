# Plan: Constellation + Reporting Robustness

> Pharao output — generated 2026-07-08. Review before executing.

## Overview

The constellation and reporting surfaces feel like a black box mostly because of **documentation drift**, not missing engineering. This plan (a) writes the two missing architecture/pipeline docs and reconciles the stale spine plan, (b) fills the constellation UI test gap and a silent-failure hole, and (c) closes reporting integrity/test gaps and lands the tranche-2 curriculum mappings that fix evidenced-family 0% coverage. House style: one deliverable per slice, tests in the same slice, foundations soak before dependents. Production Sanity publishing is held behind a human gate.

## Phases

### Phase 1: De-black-box (docs only, zero code risk)

#### Task 1.1: Write hearth-reporting-pipeline-v1.md `[SONNET]` (standard)
- **Description**: End-to-end reporting spec — surfaces, DB tables, coverage resolution with exact gates, AI touchpoints, PDF tiers, fallback-recovery runbook. Sole owner of CLAUDE.md edits (adds reference rows for this doc + the 1.3 doc).
- **Files**: `docs/hearth-reporting-pipeline-v1.md`, `CLAUDE.md`
- **Done when**: doc exists with coverage-resolution / fallback-recovery / PDF-tier sections; CLAUDE.md table has both new rows.
- **Parallel group**: A

#### Task 1.2: Reconcile spine plan + PROJECT_STATUS `[SONNET]` (standard)
- **Description**: Add a per-workstream status table (WS-1/2/4/6 shipped, WS-5 plumbing/content-partial, WS-3 verify, WS-7 partial); annotate superseded Part III findings; fix the stale "5 sequential PRs in flight" line.
- **Files**: `docs/hearth-outcomes-spine-plan-v1.md`, `docs/PROJECT_STATUS.md`
- **Done when**: dated status table + inline RESOLVED/SUPERSEDED annotations present; stale line gone.
- **Parallel group**: A

#### Task 1.3: Write hearth-constellation-architecture-v1.md `[SONNET]` (standard)
- **Description**: Data flow, dual alpha-suppression seams, tier derivation, test-coverage map, vestigial-scaffold note. Does not edit CLAUDE.md (1.1 owns that row).
- **Files**: `docs/hearth-constellation-architecture-v1.md`
- **Done when**: doc exists with data-flow / dual-suppression / tier-derivation / test-map sections.
- **Parallel group**: A

### Phase 2: Constellation robustness (code)

#### Task 2.1: Constellation UI tests `[SONNET]` (standard)
- **Description**: New component tests — ConstellationRoute depth nav + view toggle + URL sync, DLO-confirm optimistic override happy + failure/revert, smoke tests for the three views. New files only; does not touch page.test.tsx.
- **Files**: `ConstellationRoute.test.tsx`, `TableView.test.tsx`, `GalleryView.test.tsx`, `ExploreView.test.tsx` (under `_constellation/`)
- **Done when**: four files exist; `npm test -- …/_constellation` green on node@24 incl. failure/revert assertion.
- **Parallel group**: B

#### Task 2.2: Retryable notice on silent confirm-refetch failure `[SONNET]` (standard)
- **Description**: A failed post-confirm background refetch must surface a gentle retryable notice, never read as success/empty (extends R26). Owns page.tsx + page.test.tsx.
- **Files**: `.../capabilities/page.tsx`, `.../capabilities/page.test.tsx`
- **Done when**: failed refetch → retryable notice; page.test.tsx covers it; green on node@24.
- **Parallel group**: B

### Phase 3: Reporting robustness (code + content)

#### Task 3.1: Work-sample orphan integrity `[SONNET]` (standard)
- **Description**: Verify + guard entry deletion when the entry is assigned to a work-sample slot (block 409 or clear slot per cascade conventions); regression integration test.
- **Files**: `src/app/api/entries/[entryId]/route.ts`, `…/route.integration.test.ts`
- **Done when**: no silent orphan; integration test passes.
- **Parallel group**: C

#### Task 3.2: Close reporting test gaps `[SONNET]` (standard)
- **Description**: learning_area-tier export integration test (NSW/VIC path), cross-slot 409 conflict, null-DOB age rendering.
- **Files**: `report/export/route.integration.test.ts`, `report/[reportId]/samples/route.integration.test.ts`
- **Done when**: three new assertions pass via integration suite.
- **Parallel group**: C

#### Task 3.3: Tranche-2 ac-v9-qld mappings (P1+PS2) seed + rollup test `[SONNET]` (standard)
- **Description**: Idempotent seed script patching ac-v9-qld regulatoryMappings onto P1/PS2 DLOs (does NOT auto-publish); unit test proving rollupCoverage credits HPE. Publishing held for D-publish.
- **Files**: `scripts/seed-dlo-mappings-qld-tranche2.mjs`, `src/lib/report/deterministic-coverage.test.ts`
- **Done when**: script exists (idempotent, no prod write); coverage test credits HPE; green on node@24.
- **Parallel group**: C

#### Task 3.4: WS-5 exit demo — ac-v9-nsw mapping proves zero-code transposition `[SONNET]` (standard)
- **Description**: Reuse 3.3's pattern for a 5-thread ac-v9-nsw seed; integration test proves a NSW family reaches `{mode:'deterministic'}` via mappings-only, no report-logic edits.
- **Files**: `scripts/seed-dlo-mappings-nsw-demo.mjs`, `src/app/api/report/coverage/route.integration.test.ts`
- **Done when**: script + integration test pass with zero `src/lib/report/*.ts` changes.
- **Gate**: Blocked on 3.3 — reuses its seed pattern + regulatoryMapping shape (and the user requirement that P3c lands before P3d).
- **Parallel group**: D

## Dependency Graph

```
1.1 ┐
1.2 ├─ (docs, independent)
1.3 ┘
2.1 ┐
2.2 ┘ (constellation, independent)
3.1 ┐
3.2 ├─ (reporting)
3.3 ┴──► 3.4
```

## Batches

None — all tasks are `standard` (no `micro` batching).

## Human Gates

- **D-publish** — publishing tranche-2 QLD + NSW-demo mappings to production Sanity (Sanity auth + council/Drew review). Seed scripts are produced and tested by 3.3/3.4; running them against prod is Drew's call. Does not block any coding task.

## Parked Decisions (Drew, not agents)

- **D-sidebar-1** — interim framing for unmapped-thread families ("Building" vs "outcomes mapping in progress").
- **D-sidebar-2** — delete vs keep the vestigial `/constellation` scaffold.
- **D-sidebar-3** — annotation edit locking for concurrent co-facilitators.

## Status (final — 2026-07-09)

| Task | Status | Verification |
|------|--------|--------------|
| 1.1  | ✅ done | doc sections + CLAUDE.md rows grep-verified |
| 1.2  | ✅ done | status table + annotations present; stale line gone |
| 1.3  | ✅ done | doc sections grep-verified |
| 2.1  | ✅ done | 46 tests green on node@24 (+ file-scoped testTimeout for CI robustness) |
| 2.2  | ✅ done | 5 tests green; R26 states preserved |
| 3.3  | ✅ done | seed script (no prod write) + 21 coverage tests green |
| 3.1  | ✅ done | CI-verified (integration job, PR #267 run 30685617244) |
| 3.2  | ✅ done | CI-verified (integration job, PR #267 run 30685617244) |
| 3.4  | ✅ done | CI-verified (integration job, PR #267 run 30685617244) |

All 9 tasks done. CI green on PR #267 (Checks + Integration tests both pass).
D4 resolved by the green integration job. Remaining: 3 parked sidebars (Drew) + the D-publish content gate (Sanity mapping publish).
