<!-- Version: 1 | Date: 2026-06-10 | Changes: Initial creation. Post-mortem of the 2026-06-03 intelligence-refactor incident, verified current-state delta, re-triaged backlog appendix, and entry criteria for the next structural pass. -->

# Hearth — Intelligence-Refactor Post-Mortem v1

> **Status:** Factual record + forward principles. This is **explicitly not a salvage plan.** The June refactor's surviving backlog appears in the appendix as *inputs, not commitments* — the next structural pass ("the Fable-level refactor") gets designed fresh from the refined use cases (`hearth-pilot-personas-v1.md`, `hearth-parent-journey-v1.md`, `hearth-research-log.md`), in a dedicated later session, once the entry criteria in §5 hold.
> **Audience:** Future Drew / future agent about to propose structural work. Read §4 and §5 before writing any multi-phase plan.

---

## 1. What happened (timeline)

| Date | Event |
|---|---|
| 2026-06-02 | "Three-Modes-of-Intelligence" refactor planned: **35 tasks across 6 phases**, designed for 2–4 parallel Claude Code terminals (`.claude/plans/PLAN-intelligence-refactor.md`, recoverable via `git show e20302b:…`). Scope: six bug fixes + pivot of Marketplace/Library/Explore into distinct intelligence modes + structured-subview snapshot API underneath. |
| 2026-06-03 | Phases 1–6 merged in ~one day (PRs #131–#134; commits `bb76c6f`, `d5b3408`, `f1437d6`, `b3a9edf`). A 4-tier follow-ups backlog was logged the same day (`e20302b`) — its Tier 1 already contained pilot-blocking caveats ("entire module_runs lifecycle invisible until flag flips", "not tested on a real iPhone"). |
| 2026-06-04 | Brand/PWA fixes continue on top (#136–#139). The tree is not in a confidently-green state. |
| 2026-06-05 | **Recovery:** working tree reset to the last-green base (#124) — commit `39ece6b`, PR #144. The refactor's UI phases, plan files, follow-ups doc, and backfill scripts deleted wholesale. |
| 2026-06-05 → 06-06 | **Staged re-land:** foundation schema (`b5bbe60`), snapshot subview endpoints F1 (`4f6d0f2`), pedagogy-aware recommend scoring F2 (`29fdadc`), library status board F4 (`b81aee9` + test repair `4e1e7c7`), marketplace search F6 (`b19887b`), evidence kinds (`c29e680`, `3d9b51b`) — each as a small PR with integration tests, each individually green. |
| 2026-06-07 → 06-09 | Normal cadence resumes on the recovered base: deploy-time migrations, facilitator-notes encryption, module-runner fixes. |

Net: roughly **70% of the refactor's intent survived**, re-landed at higher quality than it first merged. The remaining 30% (§3) was deliberately left behind.

## 2. Why it failed

1. **The repo's own rule was violated.** CLAUDE.md: *"Each session should target ONE focused deliverable… Do not span multiple phases in one session."* Thirty-five tasks / six phases landed in about a day, partly via parallel terminals. The rule existed because this failure mode was foreseeable.
2. **No per-phase green gate.** Phases 4–6 (UI pivots) stacked onto Phases 1–3 (schema + API) before the foundations had soaked. When something broke, the blast radius was the whole stack — which is why recovery had to be a reset, not a revert of one PR.
3. **Flagged-off ≠ done.** The module-runs lifecycle shipped behind `MODULE_RUNS_ENABLED` defaulting off, untested on real devices, with its own Tier-1 backlog admitting it had never been exercised end-to-end. Feature flags managed *exposure*, not *verification debt*.
4. **Use-case validation was assumed, not held.** The refactor pivoted three screens' purposes (Marketplace/Library/Explore as "intelligence modes") on an internally-coherent architectural thesis — with zero pilot-family evidence that the existing screens were failing families, because no structured evidence channel existed (research log R7).

## 3. Verified current-state delta (as of 2026-06-10, HEAD)

Checked against the working tree, not the plan's claims.

### Present (re-landed, tested)
- Snapshot subview API: `/api/snapshot/{next,gaps,trajectory/[learnerId],momentum,freshness,zero-state}`
- Recommend rebalance + pedagogy weight (`src/lib/ai/recommend.ts`, W_PEDAGOGY 0.15)
- Library status board + Browse tab + soft-delete + Recently Removed (`/api/library/status`, `src/app/(auth)/library/_components/`)
- Marketplace search (`/api/marketplace/search`)
- Evidence kinds photo/quote/note/link + captions, dual-written (`learning_entry_evidence` + legacy `evidenceUrls`)
- Foundation schema: `module_runs`, `learning_entry_evidence`, `moduleRunId`/`plannerEntryId` FKs on entries, `family_library.removedAt`
- Explore split: `/explore/activities` + `/explore/marketplace`

### Ghost (schema present, nothing drives it)
- **`module_runs` table** — exists with indexes and CHECK constraints; **no `/api/module-runs/*` routes exist**; the module runner (`src/app/(auth)/module/[id]/page.tsx`) persists session position/start-time to `localStorage` only. `moduleRunId` FK on entries: never written.
- **`plannerEntryId` FK on entries** — verified ghost: no write site exists (`grep plannerEntryId src/` → schema definition + null factory default only). The planner↔logger join the original plan promised was never wired.

**Resolution rule:** ghost schema gets a deadline. Either the next structural pass lands persistence routes for a *validated* module-runner use case, or the table is dropped in a cleanup migration. Schema that nothing writes is a standing trap for future sessions (and for `db:check-schema` confidence).

### Missing (deliberately not re-landed)
- `/api/module-runs/*` (create/finish/abandon) + `MODULE_RUNS_ENABLED` gate
- Audio evidence: CaptureTray / MediaRecorder, audio upload route, `kind='audio'` UI (the schema's CHECK constraint still allows `'audio'`)
- `ContextualProposals.tsx` (multi-signal attach banner on `/log`)
- Sanity module fields `sessionType` / `idleDaysBeforeAutoClose` / `previewActivityRef` + backfill script
- IndexedDB blob persistence for the offline upload queue (`src/lib/offline-queue.ts` is request-manifest-only)

## 4. What the recovery proved (binding for future structural work)

The re-land pattern is now the house style, demonstrated under fire:

1. **One deliverable per session/PR**, each individually green in CI (all four jobs), each with tests at the right layer *in the same PR*.
2. **Foundations soak before dependents stack** — schema/API PRs land and survive real use before UI PRs assume them.
3. **A feature flag is not a substitute for end-to-end verification** — if it can't be exercised, it doesn't merge.
4. **Reset-to-green beats patch-forward** when the stack is entangled — and reset is only cheap because main was kept green before the incident. Keeping main green is what made the recovery possible at all.
5. **Screen-purpose pivots require user evidence.** Architectural coherence is necessary, never sufficient.

## 5. The next ("Fable-level") refactor — entry criteria, not content

This document deliberately does **not** contain the next refactor's design. It is designed fresh, from refined use cases, when **all** of the following hold:

1. **Personas have real data:** ≥3 captured profiles in `hearth-pilot-personas-v1.md` §7, with at least one persona-claim validated or corrected per profile.
2. **The evidence channel is live:** in-app feedback capture shipped and producing research-log entries (the convention in `hearth-research-log.md` operating, not just declared).
3. **Journey instrumentation covers the touched stages:** any screen the refactor would change has its journey-stage success signal measurable *before* the change (so the refactor can be judged by it after).
4. **Each candidate capability re-justifies itself** against a named persona + journey stage. "It was in the old plan" is not a justification — the appendix below is raw input, nothing more. The module-runs question, for example, becomes: *does Renee or Bec actually need session persistence across devices, or was localStorage always enough?* Pilot evidence answers that; the old plan cannot.
5. **Execution honors §4** — sequenced one-deliverable PRs, soak time between foundation and dependents, no parallel-terminal mega-merges.

## Appendix — Re-triaged follow-ups backlog (inputs, not commitments)

From `git show e20302b:docs/intelligence-refactor-followups-v1.md`, re-checked against HEAD 2026-06-10.

| Item (orig. tier) | Original concern | Status on HEAD |
|---|---|---|
| 1.1 `MODULE_RUNS_ENABLED` rollout | flag defaults off, lifecycle invisible | **Moot** — routes don't exist |
| 1.2 iOS Safari MediaRecorder field test | audio MIME quirks untested on iPhone | **Moot** — audio capture not present; becomes a launch gate *if* audio re-justifies |
| 1.3 Recommendation-shift notice | rebalanced weights change `suggested_next` ordering under existing families | **Open & live** — the new weights ARE in production; the one-time "we refined recommendations" toast was never shipped |
| 2.1 Offline blob persistence (IndexedDB) | in-memory Blob map loses captures on reload | **Open** — file queue absent entirely; scope shrinks to "design offline capture properly" |
| 2.2 Pack-status synchronous Sanity fetch | `/api/library/status` resolves pack→modules per request | **Open** — route re-landed with the same per-request expansion; fine at pilot scale, watch at 30+ packs |
| 2.3 Abandonment threshold ignores per-module config | constant 14d vs `idleDaysBeforeAutoClose` | **Blocked-moot** — the Sanity field doesn't exist; the constant is currently the only behaviour |
| 2.4 ContextualProposals 3-signal stacking UX | unverified clutter risk | **Moot** — component absent |
| 2.5 Editorial flip to `open_ended` sessionType | 53 modules backfilled `sustained` | **Moot** — field + backfill absent |
| 3.1 Module-only marketplace browse | standalone modules not surfaced | **Open** — `/api/marketplace/search` exists; UI remains pack-only |
| 3.2 Preview-before-add | `previewActivityRef` unconsumed | **Blocked** — field absent |
| 4.1 Snapshot rebuild incrementalization | full re-aggregate per call | **Open** — backlog; fine at 10–20 families |
| 4.2 Audio playback UI | default `<audio controls>` | **Moot** until audio exists |
| 4.3 Pedagogy weight 0.15 is empirical | needs PostHog reason-distribution data | **Open & live** — weight is in production with no instrumentation; pairs with journey Stage-5 signal gaps |
| 4.4 Family-Fit score is gap-only | full triangulated score unbuilt | **Open** — backlog |
| 4.5 Materials checklist not shared across runs | per-run `materialsState` | **Moot** — runs aren't persisted at all |
| 4.6+ Browse/Explore UX overlap etc. | framing questions | **Open** — fold into the use-case-first redesign |

**Worth acting on before any refactor** (small, live-in-production, no architecture): 1.3 (recommendation-shift toast) and 4.3 (recommendation-reason instrumentation — also closes a journey Stage-5 signal gap).

---

*Cross-references: `docs/PROJECT_STATUS.md` (Known Gaps mirrors §3), `hearth-research-log.md` R7 (why user evidence was missing), CLAUDE.md "Session Scoping" (the rule §2.1 violated).*
