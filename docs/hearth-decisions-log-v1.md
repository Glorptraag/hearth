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

### C-PA1 — Pedagogy system frame: interpretive, not prescriptive

**Decision:** The methodology layer of Hearth makes the catalogue legible in the family's tradition and lets accumulated reads inform later surfacing. It does NOT steer the curriculum, branch modules into reactive trees, generate forward task lists, schedule the parent's week, or adapt curriculum at run-time. The user journey it serves: moment → moment surfaced in the Logger → observation presented to the parent → activity selection picking up the clew → next moment. The platform makes the thread visible; the parent pulls it.

**Document of record:** `docs/hearth-pedagogy-system-architecture-v1.md` §1, §13
**Date:** 2026-05-13

### C-PA2 — Seven-layer pedagogy architecture

**Decision:** The methodology layer is implemented as seven distinct layers with well-defined interfaces (mostly the FIS and the Sanity content schema). No layer reaches across boundaries. Layers 1–4 are about interpretation (what the parent sees/hears); layers 5–7 are about surfacing (what the platform offers next). The bridge is the Logger save event.

| # | Layer | Where it lives |
|---|---|---|
| 1 | Family Pedagogy Profile | PostgreSQL (JSONB on `families`) |
| 2 | Pedagogy Knowledge Base | Sanity + pgvector |
| 3 | Pedagogy Lens Bundle | Sanity (per module per pedagogy) |
| 4 | Per-screen overlay behaviours | Runtime templates + FIS |
| 5 | Lens Accumulated Signals | PostgreSQL (on FIS, per child) |
| 6 | Method Affinity | Sanity (on modules) |
| 7 | Tag-match recommender loop | PostgreSQL read-time query |

**Document of record:** `docs/hearth-pedagogy-system-architecture-v1.md` §3
**Date:** 2026-05-13

### C-PA3 — Interpretive Patterns reframe (PKB layer)

**Decision:** The PKB's "Practice Patterns" layer is renamed **Interpretive Patterns**, target volume halved from ~15 to ~8 per pedagogy for Wave 1, and scope tightened from "what the tradition does when X happens" to "how the tradition *reads* what's happening when X happens." Each Interpretive Pattern does double duty: a retrieval source for Logger insight generation, AND a classifier ID that gets tallied into the family's `lensAccumulatedSignals` (Layer 5). Patterns that exist as prose only — that tell the parent what to do without a diagnostic shape — are cut or rewritten. CM corpus audit needed; at least one existing pattern (PP-CM-006) likely crosses the prescriptive line.

**Document of record:** `docs/hearth-pedagogy-system-architecture-v1.md` §5
**Date:** 2026-05-13

### C-PA4 — Forward-prescription guard

**Decision:** The Lens Bundle validation pipeline gains a forward-prescription guard alongside banned-phrase and cross-field similarity checks. Reject fields containing imperative forward-direction language that implies content the module doesn't contain — patterns like "next, switch to…", "tomorrow do…", "follow this with…", "a good next module is…". The tradition can caution, redirect within the moment, and point at existing structure — it cannot generate forward content paths. The `questionOverlay` field's scope is now explicit: "what to notice on the next encounter with this *same module's* content." Within-module, not cross-module.

**Document of record:** `docs/hearth-pedagogy-system-architecture-v1.md` §6
**Implementation:** `claude-kindling/library/build-mode/bundle-validation.ts` (`validateForwardPrescription`)
**Date:** 2026-05-13

### C-PA5 — Lens loop closure (Layers 5/6/7) — accumulated signals × method affinity × tag-match

**Decision:** The closed loop from observation to next-content surfacing is implemented as plain overlap-scoring, not vector ranking or learned model. Per-child `lensAccumulatedSignals` (Layer 5) live on the FIS and are written as part of the existing Logger save Haiku call (no new LLM operation). Per-module `methodAffinity` (Layer 6) is a supply-side tag block on the Sanity module schema at **v1 Option 2 granularity: pedagogy keys + Interpretive Pattern IDs** (defer richer activity-shape + capability-thread tagging until usage data shows option 2 is too coarse). The recommender (Layer 7) runs at read-time at Discovery / Planner / Marketplace as a PostgreSQL JSONB overlap query — `score = overlap(family.lensAccumulatedSignals, module.methodAffinity)`. Zero LLM cost at read-time. Filter-bubble exploration budget and signal decay weighting deferred until usage data demands them.

The `observedPatterns` sub-object on the Pedagogy Engine profile is superseded by Layer 5 — leave the field in the schema (it costs nothing), don't write to it, deprecate in a future engine spec revision.

**Document of record:** `docs/hearth-pedagogy-system-architecture-v1.md` §8–§10
**Schema:** `src/sanity/schemas/module.ts` (`methodAffinity` added 2026-05-13)
**Future spec:** `hearth-lens-loop-architecture-v1.md` (blocked on PKB Wave 1 corpus completion)
**Date:** 2026-05-13
