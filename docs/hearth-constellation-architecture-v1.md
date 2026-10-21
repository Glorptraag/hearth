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
      — owns view mode (constellation/table/explore), drill depth (1–4: domains →
        threads → DLOs → moments), URL sync, and the DLO confirm/dispute
        optimistic-update loop (POST /api/capabilities/[learnerId]/dlo/[dloId]/confirm)
      — renders ConstellationGraph / TableView / ExploreView per current view+depth
        (the linked graph is the default view; see §6)
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
| Graph model (nodes, links, telescope reach, relations) | `_constellation/graph-model.ts` |
| Force layout (springs, repulsion, collision, cone) | `_constellation/force-layout.ts` |
| Render surfaces | `ConstellationGraph.tsx` + `ConstellationPanel.tsx` (the linked graph, §6), `TableView.tsx`, `ExploreView.tsx` (same directory) |

Two data quirks worth knowing:

- **`activeThreads` legacy array shape.** `page.tsx` still handles a bare-array response
  (`Array.isArray(data)`) alongside the current `{ activeThreads, dloStatus, gapAnalysis,
  curriculumCoverage }` shape — a back-compat branch for snapshots written before the
  richer response shape landed.
- **`dloStatusById` mirrors the table one-to-one (since 2026-10-06).** The persisted
  `learner_dlo_status.status` has four values (`emerging | developing | demonstrating |
  not-started`) and `topology.ts`'s `buildDLOs()` renders four states (`confirmed` for
  demonstrating, then `developing`, `emerging`, `not-started`). Until then `developing`
  was collapsed into `emerging`, so the middle rung was invisible in Gallery and Table.
  `nextDloToWatch()` picks the first DLO (tier order) the child has not yet reached at its
  own tier — the "Next to watch for" line at depth 3.
- **Thread recency / trajectory.** Snapshot rows now carry `first_evidence_date` and the
  rebuild's `trajectory`; `buildSnapshot()` keeps them (`firstDateByThread`,
  `trajectoryByThread`) and `TableThreads` shows a "New" chip (first evidence ≤14 days), a
  recent-activity dot (≤7 days) and the trajectory read next to the tier. Older snapshots
  without the fields simply show no marker.
- **Parent confirmations are moments.** `upsertParentAssertion` writes an `asserted` link
  with no `observation_id`; the evidence route LEFT-joins entries so that row appears as
  "You confirmed this" (source `parent`, dated by the confirmation). The route previously
  inner-joined, so the one moment the parent contributed never appeared in their own list.
  `recomputeLearnerDloStatus` treats one asserted or declared developing-tier link as
  corroboration (previously two developing links were required, so a lone parent confirm
  of a developing DLO rolled up to `not-started`).
- **Deep links.** `?focus=` accepts a real Sanity DLO id (`dlo.L3.emerging`, the shape the
  URL sync writes at depth 4) via `parseFocus()`; the old parser only understood `L3.e`, so
  reloading a depth-4 view rendered an empty stage.
- **Phones get the graph too (since 2026-10-21).** The retired Gallery was a fixed-viewBox
  SVG whose 11px labels rendered at ~3px on a 375px phone, so phones were forced onto the
  Table (`useNarrowViewport`, now deleted). The linked graph pans and pinch-zooms and draws
  its labels at a constant screen size, so it works at phone width; the fallback is gone.
  `?view=gallery` links still resolve — `parseView()` maps them onto the constellation.

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
| DLO confirm control | `src/app/(auth)/our-story/capabilities/_constellation/DloConfirm.test.tsx` | `DloConfirmButton` in the Table (L3) and in the graph's panel when telescoped onto an objective |
| Graph model | `_constellation/graph-model.test.ts` | Node/link construction, suppression, glow states, filters, telescope reach (`neighbourhood`, `telescopeHops`), focus ↔ node mapping, relations, moment leaves |
| Force layout | `_constellation/force-layout.test.ts` | Settling, determinism, cluster separation, collision, pinning, cone rings + angles, seeding |
| Constellation graph | `_constellation/ConstellationGraph.test.tsx` | Every node rendered, selection → panel (links + backlinks), panel traversal, telescope (panel / double-click / Enter-twice), arrow-key walking, search, filters, reach, out-of-reach re-rooting, moment leaves + cap |

**Gaps — no dedicated tests today:**

- `ConstellationRoute.tsx` — view/depth state machine, URL sync (`?view=&d=&focus=`), the
  optimistic `assertOverrides`/`pendingDlos` confirm-loop wiring (as opposed to the button
  component itself, which is covered), learner-switch reset behaviour.
- `TableView.tsx` — `TableThreads` / `TableDLOs` / `TableMoments` render paths, no tests.
- `GalleryView.tsx` — `GalleryDomains` / `GalleryThreads` / `GalleryDLOs` / `GalleryMoments`
  render paths, no tests. *(Retired 2026-10-21 — replaced by the linked graph, §6, which is tested.)*

These three are called out because they carry real interaction logic (drill navigation, the
confirm/dispute optimistic-update flow surfaced through Gallery's `GalleryMoments`, deep-link
focus resolution) that is currently only exercised manually. **Closing this gap is task 2.1** —
do not duplicate that work here; this doc only records the gap as of 2026-07.

Partially closed 2026-10-06: `ConstellationRoute.test.tsx` now covers `parseFocus` (DLO id /
legacy / thread / domain), a depth-4 deep link rendering the Moments step, and the phone-width
Gallery→Table fallback; `TableView.test.tsx` covers the four-state DLO chip, the
"Watch for this next" marker, the "New" / trajectory markers, and a parent confirmation row;
`topology.test.ts` covers the status mapping, `nextDloToWatch`, and the recency helpers.
2026-10-21: the Gallery and its phone fallback are gone; `ConstellationRoute.test.tsx` now
covers `parseView` (legacy `gallery` → constellation), the constellation default, telescoping
from the panel with URL sync, and "Open in table".

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

## 6. The constellation graph (since 2026-10-21)

The default view is a linked graph in the manner of Obsidian's graph view: the capability
universe drawn as one network of notes and links rather than per-depth charts. It replaced the
Gallery (four fixed-viewBox SVGs — banded domains, a left-to-right thread DAG, tier columns, a
moments timeline), which read as a static chart and was illegible on phones.

**Model (`graph-model.ts`, pure).** `buildConstellationGraph(snap, dlosByThread, options)`
makes a node for every domain, every visible thread (H6 stays suppressed through
`ALL_THREADS`) and, optionally, every learning objective; links are `part-of` (thread → domain,
objective → thread), `leads-to` (the catalog's `THREAD_CONNECTIONS`, flagged `crossDomain`) and
`next` (objective → the next objective of its thread, tier order). Each node carries a `glow`:
`lit` (observed — or, for an objective, reached or parent-confirmed), `opening` (a ghost thread,
or the objective `nextDloToWatch` names) or `unlit`. Empty domains (Classical Languages,
Theology) stay as unlit orphans. `withMoments()` adds `evidence` leaves for the telescoped
objective. `relationsOf()` groups a node's links in plain language ("Part of", "Builds on",
"Leads to", "Threads", "Objectives", "Moments") — the panel's links + backlinks.

**Layout (`force-layout.ts`, pure, deterministic).** A small d3-force-style simulation: link
springs biased by degree, pairwise many-body repulsion, collision, and a centre pull scaled by
the viewport's aspect so a wide stage gets a wide sky. Seeded starting positions
(`seedClusters`: domain hubs on a circle, threads near their hub, objectives near their thread)
make a reload lay the same child out the same way. The simulation cools and stops — no
perpetual CPU.

**Telescope = the drill depths.** Depth 1 is the whole sky. Depth 2/3/4 telescope onto the
focused domain / thread / objective: `telescopeHops()` keeps everything within *reach* (1–3
links, Obsidian's local-graph depth; other threads' objectives are left out so the cone stays
about the apex), and the layout switches to a **cone**: the apex is pinned at the origin, each
node is drawn to the ring `hop × 140` and to an evenly spaced resting angle (`coneAngles`, BFS
order so neighbours share a stretch of ring), clamped within a half-angle wide enough for the
busiest ring. The guides draw the cone's field, its edges and one ring per link ("1 link
away"). Moving between depths morphs the existing positions into the new shape instead of
re-mounting; returning to depth 1 restores the whole-sky layout as it was. The URL scheme is
unchanged (`?view=constellation&d=3&focus=L3`), so deep links and the Table share one focus.

**Interaction.** Drag the background to pan, wheel/pinch to zoom (labels and strokes are
counter-scaled by `--cg-k`, so they stay legible; labels fade in by zoom band), drag a star to
tug its links. Hover lights a node's neighbourhood and dims the rest. Click selects into the
panel (`ConstellationPanel.tsx`): state in plain language, the parent's confirm control for an
objective, the moments behind a telescoped objective, and every link as a button — selecting a
link out of reach re-roots the telescope onto it. "Telescope from here" (or double-click, or
Enter on the selected node) telescopes; "Open in table" switches view at the same depth.

**Accessibility.** Nodes are `role="button"` with a roving tab stop (one tab stop into the
graph); arrow keys walk to the neighbour in that direction, Enter selects and Enter again
telescopes, Escape clears, +/− zoom. Each node's accessible name is its label, kind, state
and link count; a polite live region announces the selection. The panel's link buttons are a
complete keyboard path through the graph, and the Table remains the text-first view.

**Gotcha — positions live on a wrapper.** The app-wide press feedback
(`[role='button']:active { transform: scale(0.98) }` in `globals.css`) is a CSS `transform`,
which *replaces* an SVG `transform` attribute. Each star is therefore positioned on an outer
`<g data-pos>` the painter moves, with the button role on an inner `<g data-node>`; putting
both on one element drops the star at the origin mid-press and swallows the click.

**Performance.** React renders structure and state classes; the simulation writes positions
straight to the DOM in a `requestAnimationFrame` loop (two ticks a frame) that stops when it
settles. A full sky is ~250 nodes; the pairwise pass is well inside a frame. Under
`prefers-reduced-motion` the layout settles synchronously and the camera jumps instead of
easing.
