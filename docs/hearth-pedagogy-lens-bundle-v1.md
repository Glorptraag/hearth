<!-- Version: 1 | Date: 2026-05-07 | Changes: Initial spec. Defines the Pedagogy Lens Bundle as a content-time artefact set baked by the Kindler during module save. Extends UC6 Surface A from a single-artefact (questionOverlay) treatment to a five-field bundle with honest-density variability. Resolves UC6 open decisions on overlay grain (module-level for parent-built, activity-level for hand-curated) and async vs sync generation (async). -->

# Hearth Pedagogy Lens Bundle — Specification

> **Status:** Canonical. Extends `hearth-pedagogy-knowledge-base-architecture-v1.md` and supersedes the single-artefact treatment of pedagogy overlays in `hearth-alpha-use-case-verification-v1.md` UC6 Surface A.
> **Related:** `hearth-module-builder-pathways-architecture-v2.md` (Kindler save flow), `Hearth_AI_Intelligence_Layer_Architecture.md` (two-layer AI rule), `hearth-pedagogy-engine-spec-v1.md` (family pedagogy profile), `hearth-pack-data-architecture-v1.md` (Sanity schema).
> **Priority:** HIGH — blocks Kindler v6 build and the next iteration of Module Experience pedagogy surfaces.

---

## 1. Purpose

Hearth's pedagogy treatment currently rests on three pillars: vocabulary-swap templates keyed by `pedagogy_key`, a single content-time `pedagogyQuestionOverlay` per module, and a knowledge-base RAG layer that grounds AI generation in real source material. This is enough to make the *dashboard* feel pedagogically distinctive, but not the *module surface* itself.

A parent reading a kitchen-measurement module today sees Charlotte Mason vocabulary in their dashboard greeting and a CM-grammar narration prompt in the Prep panel. They do not see a CM-grounded interpretation of why measuring flour is, specifically, a habit-of-attention exercise — because that interpretation only exists as generic Sanity template fragments not tied to this module.

The Pedagogy Lens Bundle extends content-time generation from one artefact to a small structured set, so that every surface a parent reads inside a module experience can be module-specific and tradition-grounded — without burning runtime tokens.

---

## 2. Bundle Composition

Each Bundle is keyed by `(moduleId, pedagogyKey)` and may contain up to five fields. Critically, **not every Bundle contains every field** — see Section 3 on honest density.

| Field | Type | Length | Purpose |
|---|---|---|---|
| `whyThisMatters` | string | 90–120 words | Module-specific framing of why this learning matters in this tradition. Replaces the generic template "Why This Matters" panel for families on this pedagogy. |
| `facilitationNote` | string | 2–3 sentences | What the parent in this tradition actually does during this activity — restraint, prompt timing, role definition. Drawn from Facilitation Vocabulary corpus. |
| `observationCues` | string[] | up to 3 items, 1 sentence each | What this tradition's eye picks out in this activity. Drawn from Observational Markers, filtered by the module's capability threads. |
| `questionOverlay` | object (grammar-shaped) | varies by grammar | The UC6 Surface A artefact, now folded into the Bundle as one field rather than a standalone block. Per-pedagogy grammars are unchanged. |
| `evidencePriorities` | object[] | up to 5 items | Which of the module's capability threads this tradition reads as carrying the most weight, with one-line per-thread interpretation. Surfaces in Constellation node detail when filtered to module. |

All five fields are optional at the field level. A Bundle is valid with as few as one populated field. A Bundle with zero fields is invalid and forces the runtime to fall back to Eclectic for that pedagogy on that module.

---

## 3. The Honest Density Principle

This is the editorial core of the Bundle and the reason it can't be a uniform schema-required structure.

Pedagogies have legitimate strengths and weaker overlaps with different module types. Charlotte Mason has a great deal to say about a backyard bug hunt — nature study sits at the heart of the tradition. Classical has comparatively little to say about an unstructured outdoor observation activity, because the tradition's distinctive grammar is structured-recitation and ordered-questioning, not free naturalism. Forcing Classical to fill all five Bundle fields for a bug hunt produces exactly the vagueness this work is trying to eliminate — thin generic content padded to fit a schema.

The Kindler's generation logic is therefore permitted, and instructed, to skip fields where the tradition has no distinctive view. The generation prompt makes clear that producing fewer fields with genuine substance is preferable to producing more fields with thin generic substance. Validation enforces this with two complementary checks:

The first check rejects Bundles where filled fields fail the banned-phrase test (commodity AI patterns, generic "this is important because..." framings) — the existing UC6 Surface A guard, applied to every Bundle field rather than just the question overlay.

The second check rejects Bundles where every filled field reads as paraphrase of the same underlying corpus chunk — surface variation without substantive variation. Embedding similarity across fields within a Bundle must stay below a threshold; otherwise the Kindler is producing the same thought five times in different wording.

The Kindler also has latitude to adjust each field's tone, structure, and length within the spec ranges so that the same artefact type does not feel mechanical across many modules. A `facilitationNote` for a contemplative Waldorf module might be a single quiet sentence; the same field type for a busy Montessori practical-life module might be three crisp directives. The schema sets bounds; the Kindler exercises judgement within them.

The runtime gracefully handles partial Bundles. If a CM family on a kitchen-measurement module has all five fields populated but a Classical family has only `whyThisMatters` and `evidencePriorities`, both experiences are valid. The Classical family sees their two custom artefacts and Eclectic fallback for the three unpopulated surfaces. No "your tradition doesn't have a view on this" messaging — silent fallback per field, mixed sourcing within a single module experience.

---

## 4. Generation Scope by Content Origin

Resolves UC6 Surface A open decision on overlay grain.

| Origin | Bundle scope per module | Rationale |
|---|---|---|
| Module Builder (parent-built) | Family's own pedagogy only at save time. Other five generated lazily on marketplace publish if/when the parent shares the module. | Parent-built modules are typically consumed by one family. Generating six pedagogies speculatively burns tokens for unread content. The "before and after" feel — module saved with Eclectic fallback, family's pedagogy bundle landing within ~30 seconds — is a deliberate product moment. |
| Hand-curated packs (Starter Pack v3, Jumpstart Classical) | All six pedagogies × per-activity granularity. | Curated content is consumed by every family. Activity-level granularity gives the richness these flagship packs are meant to demonstrate. Content team time is available for human review. |
| Agent-produced packs (future) | All six pedagogies × per-module granularity. Flagged `lensStatus: needs_review` until human-confirmed. | Compromise between richness and reviewability. Agent output is QA-gated regardless. |

---

## 5. Kindler Save Flow Extension

The Kindler's save handler is unchanged in shape. The Bundle generation hooks into the existing async overlay job, replacing the single `pedagogyQuestionOverlays` block with the multi-field Bundle.

```
Kindler save click
    ↓
Universal module schema validated and saved to Sanity
    ↓
Module marked lensStatus: 'pending'; save returns to parent immediately
    ↓ (UI shows the saved module; no spinner, no announcement of background work)
    ↓
Async job: Pedagogy Lens Bundle generation
    ├─ Parent-built: family's pedagogy only
    ├─ Curated: all six pedagogies
    └─ Per pedagogy:
        ├─ Retrieve relevant corpus chunks (RAG over pgvector)
        ├─ Construct grammar-aware prompt with honest-density instruction
        ├─ Haiku generation
        ├─ Validation: banned-phrase + cross-field similarity + grammar schema + length
        └─ On reject at any check: re-prompt up to twice; on third failure, omit field
    ↓
Bundle written to module.pedagogyLensBundles[pedagogyKey]
    ↓
Module marked lensStatus: 'ready' (or 'partial_needs_review' if any field omitted)
    ↓
Family's next view of the module shows their lens populated
```

The save flow respects the 5-minute rule absolutely: the parent does not wait on Bundle generation. Bundle landing is a background event the parent experiences as their module quietly becoming richer the next time they open it.

For parent-built modules, the typical observed pattern is: save → save complete in <500ms → parent navigates to Module Experience to try it → Bundle has not yet landed → Eclectic fallback shown → parent uses module → next visit (often hours or days later), the family's pedagogy lens is in place. The "before and after" comes through naturally without instrumentation.

---

## 6. Mapping to Module Experience Surfaces

The Kindler reads this mapping at generation time so that each prompt knows the rendering context of its output. The runtime reads this mapping to know which Bundle field to pull for each surface.

| Bundle field | Module Experience surface | Render behaviour | Eclectic fallback |
|---|---|---|---|
| `whyThisMatters` | Prep mode → "Why This Matters" panel | Single prose block, 90–120 words, serif body | Generic Sanity template interpolated with module title and primary capability threads |
| `facilitationNote` | Facilitate mode → header above activity steps | 2–3 sentence note, italic serif inset | Standard step intro from module schema |
| `observationCues` | Log mode → prompt list above the description field | Up to three numbered prompts, sans, label weight | Generic observation prompts from FIS template set |
| `questionOverlay` | Prep panel → "What to notice next" + Planner card expansion | Per-grammar render (CM single prompt, Classical chain, Montessori cue, Waldorf delayed reflection, Unschooling single line) | Per-grammar Eclectic equivalent matching activity nature |
| `evidencePriorities` | Constellation node detail → highlight when filtered to this module | Up to 5 capability threads visually weighted; one-line interpretation in tooltip | Threads display at neutral weight; no interpretation overlay |

This mapping is the runtime's contract with the Kindler. A new surface that wants to express pedagogy distinctiveness must either map to an existing Bundle field or trigger a deliberate Bundle schema extension — not a Kindler-side change. The mapping itself lives as a Sanity singleton (`pedagogyLensSurfaceMap`) so it can be edited without a deploy when surfaces evolve.

---

## 7. Versioning and Corpus Updates

Per Drew's direction (2026-05-07): **no remake mechanism in the Kindler.** When the pedagogy knowledge base corpus is updated (new Source Excerpts added to CM, etc.), existing Bundles are not regenerated.

Rationale: Bundles are durable interpretations of specific modules. Continuous regeneration would churn parent-facing content unpredictably and destabilise the runtime experience. The corpus is updated rarely; the Bundle is generated once at module creation and treated as canonical from that point.

Implications worth naming: new modules created after a corpus update benefit from the richer corpus. Existing modules retain their original Bundles indefinitely. If a future Kindler version chooses to bake in a corpus refresh — selectively, on opt-in for specific modules — that is a Phase N decision, not v1.

The corollary: the Pedagogy Knowledge Base team should treat a corpus addition as additive and version-stable. Removing or significantly editing a Source Excerpt that's already cited by existing Bundle provenance breaks the audit trail. The corpus is append-mostly.

---

## 8. Cost Analysis

| Origin | Bundle generations per module | Token estimate per Bundle | Per-module cost | Per-module gen latency |
|---|---|---|---|---|
| Parent-built (save) | 1 (family's pedagogy) | ~2.5–3K tokens (RAG context + output) | ~3K tokens | ~5–15 seconds async |
| Parent-built (later marketplace publish) | 5 (other pedagogies) | ~3K each | ~15K tokens | one-time, batched |
| Hand-curated (per activity, 6 pedagogies) | up to 30 per module | ~3K each | up to ~90K tokens | content-team operation, QA-gated |

All costs are content-time and one-time per module per pedagogy. None impact the runtime budget. Parent-built module cost is a small fraction of the existing Logger enrichment monthly burn even at heavy module-creation rates — a family creating five modules a week incurs ~15K tokens per week of Bundle cost on top of Logger costs that are an order of magnitude larger.

The honest-density principle creates real cost savings: fields skipped because the tradition has no view on the module are not generated, not just not displayed. A Classical Bundle for a free-form outdoor module might be 800 tokens of output across two fields rather than 2.5K across five.

---

## 9. Validation and QA

Each generated Bundle field passes through:

1. **Banned-phrase check** — Sanity singleton, shared with Logger reflection prompts and the existing UC6 question overlays. Single source of truth across the platform.
2. **Cross-field similarity check** — per-Bundle, embedding-based. Rejects Bundles where fields paraphrase each other.
3. **Grammar schema check** — `questionOverlay` only. Must conform to the pedagogy's grammar specification.
4. **Length check** — per field, per Section 2 specification.
5. **Source attribution check** — every claim that paraphrases corpus content must carry the `corpusChunkIds[]` provenance for admin traceability.

On three rejections at any check, the field is omitted from the Bundle and the module is flagged `lensStatus: 'partial_needs_review'` for the admin Content QA queue. The module is still publishable and consumable in this state — it simply has Eclectic fallback for the omitted fields and is queued for human review. Parent-built modules with this status are not blocked from use; the parent never sees the flag.

For agent-produced packs, the threshold for human review is stricter: any field omission triggers `needs_review` regardless of cause. This reflects the higher trust bar for content that will be consumed by many families.

---

## 10. What This Spec Does Not Address

The following are intentionally out of scope for v1:

**Vocabulary-swap templates** for dashboard greetings, generic observation prompts in non-module contexts, and similar chrome-level pedagogy texture remain as Sanity template sets keyed by `pedagogy_key`. Unchanged by this spec.

**Logger reflection prompts** (UC6 Surface B) are write-time per-entry, not content-time per-module. Different cost model, different surface, unchanged by this spec.

**Multi-pedagogy Eclectic family experience.** Eclectic is treated as the universal fallback grammar; rich Eclectic-specific Bundles are not generated. This may need revisiting once usage data shows what Eclectic families actually want to see — they may benefit from a multi-tradition framing rather than a generic neutral one.

**Bundle export or portability** (e.g., a parent moving their library to another platform). Not in scope for v1.

**UI states for `lensStatus: 'pending'` and partial Bundles.** These are Module Experience UI questions. The runtime contract is set; the visual treatment is deferred to the next Module Experience version.

**Content-time Bundle generation for projects** (the parallel content type to modules, with stage artefacts). Projects warrant their own Bundle treatment but the schema and surface mapping differ enough that they need a separate spec. Flagged for follow-up.

---

## 11. Open Items Resolved by This Spec

| Source | Open question | Resolution |
|---|---|---|
| UC6 Surface A | Overlay grain: module-level or activity-level? | Module-level for parent-built and agent-produced. Activity-level for hand-curated packs. |
| UC6 Surface A | Module Builder save: generate inline or queue async? | Async. Family's pedagogy only at save; others on marketplace publish. |
| Pedagogy KB v1 §6 | Do existing modules regenerate when corpus updates? | No. Bundles are durable. No remake mechanism in Kindler v1. |
| Pedagogy lens distinctiveness (architecture chat 2026-05-07) | Is the question overlay alone enough to produce module-level pedagogy distinctiveness? | No. Extended to a five-field Bundle with honest-density variability. |

---

## 12. Cross-References

| File | Role |
|---|---|
| `hearth-pedagogy-knowledge-base-architecture-v1.md` | Source of corpus and RAG infrastructure this spec consumes. |
| `hearth-alpha-use-case-verification-v1.md` | UC6 Surface A is extended by this spec. UC5 two-layer rule is preserved. |
| `hearth-module-builder-pathways-architecture-v2.md` | Kindler save flow this spec extends. |
| `Hearth_AI_Intelligence_Layer_Architecture.md` | Two-layer AI architecture this spec respects. |
| `hearth-pedagogy-engine-spec-v1.md` | Family pedagogy profile that determines which Bundle is consumed at runtime. |
| `hearth-pack-data-architecture-v1.md` | Sanity schema where the `pedagogyLensBundles` field is added. |
| `hearth-decisions-log-v1.md` | Decisions C2 (three-layer content model), C9 (pedagogy is family-level), C10 (six pedagogies). |

---

## 13. COMPONENT_REGISTRY.md Update

Add new spec entry:

| # | Component | Active spec | Status | Notes |
|---|---|---|---|---|
| — | Pedagogy Lens Bundle | hearth-pedagogy-lens-bundle-v1.md | Canonical spec | Extends Kindler save flow with multi-field pedagogy bundle generation. Resolves UC6 Surface A open decisions. |

The Module Builder row should reference this spec alongside `hearth-module-builder-pathways-architecture-v2.md` once the Kindler v6 build incorporates Bundle generation.

---

*This spec captures the Pedagogy Lens Bundle architecture as of 7 May 2026, resolving open questions raised in the architecture session of the same date. It locks the Bundle composition (five fields with honest-density variability), generation scope (origin-dependent), save flow (async with Eclectic fallback), corpus update behaviour (no remake), and surface mapping (Section 6 table). The spec is ready for Kindler v6 implementation in Claude Code.*
