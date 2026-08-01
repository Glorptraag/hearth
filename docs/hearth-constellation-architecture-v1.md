# Hearth Constellation Architecture — v1

> The "constellation" is the capability-progression surface at `/our-story/capabilities` — a
> per-child map of the 57 canonical capability threads (15 domains, 171 DLOs across the
> emerging/developing/demonstrating tier bands) showing where a learner has been observed,
> where they're heading, and which DLOs a parent has explicitly confirmed. This doc describes
> the current code as of 2026-07, not the aspirational spec — see
> `docs/hearth-outcomes-spine-plan-v1.md` for product intent and phasing.

## 1. Data flow

The constellation is a pure read of a pre-computed per-family snapshot. There is no runtime
LLM call anywhere in this path — enrichment happens once, at entry-save time, and every
downstream surface (including this one) reads its output.

```
entry save (Log)
  → Haiku enrichment (write-time only; curriculum_descriptors, capability thread mapping)
  → observation_dlo_links (per-observation → DLO evidence rows, keyed by provenance:
      declared | asserted | inferred, plus evidenceState: observed | opportunity)
  → learner_dlo_status (per-learner × per-DLO status: emerging | developing |
      demonstrating | not-started; asserted_by_parent flag set on explicit confirm)
  → snapshot rebuild (src/lib/ai/snapshot-rebuild.ts, rebuildSnapshot())
      — aggregates observation_dlo_links into per-(learner × thread × tier)
        evidence (declared/asserted/inferred counts + inferred distinct days)
      — derives each thread's parent-facing tier via renderedThreadTier() /
        deriveThreadTierFromDlos() (src/lib/ai/thread-tier.ts) — see §3
      — applies write-side alpha-suppression (§2)
      — writes the per-child block into familyIntelligenceSnapshots.snapshotData
        (Postgres, one row per family; JSON blob keyed by children[learnerId])
  → GET /api/capabilities/[learnerId] (src/app/api/capabilities/[learnerId]/route.ts)
      — reads the family's snapshot row, slices out children[learnerId]
      — applies read-side alpha-suppression AGAIN (§2)
      — returns { activeThreads, dloStatus, gapAnalysis, curriculumCoverage }
  → capabilities/page.tsx (client component)
      — fetches /api/learners + the capabilities route on learner select
      — fetches the Sanity DLO descriptor catalog via clientSanityRead('allDlos')
        (dotted-id Sanity docs are dark to the tokenless browser client — this
        goes through the authed proxy, per project convention)
      — builds a LearnerSnapshot via buildSnapshotFromApi() → topology.ts buildSnapshot()
  → ConstellationRoute.tsx (src/app/(auth)/our-story/capabilities/_constellation/)
      — owns view mode (table/gallery/explore), drill depth (1–4: domains →
        threads → DLOs → moments), URL sync, and the DLO confirm/dispute
        optimistic-update loop (POST /api/capabilities/[learnerId]/dlo/[dloId]/confirm)
      — renders TableView / GalleryView / ExploreView per current view+depth
```

Key files:

| Stage | File |
|---|---|
| Write-time enrichment → evidence tables | `src/lib/ai/snapshot-rebuild.ts` (reads `observationDloLinks`, `learnerDloStatus` via Drizzle) |
| Tier derivation (pure functions) | `src/lib/ai/thread-tier.ts` |
| Snapshot storage | `familyIntelligenceSnapshots` table (Postgres), one row per family, `snapshotData` JSON keyed by `children[learnerId]` |
| Read API | `src/app/api/capabilities/[learnerId]/route.ts` |
| Page (data fetch + orchestration) | `src/app/(auth)/our-story/capabilities/page.tsx` |
| Route shell (view/depth/URL state, confirm loop) | `src/app/(auth)/our-story/capabilities/_constellation/ConstellationRoute.tsx` |
| Pure data-shaping helpers (thread DAG, tier glyphs, DLO building) | `src/app/(auth)/our-story/capabilities/_constellation/topology.ts` |
| Depth-specific render surfaces | `TableView.tsx`, `GalleryView.tsx`, `ExploreView.tsx` (same directory) |

Two data quirks worth knowing:

- **`activeThreads` legacy array shape.** `page.tsx` still handles a bare-array response
  (`Array.isArray(data)`) alongside the current `{ activeThreads, dloStatus, gapAnalysis,
  curriculumCoverage }` shape — a back-compat branch for snapshots written before the
  richer response shape landed.
- **`dloStatusById` collapse.** The persisted `learner_dlo_status.status` has four values
  (`emerging | developing | demonstrating | not-started`), but `topology.ts`'s `buildDLOs()`
  collapses these into three UI render states for Gallery/Table (`confirmed` for
  demonstrating, `emerging` for emerging-or-developing, `not-started` otherwise).

## 2. Dual alpha-suppression seams

One capability thread — **H6, "First Nations Australian Perspectives"** — is held back from
parent-facing surfaces pending cultural consultation. The single reversible switch lives in
`src/lib/capability-alpha-suppression.ts`:

```ts
export const ALPHA_SUPPRESSED_THREAD_IDS: readonly string[] = ['H6'];
```

`isSuppressedThread()` matches a suppressed id across every id shape the pipeline uses (bare
thread id `H6`, Sanity ref `capabilityThread.H6`, DLO id `dlo.H6.emerging`) — exact segment
match, so `H61`/`PS6` never collide. `filterSuppressedThreadIds()` and `omitSuppressedKeys()`
are the list/record-shaped helpers built on top.

**Suppression is applied at two independent seams, deliberately, not just one:**

1. **Write-side — `snapshot-rebuild.ts`.** Every place the rebuild aggregates a thread id into
   a parent-visible structure skips suppressed threads: the `threadCounts` accumulation loop
   (line ~455), the `current_sparks` loop (line ~704), `childMilestones` thread-id filtering
   (line ~759), and the final `dlo_status` write via `omitSuppressedKeys()` (line ~782). The
   `visibleThreadCount` denominator used for coverage percentages also subtracts
   `ALPHA_SUPPRESSED_THREAD_IDS.length` from 57 (line ~849), so a family that has genuinely
   touched every *visible* thread can still read 100%.

2. **Read-side — `src/app/api/capabilities/[learnerId]/route.ts`.** The GET handler filters
   `activeThreads`, `dloStatus` (via `omitSuppressedKeys`), and `gapAnalysis.suggested_focus_threads`
   (via `filterSuppressedThreadIds`) again, immediately before returning the response.

**Why both exist, when write-side suppression should be sufficient on its own:** snapshots are
rebuilt on triggers (entry save, manual, dashboard load, library change — see
`docs/PROJECT_STATUS.md` / snapshot-rebuild trigger enum), not on every read. A snapshot
written *before* a thread was added to `ALPHA_SUPPRESSED_THREAD_IDS` is stale with respect to
the new suppression list and will still carry the now-suppressed thread in its stored JSON
until the next rebuild fires. The read-side filter in the capabilities route is the safety net
that guarantees a parent never sees a suppressed thread even from a stale snapshot — the
write-side filter alone cannot make that guarantee retroactively.

**What is never filtered:** evidence writes — `observation_dlo_links`, `learner_dlo_status`,
`thread_links` — accrue for suppressed threads exactly as normal. Only parent-visible
read/aggregation surfaces are filtered (snapshot assembly, the capabilities API, constellation
topology's `VISIBLE_THREAD_IDS`/`indexDLOsByThread`, the keyword matcher, post-save nudges,
portfolio thread grouping, deterministic report coverage). Admin surfaces (tier comparison,
analytics) intentionally do **not** filter. This means re-lighting a thread later (removing it
from `ALPHA_SUPPRESSED_THREAD_IDS` + triggering `POST /api/admin/snapshots/rebuild`) loses
nothing — all the evidence a child accrued while the thread was suppressed is still there to
surface immediately.

`topology.ts` applies the same suppression at the catalog level: `VISIBLE_THREAD_IDS` filters
`isSuppressedThread` out of `THREAD_NAMES` before building the thread DAG (`ALL_THREADS`,
`THREADS_BY_ID`, domain thread-counts), and `indexDLOsByThread()` drops any Sanity DLO whose
derived thread id is suppressed. So even if a caller somehow fed a suppressed thread's data
into `buildSnapshot`/`buildDLOs`, the thread simply isn't present in the domain/thread
catalogs the views iterate over.

## 3. Tier derivation

A thread's parent-facing tier (`emerging | developing | demonstrating`, or unobserved/"Not
yet") is **derived from accumulated DLO evidence**, not from raw observation-logging volume.
This is the WS-4 "honesty model" (decision D-OS4). The derivation lives in
`src/lib/ai/thread-tier.ts` and is called from `snapshot-rebuild.ts` at **line 497**:

```ts
const derived = renderedThreadTier(dloStatuses, sourceCounts, override ?? null, PRODUCTION_TIER_BAR);
data.tier = derived ?? 'unobserved';
```

- `sourceCounts` (`SourceCountsByTier`) is aggregated per (learner × thread × tier) from
  `observation_dlo_links`, counting only `evidenceState: 'observed'` links (uncorroborated
  `opportunity` links never lift a tier) — split by `provenance`: `declared`, `asserted`,
  `inferred` (plus `inferredDistinctDays`, the number of distinct calendar days carrying an
  inferred link, so repeated same-day inference can't stack into a false-high tier).
- `deriveThreadTierFromDlos()` walks `emerging → developing → demonstrating` and returns the
  **highest** tier whose `TierThreshold` clears (`declared + asserted ≥
  minDeclaredOrAsserted` OR `inferredDistinctDays ≥ minInferredDistinctDays`), returning
  `null` if none clears.
- **`PRODUCTION_TIER_BAR`** is the locked bar (decision C2, "TUNED-B", confirmed by Drew
  2026-06-16):
  - `emerging` / `developing`: ≥1 declared/asserted link OR ≥1 inferred-distinct-day.
  - `demonstrating`: ≥1 declared/asserted link **only** — `minInferredDistinctDays: Infinity`
    permanently closes the inferred-only path to "demonstrating". A thread can only read
    demonstrating when a module explicitly declared the outcome or a parent asserted it —
    never from inference alone.
- `renderedThreadTier()` then applies a **lower-only** parent override (from
  `child.profileData.tierOverrides`): an override can pull a derived tier down, never raise it,
  and can never lift a `null` ("Not yet") into a tier.

**Legacy count-based path.** `countBasedTier()` (also in `thread-tier.ts`) replicates the
*old* production ladder (≥8 observations → demonstrating, ≥4 → developing, else emerging,
same lower-only override rule) as a **standalone, non-authoritative signal**. It is not used
to compute the tier the constellation renders — `snapshot-rebuild.ts` only calls it to detect
drift (`oldTier !== data.tier` at line ~501) so it can fire the one-time "constellation
honesty" shift notice (`triggerConstellationHonestyNotice`,
`src/lib/notifications/triggers.ts`) explaining to parents why a thread's displayed tier may
have moved. `COUNT_TIER_THRESHOLDS` (`{ demonstrating: 8, developing: 4 }`) must be kept in
lockstep with any future change to the historical ladder in `snapshot-rebuild.ts` — it is a
deliberate duplication, not an import, so the admin tier-comparison tool can compute it
standalone without pulling in the production pipeline.

`DEFAULT_DOS4_BAR` (a slightly softer bar than `PRODUCTION_TIER_BAR`, allowing
inferred-distinct-days for demonstrating) still exists as the admin tier-comparison panel's
tunable starting point — it is not what the constellation honours.

## 4. Test coverage map

| Layer | Covered by | Notes |
|---|---|---|
| Pure tier-derivation logic | `src/lib/ai/thread-tier.test.ts` | `deriveThreadTierFromDlos`, `renderedThreadTier`, `countBasedTier`, `parseDloId`, lower-only override behaviour, `PRODUCTION_TIER_BAR` vs `DEFAULT_DOS4_BAR` |
| Snapshot rebuild pipeline (DB-backed) | `src/lib/ai/__tests__/snapshot-rebuild.integration.test.ts` | Real Postgres, transaction-rollback isolation; exercises the full aggregation incl. suppression + tier derivation end-to-end |
| Alpha-suppression helpers | `src/lib/capability-alpha-suppression.test.ts` | `isSuppressedThread` id-shape matching, `filterSuppressedThreadIds`, `omitSuppressedKeys` |
| Constellation honesty shift notice | `src/lib/notifications/triggers-constellation-honesty.integration.test.ts` | One-time flag, ship-date/sunset gate, `tiersChanged` gate — real DB |
| Topology pure helpers | `src/app/(auth)/our-story/capabilities/_constellation/topology.test.ts` | Thread DAG, `buildSnapshot`, `buildDLOs`, tier collapsing, DLO indexing |
| Capabilities GET route | `src/app/api/capabilities/[learnerId]/route.integration.test.ts` | Real DB; read-side suppression, empty-snapshot fallback, ownership checks |
| DLO evidence route | `src/app/api/capabilities/[learnerId]/dlo-evidence/route.integration.test.ts` | Evidence drill-down endpoint |
| Capabilities page (data orchestration) | `src/app/(auth)/our-story/capabilities/page.test.tsx` | Fetch/loading/error states, learner switch, legacy-array fallback |
| ExploreView (gap lens) | `src/app/(auth)/our-story/capabilities/_constellation/ExploreView.test.tsx` | Suggested-thread chips, underserved-subject section |
| DLO confirm control | `src/app/(auth)/our-story/capabilities/_constellation/DloConfirm.test.tsx` | Tests `DloConfirmButton` (confirm/dispute UI unit) |

**Gaps — no dedicated tests today:**

- `ConstellationRoute.tsx` — view/depth state machine, URL sync (`?view=&d=&focus=`), the
  optimistic `assertOverrides`/`pendingDlos` confirm-loop wiring (as opposed to the button
  component itself, which is covered), learner-switch reset behaviour.
- `TableView.tsx` — `TableThreads` / `TableDLOs` / `TableMoments` render paths, no tests.
- `GalleryView.tsx` — `GalleryDomains` / `GalleryThreads` / `GalleryDLOs` / `GalleryMoments`
  render paths, no tests.

These three are called out because they carry real interaction logic (drill navigation, the
confirm/dispute optimistic-update flow surfaced through Gallery's `GalleryMoments`, deep-link
focus resolution) that is currently only exercised manually. **Closing this gap is task 2.1** —
do not duplicate that work here; this doc only records the gap as of 2026-07.

## 5. Vestigial `/constellation` route

`src/app/(auth)/constellation/page.tsx` is a **separate, unrelated, unlinked scaffold** — not
part of the capability-progression feature this doc describes. It renders a minimal
composite-weight list view for a single module (`?module=<id>`), driven by
`getActivePedagogyBundle` / `getCompositeWeight` from the pedagogy engine
(`src/lib/pedagogy/get-active-bundle-and-overlays.ts`). Its own header comment says the "full
interactive map" is a follow-up phase per
`docs/hearth-runtime-methodology-integration-brief-v1.md` §2.4 — but that follow-up became the
`our-story/capabilities` constellation documented above instead, built on an entirely different
data model (capability threads/DLOs/tiers vs. pedagogy composite weights). Nothing in the app
links to `/constellation`; it has no entry point in nav config or any other screen.

This is a known finding, not new: prior session memory (`project_dlo_relight_chip_resolve.md`)
already flagged `/constellation` as "a vestigial unlinked scaffold." **Keep-or-delete is a Drew
decision** — this doc does not resolve it, only records the current state so nobody mistakes it
for a second, competing constellation implementation.
