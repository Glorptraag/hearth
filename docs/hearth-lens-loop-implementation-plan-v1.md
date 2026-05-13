<!-- Version: 1 | Date: 2026-05-13 | Status: planning. Implementation deferred — blocked on PKB Wave 1 corpus completion (need final Interpretive Pattern IDs before locking signal schema). -->

# Lens Loop Implementation Plan — Layers 5, 6, 7

> **Status:** Planning. Schema deltas can land now; full implementation deferred per the architecture doc §16 ("Blocked on PKB Wave 1 corpus completion").
> **Authority:** `docs/hearth-pedagogy-system-architecture-v1.md` §8–§10 (decision C-PA5).
> **This is not a spec.** The canonical spec, when written, will live at `docs/hearth-lens-loop-architecture-v1.md`.

---

## What's already landed (2026-05-13)

| Piece | Status | Where |
|---|---|---|
| `methodAffinity` field on module schema (Layer 6) | ✅ Done | `src/sanity/schemas/module.ts` — `pedagogies[]` + `interpretivePatterns[]` (Option 2 granularity) |
| Forward-prescription guard in Bundle validation | ✅ Done | `claude-kindling/library/build-mode/bundle-validation.ts` (`checkForwardPrescription`) |
| `questionOverlay` within-module scope tightening | ✅ Done | `src/sanity/schemas/pedagogyLensBundle.ts` + system prompts |
| Architecture decisions in log | ✅ Done | `docs/hearth-decisions-log-v1.md` C-PA1…C-PA5 |

---

## What still needs implementation

### Layer 5 — Lens Accumulated Signals (FIS field)

**Storage:** Per-child JSONB on the `family_intelligence_snapshots` table.

```typescript
interface LensAccumulatedSignals {
  interpretivePatterns: Record<string, { count: number; lastFired: string }>;
  activityShapes: Record<string, number>;
  capabilityThreadsTouched: Record<string, number>;
  updatedAt: string;
}
```

**Writes:** Extend the existing Logger save Haiku enrichment call (`src/lib/ai/enrich.ts`). Same call produces insight prose AND a structured signal block. Marginal cost: ~500–1000 additional tokens per save. **No new LLM operation** — the two-layer AI rule is preserved.

**Blocked on:** PKB Wave 1 Interpretive Pattern IDs need to be locked first. The CM corpus needs the Practice Pattern → Interpretive Pattern reframe pass (C-PA3) before the enrichment prompt can classify against stable IDs.

**Migration:** Drizzle migration adds the JSONB column with default `{}` on existing snapshots; backfill not needed (signals accumulate from the next Logger save onward).

**Implementation files (when unblocked):**
- `src/lib/db/schema.ts` — add `lensAccumulatedSignals` column to `familyIntelligenceSnapshots`
- `drizzle/0NNN_lens_accumulated_signals.sql` — migration
- `src/lib/ai/enrich.ts` — extend prompt + output schema to include signal block
- `src/lib/ai/snapshot-rebuild.ts` — fold the signal block into the snapshot write
- `src/lib/pedagogy/lens-accumulated-signals.ts` — types + helpers (`incrementSignal`, `getActivePatterns`, etc.)

### Layer 6 — Method Affinity authoring

**Schema:** ✅ field exists. Empty on all existing modules.

**Authoring paths:**
1. **Curated content** — Content Studio team authors `methodAffinity` per module. The Lens Bundle generation pass can suggest pattern matches based on which corpus chunks it grounded against; editor confirms or refines.
2. **Parent-built modules** — inferred from the Bundle generation pass: Kindler records which Interpretive Patterns were retrieved heavily during generation. Quiet, automatic, no parent-facing surface.
3. **Agent-produced** — generated and flagged for human review.

**Backfill:** Run a one-off script that walks existing modules with `pedagogyLensBundles` and pulls Interpretive Pattern IDs out of the `corpusChunkIds[]` provenance. For the CM-only modules generated so far, this would populate `methodAffinity.pedagogies: ['charlotte_mason']` and `methodAffinity.interpretivePatterns: [...]` from the corpus chunks that drove generation.

**Implementation files (when unblocked):**
- `claude-kindling/library/build-mode/bundle-orchestrator.ts` — emit `methodAffinity` from the Lens Bundle generation pass alongside the bundle itself
- `scripts/backfill-method-affinity.ts` — one-off backfill from existing bundles

### Layer 7 — Tag-match recommender

**Mechanism:** PostgreSQL JSONB overlap query at read-time. No LLM. No vector index for this step.

```sql
-- Pseudo-query at Discovery / Planner / Marketplace
SELECT module.id,
       (cardinality(family_signals.patterns ?& module.affinity.patterns) +
        CASE WHEN family.pedagogy_key = ANY(module.affinity.pedagogies) THEN 1 ELSE 0 END) AS score
FROM modules
JOIN family_intelligence_snapshots fis ON fis.family_id = $1
ORDER BY score DESC
```

**Read paths:**
- Activity Discovery — primary surface
- Weekly Planner — suggestion ordering
- Marketplace — pack-level affinity (aggregation of module-level)
- Dashboard "next steps" — same logic, smaller surface

**Cold start:** Family with no signals → rank by `pedagogy_key ∈ module.methodAffinity.pedagogies` only.

**Filter-bubble exploration budget:** Deferred until usage data shows the loop is trapping families.

**Signal decay:** Deferred until staleness becomes a problem.

**Implementation files (when unblocked):**
- `src/lib/pedagogy/tag-match-ranker.ts` — pure scoring function
- `src/lib/recommender/discovery-rank.ts` — wires ranker into existing Discovery query
- `src/lib/recommender/planner-rank.ts` — wires into Planner suggestion query
- `src/app/(auth)/explore/marketplace/page.tsx` — rank pack listing
- Tests in `src/lib/pedagogy/tag-match-ranker.test.ts`

---

## Unblocking sequence

The natural order for the next sessions:

1. **PKB Wave 1 reframe** (Cowork-side work, in the `claude-kindling/` repo) — Practice Pattern → Interpretive Pattern rename + scope tightening + halving. CM corpus is the first to do. Output: ~8 stable Interpretive Pattern IDs per pedagogy with diagnostic shapes.

2. **Layer 5 enrichment pipeline** — extend `enrich.ts` to classify Logger entries against the Wave 1 Interpretive Patterns and emit signal block. Migration for the FIS column. Telemetry to confirm signals are accumulating.

3. **Layer 6 backfill** — populate `methodAffinity` on existing modules from their bundle provenance. New module saves populate it automatically.

4. **Layer 7 ranker** — wire the JSONB overlap query into Discovery, then Planner, then Marketplace. Each surface independently testable.

Each step depends only on the previous one. The user can pause at any boundary without leaving the system in a degraded state.

---

## Verification when each step lands

- **Layer 5:** Sign in as a family, log five Logger entries, watch `lensAccumulatedSignals` accumulate via admin tool. Confirm the increment math is correct and patterns are sticking.
- **Layer 6:** Spot-check three curated modules; `methodAffinity` should match what the Kindler grounded against. Open `/admin/content/<id>` and confirm.
- **Layer 7:** Two families with different signal profiles open `/explore`. Ordering differs in line with their accumulated signals. Tooltip explains why each module was surfaced.

---

## What this plan does NOT do

- It does not implement Layer 5–7 today. Schema deltas are in place; data flow is not.
- It does not change the methodology overlay bundle work shipped in Phase 1+2. That work is consistent with the new architecture and stays.
- It does not modify the existing pedagogy lens bundle generation pipeline beyond the forward-prescription guard already landed.
- It does not address the corpus gap (only CM ingested today). That is a separate corpus-team workstream.
