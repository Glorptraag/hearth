<!-- Version: 1 | Date: 2026-07-03 | Changes: Initial creation. Handoff spec for the fortnight after the 2026-07-03 hardening sweep (#249–#256). Drew's chosen aim: finish the outcomes spine. | Reconciled 2026-08-01: rebased onto current main (a PKB workstream landed since); spine "code-complete" claims re-verified present on HEAD; H6 prod-deploy status corrected (it is live, not pending). -->

# Hearth — Next-Fortnight Handoff: Complete the Outcomes Spine

> **Status:** Spec / handoff. Written 2026-07-03 after the hardening sweep (#249–#256); reconciled against main 2026-08-01.
> **Chosen aim (Drew, 2026-07-03):** finish the outcomes spine (WS-6/WS-7).
> **Reconciliation (2026-08-01):** rebased onto current main. The spine's "code-complete" claims below were re-verified present on HEAD after the intervening PKB workstream (a separate subsystem — it does not touch the spine). H6 is now confirmed **live in prod** (see Parked).
> **Companion docs:** `hearth-outcomes-spine-plan-v1.md` (the strategic arc), `hearth-capability-dlo-reference.md`, `PROJECT_STATUS.md`, `hearth-research-log.md`.

---

## Context — read this first, it changes the job

Drew chose "finish the outcomes spine." A code audit against current `main` (not the plan doc) found the decisive fact:

**The spine's code is already complete and wired end-to-end.** Every link in the chain — *activity declares outcome → completed run writes declared evidence → corroboration promotes it → tier lifts → report transposes it* — exists and is called on the live entry-save path:

| Spine link | State | Evidence |
|---|---|---|
| Activities declare `capabilityTargets: [{thread, tier}]` | ✅ built | `src/sanity/schemas/activity.ts:215` |
| `thread-links` consumes the **declared** tier (not `DEFAULT_TIER`) | ✅ built | `src/lib/ai/thread-links.ts:67-76` — targets take precedence; highest declared tier wins |
| Completed targeted run writes `declared`-provenance **opportunity** rows | ✅ built + **called** | `persistDeclaredOpportunities` (`dlo-persistence.ts:285`), called at `enrich.ts:693` |
| Opportunities promote to `observed` only on corroboration (D-OS1) | ✅ built + **called** | `corroborateDloOpportunities` (`dlo-persistence.ts:306`), called at `enrich.ts:703` |
| Tier derivation counts `observed` evidence only | ✅ built | `snapshot-rebuild.ts:392-406` — uncorroborated opportunity can't move a tier |
| Per-learner attribution (no copy-to-all, D-OS2) | ✅ built | `dlo-persistence.ts:96-110` — strict `per_child_signals` gate at ≥2 learners |
| Parent manual corroboration (confirm/assert) | ✅ built | `POST /api/capabilities/[learnerId]/dlo/[dloId]/confirm` |
| Deterministic transposer (DLO status × mapping → coverage) | ✅ built | `src/lib/report/deterministic-coverage.ts`, `coverage.ts` |
| WS-7 docs (v2 arch spec, DLO reference) | ✅ present | both in `docs/` |
| Integration coverage for the declared loop | ✅ exists | `src/lib/ai/__tests__/dlo-opportunity.integration.test.ts` |

**So "finish the spine" is not two weeks of building — the building is done.** The honest remaining work is the unglamorous part the plan always underweights: **feed it real content, prove it end-to-end, author the mapping breadth that makes the transposer real, and ship the one deferred parent-facing surface.** A spine that's code-complete but has never metabolised a real Starter-Pack run against authored targets is not finished — it's untested.

---

## The fortnight: make the spine TRUE and PROVEN

Three workstreams. T1 is the gate (prove the loop before authoring breadth on top of it); T2 is the content bulk; T3 is the one genuine build + a decision.

### T1 — Populate targets + prove the declared loop end-to-end *(verification-first; the WS-6 exit criterion)*

The code is ready; the **content and the proof are not**. `scripts/apply-capability-targets.ts` + `scripts/data/starter-pack-targets.ts` exist but it is unverified whether they've been **run against production Sanity** — a proposal and an apply-script are not applied data (this is the same "script exists ≠ executed" gap the sweep kept hitting).

- **Verify/apply:** run `scripts/verify-starter-targets.mjs` against prod; if targets aren't present, run `apply-capability-targets.ts`, then re-verify. Confirm the Starter Pack's activities carry `capabilityTargets`.
- **Prove the chain with a real run** (a test family, prod or preview): complete a targeted Starter-Pack module → assert, in order: a `declared` **opportunity** row lands per `per_child_signals`-attributed learner → Haiku corroboration (or a parent confirm tap) promotes it to `observed` → the thread tier lifts under `PRODUCTION_TIER_BAR` → the constellation drill-down shows the DLO with **"From {module}"** provenance. Fix whatever breaks — this is where a code-complete-but-unfed pipeline reveals its real bugs.
- **Deliverable:** the WS-6 exit criterion, actually met and screenshotted; any fixes carry a regression test at the layer they break.

### T2 — Author the transposer mapping breadth *(WS-5 completion — the content bulk)*

`scripts/seed-dlo-mappings.ts` is **tranche-1 only** (~98 lines, a handful of `frameworkKey` entries — the threads the Starter Pack touches). Until the DLO→AC9 mapping covers what families actually log, the deterministic report describes a *sliver* of real learning and reads as sparse for the wrong reason.

- **Author, staged:** extend the DLO→`ac-v9-qld` mappings — first the threads pilot families are logging (read from `active_threads` across pilot snapshots via `/admin/families`), then high-volume threads (EF/PS classes), toward the full 171. Mechanical subject-prefix draft → a `council-review` skill pass for quality (the plan's prescribed method).
- **Reuse:** the rollup math (`rollupCoverage`), the determinism test, and `AC9_CODE_PATTERN` authoring lint already exist — this is data authoring, not code.
- **Guardrail:** the report is a Stage-4 touchpoint — don't change a pilot family's coverage the week they're mid-submission (coordinate via the research log).
- **Deliverable:** mapping coverage for every thread the pilot cohort has logged; determinism test stays green; `hearth-capability-dlo-reference.md` regenerated.

### T3 — D-OS5 decision + the post-run corroboration tap *(the one genuine build)*

The confirm/assert **backend** exists, but the surface D-OS5 describes — a low-friction post-run *"saw it"* tap at **module completion** that upgrades a declared opportunity to `asserted` evidence — was deliberately **not built**, flagged "validate against a real family before building." This is the keystone that makes *"running a module grew my child's constellation"* felt at the moment of completion, not just true in a drill-down three taps away.

- **Decision (Drew):** validate-then-build, or build behind a flag and validate live? (see Decisions below).
- **If build:** a single skippable, post-save, 5-minute-rule-safe tap on the LogMode/PostSaveSurface end-of-run, calling the existing confirm route with `asserted` provenance for the run's declared DLOs. No new backend.
- **Deliverable:** either a validated decision recorded in the decisions log, or the tap shipped behind a flag with its regression test.

---

## Parked — explicitly NOT this fortnight

- **H6 prod deploy — DONE (confirmed live 2026-08-01).** `main` auto-deploys (Vercel Git integration), so #249 shipped to prod on merge — no manual deploy was ever pending (the original wording here was wrong). Verified: prod (`hearth-lms.com`, `hearth-git-main` alias) serves a `main` build ≫ #249, and every parent surface (constellation topology, portfolio, nudges, keyword matcher, and the capabilities read-seam over stale snapshots) filters H6. Parents see no H6. *Remaining is cosmetic only:* stored snapshot rows can still hold H6 until each family's next entry-triggered rebuild — no cron scrubs snapshots — but the read-seam shields it. Eager scrub = `POST /api/admin/snapshots/rebuild` from an admin (Clerk-gated) browser session; non-urgent.
- Sweep follow-ups: QuickCapture retry-in-place, Sanity `sessionType` field re-land (open_ended runs default `sustained` today), `/constellation` vestigial scaffold (keep/remove decision).
- Planner-entry auto-complete on run finish (provenance plumbing landed in #252; behaviour is a separate product call).
- Anything in the broad-activation / content-breadth / reporting-hardening directions not named above — those were the roads not taken at this fork.

---

## Critical files

- **Loop (all wired, touch only to fix):** `src/lib/ai/dlo-persistence.ts` (`persistDeclaredOpportunities`, `corroborateDloOpportunities`, `persistDloLinks`), `src/lib/ai/enrich.ts:693-703` (call sites), `src/lib/ai/thread-links.ts` (declared-tier read), `src/lib/ai/snapshot-rebuild.ts` (observed-only tier derivation).
- **Content (author here):** `scripts/data/starter-pack-targets.ts`, `scripts/apply-capability-targets.ts`, `scripts/verify-starter-targets.mjs`, `scripts/seed-dlo-mappings.ts`, `src/lib/report/deterministic-coverage.ts` (mapping shape).
- **Surface (T3):** `src/app/(auth)/module/[id]/_components/LogMode.tsx` + `PostSaveSurface.tsx`, `POST /api/capabilities/[learnerId]/dlo/[dloId]/confirm`.
- **Verification harnesses that already exist:** `dlo-opportunity.integration.test.ts`, `scripts/eval-dlo-mapping.mjs`, the deterministic-coverage determinism test.

## Verification (per workstream)

- **T1:** `verify-starter-targets.mjs` green against prod; a scripted or manual real-run walkthrough shows opportunity → observed → tier-lift → "From {module}" drill-down; new fixes tested at their layer. Run unit on Homebrew node@24; integration `TZ=UTC npm run test:integration:local`.
- **T2:** determinism integration test byte-identical twice; `eval-dlo-mapping.mjs` golden-set quality holds or improves; a pilot family's report visibly covers more of what they logged.
- **T3:** the tap is skippable + post-save (5-minute rule); confirm-route integration test extended for the `asserted`-from-run path; decision recorded in `hearth-decisions-log-v1.md`.

## Decisions for Drew (block the dependent work)

1. **D-OS5 — build the post-run "saw it" tap now (behind a flag) or validate with a family first?** Determines whether T3 ships code or a research-log question this fortnight.
2. **Mapping breadth target for T2 — how far up the 171?** "Every thread the pilot has logged" (my recommendation — evidence-driven, finite) vs. "full QLD 171" (complete but speculative for unlogged threads).
3. **Has `apply-capability-targets.ts` been run against prod Sanity?** If you already applied it, T1 collapses to verify-and-prove; if not, it starts with the apply. (I can't tell from the repo — it's a prod-data question.)
