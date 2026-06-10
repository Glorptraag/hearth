<!-- Version: 1 | Date: 2026-06-10 | Changes: Initial creation. Sequenced post-PR-175 execution plan distilled from three verified planning passes (instrumentation, recommendation live-items, ghost-schema decision). All anchors verified against HEAD 120fe73. -->

# Hearth — Next-Phase Plan v1 (post conceptual-gaps workstream)

> **Purpose:** The sequenced, shovel-ready PR plan for what follows PR #175. Each PR below is one deliverable, green-in-the-same-PR, per the post-mortem's binding re-land pattern (`hearth-refactor-postmortem-v1.md` §4). Anchors were verified against HEAD `120fe73` by three independent planning passes on 2026-06-10 — trust them over memory, but re-verify if the tree has moved.
> **Division of labour:** cloud sessions build and test in CI; everything deploy-facing or browser-facing is already enumerated in `hearth-local-runs-v1.md`. This doc adds no local jobs.
> **Not in scope:** the Fable-level structural refactor — entry criteria in the post-mortem §5 still unmet (needs ≥3 captured pilot profiles + live feedback evidence).

---

## Newly verified findings (logged as research-log R9/R10)

1. **`pedagogy_set` from onboarding silently no-ops** — `PostHogProvider` (the only `initAnalytics()` call) mounts in `src/app/(auth)/layout.tsx:140` only; nothing under `(public)/` initializes PostHog, so the track call at `src/app/(public)/onboarding/page.tsx:158` hits the `!initialised` early-return (`src/lib/analytics/posthog.ts:93-94`) and drops. Stage-1 funnel coverage is fictional for first-time onboarding. → fixed in **PR-A**.
2. **Dashboard "Gentle Prompt" card can never render** — `DashboardClient.tsx:591-603` (+ `dashboard/page.tsx:184`) types `snapshot.recommendations` as an *array*, but the rebuild writes `{ suggested_next, subject_balance }` (`snapshot-rebuild.ts:534`); `.length` is `undefined`, the card never shows. Do **not** silently fix mid-pilot (it changes what families see) — it gets its own deliberate PR-D.

## PR-A — `feat(analytics): public PostHog init + Stage-2 relief instrumentation`

Tests the founding bet (journey Stage 2: does the relief moment actually land?). ~5 files + 1 new hook + unit tests.

1. **Public-layout PostHog fix:** mount `PostHogProvider` for `(public)` routes (revives onboarding `pedagogy_set`). Anonymous capture is fine pre-auth; identify stays in `(auth)`.
2. **`enrichment_viewed`** — fires once per entry from `src/components/logger/PostSaveSurface.tsx` when: status `enriched` AND the EnrichedBody non-null predicate (`PostSaveSurface.tsx:136-145`) AND ≥50% visible (IntersectionObserver) AND tab visible AND 1,000ms dwell. New reusable hook `useViewedOnce(ref, { threshold, dwellMs, enabled })` in `src/hooks/`. New props `entryId`/`savedAtMs` (page state at `log/page.tsx:110,422`). Properties: `entry_id` (hashed), `wait_ms`, `had_insight/thread/work_sample`, `scaffolded`. Do **not** also instrument the `InsightsContent` post-save rail (double-count).
3. **Funnel join key:** `entry_id` (hashed — export `hashId` from `posthog.ts:104` as `hashForAnalytics`; server twin exists at `posthog-server.ts:60`) added to `entry_created` (`log/page.tsx:377`) and both `entry_enriched` paths (`api/entries/route.ts:196,220`). Plus `thin: boolean` on `entry_created` — thin entries skip the surface entirely (`page.tsx:389-394`) and must be excluded from the denominator.
4. **`compose_ms`** on `entry_created`: first-meaningful-interaction → save, ref-based, reset in the post-save field-reset block (`page.tsx:424-442`); `resumed_from_draft` + `draft_age_ms` from the existing draft `savedAt` (`src/lib/logger/draft.ts:42-61`); cap 4h, round to seconds. Median (non-resumed, substantive) < 300s = the 5-minute rule holding.
5. Union additions: only `enrichment_viewed` enters `HearthEvent` now (allowlist discipline — names without call sites invite drift).

**Hypothesis read-out:** of substantive `entry_created`, what fraction reach `enrichment_viewed`, at what `wait_ms`. High `entry_enriched` + low `enrichment_viewed` = relief produced but not landing (alpha blocker #0's failure mode, recurred).

## PR-B — `feat(recommend): shift notice + acceptance/reason instrumentation`

Closes post-mortem appendix 1.3 + 4.3 and the journey Stage-5 acceptance gap. Depends on PR-A's `hashForAnalytics` export. ~450–550 lines, half tests; the explore-activities fire site is the designated cut if review wants it leaner.

**Ground truth that shaped this:** the 2026-06-06 rebalance (`29fdadc`) shifted ordering for *every* surface — with no `pedagogyContext`, `W_PEDAGOGY` reroutes into spark (effective 0.45 vs old 0.35, `recommend.ts:95-96`). Two scoring paths exist: pedagogy-aware (`/api/snapshot/next`, `/api/snapshot/zero-state` → Library Browse) and context-less (snapshot rebuild → planner/explore). Per-component scores are local variables never returned — reason distribution works from `primary_reason`, no type extension.

1. **Notice (1.3):** new notification type `recommendations_refreshed`, tier `chime`, destination `/explore/activities`. New `triggerRecommendationsRefreshNotice(familyId)` in `triggers.ts`; called from the rebuild trigger block (after `snapshot-rebuild.ts:690`). One-time flag `recommendationsShiftNoticeAt` in `familySettings.notificationPrefs` JSONB (precedent: `quietDayUntil`, `triggers.ts:131-137`; **no migration**) — set **only when `createNotification` returns true** (gating declines must retry, not burn the shot). Guards: flag absent; `families.createdAt < 2026-06-06` (self-sunsetting); hard sunset 2026-09-30; `suggested_next` non-empty. Add 365d `TYPE_COOLDOWNS` entry. UI: `NotificationRow` `TYPE_ICON: Sparkle`, action label "See Suggestions". Copy (gentle-friend register): title *"We've gently tuned how suggestions are chosen"*, body *"Suggested Next now leans a little toward how your family likes to learn. Sparks and gaps still lead the way — so if the order looks different this week, that's all it is."*
2. **Supply event (4.3):** `recommendations_scored` via `trackServer` from `/api/snapshot/next` (after `:153`) and `/api/snapshot/zero-state` — properties: surface, pedagogy_key, rec_count, per-reason counts, top_reason, top_score. Pure helper `summariseReasonDistribution(recs)` for trivial unit testing. **Not** from the rebuild path (no pedagogy context — would pollute the distribution; comment the asymmetry).
3. **Demand event:** `recommendation_accepted` — surface (`planner_sheet`/`library_browse`/`explore_activities`), action (`planned`/`started`/`added_to_library`), `reason` (`primary_reason` enum — **never** `reason_text`, it can contain a child's name), `module_id_hash`, `rank`. Fire sites: `BottomSheet.tsx:253-259` (thread moduleId through `planner/page.tsx:96-104` + `PlannerClient.tsx:33-38`); `BrowseTab.tsx:343-423` Start Now/Today under relevance sort (extend `relevanceOrder` to `{rank, reason}`); explore activities handlers (cut-line). **No impression event** at pilot scale — denominators come from `recommendations_scored.rec_count`.
4. **Tests:** extend `src/lib/ai/recommend.test.ts` (helper); NEW `triggers.integration.test.ts` (created-once + flag set; second call no-ops; post-cutoff family no-op; gating decline does NOT set flag — note `snapshots/rebuild` integration test stubs the rebuild and cannot host these); NEW `snapshot/next/route.integration.test.ts` (200 + shape + `trackServer` called once, mock pattern per `stripe/webhook/route.test.ts`).

## PR-C — `refactor(schema): drop ghost module_runs + planner FK; land session probe events`

Per the decision brief: **drop both, with the zero-schema probe first or alongside.** Decide-by triggers: before any other migration lands (0025 must be this or a validated wiring, not a third thing on top), hard stop at the refactor entry-criteria review.

**Decision inputs (verified):** `module_runs` has zero writers but one live *reader* — `/api/library/status` (`route.ts:172-181,240-305`) derives `in_flight`/`abandoned` states the UI renders as badges that can never fire (`LibraryClient.tsx:39-42`). The schema also can't store the one thing localStorage holds (facilitate position — no column), so wiring as-is wouldn't deliver resume anyway. `plannerEntryId` has no flow that could even produce a value (planner has no logger link). Re-add cost later: low and lossless (table never held a row; a redesign would fix the position-column flaw regardless).

1. **Probe (~1h, can be its own micro-PR):** `module_session_started` / `module_session_resumed` / `module_session_logged` in the `HearthEvent` union, fired from the runner lifecycle points (`module/[id]/page.tsx` — start `:478-484`, resume `:486-494`, LogMode save `:565`). Answers: do families run modules multi-session / cross-device at all. Closes part of Stage-5 "recommended → started".
2. **Migration 0025:** drop `learning_entries.module_run_id`, `learning_entries.planner_entry_id`, then `module_runs`. (`learning_entry_evidence` from the same 0022 migration is live — untouched.)
3. **Code in the same PR:** `schema.ts:108-113,315-355`; library status route — remove runs query + derivations, statuses collapse to `planned`/`recently_used`/`untouched` (zero observable change — dropped states are unreachable today); `LibraryClient.tsx:33-42,136` badge map; factories (`factories.ts:45,157-158,235-253`, `db-factories.ts:111-121` + the never-used `seedActiveModuleRun:205-248`); the two run-dependent integration tests in `library/status/route.integration.test.ts:50-68,119-143`; comment hygiene (`materials-aggregate.ts:97`, PROJECT_STATUS rows).
4. **Grep trap:** the `plannerEntryId` in `notifications/trigger/route.ts:36,90-96` is the planner-entries *PK in a request payload* — unrelated; must survive.
5. **Reversal clause:** any research-log entry of a family reporting "I lost my place in a module", or probe events showing cross-device resume attempts, flips this to the wire-it path (endpoint sketch preserved in the decision analysis: POST create at PrepMode start, debounced PATCH heartbeat at `persistChunk`/`onPause`, server-side finish inside POST /api/entries when `moduleRunId` present).

## PR-D — `fix(dashboard): render Gentle Prompt from snapshot recommendations object`

The R10 shape mismatch. Small but **user-visible mid-pilot** — a card that never appeared starts appearing. Decision needed from Drew before landing: ship as-is (the card was always intended; spec'd behaviour) or hold until after the first pilot retro. Implementation is trivial once decided: type `recommendations` as the object, read `suggested_next`, regression test that the card renders from a scored snapshot fixture.

## Deferred (wait for stage evidence — do not build now)

From the instrumentation triage: `report_opened` (Stage 4 — likeliest next after PR-A, calendar-driven by the first real compliance deadline); landing CTA + onboarding step funnel (Stage 0/1 — only the init fix rides now); `dashboard_viewed` log-free-visit signal (Stage 3 — wait for week-8 cadence data); `planner_entry_created`, `module_published`, `hearth_group_created` (Stages 5/6 — nobody is at these stages; instrumenting now is the completionism the journey doc forbids). Union names are reserved in the journey doc; they enter the allowlist only with their call sites.

## Sequencing

```
PR-A (analytics foundation; exports hashForAnalytics)
  └─→ PR-B (recommendation notice + events)
PR-C probe (independent, ~1h) → PR-C drop migration (before any other migration)
PR-D (awaits Drew's ship/hold decision)
```

Each lands green through all four CI jobs before the next stacks. Local verification steps for anything these PRs ship live in `hearth-local-runs-v1.md` (PostHog live-event checks fold into its §3 smoke list when PR-A deploys).
