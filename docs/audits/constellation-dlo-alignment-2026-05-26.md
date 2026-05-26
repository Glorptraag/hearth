# Constellation & DLO — Sanity ↔ Docs Alignment Audit

**Date:** 2026-05-26
**Dataset:** `g5zhwbxg` / `production`
**Sources compared:**
- Sanity production data (live pull)
- `docs/hearth-capability-thread-library.md` (canonical 8-domain × 57-thread library)
- `docs/hearth-capabilities-connector-architecture.md` (Layer 4 DLO model)
- `docs/hearth-constellation-spec-v1.md` (Level 3 Badge & DLO view)
- `docs/hearth-badge-assessment-spec.md` (3-tier model)
- `src/sanity/schemas/{capabilityThread,discreteLearningObjective,capabilityDomain,strand,atomicCapability}.ts`

---

## Headline counts

| Entity | Sanity (live) | Docs say | Status |
|---|---|---|---|
| Capability Domains | **15** | 8 (library) / 15 (CLAUDE.md Capability Universe v2) | ✅ matches v2 framing, ⚠️ library doc is stale |
| Capability Threads | **74** | 57 + custom (Phase 2) | ⚠️ 57 canonical + 17 orphan/seed fixtures |
| Discrete Learning Objectives | **171** | 800–1200 (connector) / 171 = 57×3 (badge spec) | ⚠️ two competing DLO models, only the coarse one is shipped |
| Badges | **2** | 3 levels × 57 threads = 171 envisaged | ❌ effectively unseeded |
| Atomic Capabilities | **0** | "atomic capabilities" referenced in CLAUDE.md Capability Universe v2 | ❌ not seeded |
| Strands | **0** | "15 domains × 4 stage-bands × strands × atomic capabilities" (CLAUDE.md) | ❌ not seeded |
| Prerequisite `enables` edges | **0 populated** | DAG with `enables` edges is the *whole point* of the Constellation Level 1 view | ❌ blocker for L1 |

---

## 1. Domain alignment

### Sanity production domains (15)

| Slug | Threads | Notes |
|---|---|---|
| classicalLanguages | 0 | Empty — placeholder only |
| historicalCivicGeographic | 6 | H1–H6 ✓ |
| languageLiteracy | 7 | L1–L7 ✓ |
| literaryTradition | 2 | C1 (Narrative) + L9 (Literary Response) |
| logicRhetoric | 1 | L8 (Persuasion & Argument) |
| mathematicalThinking | 9 | M1–M9 ✓ |
| musicalPerformative | 3 | C2 (Musical) + C3 (Poetic) + C4 (Dramatic) |
| personalEthical | 11 | EF3, EF4, EF5, EF7, EF8 + PS3, PS4, PS5, PS6 + (EF1, EF2 also here) |
| physicalEmbodied | 5 | P1–P5 ✓ |
| practicalMastery | 1 | C6 (Design & Construction) |
| scientificThinking | 6 | S1–S6 ✓ |
| socialRelational | 3 | PS1, PS2, EF6 |
| technologicalFluency | 2 | PS7 (Digital Citizenship) + C7 (Digital Creation) |
| theologyScripture | 0 | Empty — placeholder only |
| visualPlasticArts | 1 | C5 (Visual Expression & Design) |

### Findings

- **Library doc is stale.** `hearth-capability-thread-library.md` still describes 8 domains; production uses 15. The CLAUDE.md citation `docs/hearth-capability-universe-v2-architecture-spec-v1.md` is referenced but **the file does not exist in the repo**. Either it was deleted or never landed. This is the authoritative spec per CLAUDE.md — without it there is no source of truth for the 15-domain split.
- **`displayOrder` is `null` on every domain.** The Constellation L1 spec requires "organized by domain rows" — there is no canonical row ordering in the data. Consumer code must hardcode an order, defeating Sanity-as-CMS.
- **Two empty domains** (`classicalLanguages`, `theologyScripture`) — likely v2-aspirational but unseeded. Decide: populate, hide, or delete.

---

## 2. Thread alignment

### Canonical 57-thread set: ✅ all present
All 57 threads from `hearth-capability-thread-library.md` (L1–L9, M1–M9, S1–S6, H1–H6, P1–P5, PS1–PS7, C1–C7, EF1–EF8) exist in Sanity with proper IDs (e.g. `capabilityThread.M1`), domain references, and 3 DLOs each.

### 17 orphan/duplicate threads (no domain, no DLOs, no edges)

These appear to be seed-script leftovers or test fixtures that were never cleaned up:

| Slug | Title | _id pattern |
|---|---|---|
| algebraic-thinking | Algebraic Thinking | UUID |
| critical-thinking | Critical Thinking | UUID |
| data-and-statistics | Data and Statistics | UUID |
| living-systems | Living Systems | UUID |
| mathematical-communication | Mathematical Communication | UUID |
| measurement | Measurement | UUID |
| measurement-estimation | Measurement & Estimation | seed-ct-measurement |
| narrative-understanding | Narrative Understanding | seed-ct-narrative |
| number-sense-place-value | Number Sense & Place Value | seed-ct-number-sense |
| oral-communication | Oral Communication | UUID |
| scientific-inquiry | Scientific Inquiry | UUID |
| scientific-observation (×2) | Scientific Observation | UUID + seed-ct-sci-obs |
| text-structure | Text Structure | UUID |
| visual-arts-expression | Visual Arts Expression | seed-ct-visual-arts |
| visual-expression | Visual Expression | UUID |
| written-expression | Written Expression | UUID |

**Action:** delete these. They pollute any `*[_type == "capabilityThread"]` query and will show up as broken nodes if rendered. The `seed-ct-*` ones look like they came from an early `scripts/seed-*` run; the UUID ones look like Studio test entries.

### `enables` edges

**Zero threads have `enables` populated.** The Constellation spec L1 (`hearth-constellation-spec-v1.md` lines 20, 49) is built entirely around rendering a DAG of `enables` edges across the 57 threads. Without these edges the L1 view degenerates to a domain-grouped grid. The `prerequisiteEdge` schema document exists but there's no count in this audit — worth a follow-up to check whether the DAG lives on `prerequisiteEdge` documents instead of inline `enables` arrays. If so, the schema and spec are out of sync about where the edges live.

---

## 3. DLO model alignment — the big one

There are **two competing DLO conceptions** in the docs, and the shipped one is the simpler.

### Model A — coarse 3-tier (shipped, badge spec)

- 3 DLOs per thread: `emerging`, `developing`, `demonstrating`
- 57 threads × 3 = **171 DLOs** ✓ matches Sanity count exactly
- Fields: `thread`, `tier`, `descriptor`, `slug`, `parentVersion`, `badgeLevel`, `status`
- Document IDs follow `dlo.{threadCode}.{tier}` (e.g. `dlo.C1.emerging`)
- Used by: badge assessment, Constellation L3 (per `alpha-readiness-pickup.md`)

### Model B — fine-grained AC-mapped (connector arch, unshipped)

- 8–25 DLOs per thread, ~800–1200 total
- Each DLO has: statement, parent prompt, observation keywords, AC9 code(s)
- Example from `hearth-capabilities-connector-architecture.md`:
  ```
  M1-DLO-10 | Composes numbers in flexible ways (38 = 30+8 = 20+18)
            | "Can they show you different ways to make the same number?"
            | different ways, another way to make, same number, regrouped
            | AC9M2N01
  ```
- Used by: nothing in production — but the connector doc says this is "Layer 4: the finest assessable grain"

### Findings

1. **The connector architecture doc is fiction relative to shipped data.** It describes a DLO grain that doesn't exist in Sanity. If we're committing to Model A, mark the connector doc as superseded.
2. **The Sanity schema cannot hold Model B even if we wanted to.** No fields for parent prompts, observation keywords, or AC codes. Migration would need `parentPrompt: text`, `observationKeywords: array<string>`, `acCodes: array<string>` added.
3. **`parentVersion` field is misused in `hearth-constellation-spec-v1.md` line 158.** The spec says "the `parentVersion` field, not the technical statement" — implying it holds a parent-friendly rephrasing. The schema description says it holds the *previous version's ID* (i.e. revision history). Two different intents, same field name. The shipped DLO docs have no `parentVersion` populated, and the L3 view actually reads `descriptor`.
4. **All 171 shipped DLOs have `tier` but none have `badgeLevel` populated** in the sample. Schema offers `starter/intermediate/advanced` but it's unused. Either delete the field or backfill it.

---

## 4. Capability Universe v2 substrate — almost entirely missing

CLAUDE.md says (verbatim):

> 15 domains × 4 stage-bands × strands × atomic capabilities; typed prerequisite graph; stage-tier badges; regulatory mappings on atoms.

Shipped:

| Substrate component | Schema exists? | Documents in Sanity |
|---|---|---|
| 15 domains | ✅ | 15 ✓ |
| 4 stage-bands | ❌ no `stageBand` schema found | n/a |
| Strands | ✅ `strand.ts` | **0** |
| Atomic capabilities | ✅ `atomicCapability.ts` | **0** |
| Typed prerequisite graph | ✅ `prerequisiteEdge.ts` | not counted in this audit |
| Stage-tier badges | ✅ `badge.ts` | **2** |
| Regulatory mappings on atoms | ✅ `regulatoryFramework.ts` | not counted |

**The Capability Universe v2 substrate is not seeded.** What's running in production is the previous-generation model: 15 domains → 57 threads → 171 tier-DLOs → 2 badges. The "atomic capability" layer between thread and DLO does not exist as data.

This may be deliberate (alpha simplification) but the docs assert it as the authoritative substrate. CLAUDE.md and the missing `hearth-capability-universe-v2-architecture-spec-v1.md` need a status note: "substrate scaffolded, not yet populated; alpha runs on legacy thread/tier-DLO model."

---

## 5. Recommendations

Ordered by blast radius.

### Must-decide (blocks doc trust)

1. **Pick one DLO model and retire the other in docs.** Either:
   - Keep Model A (shipped) and mark the connector arch DLO table superseded, OR
   - Commit to Model B, expand the schema, and treat current 171 DLOs as a placeholder.
2. **Restore or supersede `hearth-capability-universe-v2-architecture-spec-v1.md`.** CLAUDE.md cites it as authoritative; it doesn't exist. Either commit it or remove the citation.
3. **Reconcile the 8-domain library doc** (`hearth-capability-thread-library.md`) with the 15-domain production reality. Add a banner noting it documents thread *content* but domain *grouping* is v2.

### Should-fix (clean data)

4. **Delete the 17 orphan threads.** They will break any naive `*[_type == "capabilityThread"]` query.
5. **Set `displayOrder` on all 15 domains.** Required by L1 Constellation layout.
6. **Decide on `classicalLanguages` and `theologyScripture`.** Empty domains are tech debt.
7. **Confirm whether `enables` edges live inline or in `prerequisiteEdge` documents,** and count them. Constellation L1 is blocked otherwise.

### Nice-to-have

8. **Fix `parentVersion` semantic collision.** Either rename the schema field (`previousVersionRef`?) or correct the constellation spec line 158.
9. **Backfill or delete `badgeLevel`** on all 171 DLOs.
10. **Seed atomic capabilities + strands or remove the schemas** until v2 substrate is built. Empty schemas are a footgun.

---

## 6. What was *not* checked

- Whether `prerequisiteEdge` documents exist and carry the DAG (separate query needed)
- Whether `regulatoryFramework` documents map atoms to AC9 codes
- Whether the `learner_dlo_state` Postgres table aligns with the 171 shipped DLO IDs
- Whether `discreteLearningObjective` docs are referenced by any `module` / `activity` content
- Whether the Constellation L1 page in the app actually renders all 57 threads or trips on the 17 orphans
