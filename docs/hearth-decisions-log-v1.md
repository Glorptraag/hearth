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
**Implementation:** kindling repo, `library/build-mode/bundle-validation.ts` (`validateForwardPrescription`)
**Date:** 2026-05-13

### C-PA5 — Lens loop closure (Layers 5/6/7) — accumulated signals × method affinity × tag-match

**Decision:** The closed loop from observation to next-content surfacing is implemented as plain overlap-scoring, not vector ranking or learned model. Per-child `lensAccumulatedSignals` (Layer 5) live on the FIS and are written as part of the existing Logger save Haiku call (no new LLM operation). Per-module `methodAffinity` (Layer 6) is a supply-side tag block on the Sanity module schema at **v1 Option 2 granularity: pedagogy keys + Interpretive Pattern IDs** (defer richer activity-shape + capability-thread tagging until usage data shows option 2 is too coarse). The recommender (Layer 7) runs at read-time at Discovery / Planner / Marketplace as a PostgreSQL JSONB overlap query — `score = overlap(family.lensAccumulatedSignals, module.methodAffinity)`. Zero LLM cost at read-time. Filter-bubble exploration budget and signal decay weighting deferred until usage data demands them.

The `observedPatterns` sub-object on the Pedagogy Engine profile is superseded by Layer 5 — leave the field in the schema (it costs nothing), don't write to it, deprecate in a future engine spec revision.

**Document of record:** `docs/hearth-pedagogy-system-architecture-v1.md` §8–§10
**Schema:** `src/sanity/schemas/module.ts` (`methodAffinity` added 2026-05-13)
**Future spec:** `hearth-lens-loop-architecture-v1.md` (blocked on PKB Wave 1 corpus completion)
**Date:** 2026-05-13

### D-LPS-1 — Logger post-save is a deliberately designed second screen

**Decision:** The post-save state at the Logger is a first-class designed surface, not the placeholder "Moment Saved ✨" overlay that was doing undesigned double-duty. The substantive entry path morphs the capture form in place into a confirmation + enrichment surface with parent-controlled exit; thin entries keep the fast overlay unchanged. This is alpha-priority because the core value loop (Logger → Portfolio → HEU → Capabilities) routes through it.

**Document of record:** `docs/hearth-logger-post-save-resolution-v1.md` §2 Item 2
**Implementation:** `src/components/logger/PostSaveSurface.tsx`; mount point `src/app/(auth)/log/page.tsx`
**Date:** 2026-05-18

### D-LPS-2 — Inline form-morph, parent-controlled exit, depth fades in

**Decision:** The second screen is an inline morph (not an overlay, not a sheet) so capture → seen reads as one continuous act. Exit is parent-controlled — "Back to Dashboard" / "Log Another" — no auto-dismiss on the substantive screen. The confirmation renders instantly on save; the enrichment (reflection prompt + connection observation) fades in as the single Haiku call returns. While the call is in flight an honest interim state ("Reading this moment…") resolves into either depth or failure — never a spinner that hangs. Poll timeout is 30s; on timeout the surface resolves to failed and the Portfolio retry affordance becomes the path forward.

**Document of record:** `docs/hearth-logger-post-save-resolution-v1.md` §2 Item 2
**Implementation:** `src/components/logger/PostSaveSurface.tsx`; poll loop in `src/lib/logger/enrichment-poll.ts` (`pollEntryEnrichment`), wired from `handleSave` in `src/app/(auth)/log/page.tsx`
**Date:** 2026-05-18

### D-LPS-3 — Three density states; thin entries keep the fast overlay

**Decision:** Honest Density applies to parent time, not just to AI output. Three density states are supported: thin entries (short description, no Guided chips, no evidence) get the existing fast "Moment Saved ✨" toast unchanged and a quick exit; substantive enriched entries get the full second screen; substantive failed entries get the honest recoverable failure surface. The screen earns weight only when the entry did.

**Document of record:** `docs/hearth-logger-post-save-resolution-v1.md` §2 Item 2 density table
**Implementation:** thin-entry heuristic in `isThinEntry` (`src/lib/logger/entry-payload.ts`, unit-tested), called from `handleSave` (Logger page) — short description + no observation chips + no evidence
**Date:** 2026-05-18

### D-LPS-4 — No forward prescription on the post-save screen

**Decision:** Nothing on the Logger post-save screen is "try this next time" / "do this tomorrow." The forward-prescription guard from C-PA4 applies. The Logger second screen observes and reflects; forward surfacing lives at read-time on Dashboard / Discover via the Layer 7 tag-match recommender — zero LLM, template-filled, pull-not-push, on a different screen, on the next visit. **Save deposits; next-visit surfaces.** This split is the spine intact.

**Document of record:** `docs/hearth-logger-post-save-resolution-v1.md` §2 Item 2
**Cross-reference:** C-PA4 (forward-prescription guard); `docs/hearth-pedagogy-system-architecture-v1.md` §6
**Date:** 2026-05-18

### D-LPS-5 — Alpha: enrichment failure must be visible (silent-degradation suspended)

**Decision:** For production resilience the system silently degrades when enrichment fails (entry saves, parent sees success). For alpha that mode is suspended: the post-save state must distinguish enriched / pending / failed so a broken enrichment cannot masquerade as a working one. The `learning_entries.ai_enrichment` JSONB now carries a `status: 'pending' | 'enriched' | 'failed'` discriminant written at save / completion / catch. The Logger surface and Portfolio entry view read the discriminant to render honest state.

**Document of record:** `docs/hearth-logger-post-save-resolution-v1.md` §2 Item 1
**Implementation:** `src/app/api/entries/route.ts` (pending on insert, failed in catch); `src/lib/ai/enrich.ts` (enriched on success, failed in inner catch); shared `src/types/enrichment.ts`
**Date:** 2026-05-18

### D-LPS-6 — Captured moment decoupled from enrichment layer

**Decision:** Description, per-child discoveries, evidence and all other captured fields are persisted independent of enrichment outcome. Enrichment is an enhancement layer that can be absent and later filled. "Couldn't generate insights" must never read as "couldn't save your moment." On the Logger second screen the failure copy plainly states insights couldn't be generated this time and tells the parent the moment is safe and where it lives. On the Portfolio entry view a quiet, non-alarming affordance — not an error banner — offers a [Generate now] retry.

**Document of record:** `docs/hearth-logger-post-save-resolution-v1.md` §2 Item 3
**Implementation:** failed branch of `PostSaveSurface`; affordance row in `src/app/(auth)/our-story/portfolio/page.tsx`
**Date:** 2026-05-18

### D-LPS-7 — Retry is parent-initiated, one call per tap, routes through existing service

**Decision:** Enrichment retry is parent-initiated only — never automatic background retry. One Haiku call per tap. Routes through the same `enrichEntry()` service the save path uses, not a parallel Anthropic SDK call site. This preserves the spine ("no surprise AI") and keeps the audit boundary intact: a separate retry endpoint with its own Anthropic call would add a third Anthropic call site for entries and break the audit. Endpoint is rate-limited to 10 retries / hour / family.

**Document of record:** `docs/hearth-logger-post-save-resolution-v1.md` §2 Item 3
**Implementation:** `src/app/api/entries/[id]/enrich/route.ts` (POST, parent-initiated, rate-limited, delegates to `enrichEntry`)
**Date:** 2026-05-18

---

### D-LPS-8 — Cross-device Logger drafts are a hybrid localStorage + Postgres mirror

**Decision:** Drafts sync across a parent's devices via a Postgres mirror (`logger_drafts`, `/api/logger/draft`), but `localStorage` stays the **offline-first primary** — the mirror is purely additive and never blocks capture. Every server call is best-effort and swallows its error (like the existing `draft_resume` fetch): autosave fires a `PUT`, mount does a `GET` and restores the newer of {local, server} by `savedAt` (`pickNewerDraft`, last-write-wins), and `clearDraft` fires a `DELETE`. The row is keyed per **Clerk user**, not per family, so two co-facilitators of one family never clobber each other's in-progress log. Server rows expire read-time after 7 days (no cron). This resolves UX compendium UC-L-11 / E9 and logger-spec §Open-Q#3 without regressing the offline path (UC-L-10).

**Why:** A draft started on the phone was invisible on the tablet (device-locked `localStorage`) — costly for the interruption-driven homeschool day. The spec already recommended a Postgres draft; the only real design question was avoiding a hard network dependence, answered by keeping `localStorage` authoritative and the server best-effort.

**Document of record:** `docs/hearth-ux-use-cases-logger-portfolio-capabilities-v1.md` UC-L-11; `docs/hearth-logger-spec-v1.md` §Open Questions #3
**Implementation:** `src/lib/db/schema.ts` (`loggerDrafts`) + `drizzle/0026_logger_drafts.sql`; `src/app/api/logger/draft/route.ts`; `src/lib/logger/draft.ts` (`pickNewerDraft`, `DRAFT_EXPIRY_MS`); `src/hooks/use-logger-draft.ts`
**Tests:** `src/lib/logger/draft.test.ts` (pickNewerDraft); `src/hooks/use-logger-draft.test.tsx` (sync); `src/app/api/logger/draft/route.integration.test.ts` (round-trip, expiry, per-user isolation)
**Date:** 2026-06-14

---

### D-LPS-9 — Multi-child entries fan out automatically; the capture-time note makes it legible

**Decision:** A multi-child entry already fans out into one per-child portfolio record (per-child engagement + discovery keyed by `learnerId`) — this is automatic and unconditional. The inert "Learning together" checkbox (it set state nothing read, and wasn't even in the draft shape) is **removed**; in its place `WhoSection` shows a note once 2+ children are selected: "Saved to each child's portfolio — rate engagement and add notes for each below." Comprehension fix, not a behaviour change.

**Why:** UX compendium UC-L-03 flagged that parents may not realise one entry feeds N portfolios. A toggle that implied opt-in to a thing that always happens was misleading on a trust-sensitive surface; a plain statement of the real behaviour is the honest fix.

**Document of record:** `docs/hearth-ux-use-cases-logger-portfolio-capabilities-v1.md` UC-L-03
**Implementation:** `src/app/(auth)/log/_components/WhoSection.tsx`; removed `togetherMode` wiring in `src/app/(auth)/log/page.tsx`
**Tests:** `src/app/(auth)/log/_components/WhoSection.test.tsx`
**Date:** 2026-06-14

---

### D-LPS-10 — Audio capture and the offline sync queue stay deferred (Phase 2)

**Decision:** Two Logger gaps the UX compendium flags remain **deliberately deferred**, not built this round: (a) **audio evidence capture** (UC-L-06 — `kind: 'audio'` exists only as a data-model placeholder in `entry-payload.ts`; no MediaRecorder UI), and (b) the **offline submission / sync queue** (UC-L-10 — no service worker, no background submission, and no `local://` photo-placeholder queue; an offline photo-add fails outright). Both are recorded under "Missing (deliberately not re-landed)" in the refactor postmortem. **Entry criteria for picking these up:** audio needs the CaptureTray/MediaRecorder + an audio upload route + `kind='audio'` UI; offline needs a service worker + an IndexedDB blob queue for background submission. Until then, the only offline safety net is the `localStorage` draft (now mirrored to Postgres for cross-device pickup — D-LPS-8).

**Why:** Both are substantial builds with no half-measure that improves trust; shipping them piecemeal would risk a worse failure mode (e.g. a queue that silently drops). Recording the deferral with explicit entry criteria keeps the gap honest rather than implied-done.

**Document of record:** `docs/hearth-ux-use-cases-logger-portfolio-capabilities-v1.md` UC-L-06, UC-L-10; `docs/hearth-refactor-postmortem-v1.md` §"Missing (deliberately not re-landed)"
**Date:** 2026-06-14

---

### D-LPS-11 — The completeness ring is readiness/wayfinding, not a grade

**Decision:** The save-bar completeness ring signals *readiness to leave*, not *worth*. Once the entry is saveable (`canSave` — the 50% quick / 65% guided gate) the ring turns sage and shows a ✓; the raw percentage is shown only *while still building*. `aria-valuetext` carries the readiness phrase ("Ready to save" / the next action), never a bare "55", and the ring carries `role="progressbar"`. The colour now flips at the save gate, not at 90. Scoring (`src/lib/logger/completeness.ts`) is **unchanged** — this is presentation only, so the save gate does not move.

**Why:** UX compendium UC-L-13 — a percentage reads as a grade of the parent. The anxiety peaks exactly when they've "finished," so that's where the ✓ replaces the number.

**Document of record:** `docs/hearth-ux-use-cases-logger-portfolio-capabilities-v1.md` UC-L-13
**Implementation:** `src/app/(auth)/log/_components/SectionHeader.tsx` (`CompletenessRing`); call sites in `src/app/(auth)/log/page.tsx`
**Tests:** `src/app/(auth)/log/_components/SectionHeader.test.tsx`
**Date:** 2026-06-14

---

## Process

### PR-1 — Research spine: personas, journey map, research log + bug→regression-test convention

**Decision:** Pilot evidence is captured in an append-only research log (`docs/hearth-research-log.md`), and every confirmed user-reported bug gets a regression test at the appropriate layer (unit / integration / e2e per the test-pilot runbook) before the entry can be marked covered. Specs cite personas by name; personas (`docs/hearth-pilot-personas-v1.md`) are composites whose `[TO VALIDATE]` claims are cleared only by research-log evidence or captured profiles. The journey map (`docs/hearth-parent-journey-v1.md`) operationalizes the founding brief's anxiety→joy arc into stages with observable signals; instrumentation is added stage-hypothesis-first, not completionistically. Triage path: email / in-app feedback → R-entry → spec tag → test-gap check → fix PR links the R-number.

**Rationale:** The 2026-04-25 pilot produced six findings, all infrastructure-level, five operator-found (research log R7) — the email-only channel under-captures family-level UX evidence, and nothing previously bound a user-reported bug to a test. This convention closes the loop from claim to evidence that the otherwise use-case-first spec corpus was missing.

**Document of record:** `docs/hearth-research-log.md` (header: "The convention").
**Companions:** `docs/hearth-pilot-personas-v1.md`, `docs/hearth-parent-journey-v1.md`
**Date:** 2026-06-10
