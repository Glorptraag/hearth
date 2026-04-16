# Plan: Logger Depth & Didactic Coaching

> Pharao output — generated 2026-04-15. Review before executing.
> Source spec: `~/.claude/plans/eager-foraging-mountain.md` (approved).

## Overview

Upgrade the retrospective logger from passive capture to active didactic coaching: pre-entry thread prime, Guided Mode for onboarding families (chip-unfold depth capture + raised completeness gate + teaching tooltips), in-flight PKB-driven coach hints behind a pluggable provider interface (retrieval today, Haiku-upgrade path scaffolded), snapshot-aware reflection prompts, and a template-driven post-save profile nudge. Zero runtime LLM calls ship in v1; the provider scaffold preserves the option to pivot to Haiku/Sonnet per surface.

## Phases

### Phase 1 — Foundations (parallel)

#### Task 1.1: DB schema + Drizzle migration `[SONNET]`
- **Description**: Add `learningEntries.observationDetails jsonb` (default `{}`) and `families.loggerDefaultMode text` (nullable). Generate the Drizzle migration SQL. This unblocks both server-side persistence and the Zod schema updates.
- **Files**: `src/lib/db/schema.ts`, `drizzle/*` (new migration file)
- **Done when**: `pnpm drizzle-kit generate` produces a migration touching both columns; `pnpm drizzle-kit push` (or equivalent) runs cleanly against local Neon; schema.ts exports reflect the new columns with correct TS types.
- **Parallel group**: A

#### Task 1.2: Coaching provider contracts + resolver + LLM scaffolds `[SONNET]`
- **Description**: Create the provider interface that every coaching surface will implement, plus an env-flag resolver and stubbed Haiku/hybrid providers that throw `NotImplemented` until we flip them on. This is pure type/infra work — no behavior. Scaffolds live behind `LOGGER_COACH_PROVIDER=retrieval|haiku|hybrid` (default `retrieval`).
- **Files**: `src/lib/logger/coaching/types.ts`, `src/lib/logger/coaching/resolve.ts`, `src/lib/logger/coaching/haiku-provider.ts`, `src/lib/logger/coaching/hybrid-provider.ts`
- **Done when**: `resolveCoachHintProvider()` returns the correct stub/impl based on env; `haiku-provider` and `hybrid-provider` export classes that conform to the interface but throw on call; TS compiles; no callers yet.
- **Parallel group**: A

#### Task 1.3: Static coaching copy files `[SONNET]`
- **Description**: Author the two static copy files: (a) `guided-copy.ts` — one-line "what we're noticing for" hint per logger section (6 sections); (b) `thread-nudges.ts` — per-thread-id template for post-save `profile_nudge`. Templates use `{name}` placeholder. Covers the full thread id set from enrich.ts (L1–L9, M1–M9, S1–S6, H1–H6, P1–P5, PS1–PS7, C1–C7, EF1–EF8).
- **Files**: `src/lib/logger/guided-copy.ts`, `src/lib/logger/thread-nudges.ts`
- **Done when**: Both files export typed maps; every thread id has a template; `guided-copy.ts` exports hints keyed by section id matching what `log/page.tsx` already uses.
- **Parallel group**: A

#### Task 1.4: Retrieval-based CoachHintProvider `[OPUS]`
- **Description**: Build the default v1 provider that backs in-flight coach hints. Wraps `retrievePedagogyChunks()` / `buildPedagogyContextWithSources()` with a tight budget (top-k 2, ~400 tokens), maps raw chunks to `CoachHint` objects (title + one-sentence body + sourceRef), and caches on `(description_hash, learnerIds.sorted, activityType)` for the session. Requires judgment on: hash function choice, cache TTL, what chunk metadata becomes the hint title vs body, how to degrade when `PEDAGOGY_KB_ENABLED=false`.
- **Files**: `src/lib/logger/coaching/retrieval-provider.ts`
- **Done when**: Unit test: given a mocked retrieval returning 3 chunks, provider returns ≤2 hints, cache hit on identical input returns synchronously without re-calling retrieval; returns empty array cleanly when PKB disabled.
- **Gate**: Blocked on 1.2 (needs `CoachHintProvider` interface).
- **Parallel group**: A (runs after 1.2 inside the same phase; 1.2 is small enough that T2 finishes it before T1 needs it)

#### Task 1.5: Post-save nudge provider (template impl) `[SONNET]`
- **Description**: Implement `nudge-provider.ts` with a `TemplateNudgeProvider` that picks the primary child's top quiet thread from the snapshot, looks up `thread-nudges.ts`, substitutes `{name}`, and returns `{ text, thread_id }`. Returns `null` if no quiet thread qualifies (e.g., new family with no snapshot yet). Same provider interface pattern as 1.2 so an LLM variant can replace it later.
- **Files**: `src/lib/logger/coaching/nudge-provider.ts`
- **Done when**: Unit test: given a snapshot with quiet thread `M3` for child "Ada", returns the M3 template with "Ada" substituted; returns null when snapshot is empty.
- **Gate**: Blocked on 1.2 (interface), 1.3 (templates).
- **Parallel group**: A

---

### Phase 2 — Server surfaces (parallel after Phase 1)

#### Task 2.1: `/api/logger/coach-hints` endpoint `[SONNET]`
- **Description**: Thin Next.js route handler. Accepts the `CoachHintInput` shape (familyId from Clerk auth, learnerIds, activityType, description, observations, snapshotSignals — server re-derives snapshotSignals from the cached snapshot; client does not send them). Resolves provider via `resolveCoachHintProvider()`, returns `CoachHint[]`. Rate-limit 60/min/user.
- **Files**: `src/app/api/logger/coach-hints/route.ts`
- **Done when**: `curl` against local dev with valid session returns hints within ~400ms (PKB cold) / ~50ms (warm); Zod-validates input; 401s unauthed; 429s over rate limit.
- **Gate**: Blocked on 1.2 (resolver), 1.4 (retrieval provider).
- **Parallel group**: B

#### Task 2.2: Enrichment integration — observationDetails + profile_nudge `[OPUS]`
- **Description**: Two changes to `enrich.ts`: (a) include `observationDetails` as a structured block inside the user prompt so Haiku can cite specifics; (b) after Haiku returns a valid `EnrichmentResult`, call `TemplateNudgeProvider.getNudge()` and attach `profile_nudge` to the result before persisting. Must handle: missing observationDetails (old entries), failed nudge lookup (return null, do not fail enrichment), updating the `EnrichmentResult` type. Requires judgment on prompt-block formatting and where nudge generation sits relative to the Sonnet fallback path.
- **Files**: `src/lib/ai/enrich.ts`, `src/types/enrichment.ts` (or equivalent type home)
- **Done when**: A test entry with populated `observationDetails` produces an enrichment whose user-prompt snapshot (logged in dev) contains the structured block; the returned `aiEnrichment` jsonb contains a `profile_nudge` field (or explicit null); existing entries without observationDetails enrich identically to current behavior.
- **Gate**: Blocked on 1.1 (schema has the column to read), 1.3 (templates exist), 1.5 (nudge provider).
- **Parallel group**: B

#### Task 2.3: Entries API — Zod + persistence for new fields `[SONNET]`
- **Description**: Update `createEntrySchema` in `src/app/api/entries/route.ts` to accept optional `observationDetails` (record of chipId → `{ detail: string, durationMin?: number }`) and optional `mode: 'guided' | 'quick'`. Persist `observationDetails` to the new column on insert. `mode` is informational for now — log it in telemetry but don't gate on it server-side.
- **Files**: `src/app/api/entries/route.ts`
- **Done when**: POST /api/entries accepts the new shape, rejects malformed details, writes them to the row; regression — existing payloads (no new fields) continue to work unchanged.
- **Gate**: Blocked on 1.1 (column must exist).
- **Parallel group**: B

---

### Phase 3 — Client (components parallel, integration serial)

#### Task 3.1: `WatchForTodayStrip` component `[SONNET]`
- **Description**: Compact header strip, mounts below the Who-Was-Learning section once children are selected. For each selected child, fetches from the existing snapshot API and renders one "spark" thread (active) + one "quiet" thread (gap) with plain-language label + one example. Dismissible for the session via local state. Uses `LEARNER_COLOUR_MAP` for name chips. Design-token compliant (canonical names only).
- **Files**: `src/components/logger/WatchForTodayStrip.tsx`
- **Done when**: Storybook-equivalent ad-hoc render with mocked snapshot shows correct chips per child; handles empty snapshot gracefully (renders nothing); keyboard-dismissible.
- **Parallel group**: C

#### Task 3.2: `ObservationChipDetail` component `[SONNET]`
- **Description**: Inline unfold field that appears beneath an observation chip when it's active in Guided Mode. Per-chip config: "Deeply focused" → duration + detail textarea; "Asked questions" → quote capture; "Made connections" → "connected to what?"; "Explained reasoning" → quote capture. Controlled component; reports `{ detail, durationMin? }` to parent. Clears on un-tap. Must use canonical tokens (no `bg-primary`, no white-tinted borders).
- **Files**: `src/components/logger/ObservationChipDetail.tsx`
- **Done when**: Each chip type renders its correct field; value reports back on change; component is a11y-compliant (labels wired to inputs).
- **Parallel group**: C

#### Task 3.3: `GuidedModeToggle` component `[SONNET]`
- **Description**: Header toggle with two states (Guided / Quick) plus a small info popover explaining the difference. Controlled; reads from a prop `mode` and emits `onChange`. Persists user override to `families.loggerDefaultMode` via an existing settings API call (or a small PATCH helper if none exists — if so, flag as subtask to 2.3).
- **Files**: `src/components/logger/GuidedModeToggle.tsx`
- **Done when**: Toggle flips between modes; persists choice; popover is keyboard accessible; design tokens only.
- **Parallel group**: C

#### Task 3.4: Reflection prompt upgrade with snapshotSignals `[OPUS]`
- **Description**: Extend `generateReflectionPrompts()` in `keyword-matcher.ts` to accept `snapshotSignals` (per-child quiet + active threads). Add two new prompt classes: gap-linked (quiet thread matches current activity type) and teaching cue (prepends "why this matters" framing when the family is in onboarding window). Must keep total prompts ≤ 2 and existing prompt ordering heuristics intact. Requires judgment on matching thread→activity mapping and which existing prompt to displace when gap-linked fires.
- **Files**: `src/lib/ai/keyword-matcher.ts`
- **Done when**: Unit tests cover: (a) no snapshotSignals → identical output to current function; (b) quiet M3 + cooking activity → emits gap-linked prompt; (c) onboarding flag → one prompt gets teaching framing; (d) never exceeds 2 prompts.
- **Parallel group**: C

#### Task 3.5: `log/page.tsx` integration `[OPUS]`
- **Description**: Wire everything into the existing logger page. Specifically: (a) resolve mode on mount (fetch family entry count + `loggerDefaultMode`, default Guided if count<20 and no override); (b) render `WatchForTodayStrip` below children section; (c) render `GuidedModeToggle` in header; (d) in Guided Mode, render `ObservationChipDetail` beneath each active chip and roll its values into local `observationDetails` state; (e) raise completeness threshold 50→65 in Guided Mode and weight the new gates (per-child discovery ≥20 chars on engagement 1/4, ≥1 observation with detail filled, activity required); (f) debounce description/activity/children at 1200ms → POST `/api/logger/coach-hints` → render `CoachHint[]` in the existing insights panel; (g) pass `snapshotSignals` to `generateReflectionPrompts`; (h) include `observationDetails` and `mode` in the save payload; (i) post-save, render `profile_nudge` beneath `insight_suggestions`. Preserve Quick Mode byte-for-byte.
- **Files**: `src/app/(auth)/log/page.tsx`
- **Done when**: Manual QA walkthrough (see Verification) passes; no regression in Quick Mode payload; TypeScript compiles; `pnpm lint` clean.
- **Gate**: Blocked on 3.1, 3.2, 3.3, 3.4 (all consumed here); 2.1 (endpoint must exist to call); 2.3 (Zod must accept new payload shape).
- **Parallel group**: D

---

### Phase 4 — Verification

#### Task 4.1: Unit tests `[SONNET]`
- **Description**: Vitest/Jest tests for `generateReflectionPrompts` (with/without snapshotSignals), `TemplateNudgeProvider`, retrieval provider cache, and completeness scoring boundary at 65% in Guided Mode.
- **Files**: `src/lib/ai/__tests__/keyword-matcher.test.ts`, `src/lib/logger/coaching/__tests__/*.test.ts`, `src/app/(auth)/log/__tests__/completeness.test.ts`
- **Done when**: All new tests pass locally; no snapshot test drift.
- **Gate**: Blocked on 3.4, 1.4, 1.5, 3.5.
- **Parallel group**: E

#### Task 4.2: Integration + manual QA + regression `[SONNET]`
- **Description**: Local integration flow: seed a first-entry family, confirm Guided is default, walk all 6 sections with chip unfolds, confirm completeness gate blocks thin entries at 64%, verify `/api/logger/coach-hints` returns within budget, save → enrichment logs show observationDetails block + profile_nudge populated. Seed a 25-entry family → Guided tapers. Run existing entries-API test suite to confirm zero Quick Mode regression. No `preview_start` (per user memory — use `pnpm dev` + manual browser).
- **Files**: (test run only; no new files unless a regression is found)
- **Done when**: Checklist in Verification section of the approved plan is green; regression suite passes.
- **Gate**: Blocked on 4.1 and all of Phase 3.
- **Parallel group**: E

---

## Dependency Graph

```
Phase 1:
  1.1 ──┐
  1.2 ──┼── 1.4 ──┐
  1.3 ──┼── 1.5 ──┤
        │         │
Phase 2:│         │
  1.1 ─ 2.3       │
  1.2+1.4 ─ 2.1 ──┤
  1.1+1.3+1.5 ─ 2.2
                  │
Phase 3:          │
  3.1, 3.2, 3.3, 3.4 (all independent, parallel)
                  │
  3.1+3.2+3.3+3.4+2.1+2.3 ─ 3.5
                                │
Phase 4:                        │
  (everything) ─ 4.1 ─ 4.2
```

## Parallel Execution Guide

Two terminals is the sweet spot. Three is possible during Phase 1/3 but adds coordination cost.

| Terminal | Phase 1        | Phase 2      | Phase 3         | Phase 4 |
|----------|----------------|--------------|-----------------|---------|
| T1 (Opus)   | 1.4          | 2.2          | 3.4 → 3.5       | 4.2     |
| T2 (Sonnet) | 1.1, 1.2, 1.3, 1.5 | 2.1, 2.3 | 3.1, 3.2, 3.3  | 4.1     |

T1 takes the judgment-heavy work (retrieval tuning, enrichment prompt surgery, keyword-matcher logic, page integration). T2 sweeps the scaffolding, API plumbing, and static components in parallel.

## Status

_Last updated: 2026-04-16. 14/15 tasks done; only 4.2 (integration + manual QA) remains._

| Task | Status | Completed By | Completed At |
|------|--------|--------------|--------------|
| 1.1  | ✅ done    | T2 | 2026-04-15 |
| 1.2  | ✅ done    | T2 | 2026-04-15 |
| 1.3  | ✅ done    | T2 | 2026-04-15 |
| 1.4  | ✅ done    | T1 | 2026-04-16 |
| 1.5  | ✅ done    | T2 | 2026-04-15 |
| 2.1  | ✅ done    | T2 | 2026-04-16 |
| 2.2  | ✅ done    | T1 | 2026-04-16 |
| 2.3  | ✅ done    | T2 | 2026-04-15 |
| 3.1  | ✅ done    | T2 | 2026-04-15 |
| 3.2  | ✅ done    | T2 | 2026-04-15 |
| 3.3  | ✅ done    | T2 | 2026-04-15 |
| 3.4  | ✅ done    | T1 | 2026-04-15 |
| 3.5  | ✅ done    | T1 | 2026-04-16 |
| 4.1  | ✅ done    | T2 | 2026-04-16 |
| 4.2  | ⬜ pending | —  | —          |

**Next action:** T1 picks up 4.2 — all blockers (4.1, 3.5, 2.1, 2.2, 2.3) are `done`. Run the local integration + regression checklist from Section Verification of `~/.claude/plans/eager-foraging-mountain.md`.

---

## Session Prompts

### Terminal 1 (Opus)
> Read `.claude/plans/PLAN-logger-depth-coaching.md` and `.claude/plans/status-logger-depth-coaching.json`. Also read the source spec at `~/.claude/plans/eager-foraging-mountain.md` for full context.
>
> Execute your column in order: 1.4 → 2.2 → 3.4 → 3.5 → 4.2. Before starting each task, check `status.json` for your `blocked_by` list and wait if any listed task is still `pending` or `in_progress`. Claim a task by setting its status to `in_progress` and `completed_by` to `T1` before you start work.
>
> When a task is done: set its status to `done`, stamp `completed_at` with ISO now, and move to the next one. If a blocker is still pending, stop and wait — do not skip ahead.

### Terminal 2 (Sonnet)
> Read `.claude/plans/PLAN-logger-depth-coaching.md` and `.claude/plans/status-logger-depth-coaching.json`. Also read the source spec at `~/.claude/plans/eager-foraging-mountain.md` for full context.
>
> Execute your column in order: 1.1, 1.2, 1.3 in parallel-safe sequence → 1.5 → 2.1, 2.3 → 3.1, 3.2, 3.3 → 4.1. Before starting each task, check `status.json` for `blocked_by` and wait if listed blockers aren't `done`. Claim a task by setting its status to `in_progress` and `completed_by` to `T2`.
>
> When done: status → `done`, stamp `completed_at`. Adhere strictly to CLAUDE.md design tokens when building components — no `bg-primary`, no white-tinted borders, serif for content / sans for UI, canonical shadow utilities.
