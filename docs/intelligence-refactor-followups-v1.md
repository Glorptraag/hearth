# Intelligence Refactor — Follow-ups

> Generated 2026-06-03 after the Phase 1–6 merge (PRs #131–#134).
> Source: overall-review pass at the end of the refactor session.
>
> **Use this doc as a living backlog.** When an item lands, link the
> PR/commit on its line or delete the line entirely. Items are bucketed
> by what they'd block — pilot launch, sustained pilot, or normal backlog.

---

## Tier 1 — Resolve before pilot launch

### 1.1 `MODULE_RUNS_ENABLED` defaults off

- **Concern:** Every `/api/module-runs/*` route returns `503` without this env var. The entire module_runs lifecycle (Phase 2.3, 2.4, 4.1's status board derivation, 4.4 materials persistence) is invisible until the flag flips.
- **Recommend:**
  1. Set `MODULE_RUNS_ENABLED=1` in `.env.local` + verify FacilitateMode → run row → log entry round-trip works in dev.
  2. Set in Vercel preview env, smoke-test on a preview deployment.
  3. Set in Vercel production env once one pilot family is willing to be the canary.
- **Files:** `src/app/api/module-runs/route.ts`, `src/app/api/module-runs/[id]/route.ts`, `src/app/api/module-runs/[id]/finish/route.ts`, `src/app/api/module-runs/[id]/abandon/route.ts` — each has the feature-gate check at the top.

### 1.2 iOS Safari MediaRecorder field test

- **Concern:** Audio capture (Task 2.2) uses `MediaRecorder` with a file-input fallback when permission is denied. iOS Safari has historically had MIME-type quirks (`audio/webm;codecs=opus` rejection, AAC-only support), permission-prompt UX surprises, and recording-state edge cases. Not tested on a real iPhone.
- **Recommend:** Open `/log` on a real iOS device, record a 5-second clip, verify it persists as a `learning_entry_evidence` row with kind=`audio` and a playable URL. If MIME fails, fall back to `audio/mp4` or accept the file-input path.
- **Files:** `src/components/log/CaptureTray.tsx` (`startRecording`, `uploadAudioBlob`).

### 1.3 Recommendation ranking will shift under existing families

- **Concern:** Phase 3.3 rebalanced `scoreModules` weights — spark 0.35→0.30, gap 0.30→0.25, repeat 0.15→0.12, energy 0.10→0.08, recency 0.10, plus new pedagogy 0.15. The next snapshot rebuild will produce a different `recommendations.suggested_next` ordering than the parent saw yesterday.
- **Recommend:** Small one-time toast / banner on Dashboard or Explore: "We refined how we surface modules — your recommendations look a little different now." Pre-empts the "did something break?" support ping.
- **File:** `src/lib/ai/recommend.ts` (weights live at top of file as `W_SPARK` etc.). Toast copy is editorial.

---

## Tier 2 — Important before sustained pilot

### 2.1 Offline file-upload queue Blob persistence (IndexedDB)

- **Concern:** Task 2.7's file queue stores Blobs in an in-memory `Map`. The localStorage manifest survives a reload but the actual Blob doesn't — a parent who captures offline, reloads the tab, then reconnects will see a "lost upload" manifest entry with no Blob to retry.
- **Recommend:** Move Blob storage to IndexedDB so the queue survives reload. Roughly: `idb-keyval` (~1KB) keyed by `localId`. On `enqueueFileUpload`, persist Blob to IDB. On `processFileUploadQueue`, hydrate from IDB before iterating the manifest.
- **File:** `src/lib/offline-queue.ts` — `fileBlobs` Map is the swap point.

### 2.2 Pack status rollup does a synchronous Sanity fetch on every status request

- **Concern:** `/api/library/status` resolves pack → modules via Sanity at request time (`packExpansions`). Fine for 5–10 packs per family; would slow noticeably at 30+ packs because Sanity round-trip dominates.
- **Recommend:** Either cache the pack→modules map (key by pack `_id` + `_rev`) for the request's lifetime, or denormalize `module_ids` onto a Postgres `family_pack_modules` materialized view rebuilt on `library_change` / Sanity webhook.
- **File:** `src/app/api/library/status/route.ts` (the `packExpansions` block).

### 2.3 Abandonment threshold is a 14-day constant, ignoring per-module `idleDaysBeforeAutoClose`

- **Concern:** Phase 1.5 added `module.idleDaysBeforeAutoClose` to Sanity (default 14 for sustained, null for open_ended). Library status (4.1) doesn't read it — uses a constant 14d for all modules. An open_ended run will be flagged "abandoned" after 14d of inactivity even though it's supposed to be long-lived.
- **Recommend:** Fetch `idleDaysBeforeAutoClose` alongside the pack expansion in `/api/library/status`. For open_ended runs (null), skip the abandonment check entirely. For sustained, honour the per-module value.
- **File:** `src/app/api/library/status/route.ts` (the `staleCutoff` derivation). `module.idleDaysBeforeAutoClose` lives in Sanity per `src/sanity/schemas/module.ts`.

### 2.4 `ContextualProposals` three-signal stacking is UX-untested

- **Concern:** The banner on `/log` can surface up to 3 attachable items (active run + planned + recent library add). Hasn't been seen with all three populated simultaneously. The dedup-by-moduleId helps but doesn't prevent a confusing "Attach to: Active X / Planned X / Recent X" if the same module hits all three signals.
- **Recommend:** Visual smoke test with a hand-crafted state (start a run, plan the same module for today, add a different pack today). If it reads as clutter, collapse same-module signals into a single chip with the strongest signal label.
- **File:** `src/components/log/ContextualProposals.tsx` (the dedup block + rendering).

### 2.5 Editorial flip of `sessionType=open_ended` modules

- **Concern:** All 53 production modules were backfilled to `sustained` in Phase 1.6. The plan called out genuine drop-and-pickup candidates (nature journal, sketchbook practice, instrument practice, garden observations, etc.) that should be `open_ended`. Until flipped, those modules behave as clean-start-finish in `FacilitateMode` (no Pause button).
- **Recommend:** Either review the 53 modules in Sanity Studio and flip relevant ones via the UI, OR populate `scripts/data/open-ended-modules.json` with slugs and re-run the backfill (script will need a small `--force-from-slug-list` flag added since it currently skips set-sessionType modules — see status JSON 1.6 note).
- **Files:** Sanity Studio for direct flip; `scripts/sanity-backfill-session-type.mjs` for batch.

---

## Tier 3 — Deferred Phase 6 work

### 3.1 Module-only Marketplace browse (was Task 6.3)

- **Concern:** Marketplace currently shows packs only. Standalone modules in Sanity (those with `availability` set and no parent pack) aren't surfaced.
- **Recommend:** Add a `?kind=module` filter to `MarketplaceShell` that queries standalone modules and renders them with the same card pattern as packs. Sanity schema (`module.availability`) is ready.
- **File:** `src/app/(auth)/explore/marketplace/MarketplaceShell.tsx`.

### 3.2 Preview-before-add on pack / module detail (was Task 6.4)

- **Concern:** `module.previewActivityRef` exists in Sanity (Phase 1.5) but isn't consumed anywhere. Parents add packs blind — no inline activity preview.
- **Recommend:** On pack detail (`/pack/[id]`) and any standalone-module marketplace card, if `previewActivityRef` is set, render an inline activity reader. Reuses the existing CommonsReader for text-based previews; image / audio previews would be a larger surface.
- **Files:** `src/components/pack/PackDetail.tsx`, new `src/app/(auth)/explore/marketplace/_components/ModulePreview.tsx`.

---

## Tier 4 — Normal backlog (post-pilot iteration)

### 4.1 Snapshot rebuild incrementalization

- **Concern:** `rebuildSnapshot()` is full re-aggregate per call. 24h debounce + 5/hr rate-limit holds at 10–20 families; degrades at scale. Phase 3's subview API gives us a cache layer to retrofit, but the rebuild itself is still O(entries-per-family).
- **Recommend:** Per-trigger partial rebuild — `entry_saved` only re-runs the affected child's thread aggregation; `library_change` only touches recommendations. Keep the full path available for `manual` and `settings_change`.
- **File:** `src/lib/ai/snapshot-rebuild.ts`.

### 4.2 Audio playback UI

- **Concern:** Audio capture works end-to-end (record → upload → persist). Playback uses the browser default `<audio controls>` — no waveform, no scrubber styling, no in-page transcript. Fine for MVP, fast to outgrow.
- **Recommend:** When evidence audio becomes a frequent reading surface, add a custom waveform player (wavesurfer.js or similar) + optional transcription via Whisper at enrichment time.
- **Files:** Anywhere audio evidence renders — currently the LogMode session-captures preview and `/our-story/portfolio`.

### 4.3 Pedagogy weight (0.15) is empirical

- **Concern:** The pedagogy boost in `scoreModules` is a starting guess. We don't have data on whether it's the right magnitude — too low and pedagogy-tagged modules never surface; too high and it dominates over genuine spark/gap signal.
- **Recommend:** Log `RecommendationReason` distribution to PostHog. After 4 weeks of pilot data, compare what parents actually started vs what we recommended; adjust weights accordingly.
- **File:** `src/lib/ai/recommend.ts` (`W_PEDAGOGY`).

### 4.4 Family Fit fit-score is gap-only

- **Concern:** Plan called for per-pack fit score = pedagogy boost + gap overlap + spark overlap. Current implementation surfaces gap chips only; the full triangulated score isn't computed.
- **Recommend:** Extend `MarketplaceShell` to call `/api/snapshot/next` server-side for the family's library superset (or extend the gaps endpoint to return per-subject pedagogy + spark scores). Order the "Recommended" lane by combined score.
- **File:** `src/app/(auth)/explore/marketplace/MarketplaceShell.tsx`.

### 4.5 Materials checklist doesn't share state across runs of the same module

- **Concern:** PrepMode persists materials state per-run (`module_runs.materialsState`). If a family runs the same module twice in a week, the second run starts with an empty checklist even though they probably still have the materials.
- **Recommend:** On run start, hydrate `materialsState` from the most-recent finished run of the same `sanityModuleId` (if any) as a starting point. Parent can untick anything they've used up.
- **File:** `src/app/(auth)/module/[id]/page.tsx` (`startRun` or the materialsState fetch).

### 4.6 Browse + Explore UX overlap

- **Concern:** Library Browse and Explore now both exist as discovery surfaces. The intended division (Browse = "everything I have", Explore = "what the system noticed about us") may not read clearly to parents who think of both as "places to find stuff to do."
- **Recommend:** Field-test the framing with one or two pilot families. If they conflate them, consider renaming Explore to something more obviously insight-flavoured ("Patterns", "Signals", "What I've noticed").
- **Files:** Naming lives in `src/app/(auth)/layout.tsx` (nav config) and the page titles themselves.

### 4.7 PostHog instrumentation gap on Phase 2–6 surfaces

- **Concern:** Existing PostHog events (`entry_created`, etc.) still fire. New surfaces (ContextualProposals attach, RecentlyRemovedDrawer restore, BrowseTab sort changes, Explore card interactions) aren't instrumented. Without events, we can't measure adoption.
- **Recommend:** Add `track()` calls at the key interaction points — proposal attach, soft-delete confirm, restore, browse-sort-change, explore-card-click. Define new events in `src/lib/analytics/posthog.ts` `HearthEvent` union.
- **File:** `src/lib/analytics/posthog.ts` for the union; call sites are scattered.

### 4.8 No surface for "this run produced these entries"

- **Concern:** `learning_entries.moduleRunId` is populated end-to-end, but no UI shows the parent the relationship in either direction. From a run's perspective, "show me what got logged for this session" doesn't exist. From an entry's perspective, "what run did this come from" isn't shown.
- **Recommend:** Two small additions — (a) LogMode header shows "Run started at 9:14am, x minutes elapsed"; (b) Portfolio entry detail shows a "from session" badge linking back. Both rely on data that's already persisted.
- **Files:** `src/app/(auth)/module/[id]/_components/LogMode.tsx`, `src/app/(auth)/our-story/portfolio/...`.

---

## Already on main, but worth a sanity check

- `vitest.setup.ts` ships a `localStorage` polyfill for Node 26 + jsdom 29. Remove when CI moves to Node 22 (current state — polyfill is a no-op there) OR when vitest 4 fixes the shadowing upstream. Reference: comment in the polyfill block.
- `MODULE_BROWSE_QUERY` extended to project `pedagogyLensBundles` + `methodologyOverlays` — not yet consumed in UI (BrowseTab cards only show lens-bundle existence implicitly via relevance sort). Future iteration could surface "Charlotte Mason lens written for this module" as a card chip.
- `/api/library/modules` GROQ grew `ageRange + sessionType + modalities` fields. Existing consumers (the original Library Modules tab) ignore them — but adding tests against the route's shape would lock in the contract.

---

## Maintenance hygiene

- **Stale worktrees:** `~/Desktop/Codebases/hearth-t{1,2,3,4}-*` were created in Phase 1 setup and are no longer needed. `git worktree remove` each when convenient.
- **`docs/PLAN-intelligence-refactor.md` + `status-intelligence-refactor.json`** live in `.claude/plans/`. They've served their purpose; keep them as project history rather than deleting, but they don't need ongoing updates.
- **Branch protection:** all Phase 1–6 work landed via PR + `gh pr merge`. Future intelligence-refactor follow-ups should follow the same pattern even though `main` doesn't enforce it.
