<!-- Version: 1 | Date: 2026-03-11 | Changes: Initial spec — documents onboarding wizard, settings view, data model, integration points, and edge cases -->

# Hearth Pedagogy Engine — UX & Functional Design Specification

> **Canonical prototype:** `hearth-pedagogy-engine-responsive.jsx`
> **Architecture references:** `hearth-pedagogy-integration-framework.md`, `Hearth_System_Interaction_Map.md` (Section 3.13)
> **Priority:** HIGH — this profile influences every overlay-active screen
> **Last updated:** March 2026

---

## 1. Purpose

The Pedagogy Engine is the family's philosophical identity layer. It captures how a family thinks about education — their foundational philosophy, what they value most, and which daily practices they use — and produces a `familyPedagogicalProfile` object that shapes how every overlay-active screen communicates with them.

This is not a learning tool. It is a configuration surface. Families complete it once, revisit it rarely, and feel its effects constantly.

---

## 2. Design Decisions & Rationale

**One-time wizard, available later from Settings.** The wizard runs during onboarding. After completion, the same data appears as a compact summary inside Family Settings Section 3 ("Your Educational Approach") with inline edit access. Rationale: the wizard's educational narrative structure would feel excessive for a returning parent tweaking one value.

**Skippable, but philosophy is required within the wizard.** Families can skip the entire wizard ("Skip for now" in header). If they enter it, they must select a philosophy before proceeding — this is the single required field. Values and Practices each require at least 1 selection to proceed past their step, but these are lower barriers. Rationale: philosophy is the keystone of the overlay system. Without it, the entire interpretation layer defaults to Eclectic multi-lens mode, which works but is less focused.

**Single philosophy selection, not multiple.** One philosophy or Eclectic. No multi-select. Rationale: selecting two philosophies (e.g. Charlotte Mason + Montessori) produces incoherent overlays. The Eclectic path exists precisely for families who want to blend. The prototype enforces this via `setSelectedPhilosophy(philosophy.id)` — a single value, not an array.

**Prioritised values and practices, not just selected.** Order matters. The first value carries more weight in overlay language than the fifth. Implemented via up/down arrow reordering in the priority panel. Rationale: "We value nature connection AND academic rigor" is meaningless without knowing which one wins when they conflict on a Tuesday afternoon.

**Eclectic carries an honest caveat.** When a family selects Eclectic, the card displays: "Eclectic requires more synthesis — some of all means less depth in each tradition." This is not discouragement — it's informed consent. Eclectic families receive multi-lens insights (seeing the same activity through 2–3 philosophy lenses simultaneously) rather than a single deep interpretation.

**Compatibility hints, not restrictions.** Values and Practices steps show compatibility indicators relative to the selected philosophy (green dot = aligns, bordered dot = may need reconciliation). These are informational, never blocking. A Classical family can absolutely select "Child-Led Exploration" — the tension indicator simply says "this pairing requires conscious synthesis." Rationale: real homeschool families mix approaches constantly. The system respects that while surfacing the tension.

**Demo activity card as proof of value.** The Review step includes a hardcoded sample activity ("Bug Observation Under Rocks") with live-updating AI-style insights. This isn't a gimmick — it's the single most important persuasion moment in the wizard. Parents see their selections immediately influencing how Hearth would interpret their actual learning. Rationale: abstract philosophy selection becomes concrete when you see "Through a Charlotte Mason Lens: This is classic nature study…"

**Philosophy is family-level, not per-child.** One profile per family. No per-child philosophy overrides. Rationale: in Australian home education, the registered parent-facilitator is responsible for the educational program. The philosophy reflects the facilitator's approach to education, not each child's preference. Children have individual Learner Profiles with sparks and rhythms, but the interpretive lens is the parent's choice.

---

## 3. Onboarding Wizard — Step-by-Step Specification

### 3.1 Global Wizard Elements

**Header:** Hearth logo (left) + "Skip for now" button (right, ghost style with arrow). Mobile: "Skip" abbreviated.

**Step indicator:** Horizontal 4-step bar — Philosophy → Values → Practices → Review. Current step shows ember-filled circle with glow. Completed steps show checkmark in ember-bordered circle. Steps connected by horizontal lines (filled ember when complete). On mobile, the indicator scrolls horizontally if needed (min-width: 400px).

**Footer navigation:** Persistent bottom bar. Left: Back button (ghost, hidden on Step 1). Right: "Continue" (ember primary) or "Light the Hearth" (on Review step). Continue is disabled until step gate conditions are met.

**Step gate conditions:**
- Step 1 (Philosophy): `selectedPhilosophy !== null` — must pick one
- Step 2 (Values): `selectedValues.length > 0` — at least 1 value
- Step 3 (Practices): `selectedPractices.length > 0` — at least 1 practice
- Step 4 (Review): Always enabled (review only)

**Back navigation:** Full backward traversal. Selections persist when going back. Changing philosophy on Step 1 after completing Steps 2–3 does NOT reset downstream selections, but compatibility indicators update to reflect the new philosophy.

---

### 3.2 Step 1: Philosophy

**Title:** "Your Educational Philosophy"
**Description:** "This shapes how Hearth interprets your learning activities. Choose the tradition that resonates most with your family, or select Eclectic if you consciously draw from multiple sources."

**Layout:** Responsive card grid. Mobile: 1 column. Tablet: 2 columns. Desktop: auto-fill with min 340px per card.

**7 philosophy cards** (in display order):

| ID | Name | Tagline | Key Elements |
|----|------|---------|-------------|
| `montessori` | Montessori | "The child constructs themselves through purposeful work" | Prepared environment, Mixed ages, Uninterrupted work periods, Concrete to abstract |
| `charlotte-mason` | Charlotte Mason | "Children are born persons, fed with living ideas" | Living books, Nature journals, Narration, Short lessons |
| `waldorf` | Waldorf · Steiner | "The child unfolds in stages, nourished by imagination" | Artistic expression, Daily rhythm, Delayed academics, Natural materials |
| `classical` | Classical | "The mind is trained through the Trivium stages" | Trivium stages, Memory work, Great books, Latin roots |
| `unschooling` | Unschooling | "Children learn naturally when trusted to follow their interests" | Interest-led, No curriculum, Life as learning, Trust the child |
| `reggio` | Reggio Emilia | "Children have a hundred languages of expression" | Project documentation, Environment as teacher, Emergent curriculum, Hundred languages |
| `eclectic` | Eclectic | "We draw consciously from multiple traditions" | Flexible approach, Take what works, Conscious mixing, Family-defined |

**Card anatomy:** Name (serif heading) → Tagline (italic, ember) → Description (2–3 sentences, muted) → Key Elements (pill tags, dark surface).

**Selection interaction:** Tap card to select. Single-select — tapping a new card deselects the previous. Selected card gets ember border + glow + "SELECTED" badge in header.

**Eclectic card special treatment:** Includes an info callout below key elements: "ℹ Eclectic requires more synthesis — some of all means less depth in each tradition." Styled as ember-tinted background with border.

**"I don't know" path:** There is no explicit "I don't know" button. The skip mechanism in the header serves genuinely uncertain families. If they skip, they default to Eclectic with multi-lens insights — which is actually a reasonable default for exploratory families. The Eclectic card description ("Intentionally combining elements from different philosophies based on what works for your family") also serves as the "haven't decided yet" option.

> **Open question:** Should we add a subtle helper below the grid: "Not sure? That's okay — Eclectic works well while you're exploring."? This would explicitly validate uncertainty without adding another path.

---

### 3.3 Step 2: Values

**Title:** "What Matters Most"
**Description:** "Select up to 5 values and drag to prioritize. Your top values will guide how Hearth highlights what's important in your learning activities."

**Layout:** Two-panel — priority list (sticky sidebar on desktop, top on mobile/tablet) + available options grid.

**Compatibility legend** (shown only if philosophy was selected): Ember dot = "Aligns with [Philosophy Name]" | Bordered dot = "May need reconciliation"

**10 value options:**

| ID | Name | Description | Compatible With | Tension With |
|----|------|-------------|----------------|-------------|
| `child-led` | Child-Led Exploration | Following the child's interests and questions | Unschooling, Montessori, Reggio | Classical |
| `structured` | Structured Progression | Clear sequence and milestones | Classical, Charlotte Mason | Unschooling |
| `nature` | Nature Connection | Outdoor learning and environmental awareness | Charlotte Mason, Waldorf, Reggio | — |
| `arts` | Arts & Creativity | Artistic expression integrated throughout | Waldorf, Reggio | — |
| `academic` | Academic Rigor | Strong emphasis on traditional academics | Classical, Charlotte Mason | Waldorf, Unschooling |
| `real-world` | Real-World Application | Learning connected to practical life | Unschooling, Reggio, Montessori | — |
| `flexibility` | Flexibility & Flow | Adapting to daily rhythms and energy | Unschooling, Eclectic | Classical |
| `whole-child` | Whole-Child Development | Social, emotional, physical alongside academic | Waldorf, Montessori, Reggio | — |
| `independence` | Independence & Self-Direction | Building autonomous learners | Montessori, Unschooling | — |
| `mastery` | Mastery Before Moving On | Deep understanding over coverage | Montessori, Classical | — |

**Selection interaction:** Tap an available item to add it to the priority list. Hard cap at 5. When cap is reached, further taps are silently blocked (the `toggleSelection` function checks `list.length < maxItems`). No warning toast — the counter "Your Priorities · 3/5" provides ambient awareness.

**Priority reordering:** Each selected item in the priority list shows up/down arrow buttons and a remove (×) button. Up arrow hidden on first item. Down arrow hidden on last item. Buttons are 32px touch targets on mobile (28px desktop).

**Compatibility indicators on available items:** Compatible items get ember border + subtle ember background tint. Tension items get muted border + faint muted background. Neutral items keep default border.

---

### 3.4 Step 3: Practices

**Title:** "Your Daily Practices"
**Description:** "Select up to 5 practices that you use or want to use in your homeschool. These shape the specific suggestions Hearth offers."

**Layout:** Identical two-panel structure to Values step.

**12 practice options:**

| ID | Name | Description | Compatible With | Tension With |
|----|------|-------------|----------------|-------------|
| `short-lessons` | Short, Focused Lessons | 10–20 minute concentrated learning | Charlotte Mason | Waldorf |
| `extended-projects` | Extended Projects | Multi-day or multi-week deep dives | Reggio, Waldorf | Charlotte Mason |
| `living-books` | Living Books & Literature | Real books over textbooks | Charlotte Mason, Classical | — |
| `hands-on` | Hands-On Materials | Concrete manipulatives and materials | Montessori, Waldorf | — |
| `narration` | Narration & Discussion | Retelling and oral processing | Charlotte Mason, Classical | — |
| `nature-journaling` | Nature Journaling | Observational drawing and notes | Charlotte Mason, Waldorf, Reggio | — |
| `movement` | Movement Integration | Physical activity woven through learning | Waldorf, Montessori | — |
| `rhythm` | Daily & Weekly Rhythms | Predictable patterns and routines | Waldorf, Charlotte Mason | Unschooling |
| `documentation` | Documentation & Portfolios | Capturing learning as it happens | Reggio | — |
| `free-play` | Unstructured Play Time | Open-ended exploration without agenda | Unschooling, Waldorf | Classical |
| `memory-work` | Memory Work & Recitation | Poems, facts, and passages committed to memory | Classical, Charlotte Mason | Unschooling |
| `copywork` | Copywork & Handwriting | Careful transcription of quality writing | Charlotte Mason, Classical | — |

**Interaction patterns:** Same as Values — tap to add, hard cap at 5, reorder with arrows, remove with ×.

---

### 3.5 Step 4: Review

**Title:** "Your Pedagogical Profile"
**Description:** "Here is how Hearth will interpret your family's learning. Review the demo to see it in action."

**Layout:** Two-column on desktop (summary left, demo right). Single column stacked on mobile/tablet.

#### Summary Card

Structured card with sections separated by borders:

**Foundation section:** Philosophy name (ember left-border accent) + tagline. If no philosophy selected: "No philosophy selected" (italic, muted).

**Values · Prioritized section:** Numbered tag pills. Each pill shows priority number (ember circle) + value name. Empty state: "No values selected."

**Practices · Prioritized section:** Same numbered tag pills as values.

**Synthesized Approach section:** Ember-tinted background panel at bottom of card. Generated narrative text that reads like: "Your family follows a Charlotte Mason foundation, prioritizing nature connection, child-led exploration, whole-child development. Your daily learning will feature nature journaling, narration, living books & literature. Hearth will interpret activities through this lens, offering Charlotte Mason-informed observations and suggestions that align with your values."

The synthesis is template-generated in the prototype (not AI-generated). It concatenates philosophy name, value names, and practice names into a natural sentence. This is acceptable for MVP. Post-MVP, Haiku could generate a more natural-sounding synthesis at write-time.

#### Demo Activity Card

**Sample activity (hardcoded):**
- Title: "Bug Observation Under Rocks"
- Description: "Yesterday we went outside and Emma was looking at bugs under a rock. She found a slater and wanted to know why it rolls up. We looked at it for ages."
- Duration: 30 minutes
- Subjects: Science, Language

**Card anatomy:** Activity header (title + meta) → Quoted description (blockquote style) → 3-tab insight panel.

**Insight tabs:**

| Tab | Label | Content Source |
|-----|-------|---------------|
| Philosophy Lens | "Through a [Philosophy] Lens" | Pre-written per-philosophy interpretation (7 variants stored in prototype) |
| Values Alignment | "Values Alignment" | Dynamically assembled from selected values — only values with genuine connections show statements |
| Next Steps | "Suggested Next Steps" | Dynamically assembled from selected practices — up to 3 concrete suggestions |

**Live updating:** Changing selections on previous steps (via back navigation) updates all three insight panels when the user returns to Review. The update is immediate (re-render, no animation transition).

**Voice:** The demo insights are written in Hearth's real voice — warm, specific, celebratory. They sound like genuine AI-generated insights, not placeholder text. This is deliberate: the demo IS the pitch.

#### Confirmation CTA

**Button copy:** "Light the Hearth" (with ember flame icon prefix).
**Disabled state:** Only if `selectedPhilosophy === null` (which shouldn't happen if they reached Step 4 via normal flow, but handles edge case of returning and deselecting).
**On tap:** Saves `familyPedagogicalProfile` → navigates to Dashboard (or next onboarding step if other onboarding gates remain).

---

## 4. Settings-Embedded View

After initial wizard completion, the Pedagogy Engine appears inside **Family Settings Section 3** as a compact, non-wizard summary.

### 4.1 Summary Layout

The summary occupies a single accordion section titled "Your Educational Approach" within Family Settings.

**Compact representation:**
- **Philosophy row:** Philosophy name + tagline on a single line, ember left-border accent
- **Values row:** Horizontally wrapped numbered pills (same tag component as Review step), showing priority order
- **Practices row:** Same numbered pill layout as values
- **Synthesis paragraph:** The generated narrative text, shown below the three rows in muted text

**Edit action:** A single "Edit" button at the section level (not per-row). Tapping Edit opens an inline editor that replaces the summary content — NOT the full wizard.

### 4.2 Inline Editor Behaviour

The inline editor exposes three collapsible sub-sections: Philosophy, Values, Practices. Each section can be expanded independently.

**Philosophy sub-section:** Grid of 7 philosophy cards (compact — name + tagline only, no full description). Tap to switch. Single-select.

**Values sub-section:** Same two-panel pattern as the wizard (priority list + available options). Pre-populated with current selections and ordering.

**Practices sub-section:** Same pattern as values.

**Changing philosophy does NOT reset values/practices.** The compatibility indicators update to reflect the new philosophy, but existing selections persist. Rationale: a family switching from Charlotte Mason to Eclectic shouldn't lose their carefully ordered values list. If a value now shows tension with the new philosophy, the indicator simply changes — the family can decide whether to adjust.

**Save action:** "Save Changes" button at bottom of editor. Saves the updated `familyPedagogicalProfile`. No confirmation modal for routine edits.

### 4.3 No Mini Sliders

The original build conversation mentioned "mini slider visualisations." These are NOT implemented in the current prototype and are not specified here. The priority-ordered pill list serves the same function more clearly — it shows relative importance through position rather than a continuous slider. Sliders imply a precision that doesn't exist in the data model (values are ranked, not weighted on a 0–100 scale).

---

## 5. Mid-Year Philosophy Change

### 5.1 What Happens

When a family changes their philosophy after months of use:

**Prospective, not retrospective.** All future AI-generated insights, module framing, and overlay language use the new philosophy immediately. Historical data (existing Learning Entries, Portfolio evidence, past Logger insights) stays as-is. The AI insights written on those entries were computed at write-time and stored — they are not regenerated.

**No confirmation modal for the change itself.** Changing philosophy is a setting, not a destructive action. However, a contextual notice appears when saving:

> "Your philosophy has changed from Charlotte Mason to Montessori. New insights and suggestions will reflect your Montessori approach. Past entries keep their original insights."

**System recommends reviewing values/practices.** After a philosophy change, the Values and Practices sections in the inline editor show a subtle amber notice: "Your values were set for Charlotte Mason. Some may benefit from reordering for Montessori." This is informational — no forced reset.

### 5.2 Data Integrity

The `familyPedagogicalProfile.philosophy` field is a current-state value, not a history log. There is no `previousPhilosophies` array. If audit history is needed later, the `updated_at` timestamp on the profile row provides a change marker, and individual Learning Entries retain their write-time snapshot of the philosophy that generated their insights.

---

## 6. The Demo Activity Card — Detailed Specification

### 6.1 Content

The demo uses a hardcoded activity, not drawn from the family's actual logs (they have none during onboarding). The activity was chosen deliberately:

- **"Bug Observation Under Rocks"** is relatable to nearly all homeschool families (outdoor, child-initiated, free)
- It touches multiple subjects naturally (Science, Language) without feeling academic
- It features Emma (Hearth's demo child) behaving in a recognisably child-like way
- It works compellingly under every philosophy lens

### 6.2 Insight Variants

**Philosophy Lens tab** — 7 pre-written variants stored in the prototype's `getPhilosophyInsight()` function. Each variant is 2–4 sentences using that philosophy's natural language. Examples:

- Montessori: Focuses on "concentrated attention" and "self-directed exploration." Suggests a magnifying glass and specimen containers.
- Charlotte Mason: Calls it "classic nature study." Recommends a nature journal entry.
- Unschooling: Celebrates "self-initiated inquiry" and "joyful learning." Explicitly says "this is exactly how unschooling works."
- Eclectic: Names multiple traditions the activity touches.

**Values Alignment tab** — Dynamically assembled. Only values with genuine connections to the bug activity generate statements. Current mappings: child-led, nature, whole-child, independence, mastery. If the family selected none of these 5, a generic fallback displays: "This activity connects to your selected values through authentic, engaged learning."

**Next Steps tab** — Dynamically assembled from selected practices. Up to 3 suggestions shown. Current mappings: nature-journaling, narration, living-books, documentation, extended-projects, hands-on. Each suggestion is concrete and actionable (e.g. "Start a nature journal entry with a drawing of the slater, noting the date and location").

### 6.3 Update Behaviour

The demo card re-renders on every state change. If the user goes back to Step 1, changes philosophy, then returns to Step 4, the Philosophy Lens tab shows the new interpretation immediately. No animation or transition — the content simply reflects current state.

### 6.4 Voice & Tone

The insights are written in Hearth's production voice: warm, specific, validating, never prescriptive. They read as real AI-generated insights would appear in the Retrospective Logger. This is intentional — the demo is a contract with the parent: "This is what you'll actually get."

---

## 7. Data Model

### 7.1 `familyPedagogicalProfile` Schema

```javascript
familyPedagogicalProfile = {
  // === Set by Pedagogy Engine wizard / settings editor ===

  philosophy: String | null,
  // One of: 'montessori', 'charlotte-mason', 'waldorf', 'classical',
  //         'unschooling', 'reggio', 'eclectic'
  // null if wizard was skipped (treated as eclectic at runtime)

  values: [String],
  // Ordered array of value IDs, max 5. First = highest priority.
  // IDs from: 'child-led', 'structured', 'nature', 'arts', 'academic',
  //           'real-world', 'flexibility', 'whole-child', 'independence', 'mastery'

  practices: [String],
  // Ordered array of practice IDs, max 5. First = highest priority.
  // IDs from: 'short-lessons', 'extended-projects', 'living-books', 'hands-on',
  //           'narration', 'nature-journaling', 'movement', 'rhythm',
  //           'documentation', 'free-play', 'memory-work', 'copywork'

  // === Populated by the platform over time (not wizard-set) ===

  observedPatterns: {
    approachesThatResonate: [String],
    // e.g. ['discovery', 'narrative', 'hands-on']
    // Learned from activity logs and module engagement data

    timesOfDay: [String],
    // e.g. ['morning', 'outdoor-afternoon']

    sessionLengthPreference: String,
    // e.g. '15-25min'

    currentInterests: [String]
    // e.g. ['insects', 'building', 'stories']
    // Derived from recent learning entries and spark tags
  },

  // === Metadata ===
  completedWizard: Boolean,
  // true if wizard was completed, false if skipped
  // Determines whether Settings shows "Complete your profile" prompt

  updatedAt: DateTime
  // Last modification timestamp
}
```

### 7.2 Storage

The profile lives in **PostgreSQL** as a JSONB column on the `families` table (or a dedicated `family_pedagogy_profiles` table with `family_id` FK — implementation choice for the schema architect). It is NOT in Sanity CMS — Sanity holds the philosophy definitions, value definitions, and practice definitions as reference content. The family's selections are user data.

**Why PostgreSQL, not Sanity:** The profile is per-family transactional data that changes when families edit it. Sanity CMS holds the catalog of available options. The profile references catalog IDs but stores the family's selections and ordering.

### 7.3 Runtime Consumption

The profile is consumed via the **Family Intelligence Snapshot** (FIS) — the pre-computed PostgreSQL object that other screens read at page load. It is NOT fetched via a separate API call per screen.

When a screen loads (e.g. Retrospective Logger), the FIS includes the current `familyPedagogicalProfile`. The screen's overlay logic reads from this cached object. When the profile is updated in Settings, the FIS is invalidated and regenerated.

For AI write-time operations (Logger insights, module recommendations), the profile is injected into the Haiku prompt as context (see `hearth-pedagogy-integration-framework.md` Part 6 for prompt templates).

---

## 8. Integration Points — Per-Screen Overlay Behaviour

### 8.1 Where Overlay IS Active

| Screen | How the Profile Manifests |
|--------|--------------------------|
| **Module Experience** | Facilitation language adapts to philosophy vocabulary. "Why This Matters" panel uses philosophy-specific framing. Observation prompts reference family's values. |
| **Activity Discovery** | Sort order biases toward philosophy-compatible modules. Card descriptions use philosophy-appropriate language. Recommendations reference top values. |
| **Retrospective Logger** | AI insights panel — the primary overlay surface. Philosophy lens generates 2–3 interpretation sentences. Values alignment highlights connections. Practice suggestions offer concrete next steps. All generated by Haiku at write-time. |
| **Portfolio / Learning Journey** | Evidence card descriptions use philosophy language when presenting what the child learned. Framing shifts: CM families see "living ideas encountered," Montessori families see "concentration demonstrated." |
| **HEU Compliance Report** | Gap recommendations framed through philosophy: "Your Charlotte Mason approach could be strengthened with more narration practice in Mathematics" rather than generic "Increase Mathematics coverage." |
| **Weekly Planner** | Subject balance display uses family value priorities. A nature-focused family sees outdoor time weighted more prominently than a family prioritising academic rigor. |
| **Dashboard** | Learning summary messaging uses philosophy vocabulary. Morning prompt might say "Ready for today's nature study?" for CM families vs "What captured their attention yesterday?" for Unschooling families. |

### 8.2 Where Overlay is NOT Active

| Screen | Reason |
|--------|--------|
| **Learner Profile** | Philosophy-neutral identity portrait. A child's sparks and rhythms exist regardless of philosophy. |
| **Capabilities Constellation** | Curriculum-aligned capability threads are philosophy-neutral. Growth tracking is objective, not interpretive. |
| **Family Settings** | Configuration surface. The Pedagogy Engine section lives here but doesn't apply overlay to itself. |
| **Badge Creator** | Capability descriptions are philosophy-neutral by design. |
| **Module Builder** | Content is created philosophy-neutral (Layer 1). The builder enforces this — pedagogy is never baked into content. |
| **Marketplace** | Content is presented neutrally. Philosophy-specific framing only appears after a module is added to the family's library and viewed through Module Experience. |
| **Notification Centre** | Notifications use warm generic language, not philosophy-specific. The underlying action they link to (e.g. Logger, Module Experience) applies the overlay when opened. |

---

## 9. States & Edge Cases

### 9.1 Wizard Skipped Entirely

**Trigger:** Family taps "Skip for now" at any point during the wizard.

**Result:** `philosophy: null`, `values: []`, `practices: []`, `completedWizard: false`.

**Runtime behaviour:** The system treats this as de facto Eclectic. AI insights use multi-lens mode (presenting the same activity through 2–3 philosophy lenses). Values and practice suggestions default to generic best-practice language. A persistent but dismissable prompt appears in Family Settings: "Complete your educational profile to get personalised insights."

**Dashboard nudge:** After 3+ learning entries logged without a profile, a gentle notification appears: "You've been logging great learning! Setting up your educational approach takes 3 minutes and makes your insights much more specific." Links to the wizard.

### 9.2 Eclectic Selection

**Trigger:** Family selects the Eclectic card on Step 1.

**Result:** `philosophy: 'eclectic'`, `completedWizard: true`.

**Runtime behaviour:** AI insights present multi-lens interpretations. The Logger insight panel shows 2–3 philosophy perspectives for the same activity (e.g. "A Charlotte Mason lens sees nature study here; a Montessori lens recognises concentrated attention"). Values and Practices selections still personalise further, but the philosophy interpretation layer is deliberately broad.

**Compatibility indicators:** On Steps 2 and 3, Eclectic shows minimal compatibility data — most items are neutral since Eclectic doesn't strongly align with or oppose specific values/practices.

### 9.3 Two Facilitators, One Family

**Trigger:** Two parent-facilitators with different educational philosophies share one Hearth family account.

**Resolution:** The profile is family-level. There is no per-facilitator philosophy. In practice, the Primary Facilitator configures the profile. If disagreement exists, Eclectic is the appropriate selection — it's literally what "we consciously draw from multiple traditions" means. The system does not surface this as a UX flow; it's handled by the adults.

> **Open question:** Should we add a note during onboarding for multi-facilitator families: "If you and your co-facilitator draw from different traditions, Eclectic lets Hearth show multiple perspectives"?

### 9.4 All Values / All Practices Selected

**Not possible.** Hard cap at 5 enforced in code. The `toggleSelection` function checks `list.length < maxItems` before adding. The counter ("Your Priorities · 5/5") signals the cap is reached.

### 9.5 Values Selected But Not Prioritised

**Not possible as a distinct state.** Values are stored as an ordered array. The order in which they're selected IS the initial priority. If a family taps child-led, then nature, then arts — the priority is [child-led, nature, arts]. They can reorder with up/down arrows, but the default order is selection order. There is no "un-prioritised" state.

### 9.6 Philosophy Changed After Months of Use

See Section 5 (Mid-Year Philosophy Change). Summary: prospective only, historical entries retain their write-time insights, system recommends reviewing values/practices.

### 9.7 Family Returns to Wizard After Completion

If the family re-accesses the wizard (e.g. via a deep link or developer path), it opens pre-populated with their current selections. This is not the expected re-entry path — Family Settings inline editor is the designed path for changes.

---

## 10. Open Questions

| # | Question | Impact | Suggested Resolution |
|---|----------|--------|---------------------|
| 1 | **"I don't know" helper text.** Should we add "Not sure? That's okay — Eclectic works well while you're exploring" below the philosophy grid? | Low | Yes — reduces anxiety for uncertain parents without adding UI complexity. Single line of helper text. |
| 2 | **Multi-facilitator guidance.** Should multi-facilitator families see a note about Eclectic being appropriate for blended approaches? | Low | Yes — brief contextual note, not a separate flow. Only shown if the family has >1 facilitator member. |
| 3 | **Post-skip re-engagement timing.** After how many logged entries should the Dashboard nudge appear? | Medium | 3 entries feels right — enough to have experienced the platform but early enough to benefit from personalisation. |
| 4 | **Reggio Emilia: 6th philosophy or trim to 5?** The System Interaction Map references "5 core + Eclectic" but the prototype includes Reggio as a 7th option. Confirm whether Reggio stays. | Medium | Recommend keeping Reggio. It's a legitimate and growing approach in Australian homeschool communities. 6 core + Eclectic = 7 cards. |
| 5 | **Synthesis text quality.** Current template concatenation produces serviceable but mechanical text. Should Haiku generate the synthesis at save-time for more natural language? | Low | Not for MVP. Template is acceptable. Haiku synthesis is a Phase 2 polish item. |
| 6 | **Demo activity localisation.** "Bug Observation Under Rocks" features Emma and a slater (Australian context). If Hearth expands beyond Australia, should the demo adapt? | Low | Not now. The activity is universal enough. Revisit at internationalisation phase. |
| 7 | **Observed patterns bootstrap.** The `observedPatterns` object in the profile is populated over time. How many entries before it becomes useful? What shows in its place before then? | Medium | Architecture question for AI Intelligence Layer. Suggest minimum 10 entries before surfacing pattern data. Before that, the fields are empty/null and consuming screens ignore them. |

---

## 11. Relationship to Other Specs

| Document | Relationship |
|----------|-------------|
| `hearth-pedagogy-integration-framework.md` | Defines the three-layer content model and all CMS schema extensions for pedagogy overlays. This spec defines the UX that populates the profile; the framework defines how the profile is consumed. |
| `Hearth_System_Interaction_Map.md` (Section 3.13) | Canonical cross-screen coherence document. Section 3.13 defines what the Pedagogy Engine consumes and produces. This spec is the detailed how. |
| `Hearth_AI_Intelligence_Layer_Architecture.md` | Defines how the profile is injected into Haiku prompts at write-time. This spec defines the data; the AI doc defines consumption. |
| `hearth-family-settings-spec-v1.md` | Family Settings contains the Pedagogy summary (Section 3). This spec defines the summary and inline editor behaviour; the Settings spec defines the accordion structure it lives within. |
| `hearth-logger-spec-v1.md` | The Logger's AI insights panel is the most visible consumer of the pedagogy profile. This spec's demo card (Section 6) mirrors the Logger's actual insight format. |

---

*Spec version: 1.0 | Canonical prototype: hearth-pedagogy-engine-responsive.jsx | Status: Complete for MVP scope*
