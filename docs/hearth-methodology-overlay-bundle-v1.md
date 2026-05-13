<!-- Version: 1 | Date: 2026-05-09 | Changes: Initial spec. Defines Methodology Overlay Bundle as sibling to Pedagogy Lens Bundle — content-time-baked per-practice artefacts that overlay methodology guidance on Module Experience surfaces. Resolves the architectural distinction between pedagogy (interpretive lens, content-time) and methodology (practical operations, also content-time, was incorrectly proposed as runtime in earlier discussion). Establishes shared corpus retrieval, honest-density principle, and parallel storage shape. -->

# Hearth Methodology Overlay Bundle — Specification

> **Status:** Canonical. Sibling spec to `hearth-pedagogy-lens-bundle-v1.md`. Establishes the methodology layer as a content-time-baked artefact set parallel to but distinct from the pedagogy layer.
> **Related:** `hearth-pedagogy-lens-bundle-v1.md` (parallel structure, shared infrastructure), `hearth-pedagogy-engine-spec-v1.md` (twelve practices defined here are inputs), `hearth-module-builder-pathways-architecture-v2.md` (Kindler save flow extended), `Hearth_AI_Intelligence_Layer_Architecture.md` (two-layer AI rule respected), `hearth-pack-data-architecture-v1.md` (Sanity schema additions), `hearth-pedagogy-knowledge-base-architecture-v1.md` (corpus consumed via practice-relevance filtering).
> **Priority:** HIGH — paired build with Pedagogy Lens Bundle. Both must ship together for the Kindler v6 release and the next Module Experience iteration.

---

## 1. Purpose

The Pedagogy Lens Bundle spec resolved how a family's *philosophical* commitment shapes module surfaces. It does not address the *practical operations* a family selects — the up-to-five practices from the Pedagogy Engine wizard such as narration, copywork, nature journaling, hands-on materials, and short lessons.

These practices are not philosophical commitments; they are technique choices that flex across pedagogies. A Charlotte Mason family and a Classical family both might select narration. A Montessori family and a Waldorf family both might select hands-on materials. The same module needs to render different methodology guidance for these families, even when their pedagogy bundles are computed from the same underlying corpora.

An earlier architectural sketch placed methodology overlays at runtime as template interpolation. This violates the two-layer AI rule: the templates would have to be sophisticated enough to do real interpretive work, which moves them out of pure interpolation territory and into something that should be content-time generated. The clean resolution is to treat methodology overlays as a sibling artefact set to pedagogy bundles — generated once at content time, stored on the module, retrieved at runtime as pure database read.

This spec defines that sibling structure.

---

## 2. Distinction from Pedagogy Lens Bundle

| Dimension | Pedagogy Lens Bundle | Methodology Overlay Bundle |
|---|---|---|
| Keyed by | `pedagogyKey` (single anchor) | `practiceKey` (one of twelve, family selects up to five) |
| Family selection | Pick 0–1 (or Eclectic) | Stack up to 5, prioritised |
| Module storage | `module.pedagogyLensBundles[pedagogyKey]` | `module.methodologyOverlays[practiceKey]` |
| Generation scope | Per pedagogy per module | Per practice per module (filtered by affordance) |
| Shape | 5 fields (whyThisMatters, facilitationNote, observationCues, questionOverlay, evidencePriorities) | 4 fields (loggerPromptHint, prepHint, observationCue, evidenceTagBias) |
| Surface focus | Module Experience prep panel, log prompts, planner card | Logger prompt strip, Prep "How you might do this", Constellation thread weighting |
| Corpus retrieval | Pedagogy-keyed RAG over corpus | Same corpora, filtered by practice-relevance tags |
| Update on profile change | Module retains original Bundle (durable) | Module retains original Overlays (durable) |
| Eclectic / null fallback | Generic template content | Silent — no methodology overlay rendered |

The two structures share the Kindler save flow, validation pipeline, banned-phrase check, similarity check, and the durable-by-default versioning rule. They differ in keying, scope, shape, surface mapping, and the silent-fallback behaviour for the methodology side.

User-facing terminology stays as "practices" (warmer, parents recognise it). "Methodology" is reserved for architecture-internal reference.

---

## 3. Methodology Affordance Field

A new field is added to the universal module schema: `methodologyAffordances: string[]`.

This is a list of practice keys that this module *naturally supports*. It is set at module creation by:

- **Curated packs:** explicit content-team authoring per module (e.g., a kitchen-measurement module affords `hands-on`, `short-lessons`, `real-world`; a poetry module affords `narration`, `memory-work`, `copywork`).
- **Parent-built modules (Kindler):** inferred from the universal module schema's structure — pathway type, capability threads, activity descriptions, duration. The Kindler runs an inference pass at save time and writes the result. Parents do not see or edit this field.
- **Agent-produced packs (future):** generated alongside module content, QA-gated.

The honest-density principle is enforced through this field: methodology overlays are only generated for practices in the intersection of `methodologyAffordances` and the generation scope (family-selected for parent-built; all twelve for curated). A module that affords four practices generates four overlays — not twelve, not arbitrary.

This is the cost discipline of the methodology layer. Without `methodologyAffordances`, the Kindler would either generate twelve thin overlays per module (most padded with no real content) or skip overlays entirely (losing the methodology layer). The affordance field gives the Kindler a target list and authorises confident skipping.

The field is capped at six affordances per module. If inference produces more, the Kindler keeps the six most strongly indicated, prioritising practices anchored in the family's selected pedagogy.

---

## 4. Overlay Composition

Each Methodology Overlay is keyed by `(moduleId, practiceKey)` and may contain up to four fields.

| Field | Type | Length | Purpose |
|---|---|---|---|
| `loggerPromptHint` | string | 1 sentence (12–20 words) | Practice-specific prompt that appears in the Logger description prompt strip when the family logs against this module. |
| `prepHint` | string | 2–3 sentences (35–60 words) | Practice-specific guidance in the Module Experience Prep panel under "How you might do this." Sits below the pedagogy `facilitationNote`. |
| `observationCue` | string | 1 sentence (12–20 words) | What this practice trains the parent to notice during the activity. Joins the pedagogy `observationCues` array in Log mode rendering, marked as methodology-sourced. |
| `evidenceTagBias` | string[] | up to 4 capability thread keys | Which threads this practice tends to surface in this module. Weights the Constellation node display for families with this practice selected. |

All four fields are optional at field level. An Overlay with as few as one populated field is valid. An Overlay with zero substantive fields is invalid and forces silent fallback — the runtime simply does not render any methodology surface for that practice on that module.

---

## 5. The Honest Density Principle (Reinforced)

The same principle that governs Pedagogy Lens Bundles governs Methodology Overlays, with one difference: the silent fallback is the default behaviour, not a degraded one. A Methodology Overlay simply not rendering is the cleanest possible outcome when there is no real content.

A bug-observation module affords `nature-journaling` strongly. A `loggerPromptHint` for nature-journaling on this module is genuinely substantive ("Did Emma capture what she noticed in a drawing or a few words?"). A `loggerPromptHint` for `memory-work` on this module is contrived. The Kindler is instructed and authorised to skip the contrived one entirely.

Validation enforces this through the same two checks as Pedagogy Lens Bundles:

1. **Banned-phrase check** rejects fields with commodity AI patterns or generic "this is important because..." framings. Single source of truth across the platform.
2. **Cross-field similarity check** rejects Overlays where every filled field reads as paraphrase of a single retrieved corpus chunk — surface variation without substantive variation.

Three rejections at any check causes the field to be omitted. Three field omissions across an Overlay causes the entire Overlay to be skipped.

---

## 6. Generation Scope by Content Origin

Mirrors the Pedagogy Lens Bundle pattern.

| Origin | Overlay scope per module | Rationale |
|---|---|---|
| Module Builder (parent-built) | Family's selected practices ∩ module's affordances. Up to 5 practices × 1 module = up to 5 Overlays at save time, async. | Matches the parent-built pedagogy bundle scope (family's pedagogy only). |
| Hand-curated packs (Starter Pack v3, Jumpstart Classical) | All 12 practices × per-module affordance filtering. Per-module count ranges roughly 3–6. | Matches the curated pedagogy bundle scope (all six pedagogies). Content-team time available for human review. |
| Agent-produced packs (future) | All 12 practices × per-module affordance filtering. Flagged `methodologyStatus: needs_review` until human-confirmed. | Same QA bar as agent-produced pedagogy bundles. |

Per-pack Overlay token cost is bounded by `methodologyAffordances` filtering. A 12-module curated pack with average 4 affordances per module yields ~48 Overlays per pack.

---

## 7. Kindler Save Flow Extension

The Kindler save handler is extended to generate both Pedagogy Lens Bundles and Methodology Overlays in a single async job. The shape parallels the existing extension:

```
Kindler save click
    ↓
Universal module schema validated and saved to Sanity
    ↓
Methodology affordance inference runs (Kindler internal)
    ↓
Module saved with methodologyAffordances[] populated
    ↓
Module marked lensStatus: 'pending' AND methodologyStatus: 'pending'
    ↓ Save returns; parent navigates away or continues
    ↓
Async job kicks off:
    ├─ Pedagogy Lens Bundle generation (per pedagogy spec)
    └─ Methodology Overlay generation (per this spec)
        ├─ Parent-built: family's selected practices ∩ module affordances
        ├─ Curated: 12 practices ∩ module affordances
        └─ Per practice:
            ├─ Retrieve relevant corpus chunks (RAG over pgvector,
            │   filtered by practice-relevance tags)
            ├─ Construct practice-specific prompt with honest-density
            │   instruction
            ├─ Haiku generation per field
            ├─ Validation: banned-phrase + cross-field similarity + length
            └─ On reject at any check: re-prompt up to twice;
               on third failure, omit field
    ↓
Bundles and Overlays written to module
    ↓
Module marked lensStatus / methodologyStatus: 'ready' or
'partial_needs_review'
    ↓
Family's next view of the module shows their lens AND methodology populated
```

The async job runs both generation paths in parallel where possible. Total job duration for a parent-built module remains in the 5–30 second range, dominated by the slower of the two paths (typically the pedagogy bundle, which has the wider field schema).

The 5-minute rule remains absolute: parent never waits on either generation path. Eclectic / silent fallback covers the gap between save and bundle landing.

---

## 8. Surface Mapping

Adds methodology surfaces to the existing `pedagogyLensSurfaceMap` Sanity singleton, expanded and renamed `lensSurfaceMap`.

| Bundle/Overlay field | Module Experience surface | Render behaviour | Fallback |
|---|---|---|---|
| (Pedagogy) `whyThisMatters` | Prep mode → "Why This Matters" panel | Single prose block, 90–120 words, serif body | Generic Sanity template |
| (Pedagogy) `facilitationNote` | Prep mode → header above activity steps | 2–3 sentence note, italic serif inset | Standard step intro |
| (Pedagogy) `observationCues` | Log mode → prompt list above description | Up to three numbered prompts, sans, label weight | Generic FIS observation prompts |
| (Methodology) `loggerPromptHint` | Logger description prompt strip | Single sans prompt below pedagogy lens copy. Each selected practice contributes one. Capped at 3, ordered by practice priority. | Silent (no row rendered) |
| (Methodology) `prepHint` | Prep mode → "How you might do this" section | Stacked prose blocks, one per practice, ordered by family practice priority. Sits below pedagogy `facilitationNote`. | Silent (section hidden if empty) |
| (Methodology) `observationCue` | Log mode → prompt list above description | Joins pedagogy `observationCues` in same list, distinguished by source pill. Combined cap at 5. | Silent (no row added) |
| (Pedagogy) `questionOverlay` | Prep panel → "What to notice next" + Planner card expansion | Per-grammar render | Eclectic equivalent |
| (Pedagogy) `evidencePriorities` | Constellation node detail → highlight when filtered to module | 5 capability threads visually weighted | Neutral display |
| (Methodology) `evidenceTagBias` | Constellation node detail → blend with pedagogy `evidencePriorities` weights | Per-thread bias score added to weighted display | No bias contribution |

Where pedagogy and methodology contribute to the same surface (Log mode observation cues, Constellation thread weighting), the runtime composes both. Pedagogy contribution is always present (or its eclectic fallback). Methodology contribution stacks on top, ordered by the family's practice priority.

---

## 9. Retrieval — Shared Corpus, Practice-Relevance Filtering

Methodology Overlays do not require separate corpora. They retrieve from the same pedagogy corpora used by Pedagogy Lens Bundles, with retrieval filtered by practice-relevance tags.

Practices anchor in pedagogies historically:

| Practice | Anchor pedagogies |
|---|---|
| `narration` | Charlotte Mason, Classical |
| `copywork` | Charlotte Mason, Classical |
| `nature-journaling` | Charlotte Mason, Waldorf |
| `short-lessons` | Charlotte Mason |
| `memory-work` | Classical, Charlotte Mason |
| `hands-on` | Montessori, Waldorf |
| `rhythm` | Waldorf, Charlotte Mason |
| `extended-projects` | Waldorf |
| `living-books` | Charlotte Mason, Classical |
| `documentation` | (none — captured platform-side) |
| `free-play` | Unschooling, Waldorf |
| `movement` | Waldorf, Montessori |

The retrieval surface for a given practice is the union of source excerpts from its anchor pedagogies, filtered further by the corpus's `themes:` and `situationalRelevance:` tags. Retrieval is `pgvector` cosine similarity against an embedded version of the module's title, summary, and capability threads, restricted to the practice-anchored corpus subset.

This means corpus depth investment compounds across both pedagogy and methodology layers. Deepening the CM corpus directly improves narration, copywork, living-books, short-lessons, memory-work, nature-journaling, and rhythm overlay quality across all modules where those practices are afforded — regardless of family pedagogy selection.

The pedagogy corpus tagging schema needs richer `themes:` coverage to support reliable practice-keyed retrieval. The CM corpus already tags themes like `narration`, `nature_study`, `firsthand_knowledge`, `habit`. The other corpora need parallel tagging as they come online. This is a corpus-team operation, not an architecture change.

For the `documentation` practice, no corpus anchor exists. The Overlay generation for this practice falls back to a Sanity-stored practice template rather than RAG-grounded generation. This is the only practice that does not benefit from corpus depth.

---

## 10. Versioning and Corpus Updates

Same rule as Pedagogy Lens Bundles: **no remake mechanism in the Kindler.** When practices are added to a family profile after a module exists, that module's Overlay set does not retroactively expand. When the corpus is updated with new excerpts, existing Overlays are not regenerated.

Rationale is identical: durable interpretations of specific modules; predictable parent-facing content; corpus updates are append-mostly.

The implication for families: a parent who adds `narration` to their practices a month after creating a module continues to see that module without a narration overlay. New modules created from that point on will include narration overlays where afforded. This is consistent with the durable-content philosophy and avoids silent regeneration churn.

---

## 11. Cost Analysis

| Origin | Overlay generations per module | Token estimate per Overlay | Per-module cost |
|---|---|---|---|
| Parent-built (save) | 1–5 (family practices ∩ affordances) | ~1.5–2K tokens (RAG context + 4-field output) | ~3–10K tokens |
| Hand-curated (per module, all 12 practices ∩ affordances) | typically 3–6 | ~1.5–2K each | ~6–12K tokens |
| Agent-produced (future) | typically 3–6 | ~1.5–2K each | ~6–12K tokens |

Combined with Pedagogy Lens Bundle generation, a parent-built module save triggers approximately 6–13K tokens of async generation total (~3K bundle + ~3–10K overlays). A curated module triggers approximately 21–37K tokens (~15K bundles for 6 pedagogies + ~6–12K overlays for affordant practices).

All costs are content-time and one-time per module per practice. Runtime cost remains zero. The honest-density principle creates real cost savings: practices skipped for non-affordance are not generated, not just not displayed.

---

## 12. Validation and QA

Each generated Overlay field passes through:

1. **Banned-phrase check** — shared singleton with Pedagogy Lens Bundle, Logger reflection prompts, and existing UC6 question overlays.
2. **Cross-field similarity check** — per-Overlay, embedding-based.
3. **Length check** — per field, per Section 4.
4. **Source attribution check** — `corpusChunkIds[]` provenance for admin traceability.

Three rejections cause field omission. The Overlay still ships partial. Three field omissions cause Overlay omission entirely (silent fallback).

For agent-produced packs, any field omission triggers `methodologyStatus: needs_review` regardless of cause.

For curated packs, every Overlay is human-reviewed before publish. No automated `needs_review` flag.

For parent-built modules, partial Overlays are valid and shipped silently. The parent never sees the status flag.

---

## 13. What This Spec Does Not Address

- **Methodology overlay editing by parents.** Out of scope. Overlays are generated, not authored. If a parent disagrees with an overlay, they can deselect the practice from their profile (no effect on existing overlays — silent rendering only on new modules) or ignore the surface.

- **Methodology-specific corpora.** The architecture explicitly avoids per-practice corpora to keep the corpus investment focused on pedagogies. If a future practice cannot be served well from any pedagogy corpus, that's a signal the practice belongs to a missing pedagogy, not that it needs its own corpus.

- **Multi-practice composition logic on shared surfaces.** A family with five selected practices on a module affording all five contributes five `loggerPromptHints` to the Logger strip. The runtime currently shows up to three, ordered by family practice priority, with overflow truncated. Refinement of this UX (collapse, rotation, etc.) deferred to next Logger iteration.

- **Practice deprecation.** If a practice is removed from the platform, what happens to existing overlays keyed to that practice? Out of scope for v1; treated as a future migration question.

- **Overlay generation for projects.** The parallel content type to modules. Same gap noted in the Pedagogy Lens Bundle spec; same separate-spec-needed flag.

- **Logger entries with no module_id.** Free-form Logger entries do not consume methodology overlays. Methodology is module-bound by design — without a module, there are no affordances to intersect against.

---

## 14. Open Items Resolved by This Spec

| Open question | Resolution |
|---|---|
| Where does methodology live in the two-layer AI architecture? | Content-time generation, like pedagogy. Runtime is pure read. |
| Do methodology overlays need separate corpora? | No. Practice-relevance filtering on existing pedagogy corpora. |
| What is the unit of generation? | Per `(moduleId, practiceKey)`. Stored on the module document. |
| Honest density at the methodology layer? | Yes, harder than at pedagogy. Silent fallback is the default for non-affordant practices. |
| User-facing terminology? | "Practices" remains in user-facing copy. "Methodology" is architecture-internal. |
| Affordance authoring for parent-built modules? | Inferred by Kindler at save time. Parents do not see or edit. |
| Affordance authoring for curated packs? | Explicit content-team authoring. Inference is bypassed. |

---

## 15. Cross-References

| File | Role |
|---|---|
| `hearth-pedagogy-lens-bundle-v1.md` | Sibling spec; shares infrastructure; mirror structure for cross-reading. |
| `hearth-pedagogy-engine-spec-v1.md` | Defines the twelve practices that this spec consumes as `practiceKey` values. |
| `hearth-pedagogy-knowledge-base-architecture-v1.md` | Source corpora consumed via practice-relevance filtering. |
| `hearth-module-builder-pathways-architecture-v2.md` | Kindler save flow extended in parallel with pedagogy extension. |
| `hearth-pack-data-architecture-v1.md` | Sanity schema where `methodologyAffordances` and `methodologyOverlays` are added to the module document. |
| `Hearth_AI_Intelligence_Layer_Architecture.md` | Two-layer AI rule preserved. |
| `hearth-decisions-log-v1.md` | Log this spec's resolutions in the decisions log. |
| `hearth-kindler-methodology-integration-brief-v1.md` | Kindler workstream brief referencing this spec. |
| `hearth-runtime-methodology-integration-brief-v1.md` | Hearth runtime workstream brief referencing this spec. |

---

## 16. COMPONENT_REGISTRY.md Update

Add new spec entry:

| # | Component | Active spec | Status | Notes |
|---|---|---|---|---|
| — | Methodology Overlay Bundle | hearth-methodology-overlay-bundle-v1.md | Canonical spec | Sibling to Pedagogy Lens Bundle. Defines content-time-baked methodology overlays consumed by Logger, Module Experience, and Constellation. |

The Module Builder row should reference this spec alongside `hearth-module-builder-pathways-architecture-v2.md` and `hearth-pedagogy-lens-bundle-v1.md` once the Kindler v6 build incorporates Overlay generation.

---

*This spec captures the Methodology Overlay Bundle architecture as of 9 May 2026, resolving the architectural distinction between pedagogy (interpretive, content-time) and methodology (operational, also content-time). It locks the Overlay composition (four fields with honest-density variability), generation scope (origin-dependent, affordance-filtered), save flow (async with silent fallback), corpus retrieval (shared with pedagogy via practice-relevance tags), and surface mapping (Section 8 table). The spec is paired with `hearth-pedagogy-lens-bundle-v1.md` for joint Kindler v6 implementation and corresponding Hearth runtime updates.*
