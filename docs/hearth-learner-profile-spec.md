# Hearth LMS — Learner Profile
## UX & Functional Design Specification

**Screen:** `hearth-learner-profile.html`
**Status:** Design complete, implementation ready
**Last updated:** February 2026

---

## 1. Purpose & Scope

The Learner Profile answers a single question: **who is this person as a learner?**

It is not a progress tracker (that is Capabilities Connector), not a compliance record (that is HEU Portfolio), and not a curriculum map. It is an identity portrait — warm, specific, human — that gives both parent facilitators and the platform itself a clear picture of each child's character, working style, and current interests.

This distinction is critical to scope. The temptation to surface everything about a learner in one place must be resisted. The profile's job is identity; other screens own growth and compliance.

---

## 2. Design Decisions & Rationale

### 2.1 Portrait, not dashboard

The design metaphor is a **page in a family journal**, not an admin screen. The parent opens Emma's profile the way they'd flip to her section in a physical notebook — to get a sense of who she is before planning a week, explaining her to someone new, or simply reflecting on how she's grown.

This drove the serif tagline, the large atmospheric shape, and the decision to put reflective content (moments, notes) in the right panel rather than above the fold.

### 2.2 No individual pedagogy settings

Pedagogy is set once at family level via the Pedagogy Engine. The profile does not expose per-learner philosophy settings. Reasons:

- Two children with different active pedagogies creates unresolvable content filtering conflicts throughout the platform
- Most homeschool families operate with a single philosophy applied with age-appropriate nuance
- The Rhythms section captures the practical individual differences (attention span, environment, working style) that genuinely vary between siblings — without duplicating the philosophical layer

### 2.3 What edit covers — and what it doesn't

**Editable in this screen:**
- Portrait tagline
- Sparks (add, remove)
- Learning rhythms (each row opens an edit flow)
- Facilitator notes (free text)

**Not editable here — lives in Family Settings:**
- Name
- Date of birth
- Year level / age

This boundary is made explicit in the UI when edit mode activates via a scope note directly in the portrait card. The note includes a link to Family Settings. This prevents user confusion without requiring a separate help modal.

### 2.4 The tagline as load-bearing element

The tagline is the most important field on the screen. A well-written parent tagline ("Emma builds worlds before she enters them") does more to personalise the platform experience than any structured data field. It surfaces in the portfolio header, informs how the platform might present content, and gives future facilitators or reviewing bodies immediate human context.

The tagline input is intentionally styled as a continuation of the serif display — same font, same italic — so editing feels like writing in a journal, not filling in a form.

### 2.5 Facilitator notes are genuinely private

Notes live in the right panel under a **Private** badge. They never appear in: HEU portfolio exports, shared reports, badge documentation, or any other output. The note content is sensitive by design — dysregulation triggers, transition needs, emotional patterns — and parents need confidence that writing honestly here will not surface somewhere unexpected.

The privacy model should be enforced at the data layer: notes stored in the family's personal DB record, excluded from all content rendering pipelines.

---

## 3. Sparks — Functional Specification

Sparks are the learner's current interests: loose tags like "Engineering", "Ocean Life", "Mythology". They serve two distinct functions depending on context.

### 3.1 View mode behaviour

In view mode, each spark tag displays:
- An emoji icon
- The label
- A **count badge** showing matching modules in the family's content library

**Tapping a spark navigates to Explore pre-filtered by that interest.** The count is the promise — "7 matching modules" — and the tap is the action. A tooltip appears on hover: "Browse 7 matching modules →".

A secondary CTA below the sparks grid ("Tap a spark to find modules · Explore all matches") reinforces this in case the interactive nature isn't immediately obvious. "Explore all matches" opens Explore filtered by the union of all active sparks.

### 3.2 Edit mode behaviour

In edit mode, the spark interaction changes entirely:

- Hovering a spark shows a red-tinted state with a ✕ symbol (icon and count badge are hidden)
- Tapping the spark removes it from the profile
- An **Add spark** button (dashed outline, hidden in view mode) appears at the end of the grid
- A hint label "Tap to remove" appears in the card header

This dual-behaviour pattern is gated entirely by the `body.edit-mode` CSS class — no JavaScript conditionals needed for the visual state. The `handleSpark()` function checks `editMode` to branch the action.

### 3.3 Spark count source

Counts reflect modules in the family's active content library that are tagged with matching interests. This is a runtime query against Sanity content, not stored on the learner record. The learner record stores only the spark labels; the platform resolves matches at render time.

---

## 4. Learning Rhythms — Functional Specification

Rhythms capture how this individual learner works best. Four fields by default:

| Field | Widget | Notes |
|---|---|---|
| Attention window | Dot bar (1–5 scale) | Visual representation of duration |
| Best time of day | Time badge (AM / PM / Flex) | Simple categorical |
| Environment | Multi-select toggle pills | Desk / Floor / Outdoors |
| Working style | Toggle pills | Solo / Together |

### 4.1 Design intent

These fields are practical and facilitator-facing. They inform daily planning decisions — "do I schedule this before or after outdoor time?" — rather than defining educational philosophy. Importantly, rhythms can vary significantly between siblings even within a shared pedagogical framework.

The dot bar for attention window provides a calibrated visual without asking parents to input raw minutes. The dots represent rough bands: 1 dot = ~10 min blocks, 5 dots = extended (45+ min). Actual values are stored as descriptive strings for human readability in exports.

### 4.2 Edit behaviour

Rhythm rows are not editable inline. In edit mode, each row gains a visible edit icon (pencil) and becomes tappable. Tapping opens a focused edit flow (modal or sheet — not yet designed). The rows themselves serve as display + navigation in edit mode.

In view mode, rhythm rows are display-only. Tapping in view mode does nothing.

---

## 5. Learner Switcher — Functional Specification

The learner switcher is a component in the left sidebar, positioned between the brand and the navigation sections. It is the **primary way to move between learners** on this screen.

### 5.1 Structure

Each learner is shown as an option row containing:
- Their abstract shape (SVG, 34×34px)
- Name and meta (age · year level)
- An active dot (in their personal colour, hidden when inactive)

The active learner's row has a tinted background and coloured border matching their personal colour. The inactive learner's row is neutral, with the dot hidden.

### 5.2 Switching behaviour

Tapping a learner option triggers `switchLearner(name)`. This function:

1. Updates `document.body.dataset.learner` — this single attribute cascades all CSS colour overrides via CSS custom property inheritance on `body[data-learner="liam"]`
2. Swaps the large portrait shape (Emma's organic petal SVG ↔ Liam's rounder form)
3. Re-renders: name, pills, tagline, tagline edit value, notes, notes edit value, save button label
4. Re-renders: sparks grid, rhythms body, moments list — all from per-learner data objects
5. Updates switcher active state (option background, border, dot visibility)

Switching is blocked if edit mode is active. An inline toast prompts "Save or cancel your changes first."

### 5.3 Learner colours

Each learner has a personal colour used as their visual identity throughout the platform (their shape, their dot, their active states). The profile uses CSS custom properties scoped to `body[data-learner]`:

| Learner | Base colour | Deep (actions) | Glow | Muted (backgrounds) |
|---|---|---|---|---|
| Emma | `#E8A87C` amber rose | `#C07844` | 14% opacity | 8% opacity |
| Liam | `#7BC4A0` sage green | `#4A9B78` | 14% opacity | 8% opacity |

When a learner is active, their colours propagate to: nav active state, portrait accent line, dot-bar fills, time badges, toggle pill on-states, save button background, pill dots.

---

## 6. Screen Architecture

### 6.1 Layout

The screen uses the same 3-column grid as the family dashboard:

```
240px sidebar | flex main content | 320px right panel
```

This is desktop-first by deliberate intent. The primary use case is a parent with laptop time — sitting down to reflect, update a profile, review moments. Mobile is supported but is secondary.

**Sidebar:** Brand + Learner Switcher + Nav (Portrait / Capabilities / HEU Portfolio, then app-wide nav) + User footer

**Main content:** Portrait block (shape + name + pills + tagline) + 2-column operational grid (Sparks | Rhythms)

**Right panel:** Bright Moments + Family Thread + Facilitator Notes

### 6.2 Responsive breakpoints

| Breakpoint | Behaviour |
|---|---|
| > 1100px | Full 3-column layout |
| 768px – 1100px | Right panel hidden; right panel content appears below main content as inline section |
| < 768px | Sidebar collapses to top strip (brand + switcher only, nav hidden); single column |

### 6.3 Navigation context

The learner-contextual nav section offers three destinations:

- **Portrait** (active) — this screen
- **Capabilities** → Capabilities Connector (learner growth map)
- **HEU Portfolio** → Compliance portfolio export

These three always refer to the currently active learner. Switching learner in the switcher updates the learner context for all three destinations.

---

## 7. Edit Mode — Functional Specification

Edit mode is entered via the "Edit portrait" button in the top-right of the portrait card. It is a **committed state**: the button becomes "Cancel", a save bar appears fixed at the bottom of the main content column, and the UI shifts to clearly communicate that changes are pending.

### 7.1 What activates

| Element | View state | Edit state |
|---|---|---|
| Tagline | Display text | Textarea (same serif styling) |
| Facilitator notes | Display text | Textarea |
| Sparks | Navigate on tap | Remove on tap; Add button visible |
| Rhythm rows | Display only | Tappable (opens edit flow) |
| Scope note | Hidden | Visible (explains edit scope + Family Settings link) |
| Sparks hint | Hidden | "Tap to remove" visible in card header |
| Rhythms hint | Hidden | "Tap any row to edit" visible in card header |
| Save bar | Hidden | Fixed bottom bar with learner-colour save button |

### 7.2 Cancel vs Save

**Cancel** (clicking the active edit button): Restores textarea values from the in-memory data object. Re-renders sparks (restoring any removed sparks). Does not save anything.

**Save**: Updates the in-memory learner data object with new tagline and notes values. Updates display elements. Exits edit mode. Shows a toast: "[Name]'s portrait saved ✓".

Note: In the production implementation, save should write to the DB and handle optimistic UI appropriately.

### 7.3 Guard on learner switch

If edit mode is active and the user tries to switch learners, the switch is blocked and a toast appears: "Save or cancel your changes first." This prevents data loss where unsaved tagline edits for Emma would be discarded silently on switch.

---

## 8. Right Panel Content

### 8.1 Bright Moments

A curated list of meaningful events: badges earned, parent-recorded milestones, and notable first moments. Each item shows an emoji, a type label (Badge / Milestone / Moment), a title, and a date.

**Purpose:** Emotional highlight reel. Not a comprehensive achievement log (that is Capabilities). Moments are selected by the parent as genuinely significant — the first unprompted story, the bridge that held weight.

**Add moment:** A dashed "Record a moment" button opens a moment-creation flow (not yet designed). Moments can be added independently of module completion.

**Distinction from badges:** Badges are formally earned via module completion and linked to curriculum descriptors. Moments are informal — a parent observation that something meaningful happened. Both types appear here.

### 8.2 Family Thread

Shows the family name, their pedagogy approach, the family's learner shapes side-by-side, and modules that multiple learners are doing together (with both learner dots shown on the row).

**Purpose:** Reinforces that learning is a family experience. Even when tracking individual progress, the shared context is always visible. This section also makes it unambiguous that pedagogy is family-level — "Charlotte Mason · 2 learners" is stated explicitly.

### 8.3 Facilitator Notes

Free text. Private. Never exported. The one place where a parent can write honestly about what helps this child — sensory needs, emotional patterns, transition strategies — without those observations appearing in any formal document.

The **Private** tag is always visible in the card header. In edit mode, the text becomes an editable textarea. In view mode it displays as serif prose.

---

## 9. Abstract Shapes

Each learner has a unique abstract SVG shape used as their visual identity across the platform. Shapes are:

- Generated as organic, non-representational forms (not avatars or initials)
- Filled with a radial gradient in the learner's personal colour (light highlight centre → deep saturated edge)
- Used at multiple sizes: large in portrait header (110×110px), small in switcher (34×34px), micro in family clusters (18×18px circles for simplicity)
- Accompanied by a drop-shadow glow using the learner's colour at low opacity

Shapes carry meaning through form. Emma's shape is expansive and irregular — echoing her described character ("builds worlds before entering them"). Liam's is rounder and more contained — suggesting his preference for focused physical activity.

This system should be preserved as learners are added. Shapes are assigned at onboarding and should not change — they become recognisable identity marks across the dashboard, portfolio headers, and family views.

---

## 10. Data Architecture Notes

### What lives on the learner record (DB)

- Name, DOB, year level (editable in Family Settings)
- Tagline
- Sparks (array of labels)
- Rhythms (structured: field + value + widget type)
- Facilitator notes
- Shape definition (SVG path data or shape ID)
- Learner colour tokens
- Bright moments (type, title, date, emoji)

### What is resolved at runtime

- Spark counts (query Sanity content tagged with matching interests)
- Shared modules in Family Thread (query module progress records with multiple learner participants)
- Badge moments (pulled from badge award records, surfaced alongside parent-recorded moments)

### What lives elsewhere

| Data | Location |
|---|---|
| Capability thread progress | Capabilities Connector |
| HEU compliance evidence | HEU Portfolio |
| Badge definitions | Sanity CMS |
| Module history | Activity log (DB) |
| Pedagogy settings | Family record |

---

## 11. Future Considerations

**Rhythm editing flow:** The rhythm row tap in edit mode currently shows a toast placeholder. The actual edit UX needs designing — likely a bottom sheet on mobile, an inline modal on desktop, with simple controls appropriate to each widget type (slider for attention window, toggle set for environment, etc.).

**Spark discovery integration:** The Explore screen needs to accept a `?spark=Engineering` query parameter and apply it as a filter. This connection is currently implied but not implemented.

**Moment creation flow:** The "Record a moment" entry point exists. The creation flow — title, emoji selection, date, optional link to a logged activity — needs a dedicated design pass.

**Shape assignment at onboarding:** During add-learner flow (name → DOB → year level → shape), the shape selection UX needs to feel like choosing something meaningful, not picking a random option. Consider 4–6 pre-generated options with brief character descriptors, or a simple colour + form combination tool.

**Additional learners:** The switcher supports N learners. With 3+ children the switcher list will need a maximum height with internal scroll, or a collapsed "see all" pattern. Design should be tested at 4 learners minimum.
