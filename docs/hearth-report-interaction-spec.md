# Hearth Report Screen â€” Function & Interaction Specification

> **Jurisdiction framing (added 2026-06-10):** Written against the QLD/HEU reporting cycle as the worked example. Regulator names, report screen titles, review terminology, and date labels are jurisdiction-resolved at runtime via `src/config/jurisdictions.ts`; where this doc says "HEU", read "the family's regulator". The interaction model is jurisdiction-independent.

## Purpose

The Report screen is the parent's honest self-assessment tool. Unlike the dashboard (which uses warm, opaque messaging to avoid creating anxiety), the Report screen assumes **voluntary opt-in** â€” a parent who opens this page is actively seeking detailed feedback on their compliance position. The tone shifts accordingly: direct, specific, data-rich, and actionable.

This screen answers three questions in order:
1. **When?** â€” Timeline position relative to registration and report due date
2. **How am I doing?** â€” Coverage status across curriculum and required work samples
3. **What should I focus on?** â€” Prioritised module recommendations to close gaps

---

## Navigation Placement

**Section:** Our Story (new nav group, sits below Discover)  
**Items:** Plan Â· **Report** (active)  
**Rationale:** "Our Story" frames compliance as narrative rather than bureaucracy. Plan is forward-looking (what we intend to do), Report is reflective (how we're tracking). Both live together because they're two views of the same data.

---

## Screen Sections

### 1. Page Header

**Content:**
- Breadcrumb: `Our Story â€º Report â€º [Child Name]`
- Title: `[Child's] Year [X] Report`
- Subtitle: Plain-language framing of what this page shows

**Data source:** Child profile (name, year level), family registration details

**Interactions:**
- If multiple children are registered, the breadcrumb child name is a **dropdown selector** to switch between children without leaving the page
- Each child has independent coverage tracking and sample collections

---

### 2. Timeline Hero

**Purpose:** Immediate spatial orientation â€” where are we in the reporting year?

**Content:**
- Registration date (left)
- Countdown number + "days until report due" (centre)
- Report due date (right, in accent colour)
- Progress bar with glowing marker at current position
- Month labels below track

**Data source:**
- `registration_date` from family profile
- `report_due_date` calculated as registration + 10 months (QHE standard cycle)
- Current date for position calculation

**Interactions:**
- **No interactions** â€” this is informational only. The progress bar animates on page load (CSS transition, 1.2s ease).
- Countdown number updates daily

**Business logic:**
- Progress percentage = `(days_elapsed / total_days) Ã— 100`
- If report is overdue, the countdown shows **"X days overdue"** in rose colour and the bar fills to 100% with a rose tint
- If within 30 days of due date, countdown number pulses gently (CSS animation) to create appropriate but non-alarming urgency

---

### 3. Overall Posture Card

**Purpose:** Single-glance assessment before the parent dives into detail.

**Content:**
- Title: "Overall Position"
- Status badge (one of three states)
- Summary paragraph â€” 2-3 sentences of plain-language assessment

**Status badge logic:**

| Badge | Colour | Condition |
|-------|--------|-----------|
| On Track | Sage green | â‰¥70% CDs evidenced AND all required samples on pace for timeline position |
| Needs Attention | Amber | 40â€“69% CDs evidenced OR 1-2 samples behind pace |
| At Risk | Rose | <40% CDs evidenced OR 3+ samples missing with <90 days remaining |

**Summary paragraph generation:**
This is **not** a canned template. The summary is generated contextually by analysing:
- Which learning areas are strong vs have gaps
- Whether the gaps are concentrated or spread
- How sample collection is tracking relative to timeline
- What the most impactful next action would be

Example: *"You're 58% through the reporting year. English and Mathematics coverage is strong, with clear evidence of progression. Science has good depth in 2 of 3 understanding areas. HASS and HPE have gaps that are worth addressing in the coming weeks."*

**Interactions:**
- Badge is static (no click action)
- Summary updates whenever underlying data changes (new log entries, new samples flagged)

---

### 4. Required Work Samples Grid

**Purpose:** Track the 6 mandated work samples for QHE submission.

**Layout:** 3-column grid (2 columns on tablet, 1 on mobile)

**Cards (6 total):**

| # | Area | Label | Timing |
|---|------|-------|--------|
| 1 | English | Early Writing Sample | Term 1â€“2 |
| 2 | English | Later Writing Sample | Term 3â€“4 |
| 3 | Mathematics | Early Maths Sample | Term 1â€“2 |
| 4 | Mathematics | Later Maths Sample | Term 3â€“4 |
| 5 | Choice Area | Early Choice Sample | Term 1â€“2 |
| 6 | Choice Area | Later Choice Sample | Term 3â€“4 |

**Card states:**

| State | Top border | Status dot | Description |
|-------|-----------|------------|-------------|
| Complete | Sage | Sage glow | Sample captured AND parent annotations attached |
| Partial | Amber | Amber glow | Sample candidate exists but missing annotations |
| Empty | Grey | Grey | No sample candidate identified yet |

**Card content:**
- Learning area tag (colour-coded)
- Sample label (e.g., "Early Writing Sample")
- Timing context (e.g., "Captured â€” Term 1" or "Needs capture â€” Term 3+")
- Status line with dot
- Detail text: if complete, shows the specific piece and date; if partial, explains what's missing; if empty, explains what's needed
- Action link at bottom

**Interactions:**

| State | Action link | Destination |
|-------|------------|-------------|
| Complete | "Review sample" â†’ | Opens sample detail view (photo/scan of work + annotations side-by-side). Parent can edit annotations from here. |
| Partial | "Annotate now" â†’ | Opens annotation flow directly. Prompts the 4 HEU annotation questions (see below). |
| Empty | "View suggested activities" â†’ | Navigates to Activities view, pre-filtered to modules flagged as `potentialSample: true` for this learning area. |

**Annotation prompts** (triggered from Partial state):
1. "What did you notice about [child's name]'s work here?" â†’ Observation
2. "What was [child's name] finding challenging or interesting?" â†’ Needs/strengths
3. "Did you do anything differently based on what you observed?" â†’ Adjustment
4. "What would you do next to build on this?" â†’ Planning

These map directly to QHE's requirement that parents demonstrate ability to observe, plan, record, analyse and adjust.

**Choice area logic:**
- Cards 5-6 default to whichever area (Science or HASS) has the first captured sample
- If no samples exist yet, the card shows "Science or HASS" and the suggested activities link shows both
- Parent can override the choice area at any time via a small toggle on the card

---

### 5. Curriculum Coverage Accordions

**Purpose:** Granular view of content description coverage across all 5 learning areas.

**Layout:** Stacked accordion cards, one per learning area.

**Collapsed state shows:**
- Emoji icon + area name + strand subtitle
- Fraction count (e.g., "21 / 27")
- Percentage label
- Progress bar (colour-coded per area)
- Chevron indicator

**Colour coding:**

| Area | Bar/accent colour |
|------|------------------|
| English | Blue (#60A5FA) |
| Mathematics | Ember orange (#D97B3A) |
| Science | Sage green (#4ADE80) |
| HASS | Violet (#A78BFA) |
| HPE | Rose (#FB7185) |

**Expanded state shows:**
- Strand groupings (e.g., Language Â· Literature Â· Literacy for English)
- Each content description as a row with:
  - Status pip (covered / partial / not started)
  - CD code in monospace
  - Plain-language description text
  - Activity count ("6 logs" / "â€”")

**Status pip logic:**

| Pip | Condition |
|-----|-----------|
| Covered (sage) | â‰¥3 logged activities touching this CD |
| Partial (amber) | 1â€“2 logged activities touching this CD |
| Not started (grey) | 0 logged activities touching this CD |

**Interactions:**
- **Click header** â†’ toggles accordion open/closed. Only one accordion open at a time (clicking a new one closes the previous).
- **Click a CD row** â†’ navigates to a filtered view of all logged activities tagged with that content description code. This lets the parent see *what evidence exists* for any given CD.
- **Hover on CD row** â†’ subtle background highlight for row targeting

**Data source:**
- Activity logs tagged with `curriculumTags[].code` from Sanity
- Coverage counts aggregated per CD code
- Strand groupings from curriculum metadata

**Smart filtering:**
- When collapsed, areas with gaps show their gap count in the subtitle (e.g., "6 content descriptions remaining")
- The order can optionally sort by coverage percentage (lowest first) to surface problem areas â€” but default is the standard curriculum order (English, Maths, Science, HASS, HPE)

---

### 6. Recommended Focus Cards

**Purpose:** Convert gap analysis into actionable next steps. This is where the report stops being diagnostic and starts being prescriptive.

**Layout:** 3-column grid (responsive to 2 then 1)

**Content per card:**
- Priority label (e.g., "Priority 1 â€” Fills biggest gap")
- Module name
- Reason paragraph â€” explains *why* this module matters for their specific gaps, written in second person
- Learning area tags (showing cross-curricular reach)
- CD codes this module covers (monospace)
- "Explore Module" button

**Recommendation algorithm:**

Priority is determined by:
1. **Coverage gap size** â€” modules that cover the most uncovered CDs rank highest
2. **HEU sample opportunity** â€” modules flagged as `potentialSample: true` get a boost if the parent still needs samples
3. **Time efficiency** â€” modules achievable in 1â€“2 weeks rank above multi-week projects when time is short
4. **Cross-curricular density** â€” modules touching multiple learning areas simultaneously rank higher (more gap closure per effort)

The three priority labels are contextual:
- "Fills biggest gap" â€” addresses the learning area with lowest coverage
- "Quick wins" â€” covers CDs that are easy to evidence through daily routines
- "Natural fit" â€” covers CDs the family likely already does but hasn't logged
- "Sample opportunity" â€” produces a work sample for an unfilled slot
- "Almost there" â€” covers CDs with partial evidence that just need a bit more

**Interactions:**
- **Hover** â†’ card elevates with border glow
- **Click "Explore Module"** â†’ navigates to Activities view filtered to that module's activities, with a contextual banner: *"Recommended for your report â€” this module covers [X] content descriptions you haven't evidenced yet."*
- Cards are **not dismissable** â€” they recalculate automatically as the parent logs new activities and closes gaps

---

### 7. Export Bar

**Purpose:** Generate the actual QHE submission package.

**Content:**
- Title: "Export Report Package"
- Description: "Generate your QHE submission with annotated samples and year in review narrative"
- "Export PDF" button

**Interactions:**
- **Click "Export PDF"** â†’ triggers report generation
- If all 6 samples are complete: generates immediately
- If samples are incomplete: shows a **confirmation modal** listing what's missing, with options:
  - "Export anyway" (generates with gaps noted)
  - "Complete samples first" (returns to samples section, scrolls to first incomplete card)

**Export package contents:**
1. Cover page with child name, year level, registration details
2. Year in review narrative (auto-generated from logged activity data, editable by parent before export)
3. Curriculum coverage summary table (all 77 CDs with status)
4. 6 work sample pages â€” each with the evidence photo/scan and the parent's 4-part annotation
5. Learning area summaries â€” paragraph per area describing what was covered and how

**Format:** PDF, styled with Hearth branding (not the dark UI â€” a print-friendly light layout)

---

## Data Architecture

### Inputs (what feeds this screen)

| Data | Source | Update frequency |
|------|--------|-----------------|
| Child profile | Sanity CMS | On change |
| Registration & due dates | Family profile | Static after setup |
| Activity logs | Logger â†’ PostgreSQL | Real-time |
| Curriculum tags per activity | Sanity CMS (activity definitions) | On content publish |
| Work sample candidates | Flagged activities with `heuFlags.potentialSample: true` | On log save |
| Sample annotations | PostgreSQL (user-specific) | On annotation save |

### Computed values

| Value | Calculation |
|-------|-------------|
| Timeline progress | `(today - registration_date) / (due_date - registration_date) Ã— 100` |
| Days remaining | `due_date - today` |
| CD coverage count | `COUNT(DISTINCT cd_code) WHERE activity_logs.curriculum_tags CONTAINS cd_code AND log_count >= threshold` |
| Coverage percentage | `covered_cds / total_cds_for_area Ã— 100` |
| Overall posture | Composite of coverage % + sample readiness + timeline position |
| Recommended modules | Ranked by gap closure potential Ã— time efficiency Ã— sample opportunity |

---

## Mobile Considerations

The Report screen is primarily a **desktop/tablet experience** â€” this is a reflective planning tool, not a quick-capture tool. However, it must still be functional on mobile:

- Timeline hero stacks vertically (dates above, bar below)
- Sample grid becomes single column
- Coverage accordions work naturally (full-width tap targets)
- Focus cards become single column
- Export button becomes full-width sticky footer on mobile

The key mobile use case is a parent checking their position quickly â€” the posture card and sample grid give them that answer without scrolling far. The detailed CD-level accordions are a desktop activity.

---

## Tone & Voice

This screen deliberately breaks from Hearth's default warm/opaque tone. The parent has opted into transparency by navigating here. The voice is:

- **Direct** â€” "You have 4 of 6 samples ready" not "You're building a wonderful collection"
- **Specific** â€” CD codes, fraction counts, exact dates
- **Constructive** â€” gaps are framed as "worth addressing" or "recommended focus", never as failures
- **Empowering** â€” recommendations explain *why* and show the parent they can close gaps efficiently
- **Honest** â€” the posture badge doesn't sugarcoat. "At Risk" means at risk.

This is the difference between the dashboard saying *"The Morrison hearth has been busy with quiet discoveries"* and the Report saying *"HASS coverage is at 40% with 6 content descriptions not yet evidenced."* Same data, different audience contract.

---

## Relationship to Other Screens

| Screen | Relationship |
|--------|-------------|
| **Dashboard** | Dashboard may show a gentle nudge ("Your report is shaping up â€” tap to review") but never shows coverage numbers or gap counts directly |
| **Logger** | Activities saved in Logger feed curriculum tags into coverage calculations here |
| **Activities** | "Explore Module" and "View suggested activities" links navigate to Activities with pre-applied filters |
| **Plan** | Plan screen (sibling under Our Story) shows the forward-looking intent; Report shows backward-looking evidence. They share the same data but present different views |
| **Portfolios** | Portfolio shows the learning journey narrative; Report shows the compliance checklist. Some overlap in work samples. |

---

## Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| New family, no logs yet | All CDs show "not started", all samples empty. Posture badge shows "Needs Attention". Focus cards recommend foundational modules. Summary is encouraging: "You're just getting started â€” here's where to begin." |
| Everything complete | Posture badge shows "On Track" in sage. Focus section replaced with a congratulatory message and the export button is promoted. |
| Report overdue | Timeline bar fills 100% with rose tint. Countdown shows "X days overdue" in rose. Posture summary addresses this directly with actionable next steps. |
| Child switches mid-year (e.g., from Year 1 to Year 2) | Coverage resets for the new year level's CD set. Any activities logged against the previous year's CDs are archived but don't count toward new coverage. |
| Multiple children | Child selector in breadcrumb. Each child's report is independent. No cross-contamination of coverage data. |
| Partial annotations | Sample card shows amber state. The "Annotate now" action opens the annotation flow pre-populated with any existing partial answers. |
