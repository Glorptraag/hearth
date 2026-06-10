<!-- Version: 1 | Date: 2026-06-10 | Changes: Initial creation. Canonical parent journey expanding the founding brief's before/after narrative into staged arc with emotional states, touchpoints, operationalized success signals, and open research questions. -->

# Hearth — Parent Journey v1

> **Status:** Hypothesis map, drafted from the founding brief (§5 "The Change") and the System Interaction Map. The emotional arc it encodes — **anxiety → relief → space to breathe → time to dream → dreams realised → joy** — is the founding bet of the product. This document operationalizes that arc into stages with observable signals so the bet can be *tested* against pilot behaviour rather than reasserted.
>
> **How to use it:** When building or changing a screen, find the stage(s) it serves. A change that improves a stage's success signal is on-thesis; a change that can't name its stage is suspect. When pilot evidence (research log / PostHog) contradicts a stage's hypothesis, update this map and tag the change with the log entry.
>
> **Companion docs:** `hearth-pilot-personas-v1.md` (who travels this journey), `hearth-research-log.md` (evidence), `Hearth_System_Interaction_Map.md` (screen-level flows).

---

## Stage 0 — Deciding (pre-product)

- **Emotional state:** Overwhelm + defiance. The decision to homeschool is made under pressure (school didn't fit, values conflict, child distress). The weight "doesn't lift after the first week" (founding brief §1).
- **Touchpoints:** None yet — word of mouth, homeschool Facebook groups, a Sandra-type mentor. The landing page (`/`) is the first owned surface.
- **Hearth's job:** Be findable and legible at the moment of deregistration panic. Speak the *new* homeschooler's regulator language (NESA/HEU/VRQA per state), not generic "compliance."
- **Success signal:** Sign-up conversion from landing. *(Not currently instrumented — no `landing_*` events in the PostHog union.)*
- **Open research question:** What actually triggers the search that finds Hearth? `[Ask every pilot family in profile capture — "what prompted the start?" field]`

## Stage 1 — Arriving (onboarding)

- **Emotional state:** Hope wearing armor. High motivation, low trust. One confusing step confirms the fear that "I'm not qualified for this."
- **Touchpoints:** `/welcome` → `/onboarding` (family, learners, state/territory, pedagogy wizard) → `/dashboard`.
- **Hearth's job:** Minimum viable configuration without interrogation. The pedagogy wizard should *teach while profiling* — for Mei-Lin it is the first moment Hearth makes her feel more qualified, not less.
- **Success signals:** Onboarding completion rate; `pedagogy_set` fired; time-to-complete under 10 minutes. *(Completion rate not currently derivable — no `onboarding_started` event; only the server-side completion path exists.)*
- **Known risk:** The single genuinely user-facing pilot bug so far was an onboarding defect (family-name pre-fill, research log R1) — and the onboarding happy path still has **no integration test** (coverage-gap matrix, research log §2).
- **Open research question:** Does the wizard read as "teaching" or "quiz"? `[Observe one onboarding live, think-aloud]`

## Stage 2 — First log: the relief moment (day 1–7)

- **Emotional state:** The knot. *"Did we do enough today? Would the department think this counts?"* This is the founding brief's hook scene — tea, Google Doc, stare, close.
- **Touchpoints:** `/log` (the heartbeat screen), post-save enrichment surface, first Dashboard reflection of a logged day.
- **Hearth's job:** Three things logged in three minutes; then the translation — learning areas touched, capability threads growing — that turns "we read a book about frogs" into evidence. The enrichment surfacing after save **is the relief moment**; if it's invisible, Hearth is a diary, not an antidote (this was alpha blocker #0, resolved via D-LPS-1…7).
- **Success signals:** First `entry_created` within 48h of onboarding; `logger_completed_50pct`; `entry_enriched` following save; second entry within 7 days (the real retention hinge). Time-per-entry under 5 minutes — **the 5-minute rule is this stage's contract.**
- **Open research questions:** Does the parent actually *see* the enrichment? Does the completeness gate read as protection (intended) or as the form fighting back? `[First-week diary prompt in onboarding packet + research log]`

## Stage 3 — Habit: logging becomes rhythm (week 2–8)

- **Emotional state:** Relief consolidating into routine. Sparse weeks happen (travel, illness, life) — the platform's reaction to a quiet week decides whether trust survives. **Assume good faith is this stage's contract** (founding brief §4.5).
- **Touchpoints:** `/log` (offline-tolerant: autosave, offline banner), `/dashboard`, `/notifications` (invitations, never obligations), `/our-story` as the story accumulates.
- **Hearth's job:** Frictionless capture on the worst days (one hand, poor connectivity, end-of-day exhaustion). Never shame a gap. Surface gentle module nudges only after genuine momentum (10+ retro entries, 2-week cooldown).
- **Success signals:** Entries per active week stabilizing (not necessarily daily); evidence attachment rate rising; retention at week 8. `[TO VALIDATE: what cadence real families settle into — do NOT define "healthy" cadence a priori; that's a league table by the back door]`
- **Open research question:** What does a parent do in the app on a week she logs nothing? Is there value in visiting without logging? `[Session analytics + ask]`

## Stage 4 — First compliance event (term 1–2)

- **Emotional state:** Spike of the original anxiety. The renewal/registration deadline is the moment the whole bet is tested: *did the daily three-minute habit actually produce what the regulator needs?*
- **Touchpoints:** `/our-story/report` (jurisdiction-titled Compliance Report), work-sample curation, report export.
- **Hearth's job:** The report should feel ~already written. Curation is selection from abundance, not creation from panic. Jurisdiction terminology must be *hers* (HEU for Renee, NESA for Mei-Lin).
- **Success signals:** `report_exported`; time from report-start to export; parent-reported confidence at submission. The onboarding packet already asks day-7 families to "generate the Portfolio export and read it. Tell us what's missing" — route those answers to the research log.
- **Open research question:** Has any pilot family submitted a Hearth-generated report to a real regulator yet, and what came back? **This is the single most valuable piece of evidence the pilot can produce.** `[Track per-family in profile capture]`

## Stage 5 — Space to breathe → time to dream (term 2+)

- **Emotional state:** The founding brief's pivot: bandwidth returns. "She starts exploring… not because she has to, but because she has ideas now."
- **Touchpoints:** `/explore/activities`, `/explore/marketplace`, `/planner`, `/library` status board, packs.
- **Hearth's job:** Make discovery feel like curating a library, not shopping a clearance rack (no freemium framing). Recommendations read as "noticing" (gap/spark-aware), never as syllabus.
- **Success signals:** `module_added_to_library`; first planner entry; `pack_purchased`; recommendation acceptance rate (recommended → started). `[Recommendation-reason distribution logging was a Tier-4 follow-up — not yet instrumented]`
- **Open research question:** What proportion of families *ever* move from pure retro-logging to any forward planning — and is the answer fine being "a minority"? (Retrospective-first is a value, not a funnel.)

## Stage 6 — The builder: dreams realised (year 1+)

- **Emotional state:** Competence owned. "She realises she's not just keeping up — she's *good at this*." For Bec: the question shifts from "am I doing enough" to "how far can we go."
- **Touchpoints:** `/build/modules`, `/build/badges`, Constellation (`/our-story/capabilities`), Hearth groups for the Sandra path, marketplace publishing for parent-authored modules.
- **Hearth's job:** Grow with the family — the hammer, not the training wheels (founding brief §3 "the mature user"). Capability evidence credible enough for the long-term tertiary-pathway vision.
- **Success signals:** First parent-built module published; `badge_awarded` from parent-defined badges; multi-year retention; Hearth group creation.
- **Open research question:** Is anyone in the current pilot within 12 months of this stage? If not, which Stage-5 behaviours best predict who gets here? `[Longitudinal — revisit at personas v2]`

---

## Signal coverage summary

| Stage | Operationalized today | Missing instrumentation |
|---|---|---|
| 0 Deciding | — | landing conversion events |
| 1 Arriving | `pedagogy_set` | `onboarding_started`, wizard step-drop |
| 2 First log | `entry_created`, `entry_enriched`, `logger_completed_50pct` | time-per-entry, enrichment *viewed* (not just produced) |
| 3 Habit | `entry_created` cadence | nothing for log-free visits |
| 4 Compliance | `report_exported` | report-start→export duration, post-submission outcome (qualitative — research log) |
| 5 Dreaming | `module_added_to_library`, `pack_purchased` | recommendation-acceptance, planner adoption |
| 6 Builder | `badge_awarded` | module published, group created |

Instrumentation additions should be driven by which stage hypothesis we most need to test next — not by completionism. Proposed next: `feedback_submitted` (in-flight, feeds the research log) and enrichment-viewed (tests the Stage-2 relief hypothesis, the founding bet).

---

*The arc this document operationalizes — anxiety → relief → space to breathe → time to dream → dreams realised → joy — is from `hearth-founding-brief-v1.md` §5. If pilot evidence breaks a stage, this map changes; the founding brief's values do not.*
