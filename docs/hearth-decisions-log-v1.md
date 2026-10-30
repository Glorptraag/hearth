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

### D-LPS-12 — Logger voice is server-side STT (Deepgram), a scoped runtime-AI exception

**Decision:** Logger voice capture moves off the browser Web Speech API (`useSpeechRecognition` — Chrome/Edge only, unreliable-to-absent on iOS Safari and in-app webviews) to **record-then-transcribe**: `MediaRecorder` captures a clip, `POST /api/transcribe` forwards it to **Deepgram** `/v1/listen` (`smart_format=true` → punctuated, capitalized text), and the recognised text appends to the description. This is a **deliberate, scoped exception** to architecture principle #4 ("no runtime AI calls in the UI"): it is *user-initiated* (one button press → one short clip) and *bounded*, not ambient or per-render — so it keeps the spirit of "no automatic LLM calls" while making voice work for the mobile-first audience the 5-minute rule is built around. **Bounds (be precise):** server-side, the route enforces auth + a **write-permission gate** (a read-only viewer can't spend Deepgram credits, mirroring `POST /api/entries`) + a 20/min rate limit + a 25MB byte cap (which implicitly bounds a clip to a few minutes of Opus). The **120s ceiling is client-side only** (the recorder's auto-stop), trivially bypassed by a direct POST — the 25MB byte cap is the real server backstop on size. The 20/min cap is **best-effort under serverless**: the in-memory limiter resets per cold start / per instance until the Upstash migration (tracker #30) lands. Provider reuses the existing `DEEPGRAM_API_KEY` (already wired for TTS in `tts.ts`) — no new vendor; model/language overridable via `DEEPGRAM_STT_MODEL` / `DEEPGRAM_STT_LANGUAGE` (default `nova-2` / `en-AU`; `smart_format=true` alone delivers punctuation). A silent/empty clip or an empty Deepgram transcript surfaces a `no-speech` toast rather than dead-ending. `useSpeechRecognition` is retained for the module-runner QuickCapture, which is unchanged.

**Why:** The mobile-first audience is exactly where Web Speech fails. "Voice input needs Chrome or Edge" made the pressure-release valve (UX compendium UC-L-09 rationale: voice is the hardest-capture-moment fallback) unavailable on the most common device. Server STT is cross-browser, accurate, en-AU-tuned, and ~AUD 0.0065/min — negligible. This partially revisits **D-LPS-10**'s voice posture (audio *evidence* capture and the offline sync queue stay deferred; this is dictation-to-text, a distinct, smaller surface).

**Document of record:** `docs/hearth-ux-use-cases-logger-portfolio-capabilities-v1.md` UC-L-09 (voice), UC-L-06 (audio — still deferred for evidence storage)
**Implementation:** `src/lib/ai/transcribe.ts`; `src/app/api/transcribe/route.ts` (auth + write-permission + rate-limit + size guards); `src/hooks/use-audio-transcription.ts` (race-guarded record→transcribe with abort-on-unmount); wired in `src/app/(auth)/log/page.tsx` + `_components/WhatSection.tsx`
**Tests:** `src/lib/ai/transcribe.test.ts`; `src/app/api/transcribe/route.test.ts` (auth/permission/size/502 guards); `src/hooks/use-audio-transcription.test.ts` (error kinds, auto-stop, unmount, race guards)
**Date:** 2026-06-21

---

### D-LPS-13 — The Logger is two-tier: Quick Log is the default surface, Full Log is opt-in

**Decision:** The Logger opens in **Quick Log** — a lean, three-step capture (Who → What [description + voice] → Engagement → Save) that is the only surface a parent must touch to log. Everything else (per-child discoveries, the activity-type grid, lesson subjects, When/Where, the 24 observation chips, evidence, and the AI-insights panel/drawer) moves behind an explicit **"Add more detail — switch to Full Log"** link. Full Log is the previous complete form, unchanged, with a "Back to Quick Log" affordance; the Guided/Quick completeness-mode toggle and Batch/Import live there too. **Quick view always uses the lean `quick` save threshold** regardless of the mode toggle, so the minimum viable save (one learner + a >20-char description + one engagement rating = 53% ≥ the 50% gate) is reachable in well under a minute. Implemented as a `view: 'quick' | 'full'` switch inside `log/page.tsx` — all form state is shared, so entered data is preserved across the switch and nothing is lost or duplicated.

**Why:** Pilot/operator feedback: the Logger had drifted back over the 5-minute promise — six numbered sections rendered up-front signalled "fill all of this" when only three are needed to save, and the extra categories + insights rail crowded the screen (esp. on mobile). The retrospective-logging heartbeat (architecture principle #1) and the 5-minute rule (#2) demand the fast path be the *default*, not a mode you opt into. This is the build of the previously-deferred "Part B"; **D-LPS-12** (server STT) shipped first, this completes the sub-5-minute rework. Resolves spec SIDEBAR #9 / Open-Q9 (form length) in `hearth-ux-use-cases-logger-portfolio-capabilities-v1.md`.

**Implementation:** `src/app/(auth)/log/page.tsx` (`view` state + `effectiveMode`; gates sections 4–6, insights panel/drawer, header batch/import + mode toggle to Full); `src/app/(auth)/log/_components/WhatSection.tsx` (`minimal` prop hides discoveries / activity grid / subjects).
**Date:** 2026-06-24

---

### D-LPS-14 — The Logger is Notice → Confirm: one capture set, one post-save surface

**Decision:** The Logger captures exactly the **consumption set** — the union of what downstream actually reads: who (`learnerIds`), what happened (`text`, typed or dictated), when (`dateOccurred`, a real date), per-child felt experience (`felt`, ordinal 1..4 → `engagementPerLearner`), per-child "said / asked / noticed" (`noticed` → `discoveriesPerLearner`), and evidence (photo / their words / link). The completeness score and ring, the Quick/Full view, the Guided/Quick mode, the activity grid, lesson subjects, duration/location, the 24 observation chips, and the while-typing insights rail (keyword matcher, draft-insight, coach hints) are **removed**. The save gate is `saveBlock()`: ≥1 child AND (any text OR any evidence). Every save lands on **one Confirm surface** with **five honest states** — `queued` (offline, outbox accepted), `pending` (reading it now, exit row live immediately), `proposals` (per-child DLO chips with provenance), `nothing` (single-child / nobody-named / other-multi sentences, "It still counts"), `failed` (safe in Portfolio, parent-initiated "Read it again"). The thin-entry fast path is collapsed into the same surface. Binding provenance rule: every node on Confirm is the parent's own words, a chip with provenance, human-authored copy, or licence attribution — no `insight_suggestions`, `journey_observation`, `profile_nudge`, "builds the X thread" line, or work-sample pill.

**Why:** The owner's "Hearth — Three Passes Toward a Coherent System" (v1, 2026-10-07; Pass 1 §1.4, Pass 2 §2.5) names the model: Logger = Notice, post-save = Confirm, and the proposal chips *are* the insight. Every removed field was captured and then read by nothing (duration, location, observation chips, activity type) or only by the score that justified it; the score itself read as a grade (R14, R18) and the insights rail was decoration with a runtime Haiku cost. One surface with honest states keeps the 5-minute rule and the Stage-2 relief moment without a density branch to tune. **Supersedes D-LPS-3** (density states), **D-LPS-11** (completeness ring) and **D-LPS-13** (two-tier Quick/Full); **keeps D-LPS-1, 2, 4, 5, 6, 7, 8, 9 and 12.**

**Document of record:** `docs/hearth-logger-spec-v2.md`
**Implementation:** `src/app/(auth)/log/page.tsx` (~240-line composition root (under 300 by construction)), `src/app/(auth)/log/_components/` (`NoticeForm`, `WhoRow`, `WhatField`, `PerChildRow`, `WhenRow`, `EvidenceRow`, `SourceBanner`, `SaveBar`, `noticeCopy.ts`), `src/components/logger/confirm/` (`ConfirmSurface`, `ProposalGroup`, `ProposalChip`, `BadgeReadyRow`, `ConfirmExitRow`, `confirmCopy.ts`), `src/hooks/use-notice-form.ts`, `src/hooks/use-notice-save.ts`, `src/lib/logger/{notice,source,proposals,confirm-state,entry-payload,draft}.ts`
**Tests:** `src/lib/logger/notice.test.ts`, `source.test.ts`, `proposals.test.ts` (incl. parity with `gateLearnersByNamedSignals`), `entry-payload.test.ts`, `draft.test.ts`, `src/hooks/use-notice-form.test.tsx`, `use-notice-save.test.tsx`, `src/components/logger/confirm/ConfirmSurface.test.tsx`, `ProposalChip.test.tsx`, `src/app/(auth)/log/_components/*.test.tsx`
**Date:** 2026-10-07

---

### D-LPS-15 — Subjects are filled server-side from enrichment when the parent gave none

**Decision:** `learning_entries.subjects` is filled inside `enrichEntry` from `subjects_detected` (normalised onto the lowercase `SUBJECTS` enum via `src/lib/ai/subjects-normalise.ts`) **only when the entry's existing `subjects` is empty**. A writer-set value — module runner, batch log, CSV import, Portfolio edit — is never overwritten. The fill is applied at both `status: 'enriched'` write sites (the main path and `sonnetFallback`, which gained an `existingSubjects` parameter). The Logger no longer sends `subjects`.

**Why:** Removing the activity grid (D-LPS-14) would otherwise leave Logger entries with no subjects and send the weekly/monthly subject balance in `snapshot-rebuild.ts` dark. A client PATCH of `subjects` would trigger `needsReenrich` and loop; a server fill inside `enrichEntry` is loop-free and benefits the retry route, PATCH re-enrich, batch and import alike, and `rebuildSnapshot` runs after it in the same `after()`. Known trade: a failed enrichment leaves subjects empty until retry (SIDEBAR S4 in the v2 spec).

**Document of record:** `docs/hearth-logger-spec-v2.md` §4
**Implementation:** `src/lib/ai/subjects-normalise.ts` (`normaliseDetectedSubjects`, `subjectsFill`); `src/lib/ai/enrich.ts` (both enriched writes)
**Tests:** `src/lib/ai/subjects-normalise.test.ts`; `src/lib/ai/__tests__/enrich-subjects-fill.integration.test.ts`
**Date:** 2026-10-07

---

### D-LPS-16 — Confirm chips reuse the DLO parent-assertion endpoint behind one seam

**Decision:** A chip on the Confirm surface calls exactly one function, `confirmProposal(p, action)` in `src/lib/logger/confirm-client.ts`, which today POSTs to the existing `/api/capabilities/[learnerId]/dlo/[dloId]/confirm`. **First tap = `confirm`** → `upsertParentAssertion` (one `asserted` row at the DLO's tier, idempotent). **Second tap = `dispute`** → `clearParentAssertion` (the `inferred` row stays). Optimistic UI, revert + retry toast on failure, one in-flight request per key (`useProposalConfirm`). The route now runs `checkWritePermission` (viewer → 403). When the proposed→confirmed ledger (Three Passes, Pass 2 §2.1) lands, it swaps in behind `confirmProposal()`; the surface does not change.

**Why:** The assertion endpoint already exists, is cross-family safe and recomputes `learner_dlo_status`, so the rebuild ships Confirm without a schema change (zero migrations). Isolating the call behind one function keeps the ledger a drop-in rather than a second surface rewrite. Under `PRODUCTION_TIER_BAR` a tap is the corroboration that can lift a thread to demonstrating, which is why the vocabulary ("confirm you've seen this", undo on second tap) is kept modest — what a tap *should* mean long-term is SIDEBAR S1; shared vocabulary with PR #288 is SIDEBAR S5.

**Document of record:** `docs/hearth-logger-spec-v2.md` §5.4
**Implementation:** `src/lib/logger/confirm-client.ts`; `src/hooks/use-proposal-confirm.ts`; `src/app/api/capabilities/[learnerId]/dlo/[dloId]/confirm/route.ts` (write check)
**Tests:** `src/lib/logger/confirm-client.test.ts`; `src/hooks/use-proposal-confirm.test.tsx`; `src/app/api/capabilities/[learnerId]/dlo/[dloId]/confirm/route.integration.test.ts`
**Date:** 2026-10-07

---

## Process

### PR-1 — Research spine: personas, journey map, research log + bug→regression-test convention

**Decision:** Pilot evidence is captured in an append-only research log (`docs/hearth-research-log.md`), and every confirmed user-reported bug gets a regression test at the appropriate layer (unit / integration / e2e per the test-pilot runbook) before the entry can be marked covered. Specs cite personas by name; personas (`docs/hearth-pilot-personas-v1.md`) are composites whose `[TO VALIDATE]` claims are cleared only by research-log evidence or captured profiles. The journey map (`docs/hearth-parent-journey-v1.md`) operationalizes the founding brief's anxiety→joy arc into stages with observable signals; instrumentation is added stage-hypothesis-first, not completionistically. Triage path: email / in-app feedback → R-entry → spec tag → test-gap check → fix PR links the R-number.

**Rationale:** The 2026-04-25 pilot produced six findings, all infrastructure-level, five operator-found (research log R7) — the email-only channel under-captures family-level UX evidence, and nothing previously bound a user-reported bug to a test. This convention closes the loop from claim to evidence that the otherwise use-case-first spec corpus was missing.

**Document of record:** `docs/hearth-research-log.md` (header: "The convention").
**Companions:** `docs/hearth-pilot-personas-v1.md`, `docs/hearth-parent-journey-v1.md`
**Date:** 2026-06-10

---

## Launch Pivot (Expo, 9 Nov 2026)

### D-LP-1 — Lead with the record: one capture is the evidence base

**Decision:** The expo leads with the parent's record: what happened, with whom, when, the child's felt experience and the evidence. Every launch surface starts from that capture. The foundation is the Logger Notice → Confirm rebuild (D-LPS-14/15/16), not the S0–S2 moments tables the pivot assumed. No `moments`, `moment_runs` or `moment_links` tables are created: `learning_entries` carries the record and the existing DLO link/assertion rows serve as moment links (A2). The foundation lands first and in order: #285, then #286 (re-opened as #292), then #288, then #287, then the logger rebuild rebased on top (A8).

**Why:** The reality check (plan §0) found S0–S2 absent from the repo, while the Notice → Confirm rebuild already captures the consumption set. New tables would duplicate a working record and create a second writer on `/log`. One record also means the Report and the Constellation read the same rows (P10).

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §0, §1 (P1, A2, A8)
**Date:** 2026-10-19

---

### D-LP-2 — Photo Read describes; authored notes interpret

**Decision:** When a parent attaches a photo, Read describes what is visible (the printed page, the activity, the artefact). It does not interpret. Read output is factual text validated against a Zod schema. Any developmental interpretation comes from the authored, confirmed "watch for next" notes (D-LP-8). Under A1, Read runs post-save inside `enrichEntry`, in the same call that proposes DLOs. The photo saves instantly and the Read draft appears on the Confirm surface as "Use this / Edit". Only an accepted or edited draft becomes entry text (`drafted_by: 'read'`). The raw output is kept in `read_output` (A2). A refusal or invalid output produces an empty Read, never an invented one.

**Why:** Pre-filling before save would hold the save behind a model call and put model text into the record before the parent has seen it. A describing Read is checkable against the photo, and interpretation stays with notes a human has reviewed.

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (P2, A1, A2)
**Date:** 2026-10-19

---

### D-LP-3 — At most one model call per save

**Decision:** Each save makes at most one model call, with or without a photo. Photo Read folds into the existing Haiku enrichment call (A1). An image block is added only when the flag allows it, the family has opted in and the entry has photo evidence. The cap is about 1,300 input tokens for the image and 250 output tokens for the Read section. The Sonnet fallback remains the existing failure path and adds no call on the happy path. Architecture principle 4 stays intact: the call runs at write time, after save, and nothing runs at read time.

**Why:** P3 as first written budgeted two calls per photo. That doubles the cost of the most common save and adds latency the parent feels at the stand. One combined call keeps the AI cost dashboard honest and the photo save instant.

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (P3, A1), §2 W1.4
**Date:** 2026-10-19

---

### D-LP-4 — Photo Read is opt-in, disclosed first, and off in production until ZDR

**Decision:** A family opts in to Photo Read through a disclosure sheet shown at its first photo capture (P4). The choice is stored in `families.photo_read_opt_in`. The opt-in is built regardless of provider status. Read is gated by two flags, `PHOTO_READ_ENABLED` and `PHOTO_READ_FAMILY_ALLOWLIST`. Production stays off until Anthropic zero-data-retention is in place for the API org (A3). Until then the stand runs only on the allowlisted demo family, with curated photos that contain no faces. A visitor's own photo is stored and can be confirmed, but it is not read.

**Why:** Children's photographs should not reach a model provider on retention terms the family has not been told about. Consent and provider retention both have to hold before an image leaves our systems. Building the opt-in now means the ZDR go-live is a flag change, not a code change.

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (P4, A3), §3 (ZDR and disclosure-copy gates)
**Date:** 2026-10-19

---

### D-LP-5 — Exit the curriculum race: any curriculum, or none

**Decision:** Hearth stops competing on curriculum coverage. The expo line is "Any curriculum. Or none. Ready for the HEU." Hearth reads what a family already uses rather than supplying a programme. The Shelf (A4) records the resource a family already owns, and matching against it is deterministic. No launch surface implies that Hearth's content is the course a family must follow.

**Why:** A curriculum race against established publishers cannot be won in the expo window. The material a family already owns is what they will photograph, and positioning around it fits the philosophy-neutral principle (architecture principle 3).

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (P5, A4), §2 W7.3
**Date:** 2026-10-19

---

### D-LP-6 — The Shelf: four resources and two universal sources

**Decision:** The Shelf is a Sanity `shelfResource` document type (A4). Wave 1 holds four resources: Math-U-See, The Good and the Beautiful, All About Reading and Story of the World. Two universal sources sit alongside them: "My own plan" and "An AI-made plan" (P6). A family whose material is neither a named resource nor a plan from Hearth can still record what it is working from. Matching is deterministic, using aliases and a lesson-number regex over `read_output.printedText`, with zero LLM calls. A matched resource and lesson is written to `learning_entries.working_from` only when the parent confirms (W2.4).

**Why:** A document type lets Drew edit the list without a deploy. The universal sources give every family an honest option. A regex match cannot invent a lesson number the way a model guess can, and writing only on confirm keeps the parent in charge of the record.

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (P6, A4), §2 W2
**Date:** 2026-10-19

---

### D-LP-7 — HEU annotated work samples are the hero output

**Decision:** The hero output is the annotated work sample (P7). An entry with a photo and a confirmed DLO renders as the parent's own words, a DLO plain-language line and a band sentence. Samples are grouped per learning area in the Report and in the PDF. This needs no data-model change (W5.1). Work samples are on the never-cut list in plan §2.

**Why:** The HEU audience checks evidence against the curriculum. A sample that pairs the child's work with the parent's words is the form they can check. Building it on the existing entry, DLO links and report pipeline avoids a new surface before the expo.

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (P7), §2 W5.1 and never-cut list
**Date:** 2026-10-19

---

### D-LP-8 — "Watch for next" notes: F–Y3 scope, authored and confirmed

**Decision:** The "watch for next" notes cover F–Y3 only (P8). About 50 are selected from F–Y3 DLOs, ranked by fixture and wave-1 hits and weighted toward early literacy, early number, science and nature, and art and making. Claude drafts them into Sanity as unpublished drafts in batches of about 10, starting Fri 23 Oct. Drew confirms each one (A5). Only notes with `confirmedAt` render. An unconfirmed note is omitted and is never generated at read time, and a test pins that omission.

**Why:** Notes are authored and human-confirmed, which keeps interpretation reviewed (P2). Generating them at read time would reintroduce the runtime AI that architecture principle 4 forbids. The confirmation backlog degrades gracefully: a short list shows fewer notes and nothing breaks.

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (P8, A5), §2 W4
**Date:** 2026-10-19

---

### D-LP-9 — Launch cuts are flags, not deletions; the expo runs on the web

**Decision:** Launch scope is set by `LAUNCH_SCOPE=expo`, which hides Module Builder, Planner, Marketplace and badges from nav and routes (A9). The code stays. `/ask` and cue suggestions were never built and stay unbuilt. The expo vehicle is the web app: a QR code leads to `www` sign-up and then add to home screen (A6). Native store submission follows the expo, and Apple enrolment and the Play closed track start this week. Account deletion (A7) is not a cut. It is a go-live gate: ownership transfers when another adult member exists, a sole owner deletes Hearth outright, and the Clerk user and every Blob evidence object are removed.

**Why:** Flags are reversible, so the cut can be undone after the expo without a re-land. Native submission depends on Drew-side enrolment that the calendar cannot carry, and a web demo avoids promising a store build. Deletion is a legal exposure, so it must be fixed before go-live rather than cut.

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (P9, A6, A7, A9), §2 W6 and W7
**Date:** 2026-10-19

---

### D-LP-10 — Constellation shows what is growing; the Report shows what is evidenced

**Decision:** The two surfaces make different claims (P10). The Constellation says what is growing, in trajectory language drawn from the existing recent-activity and "New" signals. The Report says what is evidenced, meaning tiers corroborated under `PRODUCTION_TIER_BAR` and DLO links backed by confirmed evidence. The Constellation copy changes and the evidence rules do not. The Dashboard line (W5.3) may point to either surface and is among the first cuts if the calendar slips.

**Why:** If growth and evidence were blurred, an unconfirmed trajectory could read as a claim the HEU can check, which is the exposure the Report exists to avoid. Keeping the rule in one place (the tier bar) stops the copy drifting from the evidence.

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (P10), §2 W5.2 and W5.3
**Date:** 2026-10-19

---

### A1 — Photo Read runs post-save, inside `enrichEntry`

**Decision:** One vision call both reads and proposes, inside `enrichEntry`. The photo saves instantly. The Read draft shows on the Confirm surface as "Use this / Edit", and only an accepted or edited draft becomes entry text (`drafted_by: 'read'`). The budget is at most one call per save, photo or not. The Sonnet fallback remains the existing failure path. This replaces P2's pre-fill-before-save and P3's two-call photo budget.

**Why:** The save stays instant, and model text reaches the record only once a parent accepts it. Architecture principle 4 stays intact.

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (A1)
**Date:** 2026-10-19

---

### A2 — No new `moments` tables

**Decision:** `learning_entries` gains `drafted_by` (`parent` | `read`, default `parent`) and `read_output` (jsonb, the validated Read schema). The run tape is the existing enrichment and AI-usage logging, plus `stage = 'read'` token records. `moment_links` is the existing DLO link and assertion rows. This replaces pivot §4.3.

**Why:** The repo has no moments tables, and the existing tables already hold the record. The schema change is limited to the two entry columns, plus `families.photo_read_opt_in` (W1.1).

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (A2), §2 W1.1
**Date:** 2026-10-19

---

### A3 — Read is off in production until zero-data-retention is in place

**Decision:** Read is gated by `PHOTO_READ_ENABLED` and `PHOTO_READ_FAMILY_ALLOWLIST`. The allowlist is the stand demo family only, with curated photos that contain no faces. `families.photo_read_opt_in` is built regardless. Demo step 6 is a visitor's own photo, which is stored and can be confirmed but is not read until ZDR lands. This replaces the go-live assumption in P4.

**Why:** Child photographs go to the provider only after retention terms are in place. The expo still works without it, since the Confirm and Report surfaces do not depend on Read.

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (A3), §3 (ZDR gate)
**Date:** 2026-10-19

---

### A4 — The Shelf is a Sanity `shelfResource` document type

**Decision:** Wave 1 has four resources: Math-U-See, The Good and the Beautiful, All About Reading and Story of the World. The universal sources are "My own plan" and "An AI-made plan". Matching is deterministic (alias plus lesson-number regex on `read_output.printedText`, zero LLM). This replaces the "three resources" wording in the pivot.

**Why:** A document type keeps the list editable in Sanity without a deploy. Deterministic matching is testable against fixtures.

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (A4), §2 W2
**Date:** 2026-10-19

---

### A5 — DLO "watch for next" notes are drafted by Claude and confirmed by Drew

**Decision:** Claude drafts about 50 F–Y3 notes into Sanity. Drew confirms each one. Only notes with `confirmedAt` render. Batches are about 10, starting Fri 23 Oct. This replaces the authoring source named in the pivot's §4.

**Why:** Human confirmation is the review step for developmental content, and it is cheap at about five minutes per batch.

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (A5), §2 W4
**Date:** 2026-10-19

---

### A6 — The expo vehicle is the web app

**Decision:** The stand uses a QR code that leads to `www` sign-up, then add to home screen. Native store submission runs after the expo. Drew starts Apple enrolment and the Play closed track (12 testers over 14 days) this week. This replaces the native trial the pivot assumed.

**Why:** Native submission depends on enrolment and tester windows that cannot finish before 9 Nov. The web app is already the working product.

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (A6), §3 (store gates)
**Date:** 2026-10-19

---

### A7 — Account deletion is fixed before go-live, with D1 = transfer ownership

**Decision:** If another adult member exists, ownership transfers to that member and the deleting user leaves. A sole owner deletes Hearth outright. Deletion also removes the Clerk user and every Blob evidence object. The fix covers all 27 foreign keys, and the `it.fails` pin in `orphan-tables.integration.test.ts` flips to passing. This is D1 in `docs/hearth-account-deletion-defect-v1.md` §3.

**Why:** The current route returns 500 for most real families, the Clerk identity survives deletion, and child evidence persists in Blob storage. These are launch blockers, not scope items.

**Document of record:** `docs/hearth-account-deletion-defect-v1.md` §3; `docs/hearth-launch-pivot-plan-v1.md` §1 (A7), §2 W6
**Date:** 2026-10-19

---

### A8 — Merge order for the stacked passes, then rebase the logger rebuild

**Decision:** Merge #285, then #286, then #288 (stacked), then #287. Rebase the logger rebuild onto the result. Conflicts are expected in `dlo-persistence` (#288), the logger context (#286), the insights rail (#285) and motion classes (#290). Status at log time (20 Oct): #286 was re-opened as #292 and merged, #285, #287, #288 and #292 are on `main`, and the logger rebuild is merged into the pivot branch (`1359e68`).

**Why:** The rebuild depends on the context plumbing and the DLO persistence that these passes provide. Landing them first, one at a time, keeps each CI run attributable.

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (A8), §2 W0.2 and W0.3
**Date:** 2026-10-19

---

### A9 — Launch cuts are flags, not deletions

**Decision:** `LAUNCH_SCOPE=expo` hides Module Builder, Planner, Marketplace and badges from nav and routes. The code stays in the repo and the flag reverses the change. `/ask` and cue suggestions were never built and stay unbuilt. This replaces the "launch cuts" wording of P9 as first written.

**Why:** Flags are reversible and need no re-land. Deletions would make the post-expo restore a large, risky change.

**Document of record:** `docs/hearth-launch-pivot-plan-v1.md` §1 (A9), §2 W7.1
**Date:** 2026-10-19

---

## Spec chain and Hearth Cycle (21 Oct 2026)

The seven spec-chain documents were committed to `docs/` on 21 Oct 2026: `hearth-spec-chain-README.md`, `hearth-coherent-system-passes-v1.md`, `hearth-launch-pivot-v1.md`, `hearth-pedagogy-layer-v1.md`, `hearth-learning-cycle-v1.md`, `hearth-watch-for-v1.md` and `hearth-cycle-brief-v1.md`. Precedence between them follows `hearth-spec-chain-README.md` (newest wins: watch-for, learning cycle, pedagogy layer, launch pivot, then the notes-architecture base docs; the brief sits above the chain as direction, not build spec). Every ID below is **Proposed** unless marked Decided. P1–P10 were amended and logged as D-LP-1…10 and A1–A9 on the unmerged launch-pivot branch (`claude/hearth-launch-pivot-v1-175462`); they are indexed here, not duplicated. The chain's base docs (`hearth-notes-architecture-v1.md`, `-v2.md`, `hearth-notes-handoff-plan-v1.md`) are absent from the repo, so D-HC-3 governs. The build plan of record is `docs/hearth-cycle-build-plan-v1.md`, which is being written alongside this section.

### D-HC-1 — Build the Hearth Cycle on schedule; postmortem §5 evidence gate overridden

**Decision:** Phase 2 build (HC-2 onward) starts after the expo soak week, regardless of pilot evidence. This explicitly overrides the entry criteria in `docs/hearth-refactor-postmortem-v1.md` §5, which are unmet: 0 captured profiles, and research log R7. The execution rules in postmortem §4 still bind. Compensating controls, in build plan §11:
- success events land before or with each surface
- one deliverable per PR, all four CI jobs green
- a schema runs in production ≥3 days before dependent UI
- e2e/integration verification, not flags
- ≥3 persona profiles captured at the expo stand
- a 27 Jan evidence checkpoint, logged as a decision either way
- old routes stay behind a flag for a month after a screen-purpose pivot

**Why:** Drew's call, made during the Hearth Cycle planning cycle: the build proceeds on schedule rather than waiting for pilot evidence that the postmortem's entry criteria would require. The override is explicit and the risk is carried by the compensating controls above rather than by the gate.

**Document of record:** `docs/hearth-cycle-build-plan-v1.md` §11.
**Date:** 2026-10-21

---

### D-HC-2 — Expo message: the record hooks, the Cycle deepens

**Decision:** "Snap · Confirm · Report" and the banner "Any curriculum. Or none. Ready for the HEU." stay the hero of `/expo` (pivot `expoCopy.ts`). Below them sit one Cycle section ("every session makes the next one better"), 4 lesson-pattern cards, a printed stand card and a research card. Copy only, no in-app build. Source copy: `content/expo/hearth-cycle-section.md`. Relates to P1 / D-LP-1 and brief B9.

**Why:** Drew's call, made during the Hearth Cycle planning cycle: the HEU-record message leads at the expo and the Cycle is shown as the deeper layer beneath it, without adding any in-app build to the expo scope.

**Document of record:** `docs/hearth-cycle-build-plan-v1.md` §5 HC-1d.
**Date:** 2026-10-21

---

### D-HC-3 — Spec-chain nouns map onto existing tables; base docs absent

**Decision:** The notes-architecture base docs exist nowhere (not in `docs/`, any branch or git history). Rather than block, the chain's nouns map onto existing tables, extending pivot A2 ("no new moments tables"):

| Chain noun | Maps to |
|---|---|
| Moment | `learning_entries` (+ `created_by_clerk_user_id`, `lookfor`, `outcome`, `rhythm_id`) |
| moment_links | `observation_dlo_links` ("Saw it" → `asserted` via `confirmProposal()`) |
| moment_runs | `ai_pipeline_logs` |
| sessions | `planner_entries`, extended |
| DLO band | repo tier |

New tables only where nothing exists: `rhythms`, `rhythm_state`, `watch_fors`, `educator_profiles`, `educator_events`, `day_briefs`, `card_events`, `moment_signals`.

**Why:** Drew's call, made during the Hearth Cycle planning cycle: the three base docs are not available, and blocking on them was rejected in favour of mapping the chain's nouns onto what the repo already has, adding tables only where nothing exists.

**Document of record:** `docs/hearth-cycle-build-plan-v1.md` §2.
**Date:** 2026-10-21

---

### D-HC-4 — Expo build = launch-pivot W0–W8 plus a thin everyday watch-for slice

**Decision:** The pivot build plan (`hearth-launch-pivot-plan-v1.md`, on the pivot branch) stays the expo build. Inside W5.3, the "one watch-for line" becomes each child's composed everyday watch-for: look-for = the confirmed DLO `watchForNext.neutral`, plus the tradition `watchHow` line and per-child lines (WF §3), computed by pure `src/lib/watch/{select,compose}.ts` with zero model calls. "Log it" opens the existing check-in source. The rest of LC §13 / WF §13 expo scope moves to right after the expo: Today/Week, rhythms, conversational log, Plan something, morning cards, educator path.

**Why:** Drew's call, made during the Hearth Cycle planning cycle: keep the pivot plan as the expo build and add only the thinnest slice of the watch-for work that fits inside it, deferring the remaining Cycle surfaces until after the expo.

**Document of record:** `docs/hearth-cycle-build-plan-v1.md` §5 HC-1c.
**Date:** 2026-10-21

---

### D-HC-5 — DLO watch-for = neutral sign + tradition watchHow; per-DLO variants dropped before deploy

**Decision:** Implement PL D39 and WF D57 early. Drop `watchForNext.variants` from the pivot's DLO schema before its Studio deploy. Re-cut the 50 drafts in `content/dlo-notes/` (pivot) to neutral only. The 24 `watchHow` lines (WF §3.4, `content/traditions/watch-how.yaml`) carry the tradition. Drew's confirm load drops from about 350 texts to about 71.

**Why:** Drew's call, made during the Hearth Cycle planning cycle: neutral DLO notes plus a small set of tradition lines carry the tradition at far lower authoring and confirmation load than per-DLO variants, and dropping the variants before the Studio deploy avoids shipping a schema that would be removed.

**Document of record:** `docs/hearth-cycle-build-plan-v1.md` §5 HC-1a/HC-1b.
**Date:** 2026-10-21

---

### Index — Proposed — awaiting Drew's confirmation

Source abbreviations: LP = `hearth-launch-pivot-v1.md`, PL = `hearth-pedagogy-layer-v1.md`, LC = `hearth-learning-cycle-v1.md`, WF = `hearth-watch-for-v1.md`, CB = `hearth-cycle-brief-v1.md`.

| ID | Decision (one line) | Source | Status | Repo note |
|---|---|---|---|---|
| P1 | Lead with the record, not the method: Hearth turns today into an HEU-accepted record and says what to watch for next. | LP §0 | Proposed in LP; amended and logged as D-LP-1 (pivot branch) | |
| P2 | Photo Read: one Haiku vision call describes the photo and pre-fills "What happened" as an editable draft; AI may describe, only authored knowledge interprets. | LP §0, §4 | Proposed in LP; amended and logged as D-LP-2 (pivot branch) | A1 supersedes P2/P3 (≤1 call per save, Read post-save) |
| P3 | Call budget per save: text ≤1, photo ≤2 (Read, then Propose only if Resolve is weak), structured 0. | LP §0 | Proposed in LP; amended and logged as D-LP-3 (pivot branch) | A1 supersedes P2/P3 (≤1 call per save, Read post-save) |
| P4 | Photo Read is opt-in at the first photo with a one-screen disclosure; GPS stripped client-side, EXIF date kept. | LP §0 | Proposed in LP; amended and logged as D-LP-4 (pivot branch) | |
| P5 | Exit the curriculum race: no generated curriculum, lesson plans or worksheets at launch; the Shelf is the curriculum strategy. | LP §0 | Proposed in LP; amended and logged as D-LP-5 (pivot branch) | |
| P6 | "Working from" gains two universal sources: My own plan and An AI-made plan. | LP §0 | Proposed in LP; amended and logged as D-LP-6 (pivot branch) | |
| P7 | HEU annotated work samples become the hero output: parent's words plus DLO plain-language line plus band sentence, collected per learning area. | LP §0 | Proposed in LP; amended and logged as D-LP-7 (pivot branch) | |
| P8 | Narrow authored DLO scope to F–Year 3 (ages 4–9) before the expo, prioritised by what photos and Shelf wave 1 hit. | LP §0 | Proposed in LP; amended and logged as D-LP-8 (pivot branch) | |
| P9 | Cut from launch scope: /ask, cue-suggestion job, coverage admin UI, Hearths in demo, Spark/Servo copy, tranche-3 mapping, Shelf Tier 2, Marketplace, Module Builder, Planner, badges. | LP §0 | Proposed in LP; amended and logged as D-LP-9 (pivot branch) | Planner cut superseded post-expo by C15 |
| P10 | Constellation stays, simplified, as the visual of the same rows the Report prints: Constellation = what's growing, Report = what's evidenced. | LP §0 | Proposed in LP; amended and logged as D-LP-10 (pivot branch) | |
| D36 | Two axes on every moment: what (DLO links, tracked and reported) and how (signals, read through the tradition); pedagogy reads only the how axis. | PL §0 | Proposed | |
| D37 | 17 moment signals are the shared vocabulary between moments and traditions, detected by typed-cue machinery at zero calls; new `knowledgeNote` kind `signal`. | PL §0, §3 | Proposed | |
| D38 | A tradition note is a full spec across six dimensions: stance, capture ask, stages, signal table, direction rules, balance map. | PL §0 | Proposed | |
| D39 | DLO notes are neutral only: `variants` removed from DLO and opportunity notes; DLO gains a neutral `showed`. | PL §0 | Proposed | implemented early by D-HC-5 |
| D40 | The Logger's `said` field becomes `lens`: one per-child prompt worded by the family's tradition; field count stays seven. | PL §0 | Proposed | |
| D41 | Post-save insight is five fixed blocks in a fixed order, each with exactly one source. | PL §0, §7 | Proposed | "Through your lens" block removed by D53/C16 |
| D42 | Ongoing direction is seven rule kinds in code, enabled and parameterised per tradition, with authored copy; weekly review and thread `watching` read them. | PL §0, §8 | Proposed | Folded into method turn and week shape by D48 |
| D43 | Stage is computed from the child's age at the moment and changes weights, readings and holds per tradition. | PL §0 | Proposed | |
| D44 | Eclectic reads every tradition's table and shows the strongest fit for that moment, named. | PL §0 | Proposed | Refined by D52 (any rhythm can use any method) |
| D45 | Traditions are described by their methods in Hearth's own words; no source text is quoted or retrieved, and the corpus docs are retired, not demoted. | PL §0 | Proposed | conflicts with the shipped PKB/corpus (#287, #292); needs a formal re-open of C-PL1 / C-PA2; build plan Q-HC-1 |
| C10 | Remove per-DLO variants entirely; pedagogy reads only the signal axis. | PL §13 | Proposed (default: Proceed) | Taken up early by D-HC-5 |
| C11 | `said` becomes the tradition-worded `lens` field. | PL §13 | Proposed (default: Proceed) | Session logs follow WF D57/D68; spontaneous capture keeps `lens` |
| C12 | Signals are removable but not confirmed, and never enter the Report or Constellation. | PL §13 | Proposed (default: Proceed) | |
| C13 | Readings, moves, holds and rule copy in PL §5 and §8 are a first draft; Drew marks any cell to change. | PL §13 | Proposed (default: Proceed and refine) | |
| D46 | Three parent-facing notes: Moment (capture), Thread (track, the Constellation), Rhythm (apply); knowledge notes are the authored library underneath. | LC §0 | Proposed | |
| D47 | Method is the pedagogy unit: a `knowledgeNote` kind defining a unit of work, session, outcome scale, turn table, default cadence and week shape; about 3 per tradition. | LC §0 | Proposed | |
| D48 | The turn: each outcome maps to actions from a fixed vocabulary of ten and writes the next session, with zero model calls. | LC §0, §4 | Proposed | conflicts with CLAUDE.md Principle 11 and C-PA4 forward-prescription guard; Q-HC-3 |
| D49 | Logging a rhythm session is one outcome tap per child plus optional note or photo, targeting 20 seconds or less. | LC §0 | Proposed | |
| D50 | Planning is never a blank page: the week is the set of next sessions the turns have written, laid onto each rhythm's cadence; parents move, skip or add. | LC §0 | Proposed | conflicts with CLAUDE.md Principle 11 and C-PA4 forward-prescription guard; Q-HC-3 |
| D51 | Each tradition supplies a week shape: checks over the planned week that flag what its method would miss, with a one-tap fix. | LC §0, §6 | Proposed | |
| D52 | Any rhythm can use any method; Eclectic is a family running methods from more than one tradition, and the family's tradition sets defaults only. | LC §0 | Proposed | |
| D53 | Spontaneous moments offer attach ("count this as today's nature walk") or branch ("make this a rhythm"); "through your lens" is removed and every next step carries a one-line `why`. | LC §0, §8 | Proposed | |
| D54 | Rhythms never read the Constellation; sessions with declared targets produce DLO chips that feed it, one direction only. | LC §0, §10 | Proposed | |
| D55 | Onboarding ends with the family on the cycle: tradition, two or three starter rhythms, source attached, days set, Today populated, in 5 minutes or less. | LC §0, §9 | Proposed | |
| C14 | Refine the locked principle to: "Logging is the core act. Every log produces the next step; planning is what logging produces, never a blank page." | LC §15 | Proposed (default: Proceed) | rewords CLAUDE.md Architecture Principle 1; Q-HC-2 |
| C15 | Rhythm becomes the third parent-facing note; Planner and Dashboard are replaced by Today and Week. | LC §15 | Proposed (default: Proceed) | supersedes P9's Planner cut post-expo, per the README conflict table |
| C16 | Remove the "through your lens" reading; each next step carries a one-line `why` instead. | LC §15 | Proposed (default: Proceed) | |
| C17 | Onboarding ends with starter rhythms (skippable, but Today nudges until one exists). | LC §15 | Proposed (default: Proceed) | |
| C18 | Name the third note "Rhythm" (alternatives: Routine, Thread of practice, Line). | LC §15 | Proposed (default: Rhythm) | |
| D56 | One watch-for per session, targeting one DLO, with a per-child line where children sit at different bands. | WF §0 | Proposed | |
| D57 | A watch-for is composed, never generated: what = the child's next band on a frontier DLO; how = the tradition's `watchHow` line for the DLO's evidence kind. | WF §0, §3 | Proposed | implemented early by D-HC-5 (with D39) |
| D58 | Three watch-for scopes: session (rhythm or plan), everyday (one per child, for freeform and play), week (Monday with nothing planned). | WF §0, §3.2 | Proposed | Everyday scope is the D-HC-4 expo slice |
| D59 | Loose plans are a new session source; a tailored watch-for is built at write time, cue index first with at most one Haiku constrained choice, context phrases only from the plan's own words. | WF §0, §4 | Proposed | |
| D60 | Morning cards: event-based, shown once on first open of the day, at most 3, from a precomputed day brief; one morning notification on planned days and on empty Mondays, max one per day. | WF §0, §5 | Proposed | 7:00 default vs notification quiet hours ending 7am; Q-HC-9 |
| D61 | The log is a short authored conversation opening with the watch-for; "Saw it" confirms the DLO link directly with no separate Confirm step for that DLO. | WF §0, §6 | Proposed | compatible with D-LPS-16 (same `confirmProposal()` seam) |
| D62 | Two loops kept separate: method outcome to rhythm turn (never reads the Constellation), watch-for result to Constellation evidence to next watch-for. | WF §0 | Proposed | |
| D63 | Educator path: a hidden four-stage model per parent across five strands, computed weekly from recorded behaviour, zero model calls, never shown as a number, level or badge, never demotes. | WF §0, §7 | Proposed | |
| D64 | No question exists only to measure the parent; every log question has a functional consumer (turn, Constellation or next watch-for). | WF §0 | Proposed | |
| D65 | Craft notes: new neutral `knowledgeNote` kind for teaching craft; practice notes gain a minimum educator stage; theory depth is gated by stage; cards chosen by relevance, never at random. | WF §0 | Proposed | |
| D66 | Parent control: a "Teaching help" setting (Keep it simple, Adjusts as you go, Go deeper) with one honest line; starting stage from one onboarding question. | WF §0 | Proposed | |
| D67 | Quiet mode: after 14 days with no logs, cards drop to the simplest form with no reference to the gap; stage kept; normal density returns after two logs. | WF §0 | Proposed | |
| D68 | `felt` (mood) is removed from session logs; it survives only as an optional reason chip on "Not today" / "Not yet". | WF §0 | Proposed | session logs only; spontaneous capture keeps felt (Logger v2) |
| C19 | One DLO per session, with per-child lines when siblings differ, rather than a separate watch-for per child. | WF §15 | Proposed (default: Proceed) | |
| C20 | "Saw it" on the watch-for counts as confirming that DLO link, with no separate chip. | WF §15 | Proposed (default: Proceed) | |
| C21 | Remove `felt`/mood from session logs; keep only as a reason on Not today / Not yet. | WF §15 | Proposed (default: Proceed) | |
| C22 | Advancement thresholds in WF §7.4 are a first draft, tuned after the demo family. | WF §15 | Proposed (default: Proceed and tune) | |
| C23 | A visible "Teaching help" setting with an honest description, even though the stages stay hidden. | WF §15 | Proposed (default: Proceed) | |
| C24 | Starting stage from one onboarding question, including "I've taught professionally" mapping to E3. | WF §15 | Proposed (default: Proceed) | |
| C25 | The parent-move question ("What did you try?") appears from E3, not E2. | WF §15 | Proposed (default: E3) | |
| B1 | Name: "The Hearth Cycle" is the public umbrella (stages Prepare, Learn, Notice, Turn); "Educator path" stays internal. | CB §0, §13 | Proposed (default: Hearth Cycle) | |
| B2 | The parent is the primary learner Hearth serves; every surface is judged by whether it makes the parent more capable. | CB §0 | Proposed | |
| B3 | Content strategy shift: new authoring moves toward teaching craft, lesson patterns and child understanding; existing packs are re-framed as worked examples. | CB §0, §13 | Proposed (default: Proceed) | |
| B4 | Lesson patterns are a new content type: reusable, philosophy-neutral session structures with watch-for slots, about 10 at launch. | CB §0, §13 | Proposed (default: Proceed) | |
| B5 | The growth model stays hidden (WF D63); the parent sees only a private, unscored My Teaching view, or no growth view at all. | CB §0, §13 | Proposed (default: My Teaching, opt-in) | My Teaching needs Drew's call |
| B6 | Community is linked, not a separate destination: threads attach to craft notes, patterns, methods and not-yet signs; open forum later (Phase 3). | CB §0, §13 | Proposed (default: Proceed) | |
| B7 | Child privacy in community is absolute: nothing from a log, photo or child profile is shared automatically, and posting from a log strips names and photos by default. | CB §0 | Proposed | |
| B8 | Invited "experienced guides" in community: paid, volunteer, or Hearth team only at first. | CB §13 | Proposed (default: Hearth team + a few volunteers) | |
| B9 | Expo: show 3–4 lesson patterns on Today cards as "How this session is built". | CB §13 | Proposed (default: Proceed) | Expo handling is D-HC-2 (copy only, no in-app build) |

Confirmations append below as dated successor entries; never edit the rows above.
