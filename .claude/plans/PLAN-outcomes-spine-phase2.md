# Plan: Outcomes Spine — Phase 2 (Activation & Honesty)

> Pharao output — generated 2026-06-12, from the Fable review of the completed Phase-1 run (PRs #179–#183, all merged, CI green).
> Mode: **manual** (chips/sessions; Drew gates all prod mutations).
> State: `.claude/plans/status-outcomes-spine.json` (phase-2 tasks merged in; A/B/C/D ids supersede the old P-* parking slots).
> Companion: `docs/hearth-outcomes-spine-plan-v1.md` (product/UX brief — still governing), `.claude/plans/PLAN-outcomes-spine.md` (phase 1, complete).

## Why phase 2 exists

Phase 1 fixed the code; the review found the remaining gaps are **data activation** (prod content/history doesn't yet flow through the new pipeline), **content** (transposer plumbed but unloaded), and the **two deliberately-parked workstreams** (WS-4 progression honesty, WS-6 authoring contract) whose decision gates are now ripe. Specific findings being resolved:

1. 17 stray legacy thread docs; 44 activities + 18 modules silently contribute no declared evidence
2. `learner_dlo_status` near-empty in prod (DLOs seeded late) — constellation DLO dots dark for pilot families
3. P-1 thread-links backfill built but never run
4. Zero `regulatoryMappings` authored — report still on LLM fallback
5. Golden-set gold labels never got the G3 editorial review
6. Stale "0 DLOs in production" claim in both audit docs
7. Count-based thread tiers + one-observation `demonstrating` ratchet (WS-4, D-OS4)
8. No per-tier activity targeting; 120/274 activities declare no threads at all (WS-6, D-OS1); copy-to-all-learners attribution (D-OS2)
9. Cosmetic: `claimedTier` in parent-facing API; AC9 prefix-map duality (report lib vs snapshot-rebuild)

## Tracks

### Track A — Data activation (ops; every prod write gated by Drew in-session)

- **A1 — Stray-thread remediation.** Chip already queued (`task_378f5f26`). Script + dry-run report → Drew approves → execute re-point → verify (`activitiesWithUuidThreadRefs` = 0, `modulesWithUuidThreadRefs` = 0, thread count = 57) → `--delete-strays`. Two ambiguous title mappings ("Text Structure", "Mathematical Communication") are flagged for Drew, not guessed.
- **A2 — Prod thread-links backfill** (was P-1). After A1, so re-pointed refs resolve. `scripts/backfill-thread-links.mjs`: dry-run → `--limit 10` → full; then snapshot rebuilds for affected families (admin rebuild or `entry_saved`-equivalent trigger). Verify: declared `source_counts` appear in a pilot family's snapshot.
- **A3 — DLO history backfill** (was P-7; **resolves D-OS3 = yes** — the 3.3 eval justifies it: P 0.589 / R 0.633 with descriptor grounding, ~2.5k tokens/entry on Haiku ≈ cents per 100 entries). `scripts/backfill-dlo-links.mjs` ramp after A2 so re-enrichment sees clean declared candidates. Watch the AI-cost dashboard + noisy-family threshold during the full run.
- **A4 — Audit-doc truth pass** (micro). Annotate both `docs/audits/dlo-mapping-eval-*.md`: the "0 DLO docs / UUID-keyed threads" production claim was true at T3 run-time, stale now (171 published DLOs, 57 coded threads verified 2026-06-12). One small docs PR.

### Track B — Transposer activation (content + gated seed)

- **B1 — Golden-set label review** (Drew, ~30–60 min, standing G3 debt). Review `scripts/data/dlo-golden-set.ts` tier-boundary calls, especially gs-12 and gs-13 (the two "regressions" that may be gold-label errors). If labels change: re-run `node scripts/eval-dlo-mapping.mjs` both modes, update the audit docs.
- **B2 — Draft `ac-v9-qld` mappings, tranche 1** (was P-3 start). Chip queued. Scope: threads observed in pilot data ∪ Starter Pack declared threads. Each (DLO → AC9 code list, contribution, evidenceWeight) drafted with codes verified against ACARA v9 (not from model memory alone), linted by `AC9_CODE_PATTERN`, output as a PR to `scripts/data/dlo-regulatory-mappings.ts` for Drew's review. Tranche 2 (full 171) follows the same pattern once tranche 1 survives a real report.
- **B3 — Seed + activate** (was P-2). After B2 merges + Drew's go: `npx tsx scripts/seed-dlo-mappings.ts` against prod Sanity → report flips to deterministic for QLD automatically (fallback contract) → verify with one pilot family's report (determinism: export twice, diff) → regenerate `docs/hearth-capability-dlo-reference.md` (now includes `regulatoryMappings`). Timing care: not the week a family is mid-HEU-submission.

### Track C — Progression honesty (WS-4; the parent-visible one, gated hardest)

- **C1 — Admin tier-comparison tool** (chip queued; code, no prod mutation, no parent-facing change). Pure lib `deriveThreadTierFromDlos(dloStatuses, sourceCounts, bar)` with the D-OS4 bar parameterised (proposed default: `demonstrating` requires ≥1 declared/asserted link OR ≥2 inferred on distinct days; thread tier = highest tier with sufficient evidence). Admin route + panel: per learner × thread, count-based tier vs derived tier side by side, with deltas highlighted. Meaningful only after A2/A3 populate the data.
- **C2 — Decision D-OS4** (Drew). Read the C1 comparison over real pilot data; fix the bar.
- **C3 — WS-4 implementation** (one PR, the only meaning-changing one — full §5 discipline). Thread tier derived from DLO evidence; counts demoted to volume signal; parent overrides preserved (lower-only); fabricated `dlos_confirmed`/`dlos_total` deleted from snapshot payload and consumers; **one-time shift notice** on the `recommendations_refreshed` pattern ("We've made the constellation more honest about what we've observed — nothing your child did was lost"); fold in the two cosmetic fixes: drop `claimedTier` from the parent-facing dlo-evidence response (admin keeps it), and reconcile the snapshot-rebuild AC9 prefix map with `src/lib/report/deterministic-coverage.ts`'s.

### Track D — Authoring contract (WS-6; modules writing to their standards)

- **D0 — Decision D-OS1** (Drew). Does completing a targeted activity write DLO *evidence* at the declared tier, or an *opportunity* pending corroboration? Recommendation stands: opportunity + cheap corroboration (Haiku per-child signal), protecting C3's evidence bar.
- **D1 — WS-6 implementation.** `capabilityTargets: [{thread, tier}]` on the activity schema (alongside `capabilityThreads` during migration); `thread-links.ts` consumes declared tier instead of `DEFAULT_TIER: 'developing'`; entry save writes DLO links at declared (thread, tier) with `declared` provenance per D0's semantics.
- **D2 — Standards enforcement + content pass.** Workbench publish soft-flag for activities with no threads/targets (120 of 274 today); kindling spec/orchestrator populates `capabilityTargets`; Starter Pack content pass to add targets; regenerate the DLO reference doc's authoring guidance.
- **D3 — Per-learner attribution** (resolves D-OS2; recommend: gate DLO links by `per_child_signals` — only learners Haiku named). Small `dlo-persistence` change + tests. Rises to urgent if Hearth-group sessions start producing multi-family evidence.

## Sequencing

```
A1 ─► A2 ─► A3 ─────────────┐
A4 (anytime)                ├─► C1 review data ─► C2 (D-OS4) ─► C3
B1 (anytime, Drew)          │
B2 ─► review ─► B3          │   D0 (D-OS1, anytime) ─► D1 ─► D2
                            │   D-OS2 ─► D3 (with or after D1)
C1 build (anytime) ─────────┘
```

Tracks A, B, and the C1/D0 starts are independent — run in parallel. C3 is last among behaviour changes (needs A-data + C1 evidence + D-OS4). D-OS5 ("saw it" tap) stays deferred to pilot research — unchanged.

## Decision memo (what only Drew can do, in order of when it bites)

| Decision | When | Recommendation on file |
|---|---|---|
| Approve A1 re-point + the 2 ambiguous thread mappings | at the A1 chip's dry-run report | mapping table in chip |
| Approve A2/A3 prod runs | after A1 verifies | ramp: dry-run → 10 → full |
| D-OS3 re-enrichment | folded into A3 approval | **yes** (eval justifies) |
| B1 golden labels | anytime, ~30–60 min | review gs-12/gs-13 first |
| B2 mapping review + B3 seed go | at the B2 PR | tranche-1 scope |
| D-OS1 completion semantics | before D1 | opportunity + corroboration |
| D-OS2 attribution | before D3 | gate by per_child_signals |
| D-OS4 demonstrating bar | after C1 + A-data | ≥1 declared/asserted OR ≥2 inferred distinct-day |

## Chips queued

1. **A1** — "Remediate stray capability-thread refs in Sanity" (`task_378f5f26`, from the review)
2. **A2+A3+A4** — "Activate prod capability data (backfills)" — gated in-session at every prod write
3. **C1** — "Build admin tier-comparison panel (WS-4 prep)" — plain code PR
4. **B2** — "Draft ac-v9-qld DLO mappings (tranche 1)" — PR for review, no seed

C3, D1–D3 get chipped when their decisions land. Model guidance: B2 on Opus (curriculum-code accuracy is judgment + verification work); A2/A3 ops and C1 on Sonnet.

## Spawnable task prompts (manual-mode dispatch)

Each fenced block is a self-contained, cold-start prompt — paste into a fresh session/chip to run that one task. Every prompt names its task id, files, gate, and the status-JSON update on completion. **Chip tray holds only the four ready-now tasks** (A1, A4, B2, C1); the gated ones live here and get spawned when their gate clears.

### Ready to spawn now

**A1 — Remediate stray capability-thread refs** `[SONNET]` (standard) · chip `task_378f5f26` · self-gates at the dry-run report
```
Hearth LMS (Sanity content layer). Execute task A1 from .claude/plans/PLAN-outcomes-spine-phase2.md (read the plan + .claude/plans/status-outcomes-spine.json). MANUAL MODE — Drew approves the re-point at the dry-run report before any Sanity write.
Problem: 17 stray legacy capability-thread docs in Sanity; 44 activities + 18 modules reference threads by UUID instead of the 57 canonical coded threads (canon: src/lib/capability-universe-v2.ts, src/types/capability-universe.ts).
Build a remediation script (e.g. scripts/remediate-stray-threads.mjs) that: (1) emits a DRY-RUN report mapping each UUID ref → its canonical coded thread by title; (2) flags the two ambiguous title mappings — "Text Structure" and "Mathematical Communication" — for Drew, do NOT guess them; (3) on approval, re-points refs via src/lib/sanity/mutations.ts; (4) verifies activitiesWithUuidThreadRefs=0, modulesWithUuidThreadRefs=0, thread count=57; (5) a final --delete-strays removes the 17 orphans last.
Show Drew the dry-run + the 2 ambiguous mappings; wait for approval before writing. On completion set A1 done in the status JSON. Model: Sonnet.
```

**A4 — Audit-doc truth pass** `[SONNET]` (micro, Haiku fine) · no gate
```
Hearth LMS. Execute task A4 from .claude/plans/PLAN-outcomes-spine-phase2.md (read plan + .claude/plans/status-outcomes-spine.json). Docs-only — no code, no prod write.
Both docs/audits/dlo-mapping-eval-baseline.md and docs/audits/dlo-mapping-eval-post-ws3.md carry a stale "0 DLO docs / UUID-keyed threads in production" claim. It was true at the T3 eval run-time but is stale now: 171 published DLOs + 57 coded threads, verified 2026-06-12. Annotate both docs — don't delete the original claim; mark it true-at-runtime / stale-now with the corrected figures and date. One small docs-only PR.
On completion set A4 done in the status JSON. Model: Sonnet (Haiku is fine).
```

**B2 — Draft ac-v9-qld DLO mappings (tranche 1)** `[OPUS]` (standard) · chip `task_e9964732` · no gate · PR only, no seed
```
Hearth LMS. Execute task B2 from .claude/plans/PLAN-outcomes-spine-phase2.md (read plan + status JSON). Output is a PR FOR DREW'S REVIEW ONLY — do NOT run the seed script, no Sanity writes.
Author the first real tranche of ac-v9-qld regulatory mappings into scripts/data/dlo-regulatory-mappings.ts (today it holds a 2–3 row illustrative SCAFFOLD — extend/replace it, keeping the exported types DloRegulatoryMappingSeed / RegulatoryMappingSeed).
Scope (tranche 1, NOT all 171): DLOs whose threads are observed in pilot data ∪ declared by the Starter Pack. Identify that set from seeded DLO ids (dlo.{threadId}.{tier} — see scripts/seed-dlos.ts) and Starter Pack threads.
Per DLO map to one+ Australian Curriculum v9 entries: codes = real ACARA v9 codes, VERIFY each against the actual ACARA v9 curriculum (not model memory), cross-check src/lib/curriculum/ac9.ts; every code must lint clean against AC9_CODE_PATTERN (used by scripts/seed-dlo-mappings.ts); set reportTier, contribution (primary/partial/incidental), evidenceWeight deliberately. Show your code-verification reasoning in the PR description. On completion set B2 done in status JSON. Model: Opus.
```

**C1 — Admin tier-comparison panel (WS-4 prep)** `[SONNET]` (standard) · chip `task_61357460` · no gate · no parent-facing/prod change
```
Hearth LMS (Next.js 16 App Router / Drizzle / Tailwind v2 tokens). Execute task C1 from .claude/plans/PLAN-outcomes-spine-phase2.md (read plan + status JSON + docs/hearth-outcomes-spine-plan-v1.md). PLAIN CODE — no prod mutation, no parent-facing change.
1) Pure, unit-tested lib deriveThreadTierFromDlos(dloStatuses, sourceCounts, bar): derive a thread's tier from DLO evidence, not raw counts; the D-OS4 bar is a PARAMETER (don't hardcode) — proposed default: demonstrating needs ≥1 declared/asserted link OR ≥2 inferred on distinct days; thread tier = highest tier with sufficient evidence. Source: learnerDloStatus (src/lib/db/schema.ts:833), declared source_counts, provenance. Study src/lib/ai/thread-links.ts + src/lib/report/deterministic-coverage.ts. Co-locate a *.test.ts (vitest unit; see docs/test-pilot-runbook.md).
2) Admin route + panel: per learner × thread, count-based tier vs derived tier side by side, deltas highlighted. Model on src/app/api/admin/analytics/thread-coverage/route.ts + .../dlo-integrity/route.ts and their _components. Canonical v2 tokens (docs/hearth-canonical-design-tokens-v2.md). Meaningful after A2/A3 data; build now against what's present. Feeds Drew's D-OS4 (C2). On completion set C1 done in status JSON. Model: Sonnet.
```

### Spawn when the gate clears

**A2 — Prod thread-links backfill** `[SONNET]` (standard) · gate: A1 verified + GA2 approval
```
Hearth LMS (Drizzle + Neon Postgres). Execute task A2 from .claude/plans/PLAN-outcomes-spine-phase2.md (read plan + status JSON). MANUAL MODE — gated. Do not write to prod until: (1) A1 is verified done (activitiesWithUuidThreadRefs=0, modulesWithUuidThreadRefs=0, thread count=57) — confirm first, stop if not; (2) Drew approves the GA2 ramp in-session.
Run scripts/backfill-thread-links.mjs in order: dry-run → --limit 10 → full, showing each step's output and waiting for approval before the next. After the full run, rebuild Family Intelligence Snapshots for affected families (admin rebuild path or the entry_saved-equivalent trigger). Verify: declared source_counts appear in a pilot family's snapshot. On completion set A2 done in status JSON. Model: Sonnet.
```

**A3 — DLO history backfill** `[SONNET]` (standard) · gate: A2 done + GA2 approval
```
Hearth LMS. Execute task A3 from .claude/plans/PLAN-outcomes-spine-phase2.md (read plan + status JSON). MANUAL MODE — gated: A2 must be done plus Drew's GA2 approval.
Run scripts/backfill-dlo-links.mjs, ramped dry-run → --limit 10 → full. This re-enriches pre-WS-3 entries so they see clean declared candidates (resolves D-OS3=yes per the 3.3 eval: P 0.589 / R 0.633, ~2.5k tokens/entry on Haiku). WATCH the AI-cost dashboard and the noisy-family token threshold during the full run (NOISY_FAMILY_TOKEN_THRESHOLD default 200k/24h) — pause if cost spikes. Verify learner_dlo_status populates for pilot families (constellation DLO dots light up). On completion set A3 done in status JSON. Model: Sonnet.
```

**B3 — Seed + activate ac-v9-qld** `[SONNET]` (standard) · gate: B2 merged + GB seed approval
```
Hearth LMS. Execute task B3 from .claude/plans/PLAN-outcomes-spine-phase2.md (read plan + status JSON). MANUAL MODE — requires B2's mapping PR merged AND Drew's seed approval (gate GB). Do not run if either is missing.
Run: npx tsx scripts/seed-dlo-mappings.ts against prod Sanity. This flips the QLD report path from LLM fallback to deterministic automatically (fallback contract). Then verify determinism on one pilot family's report (export twice, diff — must be identical) and regenerate docs/hearth-capability-dlo-reference.md so it includes regulatoryMappings. TIMING: do not run the week a family is mid-HEU-submission. On completion set B3 done in status JSON. Model: Sonnet.
```

**C3 — WS-4 implementation** `[OPUS]` (standard) · gate: C2 (D-OS4 bar) decided · only parent-meaning-changing PR
```
Hearth LMS. Execute task C3 from .claude/plans/PLAN-outcomes-spine-phase2.md (read plan + status JSON + docs/hearth-outcomes-spine-plan-v1.md §5 — full discipline). Gate: use Drew's decided D-OS4 'demonstrating' bar (C2) exactly.
Changes: thread tier derived from DLO evidence (use deriveThreadTierFromDlos from C1); observation counts demoted to a volume signal; parent overrides preserved (lower-only); DELETE the fabricated dlos_confirmed / dlos_total from the snapshot payload and every consumer. Add a one-time shift notice on the recommendations_refreshed pattern: "We've made the constellation more honest about what we've observed — nothing your child did was lost." Fold in two cosmetic fixes: drop claimedTier from the parent-facing dlo-evidence API response (admin keeps it); reconcile the snapshot-rebuild AC9 prefix map with src/lib/report/deterministic-coverage.ts's. Full test coverage. On completion set C3 done in status JSON. Model: Opus.
```

**D1 — WS-6 implementation** `[OPUS]` (standard) · ✅ decision landed (D0), spawnable now
```
Hearth LMS. Execute task D1 from .claude/plans/PLAN-outcomes-spine-phase2.md (read plan + status JSON). D-OS1 is DECIDED (Drew, 2026-06-13): OPPORTUNITY + CORROBORATION — completing a targeted activity logs an opportunity, NOT evidence; the DLO link promotes to evidence only on a per-child Haiku signal or a parent tap. Implement exactly that.
Add capabilityTargets: [{thread, tier}] to the activity schema (alongside existing capabilityThreads during migration). src/lib/ai/thread-links.ts consumes the declared tier instead of DEFAULT_TIER:'developing'. Entry save writes a DLO link at the declared (thread, tier) as an OPPORTUNITY (provenance 'declared'), and the corroboration step promotes it. Do NOT let a bare completion count as observed evidence — that protects C3's evidence bar. Tests. On completion set D1 done in status JSON. Model: Opus.
```

**D2 — Standards enforcement + content pass** `[SONNET]` (standard) · gate: D1 done
```
Hearth LMS. Execute task D2 from .claude/plans/PLAN-outcomes-spine-phase2.md (read plan + status JSON). Gate: D1 merged (needs the capabilityTargets schema).
Add a workbench publish soft-flag for activities with no threads/targets (120 of 274 today) — see src/lib/content-studio/validation.ts soft-flag helpers + /api/admin/content/publish. Update the kindling spec/orchestrator to populate capabilityTargets (kindling is a SIBLING repo on Drew's machine, not in this checkout — flag the change needed, don't assume access). Do a Starter Pack content pass adding targets. Regenerate the authoring-guidance section of docs/hearth-capability-dlo-reference.md. On completion set D2 done in status JSON. Model: Sonnet.
```

**D3 — Per-learner DLO attribution** `[SONNET]` (standard) · ✅ decision landed (D-OS2), spawnable now
```
Hearth LMS. Execute task D3 from .claude/plans/PLAN-outcomes-spine-phase2.md (read plan + status JSON). D-OS2 is DECIDED (Drew, 2026-06-13): gate DLO links by per_child_signals — attach evidence ONLY to the learner(s) the enrichment actually named, never copy-to-all.
Small dlo-persistence change: when writing DLO links, gate by per_child_signals so evidence attaches only to the named learner(s). Add tests covering a multi-child entry where only one child is named. (Rises to urgent if Hearth-group multi-family sessions start.) On completion set D3 done in status JSON. Model: Sonnet.
```

### Drew-only — decisions/editorial

- ~~**B1 — Golden-set gold-label review**~~ — ✅ **resolved 2026-06-13** (Drew): keep gs-12 (Ruby/PS3) and gs-13 (Oliver/H1) at `developing`. Gold labels confirmed; the eval flips are model over-reads. No re-run. Tracked lever: a "prefer lower tier in a single familiar context" prompt note for the gs-06/gs-08 inflation.
- **C2 — D-OS4** demonstrating bar: **default adopted 2026-06-13** (≥1 declared/asserted OR ≥2 inferred distinct-day). Remaining step is *confirm/tune against C1's real-data comparison* before C3 — no longer a blind decision.
- ~~**D0 — D-OS1** completion semantics~~ — ✅ **resolved 2026-06-13**: opportunity + corroboration (baked into D1).
- ~~**D-OS2** attribution~~ — ✅ **resolved 2026-06-13**: gate by per_child_signals (baked into D3).
