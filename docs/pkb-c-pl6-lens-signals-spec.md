<!-- Version: 1 | Date: 2026-07-08 | Changes: Initial spec. Defines the interim, chunk-citation-based version of C-PL6 lensAccumulatedSignals — narrower than the full Interpretive-Pattern classifier scoped in hearth-lens-loop-implementation-plan-v1.md, chosen so the signal shape doesn't depend on Wave 1 Interpretive Pattern IDs being locked. Written by the PKB completion program, task E9. -->

# PKB C-PL6 — Lens Signals Spec (interim, chunk-citation based)

> **Status:** Spec — build gated on the CM interpretive-patterns audit (W1-PP) + Drew's read.
> **References:** `docs/hearth-pedagogy-system-architecture-v1.md` §8 (Layer 5 — Lens Accumulated Signals, decision C-PL6, table row "Where do accumulated signals live?" §15) and §16 (open item: "CM corpus audit against new Interpretive Patterns frame"); PKB completion program task E9.
> **Related but distinct:** `docs/hearth-lens-loop-implementation-plan-v1.md` specs the *full* Layer 5 vision keyed on Wave-1 Interpretive Pattern IDs (`interpretivePatterns: Record<'IP-CM-001', {count, lastFired}>`). That plan is explicitly blocked on the W1-PP corpus reframe landing stable IDs (see its "Blocked on" note). This spec defines a **narrower, ship-now-when-unblocked** interim: signals keyed on the deterministic `pedagogy_sources` chunk ids Hearth already retrieves and cites, not on Interpretive Pattern IDs. It satisfies the same architectural intent (observed-evidence trace on the FIS, zero new LLM calls, write-time only) without waiting on Wave 1 naming to stabilize. When W1-PP lands, `patternCounts` below can be re-keyed from chunk id → Interpretive Pattern id with no schema shape change (see §6).

---

## 1. Why this exists (read before building)

Hearth's enrichment pipeline already retrieves `pedagogy_sources` (deterministic chunk ids like `pedagogySourceExcerpt.cm.001`) and hands them to Haiku as reference material during the single per-save enrichment call (`src/lib/ai/enrich.ts`, `buildUserPrompt` → `buildPedagogyContextWithSources` in `src/lib/ai/pedagogy-context.ts`). Today the model is *told* to ground its `insight_suggestions` in that material, but nothing records **which specific chunks actually shaped its interpretation.** Without that trace:

- There is no per-child evidence of which parts of a tradition's corpus are actually informing Logger insights, so Layer 5 (`lensAccumulatedSignals`, per the architecture doc §8) has no verified data source.
- Any future lens-recommendation loop (Layer 7 tag-match ranker, architecture doc §10) would have nothing honest to rank against for pedagogies that haven't yet had their Interpretive Patterns extracted (all of them, until W1-PP lands).

This spec adds the minimum verifiable trace — model-reported chunk citations, filtered against ground truth — and aggregates it at snapshot-rebuild time into a new optional `lensSignals` block on `ChildSnapshot`. It does not implement Interpretive Pattern classification. It does not add a new LLM call. It rides the existing single Haiku call per Logger save (the UC5 invariant — see §2).

---

## 2. Enrichment output addition — `pedagogy_references_used`

### 2.1 Type change

**File:** `src/types/enrichment.ts`

Add one new optional field to `AiEnrichmentBody`, directly beside the existing `pedagogy_sources?: PedagogySource[]` field:

```typescript
export type AiEnrichmentBody = {
  // ... existing fields unchanged ...
  pedagogy_sources?: PedagogySource[];
  // C-PL6 (interim): the subset of this entry's pedagogy_sources chunk ids
  // (e.g. "pedagogySourceExcerpt.cm.001") the model reports actually informed
  // its interpretation this save. Populated only when pedagogy_sources is
  // non-empty for this entry; absent otherwise. Post-validation invariant:
  // every id in this array is guaranteed present in this entry's own
  // pedagogy_sources (see §2.3) — the model cannot cite a chunk it was not
  // given.
  pedagogy_references_used?: string[];
  profile_nudge?: ProfileNudge | null;
  // ...
};
```

Mirror the same field addition on `EnrichmentResult` in `src/lib/ai/enrich.ts` (the pre-validation raw-model type), placed next to the existing `pedagogy_sources?: PedagogySource[];` line (currently line 148).

### 2.2 Haiku prompt / JSON schema change

**File:** `src/lib/ai/enrich.ts`, `SYSTEM_PROMPT` (currently lines 51–120).

Add exactly **one** new key to the `OUTPUT SCHEMA` block, placed after `"journey_observation"` and before `"discrete_learning_objectives"`:

```
  "pedagogy_references_used": ["string"],
```

Add exactly **one** new line to the `RULES` list (placed after the existing `insight_suggestions` rule, since the two are related):

```
- pedagogy_references_used: When pedagogy reference material was provided above, list the id attribute(s) of the specific <reference> block(s) (e.g. "pedagogySourceExcerpt.cm.001") that actually informed your insight_suggestions or interpretation this save. Only cite ids that appear in the reference material actually shown to you above. Return [] when no pedagogy reference material was provided, or when none of it specifically shaped this entry's interpretation.
```

The prompt must not ask the model to invent free-form pattern names — see §2.4 for why.

### 2.3 Validation rule (hallucination guard)

**File:** `src/lib/ai/enrich.ts`, `validateEnrichment()` (currently lines 466–515).

The model can hallucinate ids (wrong id, id from a different pedagogy, or an id that was never retrieved at all). Cross-check against the *ground truth* for this call — the same `pedagogySources` array that was actually assembled and sent to the model (available in the enclosing `enrichEntry()` scope as the `pedagogySources` returned from `buildUserPrompt`, currently bound at line 539).

`validateEnrichment`'s current signature is `validateEnrichment(raw: EnrichmentResult, childNames: string[])`. It does not have access to `pedagogySources` today (that filtering currently happens *after* validation, at the `pedagogy_sources` attachment site — lines 597–600). Two implementation options; pick whichever keeps the function's existing contract cleanest at build time:

- **Option A (preferred):** Extend `validateEnrichment`'s signature to accept the resolved `pedagogySources: PedagogySource[]` for this call, and filter `raw.pedagogy_references_used` against `new Set(pedagogySources.map(s => s.id))` inside the function, symmetrically with how `pedagogy_sources` itself gets attached today.
- **Option B:** Keep `validateEnrichment` untouched and add the filter step inline at the existing attachment site (lines 597–600 in `enrichEntry`, and the equivalent block at lines 812–822 in `sonnetFallback`), right where `validated.pedagogy_sources = pedagogySources;` already happens.

Either way, the rule is:

```typescript
// Hallucination guard: the model can only cite chunks it was actually shown.
const validIds = new Set(pedagogySources.map((s) => s.id));
const referencesUsed = (raw.pedagogy_references_used ?? []).filter((id) => validIds.has(id));
if (pedagogySources.length > 0 && referencesUsed.length > 0) {
  validated.pedagogy_references_used = referencesUsed;
}
// else: field is omitted entirely (undefined), never an empty array on the
// stored row, matching the existing convention for pedagogy_sources (only
// attached "if (pedagogySources.length > 0)").
```

Explicit rules:
- **When `pedagogy_sources` is absent or empty for this entry** (retrieval fell back, `PEDAGOGY_KB_ENABLED` was off, or budget filtering dropped every chunk — see `buildPedagogyContextWithSources` in `src/lib/ai/pedagogy-context.ts`), `pedagogy_references_used` is **never written**, regardless of what the model returned. There is nothing to verify a citation against, so any model output here is definitionally unverifiable and must be discarded.
- **When `pedagogy_sources` is present but the model returns `[]` or omits the field**, `pedagogy_references_used` is also omitted (not written as `[]`) — this matches the existing `work_sample`/`journey_observation` convention of "absent means no signal," not "empty array means confirmed zero."
- Apply the same filter in `sonnetFallback()` (currently lines 786–826): the Sonnet retry re-runs the same prompt against the same `pedagogySources`, so it validates identically. Do **not** carry over `pedagogy_references_used` from a prior Haiku pass the way `pedagogy_sources` and `profile_nudge` are preserved (lines 812–826) — the Sonnet pass produces its own fresh citation, since it's re-interpreting the same entry text and reference material from scratch.

### 2.4 Rejected alternative: `interpretive_patterns_fired` (free text)

**Explicitly rejected.** An earlier framing considered having the model report free-text pattern labels directly (e.g. `"interpretive_patterns_fired": ["child showed sustained interest in nature", "self-directed narration"]`). This is rejected for this spec because:

1. **Unverifiable.** A free-text string has no ground truth to filter against — there is no hallucination guard possible, unlike the chunk-id approach in §2.3, where every returned id can be checked against the exact `pedagogySources` array assembled for that call.
2. **Unstable aggregation key.** Free text can't be reliably grouped across entries (paraphrase drift means the same underlying pattern gets a different string each save), which would make `patternCounts` (§3) meaningless as a count.
3. **Duplicates future work.** Naming actual Interpretive Patterns is the explicit job of the W1-PP corpus audit (architecture doc §16, "CM corpus audit against new Interpretive Patterns frame" — "at least one existing Practice Pattern (PP-CM-006) likely crosses the prescriptive line"). Inventing an ad hoc free-text taxonomy in the enrichment prompt now would pre-empt that audit's actual output and create a migration burden once real Interpretive Pattern IDs land.

The chunk-id citation approach in §2.1–§2.3 sidesteps all three: ids are deterministic (assigned in Sanity, e.g. `pedagogySourceExcerpt.cm.001` per `docs/hearth-pedagogy-corpus-charlotte-mason-v1.md`), verifiable against the exact retrieval set for that call, and stable as an aggregation key regardless of what the W1-PP audit eventually names things.

### 2.5 UC5 invariant — no new LLM call

This entire addition is **one new field on the existing Haiku JSON output schema**, read from the **same** `client.messages.create()` call already made in `enrichEntry()` (`src/lib/ai/enrich.ts`, `callLLM()`, currently lines 550–587) and its `sonnetFallback()` counterpart. No new API call, no new retrieval step, no second pass. This preserves the two-layer AI rule (`CLAUDE.md` Architecture Principle 4: "Expensive LLM at write-time only... no runtime LLM calls") and the specific invariant already documented at `docs/hearth-pedagogy-system-architecture-v1.md` §8 ("one Haiku call per Logger save, all read-time surfaces read from snapshots, no new LLM calls anywhere downstream").

---

## 3. FIS aggregation — `lensSignals` on `ChildSnapshot`

### 3.1 Type addition

**File:** `src/types/snapshot.ts`

Add a new optional block to the `ChildSnapshot` interface (currently lines 71–99), alongside the existing optional `dlo_status?:` field:

```typescript
export interface ChildSnapshot {
  // ... existing fields unchanged ...
  dlo_status?: Record<string, DloStatusEntry>;
  // C-PL6 (interim). Absent when the child has no entries in the rebuild
  // window carrying pedagogy_references_used — readers must treat absence as
  // "no signal yet," never "no engagement." See
  // docs/pkb-c-pl6-lens-signals-spec.md for the full contract.
  lensSignals?: LensSignals;
}

export interface LensSignals {
  // Key: "<pedagogy_key>:<layer>" (e.g. "charlotte_mason:source_excerpt"),
  // derived by joining each cited chunk id against its PedagogySource entry
  // for that same call — see §3.3 for the exact join. Value: number of
  // citations across all entries in the rebuild window.
  patternCounts: Record<string, number>;
  // Key: the raw chunk id (e.g. "pedagogySourceExcerpt.cm.001"). Value: times
  // that exact chunk was cited across the rebuild window.
  referenceCounts: Record<string, number>;
  // Capability thread codes (e.g. "S1", "L3") most frequently evidenced by
  // entries that also carried a pedagogy citation, most-cited first. Same
  // source data as active_threads / entryThreadIds, filtered to the subset of
  // entries with a non-empty pedagogy_references_used. Capped — see §3.4.
  topThreads: string[];
  // Key: a subject string from subjects_detected (e.g. "Science"). Value:
  // count across entries in the rebuild window that also carried a pedagogy
  // citation. NOT the same as recent_activity.subjects_this_week (that's
  // unfiltered by pedagogy citation; this is the pedagogy-linked subset).
  activityShapes: Record<string, number>;
}
```

Export `LensSignals` from `src/types/snapshot.ts` so `snapshot-rebuild.ts` and any future reader can import the type directly rather than inlining an anonymous shape.

### 3.2 Where it's computed in the rebuild loop

**File:** `src/lib/ai/snapshot-rebuild.ts`, inside the existing per-child loop `for (const child of familyLearners) { ... }` (currently starting at line 437).

That loop already does the equivalent scan for other purposes:
- `childEntries = allEntries.filter((e) => e.learnerIds?.includes(child.id))` (line 438) — reuse this same filtered list, do not re-query.
- The loop already reads `entry.aiEnrichment as EnrichmentResult` for `curriculum_descriptors` (lines 473–478, and again 512–519 for `descriptorsBySubject`) — follow the same pattern: cast once per entry, read the new field.
- The loop already computes `entryThreadIds(entry)` per entry for thread aggregation (line 451) — reuse this for `topThreads` rather than re-deriving thread ids a third way.

Add a new accumulation block inside the same `for (const entry of childEntries)` pass that already reads `curriculum_descriptors` (the block starting at line 512), so the rebuild does not add a second full scan over `childEntries`:

```typescript
const patternCounts: Record<string, number> = {};
const referenceCounts: Record<string, number> = {};
const threadCiteCounts: Record<string, number> = {};
const activityShapeCounts: Record<string, number> = {};

for (const entry of childEntries) {
  const enrichment = entry.aiEnrichment as EnrichmentResult | null;
  if (!enrichment) continue;

  const referencesUsed = enrichment.pedagogy_references_used ?? [];
  if (referencesUsed.length === 0) continue; // no citation this entry — contributes nothing

  const sourcesById = new Map(
    (enrichment.pedagogy_sources ?? []).map((s) => [s.id, s]),
  );

  for (const refId of referencesUsed) {
    referenceCounts[refId] = (referenceCounts[refId] ?? 0) + 1;

    const source = sourcesById.get(refId);
    if (source) {
      const key = `${source.pedagogyKey}:${source.layer}`;
      patternCounts[key] = (patternCounts[key] ?? 0) + 1;
    }
    // If source is missing (shouldn't happen post-validation per §2.3, but
    // the rebuild reads persisted rows written by any historical enrichment
    // version), still count the raw reference; just skip the patternCounts key.
  }

  // topThreads: only from entries that carried a citation (see §3.1 note).
  for (const { threadId } of entryThreadIds(entry)) {
    if (isSuppressedThread(threadId)) continue;
    threadCiteCounts[threadId] = (threadCiteCounts[threadId] ?? 0) + 1;
  }

  // activityShapes: subjects_detected from entries that carried a citation.
  for (const subj of enrichment.subjects_detected ?? []) {
    activityShapeCounts[subj] = (activityShapeCounts[subj] ?? 0) + 1;
  }
}

const topThreads = Object.entries(threadCiteCounts)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10) // cap consistent with MAX_CANDIDATE_THREADS in enrich.ts
  .map(([threadId]) => threadId);

const lensSignals: LensSignals | undefined =
  Object.keys(referenceCounts).length > 0
    ? { patternCounts, referenceCounts, topThreads, activityShapes: activityShapeCounts }
    : undefined;
```

Then attach it in the existing `childSnapshots[child.id] = { ... }` object literal (currently lines 765–783), immediately after the existing `dlo_status:` line:

```typescript
      childSnapshots[child.id] = {
        // ... all existing fields unchanged ...
        dlo_status: omitSuppressedKeys(dloStatusByLearner[child.id] ?? {}),
        lensSignals, // undefined when the child had zero citations this window — key is present but value is undefined, which JSON.stringify drops; equivalent to omitting the key entirely on the persisted JSONB row.
      };
```

### 3.3 The references→sources join, precisely

`pedagogy_references_used` (§2) is an array of chunk ids (strings). `pedagogy_sources` (existing field) is an array of `PedagogySource` objects (`{ id, layer, pedagogyKey, metadata }`, defined in `src/lib/ai/pedagogy-context.ts`) — the full retrieval record for that same enrichment call. Both fields live on the *same* `entry.aiEnrichment` row, written by the *same* enrichment call, so the join is always local to one entry — never a cross-entry or cross-table lookup:

```
for each entry:
  sourcesById = Map(entry.aiEnrichment.pedagogy_sources by .id)
  for each refId in entry.aiEnrichment.pedagogy_references_used:
    source = sourcesById.get(refId)
    patternCounts_key = `${source.pedagogyKey}:${source.layer}`
```

`pedagogyKey` is the family's pedagogy framework string (e.g. `"charlotte_mason"`) and `layer` is the PKB corpus layer the chunk belongs to (e.g. `"source_excerpt"` for a `pedagogySourceExcerpt` chunk — see the `SANITY_TYPE_TO_LAYER`-style mapping in `src/lib/pedagogy/chunk-builder.ts` line 34, `pedagogySourceExcerpt: 'source_excerpt'`). This gives `patternCounts` keys like `"charlotte_mason:source_excerpt"` today — coarser than a per-Interpretive-Pattern count, but real and verifiable now. See §6 for the re-keying path once W1-PP lands.

### 3.4 Windowing note for this section specifically

`snapshot-rebuild.ts` today has two rebuild paths: a full rebuild (scans `allEntries` for the child, no time window beyond what `allEntries` itself was queried for) and `rebuildLibraryRecommendationsOnly` (currently lines 221–, which reuses `priorChildren` instead of recomputing per-child sections). `lensSignals` is a per-child section like `active_threads` or `curriculum_coverage`, so it is only recomputed on a **full rebuild** — `rebuildLibraryRecommendationsOnly` should carry forward the prior `lensSignals` unchanged (same treatment as the other per-child fields it already preserves via `priorChildren`), not recompute or drop it. This mirrors the existing `library_change` trigger behavior for other per-child blocks (see memory note `project_snapshot_incremental_library_change` — `library_change` reuses prior per-child data and skips the per-child LLM-adjacent loop).

The `topThreads` cap of 10 matches `MAX_CANDIDATE_THREADS` in `src/lib/ai/enrich.ts` (line 49) for consistency, but the two are unrelated budgets (one gates descriptor-injection prompt size, the other caps a snapshot display list) — do not import one constant into the other's module; duplicate the literal `10` with a comment cross-referencing this spec, the same way the codebase already duplicates the `4096` max_tokens rationale across `enrichEntry` and `sonnetFallback` rather than sharing a constant.

---

## 4. Backward compatibility

- `pedagogy_references_used` on `AiEnrichmentBody` is optional. Entries enriched before this ships have no such field; `undefined` is the correct read, not `[]`.
- `lensSignals` on `ChildSnapshot` is optional. Snapshots rebuilt before this ships, or families where no entry in the rebuild window carried a citation, have no such field.
- **No SQL migration.** Both `ai_enrichment` (on `learning_entries`) and `snapshot_data` (on `family_intelligence_snapshots`) are existing JSONB columns; this only changes what keys the application chooses to read and write within them, exactly like every other optional field added to these two JSONB blobs to date (`work_sample`, `milestone_flag`, `dlo_status`, `pedagogy_sources` itself).
- Readers (any future UI or Layer 7 ranker) must treat **absence** of `lensSignals`, or absence of a specific key within it, as **"no signal recorded,"** never as **"confirmed zero engagement."** A family whose entries never triggered a pedagogy citation (e.g. `PEDAGOGY_KB_ENABLED` was off, or the family is Eclectic with thin corpus coverage) looks identical, in this data, to a family that simply hasn't had a rebuild since this shipped. Do not build any UI that renders an explicit "0 signals" state from this field's absence — render nothing, the same convention `dlo_status` already established ("Absent before any DLO links exist for the learner... readers must default to 'not-started' when the entry is missing").
- Old rows enriched before this ships simply have no `pedagogy_references_used` key at all — not `null`, not `[]`. The rebuild loop's `enrichment.pedagogy_references_used ?? []` guard (§3.2) already treats a missing key as the empty-contribution case, so no separate migration or backfill pass is needed; `lensSignals` accumulates from the next Logger save onward, per family, exactly as `hearth-lens-loop-implementation-plan-v1.md` already specified for the fuller version of this field ("Migration: ... backfill not needed — signals accumulate from the next Logger save onward").

---

## 5. Open questions (not resolved by this spec — do not resolve at build time either; flag to Drew if the build PR needs a call on these)

- **Windowing:** should `patternCounts` / `referenceCounts` be a running cumulative total across the family's entire history, or scoped to the current rebuild's entry window (however that window is currently bounded elsewhere in `snapshot-rebuild.ts`)? This spec's §3.2 pseudocode scans `childEntries` as given to the per-child loop — it inherits whatever window that already is, without taking a position on whether that window is correct for this purpose.
- **Decay:** should `referenceCounts` (or `patternCounts`) decay older citations over time, the way `hearth-lens-loop-implementation-plan-v1.md` flags decay as a deferred concern for the fuller Interpretive-Pattern version of Layer 5? Not addressed here.
- **Eclectic cross-tradition counts:** an Eclectic family's `patternCounts` could in principle mix keys across multiple `pedagogyKey` prefixes if retrieval ever draws from more than one tradition's corpus per entry (today's retrieval takes a single `framework` per call, per `PedagogyContextOpts.framework` in `src/lib/ai/pedagogy-context.ts`, so this shouldn't currently happen — but the type shape does not prevent it). How a future lens-recommendation loop (Layer 7) should read a multi-tradition signal set for an Eclectic family is unresolved.

---

## 6. Build sequencing note

**Do not build this speculatively.** The build PR for this spec is gated on **both**:

1. **The W1-PP CM interpretive-patterns audit memo landing** (architecture doc §16, "CM corpus audit against new Interpretive Patterns frame" — flagged there as likely to reduce/reframe at least one existing pattern, e.g. `PP-CM-006`, for crossing the prescriptive line). This spec's `patternCounts` keying (`pedagogyKey:layer`, §3.3) is deliberately coarser than the full Interpretive-Pattern keying in `hearth-lens-loop-implementation-plan-v1.md` specifically so it does not need to wait on that audit to *ship* — but Drew should confirm after reading the audit memo that shipping the coarser interim version first (rather than waiting for Wave 1 IDs and building the fuller version directly) is still the right sequencing call, since it means a re-keying pass later (chunk id → Interpretive Pattern id, once each `pedagogySourceExcerpt` is tagged with the Interpretive Pattern it instantiates) rather than a single build.
2. **Drew's read of this spec.** This is a design doc, not an approved backlog item — flag any disagreement with the rejected-alternative call in §2.4 or the join semantics in §3.3 before implementation starts.

This task (E9) is spec-only: zero code changes accompany this document.
