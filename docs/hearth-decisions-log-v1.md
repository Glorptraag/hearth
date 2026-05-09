# Hearth Decisions Log — v1

> **Purpose:** Append-only record of design and engineering decisions that need to outlive any single PR or session. One row per decision. Cross-link the document of record where the rule actually lives.
> **Format:** `S<n> — <Topic>: <one-line decision>. Document of record: <path>.`
> **Rule:** New decisions append at the bottom. Never edit a past entry — append a successor that supersedes it.

---

## Design System

### S14 — Icon library

**Decision:** Phosphor Icons (production), Lucide (prototypes).

Phosphor `regular` weight only. Five sizes: 14 / 16 / 18 / 22 / 32 (`--icon-xs` through `--icon-xl`). Default 18. Icons inherit `currentColor` — never `color` props or hex on icons. Custom illustrator marks match Phosphor stroke specs (1.5px @ 24px viewBox, round caps/joins, single-colour stroke).

Lucide stays in HTML prototypes for CDN convenience; mechanical name-swap migrates them to Phosphor when the prototype becomes production code (~80% identical names — full map in the rules doc).

App code imports from `@/components/icons` only, never directly from `@phosphor-icons/react`. The central index is the single swap point when custom marks land.

Existing components are not migrated up-front — they migrate as they're touched. First full migration: the Dashboard rebuild.

**Document of record:** `docs/hearth-icon-system-v1.md`
**Implementation:** `src/components/icons/index.tsx`
**Token spec:** `docs/hearth-canonical-design-tokens-v1.md` Appendix B

**Date:** 2026-04-30


---

## Content Architecture

### C-PL1 — Pedagogy Lens Bundle

**Decision:** Pedagogy Lens Bundles are content-time-generated, multi-field, honest-density artefacts keyed by `(moduleId, pedagogyKey)` and stored on the module document. Replaces the single `pedagogyQuestionOverlay` previously planned at UC6 Surface A.

Bundle composition: up to five fields (`whyThisMatters`, `facilitationNote`, `observationCues`, `questionOverlay`, `evidencePriorities`) with field-level optionality — partial bundles are valid; pedagogies without a distinctive view on a module are permitted to populate fewer fields. Validation enforces banned-phrase, cross-field similarity, and length per field. Generation runs in the Kindler's async overlay job after module save. Family's pedagogy generated at save; remaining pedagogies generated on marketplace publish (parent-built) or all six pedagogies up-front (curated). No remake mechanism — corpus updates do not retroactively regenerate bundles.

**Document of record:** `docs/hearth-pedagogy-lens-bundle-v1.md`
**Schema:** `src/sanity/schemas/pedagogyLensBundle.ts`, fields on `src/sanity/schemas/module.ts`
**Date:** 2026-05-09

### C-PM1 — Methodology Overlay Bundle

**Decision:** Methodology overlays are content-time-generated, sibling to pedagogy lens bundles. Keyed by `(moduleId, practiceKey)` over twelve practices and stored on the module document. Affordance-filtered: each module declares `methodologyAffordances` (inferred for parent-built, authored for curated) and overlays generate only for `affordances ∩ scope`.

Overlay composition: up to four fields (`loggerPromptHint`, `prepHint`, `observationCue`, `evidenceTagBias`). Honest density default is silent fallback — non-affordant practices produce no overlay at all. Retrieval shares the existing pedagogy corpus with practice-relevance filtering on anchor pedagogies + theme tags. User-facing copy says "practices"; "methodology" is architecture-internal.

This change introduces the three-layer content model: **(1) pedagogy / (2) methodology / (3) content**. Layer 1 = philosophical lens. Layer 2 = practical operations. Layer 3 = the universal module schema. Layers 1 and 2 are baked at content time and read at runtime as pure database data — no LLM calls in the runtime, preserving the two-layer AI rule.

**Document of record:** `docs/hearth-methodology-overlay-bundle-v1.md`
**Briefs:** `docs/hearth-kindler-methodology-integration-brief-v1.md`, `docs/hearth-runtime-methodology-integration-brief-v1.md`
**Schema:** `src/sanity/schemas/methodologyOverlay.ts`, `src/sanity/schemas/practice.ts`, fields on `src/sanity/schemas/module.ts`
**Date:** 2026-05-09
