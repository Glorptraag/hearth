<!-- Version: 1 | Date: 2026-06-11 | Changes: Initial creation. Product + UX brief and phased technical plan for connecting the capability evidence chain (DLOs, constellation, modules) and building the framework transposer. -->

# Hearth — Outcomes Spine Plan v1

> **Status:** Plan. Approved scope comes from the 2026-06-11 capability-universe examination (summarised in §9); execution follows the re-land house style in `hearth-refactor-postmortem-v1.md` §4 — one deliverable per PR, each green, foundations soak before dependents.
> **Audience:** Drew + any agent picking up a workstream. Read Part I–II before touching any workstream in Part IV; a workstream PR that can't name its persona and journey stage is off-thesis.
> **Companion docs:** `hearth-pilot-personas-v1.md`, `hearth-parent-journey-v1.md`, `hearth-capability-dlo-reference.md`, `hearth-refactor-postmortem-v1.md`, `docs/PROJECT_STATUS.md`.

---

# Part I — Product brief: what we are building and why

## 1. The thesis

Hearth's capability universe exists so that **a homeschooling family's lived learning accumulates, from day one, into outcome-structured evidence** — the way a university programme is built from Program Learning Outcomes and Subject Learning Outcomes, but without the bureaucracy. The parent never sees the machinery; they see a constellation growing.

This is constructive alignment, applied to home education:

| Learning-design concept | Hearth structure |
|---|---|
| Program Learning Outcomes (PLOs) | Super-domains + 15 domains ("Mathematical Thinking", "Human Formation") |
| Subject Learning Outcomes (SLOs) | 57 threads × tier descriptors (today's DLOs); atomic capabilities with observable indicators (v2 substrate, future grain) |
| Constructive alignment | Activities declare which outcomes they offer an opportunity to demonstrate |
| Assessment evidence | Observations linked to outcomes with tier + provenance + confidence |
| Transcript / accreditation | Portfolio + per-framework transposition (AC v9 today; NESA, US frameworks later) |

### The three horizons (the goal, in order of arrival)

1. **Short term — a beautiful, clear system that helps parents structure learning at the earliest stages.** The constellation, plain-language tier descriptors, and growth bands (emerging → developing → demonstrating) give a new homeschooler a map without a syllabus. Largely shipped; this plan hardens its honesty.
2. **Medium term — reporting to any specific framework is an easy transposition from the existing mapping.** Evidence is captured once, against Hearth's own outcome spine; a static mapping table converts it to AC v9 (QLD), NESA, or any future framework. Adding a framework means authoring a mapping, not re-processing history. Today this exists as schema only — reports rest on LLM-recalled curriculum codes.
3. **Long term — homeschoolers outpace other forms because outcomes are built in from the start.** Every module and resource maps onto a robust outcome system; the portfolio that falls out is credible enough for non-traditional tertiary entry. This requires an unbroken, auditable evidence chain: *activity declares outcome → completion produces confirmed evidence → observation matched against actual criteria → confidence-weighted status → portfolio*.

The architecture for all three already exists in the v2 type system (`src/types/capability-universe.ts`). **The problem this plan solves is that the running pipeline doesn't honour it** — the chain has three broken links (§9), and every month of pilot data captured through the broken chain makes the long horizon more expensive to reach.

## 2. Who this serves (cite these names in every workstream PR)

- **Renee (Tracker, QLD/HEU)** — her core anxiety is *proof*, not learning. The transposer is the machine that turns "we read a book about frogs" into evidence her renewal audit accepts. A `demonstrating` claim Hearth cannot back is worse for Renee than no claim: it's the panic-Google-Doc problem reborn with false confidence. Journey Stage 2 (relief) and Stage 4 (first compliance event).
- **Mei-Lin (Consumer, NSW/NESA)** — her regulator is *not* the HEU. The medium horizon is literally for her: framework-agnostic capture with per-framework transposition is what makes the jurisdiction decoupling real rather than cosmetic. She is also the persona modules serve most — and today, completing a thread-mapped module contributes to her child's constellation only if Haiku happens to re-infer the mapping from the entry text. Stage 1–2, Stage 5.
- **Bec (Builder, QLD veteran)** — her anxiety is *ceiling*: evidence credible enough for tertiary pathways (founding brief §3). The long horizon is hers. She is the persona who will notice that a thread reads "demonstrating" after eight thin mentions, and lose trust. Stage 6.
- **Sandra (Gatherer)** — group sessions produce evidence for many children at once. Today DLO evidence is copied identically to every learner on an entry; for Sandra's co-op sessions that means a 5-year-old and a 13-year-old get the same objective record. Per-learner attribution rigor is her stake in this plan. Stage 3, Stage 6.

**Anti-persona check:** none of this serves the manual-control compliance author — the transposer *is* platform interpretation, which is the product. Nothing here adds parent-facing grading workflows.

## 3. What "good" looks like (definition of done per horizon)

**Short:** A parent looking at the constellation sees **one progression story**. A thread's glyph tier and its DLO dots never contradict each other; a "demonstrating" claim can always answer "how do we know?" with real observations. Sparse evidence reads as "not yet observed", never as failure (Stage-3 contract: assume good faith).

**Medium:** Running the report twice over the same history produces the identical document. Every curriculum code in it traces to a static mapping from an observed outcome — no code in a regulator-facing report was recalled from an LLM's memory. Supporting a new jurisdiction's framework = author one mapping table + zero code changes.

**Long:** Every published activity declares which outcomes (thread + tier) it offers; completing a module run writes outcome evidence with declared provenance; the portfolio can show, per claim, the chain from activity to observation to status. Hearth's own spine stays primary — frameworks are projections of it, never the skeleton (this is what lets the same evidence serve HEU today and a tertiary admissions pack in 2032).

## 4. Non-goals and guardrails

- **Retrospective logging stays the heartbeat** (Architecture Principle 1). Nothing in this plan adds a forward-planning obligation or makes logging conditional on outcome selection.
- **The 5-minute rule is inviolable.** Any confirmation/assertion UX must be optional, skippable, and post-save. If outcome rigor costs the parent time at capture, we've built the form that fights back (Stage-2 risk).
- **No school-grade language, no league tables.** Tiers are growth bands. We are raising the *evidentiary* bar behind `demonstrating`, not the emotional stakes in front of it.
- **Write-time AI only** (Architecture Principle 4). Everything here keeps enrichment at entry-save; no new runtime LLM calls.
- **Philosophy-neutral.** Outcome targeting is descriptive ("offers an opportunity to demonstrate X"), never prescriptive sequencing.
- **No new ghost schema.** Every migration in Part IV has its write path in the same or immediately-following PR (postmortem §3 resolution rule).

## 5. Success signals

| Horizon | Signal | How measured |
|---|---|---|
| Short | Thread tier ↔ DLO status consistency | Property: rendered thread tier derivable from its DLO statuses (unit-tested invariant, WS-4) |
| Short | Declared-thread fidelity | % of entries with `sourceActivityIds` whose declared threads appear in the snapshot — target 100% (WS-1) |
| Medium | Report determinism | Same entry history → byte-identical coverage section, twice (WS-5 integration test) |
| Medium | Transposability | Adding a second framework mapping requires no code change (WS-5 exit demo) |
| Long | Provenance coverage | % of new DLO links carrying `declared`/`asserted` provenance (admin analytics; rises as modules are used) |
| Long | Mapper groundedness | DLO tier-vs-id mismatch rate ≈ 0; rationale cites descriptor text (WS-3, sampled in admin QA) |
| Journey | Stage-4 confidence | Existing `report_exported` + the journey doc's qualitative ask ("what's missing?") routed to the research log |

---

# Part II — UX brief: how this should feel

## 6. Principle: one progression language

Today the constellation renders two unreconciled stories: thread glyphs driven by observation *counts* (≥8 = demonstrating) and DLO dots driven by *evidence* (`learner_dlo_status`). After WS-4 there is one: **a thread's tier is a summary of its DLO evidence.** The glyphs (○ ◐ ●) and labels stay; what changes is that they become true.

Parent-visible consequence: some threads will *drop* tier when the count-based inflation is removed. This is a Stage-3/Stage-6 trust moment and must be handled like the recommendation-shift notice (precedent: `feat(recommend): shift notice`, commit `8739c2d`): a one-time, warm, plain-language notice — "We've made the constellation more honest about what we've actually observed. Nothing your child did was lost." Never silently re-grade a child downward.

## 7. Principle: provenance visible, gently

Three kinds of outcome evidence exist (and after WS-2 are stored distinctly):

| Provenance | Plain-language label | Source |
|---|---|---|
| `inferred` | "Hearth noticed" | Haiku enrichment of the entry text |
| `declared` | "From {module name}" | Author-declared activity targets, via a completed run |
| `asserted` | "You confirmed" | Parent action (badge assessment, future confirm tap) |

UX rules:
- Provenance appears in the DLO **detail/drill-down** (evidence list per DLO already exists at `/api/capabilities/[learnerId]/dlo-evidence`), not as badges shouting on the constellation overview.
- "Hearth noticed" framing keeps inference humble; "you confirmed" gives Renee the defensibility language for her audit; "from {module}" closes the loop for Mei-Lin — running a module visibly grew the constellation.
- The report can then say *how* each claim is supported — selection from abundance, not assertion from hope (Stage-4 contract).

## 8. Surface-by-surface implications

- **Constellation (`/our-story/capabilities`)** — Stage 6, Bec's thinking tool. Thread tier becomes DLO-derived (WS-4); DLO drill-down shows provenance-labelled evidence (WS-2); no layout change. The fabricated `dlos_confirmed` count disappears from the payload rather than being restyled.
- **Module completion (`/module/[id]` end-of-run)** — Stage 5. After WS-6, completion can surface (optionally, post-save, skippable): "This session gave {child} a chance to work on {descriptor}." A single low-friction "saw it" tap upgrades provenance to `asserted`. **This is a hypothesis, not a commitment** — it must be validated against the 5-minute rule before building (open question D-OS1, §13).
- **Report (`/our-story/report`)** — Stage 4, Renee and Mei-Lin. Coverage moves to the deterministic mapping (WS-5); LLM-suggested codes demote to a "Hearth also noticed" secondary list or internal gap-analysis input. Jurisdiction titles unchanged. The visible promise: the same report tomorrow says the same thing.
- **Logger insights (post-save)** — Stage 2, the relief moment. When a DLO matches, insight copy may quote the descriptor ("that's 'sequences personal events' — early historical thinking"). Descriptor language is already parent-facing by design; this deepens relief without new UI.
- **Admin (`/admin/analytics`, `/admin/families`)** — provenance distribution + tier-mismatch rate land here first, before any parent-facing change (instrumentation-before-meaning-change, postmortem §5.3 discipline).

## 9. Copy rules

- Tier names never change: *emerging / developing / demonstrating*. They are growth bands, "not age levels" (DLO reference doc), and never grades.
- "Not yet" stays the label for unobserved (already `TIER_LABEL.unobserved`); never "missing", "behind", or "gap" in parent-facing copy.
- Provenance labels are the three plain phrases in §7 — never "AI-detected", "unverified", or "low confidence" in parent-facing surfaces.
- Framework codes (AC9 etc.) remain backend/report-only vocabulary (Architecture Principle 6). The constellation never shows a curriculum code.

---

# Part III — Verified current state (2026-06-11 examination)

Full detail in the examination conversation; load-bearing facts, verified against HEAD:

| # | Finding | Where |
|---|---|---|
| 1 | Author-declared activity→thread links are written (`learning_entries.thread_links`, `confidence: 'confirmed'`) but **never read** — snapshot aggregates only Haiku's inferred `capability_threads` | `src/lib/ai/thread-links.ts`, `src/lib/ai/snapshot-rebuild.ts:118-134` |
| 2 | Id-format mismatch lying in wait: threadLinks store Sanity `_id`s (`capabilityThread.L1`); snapshot keys bare codes (`L1`) | same |
| 3 | Thread tier is a frequency counter (≥8 obs = demonstrating, ≥4 = developing) — **SUPERSEDED 2026-07-08, see note below** | `snapshot-rebuild.ts:144-147` |
| 4 | DLO status ratchets to `demonstrating` from a single inferred link at confidence ≥ 0.4 | `src/lib/ai/dlo-persistence.ts:102-106` |
| 5 | Haiku maps to DLO ids whose descriptors it never sees (prompt shows only the `dlo.{thread}.{tier}` pattern); `tierById` is cached but never cross-checked | `src/lib/ai/enrich.ts:115`, `src/lib/ai/dlo-cache.ts` |
| 6 | DLO links are copied identically to every learner on the entry | `dlo-persistence.ts` header |
| 7 | Snapshot still fabricates `dlos_confirmed` from tier rank (constellation no longer consumes it, but the field ships in the API) | `snapshot-rebuild.ts:346-355` |
| 8 | Report curriculum codes are LLM-recalled, format-validated only (`AC9_CODE_PATTERN` checks shape, not existence) — **partially addressed 2026-07-08, see note below** (blank-state→QLD-default risk closed; determinism itself still WS-5-gated) | `enrich.ts:46,393` |
| 9 | v2 substrate (strands, atomic capabilities, prerequisite edges, regulatory frameworks) is schema-only — no seeds, no documents; the spec it cites (`hearth-capability-universe-v2-architecture-spec-v1.md`) is absent from the repo | `src/sanity/schemas/{strand,atomicCapability,prerequisiteEdge,regulatoryFramework}.ts` |
| 10 | Activities cannot declare target tier; thread-links hardcodes `DEFAULT_TIER: 'developing'` | `thread-links.ts:32-33` |

What's already *right* and must be preserved: append-only canon discipline, deterministic idempotent seeds, parent overrides that can only lower a tier, validation at every LLM boundary, the constellation's tested refusal to fabricate DLO status, and the v2 type contract itself.

### Reconciliation notes (2026-07-08)

Two of the load-bearing facts above no longer hold as written. Findings are left in place per the append-only convention; these notes record what the code now does instead. See the workstream status table at the top of Part IV for the fuller picture.

- **Finding #3 — SUPERSEDED.** Thread tier is no longer a frequency counter. WS-4 shipped (PR #206): `renderedThreadTier()` derives tier from DLO evidence against `PRODUCTION_TIER_BAR`, verified live at `src/lib/ai/snapshot-rebuild.ts:497` (see also `src/lib/ai/thread-tier.ts:178,218`). The old count-based tier (`countBasedTier`) survives only as the "before" side of the one-time shift-notice comparison — it is no longer the rendered value. Finding #7 (fabricated `dlos_confirmed`) is understood to have been resolved in the same WS-4 land; re-verify the exact line before closing it out formally.
- **Blank-state → QLD-default risk — FIXED.** The risk implied by finding #8 (an LLM-recalled report defaulting to QLD framing for a family with no recorded state) is closed at `src/lib/report/coverage.ts:68`: `getDeterministicCoverage()` now gates on an explicit, non-blank `state` — `if (!state || !state.trim()) return { mode: 'fallback' }` — before any framework key is chosen. This closes the *blank-state* failure mode specifically. Finding #8's broader claim (regulator-facing codes are LLM-recalled, not mapping-derived) is **not** resolved — that is WS-5's plumbing scope, and per the workstream table below, QLD mapping content is only tranche-1 complete (~17/57 threads).

---

# Part IV — Technical workstreams

## Workstream status (reconciled 2026-07-08)

The plan below was written 2026-06-11 against the broken pipeline described in Part III. Several workstreams have since shipped. This table is the current source of truth for "what's left" — read it before picking up any workstream; the prose sections that follow retain the original scope/rationale and are not rewritten in place.

| Workstream | Status | Evidence |
|---|---|---|
| WS-1 — Honour declared evidence | **Shipped** | `thread_links` wired into snapshot aggregation |
| WS-2 — Evidence provenance + tier coherence | **Shipped** | provenance substrate landed |
| WS-3 — Descriptor-grounded DLO mapping | **VERIFY — needs check** | State not independently confirmed this pass; do not assume shipped or unshipped without re-reading `src/lib/ai/enrich.ts` against §WS-3 scope |
| WS-4 — One progression model | **Shipped** | PR #206 (`PRODUCTION_TIER_BAR`); thread tier is DLO-derived, verified live at `src/lib/ai/snapshot-rebuild.ts:497` (`src/lib/ai/thread-tier.ts:178,218`) |
| WS-5 — Transposer v0 | **Plumbing shipped / mapping content partial** | `regulatoryMappings[]` + deterministic coverage path landed; QLD (`ac-v9-qld`) mapping content is tranche-1 only — roughly 17 of 57 threads authored; remaining tranches + a second framework (NSW) still open |
| WS-6 — Activities declare the contract | **Shipped** | PR #203 (`capabilityTargets` on activities; declared-provenance DLO writes on completion) |
| WS-7 — Truth and hygiene | **Partial** | Some hygiene items (doc currency, this reconciliation) done; per-learner attribution fix (D-OS2) and the v2-substrate spec reconstruction status not confirmed this pass |

Execution rules (binding, from postmortem §4): **one workstream slice per session/PR; each PR individually green across all four CI jobs with tests at the right layer in the same PR; schema/data PRs soak before dependent behaviour PRs; no parallel-terminal mega-merges.** Migrations follow the testing-runbook lockstep rule (`src/test/factories.ts` + `db-factories.ts` updated in the same PR).

## WS-1 — Honour declared evidence (wire `thread_links` into the snapshot)

- **Aim:** Completing a thread-mapped module always grows the declared threads in the child's constellation.
- **Why / who:** Mei-Lin runs Starter Pack modules and should see them count (Stage 5 → Stage 2 loop). This is the cheapest fix with the highest trust yield, and it makes module authorship (kindling) structurally meaningful.
- **Scope:** Normalise thread ids (`capabilityThread.X` → `X`) at one seam; aggregate `entry.threadLinks` into `threadCounts` alongside inferred threads (deduped per entry — an entry contributes one observation per thread regardless of source); record source mix for WS-4. Backfill script for historical entries with `sourceActivityIds` (pattern: `scripts/backfill-dlo-links.mjs`).
- **Out of scope:** tier changes (WS-4), DLO writes from declared targets (WS-6).
- **Tests:** unit (id normalisation, dedupe); integration (module-completion entry → snapshot contains declared thread).
- **Exit:** declared-thread fidelity signal (§5) at 100% on new entries; backfill run logged.

## WS-2 — Evidence provenance + tier coherence (the integrity substrate)

- **Aim:** Every DLO evidence row knows where it came from; incoherent LLM output is caught at the boundary.
- **Why / who:** Renee's audit defensibility; Bec's trust. Provenance is the substrate WS-4/5/6 stand on — it lands first and soaks.
- **Scope:** (a) Add `provenance` (`inferred` | `declared` | `asserted`) to `observation_dlo_links` (+ migration, factories, evidence API exposure; existing rows backfill as `inferred`). (b) In `validateDlos`, cross-check the claimed `tier` against `tierById` from the cache — on mismatch, trust the id, clamp the tier, log to `aiPipelineLogs` and count it (admin metric). (c) Surface provenance in the DLO drill-down UI (label copy per §7).
- **Tests:** unit (clamp logic); integration (link row carries provenance; mismatch logged).
- **Exit:** new links 100% provenance-tagged; mismatch rate visible in admin analytics.

## WS-3 — Show the mapper the contract (descriptor-grounded DLO mapping)

- **Aim:** Haiku assesses observations against the actual descriptor text, not a reconstructed id pattern.
- **Why / who:** The descriptor "is the contract" (DLO reference doc) — currently invisible to the only component doing the mapping. Stage-2 relief quality and every downstream claim depend on this.
- **Scope:** Inject candidate-thread descriptors into the enrichment prompt, bounded: candidates = threads declared by the entry's source activities ∪ the child's active threads (both already assembled in `assembleContext`), capped at ~10 threads × 3 descriptors (~2k tokens). Require `rationale` to reference the descriptor. Update the prompt's DLO rules accordingly.
- **Cost guardrail:** measure before/after per-entry token cost on the AI cost dashboard; document the budget in the PR. Noisy-family thresholds unchanged. If cost is unacceptable, fall back to descriptors-for-declared-threads-only.
- **Quality gate:** small golden set (10–20 representative entries, fixtures in repo) scored before/after for mapping plausibility — this is the eval that makes "did WS-3 help?" answerable rather than vibes.
- **Exit:** golden-set mapping quality improves or holds; tier-id mismatch rate (WS-2 metric) falls; cost delta documented.

## WS-4 — One progression model (parent-visible; gated)

- **Aim:** Thread tier becomes a summary of DLO evidence; `demonstrating` becomes a claim Hearth can back.
- **Why / who:** Bec (credibility ceiling), Renee (defensible report). Closes findings 3, 4, 7.
- **Scope:** (a) Derive thread tier from its DLO statuses (highest tier with sufficient evidence); observation counts remain as activity-volume signal only. (b) Raise the `demonstrating` bar: requires ≥1 `declared`/`asserted` link **or** ≥2 independent `inferred` links on distinct days (exact rule = decision D-OS4). (c) Parent overrides preserved (lower-only). (d) Delete fabricated `dlos_confirmed`/`dlos_total` from the snapshot payload; constellation/Table/Gallery take counts from `learner_dlo_status`-derived data. (e) One-time shift notice (§6).
- **Gate (postmortem §5 discipline — this is the one meaning-changing workstream):** ships only after WS-1–3 have soaked (so derived tiers aren't starved of evidence), with admin-side before/after tier comparison for pilot families reviewed first, and with the Stage-4/6 signals named in §5 measurable before the flip.
- **Tests:** unit property test — rendered tier is a pure function of DLO statuses + overrides; integration — end-to-end entry→status→snapshot→API shape without fabricated fields; topology tests updated.
- **Exit:** consistency invariant holds; shift notice shipped; no pilot family silently downgraded.

## WS-5 — Transposer v0 (deterministic reporting)

- **Aim:** Regulator-facing coverage derives from a static outcome→framework mapping, not LLM recall. Adding a framework = authoring data.
- **Why / who:** Renee (HEU submission — the journey doc calls a real regulator outcome "the single most valuable piece of evidence the pilot can produce"; the report it judges should be deterministic). Mei-Lin (NESA is the second mapping, proving the transposer). This is the entire medium horizon.
- **Scope (plumbing PR):** add `regulatoryMappings[]` to the DLO schema — *identical shape* to `atomicCapability.regulatoryMappings` (frameworkKey, frameworkVersion, codes, contribution, evidenceWeight) so migrating the mappings down to atomics later is mechanical, not a redesign. Report/coverage path reads: learner DLO statuses × mapping → coverage by framework; LLM `curriculum_descriptors` demote to gap-analysis input + "Hearth also noticed" secondary. Keep `AC9_CODE_PATTERN` as an authoring-time lint on mapping data.
- **Scope (content):** author `ac-v9-qld` mappings, staged: first the threads the Starter Pack + pilot observations actually touch, then the full 171. Draft mechanically (subject-prefix heuristics + lo-fi content), then human pass (council-review skill is fit for this). Mapping data lives in Sanity; seed script mirrors `seed-dlos.ts` (deterministic, idempotent).
- **Timing care:** the report is the Stage-4 touchpoint; don't change its content the week a pilot family is mid-submission. Coordinate via research log.
- **Tests:** integration — determinism (same history → identical coverage twice); unit — mapping rollup math (contribution/evidenceWeight).
- **Exit:** determinism test green; demo: add a 5-thread `ac-v9-nsw` mapping with zero code change and the report renders it for a NSW family.

## WS-6 — Activities declare the contract (the long-horizon keystone)

- **Aim:** Published activities state which outcomes (thread + tier) they offer; completed runs write `declared`-provenance DLO evidence. Constructive alignment becomes structure, not editorial convention.
- **Why / who:** Bec's tertiary-credible portfolio; the kindling pipeline's six-test gate gets a structural target to validate against.
- **Scope:** (a) Add `capabilityTargets: [{thread (ref), tier}]` to the activity schema alongside existing `capabilityThreads` (which stays during migration; workbench publish soft-flags activities with threads but no targets). (b) `thread-links.ts` consumes declared tier instead of `DEFAULT_TIER`. (c) On entry save with `sourceActivityIds`, write DLO links at declared (thread, tier) with `declared` provenance — **semantics per decision D-OS1** (evidence vs. opportunity-pending-corroboration). (d) Coordinate with kindling (sibling repo): spec template already asks which tier an activity targets; build-mode orchestrator populates the field; `hearth-capability-dlo-reference.md` regenerated with authoring guidance.
- **Tests:** integration — module run with targeted activities → DLO links with declared provenance at declared tier; workbench soft-flag unit tests.
- **Exit:** Starter Pack activities carry targets (content pass); a completed run visibly grows a declared DLO in the drill-down with "From {module}" provenance.

## WS-7 — Truth and hygiene (parallel, low-risk)

- Land or reconstruct `hearth-capability-universe-v2-architecture-spec-v1.md` into `docs/` (it is cited by code and schemas but absent — if the canonical copy lives outside the repo, import it; if lost, reverse-engineer from the types file and mark provenance).
- Regenerate `hearth-capability-dlo-reference.md` after WS-5/6 schema changes (it self-describes as a derived snapshot).
- Resolve per-learner attribution (decision D-OS2): stop copying DLO links identically to all learners — minimum viable fix is gating by `per_child_signals` presence/complexity; Sandra's group sessions make this non-optional before Hearth-group evidence scales.
- Update `docs/PROJECT_STATUS.md` and the CLAUDE.md reference table in the same PRs as the work (currency convention).

## 10. Sequencing

```
Phase A (integrity, parent-invisible):   WS-1 → soak → WS-2 → soak        [+ WS-7 docs anytime]
Phase B (mapper quality):                WS-3 (needs WS-2's mismatch metric to measure itself)
Phase C (transposer):                    WS-5 plumbing → mapping authoring (content track, parallel to B)
Phase D (meaning change, gated):         WS-4 (needs A+B soaked; admin comparison; shift notice)
Phase E (authoring contract):            WS-6 (needs WS-2 provenance; coordinates kindling)
```

Each arrow is a separate session/PR. Phases C and B can interleave; D is deliberately last among behaviour changes because it is the only one that changes what a parent sees about her child.

## 11. Postmortem conformance statement

This plan is **not** a screen-purpose pivot — no screen changes its job; the pipeline behind existing screens becomes honest. Accordingly it does not trip postmortem §5's full entry criteria, with one exception: **WS-4 changes the meaning of a parent-facing display** and therefore self-imposes §5-style gates (instrumentation measurable before the change, evidence reviewed, shift notice, last in sequence). Everything else conforms to §4 house style: small PRs, per-PR green, soak between foundation and dependents, no flag-as-verification, no new ghost schema (every migration's write path lands with it).

## 12. Risks

| Risk | Mitigation |
|---|---|
| Tier deflation alarms pilot parents (WS-4) | Admin before/after review per family first; shift notice; overrides preserved; copy per §6 |
| WS-3 token cost creep | Bounded candidate set; cost dashboard check in PR; fallback to declared-threads-only |
| Mapping authoring stalls at 171 DLOs (WS-5) | Stage by observed coverage; mechanical draft + human pass; ship QLD-partial before QLD-complete |
| Kindling/hearth schema drift (WS-6) | Schema PR in hearth first, kindling consumes after soak; reference doc regenerated same week |
| Historical data shaped by old pipeline | WS-1 backfill is cheap (no LLM); historical *re-enrichment* is a cost decision (D-OS3), not assumed |
| Double-counting threads when declared + inferred agree (WS-1) | Dedupe per entry per thread before counting; unit-tested |

## 13. Open decisions (need Drew, not an agent)

- **D-OS1 — Completion semantics:** does completing an activity with a declared target constitute DLO *evidence* at that tier, or an *opportunity* pending corroboration (Haiku per-child signal or parent tap)? Recommendation: opportunity + cheap corroboration — protects the evidence bar that WS-4 establishes. Affects WS-6.
- **D-OS2 — Per-learner attribution rule:** gate DLO links by `per_child_signals` (only learners Haiku named), or keep copy-to-all until Hearth-group evidence ships? Affects WS-7/WS-2.
- **D-OS3 — Historical re-enrichment:** re-run enrichment over pre-WS-3 entries (real $ cost, better history) or let old history stand with `inferred` provenance? Can be decided after WS-3's golden-set results.
- **D-OS4 — Exact `demonstrating` bar:** proposed ≥1 declared/asserted OR ≥2 inferred on distinct days. Tune against real pilot distributions in the WS-4 admin comparison before flipping.
- **D-OS5 — Parent assertion surface:** is the post-run "saw it" tap (§8) worth its friction? Validate against a real family before building (research-log question; ties to Stage-5 signals).

---

*Cross-references: examination of 2026-06-11 (this plan's evidence base); `hearth-refactor-postmortem-v1.md` §4–5 (execution discipline); `hearth-pilot-personas-v1.md` + `hearth-parent-journey-v1.md` (the people and stages each workstream must name); `hearth-capability-dlo-reference.md` (the descriptor contract WS-3/WS-6 operationalise); `src/types/capability-universe.ts` (the v2 contract this plan moves the runtime toward).*
