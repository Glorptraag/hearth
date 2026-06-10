# Hearth — Compliance Work Sample Curation Flow Spec v1 (QLD/HEU-anchored)

**Addendum to:** `hearth-report-interaction-spec.md` (Section 4: Required Work Samples Grid)
**Resolves:** System Interaction Map Open Question #6 / Session F
**Date:** 2026-03-11

> **Jurisdiction framing (added 2026-06-10):** This spec was written against Queensland's HEU requirements and keeps "HEU" throughout as its worked example — the filename is retained for link stability. At runtime, all regulator names, report titles, and review terminology come from `src/config/jurisdictions.ts` (8 states/territories); the curation *flow* specified here is jurisdiction-independent. Where this doc says "HEU", read "the family's regulator". The runtime component threads `reportingBody` as a prop (`src/components/report/WorkSampleCuration.tsx`).

---

## 1. Scope

The report interaction spec defines the work sample grid: six cards, three states (Complete / Partial / Empty), action links, annotation prompt wording, choice area logic, and export package contents. The prototype (`hearth-report-screen.html`) implements this grid with working demo states.

This addendum documents the inner flows that fire when a parent taps those action links — specifically:

- How the parent **selects** a work sample from available candidates (the "Browse" and "Select" interactions behind the Empty state)
- How the **annotation interface** works in detail (the "Annotate now" and "Review sample" destinations)
- How **AI pre-seeding** of annotations works and its safeguards
- How **early/late progression pairing** is communicated
- How **subject area choice** for slots 5–6 works beyond the toggle described in the existing spec
- **Edge cases** not covered by the existing spec: insufficient evidence, deadline pressure, deleted evidence, reporting period changes

It does not redefine the grid layout, card states, posture badge, coverage accordions, recommendation cards, export bar, tone/voice, or data architecture already specified. Those remain canonical in the parent spec.

---

## 2. Design Decisions

### 2.1 AI suggests, parent decides

The AI intelligence layer flags entries as `heu_potential_sample` at write-time and computes quality scores (per the AI Architecture spec §4.2: `work_samples_available`, quality factors). The curation flow surfaces these candidates ranked by quality — but the parent can override any suggestion, browse the full entry library, and select anything. The AI reduces the search space; it does not make compliance judgements.

### 2.2 Annotations are pre-seeded, never pre-submitted

When a parent opens the annotation interface, the four fields (already defined in the parent spec: observation, needs/strengths, adjustment, planning) are pre-populated with draft text derived from the parent's original entry description and AI enrichment. But the annotation is always presented in an editable state with a visible "AI draft" indicator. It is never marked complete until the parent reviews and confirms.

### 2.3 Temporal enforcement is soft

The system recommends entries from Term 1–2 for early slots and Term 3–4 for late slots (matching the parent spec's timing labels). If a parent selects a late-period entry for an early slot, they see a warning but the selection is not blocked. Some families have legitimate reasons for atypical timing.

### 2.4 Export does not lock

Per the parent spec, the export bar generates a PDF. This addendum clarifies: exporting creates a snapshot. The parent can revise and re-export. No version is "submitted" through Hearth — the parent submits to HEU separately via the QLD government's own form.

---

## 3. Candidate Selection Flow

### 3.1 Entry Points

The parent spec defines three action links per card state. This addendum specifies what each opens:

| Card State | Action Link (from parent spec) | Opens |
|------------|-------------------------------|-------|
| Empty | "View suggested activities →" | Activity Discovery filtered by `potentialSample: true` (unchanged) |
| Partial | "Annotate now →" | **Annotation Interface** for the already-identified candidate |
| Complete | "Review sample →" | **Annotation Interface** in review/edit mode |

The Empty state currently routes only to Activity Discovery. This addendum adds a **secondary action** on the Empty card: "Or choose from logged entries →" which opens the Candidate Panel directly. This lets parents who already have evidence select it without going through Activity Discovery first.

### 3.2 Candidate Panel

The Candidate Panel is a slide-over sheet (desktop) or full-screen sheet (mobile) scoped to the slot being filled.

**Filtering:** The panel shows learning entries where:
- `heu_potential_sample: true` (AI-flagged at write-time)
- Subject area matches the slot (English, Mathematics, or the chosen subject for slots 5–6)
- Date falls within the slot's timing window (Term 1–2 for early, Term 3–4 for late)

**Sorting:** Candidates are sorted by the quality score computed in the Family Intelligence Snapshot. The quality factors (from the AI Architecture spec) are:

| Factor | Weight | What it means |
|--------|--------|---------------|
| Evidence attached | High | Photo, scan, or document file is present on the entry |
| Parent notes present | Medium | Original learning entry includes a description |
| Annotation completeness | Medium | Existing observations or reflections in the entry |
| Date alignment | Low | How well the entry date fits the early/late window |
| Learning area confidence | Low | AI confidence in the subject area classification |

Quality is shown as a visual indicator only (strong / moderate / weak) — not a numeric score. Parents don't need to know the algorithm; they need to know which entries will make good samples.

**Card content per candidate:**
- Evidence thumbnail (or 📄 placeholder if no image)
- Entry title and date
- Quality indicator (visual)
- Whether parent notes exist: "Notes present" / "No notes"
- One-line excerpt from the parent's original description

**Manual override — "Browse all entries":** A link below the AI-surfaced list opens the full entry library filtered by subject area only, removing the quality score filter and timing window. Entries outside the timing window show a subtle note: "This entry is from [month] — early-period samples typically come from Term 1–2." The selection is not blocked.

**Comparison:** The parent can tap a compare toggle to see up to three candidates side-by-side (desktop: columns; mobile: swipeable horizontal scroll). Comparison shows thumbnails, full descriptions, dates, and quality indicators.

### 3.3 Selection

Tapping a candidate card selects it for the slot. The panel closes. The slot card updates from Empty to Partial (evidence selected, annotation pending).

**Swap:** On a Partial or Complete card, a "Change sample" link (new — sits below the existing action link) reopens the Candidate Panel with the current selection highlighted at the top as "Currently selected." Choosing a different candidate replaces it.

**Deselect:** Within the Candidate Panel, a "Remove current selection" link clears the slot back to Empty without requiring a replacement.

**Cross-slot conflict:** If a parent selects the same entry for two different slots, the system warns: "This entry is already selected for [slot name]. A single entry can only fill one slot." The parent must choose a different entry or remove it from the other slot.

---

## 4. Annotation Interface

### 4.1 Layout

When a parent taps "Annotate now →" (Partial state) or "Review sample →" (Complete state), the Annotation Interface opens as a slide-over panel (desktop) or full-screen sheet (mobile).

**Evidence context region (top/left):**
- Evidence image at readable size, tap to zoom
- Entry title, date, linked module (if applicable)
- Full original description from the learning entry
- Learning area tags

**Annotation fields region (bottom/right):**
Four text areas using the prompts defined in the parent spec (Section 4):

| # | Parent spec prompt | Field label | Word guidance |
|---|-------------------|-------------|---------------|
| 1 | "What did you notice about [child]'s work here?" | What did you observe? | 80–250 words |
| 2 | "What was [child] finding challenging or interesting?" | Needs & strengths | 60–200 words |
| 3 | "Did you do anything differently based on what you observed?" | What did you adjust? | 60–200 words |
| 4 | "What would you do next to build on this?" | Planning next steps | 60–200 words |

Helper text beneath each field provides guidance specific to the HEU expectation: the reviewer reads these to assess the parent's ability to observe, plan, record, analyse and adjust.

### 4.2 Pre-seeding

On first open for a given sample:
1. System checks for existing annotation data (if parent previously started)
2. If none: fields are pre-populated with AI-generated draft text, marked with a subtle "AI draft — review and edit" label above each field
3. The AI draft draws from the parent's own words in the original entry, restructured into the annotation format. For the adjustment and planning fields, if subsequent entries in the same subject area exist, the AI references what actually happened next.
4. The "AI draft" label disappears once the parent makes any edit to that field

### 4.3 Quality Indicators

Each field shows a quality indicator after the parent has entered or reviewed text:

| Indicator | Condition |
|-----------|-----------|
| ● Strong (sage) | ≥60 words and includes at least one specific reference (child's name, activity, material) |
| ● Consider expanding (amber) | 20–59 words, or generic phrasing without specifics |
| ● Needs attention (red) | <20 words, empty, or unchanged AI draft |

Amber indicators include a brief tooltip with specific guidance: "Could you add more about what materials you changed?" or "The reviewer looks for specific next steps." These are nudges, not blocks.

### 4.4 Auto-save

Annotation drafts auto-save on a 5-second debounce after the last keystroke and on any navigation away from the panel. No explicit Save button. A subtle "Saved" flash confirms each auto-save. This is critical on mobile where accidental navigation (back gesture, notification tap) would otherwise lose work.

### 4.5 Completing an Annotation

At the bottom of the interface, a "Mark as complete" button requires all four fields to have content (amber quality indicators are allowed; empty fields are not).

Tapping with empty fields shows inline validation: "All four fields need content before this sample is ready."

After marking complete, the slot card in the grid transitions from Partial to Complete (sage border, sage glow dot — per parent spec states). The parent can still tap "Review sample →" to edit — completion is a status indicator, not a lock.

### 4.6 Source Tracking

Each annotation field tracks its authorship state:

| State | Meaning |
|-------|---------|
| `ai_draft` | Unchanged AI-generated text |
| `parent_edited` | AI text that the parent has modified |
| `parent_written` | Text the parent wrote from scratch (cleared AI draft and typed) |

If all four fields on a sample are still `ai_draft` when the parent taps "Mark as complete": a warning appears — "These annotations haven't been reviewed yet. The HEU expects your own observations — please review and personalise." This does not block completion but requires explicit acknowledgement.

---

## 5. Early/Late Progression Pairing

### 5.1 Progression Connector

When both the early and late cards in a subject row reach Complete state, the grid displays a brief **progression summary** between them — an AI-generated sentence or two describing the growth between the two samples.

Example: *"From basic sentence construction in Term 1 to structured paragraphs with punctuation in Term 3 — showing growing confidence in written expression."*

This summary is:
- Generated from the two entries' descriptions and annotations
- Editable by the parent (tap to edit inline)
- Included in the exported PDF between the two sample pages for that subject area
- Togglable — parent can exclude it from export if preferred

### 5.2 Temporal Warnings

If the parent places two entries from the same term in a single subject row, both cards show an amber note: "Both samples are from Term [N]. Reviewers look for time between samples to show progression."

If an entry's date falls outside the expected timing window for its slot, the card shows: "This entry is from Term [N] — this slot expects Term [window]." Selection is not blocked (per §2.3).

---

## 6. Subject Area Choice (Slots 5–6)

The parent spec defines a "small toggle on the card" for choice area override. This addendum specifies the full interaction:

### 6.1 Initial State

Before any evidence exists for slots 5–6, both cards show "Science or HASS" as the learning area tag (per parent spec). The toggle is replaced with a subject selector (segmented control) showing:
- All available subject areas with candidate counts per area
- **Recommended** label on the area with the highest combined quality score: "Science — 5 strong candidates"
- Areas with no candidates are greyed out

### 6.2 Auto-default

Per the parent spec: cards default to whichever area has the first captured sample. Once a candidate is selected for either slot 5 or 6, the other slot's subject tag updates to match.

### 6.3 Changing Subject After Selection

If the parent changes the subject area after samples are already selected in slots 5–6, a confirmation appears: "Changing subject will remove your current selections. Continue?" On confirmation, both slots clear to Empty. Annotation data is preserved internally for 30 days (per the data deletion spec's soft-delete model) in case the parent switches back.

---

## 7. Export Additions

The parent spec (Section 7) defines the export package contents including "6 work sample pages — each with the evidence photo/scan and the parent's 4-part annotation." This addendum adds:

### 7.1 Per-Sample Page Layout in PDF

Each of the 6 work sample pages includes:
- Learning area header and timing label
- Evidence image (scaled to max 50% page width, print-quality)
- The four annotation fields with their labels
- Entry date and linked module name (if applicable)

### 7.2 Per-Subject Progression Page

After each subject pair (English early + late, Maths early + late, Choice early + late), an optional progression summary page shows the editable progression text and both evidence thumbnails side by side. Togglable off before export.

### 7.3 Post-Export State

After export:
- "Last exported [date]" badge appears on the report screen
- All selections and annotations remain fully editable
- If the parent edits after export, badge updates to "Edited since last export"
- Re-exporting generates a fresh PDF (Hearth does not version exports internally)

---

## 8. Edge Cases

### 8.1 Insufficient Evidence

New family, fewer than 6 viable candidates:
- Slot grid renders normally. Empty slots show candidate count, which may be "0 candidates"
- Banner above the grid: "You have [N] entries that could be work samples. Keep logging — you need 6 across English, Maths, and one other subject."
- Even with 0 AI candidates, "Browse all entries" in the Candidate Panel lets the parent select anything

### 8.2 No Candidates for a Subject Slot

If the chosen subject area has no entries, slot cards show "No entries in [subject] yet" with a suggestion: "Consider choosing [other subject] instead — you have [N] candidates there." The subject selector (§6.1) naturally surfaces this through candidate counts.

### 8.3 Approaching Deadline

Notification integration per `hearth-notification-system-spec.md`:

| Trigger | Text | Tier |
|---------|------|------|
| 30 days out, incomplete | "HEU report due in 30 days. [X] work samples need attention." | Respond |
| 14 days, incomplete | "2 weeks until HEU report. [Specific gap]." | Respond |
| 7 days, incomplete | "1 week left. [Specific action]." | Resume |
| 3 days, incomplete | "Report due in 3 days. [Specific action]." | Resume |
| All 6 complete | "All work samples ready. Preview and export when ready." | Reconnect |

Respects the daily cap of 4 and quiet hours from the notification spec.

### 8.4 "Ready" State

All 6 selected and annotated:
- Section header: "6 of 6 ready"
- All cards: sage Complete state
- Export bar (parent spec §7) prominent and enabled
- Brief text: "All work samples are complete. Preview and export when ready."
- No celebration animation — this is the compliance screen

### 8.5 Evidence Deleted After Selection

If a learning entry used as a work sample is deleted:
- Slot reverts to Empty with notice: "The entry you selected was removed. Choose a new sample."
- Annotation data preserved 30 days via soft-delete (per data deletion spec)
- Progress indicator updates

### 8.6 Reporting Period Changes

If reporting period dates are adjusted in Family Settings:
- Selected samples re-evaluated against new timing windows
- Samples outside their expected window receive a warning badge but are not removed
- Parent prompted: "[N] samples are outside the updated date range. Review your selections."

---

## 9. Mobile Considerations

The parent spec notes the report screen is "primarily a desktop/tablet experience" and the sample grid becomes single-column on mobile. This addendum adds:

**Candidate Panel:** Full-screen sheet with back button. Comparison mode uses a swipeable horizontal carousel instead of side-by-side columns.

**Annotation Interface:** Full-screen. Evidence context collapses to a tappable thumbnail (opens full-screen viewer). Four fields stack vertically with generous touch targets. Word count and quality indicators inline below each field.

**Auto-save is especially important on mobile** — the 5-second debounce protects against accidental navigation loss.

---

## 10. Data Model Additions

These entities supplement (not replace) the data architecture in the parent spec.

```
WorkSample
  id: UUID
  report_id: UUID → HEUReport (per-child)
  slot: enum [english_early, english_late, maths_early, 
              maths_late, choice_early, choice_late]
  entry_id: UUID | null → LearningEntry
  status: enum [empty, selected, annotated, complete]
  annotation_id: UUID | null → Annotation
  created_at, updated_at: DateTime

Annotation
  id: UUID
  work_sample_id: UUID → WorkSample
  observations: String
  observations_source: enum [ai_draft, parent_edited, parent_written]
  needs_strengths: String
  needs_strengths_source: enum [ai_draft, parent_edited, parent_written]  
  adjustment: String
  adjustment_source: enum [ai_draft, parent_edited, parent_written]
  planning: String
  planning_source: enum [ai_draft, parent_edited, parent_written]
  progression_summary: String | null  (populated on late slots)
  progression_summary_edited: Boolean
  confirmed_at: DateTime | null
  created_at, updated_at: DateTime
```

The `LearningEntry` entity already carries `heu_potential_sample`, quality score, and suggested areas (per AI Architecture spec). The `WorkSample` creates the binding between an entry and a report slot. The `Annotation` entity is HEU-specific — it does not appear in Portfolio views.

---

## 11. Connection to Portfolio

Per the System Interaction Map: Portfolio and HEU Report share the same `LearningEntry` data but serve different purposes:

- A Portfolio item and an HEU work sample may reference the same `entry_id`. Evidence files are stored once.
- HEU annotations exist only in the HEU context. Portfolio does not display them.
- The Candidate Panel surfaces entries already in the Portfolio with a subtle "📁 In Portfolio" badge — otherwise treated identically.
- The parent does not need to "pull from Portfolio." Candidate surfacing considers all entries regardless of Portfolio status.

---

## 12. Open Questions

| # | Question | Proposed Answer | Status |
|---|----------|----------------|--------|
| 1 | **Multiple children:** Does the report screen show one child at a time with a selector? | Yes — consistent with per-child HEU requirements. Child selector in report header. | Proposed |
| 2 | **AI annotation ethics:** What safeguards prevent rubber-stamped AI text? | Source tracking (§4.6) + warning on all-`ai_draft` completion + exported PDF does not indicate AI assistance. | Proposed |
| 3 | **Evidence format requirements:** Are photos of physical work acceptable? | Accept anything. Quality scoring favours clear evidence but rejects nothing. | Proposed |
| 4 | **Offline annotation editing:** Can parents draft offline? | Drafts stored locally, synced on reconnect. Candidate browsing requires server. Deferred to offline strategy. | Open |
| 5 | **Progression summary in export:** Include by default? | Yes, with toggle-off option. Parent prompted to review accuracy. | Proposed |

---

## 13. Files & References

| File | Relationship |
|------|-------------|
| `hearth-report-interaction-spec.md` | **Parent spec** — this addendum extends Section 4 |
| `hearth-report-screen.html` | Report screen prototype — grid already implemented |
| `Hearth_System_Interaction_Map.md` | Open Question #6 resolved by this spec |
| `Hearth_AI_Intelligence_Layer_Architecture.md` | Quality scoring, `heu_potential_sample` flagging, snapshot structure |
| `hearth-data-deletion-privacy-model-v1.md` | Soft-delete model for evidence/annotation cleanup |
| `hearth-notification-system-spec.md` | Deadline notification integration (§8.3) |
| `Hearth_Dashboard_Our_Story_Content_Spec.md` | Our Story → HEU Report navigation card |

---

## 14. COMPONENT_REGISTRY.md Update

The HEU Compliance Report entry should note this spec alongside the existing one:

```
| 6 | HEU Compliance Report | hearth-report-screen.html | Queensland HEU compliance | 
  Specs: hearth-report-interaction-spec.md, hearth-heu-work-sample-curation-spec-v1.md |
```

---

*Resolves System Interaction Map Open Question #6 / Session F. Update when annotation interface is prototyped or HEU requirements change.*
