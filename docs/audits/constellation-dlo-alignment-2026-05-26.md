# Constellation & DLO — Sanity ↔ Docs Status

**Date:** 2026-05-26 (recast)
**Dataset:** `g5zhwbxg` / `production`

This is a status snapshot, not a spec or an audit-with-blockers. The earlier version of this file tried to reconcile a "missing v2 architecture spec" — there is no missing spec. The substrate lives in code (`src/lib/capability-universe-v2.ts`, `src/types/capability-universe.ts`, Sanity schemas) and that is treated as authoritative going forward. Docs were updated 2026-05-26 to remove the dangling citation.

---

## What is shipped

| Entity | Sanity production | Source of truth |
|---|---|---|
| Capability domains | 15 | `src/lib/capability-universe-v2.ts` + Sanity `capabilityDomain` docs |
| Capability threads | 57 canonical + 17 orphan fixtures | `docs/archive/hearth-capability-thread-library.md` (contents only — domain grouping is in code) |
| DLOs (tier-band model) | 171 = 57 × 3 (emerging/developing/demonstrating) | Sanity `discreteLearningObjective` schema |
| Badges | 2 (placeholder) | Sanity `badge` |
| Strands | 0 (schema exists, unseeded) | Phase 2 |
| Atomic capabilities | 0 (schema exists, unseeded) | Phase 2 |
| `enables` edges on threads | 0 | `prerequisiteEdge` schema exists; not investigated whether edges live as separate docs |

## What was *not* a real problem

- **There is no missing "v2 architecture spec".** CLAUDE.md cited a doc that was never written. The citation was removed 2026-05-26 and repointed to the existing docs that *do* exist (`docs/archive/hearth-capability-thread-library.md` + `docs/archive/hearth-constellation-spec-v1.md`).
- **There is no AU/QLD-mandated fine-grained DLO scheme.** The ~800–1200 AC9-coded DLO grain in `docs/archive/hearth-capabilities-connector-architecture.md` was a self-imposed model. The connector doc was banner-superseded 2026-05-26 — its Layer 4 is historical, not a backlog item.
- **The 8-domain framing in `docs/archive/hearth-capability-thread-library.md` is stale, but the thread contents (57 threads, descriptors, tier definitions) are still canonical.** A banner was added 2026-05-26 so readers know to take the domain *grouping* from code.

## Three concrete data fixes (small, do-able, no spec required)

These are the only outstanding items. None require new docs.

1. **Delete 17 orphan threads in Sanity production.** They have no domain, no DLOs, no edges. Likely seed-script leftovers. Slugs include `algebraic-thinking`, `critical-thinking`, `data-and-statistics`, `living-systems`, `mathematical-communication`, `measurement`, `measurement-estimation`, `narrative-understanding`, `number-sense-place-value`, `oral-communication`, `scientific-inquiry`, `scientific-observation` (×2), `text-structure`, `visual-arts-expression`, `visual-expression`, `written-expression`. Document IDs are UUIDs or `seed-ct-*`.
2. **Set `displayOrder` on the 15 domains.** Currently null — Constellation L1 has to hardcode row order. Pick an order, write it once.
3. **Check whether prerequisite `enables` edges live inline on `capabilityThread` (currently empty) or on separate `prerequisiteEdge` documents.** Either populate the inline arrays or confirm the edge docs are the source of truth.

## What `parentVersion` actually means

The DLO schema's `parentVersion` field is for previous-version refs (revision history). The constellation spec line 158 wording ("the `parentVersion` field, not the technical statement") is misleading — the plain-language DLO text lives in `descriptor`. The constellation page already reads `descriptor` correctly; only the doc wording is off. Low priority; fix when next touching that spec.

## What was *not* checked in this snapshot

- Whether `prerequisiteEdge` documents exist and carry the DAG
- Whether `regulatoryFramework` documents are seeded
- Whether `learner_dlo_state` Postgres rows align with the 171 shipped DLO IDs
- Whether `discreteLearningObjective` docs are referenced by any `module` / `activity` content
- Whether the Constellation L1 page renders all 57 threads or trips on the 17 orphans

Each is a 1–2 query check, not a doc.
