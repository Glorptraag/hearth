<!-- Version: 1 | Date: 2026-10-15 | Changes: Initial creation. Full inventory of unfinished, unmerged and decision-blocked work across PRs, branches, plan state, docs and prior Claude sessions; sequenced plan to clear it ahead of launch. -->

# Hearth — Launch Reconciliation Plan v1

> **Purpose:** One list of everything left half-done, unmerged, or waiting on a human, plus the order to clear it before launch.
> **Method:** Gathered on 2026-10-15 from open PRs, every remote branch (full history, `git cherry` against `main`), `.claude/plans/status*.json`, decision and "needs Drew" markers in `docs/`, the research log, and the transcripts of prior Claude sessions that ended blocked or waiting for review.
> **Headline:** `main` has had **4 commits since 6 Aug**. About 6,000 lines of finished, CI-green work sits in drafts. The biggest blocker is review and decisions, not code.

---

## 0. Read this before "rebuild"

`docs/hearth-refactor-postmortem-v1.md` §5 is binding. The next structural pass may be designed only once:

1. ≥3 real pilot-family profiles exist, and
2. the feedback channel is producing research-log entries.

Today neither holds. Every R1–R26 entry is an operator walkthrough or a code audit (R7: "the pilot's feedback channel captured zero feature/UX findings"), and the handback flags this as drift D7.

So this plan treats "rebuild for launch" as **consolidate → fix launch-blockers → put real families on it → then redesign from evidence.** A ground-up rewrite now would repeat the June incident: a large structural change with nothing to judge it against. If "rebuild" means something specific (e.g. a visual redesign, or native-first), see the questions in §6.

---

## 1. Inventory

### 1A. Finished work waiting only on review (CI green, merges cleanly into `main`)

| PR | What | Notes |
|---|---|---|
| [#285](https://github.com/Glorptraag/hearth/pull/285) | Insights engine: cached monthly narrative (cuts one Haiku call per child per rebuild), snapshot-backed enrichment context, "Hearth noticed" dashboard feed, `weekStats` finally written | Merge first; #286 is stacked on it |
| [#286](https://github.com/Glorptraag/hearth/pull/286) | PKB: Logger chips/context persisted (`0030_logger_context.sql`) and fed to RAG; webhook review-gate fix (unreviewed corpus was being embedded); E8 golden-query verifier | Stacked on #285. **Has a migration** |
| [#288](https://github.com/Glorptraag/hearth/pull/288) | Constellation: four DLO states, parent confirmations visible, recency/trajectory, working deep links, phone fallback | Stacked on #286 |
| [#287](https://github.com/Glorptraag/hearth/pull/287) | Corpus: Montessori pt1 rebuilt; Classical + Waldorf greenfield; Unschooling W5 (38 entries) | Independent. Nothing retrievable until you ack (see 1C) |
| [#284](https://github.com/Glorptraag/hearth/pull/284) | Site copy moved into Sanity (`siteCopy`) | Ops step after merge: `npm run seed:copy` against prod + redeploy Studio |
| [#281](https://github.com/Glorptraag/hearth/pull/281) | Capacitor config + packages staged (no `cap add`) | Not a draft. Harmless to merge; unblocks Phase 2b the moment Xcode exists |
| [#289](https://github.com/Glorptraag/hearth/pull/289) | Rosetta handback doc (captured at `cb830cd`) | Docs only; stale against #284–#288. Merge or close |

Session `session_01TAE4XqC5E9gkEKR9HtCrtq` (11 Oct) confirmed #285–#288 green and mergeable, then stopped its check-ins: "awaiting your review."

### 1B. Stale branches (1 unlanded commit each unless noted)

| Branch | Unlanded content | Recommendation |
|---|---|---|
| `claude/pack-modules-docs-cleanup-bFdKV` (Jun 17) | `src/lib/content-readiness/` + `audit-content-readiness` + `retract-packs` scripts (571 lines, tested) | **Salvage.** Launch needs a "which packs are actually ready" gate. Re-land as one PR after checking it against today's Content QA |
| `recovery/f3-modulesruns` (Jun 6) | Old F3 re-land: abandon/finish routes, `CaptureTray`, `ContextualProposals`, offline-queue rewrite (2.4k lines) | **Delete.** Superseded by the July `module_runs` landing (#251) and the August outbox. CaptureTray/ContextualProposals are post-mortem "missing" items: re-justify from evidence, don't salvage |
| `recovery/green-base-cosmetics` (Jun 5) | localStorage polyfill for Node 26 | **Delete.** #156 deliberately removed it; Node 24 is pinned |
| `chore/new-logo` (May 29; 4 commits) | Older logo PNG swap + favicon | **Delete.** Superseded: `main` ships a later logo (234 KB, via the June brand fixes #137–#139) |
| `claude/kind-ramanujan-RbMpK` (May 26) | `scripts/repair-capability-substrate.ts` (Sanity drift fix) | **Check whether the drift still exists** (outcomes-spine A1 is the same class of problem), then delete |
| `copy/cr-report-disclaimer`, `copy/cr-ai-content-framing`, `docs/cr-cultural-framework` (PRs [#232](https://github.com/Glorptraag/hearth/pull/232)–[#234](https://github.com/Glorptraag/hearth/pull/234)) | Regulator PDF disclaimer, honest AI label, cultural sourcing policy | **Decide (1C).** The first two are launch-relevant |

### 1C. Decisions owed by Drew (work is blocked on these)

| # | Decision | Where it's documented | Blocks | Launch-critical? |
|---|---|---|---|---|
| D1 | **Account deletion: what happens to a Hearth the deleting family created?** Delete it / transfer ownership / block deletion | `hearth-account-deletion-defect-v1.md` §3 | Fixing the 500, the Clerk-user delete and the **orphaned children's photos in Blob** | **Yes. Store rejection + privacy exposure** |
| D2 | Regulator report disclaimer wording (needs legal) | PR #232 | Shipping the report PDF to real regulators | **Yes** |
| D3 | AI label + care note on AI insights | PR #233 | Honest framing of #285's "Hearth noticed" | **Yes**, pairs with #285 |
| D4 | Tier rubric: what actually moves a thread up a tier (UI promise ≠ code; two conflicting rules on one screen) | `hearth-tier-rubric-drift-v1.md`; outcomes-spine gate GC (D-OS4 default adopted, data-confirm pending) | Constellation copy; WS-4 / C3 | Yes for trust; can ship with the adopted default if you confirm |
| D5 | Approve stray-thread re-point (2 ambiguous mappings) → prod thread-link backfill → DLO history backfill | `status-outcomes-spine.json` GA1, GA2 (tasks A1–A3) | Correct capability data for existing families | Medium |
| D6 | Approve B3: seed DLO mappings to prod Sanity (makes the QLD report deterministic) | gate GB | Report determinism | Medium–high for QLD pilot |
| D7 | Corpus acks: `drew-ack: pending` on waves 2–5 + per-tradition source checks | PR #287 body; `.claude/plans/corpus-fanout/review-w*-calibration.md` | PKB retrieval beyond Charlotte Mason | No (flag-gated) |
| D8 | Logger short mode spec | `hearth-logger-short-mode-spec-v1.md` (AWAITING APPROVAL) | R18: Logger over the 5-minute promise | Medium (core-loop UX) |
| D9 | Alpha expectations message | `hearth-alpha-expectations-message-v1.md` (AWAITING REVIEW) | Onboarding the first families | **Yes, if pilot precedes launch** |
| D10 | Does a finished module run auto-complete its planner entry? | `PROJECT_STATUS.md` July milestone | Small UX consistency | No |
| D11 | Parked sidebar questions (unmapped-thread framing, vestigial `/constellation`, annotation locking) | `status.json` decision_queue | Nothing urgent | No |
| D12 | Cultural/religious sourcing policy | PR #234 (marked post-pilot) | Content scale-up | No |

### 1D. Things only Drew can physically do

| Action | Why | Source |
|---|---|---|
| Install Xcode → `xcode-select --switch` → CocoaPods → JDK + Android SDK | Native Phase 2b (`cap add`) is blocked on the toolchain | `hearth-native-app-plan-v1.md` §Phase 2 |
| Start the Apple Developer enrolment (D-U-N-S, 2–4 weeks) | Critical path to iOS submission | native plan, Drew's track |
| Google Play Console + 12 testers × 14 days closed track | Play requirement for new personal accounts | native plan |
| Enable Sign in with Apple in Clerk + Apple Services ID | Guideline 4.8 (Google sign-in is enabled) | native plan §Auth |
| Repo visibility (if still wanted) | The 7 Oct session tried to make hearth/pokebattle/servo/spark public; the proxy blocks settings writes | session `session_01YPzoZ3J5uqw6rSUnaFJzBY` |
| GitHub Actions billing | 6 Oct: CI jobs refused to start (minutes/payment). **Resolved by 11 Oct**: runs are green again. Keep an eye on it | PR #285 comment |
| Post-merge ops: `npm run seed:copy` (prod), redeploy Studio, reembed after corpus acks | Merges don't take effect without these | #284, #287 |

### 1E. Known defects and gaps (no decision needed, just work)

- **Account deletion** (pending D1): 27 `ON DELETE no action` FKs, 13/25 tables deleted, no Clerk delete, no `del()` on blobs. The `it.fails` test is pinned in `orphan-tables.integration.test.ts`.
- **Capability picker lists 12 of 57 threads** in Module Builder. `watchFor`/`pivot` have no home in the published module.
- **Outcomes spine:** WS-3 needs a fresh verify; WS-5 mappings cover QLD tranche-1 only (~17/57 threads); WS-7 partial. D-OS4 tier logic (C3) not built.
- **Jurisdiction stragglers:** `compliance_status` snapshot key, jurisdiction-aware annotation prompt, labels. A multi-state launch needs these.
- **Three sample packs still `draft`** (First Term Foundations, Outdoor Naturalist, Storytellers): editorial + AC mapping.
- **Test coverage gaps** (research log matrix): no mobile e2e, no multi-session auth e2e, no device-level offline verification.
- **Native Phases 3–4 not started:** push send path (tokens table exists), native camera, biometric lock, share sheet, haptics; store assets, privacy labels, reviewer demo account, public account-deletion URL (Play).

### 1F. Doc drift (the docs disagree with the code)

- `PROJECT_STATUS.md` last updated 6 Aug: says Stripe is stubbed, but `stripe@^22` is a dependency again (handback D1); doesn't mention #282/#283/#290; Known Gaps still lists offline as Phase 2 though the outbox shipped.
- `status-pkb-completion.json` on `main` shows E2–E8 and all W0 as pending; #286 reconciles it.
- `alpha-readiness-pickup.md` frozen at April.
- Interaction Map #16 "Offline: OPEN" is now partially closed by the August outbox.

---

## 2. Plan

Each step is one focused PR or one Drew session, per the post-mortem §4 re-land rule. Nothing in phases 1–2 needs a redesign.

### Phase 0: Drew's decision hour (no code; unblocks most of the rest)
Decide D1, D2, D3, D4 (confirm or tune the adopted default), D9. Kick off the Apple enrolment and Xcode install today, since D-U-N-S is the longest lead time. Each decision gets recorded in `hearth-decisions-log-v1.md`.

### Phase 1: Land the backlog (≈1 session)
1. Merge #285 → retarget and merge #286 (migration `0030`) → retarget and merge #288. Let each go green on `main` before the next.
2. Merge #284, then run `seed:copy` + redeploy Studio.
3. Merge #281. Merge #287 (inert until acks).
4. Close #289 or refresh it after the above.
5. Delete `recovery/f3-modulesruns`, `recovery/green-base-cosmetics` and `chore/new-logo`. Check whether the `kind-ramanujan` Sanity drift still exists, then delete.
6. Refresh `PROJECT_STATUS.md` to match reality (fixes 1F).

### Phase 2: Launch-blockers (one PR each, in this order)
1. **Account deletion fix** per D1: transaction; every family table (or a `CASCADE` migration); invitations back-ref; `clerkClient.users.deleteUser`; collect blob paths then `del()`; flip `it.fails` → `it` and add per-table assertions.
2. **Honesty copy**: report disclaimer (D2) + AI label (D3); merge or replace #232/#233.
3. **Tier rubric**: implement the D4 bar in `snapshot-rebuild.ts`, unify the Gallery pip rule, then write the parent-facing rubric copy (= outcomes-spine C2/C3).
4. **Content readiness gate**: re-land `content-readiness` from the stale branch; retract anything not ready; publish or hide the 3 draft packs.
5. **Capability picker 12 → 57 threads** in the Module Builder.

### Phase 3: Pilot-on-launch-candidate (this is what the post-mortem waits for)
1. Send the alpha expectations message (D9); onboard 3–5 families.
2. Feedback channel live (`/api/feedback` already exists): confirm rows reach the research log within the SLA.
3. Instrumentation check: PR-A/B events (PostHog) verified live per `hearth-local-runs-v1.md`.
4. Run the gated backfills (D5, D6) with the ramp, watching the AI-cost dashboard.
5. Close test gaps that matter for launch: mobile Playwright profile + one offline device pass.

### Phase 4: Native track (runs alongside phase 3 once the toolchain exists)
Phase 2b `cap add` + Sign in with Apple + universal links → Phase 3 (push send path first, then camera, biometric lock, share, haptics) → Phase 4 store compliance (4+ rating, not Kids Category, privacy labels, reviewer account, public deletion URL, which depends on phase 2 step 1).

### Phase 5: The redesign ("rebuild"), only once the post-mortem §5 criteria hold
Design fresh from ≥3 real persona profiles and the research log. Candidates the evidence will settle: Logger short mode (D8), CaptureTray / contextual proposals, cross-device run persistence, audio evidence, the multi-state jurisdiction finish. Nothing from the old 35-task plan is carried over as a commitment.

---

## 3. What I'd do first, concretely

1. **Today (Drew):** decide D1 and start the Apple enrolment.
2. **Next Claude session:** Phase 1 (merge train + branch cleanup + status refresh).
3. **Session after:** account-deletion fix (Phase 2.1).

---

## 6. Open questions this plan cannot answer from the repo

- What does "rebuild for launch" mean to you: (a) harden what's there (this plan), (b) a visual/UX redesign, (c) native-first, or (d) a code rewrite?
- What's the launch: closed pilot (10–20 families, web), public web, or store launch? That decides whether phase 4 is on the critical path.
- Single-state (QLD) or multi-state at launch? That decides whether the jurisdiction stragglers and WS-5 tranche-2 are blockers.
