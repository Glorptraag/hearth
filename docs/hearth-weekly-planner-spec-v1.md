# Hearth LMS — Weekly Planner
## UX & Functional Design Specification

**Screen:** `hearth-weekly-planner-v3.html`
**Status:** Design complete (v3), implementation ready
**Last updated:** March 2026

---

## 1. Purpose & Scope

The Weekly Planner is the connective tissue between content discovery and learning documentation. It answers one question for the parent facilitator: **what are we doing this week, and how is it going?**

It is not a curriculum builder (that is the Module Builder). It is not a log (that is the Retrospective Logger and Module Experience Log mode). It is the lightweight bridge between "I found something interesting" and "we did it and here's what happened."

The Planner sits at the centre of Hearth's core value loop:

```
Discover → Plan → Facilitate → Log → Reflect
```

Activity Discovery and the Marketplace feed content in. The Planner holds it in time. Notifications fire when it's time to prep or log. Module Experience runs the session. The Logger captures what happened. The Planner card flips to "completed." Subject balance updates. The week tells a story.

### What the Planner is not

It is not a schedule. Homeschool families do not operate on bell schedules. Morning and Afternoon are energy zones, not time blocks. "Tuesday morning" means "a high-energy window on Tuesday," not "9:00 AM."

It is not a compliance tool. The HEU Report owns compliance. The Planner's subject balance pips are a gentle awareness surface — "we haven't touched science in a while" — not a grading rubric.

It is not mandatory. Families who prefer pure retrospective logging (capture what happened, don't plan ahead) should never feel the Planner is required. The system works without it. But for families who like a light structure, the Planner makes the week visible and the logging pipeline frictionless.

---

## 2. Design Decisions & Rationale

### 2.1 Unified HTML table over day cards

V1 used vertical day cards (tall, scrolling, one column per day). V2 used horizontal columns as separate card containers. Both felt fragmented — the parent couldn't see the whole week at a glance.

V3 uses a single HTML table: days as columns, sessions (Morning/Afternoon) as rows. This gives a dense, complete week overview in one viewport. The table metaphor is familiar (parents already use paper planners with this layout) and the grid structure makes drag-and-drop targets unambiguous.

### 2.2 Morning/Afternoon over hourly slots

Hourly time blocks contradict how homeschool families actually work. Learning happens in flexible windows. The Morning/Afternoon split maps to genuine energy patterns — high-energy focus work in the morning, creative/physical/wind-down in the afternoon — without imposing clock time. The energy dot indicators (amber=high, blue=low) reinforce this without text.

### 2.3 Bottom panel drawer over inline catalog

The catalog of available modules lives in a slide-up bottom panel rather than a sidebar. Reasons:

- The table needs full horizontal width to show 5 days legibly
- A sidebar would compress day columns below usable width on standard screens
- The bottom panel follows a familiar mobile pattern (maps, ride-sharing) that works on both desktop and mobile
- The collapsed state shows a preview (recommendation chips) that acts as a persistent call-to-action without stealing space

### 2.4 Smart recommendations as first-class content

The bottom panel opens to recommendations first, catalog second. This is intentional: most parents don't want to browse 50 modules. They want the system to say "you haven't done science in 12 days, here's a hands-on module that uses kitchen items you already have, and it fits best in Tuesday morning." The recommendation layer is where the AI Intelligence Layer delivers visible value on the planning surface.

### 2.5 Subject balance as ambient awareness

The header pips are a glanceable, non-judgemental awareness tool. They show relative distribution, not absolute targets. A family doing 5 English sessions and 1 Science session sees an imbalanced distribution — but the system does not say "you're failing at Science." It says "Science: 1 planned, 0 logged." The parent draws their own conclusions.

This is consistent with Hearth's philosophy-neutral stance. A Charlotte Mason family might intentionally weight English heavily (living books). An unschooling family might have zero planned activities and that's fine. The pips inform; they do not prescribe.

### 2.6 Planned → Completed as a single record

A planner entry and its corresponding learning entry are the same record transitioning through states. There is no "planner table" that separately tracks plans and a "learning entries table" that separately tracks completions. One record moves through: `planned → in_progress → completed`. This eliminates sync bugs, prevents orphaned plans, and means the Planner is always in agreement with the Logger.

### 2.7 Monday–Friday default, weekends configurable

The prototype shows Mon–Fri. Most Queensland homeschool families operate on a weekday rhythm, but some include Saturday (co-op days, nature group, sports). Weekend columns are configurable in Family Settings. When enabled, Saturday and/or Sunday appear as additional columns with the same Morning/Afternoon row structure. They are visually distinguished with a slightly different header shade to signal "optional."

### 2.8 Week navigation preserves context

Navigating to previous or future weeks loads that week's data. Past weeks show completed/incomplete state as-is — they are not editable (see Section 8 for the one exception). Future weeks are fully editable for forward planning. The current week is always one tap away via a "Today" shortcut in the week navigation.

---

## 3. Table Layout — Functional Specification

### 3.1 Column structure

| Column | Width | Content |
|---|---|---|
| Row label | 72px fixed | Session name (Morning/Afternoon), energy indicator dot |
| Monday | Flexible (equal share of remaining width) | Module cards in drop zone |
| Tuesday | Same | Same |
| Wednesday | Same | Same |
| Thursday | Same | Same |
| Friday | Same | Same |
| Saturday (if enabled) | Same | Same |
| Sunday (if enabled) | Same | Same |

Total columns: 6–8 depending on weekend configuration. At 5 day columns, each column gets approximately `(viewport - 72px - padding) / 5` width.

### 3.2 Row structure

Two rows per week:

| Row | Label | Energy indicator | Semantic meaning |
|---|---|---|---|
| Morning | "MORNING" (vertical text, rotated) | Amber dot (high energy) | Focus work, structured modules, maths, reading |
| Afternoon | "AFTERNOON" (vertical text, rotated) | Blue dot (lower energy) | Creative, physical, outdoor, project work |

A thin dashed divider separates the rows visually. There is no "Evening" row — Hearth does not assume learning extends into evening hours.

### 3.3 Today column treatment

The column matching today's date receives visual distinction:

- Header background: subtle ember gradient (top: `rgba(217, 123, 58, 0.08)`, fading to base)
- Day name text: ember colour instead of default text-primary
- "TODAY" pill badge: ember background, dark coffee text, 8px uppercase, positioned below the date
- Column cells: `rgba(217, 123, 58, 0.03)` background tint with faint ember inset shadows

This treatment moves with the actual date. On Saturday/Sunday (if weekends are disabled), no column is highlighted.

### 3.4 Cell dimensions

Each table cell has:

- Minimum height: 120px (ensures drop targets are large enough on desktop)
- Fixed height: 140px (set via CSS, scroll if content overflows)
- Padding: 10px
- Vertical alignment: top (cards stack from the top)

### 3.5 Module card anatomy

Each card in the grid contains:

```
┌──────────────────────────────┐
│ [SUBJECT CHIP]      [DURATION]│  ← card-top row
│ Module Title                  │  ← serif, 12px, bold
│ Chunk name / step             │  ← 10px, secondary text
│ +Science +English             │  ← multi-subject tags (if applicable)
│ ✓ Logged                      │  ← done badge (hidden unless completed)
│                          [✓]  │  ← completion toggle circle (top-right)
│                          [✕]  │  ← remove button (hover-revealed, top-right)
└──────────────────────────────┘
```

**Subject chip:** Uppercase label with subject-specific colour (English=blue, Maths=violet, Science=sage, HASS=amber, Arts=rose, HPE=orange, Tech=cyan). Shows the primary subject only.

**Duration:** Minutes shown as "45m" in muted text, top-right of card-top row.

**Title:** Crimson Text serif, 12px, font-weight 600. The module name.

**Chunk indicator:** 10px secondary text. Shows which chunk/step is planned for this session (e.g., "Comparing fractions with food"). Distinguishes between multiple sessions of the same module across the week.

**Multi-subject tags:** Italic muted text showing additional subjects beyond the primary chip. Prefixed with "+". Example: a Nature Journaling card with primary chip "Arts" shows "+Science +English" below the chunk line. These tags drive subject balance calculation.

**Child assignment indicators:** When a module is assigned to specific children (not the whole family), small coloured dots or shape silhouettes appear below the chunk line, using the child's assigned colour (Emma=rose, Liam=blue). See Section 9 for multi-child details.

### 3.6 Maximum cards per slot

No hard maximum. Cards stack vertically within the cell. If content exceeds the cell's fixed height (140px), the cell scrolls internally. In practice, more than 3 cards in a single session slot suggests over-planning, and the smart insights may gently note this.

### 3.7 Empty slot treatment

An empty drop zone shows a centred "+" character in muted text at 0.3 opacity. The dashed border is barely visible (`rgba(45, 38, 33, 0.4)`). This communicates "you can put something here" without making empty days feel like failures.

---

## 4. Drag and Drop — Functional Specification

### 4.1 Source elements

Three types of elements can be dragged:

| Source | Location | Behaviour |
|---|---|---|
| Recommendation cards | Bottom panel recommendations section | Creates a new planner entry on drop |
| Catalog items | Bottom panel full catalog | Creates a new planner entry on drop |
| Existing planner cards | Table grid cells | Moves the card to a new slot |

All draggable elements have `cursor: grab` in resting state and `cursor: grabbing` while dragging.

### 4.2 Target elements

Every table cell (day × session intersection) is a drop zone. The drop zone is the `.session-drop` container within each `<td>`.

### 4.3 Visual feedback during drag

**Source element:** Opacity drops to 0.4 while being dragged. A ghost/phantom of the card follows the cursor (browser default drag image).

**Target cell on hover:**
- The drop zone border becomes solid ember: `border-color: var(--ember)`
- Background gains ember glow: `var(--ember-glow)`
- Inset shadow suggests depth: `inset 0 0 20px rgba(217, 123, 58, 0.08)`
- The parent `<td>` gains a subtle background shift

**On successful drop:** The card appears with a brief `pulseGlow` animation (0.6s) — the ember glow pulses once to confirm placement. Subject balance recalculates immediately.

### 4.4 Reordering within a slot

Cards within the same slot can be reordered by dragging. The drop inserts at the position where the card is released (top or bottom of the existing cards). Order within a slot represents priority — top card is the first planned activity for that session.

### 4.5 Moving between slots

A card can be dragged from any slot to any other slot (Tuesday morning → Wednesday afternoon, etc.). This is the primary way to reschedule. The card is removed from its source slot and appended to the target slot.

### 4.6 Removing from planner

Two methods:

1. **Hover remove button (✕):** Appears in the top-right corner on card hover. Click removes the card immediately. No confirmation dialog — the action is lightweight and easily reversible by re-adding from the catalog.
2. **Completed cards cannot be removed:** The remove button is hidden on completed cards. Completed entries represent documented learning and should not be casually deleted. To remove a completed entry, the parent must go through the learning entry deletion flow (see `hearth-data-deletion-privacy-model-v1.md`).

There is no "drag off the grid to remove" gesture — this is ambiguous and error-prone.

### 4.7 Mobile alternative (tap-based flow)

Drag-and-drop requires a mouse pointer and does not work reliably on touch devices. Mobile uses a tap-based flow:

1. Parent taps a recommendation or catalog item in the bottom panel
2. A day-picker sheet appears: "Add to which day?" showing the week's days as tappable chips
3. Tapping a day chip expands to show Morning/Afternoon options
4. Tapping a session places the card and closes the sheet
5. Bottom panel returns to view

For moving existing cards on mobile: long-press a card to enter "move mode." The card lifts visually (scale + shadow). Tapping an empty slot in another cell moves the card there. Tapping the card again cancels the move.

This flow respects the 5-minute rule — adding a module to a day should take 2-3 taps maximum.

---

## 5. Bottom Panel / Catalog — Functional Specification

### 5.1 Panel states

| State | Visual | Trigger |
|---|---|---|
| Collapsed (default) | 64px visible from bottom edge. Shows grip handle, title "Module Library", recommendation count badge, 3 preview chips | Page load; tapping overlay; tapping grip when expanded |
| Expanded | Slides up to max 55vh. Overlay dims the table behind. Full content scrollable | Tapping grip handle when collapsed |

The panel transition uses `cubic-bezier(0.4, 0, 0.2, 1)` over 350ms — fast enough to feel responsive, slow enough to track visually.

### 5.2 Smart recommendations row

**Position:** First section in expanded panel, always visible above the catalog.

**Count:** 3–5 recommendation cards in a horizontal scroll. The system generates these from three algorithm sources:

| Algorithm | Weight | Description |
|---|---|---|
| Coverage gap | High | Subjects not logged in ≥7 days. Surfaces modules tagged with the missing subject. |
| Energy match | Medium | Modules tagged with energy level matching available empty slots. High-energy modules suggested for morning gaps, low-energy for afternoon gaps. |
| Goal progress | Medium | Modules that would advance a monthly goal or maintain an active streak. |
| Streak maintenance | Low | If a subject has been logged every week for 3+ weeks, suggest continuation. |

**Card anatomy (recommendation):**

```
┌──────────────────────────────────┐
│ 🔴 COVERAGE GAP                  │  ← reason badge (coloured by type)
│ Kitchen Chemistry                 │  ← title (serif, 14px)
│ [Science chip] 60 min · 3 chunks │  ← subject + meta
│ ─────────────────────────────     │  ← divider
│ "No science in 12 days — hands-  │  ← rationale (italic, muted)
│  on module uses kitchen items."   │
│ 💡 Best fit: Tue morning          │  ← suggested slot
└──────────────────────────────────┘
```

**Reason badges:**
- 🔴 Coverage Gap — rose colour
- ⚡ Energy Match — amber colour
- 🎯 Monthly Goal — sage colour
- 🔥 Keep Streak — violet colour

**Suggested slot:** The system recommends a specific day/session based on where the empty slots are and which energy zone fits the module. This is a suggestion, not a constraint — the parent can drag the card to any slot.

### 5.3 Full catalog

**Position:** Below recommendations, separated by a border.

**Source:** The catalog pool is the family's active content library — the same content accessible through "My Library" in Activity Discovery. This includes membership-included modules and any purchased premium modules. It does not include the full Marketplace (that's a separate discovery surface).

**Filter bar:** Subject filter chips along the top. Options: All, English, Maths, Science, HASS, Arts, HPE, Tech. Single-select — tapping a filter shows only modules tagged with that subject. "All" is active by default.

**Search:** A search input field within the catalog header. Filters the grid by module title match (client-side for MVP; server-side at scale). Placeholder text: "Search modules..."

**Sort options:** Not present in v3 prototype. For implementation, add a sort dropdown with options:
- Recently added (default)
- Alphabetical
- Duration (shortest first)
- Subject

**Catalog item anatomy:**

```
┌──────────────────────────────────────┐
│ [📖] Story Explorers                  │
│       English · 4 chunks              │
└──────────────────────────────────────┘
```

Compact row: emoji placeholder icon, title (12px, medium weight), subject + chunk count meta line. Each item is draggable (desktop) or tappable (mobile, triggers day-picker).

### 5.4 Empty catalog state

If the family's library is empty (no modules added), the catalog section shows:

> "Your library is empty — explore modules to add some."
>
> [Explore Modules →]

The button navigates to Activity Discovery. Recommendations may still appear if the system can suggest from membership-included content.

---

## 6. Smart Insights Bar — Functional Specification

### 6.1 Position and behaviour

A horizontally scrollable row of insight cards sits between the header and the planner table. This is a persistent, non-dismissible awareness surface (unlike notifications, which have lifecycle states).

### 6.2 Insight card types

| Type | Icon background | Example |
|---|---|---|
| Coverage gap | Rose muted | "Science gap — 12 days. No science activities logged since Jan 29." |
| Energy match | Amber muted | "Maths focus works best Monday AM when energy is high." |
| Goal progress | Sage muted | "3 more to hit monthly goal. Add 3 English activities to complete February reading target." |
| Streak | Violet muted | "4-week HASS streak! Lily has engaged with history every week this month." |

### 6.3 Interaction

Tapping an insight card:
1. Highlights the card briefly (ember border + glow, 1.5s fade)
2. Opens the bottom panel if collapsed
3. Scrolls the recommendations section to the relevant suggestion (if one exists)

Insights are read-only cards — they cannot be dismissed, snoozed, or acted on directly. They're ambient context, not tasks.

### 6.4 Data source

Insights are generated from the Family Intelligence Snapshot. They are read at page load and do not update in real-time. The snapshot is rebuilt asynchronously after each learning entry save, so insights reflect the family's state as of the last logged activity.

---

## 7. Subject Balance Pips — Functional Specification

### 7.1 Visual design

Seven horizontal bars in the header, one per Australian Curriculum V9 learning area:

| Subject | Colour | Variable |
|---|---|---|
| English | Blue (`#60A5FA`) | `--blue` |
| Maths | Violet (`#A78BFA`) | `--violet` |
| Science | Sage (`#4ADE80`) | `--sage` |
| HASS | Amber (`#FBBF24`) | `--amber` |
| Arts | Rose (`#F9A8D4`) | `--rose` |
| HPE | Orange (`#F97316`) | — |
| Technologies | Cyan (`#22D3EE`) | — |

Each pip is 28px wide, 6px tall, with a 3px border radius. The fill width is proportional — the subject with the most planned modules fills 100%, and all others scale relative to that maximum. This means the pips show distribution, not absolute counts.

### 7.2 Multi-subject counting

A module tagged with multiple subjects (e.g., Nature Journaling: `arts,science,english`) increments the count for each tagged subject. This is intentional — cross-curricular modules genuinely contribute to coverage across multiple areas. The `data-subjects` attribute on each card stores the comma-separated list.

### 7.3 Planned vs completed distinction

The fill opacity communicates completion state:

| State | Opacity |
|---|---|
| All completed | 1.0 (full opacity) |
| Mixed (some completed, some planned) | 0.7 |
| All planned, none completed | 0.5 |
| No modules for this subject | 0.2 (barely visible baseline) |

All seven pips are always visible regardless of whether any modules are planned for that subject. This prevents layout shift and makes gaps immediately visible.

### 7.4 Tooltip interaction

Hovering (desktop) or long-pressing (mobile) a pip shows a tooltip: "Science: 3 planned, 1 logged". The tooltip uses a positioned pseudo-element, not a separate DOM node.

### 7.5 Balance philosophy

There is no target. The pips do not show a "recommended" fill level or a goal line. Different families have different priorities, and imposing a target would contradict Hearth's philosophy-neutral stance. The pips simply answer: "what's the distribution this week?"

The adjacent header stats provide two summaries:
- **Hours:** "1.5 / 5.2 hrs" (completed / total planned)
- **Gaps:** "2 subject gaps" or "All subjects covered" (count of subjects with zero planned modules)

### 7.6 Recalculation

Subject balance recalculates every time the grid changes:
- Card added (drop from catalog/recommendations)
- Card removed (✕ button)
- Card moved between slots
- Completion state toggled
- Page load (initial calculation from existing data)

The `recalcSubjectBalance()` function scans all `.module-card` elements in the table, reads their `data-subjects` and `data-duration` attributes, and updates each pip's fill width and opacity.

---

## 8. Planned → Completed State — Functional Specification

### 8.1 State machine

Each planner entry moves through a linear state progression:

```
planned → in_progress → completed
```

**planned:** The default state when a module is added to the planner. The card shows normal styling, full opacity, draggable.

**in_progress:** Set when the parent opens the Module Experience from a planner-linked notification or from tapping the card. The planner card does not visually change during in_progress — this state exists in the data model but is not surfaced on the card. (The parent is on the Module Experience screen at this point.)

**completed:** Set when Module Experience Log mode saves a learning entry linked to this planner entry. The card transitions to completed styling.

### 8.2 Completion triggers

**Primary path (preferred):** Automatic. When a Learning Entry is saved from Module Experience Log mode, and that entry is linked to a `planner_entry_id`, the planner entry status updates to `completed` automatically. The parent never needs to manually toggle.

**Secondary path (manual toggle):** A checkmark toggle button sits in the top-right corner of every planned card. Tapping it manually sets the card to completed. This covers cases where:
- The parent ran the module without going through Module Experience (e.g., did it informally)
- The parent wants to mark something done before logging the details
- A retrospective entry logged through the Logger also covers this planned activity

### 8.3 Visual change on completion

| Property | Planned state | Completed state |
|---|---|---|
| Opacity | 1.0 | 0.55 |
| Border colour | Default (`--border`) | Sage border (`rgba(74, 222, 128, 0.3)`) |
| Background | `--coffee-light` | Gradient with faint sage tint |
| Title text | Normal | Line-through (1px, muted colour) |
| Done badge | Hidden | Visible: "✓ Logged" in sage pill |
| Toggle button | Empty circle, muted border | Filled sage circle with dark checkmark |
| Cursor | Grab (draggable) | Pointer (not draggable) |
| Remove button | Visible on hover | Hidden |

### 8.4 Undo / un-complete

Tapping the toggle button on a completed card reverts it to planned state. The visual change reverses. This covers accidental toggles.

If completion was triggered automatically (from a saved Learning Entry), un-completing the planner card does not delete the Learning Entry. The Learning Entry exists independently. The planner card simply reverts to showing as "planned" while the underlying learning record remains intact. Re-toggling to completed will re-link to the same entry.

### 8.5 Logging prompt on manual toggle

When a parent manually toggles a card to completed (not via the automatic Module Experience pipeline), the system should surface a gentle prompt:

> "You marked 'Kitchen Chemistry' as done — want to capture what happened?"
>
> [Log it →]  [Not now]

"Log it" opens the Retrospective Logger pre-filled with the module title, subject tags, and date. "Not now" dismisses — a `log_invitation` notification will appear later as part of the standard notification flow.

This prompt only appears on manual toggle. The automatic completion path assumes logging already happened (because the trigger is a saved Learning Entry).

### 8.6 Past week editing restriction

Past weeks are read-only with one exception: the manual completion toggle. A parent may realise on Monday that they forgot to mark Friday's activity as done. They can navigate to the previous week and toggle the completion state. They cannot add, remove, or move cards in past weeks.

---

## 9. Multi-Child Context — Functional Specification

### 9.1 Child assignment model

By default, planner entries are family-wide — they apply to all active learners. This matches the most common homeschool pattern where siblings do the same module together (possibly at different levels).

A planner entry can optionally be assigned to specific children. This covers scenarios like:
- "Fractions & Fair Shares is for Emma only — Liam is too young"
- "Move & Play is for Liam while Emma does her reading"

### 9.2 Assignment UI

When adding a module to the planner (via drop or tap), it defaults to family-wide (no child indicator). To assign to specific children, the parent taps the card in the grid to expand an inline detail view, which includes a child selector using the family's colour-coded chips (Emma=rose, Liam=blue).

On the card in the grid, assigned children appear as small coloured dots (8px diameter) below the chunk line, using each child's palette colour. If all children are assigned (or no specific assignment), no dots appear — the absence of dots means "everyone."

### 9.3 Subject balance scope

Subject balance calculates family-wide. If "Fractions & Fair Shares" is assigned only to Emma, it still counts toward the family's Maths balance. The rationale: the family is doing maths this week, regardless of which child is doing it. Per-child subject balance is available on the HEU Report screen, where per-learner compliance tracking matters.

### 9.4 Child shapes in the planner

Family Settings defines each child's abstract shape and colour. Only the colour dots appear on planner cards — the full shapes are too detailed for the compact card layout. The dots are the minimum viable child indicator.

---

## 10. Weekly Reflection — Functional Specification

### 10.1 Position and visibility

The reflection section sits below the planner table, inside the same scrollable container. It is collapsible: default state is collapsed, showing only the header bar with an expand toggle.

### 10.2 When to surface

The reflection is always present in the DOM. It does not conditionally appear based on completion counts. However:

- **Start of week (Mon–Wed):** Header shows "Optional — capture what stood out this week"
- **End of week (Thu–Fri):** Header shifts to "How did this week go?" with a slightly warmer tone
- **If ≥3 modules completed:** The section auto-expands on page load (can be collapsed by the parent)

### 10.3 Three prompts

| Prompt | Label | Placeholder | Intent |
|---|---|---|---|
| ✨ What sparkled? | Joy/curiosity | "A moment of curiosity or joy this week..." | Positive capture — what was the highlight? |
| 🌱 What's growing? | Growth/development | "Skills or understanding developing..." | Progress awareness — what's emerging? |
| 🔄 What to adjust? | Iteration | "Anything to tweak for next week..." | Practical reflection — what to change? |

These three prompts are fixed for MVP. They are not configurable per family. They map to a standard reflective practice cycle (appreciate → observe → iterate) that is pedagogy-neutral.

### 10.4 Data storage

Weekly reflections are stored as their own record type, not as Learning Entries. Schema:

```
weekly_reflections {
  id: UUID
  family_id: UUID
  week_start_date: DATE  (Monday of the week)
  sparkled: TEXT
  growing: TEXT
  adjust: TEXT
  created_at: TIMESTAMPTZ
  updated_at: TIMESTAMPTZ
}
```

Each family has at most one reflection per week. Saving is auto-save (debounced, same pattern as Logger). There is no explicit "save" button — typing and pausing auto-saves.

### 10.5 AI consumption

The AI Intelligence Layer reads weekly reflections as an input to the Family Intelligence Snapshot. Reflection text can inform:
- Recommendation refinement ("parent mentioned wanting more outdoor time" → weight outdoor modules higher)
- Nudge copy personalisation ("You mentioned wanting to try more science — here's one")
- HEU Report narrative generation (reflection quotes can be surfaced as parent voice in reports)

Reflections are not displayed on any other screen. They are a private input surface. The parent writes for themselves; the platform listens.

---

## 11. Week Navigation — Functional Specification

### 11.1 Header navigation

The week label sits between two navigation arrows (‹ ›) in the header:

```
[ ‹ ]   Week of Feb 10   [ › ]
          Term 1 · Week 6
```

The primary line shows the Monday date of the displayed week. The secondary line shows the school term and week number (calculated from the family's HEU term dates in Family Settings).

### 11.2 Navigation behaviour

| Action | Result |
|---|---|
| Tap ‹ | Load previous week. Brief opacity transition on the label. |
| Tap › | Load next week. Brief opacity transition on the label. |
| Tap week label | Jump to current week (if viewing a past/future week). Acts as a "Today" shortcut. |

Data loads from PostgreSQL (`planner_entries WHERE week_start_date = [target Monday]`). If no entries exist for the target week, the grid shows empty slots with the "+" hints.

### 11.3 Past weeks

Past weeks display as read-only with completed/incomplete state intact. Cards cannot be added, removed, or reordered. The only interactive element is the completion toggle (see Section 8.6). The bottom panel is hidden when viewing past weeks — there's nothing to add.

### 11.4 Future week planning

Parents can navigate forward to plan weeks in advance. There is no hard limit on how far ahead — but practical limits apply:

- Recommendations are only generated for the current week (the AI layer doesn't predict coverage gaps weeks ahead)
- The bottom panel's recommendation section is replaced with a note: "Recommendations appear during the current week"
- The full catalog remains available for forward planning

### 11.5 Recurring activities

MVP does not support recurring activities (e.g., "Maths every Monday morning"). This is a future feature. For now, parents manually add modules to each week. The recommendation engine may suggest the same module if a streak is active, approximating recurrence.

---

## 12. Notification Integration

The Weekly Planner is both a producer and consumer of notifications, as defined in `hearth-notification-system-spec.md`.

### 12.1 Notifications produced by planner state

| Trigger condition | Notification type | Timing |
|---|---|---|
| Planned activity within next 2 hours | `prep_reminder` (Tier 3) | Morning check for AM activities; midday check for PM activities |
| Module session completed without log | `log_invitation` (Tier 3) | Fires when Module Experience session ends without saving a log entry |
| End of day with unlogged planned activities | `log_invitation` (Tier 3) | 6:00 PM (or family-configured quiet hour start) |
| Start of week (Monday morning) | Implicit via Dashboard | Dashboard surfaces the week's plan summary; no separate notification |

### 12.2 Notifications that route to the planner

None directly. Planner-originated notifications route to Module Experience (prep reminder → Prep mode) or Logger (log invitation → Logger or Module Log mode). The Planner itself is not a notification destination — it's a planning surface, not an action surface.

### 12.3 Prep reminder timing

The `prep_reminder` fires based on the session slot, not a precise time:

- Morning planned activity → notification fires at the configured "morning start" time (default 8:30 AM, family-configurable)
- Afternoon planned activity → notification fires at configured "afternoon start" time (default 12:30 PM, family-configurable)

These times are soft suggestions. The notification appears, the parent can act on it when ready.

---

## 13. Data Model

### 13.1 Planner entry schema

```sql
CREATE TABLE planner_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) NOT NULL,
  
  -- Temporal placement
  date DATE NOT NULL,
  session_slot VARCHAR(20) NOT NULL,  -- 'morning' | 'afternoon'
  sort_order INTEGER NOT NULL DEFAULT 0,  -- position within slot
  
  -- Content reference
  module_id VARCHAR(100),          -- Sanity module._id (nullable for ad-hoc entries)
  activity_id VARCHAR(100),        -- Sanity activity._id (nullable)
  
  -- Denormalised display fields (for rendering without Sanity)
  title VARCHAR(255) NOT NULL,
  chunk_label VARCHAR(255),        -- "Comparing fractions with food"
  subject_primary VARCHAR(50),     -- 'english' | 'maths' | 'science' | etc.
  subjects TEXT[],                 -- All subjects: {'arts','science','english'}
  duration_minutes INTEGER,
  
  -- Child assignment
  learner_ids UUID[],              -- Empty array = family-wide
  
  -- State machine
  status VARCHAR(20) NOT NULL DEFAULT 'planned',  -- 'planned' | 'in_progress' | 'completed'
  
  -- Links
  learning_entry_id UUID REFERENCES learning_entries(id),  -- Set when log is saved
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(family_id, date, session_slot, sort_order)
);

CREATE INDEX idx_planner_family_week ON planner_entries (family_id, date);
CREATE INDEX idx_planner_status ON planner_entries (family_id, status);
```

### 13.2 Weekly reflection schema

```sql
CREATE TABLE weekly_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) NOT NULL,
  week_start_date DATE NOT NULL,  -- Always a Monday
  
  sparkled TEXT,
  growing TEXT,
  adjust TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(family_id, week_start_date)
);
```

### 13.3 Relationship to Learning Entries

The `planner_entries.learning_entry_id` field creates a one-to-one link between a planned card and its logged result. This link is set when:

1. Module Experience Log mode saves an entry with a `source_planner_id` in its payload
2. A manual completion toggle triggers and the parent logs via the prompt

For repeat sessions of the same module across different days (e.g., "Story Explorers" on Monday and Thursday), each day creates a separate planner entry and a separate Learning Entry. They share the same `module_id` but are distinct records.

### 13.4 Data sources per field

| Field on screen | Data source | Fallback if Sanity unavailable |
|---|---|---|
| Module title | PostgreSQL (denormalised `title`) | Fully functional |
| Subject chips | PostgreSQL (denormalised `subjects[]`) | Fully functional |
| Duration | PostgreSQL (denormalised `duration_minutes`) | Fully functional |
| Chunk label | PostgreSQL (denormalised `chunk_label`) | Fully functional |
| Recommendation cards | Family Intelligence Snapshot (PostgreSQL) + Sanity for module details | Recommendations degrade; catalog still functional |
| Catalog items | Sanity (module list) with PostgreSQL library filter | Shows empty state with guidance to Activity Discovery |

The planner is designed to be fully functional with only PostgreSQL. The denormalisation strategy means a Sanity outage does not break the planning surface.

---

## 14. Empty & First-Use States

### 14.1 Brand new family, first visit

The planner grid shows all empty slots with "+" hints. The Smart Insights bar is hidden (no data to generate insights from). The bottom panel collapsed state shows:

> "Module Library · Get started"
> [Explore modules to build your week →]

Opening the panel shows the recommendation section with a contextual message:

> "Recommendations will appear once you've added some modules to your library. Start by exploring what's available."
>
> [Open Activity Discovery →]

The catalog section shows the empty library state (Section 5.4).

### 14.2 Empty week (returning family, no plans this week)

The grid shows empty slots. The Smart Insights bar shows normal insights based on past logging history ("Science gap — 14 days"). The bottom panel recommendations are active and populated. The weekly reflection is collapsed.

A gentle contextual note appears above the table (not a blocking modal, not a notification):

> "Nothing planned this week yet. Drag modules from below, or just log what happens — planning is always optional."

This reinforces that the Planner is a tool, not a requirement.

### 14.3 Empty catalog but populated recommendations

If the family has no modules in their library but the system can generate recommendations from membership-included content, the recommendations section works normally. Only the catalog section shows the empty state. This is the most likely first-use scenario — the family hasn't explicitly "added" anything to their library, but included content is available.

---

## 15. Mobile Considerations

### 15.1 Layout adaptation

The 5-column table does not fit on a mobile viewport. Mobile layout adapts:

**Portrait phone (< 640px):**
- Switch from table to a vertical day-card layout (one day at a time, swipeable horizontally)
- Each day card shows Morning and Afternoon sections stacked vertically
- Horizontal swipe navigates between days; the current day is shown by default
- Day pills at the top show Mon–Fri with the active day highlighted
- Subject balance pips move from the header into a collapsible summary row

**Tablet (640px–1024px):**
- Table layout preserved but with narrower columns
- Row labels abbreviated ("AM" / "PM" instead of full vertical text)
- Bottom panel unchanged

### 15.2 Touch interactions

| Desktop interaction | Mobile equivalent |
|---|---|
| Drag from catalog to slot | Tap catalog item → day-picker sheet → session picker |
| Drag card between slots | Long-press card → tap target slot |
| Hover to reveal ✕ button | Swipe left on card to reveal remove action |
| Hover pip for tooltip | Long-press pip for tooltip overlay |
| Click insight card | Tap insight card (same behaviour) |

### 15.3 Bottom panel on mobile

The bottom panel becomes a full-screen sheet on mobile (not 55vh). The collapsed state shows only the grip handle and title. Expanding covers the full viewport with the recommendations and catalog scrollable within.

---

## 16. Integration Points Summary

| Connected screen | Direction | Data exchanged |
|---|---|---|
| Activity Discovery | → Planner | "Add to Day" sends module_id, title, subjects, duration to planner |
| Module Experience | Planner → | Prep reminder notification opens Module Experience Prep mode with planner_entry_id |
| Module Experience Log | → Planner | Saved Learning Entry with source_planner_id triggers completion state update |
| Retrospective Logger | Planner → | Manual completion prompt opens Logger pre-filled with module metadata |
| Notification Centre | Planner → | Planner state generates prep_reminder and log_invitation notifications |
| Dashboard | ← Planner | Dashboard "This Week" summary reads from planner_entries for current week |
| HEU Report | ← Planner | Subject coverage calculations include planned-and-completed entries |
| Family Intelligence Snapshot | ← Planner | Snapshot rebuild reads planner data for recommendation generation |
| Family Settings | → Planner | Weekend configuration, quiet hours, morning/afternoon start times |

---

## 17. Open Questions

### 17.1 Energy matching data source

The Morning=high-energy / Afternoon=low-energy model is a reasonable default, but individual families vary. Should Family Settings include a "family energy pattern" override? Or should the system learn from logging patterns (e.g., "this family logs maths successfully in the afternoon")?

**Recommendation:** Defer learning-based energy profiles to Phase 2. For MVP, use the default Morning=high/Afternoon=low assumption. It works for most families and avoids premature optimisation.

### 17.2 Ad-hoc planner entries

Can a parent add a free-text entry to the planner that isn't linked to a module? Example: "Library visit" or "Nature walk" — unstructured activities that don't have a Sanity module behind them.

**Recommendation:** Yes. Support a "Quick add" entry with just a title and optional subject tag. These create planner entries with null `module_id`. When completed, the manual toggle prompt routes to the Retrospective Logger (which handles unstructured entries natively).

### 17.3 Term / holiday awareness

Should the planner visually indicate school holidays or term breaks? Queensland term dates are knowable. Showing "School holidays — Week 1" in the header could be useful.

**Recommendation:** Display term context in the header sub-line (already present as "Term 1 · Week 6"). During holidays, show "School holidays" instead. Do not suppress or modify planner functionality during holidays — some families school through breaks.

### 17.4 Print view

Some parents prefer a printed weekly plan on the fridge. Should the planner support a print-optimised view?

**Recommendation:** Defer to Phase 2. A `@media print` stylesheet that strips the bottom panel, expands all cards, and uses a clean table layout would serve this need. Low effort, meaningful delight.

### 17.5 Recommendation algorithm cold start

New families have no logging history. What drives recommendations in week 1?

**Recommendation:** Cold-start recommendations use the family's pedagogy profile and selected year levels. A Charlotte Mason family with a Year 2 child sees living books and nature study modules. An unschooling family sees open-ended exploration modules. The content is the same (philosophy-neutral Layer 1), but the recommendation reason text uses the family's philosophical vocabulary.

---

*This specification documents the complete interaction model for Hearth's Weekly Planner as designed in prototype v3. It should be read alongside the System Interaction Map (cross-screen coherence), the Notification System Spec (trigger rules), and the HCMS Strategy (data source architecture).*
