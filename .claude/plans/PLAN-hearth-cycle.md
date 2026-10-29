# Plan: Hearth Cycle

> Executable task graph derived from the human-readable plan of record, [`docs/hearth-cycle-build-plan-v1.md`](../../docs/hearth-cycle-build-plan-v1.md) (§5 workstreams, §4.3 Q-HC gates, §7 calendar). If this file and the doc disagree, the doc wins. State: `.claude/plans/status-hearth-cycle.json` (generated 2026-10-21). Spec chain: `docs/hearth-spec-chain-README.md`.

## Overview
Build the Hearth Cycle (rhythms, watch-fors, Today/Week, educator path, morning cards, craft library, lesson patterns, community) after the 9 Nov expo, on schedule (D-HC-1, which overrides postmortem §5). The expo carries only HC-1a…f, on the pivot branch. Everything else is one PR per task off main.

## House rules (`docs/hearth-refactor-postmortem-v1.md` §4, binding)
1. One deliverable per PR, individually green on all four CI jobs, tests at the right layer in the same PR.
2. Foundations soak: a task marked **Soak** needs its upstream schema task in production ≥3 days before the dependent starts.
3. No parallel-terminal mega-merges: tasks in one parallel group may be worked side by side but merge one at a time, each after CI is green on main.
4. A feature flag is not a substitute for end-to-end verification. Events land with or before their surface.
5. Every new family-scoped table: ON DELETE CASCADE on family_id, a row in the orphan-tables test, factories updated in the same PR.
6. Model tags: [OPUS] judgment-heavy (turn engine, select/compose, conversational log, educator evaluation, migrations touching evidence); [SONNET] plumbing and copy. Never write production Sanity or run seeds against production without a Drew gate.

## Calendar (build plan §7)
| When | Work |
|---|---|
| Tue 21 Oct | HC-0; HC-1a gate |
| 22–23 Oct | HC-1a, HC-1b (pivot) |
| 27 Oct–3 Nov | HC-1c, HC-1d, HC-1e, HC-1f |
| Wed 4 Nov / Fri 6 Nov / Mon 9 Nov | Freeze / go-no-go / Expo |
| 10–14 Nov | Soak; Q-HC-1…3 answered |
| 17 Nov–12 Dec | Phase 2a foundations: HC-2a–f, HC-3a–b |
| 15 Dec–23 Jan | HC-4, HC-5 |
| Tue 27 Jan | Evidence checkpoint |
| 27 Jan–27 Feb | Phase 2b: HC-6…HC-11 |
| Mar–May | HC-12, brief-only HC-13…16, HC-17, HC-18 |

## Tasks

### Phase 0

#### Task HC-0: Spec chain + build plan + content drafts `[OPUS]` (in_progress)
- **Branch**: claude/dreamy-allen-469dno
- **Persona / stage**: Drew (solo developer)
- **Description**: This PR: land the spec chain (docs/hearth-spec-chain-README.md and the seven chain docs), docs/hearth-cycle-build-plan-v1.md, this executable graph and status file, and the content drafts (watch-how lines, craft notes, patterns, cues). Docs and drafts only; no runtime code.
- **Files**: `docs/hearth-cycle-build-plan-v1.md`, `docs/hearth-spec-chain-README.md`, `.claude/plans/PLAN-hearth-cycle.md`, `.claude/plans/status-hearth-cycle.json`, `content/traditions/watch-how.yaml (new)` (entries marked "(new)" do not exist yet)
- **Done when**: PR open against main with the docs and drafts, four CI jobs green, Drew has read §0 and §4.3 of the build plan.
- **blocked_by**: none
- **Gate**: none
- **Parallel group**: p0

### Expo

#### Task HC-1a: Pivot schema edits before Studio deploy, plus desk entries `[OPUS]` (pending)
- **Branch**: claude/hearth-launch-pivot-v1-175462
- **Persona / stage**: Drew as confirmer; Renee (Tracker) as eventual reader
- **Description**: On the pivot branch, before the Studio schema deploy (pivot 2.5): drop watchForNext.variants (D-HC-5); add optional watchForNext.notYet[] {id,label,respond?}, DLO evidenceKind (does|says|makes|chooses), and pedagogicalFramework watchHow + stageOverrides + notifyDefault; rename shelfResource.lessonPattern to lessonNumberRegex (G46); settle the waldorf vs waldorf_steiner key (G11); add discreteLearningObjective and shelfResource entries to the sanity.config.ts desk (G8, urgent: Drew confirms notes in Studio).
- **Files**: `src/sanity/schemas/discreteLearningObjective.ts`, `src/sanity/schemas/pedagogicalFramework.ts`, `src/sanity/schemas/shelfResource.ts`, `sanity.config.ts`, `src/lib/shelf/match.ts`, `src/lib/shelf/match.test.ts`, `scripts/seed-shelf.ts` (entries marked "(new)" do not exist yet)
- **Done when**: tsc, lint, unit green on the pivot branch; grep finds no "variants" under watchForNext and no lessonPattern; both new desk entries visible in a local Studio; Drew has approved the schema diff.
- **blocked_by**: none
- **Gate**: Drew's schema approval (pivot plan §3, due 21 Oct); Q-HC-11 note only
- **Parallel group**: expo-1

#### Task HC-1b: Re-cut 50 DLO notes to neutral, add watchHow push `[SONNET]` (pending)
- **Branch**: claude/hearth-launch-pivot-v1-175462
- **Persona / stage**: Renee (Tracker, QLD), stage 2
- **Description**: Re-cut the 50 drafted notes in content/dlo-notes/ to the neutral sign only; add the 24 watchHow lines (WF §3.4) in content/traditions/watch-how.yaml; update the push script to write neutral notes and a watchHow push to pedagogicalFramework drafts. Drafts only: nothing is published and no production Sanity write happens here.
- **Files**: `content/dlo-notes/`, `content/traditions/watch-how.yaml (new)`, `scripts/push-dlo-note-drafts.ts`, `scripts/push-watch-how.ts (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Dry-run of both push scripts prints 50 neutral notes and 24 watchHow lines; no variants key remains; unit test over the YAML shape passes.
- **blocked_by**: HC-1a
- **Gate**: Drew confirms batches from Fri 23 Oct (about 71 texts)
- **Parallel group**: expo-2

#### Task HC-1c: Everyday watch-for slice inside W5.3 `[OPUS]` (pending)
- **Branch**: claude/hearth-launch-pivot-v1-175462
- **Persona / stage**: Renee, Mei-Lin (Consumer); stage 3
- **Description**: Pure, zero-call watch-for for the dashboard line (D-HC-4). select.ts picks the frontier DLO over learner_dlo_status (WF §3.3), skipping DLOs without a confirmed note; compose.ts joins neutral sign + watchHow[evidenceKind ?? "does"] + {child} + per-child lines (Eclectic uses the neutral how-line, G55). Move nextDloToWatch to src/lib/capabilities/next-dlo.ts and have the constellation import it. Dashboard card with "Log it" to the check-in source. No snapshot change.
- **Files**: `src/lib/watch/select.ts (new)`, `src/lib/watch/compose.ts (new)`, `src/lib/watch/select.test.ts (new)`, `src/lib/watch/compose.test.ts (new)`, `src/lib/capabilities/next-dlo.ts (new)`, `src/app/(auth)/our-story/capabilities/_constellation/topology.ts`, `src/components/dashboard/WatchForLine.tsx (new)`, `src/app/(auth)/dashboard/page.tsx` (entries marked "(new)" do not exist yet)
- **Done when**: Unit and component tests pass; existing topology tests green; no new LLM call; Log it opens /log?source=check-in&learner=&thread=; tsc and lint green on the pivot branch.
- **blocked_by**: HC-1a, HC-1b
- **Gate**: Needs at least one Drew-confirmed note batch and pivot W0.3 merged; first to cut if the calendar slips
- **Parallel group**: expo-2

#### Task HC-1d: Expo page: Cycle section, stand card, research card `[SONNET]` (pending)
- **Branch**: claude/hearth-launch-pivot-v1-175462
- **Persona / stage**: Mei-Lin, Sandra (Gatherer); stage 0
- **Description**: Copy only (D-HC-2): add the "Every session makes the next one better" section and 4 lesson-pattern cards to /expo, a printed stand card and a research card. "Snap · Confirm · Report" stays the hero. Research answers feed R-entries and persona profiles.
- **Files**: `src/app/(public)/expo/expoCopy.ts`, `src/app/(public)/expo/page.tsx`, `docs/hearth-research-log.md` (entries marked "(new)" do not exist yet)
- **Done when**: Copy tests pass; no forbidden Logger words or unsubstantiated claim; /expo renders at 320px with no horizontal scroll; stand and research card text in docs.
- **blocked_by**: none
- **Gate**: Pivot W7.3 landed; Drew's copy approval (B1, B9 as amended, Q-HC-12); Q-HC-11 note only
- **Parallel group**: expo-3

#### Task HC-1e: Drew confirms 11 craft notes and 4 patterns `[SONNET]` (pending)
- **Branch**: n/a (Sanity Studio, drafts to confirmed)
- **Persona / stage**: Drew as confirmer
- **Description**: Prepare the confirm batch for the 11 craft notes and 4 lesson patterns drafted in HC-0 and track Drew confirmation. Nothing renders at the expo. Notes sit as YAML drafts until the knowledgeNote type exists (HC-2b).
- **Files**: `content/knowledge/craft/ (new)`, `content/knowledge/patterns/ (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Drew has marked all 15 items confirmed or edited in the YAML review column.
- **blocked_by**: HC-0
- **Gate**: Drew confirms 11 craft notes and 4 patterns (about 35 min)
- **Parallel group**: expo-3

#### Task HC-1f: Reconcile status-launch-pivot.json with git log `[SONNET]` (pending)
- **Branch**: claude/hearth-launch-pivot-v1-175462
- **Persona / stage**: Drew
- **Description**: status-launch-pivot.json is stale against git log (G3). Reconcile task statuses with merged commits and note that HC-1c lives inside W5.3.
- **Files**: `.claude/plans/status-launch-pivot.json`, `.claude/plans/PLAN-launch-pivot.md` (entries marked "(new)" do not exist yet)
- **Done when**: Every pivot task status matches git log; a note on W5.3 points to HC-1c; JSON parses.
- **blocked_by**: none
- **Gate**: none
- **Parallel group**: expo-1

### Phase 2a

#### Task HC-2a: Migration 0032: adult attribution and family timezone `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Sandra, Renee (two-parent households); stage 5
- **Description**: Add learning_entries.created_by_clerk_user_id, planner_entries.created_by_clerk_user_id and family_settings.timezone (IANA). Write the new column at every write site: entries API, batch/import, runner LogMode, scaffold. Migration touches evidence tables, so backfill is NULL (no guessing). Update factories in the same PR.
- **Files**: `src/lib/db/schema.ts`, `drizzle/0032_adult_attribution_timezone.sql (new)`, `src/app/api/entries/route.ts`, `src/test/factories.ts`, `src/test/db-factories.ts`, `src/app/api/account/delete/orphan-tables.integration.test.ts` (entries marked "(new)" do not exist yet)
- **Done when**: Integration tests assert created_by is set from Clerk userId at each write site; migration applies on a fresh container; tsc and four CI jobs green; in production before any dependent UI.
- **blocked_by**: HC-1c, HC-1d
- **Gate**: Expo passed (9 Nov); pivot PR merged to main; soak week 10–14 Nov; schema approval
- **Parallel group**: 2a-foundations

#### Task HC-2b: knowledgeNote Sanity type, queries and QA plumbing `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Drew as confirmer
- **Description**: New knowledgeNote document with kinds method, craft, practice, signal (later pattern, guide, ageGuide) and per-kind validation; desk group; queries filtered on published && defined(confirmedAt); CLIENT_READ_QUERIES and GATED_TYPES entries; widen Content QA DocType with a standalone entry; scripts/push-knowledge-notes.ts (content/*.yaml to Sanity drafts).
- **Files**: `src/sanity/schemas/knowledgeNote.ts (new)`, `src/sanity/schemas/index.ts`, `sanity.config.ts`, `src/lib/sanity/queries.ts`, `src/lib/sanity/read-allowlist.ts`, `scripts/check-sanity-gating.mjs`, `src/lib/content-qa/rules.ts`, `scripts/push-knowledge-notes.ts (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Schema validation tests per kind pass; gating script and Content QA tests green; dry-run push prints the 15 HC-1e items.
- **blocked_by**: none
- **Gate**: Drew approves the schema before the Studio deploy
- **Parallel group**: 2a-foundations

#### Task HC-2c: Tradition note extension and single PRACTICE_KEYS `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Mei-Lin, Bec (Builder)
- **Description**: Extend pedagogicalFramework with PL §4/§5 fields plus watchHow, notifyDefault and weekShape; make methodologyOverlay.ts the single source of PRACTICE_KEYS and replace the 5+ copies; apply the waldorf key decision everywhere.
- **Files**: `src/sanity/schemas/pedagogicalFramework.ts`, `src/sanity/schemas/methodologyOverlay.ts`, `src/lib/pedagogy/adapter.ts`, `src/components/pedagogy/data.ts` (entries marked "(new)" do not exist yet)
- **Done when**: grep finds one definition of PRACTICE_KEYS; adapter.test.ts (wizard↔adapter contract) green; no waldorf_steiner/waldorf drift left.
- **blocked_by**: HC-2b
- **Gate**: Drew confirms the six tradition notes (about 90 min)
- **Parallel group**: 2a-parallel

#### Task HC-2d: DLO evidenceKind x171, notYet chips, parentVersion fix `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Renee; stage 3
- **Description**: Populate evidenceKind on all 171 DLOs, add notYet chips for the 50 noted DLOs, and resolve the dual meaning of parentVersion (G9): schema says previous version id while ALL_DLOS_QUERY uses it as parent wording. Rename one meaning.
- **Files**: `src/sanity/schemas/discreteLearningObjective.ts`, `src/lib/sanity/queries.ts`, `scripts/set-dlo-evidence-kind.ts (new)`, `docs/hearth-capability-dlo-reference.md` (entries marked "(new)" do not exist yet)
- **Done when**: Dry-run shows 171 with evidenceKind; query tests cover the renamed field; DLO reference regenerated.
- **blocked_by**: HC-1a
- **Gate**: Drew confirm batch for evidenceKind values
- **Parallel group**: 2a-parallel

#### Task HC-2e: Standalone fixes: BottomSheet moduleId, dashboard subjects, Planner un-cut `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Bec; stage 4
- **Description**: Fix BottomSheet dropping moduleId, stop dropping subjects in the dashboard projection, and un-cut the Planner from LAUNCH_SCOPE=expo as the Week shell. Three small commits, but one deliverable per PR: land the two bug fixes first, then the un-cut as the closing commit of this PR only if reviewed together; otherwise split.
- **Files**: `src/components/planner/BottomSheet.tsx`, `src/app/(auth)/dashboard/page.tsx`, `src/lib/launch-scope.ts`, `src/components/nav/navConfig.ts` (entries marked "(new)" do not exist yet)
- **Done when**: Regression tests for each fix pass at the right layer; nav tests show Planner gated only under expo scope.
- **blocked_by**: HC-1f
- **Gate**: Q-HC-13 (Planner un-cut as Week shell)
- **Parallel group**: 2a-parallel

#### Task HC-2f: Docs PR: amend CLAUDE.md Principle 1 and 11 `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Drew
- **Description**: One docs-only PR before HC-3 (build plan Q-HC-2): reword Principle 1 per LC C14 and amend Principle 11 / C-PA1 / C-PA4 to "Pedagogy does not generate content or curriculum. A method may write the next step of a rhythm the family chose, from a fixed action vocabulary, deterministically." Added by this graph: the build plan names the docs PR but gives it no HC id.
- **Files**: `CLAUDE.md`, `docs/PROJECT_STATUS.md`, `docs/hearth-decisions-log-v1.md` (entries marked "(new)" do not exist yet)
- **Done when**: CLAUDE.md and PROJECT_STATUS.md core principles match the confirmed wording; decisions log updated; CI unchanged green.
- **blocked_by**: HC-0
- **Gate**: Q-HC-2 and Q-HC-3 answered by Drew (10–14 Nov)
- **Parallel group**: 2a-parallel

#### Task HC-3a: Rhythms tables `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Mei-Lin stage 3, Bec stage 5
- **Description**: Migration for rhythms and rhythm_state (LC §11) plus planner_entries extensions (source, rhythm_id, item_ref, step jsonb, plan_text, done/skipped/moved status) and learning_entries.outcome jsonb / rhythm_id. All family-scoped tables ON DELETE CASCADE with an orphan-tables test row and factory updates. Principle edits are in HC-2f.
- **Files**: `src/lib/db/schema.ts`, `drizzle/0033_rhythms.sql (new)`, `src/test/factories.ts`, `src/test/db-factories.ts`, `src/app/api/account/delete/orphan-tables.integration.test.ts` (entries marked "(new)" do not exist yet)
- **Done when**: Migration applies; orphan-tables test includes new tables; factories compile; four CI jobs green; in production ≥3 days before UI tasks.
- **blocked_by**: HC-2a, HC-2f
- **Gate**: Schema approval
- **Parallel group**: 2a-foundations

#### Task HC-3b: Turn engine, schedule, week shape, 15 method notes, session API `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Mei-Lin stage 3, Bec stage 5
- **Description**: Deterministic turn engine: a method may write the next step of a family-chosen rhythm from a fixed vocabulary, with zero LLM calls. Golden turn fixtures per method, 15 method notes as knowledgeNote drafts, /api/rhythms and a transactional session-log API.
- **Files**: `src/lib/cycle/turn.ts (new)`, `src/lib/cycle/schedule.ts (new)`, `src/lib/cycle/weekshape.ts (new)`, `src/lib/cycle/starters.ts (new)`, `src/lib/cycle/__fixtures__/ (new)`, `src/app/api/rhythms/route.ts (new)`, `src/app/api/rhythms/[id]/sessions/route.ts (new)`, `content/knowledge/methods/ (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Golden fixtures pass for every method; session-log API is atomic (integration test with forced failure rolls back); no Anthropic import under src/lib/cycle.
- **blocked_by**: HC-3a, HC-2b, HC-2c
- **Gate**: Q-HC-3 answered; Drew confirms the method notes (about 60 min)
- **Parallel group**: 2a-engine

### Cross-cutting

#### Task HC-19: Design reference for every new screen `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Renee, Mei-Lin, Bec, Sandra
- **Description**: No prototypes exist (G40). Produce design specs against tokens v2 for Today, Log a session, Turn, Rhythm note, Week, onboarding starters, Plan something, morning card, /craft, Know Your Child, My Teaching, community. Capture a moment stays one tap from Today.
- **Files**: `docs/hearth-cycle-screens-v1.md (new)`, `prototypes/` (entries marked "(new)" do not exist yet)
- **Done when**: Drew signs off each screen spec; every spec cites a persona and journey stage.
- **blocked_by**: none
- **Gate**: Drew signs off each reference before its UI PR
- **Parallel group**: 2a-parallel

### Phase 2a UI

#### Task HC-4a: Today (replaces dashboard content) `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Renee, Mei-Lin; stages 2–3
- **Description**: Today screen replaces /dashboard content: session cards from planner_entries, watch-for line, capture-a-moment one tap away. Old route behind a flag for a month (§11 control 7). Events (session_viewed) land with the surface.
- **Files**: `src/app/(auth)/dashboard/page.tsx`, `src/components/today/ (new)`, `src/lib/analytics/posthog.ts` (entries marked "(new)" do not exist yet)
- **Done when**: e2e: onboarding to Today shows next session; component tests pass; old dashboard reachable via flag.
- **blocked_by**: HC-3a, HC-3b, HC-19
- **Gate**: C15, C16, C17 confirmed or held as defaults; Q-HC-2, Q-HC-4, Q-HC-13; design sign-off (HC-19)
- **Soak**: HC-3a in production ≥3 days first
- **Parallel group**: 2a-ui

#### Task HC-4b: Log a session (one-tap) `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Mei-Lin stage 3
- **Description**: One-tap Done / Skipped / Moved on a session card via the session-log API, setting created_by.
- **Files**: `src/components/today/SessionCard.tsx (new)`, `src/app/api/rhythms/[id]/sessions/route.ts` (entries marked "(new)" do not exist yet)
- **Done when**: e2e: one tap logs a session and the next session appears; created_by recorded.
- **blocked_by**: HC-4a, HC-2a, HC-3a
- **Gate**: none
- **Soak**: HC-3a in production ≥3 days first; HC-2a in production ≥3 days first
- **Parallel group**: 2a-ui

#### Task HC-4c: Turn surface (ConfirmSurface state) `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Mei-Lin, Bec
- **Description**: After a session is logged, show the Turn: the next step the engine wrote, as a ConfirmSurface state, with Turn-specific copy rules (Logger spec v3 scope, Q-HC-4).
- **Files**: `src/components/logger/confirm/TurnState.tsx (new)`, `src/lib/logger/confirm-state.ts` (entries marked "(new)" do not exist yet)
- **Done when**: Component tests per method fixture; copy lint passes; turn_viewed event fires.
- **blocked_by**: HC-4b, HC-3a
- **Gate**: Q-HC-3, Q-HC-4 (Logger copy rules for Turn)
- **Soak**: HC-3a in production ≥3 days first
- **Parallel group**: 2a-ui

#### Task HC-4d: Rhythm note page /rhythm/[id] `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Bec stage 5
- **Description**: Rhythm detail page: current step, history, edit and branch/attach. Rename the learner-profile "Learning Rhythms" section when Rhythm ships.
- **Files**: `src/app/(auth)/rhythm/[id]/page.tsx (new)`, `src/app/(auth)/our-story/learner/[id]/LearnerProfileClient.tsx` (entries marked "(new)" do not exist yet)
- **Done when**: Page tests pass; rename applied; rhythm_created event fires.
- **blocked_by**: HC-4a, HC-3a
- **Gate**: none
- **Soak**: HC-3a in production ≥3 days first
- **Parallel group**: 2a-ui

#### Task HC-4e: Week (replaces planner content) `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Bec, Sandra
- **Description**: Week view replaces /planner content; the sheet becomes Plan something + Add a rhythm entry points. Planner own overflow-x-auto wrapper per CLAUDE.md.
- **Files**: `src/app/(auth)/planner/`, `src/components/planner/` (entries marked "(new)" do not exist yet)
- **Done when**: Component tests; 320px no page-level horizontal scroll; old planner behind flag.
- **blocked_by**: HC-4a, HC-2e, HC-19, HC-3a
- **Gate**: Q-HC-13
- **Soak**: HC-3a in production ≥3 days first
- **Parallel group**: 2a-ui

#### Task HC-4f: Onboarding starters (D55) `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Mei-Lin stage 1
- **Description**: Onboarding question for start stage and starter rhythms from cycle/starters.ts. Closes G21.
- **Files**: `src/app/(public)/onboarding/`, `src/lib/cycle/starters.ts` (entries marked "(new)" do not exist yet)
- **Done when**: e2e: onboarding to Today to one-tap log to next session.
- **blocked_by**: HC-4a, HC-3a
- **Gate**: none
- **Soak**: HC-3a in production ≥3 days first
- **Parallel group**: 2a-ui

### Phase 2a

#### Task HC-5a: watch_fors table, carry and write-time composition `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Renee stage 3
- **Description**: watch_fors table (WF §9.1, band mapped to tier), session/everyday/week scopes, carry.ts, composed at write time. Cascade FK, orphan test, factories.
- **Files**: `src/lib/db/schema.ts`, `drizzle/0034_watch_fors.sql (new)`, `src/lib/watch/carry.ts (new)`, `src/lib/watch/compose.ts`, `src/test/factories.ts` (entries marked "(new)" do not exist yet)
- **Done when**: Migration + integration tests; carry.test.ts table-driven; watch_for_viewed event defined.
- **blocked_by**: HC-4a, HC-2d
- **Gate**: C19; schema approval
- **Parallel group**: 2a-foundations

### Phase 2a UI

#### Task HC-5b: Watch-fors on Today cards and session start `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Renee, Mei-Lin
- **Description**: Render session-scope watch-fors on Today cards and at session start; answer chips write watch_for_answered.
- **Files**: `src/components/today/WatchFor.tsx (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Component tests; watch_for_answered fires.
- **blocked_by**: HC-5a, HC-4b
- **Gate**: none
- **Soak**: HC-5a in production ≥3 days first
- **Parallel group**: 2a-ui

### Phase 2b

#### Task HC-6a: Cue index `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Bec stage 4
- **Description**: src/lib/cues with content/cues/*.yaml; precedent is situational-signals.ts. Tests pin every emitted cue against vault tags.
- **Files**: `src/lib/cues/ (new)`, `content/cues/ (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Cue index tests pass; golden cue fixtures translated to repo IDs.
- **blocked_by**: HC-5b
- **Gate**: Evidence checkpoint 27 Jan logged as a decision (D-HC-1 control 6)
- **Parallel group**: 2b-a

#### Task HC-6b: Plan something: watch/plan with one constrained Haiku call `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Bec stage 4
- **Description**: watch/plan.ts and Plan something UI. At most one Haiku call at plan save (≤800 tokens, validated, ai_pipeline_logs stage plan); domain fallback; never invent.
- **Files**: `src/lib/watch/plan.ts (new)`, `src/lib/watch/plan.test.ts (new)`, `src/app/api/plans/route.ts (new)`, `src/components/plan/ (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Golden plan fixtures pass; call count asserted ≤1; plan_created event fires.
- **blocked_by**: HC-6a, HC-19
- **Gate**: Evidence checkpoint 27 Jan logged as a decision (D-HC-1 control 6)
- **Parallel group**: 2b-a

#### Task HC-7a: Logger spec v3 `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Renee, Mei-Lin
- **Description**: Write docs/hearth-logger-spec-v3.md: session-log copy rules, forbidden words scoped to spontaneous Notice/Confirm only, Saw it = asserted, Partly rule under PRODUCTION_TIER_BAR.
- **Files**: `docs/hearth-logger-spec-v3.md (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Drew approves the spec; research-log entry added.
- **blocked_by**: HC-5b, HC-2d
- **Gate**: Q-HC-4, Q-HC-5, Q-HC-6
- **Parallel group**: 2b-b

#### Task HC-7b: Conversational session log: script and absorb `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Mei-Lin stage 3
- **Description**: logger/conversation/{script,absorb}: Saw it to confirmProposal; Partly per Q-HC-6; not-yet chips; parent moves at E3+; D68 felt removed from session logs only. lookfor jsonb per child on learning_entries.
- **Files**: `src/lib/logger/conversation/script.ts (new)`, `src/lib/logger/conversation/absorb.ts (new)`, `src/lib/db/schema.ts`, `drizzle/0035_entry_lookfor.sql (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Unit tests for script/absorb; integration test: Saw it writes asserted row, Not yet writes none; session_logged event fires.
- **blocked_by**: HC-7a, HC-4b, HC-19, HC-2d
- **Gate**: Q-HC-6, C20, C21, C25
- **Soak**: HC-2d in production ≥3 days first
- **Parallel group**: 2b-b

#### Task HC-7c: Spontaneous capture chips and lens label `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Renee
- **Description**: Spontaneous capture gets the "Did any of these show up?" chips plus the D40 lens label on "noticed".
- **Files**: `src/components/logger/confirm/`, `src/app/(auth)/log/_components/` (entries marked "(new)" do not exist yet)
- **Done when**: Component tests; copy lint passes.
- **blocked_by**: HC-7b
- **Gate**: none
- **Parallel group**: 2b-b

#### Task HC-8a: Educator tables and event side effects `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Sandra, Bec
- **Description**: educator_profiles and educator_events tables; side-effect events from sessions and plans. Cascade FK, orphan test, factories.
- **Files**: `src/lib/db/schema.ts`, `drizzle/0036_educator.sql (new)`, `src/test/factories.ts` (entries marked "(new)" do not exist yet)
- **Done when**: Migration + integration tests; four CI jobs green.
- **blocked_by**: HC-2a, HC-7b
- **Gate**: C22, C23, C24; schema approval
- **Parallel group**: 2b-c

#### Task HC-8b: Educator evaluation weekly cron `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Sandra, Bec
- **Description**: educator/evaluate.ts weekly cron; table-driven tests; never demotes.
- **Files**: `src/lib/educator/evaluate.ts (new)`, `src/lib/educator/evaluate.test.ts (new)`, `vercel.json`, `src/app/api/cron/educator/route.ts (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Table-driven tests incl. never-demote property; cron route authenticated.
- **blocked_by**: HC-8a
- **Gate**: C22, C23, C24; G56 privacy review
- **Parallel group**: 2b-c

#### Task HC-8c: Teaching help UI, onboarding question, privacy line `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Sandra
- **Description**: Settings Teaching help, quiet mode, onboarding question, APP privacy line on /privacy.
- **Files**: `src/app/(auth)/settings/teaching/ (new)`, `src/app/(public)/privacy/` (entries marked "(new)" do not exist yet)
- **Done when**: Component tests; teaching_help_changed fires.
- **blocked_by**: HC-8b, HC-8a
- **Gate**: none
- **Soak**: HC-8a in production ≥3 days first
- **Parallel group**: 2b-c

#### Task HC-9a: day_briefs and card_events tables, timezone helper `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Mei-Lin stage 3
- **Description**: day_briefs and card_events tables; family-local date helper over family_settings.timezone. Cascade, orphan test, factories.
- **Files**: `src/lib/db/schema.ts`, `drizzle/0037_day_briefs.sql (new)`, `src/lib/time/family-day.ts (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Timezone tests: QLD (no DST) vs NSW (DST) edges; integration green.
- **blocked_by**: HC-2a, HC-8a
- **Gate**: Schema approval; Q-HC-9, Q-HC-10
- **Parallel group**: 2b-d

#### Task HC-9b: Day brief builder and hourly cron `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Mei-Lin
- **Description**: brief/build.ts; hourly cron building at family-local 03:00; rebuild on writes; fatigue rules; Unschooling Monday default.
- **Files**: `src/lib/brief/build.ts (new)`, `src/app/api/cron/day-briefs/route.ts (new)`, `vercel.json` (entries marked "(new)" do not exist yet)
- **Done when**: Build tests incl. fatigue rules; cron idempotent; day_brief_shown event defined.
- **blocked_by**: HC-9a, HC-5b, HC-8b
- **Gate**: Q-HC-9, Q-HC-10
- **Parallel group**: 2b-d

#### Task HC-9c: Morning cards and notification delivery `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Mei-Lin
- **Description**: Opening layer, in-app notification and web push where installed; wire dailyReminder setting; quiet-hours exemption for chosen morning time. Native push later; email vendor later.
- **Files**: `src/lib/notifications/triggers.ts`, `src/components/today/MorningCard.tsx (new)`, `docs/external-services-guide.md` (entries marked "(new)" do not exist yet)
- **Done when**: Notification tests incl. cap 4/day; card_action fires; works offline-safe (no blocking calls).
- **blocked_by**: HC-9b, HC-19, HC-9a
- **Gate**: Q-HC-9 (quiet hours end 6:30), Q-HC-10 (in-app first)
- **Soak**: HC-9a in production ≥3 days first
- **Parallel group**: 2b-d

#### Task HC-10a: Craft card triggers and cooldowns `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Sandra, Bec
- **Description**: WF §7.7 triggers as a fixed list in brief/triggers.ts with cooldowns; craft cards in the brief.
- **Files**: `src/lib/brief/triggers.ts (new)`, `src/lib/brief/triggers.test.ts (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Table-driven trigger tests; cooldown honoured.
- **blocked_by**: HC-9b, HC-2b
- **Gate**: Drew confirms the E3–E4 craft notes
- **Parallel group**: 2b-e

#### Task HC-10b: Craft library /craft with offline precache `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Sandra, Bec
- **Description**: /craft library (brief §5 sections), ungated, in the Explore tray; service worker precaches content routes only.
- **Files**: `src/app/(auth)/craft/ (new)`, `src/components/nav/navConfig.ts`, `public/sw.js` (entries marked "(new)" do not exist yet)
- **Done when**: Offline e2e passes; craft_library_viewed fires.
- **blocked_by**: HC-2b, HC-10a, HC-19
- **Gate**: Drew confirms the E3–E4 craft notes; airplane-mode rule (G53)
- **Soak**: HC-2b in production ≥3 days first
- **Parallel group**: 2b-e

#### Task HC-11: Week shape and Turn the week `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Bec stage 5
- **Description**: Week shape per tradition and Turn the week for Charlotte Mason, Classical and Eclectic first; deterministic.
- **Files**: `src/lib/cycle/weekshape.ts`, `src/components/week/TurnWeek.tsx (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Golden week fixtures for three traditions; component tests.
- **blocked_by**: HC-4e, HC-2c, HC-3b
- **Gate**: Q-HC-3
- **Parallel group**: 2b-f

### Phase 3 (Mar–May)

#### Task HC-12a: Strangler 1: signals as knowledgeNote plus moment_signals table `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Mei-Lin
- **Description**: Add signal knowledgeNotes and moment_signals (PL §11). Additive only; old pedagogy stack untouched.
- **Files**: `src/lib/db/schema.ts`, `drizzle/0038_moment_signals.sql (new)`, `content/knowledge/signals/ (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Migration + integration; old stack tests unchanged and green.
- **blocked_by**: HC-7b, HC-2c, HC-2b
- **Gate**: Q-HC-1 (formal re-open of C-PL1/C-PM1/C-PA2/C-PA5; freeze new corpus investment); schema approval; C10–C13
- **Parallel group**: 3-pedagogy

#### Task HC-12b: Strangler 2: spontaneous post-save signal write (D53) `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Mei-Lin
- **Description**: Dual-write signals after entry save with no new LLM call; shadow-compare against the old accumulated signals.
- **Files**: `src/lib/pedagogy/signals.ts (new)`, `src/lib/ai/enrich.ts` (entries marked "(new)" do not exist yet)
- **Done when**: Integration test: one Haiku call per save preserved; shadow diff report produced.
- **blocked_by**: HC-12a
- **Gate**: Q-HC-1 (formal re-open of C-PL1/C-PM1/C-PA2/C-PA5; freeze new corpus investment); C10–C13
- **Soak**: HC-12a in production ≥3 days first
- **Parallel group**: 3-pedagogy

#### Task HC-12c: Strangler 3: read cutover to tradition notes `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Mei-Lin
- **Description**: Switch lens and vocabulary reads to tradition notes behind a kill-switch; old reads remain.
- **Files**: `src/lib/pedagogy/lens.ts (new)`, `src/lib/pedagogy/adapter.ts` (entries marked "(new)" do not exist yet)
- **Done when**: adapter.test.ts green; kill-switch documented in oncall cheatsheet.
- **blocked_by**: HC-12b
- **Gate**: Q-HC-1 (formal re-open of C-PL1/C-PM1/C-PA2/C-PA5; freeze new corpus investment); shadow diff reviewed by Drew; C10–C13
- **Parallel group**: 3-pedagogy

#### Task HC-12d: Strangler 4: retire lens bundles and methodology overlays `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Drew
- **Description**: Remove lens bundle and methodology overlay reads and schemas once nothing consumes them.
- **Files**: `src/lib/pedagogy/`, `src/sanity/schemas/`, `docs/hearth-pedagogy-system-architecture-v1.md` (entries marked "(new)" do not exist yet)
- **Done when**: grep finds no consumers; tests green; architecture doc updated.
- **blocked_by**: HC-12c
- **Gate**: Q-HC-1 (formal re-open of C-PL1/C-PM1/C-PA2/C-PA5; freeze new corpus investment); C10–C13
- **Soak**: HC-12c in production ≥3 days first
- **Parallel group**: 3-pedagogy

#### Task HC-12e: Strangler 5: retire PKB and corpus path `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Drew
- **Description**: Retire the PKB retrieval and corpus vault engine; keep attribution rendering until no CC-BY source remains.
- **Files**: `src/lib/pedagogy/retrieval.ts`, `src/lib/pedagogy/corpus/`, `corpus/pedagogy/`, `src/components/logger/PedagogyAttribution.tsx` (entries marked "(new)" do not exist yet)
- **Done when**: No PEDAGOGY_KB_ENABLED references; licence attribution preserved where required.
- **blocked_by**: HC-12d
- **Gate**: Q-HC-1 (formal re-open of C-PL1/C-PM1/C-PA2/C-PA5; freeze new corpus investment); PedagogyAttribution removed only when no CC-BY source renders; C10–C13
- **Parallel group**: 3-pedagogy

### Brief-only phase (Mar–May)

#### Task HC-13: Lesson patterns and Lesson Builder `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Bec stage 4
- **Description**: Pattern suggestion = plan cues × suits evidence kinds × tradition fit. Fill {activity} from the plan own words; extraction slots become parent prompts with defaults from the DLO watch-for; no generated text. Depth E1 accept / E2 choose of two / E3 why + mistakes / E4 from scratch. "How this session is built" on Today cards. Replaces SESSION_TEMPLATES.
- **Files**: `src/lib/cycle/patterns.ts (new)`, `src/lib/module-builder/session-templates.ts`, `src/components/today/HowBuilt.tsx (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Golden pattern fixtures; no generated text asserted; SESSION_TEMPLATES removed.
- **blocked_by**: HC-6b, HC-8b, HC-19
- **Gate**: B1–B9 confirmed + own spec (spec-chain README); B4, Q-HC-7
- **Parallel group**: brief-a

#### Task HC-14: Modules as worked examples `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Bec
- **Description**: Approach patternRef + howThisIsBuilt in PrepMode; re-tag script (Starter Pack + 3 sample packs); builder publishes watchFor/pivot + pattern.
- **Files**: `src/sanity/schemas/approach.ts`, `src/components/modules/PrepMode.tsx`, `src/lib/module-builder/publish-payload.ts`, `scripts/retag-patterns.ts (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Publish payload tests include watchFor/pivot/pattern; re-tag dry-run covers four packs.
- **blocked_by**: HC-13
- **Gate**: B1–B9 confirmed + own spec (spec-chain README); B3, B4; kindling learns patternRef (external, G37)
- **Parallel group**: brief-b

#### Task HC-15: Know Your Child `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Renee, Mei-Lin
- **Description**: Age guides; new learner-profile tab; know-your-child/lines.ts at snapshot rebuild into ChildSnapshot.know_your_child; honest-density thresholds per the data-readiness table.
- **Files**: `src/lib/know-your-child/lines.ts (new)`, `src/lib/ai/snapshot.ts`, `src/app/(auth)/our-story/learner/[id]/` (entries marked "(new)" do not exist yet)
- **Done when**: Threshold tests; tab separate from identity portrait per Q-HC-8.
- **blocked_by**: HC-7b, HC-12b, HC-19
- **Gate**: B1–B9 confirmed + own spec (spec-chain README); Q-HC-8; G16 time-of-day decision
- **Parallel group**: brief-c

#### Task HC-16: My Teaching `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Sandra
- **Description**: Opt-in /settings/my-teaching derived from educator_events, card_events and sessions; monthly line; no scores.
- **Files**: `src/app/(auth)/settings/my-teaching/ (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Opt-in respected; no score language; teaching_pulse_answered fires.
- **blocked_by**: HC-8b, HC-9c, HC-19
- **Gate**: B1–B9 confirmed + own spec (spec-chain README); B5
- **Parallel group**: brief-c

### Phase 3 (Mar–May)

#### Task HC-17a: Session photos private and consent enforced (fix now) `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Sandra (Gatherer)
- **Description**: Hearth-session photos are stored access public; enforce private storage and consentEvidenceSharing. Standalone security fix.
- **Files**: `src/app/api/hearths/[id]/sessions/[sessionId]/evidence/route.ts` (entries marked "(new)" do not exist yet)
- **Done when**: Integration tests: new uploads private, consent false blocks sharing.
- **blocked_by**: none
- **Gate**: None; standalone HIGH-severity fix (G42), may land any time
- **Parallel group**: 3-community-prereq

#### Task HC-17b: Redaction helper and narrative name fix `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Sandra
- **Description**: community/redact.ts and stop sending full learner names to Haiku in hearth-narrative.
- **Files**: `src/lib/community/redact.ts (new)`, `src/lib/ai/hearth-narrative.ts` (entries marked "(new)" do not exist yet)
- **Done when**: Property tests for redaction; narrative prompt snapshot has no full names.
- **blocked_by**: none
- **Gate**: Q-HC-14 (community naming, identity, legal)
- **Parallel group**: 3-community-prereq

#### Task HC-17c: family_members.display_name `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Sandra
- **Description**: Display identity column and settings field.
- **Files**: `src/lib/db/schema.ts`, `drizzle/0039_display_name.sql (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Migration and integration tests green.
- **blocked_by**: none
- **Gate**: Q-HC-14 (community naming, identity, legal); schema approval
- **Parallel group**: 3-community-prereq

#### Task HC-17d: UGC terms, privacy policy, contributor licence `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Drew
- **Description**: Draft the legal and store-compliance text. Drew obtains legal review before publication.
- **Files**: `src/app/(public)/terms/`, `src/app/(public)/privacy/`, `docs/hearth-native-app-plan-v1.md` (entries marked "(new)" do not exist yet)
- **Done when**: Drafts reviewed by Drew; compliance checklist added.
- **blocked_by**: HC-0
- **Gate**: Q-HC-14 (community naming, identity, legal); Drew/legal review; Apple 1.2, eSafety BOSE, OAIC children privacy code
- **Parallel group**: 3-community-prereq

#### Task HC-17e: Account deletion cascade policy (pivot W6 prerequisite) `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Drew
- **Description**: Decide and implement cascade vs anonymise for community content on deletion; remove it.fails in orphan-tables test for new tables.
- **Files**: `src/app/api/account/delete/route.ts`, `src/app/api/account/delete/orphan-tables.integration.test.ts`, `docs/hearth-account-deletion-defect-v1.md` (entries marked "(new)" do not exist yet)
- **Done when**: Deletion integration test passes with community rows present.
- **blocked_by**: none
- **Gate**: Pivot W6 deletion fix merged; cascade-or-anonymise policy decided (Q-HC-14)
- **Parallel group**: 3-community-prereq

#### Task HC-17f: Community tables `[OPUS]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Sandra
- **Description**: community_topics, posts, topic_links, guide_roles, reports, blocks with the chosen deletion policy; orphan test and factories.
- **Files**: `src/lib/db/schema.ts`, `drizzle/0040_community.sql (new)`, `src/test/factories.ts` (entries marked "(new)" do not exist yet)
- **Done when**: Migration + integration tests; deletion test green.
- **blocked_by**: HC-17a, HC-17b, HC-17c, HC-17d, HC-17e, HC-19
- **Gate**: B6, B7, B8, Q-HC-14; legal review (G47); schema approval
- **Parallel group**: 3-community-schema

#### Task HC-17g: Moderation: admin queue, COMMUNITY_ENABLED, rate limits `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Drew
- **Description**: Admin report queue using logAdminAction and the reason-required route pattern; COMMUNITY_ENABLED env flag; rate limits.
- **Files**: `src/app/(admin)/admin/community/ (new)`, `src/lib/admin/audit.ts`, `src/app/api/community/` (entries marked "(new)" do not exist yet)
- **Done when**: Integration tests for report, block, takedown with audit rows; flag off hides all routes.
- **blocked_by**: HC-17f
- **Gate**: B6, B7, B8, Q-HC-14
- **Parallel group**: 3-community-schema

#### Task HC-17h: Linked topics UI `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Sandra
- **Description**: Topics linked to DLOs/threads; discussion UI (copy says "discussion", not thread).
- **Files**: `src/app/(auth)/community/ (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Component + e2e tests; moderation reachable from every post.
- **blocked_by**: HC-17g, HC-19, HC-17f
- **Gate**: B6, B7, B8, Q-HC-14
- **Soak**: HC-17f in production ≥3 days first
- **Parallel group**: 3-community-ui

#### Task HC-17i: Ask other parents from a Portfolio entry `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Renee, Sandra
- **Description**: Post from a Portfolio entry with redaction preview.
- **Files**: `src/app/(auth)/portfolio/`, `src/lib/community/redact.ts` (entries marked "(new)" do not exist yet)
- **Done when**: Redaction preview shown before post; tests for no-name leak.
- **blocked_by**: HC-17h, HC-17b
- **Gate**: B6, B7, B8, Q-HC-14
- **Parallel group**: 3-community-ui

#### Task HC-17j: Guides, answer promotion with credit, threshold counts `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Sandra
- **Description**: Guide roles, answer promotion with credit, counts shown only above a threshold.
- **Files**: `src/app/(auth)/community/`, `src/lib/community/` (entries marked "(new)" do not exist yet)
- **Done when**: Threshold tests; credit attribution tests.
- **blocked_by**: HC-17h
- **Gate**: B6, B7, B8, Q-HC-14
- **Parallel group**: 3-community-ui

#### Task HC-18: Curated resources `[SONNET]` (pending)
- **Branch**: main (one branch per PR)
- **Persona / stage**: Renee
- **Description**: resourceLink type; regulator links read from jurisdictions config; link-rot script.
- **Files**: `src/sanity/schemas/resourceLink.ts (new)`, `src/config/jurisdictions.ts`, `scripts/check-link-rot.mjs (new)` (entries marked "(new)" do not exist yet)
- **Done when**: Schema + query tests; link-rot script dry-run passes.
- **blocked_by**: HC-2b
- **Gate**: none
- **Parallel group**: brief-d

## Decision queue (Drew)
| ID | Recommendation | Blocks |
|---|---|---|
| Q-HC-1 | Confirm D45 direction; formally re-open C-PL1/C-PM1/C-PA2/C-PA5; freeze new corpus investment (pause wave 2–5 acks); PEDAGOGY_KB_ENABLED stays off; HC-12 retires pieces as a strangler. | HC-12a, HC-12b, HC-12c, HC-12d, HC-12e |
| Q-HC-2 | Confirm. Edit CLAUDE.md and PROJECT_STATUS.md core principles in one docs PR before HC-3. | HC-2f, HC-3a, HC-4a |
| Q-HC-3 | Amend to: "Pedagogy does not generate content or curriculum. A method may write the next step of a rhythm the family chose, from a fixed action vocabulary, deterministically." Guard still applies to authored text. | HC-2f, HC-3b, HC-11 |
| Q-HC-4 | Scope the D-LPS-14 list to spontaneous Notice and Confirm. Session logs, Turn and cards get their own rules in Logger spec v3: no "should", no praise of the parent, why ≤ 20 words. | HC-4a, HC-4c, HC-7a, HC-7b |
| Q-HC-5 | No change now. Saw it writes asserted. TP §2.1 ledger stays post-expo behind confirmProposal(). | HC-7a |
| Q-HC-6 | Write asserted at the current tier only if the child already has observed evidence there; otherwise no row. | HC-7a, HC-7b |
| Q-HC-7 | A pattern is a neutral shape; a method references a pattern (§3 ruling). | HC-13 |
| Q-HC-8 | Separate learner tab, "What we've noticed"; portrait untouched. | HC-15 |
| Q-HC-9 | Exempt the chosen morning time from quiet hours; move default quiet-hours end to 6:30. | HC-9a, HC-9b, HC-9c |
| Q-HC-10 | In-app layer first; add an email vendor only when the opt-in fallback is wanted, recorded in external-services-guide.md. | HC-9a, HC-9b, HC-9c |
| Q-HC-11 | Note only; pivot copy is Drew's call. | none |
| Q-HC-12 | Do not use as a claim without substantiation (Australian Consumer Law); use "Every session makes the next one better". | HC-1d |
| Q-HC-13 | Un-cut as the Week shell (HC-2e); the sheet becomes Plan something plus Add a rhythm. | HC-2e, HC-4a, HC-4e |
| Q-HC-14 | community_* tables; family_members.display_name; UGC terms and a contributor licence before promoting answers. | HC-17c, HC-17d, HC-17e, HC-17f, HC-17g, HC-17h, HC-17i, HC-17j |

Decided 21 Oct 2026: D-HC-1…5 (see the doc §4.1). Human gates are listed in the status file.
