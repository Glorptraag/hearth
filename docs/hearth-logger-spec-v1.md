# Hearth LMS — Retrospective Logger v2
## UX & Functional Design Specification

**Screen:** `hearth-logger-workspace-v2.html`
**Status:** Design complete, specification ready for development handoff
**Last updated:** March 2026
**Companion files:** `Hearth_AI_Intelligence_Layer_Architecture.md`, `Hearth_System_Interaction_Map.md`, `hearth-badge-assessment-spec.md`

---

## 1. Purpose & Scope

The Retrospective Logger is the most-used screen in Hearth. It captures learning that has already happened — a parent sits down (often at the end of the day) and records what their children did, how they engaged, and what they discovered. The screen's job is to make that capture feel quick and rewarding, while silently producing the structured data that feeds Portfolio, HEU Report, Capabilities Constellation, and Dashboard.

This spec documents every field, interaction pattern, data flow, and edge case in the v2 workspace layout. It does not propose redesign; it codifies the existing prototype for unambiguous development.

**We'll know this works when:** a parent's median time from opening `/log` to save is under 5 minutes (`entry_created` timing); she logs a second entry within 7 days of her first (the retention hinge, journey Stage 2→3); and enrichment surfaces after save are *seen*, not just produced (`hearth-parent-journey-v1.md` Stage 2 — instrumentation pending).

---

## 2. Design Decisions & Rationale

### 2.1 Workspace, not conversation

V1 used a conversational chat interface ("tell me what happened"). V2 replaced this with a structured workspace — a visible evidence checklist where the parent fills sections using tap-driven tools. The reasons:

- Parents need to see what's expected upfront, not discover it through a branching dialogue
- A workspace allows non-linear completion (fill what you remember, skip back later)
- The completeness gate is meaningless if the parent can't see how far they've progressed
- Chat-style input felt slow for parents who wanted to tap-and-go

### 2.2 Two-column layout with live insights

The left column is the capture form. The right column is the AI insights panel. This separation serves distinct cognitive modes: the left is recall ("what happened?"), the right is reflection ("what does it mean?"). The insights panel updates as fields are filled, giving the parent immediate feedback that their freeform input has educational value. This is the core emotional payoff of logging — the system reveals learning the parent didn't know was there.

### 2.3 Completeness gate at 50%

The save button is disabled until the completeness score reaches 50%. This is not a punitive gate — it is a minimum evidence threshold. Entries below 50% lack enough structured data for the AI enrichment pipeline to produce meaningful results. The gate protects the parent from saving entries that won't generate useful portfolio entries, curriculum mappings, or badge progress.

The threshold is set low enough that a parent can save with just children selected, a short description, and engagement ratings — roughly 90 seconds of input. No override is provided because entries below the threshold produce misleading downstream data (incomplete curriculum coverage, uncontextualised evidence).

### 2.4 Per-child differentiation within a single entry

When multiple children participate in the same activity, the Logger creates one entry with per-child data — not N duplicate entries. Engagement emojis and discovery text fields are keyed by `learner_id` and colour-coded to each child's abstract shape colour (Emma = rose, Liam = blue). This model reflects the reality that siblings in the same activity often have different experiences.

### 2.5 Observation chips over freeform tagging

Section 5 (Observations) uses pre-defined tap chips grouped into four categories (Engagement, Social, Thinking, Emotional) rather than freeform text entry. Reasons:

- Consistent vocabulary feeds better AI enrichment downstream
- Tap-driven interaction is faster than typing for the parent
- Categories prompt parents to notice dimensions of learning they might otherwise overlook
- The observation vocabulary was designed to map cleanly to capability thread descriptors

### 2.6 Evidence is optional but encouraged

Section 6 (Evidence) carries the label "Optional but strengthens the record." Photos, quotes, notes, and resource links are not required for the completeness gate but contribute 10 points. The framing avoids guilt while communicating HEU compliance value — work samples are the strongest evidence for Home Education Unit reporting.

### 2.7 Voice input as first-class alternative

A voice dictation button sits below the description textarea. Busy parents (especially those logging while supervising younger children) need hands-free input. The implementation uses the Web Speech API with `en-AU` locale and appends to existing text, supporting incremental voice capture across interruptions.

### 2.8 Client-side insights, server-side enrichment

The live insights panel uses client-side keyword matching — not LLM calls — for immediate responsiveness. The expensive AI enrichment (capability thread mapping, curriculum descriptors, quality scoring) runs once on save via a single Haiku API call. This split keeps the Logger fast during use and defers cost to the write event.

---

## 3. Section-by-Section Field Specification

The capture form contains six sections, displayed vertically in the left column. Sections are numbered 1–6 with circular indicators that show completion state.

### 3.1 Section 1: Who Was Learning?

**Purpose:** Select which children participated in this activity.

| Field | Type | Required | Interaction | Validation |
|-------|------|----------|-------------|------------|
| `learner_ids[]` | Multi-select | Yes (≥1) | Tap child chip to toggle selection | At least one child must be selected before save |
| `together` | Boolean | No | Toggle switch, visible only when 2+ children selected | None |

**Child chips:** Each child appears as a pill chip with their abstract shape avatar (gradient circle: Emma = pink→rose, Liam = blue→indigo), their name, their age, and a circular checkbox. Tapping toggles selection. Selected chips gain ember-glow background and ember border.

**Together toggle:** Appears below the chip group when 2+ children are selected. Default off. Toggle switch with label "They did this together." This metadata helps the enrichment pipeline — activities done together imply collaboration; separate activities at the same time imply independent work.

**Completeness contribution:** 20 points for having ≥1 child selected.

**Section completion indicator:** Number circle turns ember with checkmark when ≥1 child selected.

**Insights panel trigger:** Child selection alone does not trigger insights. It enables the per-child sections below and is a prerequisite for insight generation (which also requires description or activity type).

**Default state:** No children selected. Together toggle hidden.

### 3.2 Section 2: What Happened?

**Purpose:** Capture the activity description, per-child discoveries, and activity type.

This section contains three sub-components: the shared description textarea, per-child discovery fields, and the activity type grid.

#### 3.2a Shared Description

| Field | Type | Required | Interaction | Validation |
|-------|------|----------|-------------|------------|
| `description` | Freeform text | Yes (>20 chars for full points) | Textarea with voice input button | Min length for completeness scoring; no hard max |

**Textarea:** Full-width, Crimson Text serif font, 1rem, min-height 100px, resizable vertically. Placeholder copy: *"Describe the activity or moment... What were they doing? Where did it happen?"*

**Character count:** Shown below-right of textarea. Displays as "{N} characters" when any text is entered. No count shown when empty.

**Voice input button:** Below-left of textarea. Displays microphone icon + "Voice" label. When active, button gains recording state (ember background, pulse animation, label changes to "Stop"). Uses `webkitSpeechRecognition` / `SpeechRecognition` API with `continuous: true`, `interimResults: true`, `lang: 'en-AU'`. Appends transcript to existing text (does not overwrite). Falls back to alert if API unavailable.

**Completeness contribution:** 15 points if >20 characters; 5 points if 1–20 characters.

**Section completion indicator:** Number circle turns ember with checkmark when description >20 characters AND activity type is selected.

**Insights panel trigger:** Description text triggers insight generation on 800ms debounce after the text exceeds 20 characters. The keyword matcher scans the description for subject keywords, capability thread keywords, and engagement vocabulary.

#### 3.2b Per-Child Discoveries

**Purpose:** Capture what each individual child noticed, said, or figured out — differentiated from the shared description.

| Field | Type | Required | Interaction | Validation |
|-------|------|----------|-------------|------------|
| `per_child_data[learner_id].discoveries` | Freeform text per child | No | One textarea per selected child, colour-coded | None |

**Layout:** Appears below the shared description, separated by a divider with label "Individual Discoveries." One discovery block per selected child. Each block has:

- A coloured indicator dot (child's colour) + label: *"What did {name} notice or discover?"*
- A textarea with placeholder: *"Something they said, wondered about, or figured out..."*
- Child-colour border on the container (e.g., rose border for Emma, blue for Liam)
- Focus state uses the child's colour for the border and shadow ring

**Empty state:** When no children are selected, displays italic muted text: *"Select learners above to capture what each child noticed."*

**Character limits:** None enforced. Discovery fields are intentionally low-pressure.

**Completeness contribution:** 10 points total, proportional to children with discoveries >10 characters. If 1 of 2 children has a discovery, 5 points. If both, 10 points.

**Insights panel trigger:** Discovery text content feeds into keyword matching alongside the shared description.

#### 3.2c Activity Type

**Purpose:** Quick categorisation of the activity's nature.

| Field | Type | Required | Interaction | Validation |
|-------|------|----------|-------------|------------|
| `activity_type` | Single-select | No (but contributes to completeness) | Tap card to select; tap again to deselect | Only one active at a time |

**Activity type options (8 cards):**

| ID | Label | Emoji |
|----|-------|-------|
| `nature` | Nature Study | 🌿 |
| `cooking` | Kitchen Science | 🍳 |
| `reading` | Reading | 📖 |
| `art` | Creative Arts | 🎨 |
| `physical` | Physical | ⚽ |
| `social` | Social | 🤝 |
| `structured` | Lesson | 📝 |
| `freeplay` | Free Play | ✨ |

**Layout:** Responsive grid, `repeat(auto-fill, minmax(120px, 1fr))`, 8px gap. On mobile, 4 columns. Each card is a vertical stack: emoji icon (1.375rem) + label (0.6875rem, uppercase-style weight). Selected card gains ember border and ember-glow background.

**Completeness contribution:** 5 points when any type is selected.

**Insights panel trigger:** Activity type selection is a primary trigger for insight generation. The keyword matcher checks activity type first, then falls back to description text scanning. Selecting an activity type immediately generates insights if a child is also selected.

### 3.3 Section 3: How Engaged Were They?

**Purpose:** Per-child engagement rating using emoji selectors.

| Field | Type | Required | Interaction | Validation |
|-------|------|----------|-------------|------------|
| `per_child_data[learner_id].engagement` | Single-select per child | No (but strongly weighted in completeness) | Tap emoji button; tap again to deselect | Only one engagement level per child |

**Layout:** One row per selected child. Each row contains the child's colour indicator dot, their name, and four emoji buttons in a horizontal group.

**Engagement emoji options:**

| Value | Emoji | Tooltip | Meaning |
|-------|-------|---------|---------|
| `loved` | 😊 | Loved it | High enthusiasm, deep engagement |
| `engaged` | 🙂 | Engaged | Positive, attentive participation |
| `okay` | 😐 | Okay | Neutral engagement, went along |
| `struggled` | 😕 | Struggled | Found it challenging or resistant |

**Emoji button styling:** 36×36px, subtle border, 0.6 opacity by default. On hover: full opacity, slight scale-up (1.05×). Selected state: full opacity, child-colour muted background, child-colour border, 1.1× scale. This uses CSS custom properties `--child-color` and `--child-color-muted` set on the parent row.

**Empty state:** When no children are selected: *"Select learners above to rate their engagement."*

**Completeness contribution:** 15 points if ALL selected children have engagement rated. Partial credit: proportional points (e.g., 1 of 2 children rated = ~7 points, calculated as `Math.floor((withEngagement / totalChildren) * 10)` for partial, 15 for complete).

**Section completion indicator:** Number circle turns ember with checkmark only when all selected children have engagement rated.

**Insights panel trigger:** Engagement selection feeds into insight generation. Combined with description and activity type, it enables richer insight cards.

### 3.4 Section 4: When & Where

**Purpose:** Temporal and spatial context for the learning event.

This section contains three chip groups arranged in a horizontal flex row that wraps on narrow screens.

#### 3.4a When

| Field | Type | Required | Interaction | Validation |
|-------|------|----------|-------------|------------|
| `when` | Single-select | Pre-selected | Tap chip to select | Always has a value (default: "Today") |

**Options:** Today (default selected), Yesterday, Earlier.

**Behaviour:** "Today" is pre-selected on load. Tapping another option deselects the current one. In production, "Earlier" should open a date picker — the prototype uses a simple chip toggle.

**Completeness contribution:** 3 points (always awarded since "Today" is pre-selected).

#### 3.4b Duration

| Field | Type | Required | Interaction | Validation |
|-------|------|----------|-------------|------------|
| `duration` | Single-select (toggle) | No | Tap chip to select; tap selected chip to deselect | None |

**Options:** ~5 min, ~15 min, ~30 min, 1 hr+.

**Behaviour:** Tapping a selected chip deselects it (returns to null). Only one option active at a time.

**Completeness contribution:** 3 points when any duration is selected.

#### 3.4c Where

| Field | Type | Required | Interaction | Validation |
|-------|------|----------|-------------|------------|
| `where` | Single-select (toggle) | No | Tap chip to select; tap selected chip to deselect | None |

**Options:** 🏠 Home, 🌳 Outdoors, 🏛 Community, 💻 Online.

**Behaviour:** Same toggle-deselect pattern as duration.

**Completeness contribution:** 4 points when any location is selected.

**Section completion indicator:** Number circle turns ember with checkmark when either duration or where is selected.

**Default state:** "Today" pre-selected. Duration and Where are null.

### 3.5 Section 5: What Did You Observe?

**Purpose:** Structured observation capture using pre-defined vocabulary chips grouped by learning dimension.

| Field | Type | Required | Interaction | Validation |
|-------|------|----------|-------------|------------|
| `observations[]` | Multi-select | No | Tap chip to toggle; unlimited selections | None |

**Observation categories and chips:**

**Engagement** (sage green):
- Deeply focused
- Curious
- Enthusiastic
- Reluctant at first
- Easily distracted
- Self-directed

**Social** (blue):
- Worked alone
- Collaborated
- Led others
- Asked for help
- Taught someone
- Negotiated / compromised

**Thinking** (violet):
- Asked questions
- Tried alternatives
- Persisted through difficulty
- Made connections
- Self-corrected
- Explained reasoning

**Emotional** (rose):
- Proud of work
- Joyful
- Calm & settled
- Frustrated → resolved
- Surprised / delighted
- Confident

**Layout:** Each category has a label row (coloured dot + uppercase category name) followed by a flex-wrap row of pill chips. Unselected: muted text, subtle border. Selected: category-specific muted background colour and matching border colour.

**Completeness contribution:** 15 points if ≥3 observations selected. Partial: 5 points per observation chip for 1–2 selections (5 for 1, 10 for 2).

**Section completion indicator:** Number circle turns ember with checkmark when ≥1 observation is selected.

**Insights panel trigger:** Observation selections feed into keyword matching and insight generation.

### 3.6 Section 6: Evidence

**Purpose:** Attach supporting artefacts to strengthen the learning record and HEU compliance.

**Header:** Label "Evidence" with optional note: *"Optional but strengthens the record."*

**Evidence tools grid:** 2-column grid (1-column on mobile). Four tool cards:

| Tool | Emoji | Label | Hint | Opens |
|------|-------|-------|------|-------|
| Photo | 📷 | Add Photo | Work sample, activity | Photo upload modal |
| Quote | 💬 | Child's Words | Something they said | Quote input modal |
| Note | 📝 | Add Note | Extra detail or context | Note input modal |
| Resource | 🔗 | Link Resource | Book, video, website | Resource input modal |

**Tool card styling:** Dashed border by default. On hover: solid border, slightly elevated background. When evidence of that type exists: solid sage-green border, sage-green muted background, sage-coloured icon.

**Evidence modals:** Each tool opens a modal overlay. All modals share the same chrome: title bar with emoji + label, close button (X), content area, and Cancel/Add button pair.

| Modal | Input Fields | Add Button State |
|-------|-------------|-----------------|
| Photo | File upload dropzone (tap to browse, 16:10 aspect), optional caption text input | Disabled until photo selected |
| Quote | Textarea, placeholder: *"What did they say? E.g. 'Look, it rolls into a ball when I touch it!'"* | Enabled when text entered |
| Note | Textarea, placeholder: *"Any additional context, background, or detail worth recording..."* | Enabled when text entered |
| Resource | Name input (placeholder: *"Resource name (e.g. 'Diary of a Wombat')"*), optional URL input | Enabled when name entered |

**Evidence items display:** Below the tools grid, evidence items appear in a vertical list. Each item shows: type badge (emoji + uppercase label), content preview (italic serif, single-line truncated), and a remove button (X circle). Photo items additionally show a 48×48px thumbnail.

| Field | Type | Interaction |
|-------|------|-------------|
| `evidence[]` | Array of objects | Add via modals; remove via X button on each item |

**Evidence item schema:**

```
{
  type: 'photo' | 'quote' | 'note' | 'resource',
  content: string,       // caption, quote text, note text, or resource name
  src?: string,          // base64 data URL (photos only)
  url?: string           // external URL (resources only)
}
```

**Completeness contribution:** 10 points for ≥2 evidence items. 5 points for exactly 1 item.

**Section completion indicator:** Number circle turns ember with checkmark when ≥1 evidence item exists.

---

## 4. Completeness Gate Logic

### 4.1 Scoring Table

| Section | Field | Max Points | Scoring Rule |
|---------|-------|-----------|--------------|
| 1. Who | `learner_ids[]` | 20 | 20 if ≥1 child selected; 0 otherwise |
| 2. What | `description` | 15 | 15 if >20 chars; 5 if 1–20 chars; 0 if empty |
| 2. What | `activity_type` | 5 | 5 if selected; 0 otherwise |
| 2. What | Per-child discoveries | 10 | Proportional: `floor((children_with_discoveries / total_children) × 10)` where "with discoveries" means >10 chars |
| 3. Engagement | Per-child engagement | 15 | 15 if ALL children have engagement; partial: `floor((children_with_engagement / total_children) × 10)` |
| 4. When/Where | `when` | 3 | 3 (always awarded — pre-selected "Today") |
| 4. When/Where | `duration` | 3 | 3 if selected; 0 otherwise |
| 4. When/Where | `where` | 4 | 4 if selected; 0 otherwise |
| 5. Observations | `observations[]` | 15 | 15 if ≥3 selected; `5 × count` if 1–2 |
| 6. Evidence | `evidence[]` | 10 | 10 if ≥2 items; 5 if 1 item; 0 otherwise |
| **Total** | | **100** | |

Score is capped at 100.

### 4.2 Save Threshold

**Save is enabled at score ≥ 50.**

The minimum viable save path (reaching exactly 50) requires approximately: 1 child selected (20) + description >20 chars (15) + all engagement rated for 1 child (15) = 50. This represents roughly 60–90 seconds of input.

### 4.3 Visual Feedback

**Completeness ring:** Displayed in the header, right-aligned. A 40×40px circular SVG with a track circle and a progress arc (stroke-dashoffset animation). The arc colour is ember (#D97B3A) below 90%, switching to sage green (#4ADE80) at 90%+. A percentage label sits centred inside the ring.

**Completeness label (desktop only):** Adjacent to the ring. Two lines: a bold level name and a muted hint. Hidden on mobile via media query.

| Score Range | Level Name | Hint |
|-------------|-----------|------|
| 0–19 | Getting Started | Select who was learning |
| 20–39 | Basic | Describe what happened |
| 40–54 | Good | Rate engagement for each child |
| 55–69 | Strong | Add observations |
| 70–89 | Great | Add evidence for richer record |
| 90–100 | Excellent | Ready to save |

**Save button:** In the header, right of the completeness ring. Disabled state: muted text, coffee-light background, not-allowed cursor, 50% opacity. Enabled state (≥50): ember background, inverse text, pointer cursor, full opacity. Hover on enabled: ember-hover background with glow shadow.

**Section number indicators:** Each section's circled number transitions to ember background with a checkmark (✓) when that section's completion condition is met. The number text is hidden via CSS when in the "done" state. Completion conditions per section:

| Section | Done When |
|---------|-----------|
| 1. Who | ≥1 child selected |
| 2. What | Description >20 chars AND activity type selected |
| 3. Engagement | All selected children have engagement rated |
| 4. When & Where | Duration OR Where is selected |
| 5. Observations | ≥1 observation chip selected |
| 6. Evidence | ≥1 evidence item exists |

### 4.4 No Override

There is no mechanism to save below 50%. The rationale, framed as the parent outcome it protects: a below-threshold entry can't generate the translation that is the whole point of logging — it would land in her portfolio as a thin line that documents nothing, inflate her sense of curriculum coverage with evidence that wouldn't survive a regulator's reading, and quietly mis-count toward badges her child hasn't yet earned. The gate protects the parent's *own future confidence* in what her records say: when she opens the compliance report at renewal time (journey Stage 4), everything in it must be load-bearing. Mechanically: entries below the threshold lack sufficient data for the AI enrichment pipeline, and a low-quality entry that appears in a compliance report is worse than no entry at all.

---

## 5. AI Insights Panel Behaviour

### 5.1 Panel Layout

**Desktop (≥1024px):** Fixed-width right column, 400px (440px on ≥1280px screens). Scrollable independently from the capture form. Subtle border-left separator. Persists on screen at all times.

**Mobile (<1024px):** Collapsible bottom drawer. Starts in collapsed state showing only a drag handle (36×4px bar). Tapping the handle or pulling up expands the drawer to max 60vh. The drawer has top border-radius (24px) and a drop shadow upward. When new insights are generated, the drawer pulses briefly (translates up 24px then back) to signal fresh content.

### 5.2 Panel Header

Persistent across all states. Contains: an ember circular icon with brain/flame SVG, the title "Hearth Insights" in serif font, and (in the prototype) a "Demo" badge. In production, the Demo badge is removed.

### 5.3 Empty State (No Insights Yet)

Displayed when the form has insufficient data to generate insights (no children selected, or no description/activity type). Shows a centred layout with a muted smiley-face SVG icon (48×48px, 0.4 opacity) and the message: *"Start describing the activity and I'll begin finding the learning within it."*

### 5.4 Insight Generation Triggers

Insights generate when ALL of these conditions are met:

1. At least one child is selected (`state.children.length > 0`)
2. Either the description has ≥10 characters OR an activity type is selected

**Trigger flow:**

- Selecting a child → calls `maybeGenerateInsights()`
- Description text change → 800ms debounce → calls `maybeGenerateInsights()` (only if >20 chars)
- Activity type selection → calls `maybeGenerateInsights()`
- Engagement emoji selection → calls `maybeGenerateInsights()`
- Discovery text change → calls `maybeGenerateInsights()`
- Observation chip toggle → calls `maybeGenerateInsights()`

### 5.5 Keyword Matching Approach (MVP)

The insights panel in MVP uses client-side keyword matching, not LLM calls. The matcher runs synchronously when `maybeGenerateInsights()` is called.

**Resolution priority:**

1. If `activity_type` is set, use it as the scenario key directly
2. If no activity type but description exists, scan the description against keyword patterns:
   - `nature`: bug, nature, outside, garden, rock, tree, bird, leaf, ant
   - `cooking`: cook, bake, kitchen, recipe, measure, pizza, cake, bread, food
   - `reading`: read, book, story, chapter, library, page
   - `art`: draw, paint, art, craft, build, make, glue, cut, rocket
3. First match wins. If no match, no insights are generated (empty state persists)

**De-duplication:** Once insights for a scenario have been rendered, the same scenario is not re-rendered on subsequent triggers. The `state.insightsGenerated` flag stores the current scenario ID.

**Production upgrade path:** The keyword matcher will be replaced by the full keyword matcher specification from the AI Intelligence Layer Architecture (Part 11.3), which covers 8 subject areas (~25 keywords each), 57 capability threads (~5 keywords each), and engagement vocabulary. The matcher runs on 1.5s debounce and returns `{ subjects[], threads[], engagement }`.

### 5.6 Insight Card Types

When insights are generated, the panel populates with four card types in order:

#### Card 1: Subjects Detected

- **Label:** "Subjects Detected" with ember dot
- **Content:** A flex-wrap row of subject tag pills. Primary subject gets ember styling (ember-glow background, ember border, ember text). Secondary subjects get neutral styling (coffee-dark background, subtle border)
- **Interaction:** Display only in MVP. In production, tapping a subject tag could confirm or dismiss the suggestion.

#### Card 2: Philosophy Lens

- **Label:** "Philosophy Lens" with violet dot
- **Content:** A title in serif (e.g., "What Charlotte Mason Would Notice") and a paragraph of reflective analysis connecting the logged activity to the family's pedagogical framework
- **Note:** In production, this card's title and content are selected from the family's pedagogy overlay template set in Sanity CMS. The prototype hardcodes Charlotte Mason examples.
- **Interaction:** Display only.

#### Card 3: Suggested Next Steps

- **Label:** "Suggested Next Steps" with sage dot
- **Content:** 2–3 suggestion rows. Each row has an emoji icon (28×28px), a bold title, a description line, and a time estimate (muted text, e.g., "~15 min")
- **Interaction:** Display only in MVP. In production, tapping a suggestion could add it to the Weekly Planner or open Activity Discovery pre-filtered.

#### Card 4: Badge Progress

- **Label:** "Badge Progress" with ember dot
- **Content:** A card containing a badge icon (40px ember gradient circle with star), badge name, contribution text (e.g., "+15% from this activity"), and a progress bar (4px, ember fill)
- **Conditional display:** Only shown when the current scenario has badge data
- **Badge prompt button:** If progress ≥70%, an additional "🎉 Award Badge Now" button appears below the badge card. In MVP this triggers an alert; in production it initiates the badge assessment flow.
- **Interaction:** The award button transitions to the badge assessment screen (see Section 7.3).

### 5.7 Insight Panel States Summary

| Condition | Panel Content |
|-----------|--------------|
| No children selected | Empty state: smiley icon + "Start describing..." |
| Children selected, no description or type | Empty state (same) |
| Children + description/type, no keyword match | Empty state (same) — no matching scenario found |
| Children + description/type, keyword match found | Full insight cards: Subjects + Philosophy + Next Steps + Badge |

### 5.8 Insight Card Interactivity (Production Roadmap)

In MVP, all insight cards are display-only. The production roadmap includes:

- **Subject tags:** Tap to confirm (moves to "confirmed" state) or dismiss (removes with animation). Confirmed subjects persist on the entry; dismissed ones are excluded from enrichment.
- **Next steps:** Tap "Add to Planner" icon to push to Weekly Planner. Tap "Save" icon to bookmark for later.
- **Badge prompt:** Tap triggers badge assessment transition (already prototyped).

---

## 6. Per-Child Interaction Model

### 6.1 Child Selection Flow

The "Who was learning?" chip group is the first section. It drives the visibility and content of all per-child sections downstream.

**Selection cascade:**

1. Parent taps a child chip → `toggleChild(id)` fires
2. Child added to `state.children[]`; `initPerChildData(childId)` creates the per-child data stub
3. `renderPerChildSections()` re-renders both the engagement section (3) and discovery fields (within section 2)
4. `updateCompleteness()` recalculates the score
5. `maybeGenerateInsights()` checks if insight conditions are now met

**Deselection cascade:**

1. Parent taps a selected child chip → chip deselects
2. Child removed from `state.children[]`; `per_child_data[id]` deleted
3. Per-child sections re-render (child's row disappears)
4. If `children.length < 2`, together toggle hides and `state.together` resets to false
5. Completeness recalculates (engagement score may change if the removed child was the only unrated one)

### 6.2 Single-Child vs Multi-Child Visual Treatment

**Single child:** Per-child sections show one engagement row and one discovery block. The child's colour is still shown (not neutral) for consistency.

**Multi-child:** Multiple engagement rows stacked vertically, each with their child's colour. Multiple discovery textareas stacked vertically, each with child-colour border. The together toggle becomes visible.

### 6.3 Per-Child Data Initialisation

When a child is selected, the data structure is created:

```javascript
per_child_data[childId] = {
  engagement: null,    // 'loved' | 'engaged' | 'okay' | 'struggled'
  discoveries: ''      // freeform text
}
```

This structure is keyed by `learner_id` and travels through the save pipeline into the Learning Entry object.

---

## 7. Save Flow and Post-Save Behaviour

### 7.1 Save Action

When the save button is tapped (only possible at ≥50% completeness):

1. `saveEntry()` checks `getCompleteness().canSave` — returns immediately if false
2. `checkBadgeThreshold()` evaluates whether any badge has reached ≥70% progress
3. If badge threshold met → show badge transition overlay (Section 7.3)
4. If no badge threshold → show standard save success overlay

### 7.2 Standard Save Success

> **Revised 2026-05-18 (D-LPS-1, D-LPS-2, D-LPS-3).** What was a single overlay is now branched by entry density. Source of record: `docs/hearth-logger-post-save-resolution-v1.md`.

The form **morphs in place** into a post-save second screen — not an overlay, not a sheet. Reinforces capture → seen as one continuous act. Exit is parent-controlled; nothing auto-dismisses on the substantive path.

**Density branch:**

| Entry shape | Behaviour |
|---|---|
| **Thin** (description < 60 chars AND no Guided observation chips AND no evidence) | Existing fast "Moment Saved ✨" toast unchanged. Auto-dismiss ~2s. No second screen. |
| **Substantive, pending** | Inline morph. Heading: "Saved — reading this moment…" + skeleton block. Resolves into enriched or failed when Haiku returns. Never a spinner that hangs (30s poll timeout flips to failed). |
| **Substantive, enriched** | Heading: "Saved — and here's what we noticed." Subject + evidence chips. Reflection prompt (from `insight_suggestions[0]` or `journey_observation.text`) in serif. Connection observation naming the top `capability_thread`. Exit row: "Back to Dashboard" / "Log Another". |
| **Substantive, failed** | Heading: "Saved." Honest copy: *"We couldn't draw out insights this time. This moment is safe in your sessions — you can return to it any time."* Exit row. No spinner. No "retry soon" language (retry lives on the Portfolio affordance — §7.5). |

**Forbidden on this screen** (D-LPS-4): forward-prescription language ("try this next time", "do this tomorrow"), apology copy on missing optional fields, second LLM call, auto-dismiss on the substantive path.

**Hearth-session entries (`scaffoldData`):** post-save renders the same surface, with the `ReflectionModal` overlaid on top (the reflection-shareback flow owns its data path; the post-save surface owns enrichment surfacing).

**"Log Another"** resets all state and UI to the initial empty form.

**"Back to Dashboard"** navigates to the Dashboard screen.

**Implementation:** `src/components/logger/PostSaveSurface.tsx`, mounted from `src/app/(auth)/log/page.tsx`.

### 7.3 Badge Threshold Transition

When `checkBadgeThreshold()` finds a badge at ≥70% progress:

1. The save success overlay appears with modified content:
   - An ember circle with star icon (instead of green checkmark)
   - Title: "Badge Ready! 🎉"
   - Message: *"{Badge Name} has reached {N}% and is ready to be awarded."*
   - Subtext: *"Complete a quick assessment to confirm understanding before awarding."*
   - Two buttons: "Save Without Badge" (secondary) and "Begin Assessment →" (primary)

2. **"Save Without Badge":** Entry saves normally. Success overlay updates to standard confirmation with added note: *"Badge progress saved — you can award it later from the Portfolio."*

3. **"Begin Assessment →":** Navigates to `hearth-badge-assessment.html` with badge context (badge ID, badge name, progress percentage). The learning entry is saved first; the assessment is a separate screen that references the saved entry.

**Badge detection logic (MVP):** In the prototype, badge detection checks the demo insights data for the current scenario. In production, badge detection queries the Capabilities Constellation's pre-computed `badge_thresholds[]` from the Family Intelligence Snapshot. The detection runs post-save as part of the snapshot rebuild, and the Logger polls for the result (or uses a websocket notification).

### 7.4 Auto-Save / Draft Behaviour

**MVP:** No auto-save. If the parent navigates away (back button, browser close), unsaved data is lost.

**Production target:** Entries with ≥20% completeness should auto-save as drafts to `localStorage` (keyed by family ID). Draft resume is triggered from the Dashboard ("Continue logging" card) or from a notification ("Resume your draft" deep link). Draft entries carry `status: 'draft'` and are excluded from Portfolio, HEU Report, and enrichment until explicitly saved.

**Back/cancel unsaved warning:** In production, pressing the back button when the form has unsaved changes (completeness > 0) should show a confirmation dialogue: *"You have an unsaved log entry. Discard changes?"* with "Discard" and "Keep Editing" options. The prototype does not implement this.

### 7.5 Error Handling

> **Revised 2026-05-18 (D-LPS-5, D-LPS-6, D-LPS-7).** Alpha suspends the silent-degradation behaviour described in the old #4 below.

**Network failure on save:** In production, the save action should:
1. Show a loading spinner on the save button
2. On timeout (>5 seconds): show inline error *"Couldn't save — check your connection and try again."*
3. Entry data remains in local state; parent can retry without data loss

**Enrichment failure (alpha behaviour):** The captured moment is decoupled from the enrichment layer. Description, per-child discoveries, evidence and all captured fields persist independent of enrichment outcome. The `learning_entries.ai_enrichment` JSONB carries a `status: 'pending' | 'enriched' | 'failed'` discriminant written at save / completion / catch:

- On insert (with `status: 'complete'`): `{ status: 'pending', startedAt }` seeded so the surface can distinguish in-flight from never-ran.
- On Haiku / Sonnet success: full enrichment + `status: 'enriched'`.
- On either `enrichEntry()` inner catch or the route's after()-catch: `{ status: 'failed', failedAt, error }` preserved.

**Surfacing:** the Logger post-save screen (§7.2) renders the honest failed state. Portfolio entry view shows a quiet [Generate now] affordance for `status === 'failed'` or for `complete` entries older than ~2 minutes with no enrichment. Retry is parent-initiated only — never automatic — one Haiku call per tap, rate-limited (10 / hour / family), and routes through the same `enrichEntry()` service the save path uses (D-LPS-7). Endpoint: `POST /api/entries/[id]/enrich`.

**Validation errors:** The completeness gate prevents most validation issues. Additional server-side validation should catch: empty `learner_ids` (should not happen if gate is working), missing `family_id`, description exceeding storage limits.

**Duplicate detection:** In production, the enrichment pipeline can flag potential duplicates (entries with >80% text similarity within the same day for the same children). If detected, the parent sees a non-blocking notice: *"This looks similar to an entry you saved earlier today. Save anyway?"*

---

## 8. Empty and First-Use States

### 8.1 Brand New Family (No Prior Entries)

The Logger form loads identically regardless of entry history. There is no first-use tour or modal overlay. The empty insights panel message (*"Start describing the activity and I'll begin finding the learning within it"*) serves as subtle onboarding.

**Potential enhancement (post-MVP):** A first-use banner at the top of the capture panel could provide a one-sentence contextual tip: *"Describe any moment where your child was learning — even everyday play counts."* This banner would dismiss permanently on first save and be keyed to a `has_logged_first_entry` family flag.

### 8.2 Returning Family With History

No changes to form layout. In production, the keyword matcher could be enhanced with family-specific vocabulary (subjects the family logs frequently, children's known sparks) to improve real-time insight relevance. This is a Phase 2 enhancement described in the AI Intelligence Layer Architecture.

### 8.3 Insights Panel on First Use

Same as empty state: smiley icon + guidance text. No onboarding-specific variant is needed because the message already instructs the parent to start filling in the form.

---

## 9. Mobile Layout Specification

### 9.1 Breakpoint

The mobile layout applies at `max-width: 1023px`. Desktop layout applies at `min-width: 1024px`.

### 9.2 Layout Changes

**Workspace:** Changes from `flex-direction: row` to `flex-direction: column`. The capture panel takes full width; the insights panel becomes a bottom drawer.

**Capture panel:** Padding reduces from 24px to 20px horizontal, 16px vertical. `max-width` constraint on `.capture-inner` is removed (full width). Bottom padding of 80px is added to prevent content from being hidden behind the insights drawer handle.

**Activity type grid:** Switches from auto-fill to `repeat(4, 1fr)` — exactly 4 columns on mobile.

**Evidence tools grid:** Switches from 2-column to 1-column.

**Header completeness label:** Hidden on mobile (`display: none`). Only the circular ring and percentage remain visible.

### 9.3 Insights Drawer (Mobile)

The insights panel becomes a fixed-position bottom drawer:

- **Position:** `fixed; bottom: 0; left: 0; right: 0`
- **Collapsed state:** `transform: translateY(calc(100% - 56px))` — only the drag handle and panel header are visible
- **Expanded state:** `transform: translateY(0)` — full panel visible, max height 60vh
- **Transition:** 400ms cubic-bezier ease
- **Border radius:** 24px top-left and top-right
- **Shadow:** Upward shadow (`0 -8px 32px rgba(0,0,0,0.4)`)
- **Z-index:** 90

**Drag handle:** 36×4px rounded bar centred at the top of the drawer. Tap toggles expanded/collapsed state.

**New insight pulse:** When insights are generated while the drawer is collapsed, the drawer briefly translates up by 24px and back to its collapsed position to indicate new content.

### 9.4 Touch Targets

All interactive elements meet minimum 44×44px touch target guidelines:

- Child chips: 8px + 16px padding gives adequate height; width is content-driven but always exceeds 44px
- Emoji buttons: Explicitly 36×36px (slightly below guideline but compensated by 4px gap between buttons)
- Observation chips: 6px + 14px padding; height depends on font size — verify ≥44px in implementation
- Evidence tool cards: 14px padding on a multi-line card — well above minimum
- Select chips (when/duration/where): 6px + 12px padding — verify ≥44px in implementation

**Note for development:** Observation chips and select chips may need padding increases on mobile to meet the 44px minimum. Add `@media (max-width: 1023px)` overrides if needed.

### 9.5 Scroll Behaviour

The capture panel scrolls independently. The insights drawer (when expanded) scrolls independently within its 60vh container. The header is fixed (`flex-shrink: 0`) and never scrolls.

---

## 10. Entry Points and Exit Behaviour

### 10.1 Entry Points

| Source | Action | Pre-populated Fields |
|--------|--------|---------------------|
| Dashboard | "Log a Moment" button | None — empty form |
| Notification | "Resume draft" deep link | All draft fields restored (production only) |
| Weekly Planner | "Log this completed activity" | `activity_type` and potentially `description` pre-populated from the planned activity; `learner_ids` from planned participants |
| Module Experience | (Not this screen — Module Log Mode is a separate surface) | N/A |

**Weekly Planner pre-population (production):** When a parent taps "Log" on a completed planner activity, the Logger opens with the activity's title in the description field, the mapped activity type selected, and the planned children pre-selected. The parent can modify any pre-populated field.

### 10.2 Exit Behaviour

| Action | Behaviour |
|--------|-----------|
| Back button (header) | Navigate to previous screen (typically Dashboard). In production: show unsaved changes warning if completeness > 0 |
| Save → "Back to Dashboard" | Navigate to Dashboard |
| Save → "Log Another" | Reset form, stay on Logger |
| Save → Badge assessment | Navigate to badge assessment screen with entry + badge context |
| Browser close / tab switch | Data lost (MVP). Draft saved locally (production) |

---

## 11. Data Model

### 11.1 Complete Learning Entry Schema (Logger Output)

```javascript
{
  // System-generated
  entry_id: UUID,
  family_id: UUID,
  created_at: ISO8601,
  updated_at: ISO8601,
  source: 'retrospective',           // Always 'retrospective' from Logger
  source_module_id: null,             // Only populated for module log entries
  source_project_id: null,            // Only populated for project stage entries
  status: 'draft' | 'complete',

  // Parent-entered
  learner_ids: ['emma', 'liam'],      // Array of learner IDs
  title: null,                        // Not in current Logger UI — auto-generated from description in production
  description: 'We spent the morning at the creek...',
  activity_type: 'nature',
  when: 'today',                      // 'today' | 'yesterday' | 'earlier'
  when_date: ISO8601,                 // Resolved date (computed from 'when' value)
  duration_minutes: 30,               // Null if not selected
  location: 'outdoors',              // Null if not selected
  together: true,                     // Boolean — did they do this together?
  observations: [
    'Deeply focused',
    'Asked questions',
    'Joyful'
  ],
  evidence: [
    { type: 'photo', content: 'Tadpole counting', src: 'base64...' },
    { type: 'quote', content: 'Look, it rolls into a ball when I touch it!' }
  ],
  per_child_data: {
    'emma': {
      engagement: 'loved',            // 'loved' | 'engaged' | 'okay' | 'struggled'
      discoveries: 'She counted the tadpoles into groups of ten without prompting'
    },
    'liam': {
      engagement: 'engaged',
      discoveries: 'He was fascinated by the different sizes and tried to draw them'
    }
  },

  // System-generated on save (enrichment pipeline)
  enrichment: {
    enrichment_status: 'pending' | 'enriched' | 'failed' | 'retry_queued',
    subjects_detected: ['Mathematics', 'Science'],
    capability_suggestions: [
      { thread_id: 'M1', confidence: 0.85, status: 'suggested' },
      { thread_id: 'S2', confidence: 0.72, status: 'suggested' }
    ],
    curriculum_descriptors: [
      { code: 'AC9M3N01', confidence: 0.78 },
      { code: 'AC9S3U01', confidence: 0.65 }
    ],
    per_child_signals: {
      'emma': { engagement_score: 0.9, complexity_level: 'developing' },
      'liam': { engagement_score: 0.7, complexity_level: 'emerging' }
    },
    quality_score: 0.78,              // Overall entry richness score
    confidence: 0.80,                 // Model's self-reported confidence
    model_used: 'haiku',
    enriched_at: ISO8601
  },

  // System-generated (snapshot context)
  pedagogy_overlay_applied: 'charlotte_mason',
  badge_thresholds_triggered: []      // Populated by snapshot rebuild if thresholds met
}
```

### 11.2 Parent-Entered vs System-Generated

| Category | Fields |
|----------|--------|
| **Parent-entered** | `learner_ids`, `description`, `activity_type`, `when`, `duration_minutes`, `location`, `together`, `observations`, `evidence`, `per_child_data` |
| **System-generated on creation** | `entry_id`, `family_id`, `created_at`, `source`, `status`, `when_date` |
| **System-generated on enrichment** | `enrichment.*`, `pedagogy_overlay_applied`, `badge_thresholds_triggered` |

### 11.3 What Gets Sent to Haiku vs Stored Directly

**Sent to Haiku enrichment pipeline:**

- `description` (freeform text — the primary input for NLP extraction)
- `per_child_data.*.discoveries` (per-child freeform text)
- `activity_type` (provides context for classification)
- `observations[]` (structured vocabulary — helps confirm AI classifications)
- `learner_ids` and family context (ages, prior entries) from the context assembly stage

**Stored directly (not sent to Haiku):**

- `when`, `when_date`, `duration_minutes`, `location` — structured metadata, no AI needed
- `together` — boolean flag
- `evidence[]` — stored as-is; photo analysis deferred to Phase 3
- `per_child_data.*.engagement` — structured emoji selection, no AI interpretation needed

---

## 12. Integration Points

### 12.1 What the Logger Consumes

| Data Source | Purpose | Read From |
|-------------|---------|-----------|
| Family children list | Populate child chips (names, ages, colours, shapes) | PostgreSQL `family_members` |
| Capability thread library | Keyword matcher vocabulary (MVP); enrichment taxonomy (production) | Loaded as static JS bundle (~15KB) in MVP; Sanity CMS in production |
| Pedagogy profile | Philosophy lens for insight cards | Family Intelligence Snapshot `pedagogy_overlay_key` |
| Recent entries (production) | Duplicate detection | PostgreSQL `learning_entries` (last 7 days, same children) |

### 12.2 What the Logger Produces

| Consumer Screen | Data Used | How |
|-----------------|-----------|-----|
| **Portfolio / Learning Journey** | Full entry with per-child evidence and capability mappings | Portfolio shows entries for each child, filtering by `learner_ids` and surfacing that child's `per_child_data` |
| **HEU Compliance Report** | `curriculum_descriptor_tags`, `evidence[]`, `per_child_data.engagement` | Report counts descriptor coverage and links evidence as work samples |
| **Capabilities Constellation** | `capability_thread_mappings[]` from enrichment | Constellation tracks thread progress per child; entries are the evidence behind DLO confirmations |
| **Dashboard** | Entry count, recent activity, celebration messaging | Dashboard reads from Family Intelligence Snapshot, rebuilt async after entry save |
| **Weekly Planner** | Completed entry reference | Planner marks planned activities as completed when a matching entry is saved |
| **Notification System** | Draft entries, badge thresholds | Notifications for "Resume your draft" and "Badge ready to award" |
| **Badge Assessment** | Entry context + badge threshold data | Logger transitions to badge assessment with entry ID and badge context |

---

## 13. States & Edge Cases

### 13.1 State Inventory

| State | Condition | Behaviour |
|-------|-----------|-----------|
| Empty form | Initial load, no interaction | All sections visible, no selections, insights empty, save disabled |
| Partially complete (<50%) | Some fields filled | Completeness ring animates, section checkmarks appear, save still disabled |
| Save-ready (≥50%) | Threshold met | Save button activates (ember), ring continues to fill |
| Excellent (≥90%) | Nearly complete | Ring turns sage green, level shows "Excellent" |
| Badge transition | Badge threshold ≥70% on save | Modified success overlay with assessment option |
| Post-save reset | "Log Another" tapped | All state and UI resets to empty form |

### 13.2 Edge Cases

| Scenario | Expected Behaviour |
|----------|-------------------|
| All children deselected after engagement was rated | Per-child data is deleted; engagement section returns to empty state; completeness recalculates (drops significantly) |
| Very long description (>5000 chars) | No hard limit enforced in UI. Character count displays. Enrichment pipeline should truncate to token budget (~1000 chars effective input) |
| Multiple rapid activity type toggles | Each toggle triggers `maybeGenerateInsights()`. If scenario changes, insights re-render. If same scenario, de-duplicated by `state.insightsGenerated` flag |
| Voice input unavailable | Alert: "Voice not supported. Try Chrome or Edge." Voice button remains but non-functional |
| Photo upload of non-image file | Browser file picker is filtered to `accept="image/*"` — non-image files won't be selectable |
| Large photo file (>10MB) | In production, photos should be resized client-side before base64 encoding. Prototype does not handle this |
| Network offline during form fill | Form works entirely offline (no API calls during input). Save will fail — handle per Section 7.5 |
| Same observation chip tapped twice | Deselects the chip, removes from `state.observations[]`, completeness recalculates |
| Together toggle while only 1 child selected | Toggle is hidden when <2 children selected. If a second child is deselected, toggle hides and `state.together` resets to false |

---

## 14. Open Questions

These items are either ambiguous in the prototype or represent decisions deferred to production:

1. **Title field:** The Learning Entry schema includes a `title` field, but the Logger UI does not have a title input. Should the title be auto-generated from the first ~60 characters of the description, or should an explicit title field be added? Recommendation: auto-generate from description, with the parent able to edit it later in Portfolio view.

2. **"Earlier" date selection:** The "Earlier" when chip needs a date picker in production. What date range should be available? Last 7 days? Last 30 days? Any past date? Recommendation: last 30 days, with a "Custom date" option for historical logging during onboarding.

3. **Draft persistence storage:** Should drafts be stored in `localStorage` (simple but lost on device change) or in PostgreSQL with `status: 'draft'` (cross-device but requires network)? Recommendation: PostgreSQL with a 7-day auto-expiry on unfinished drafts. **[RESOLVED 2026-06-14 — D-LPS-8]** Built, but *hybrid* rather than pure-Postgres: `localStorage` stays the offline-first primary and the Postgres mirror (`logger_drafts`, per-Clerk-user, 7-day read-time expiry) is best-effort with last-write-wins — keeping the 7-day expiry while avoiding the hard network dependence the pure-Postgres option implied.

4. **Photo storage and sizing:** The prototype stores photos as base64 in the evidence array. Production needs: maximum file size, client-side resize resolution, cloud storage (S3/Cloudflare R2), and thumbnail generation. These are infrastructure decisions outside the UX spec scope. **[2026-06-14 — mostly built]** Client-side compression (`compressImageFile`) runs before upload to `/api/evidence/upload` (Vercel Blob, server-side Sharp resize). The offline submission queue for photos is **not** built — an offline photo-add fails outright; deferred to Phase 2 (D-LPS-10).

5. **Observation chip extensibility:** Are the 24 current observation chips sufficient, or should families be able to add custom observations? Recommendation: fixed vocabulary in MVP for consistent enrichment; custom chips in Phase 2 if feedback demands it.

6. **Insight card interaction model:** When insight cards become interactive (confirm/dismiss subjects, save next steps), do dismissed suggestions persist in the entry as "rejected" for enrichment pipeline training, or are they deleted entirely? Recommendation: store as `status: 'rejected'` for pipeline improvement.

7. **Multi-session logging:** Can a parent log a single activity that spans multiple sessions (e.g., a project worked on over three days)? Currently no — each save creates one entry. Project Experience handles multi-session work. The Logger should remain single-session for simplicity.

8. **Accessibility:** The prototype does not include ARIA labels, keyboard navigation patterns, or screen reader support. A full accessibility audit is needed before production. Key concerns: emoji buttons need aria-labels, the completeness ring needs an aria-valuenow, and the mobile drawer needs focus trapping.

---

*This document specifies the Retrospective Logger v2 as designed in the prototype. Update when production implementation reveals additional edge cases or when the AI intelligence pipeline introduces new insight types.*
*Last updated: March 2026*
