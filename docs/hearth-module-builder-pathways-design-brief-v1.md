# Hearth Module Builder — Multi-Pathway Design Brief

> **Version:** 1 | **Date:** 2026-03-20
> **Purpose:** Design brief for Claude Code execution. Defines shared patterns, per-pathway entry screens, divergence map, and build sequence for the four remaining Module Builder pathways.
> **Authority:** `hearth-module-builder-pathways-architecture-v2.md` (locked architecture spec)
> **Reference implementation:** `hearth-module-builder-understanding-v1.html` (Goal-Forward / aspiration mode prototype)
> **Design system:** `hearth-canonical-design-tokens-v1.md`, `hearth-ui-kit-v2.md`, `hearth-ui-token-deep-audit-v1.md`

---

## 1. Shared Patterns Audit

Every pattern listed below was extracted from `hearth-module-builder-understanding-v1.html` and **must be replicated identically** in all four new pathway prototypes. Where a pattern is noted as "parameterised," the structure is identical but the text/data content differs per pathway.

### 1.1 Three-View Architecture

All pathways use a three-view structure managed by the same `switchView()` function:

| View ID | Purpose | When Shown |
|---------|---------|------------|
| `view-entry` | Pathway-specific entry screen | Initial state |
| `view-loading` | AI inference progress animation | Between entry and editor (except Process — see §2.2) |
| `view-editor` | Shared module editor | After AI inference completes |

**View transition:** `fadeSlideIn` keyframe — opacity 0→1, translateY 8px→0, 250ms ease-out. Applied via `.view.active { display: block; animation: fadeSlideIn 250ms ease-out; }`.

**IMPORTANT:** Process pathway skips `view-loading` on initial entry→editor transition. AI runs later (deferred inference). All other pathways show the loading view.

### 1.2 Header

Sticky header with three elements. **Identical component across all pathways.**

```
┌─────────────────────────────────────────────┐
│ ← Back    [pathway title]     [Save Draft]  │
└─────────────────────────────────────────────┘
```

Behaviour by view:

| View | Back button | Title text | Save button |
|------|-------------|------------|-------------|
| Entry | Navigates to entry selector (history.back) | Empty | Hidden |
| Loading | Returns to entry | Empty | Hidden |
| Editor | Confirms then returns to entry | Pathway name (parameterised) | Visible, disabled until 60% completeness |

Save button states: disabled (greyed), enabled (border ember), ready ≥60% (filled ember background, white text). **Same CSS classes and transition logic across all pathways.**

Header title strings per pathway:

| Pathway | Header title (editor view) |
|---------|---------------------------|
| Material-Anchored | `"Material-Anchored"` |
| Process | `"Process"` |
| Inquiry | `"Inquiry"` |
| Retrospective Lift | `"Retrospective Lift"` |
| Goal-Forward | `"Goal-Forward"` |

### 1.3 Entry Screen Intro Block

Every entry screen opens with the same intro structure. **Layout and CSS identical; text is parameterised.**

```html
<div class="entry-intro">
  <div class="pathway-tag">[emoji] [Pathway Name]</div>
  <h1>[Headline — serif, 26px, fw 600]</h1>
  <p>[Description — 14px, text-secondary]</p>
</div>
```

Per-pathway content:

| Pathway | Emoji | Pathway Tag | H1 Headline | Description |
|---------|-------|-------------|-------------|-------------|
| Material-Anchored | 📖 | Material-Anchored | Build learning around a resource | You have something you love — a book, kit, video, or place. Describe it and we'll structure the learning. |
| Process | 🔧 | Process | Capture what you already do | You know how this activity goes. Write the steps — we'll reveal the learning inside them. |
| Inquiry | ❓ | Inquiry | Follow a question | Something sparked a wonder. Share it and we'll help structure the investigation. |
| Retrospective Lift | 🔁 | Retrospective Lift | Formalise what you've been doing | We've spotted patterns in your logs. Review them and we'll shape them into a module. |
| Goal-Forward | 🎯 | Goal-Forward | Design from a learning goal | You know what you want them to learn. Tell us the target — we'll help you get there. |

### 1.4 Form Elements (Shared CSS)

All these CSS classes are **identical across pathways** — copy verbatim:

- `.field` — container with `margin-bottom: 20px; padding: 0 16px`
- `.field-label` — 13px, fw 500, text-secondary
- `.field-hint` — 12px, text-muted, italic
- `textarea`, `input[type="text"]` — coffee-light bg, border-subtle, 14px, ember focus border
- `select` — same styling as inputs, custom chevron SVG
- `.settings-row` — flex row for Duration + Setting pair
- `.pill-group` / `.pill` — single-select chips. `.pill.selected` has ember-glow bg + ember border
- `.continue-btn` — full-width ember button, 15px fw 500, disabled state at 0.4 opacity

### 1.5 Quick Settings Row

Every pathway has a Duration dropdown + Setting pills row. **Identical component.** Always appears as the final section before the transition CTA.

```html
<div class="settings-row">
  <div class="field">
    <label class="field-label">How long?</label>
    <select id="entry-duration">
      <option value="15">15 minutes</option>
      <option value="30" selected>30 minutes</option>
      <option value="45">45 minutes</option>
      <option value="60">1 hour</option>
      <option value="120">1–2 hours</option>
      <option value="360">Half day</option>
    </select>
  </div>
  <div class="field">
    <label class="field-label">Setting</label>
    <div class="pill-group" id="entry-setting-pills">
      <button class="pill selected" data-value="either">Either</button>
      <button class="pill" data-value="indoor">Indoor</button>
      <button class="pill" data-value="outdoor">Outdoor</button>
    </div>
  </div>
</div>
```

### 1.6 Loading Screen

Centred layout with pathway emoji (40px, pulse animation), title, description, and a 3-step progress checklist. **Identical layout and animation logic; text is parameterised.**

Step states: pending (text-muted, muted border) → active (ember border, pulse) → done (sage, sage-glow bg, checkmark).

Timing: each step takes 600-1000ms (600 + random 400). After all steps complete, 400ms delay before transitioning to editor.

Per-pathway loading content:

| Pathway | Emoji | Title | Description | Step 1 | Step 2 | Step 3 |
|---------|-------|-------|-------------|--------|--------|--------|
| Material-Anchored | 📖 | Building your module | Using your resource to prepare the editor… | Inferring the learning | Selecting session structure | Preparing the editor |
| Process | 🔧 | Analysing your steps | Finding the learning hidden in your process… | Mapping capability threads | Generating observation hints | Preparing the editor |
| Inquiry | ❓ | Planning the exploration | Turning your question into an investigation… | Reverse-engineering understanding | Structuring the investigation | Preparing the editor |
| Retrospective Lift | 🔁 | Synthesising your logs | Shaping your patterns into a module… | Synthesising across entries | Mapping capabilities | Preparing the editor |
| Goal-Forward | 🎯 | Building your module | Using your learning goal to prepare the editor… | Mapping capability threads | Generating observation hints | Preparing the editor |

**Process pathway note:** The loading screen is NOT shown on initial entry→editor transition. It appears later when AI runs (triggered on first save or when parent scrolls to The Learning section). Use a banner or inline loading state in the editor rather than the full-screen loading view for deferred inference. See §2.2 for details.

### 1.7 Shared Editor

**This is the single largest shared component.** Every pathway lands on the same editor. It is **identical HTML/CSS/JS** regardless of pathway. The only differences are which fields arrive pre-populated vs empty.

#### Section Structure

Six collapsible sections in fixed order:

| # | Section | Emoji | Contains | Completeness Weight |
|---|---------|-------|----------|-------------------|
| 1 | The Basics | 📝 | Title input, Description textarea, Duration dropdown, Setting pills | Title: 20%, Description: 10% |
| 2 | The Steps | 📋 | Ordered step card list, Add step button, Regenerate hints button | At least 1 valid step: 20% |
| 3 | Materials Needed | 🧰 | Name + Alternative input pairs, Add material button | 0% (optional) |
| 4 | The Learning | 💡 | Understanding textarea, Watch-for textarea, Pivot textarea | Understanding: 20%, Watch-for: 15% |
| 5 | Capabilities | 🧭 | Tag cloud (explicit + suggested), hint text | At least 1 tag: 15% |
| 6 | Connect | 🔗 | Prerequisites dropdown | 0% (optional) |

#### Section Header Pattern

```html
<div class="section-header" onclick="toggleSection('section-{key}')">
  <span class="section-emoji">[emoji]</span>
  <span class="section-title">[Title — serif 17px fw 600]</span>
  <span class="section-status [complete|partial|empty]">[Done|n/n|Empty|Optional]</span>
  <span class="section-chevron [open]">›</span>
</div>
```

Section status badge colours: `.complete` = sage-glow bg + sage text. `.partial` = ember-glow bg + ember text. `.empty` = muted bg + muted text.

#### Completeness Bar

```
┌──────────────────────────────────────────┐
│ Module completeness              [85%]   │
│ ████████████████████░░░░░                │
│ Ready to save                            │
└──────────────────────────────────────────┘
```

Track: coffee-light bg. Fill: ember (< 60%) or sage (≥ 60%). Hint text updates contextually. Save button enabled at 60%.

#### Step Cards

```
┌─────────────────────────────────────────┐
│ [1]  Step title input       [↑][↓][✕]  │  ← header, coffee-mid bg, grab cursor
├─────────────────────────────────────────┤
│ Instructions textarea                   │  ← body
│─────────────────────────────────────────│
│ 💬 What to say (optional)              │  ← "say this" sub-section
│ [textarea]                              │
│─────────────────────────────────────────│
│ ┃ AI observation hint text (italic)     │  ← ember-glow bg, 2px left border
│ ┃ [Edit] [Remove]                       │
└─────────────────────────────────────────┘
```

Step number: ember text on ember-glow circle. Reorders with move buttons. Renumbers automatically. Observation hints: grey italic, ember-glow background, left border `rgba(217,123,58,0.4)`.

#### AI Suggestion Indicators

Two visual patterns:

1. **AI-suggested text fields:** Wrapper has class `ai-suggested-field`. Input gets `border-left: 3px solid var(--ember-glow-strong)`. Below the field: `<div class="ai-badge">✨ Suggested</div>`. Editing the field removes the badge and border (calls `removeSuggestion()`).

2. **AI-suggested capability tags:** Dashed border (`1px dashed rgba(217,123,58,0.4)`), text-secondary text. Tapping promotes to explicit (solid ember border + ember text). ✕ dismisses.

#### Coherence Check Banner

Appears when understanding goal and step content diverge (basic keyword overlap check). Banner with 🤔 emoji, title, description, three action buttons (Review learning goal / Review steps / Looks fine to me). Dismissible.

#### Save Flow

Toast confirmation: `"✅ Draft saved"` — fixed bottom centre, slides up, auto-hides after 2500ms. Sage border.

### 1.8 Design Tokens

**ALL tokens must be imported verbatim from the reference prototype.** The CSS `:root` block from `hearth-module-builder-understanding-v1.html` is the canonical set. Key tokens:

- `--deep-coffee: #0F0D0B` (body bg)
- `--coffee-mid: #1A1612` (panel bg)
- `--coffee-light: #252117` (input bg)
- `--surface-elevated: #2D2621` (raised elements)
- `--surface-hover: #352E28`
- `--text-primary: #E8DFD4`
- `--text-secondary: #9B8B7E`
- `--text-muted: #6B5D52`
- `--ember: #D97B3A` (actions only)
- `--sage: #4ADE80` (completion states only)
- `--border-subtle: rgba(45, 38, 33, 0.6)`
- `--transition: 300ms cubic-bezier(0.4, 0, 0.2, 1)`
- Fonts: `'Crimson Text'` (serif — headings, section titles), `'Inter'` (sans — labels, inputs, buttons, body)

### 1.9 Responsive

Single breakpoint: `@media (max-width: 400px)` — entry h1 shrinks to 22px, settings-row stacks vertically. Mobile-first throughout.

### 1.10 Module Data Schema

All pathways initialise the same `moduleData` object with `createdVia` set per pathway:

```javascript
let moduleData = {
  id: 'mod_' + Date.now(),
  createdVia: '[material|process|inquiry|retrospective|goal]',
  title: '',
  description: '',
  duration: 30,
  setting: 'either',
  steps: [],
  materials: [],
  targetUnderstanding: '',
  watchFor: '',
  pivot: '',
  capabilities: [],
  status: 'draft',
};
```

---

## 2. Per-Pathway Entry Screen Design

Each subsection defines: fields, layout, primary input mechanism, placeholder copy, validation logic, transition trigger, what gets pre-populated in the shared editor, and any unique UI patterns.

### 2.1 PATH 1: Material-Anchored

**Filename:** `hearth-module-builder-material-v1.html`
**`createdVia`:** `'material'`

#### Entry Screen Fields

**Section A: The Resource**

| Order | Field | Type | Label | Placeholder | Hint | Required? |
|-------|-------|------|-------|-------------|------|-----------|
| 1 | Resource type | Chip selector (single-select) | What is it? | — | — | Yes |
| 2 | Resource name | Text input | What's it called? | e.g., 'The Very Hungry Caterpillar' by Eric Carle | — | Yes (min 3 chars) |
| 3 | Resource description | Textarea (min-height 70px) | Tell us about it in a sentence or two | e.g., A picture book about a caterpillar eating through different foods before becoming a butterfly | This helps us understand the resource | Yes (min 10 chars) |

Resource type chips (single-select, using `.pill-group` / `.pill` pattern):
- 📚 Book
- 🎬 Video
- 🧰 Kit
- 📱 App / Website
- 📍 Place
- 🎵 Audio
- 📦 Other

**Section B: Your Vision**

| Order | Field | Type | Label | Placeholder | Hint |Required? |
|-------|-------|------|-------|-------------|------|-----------|
| 4 | What drew you | Textarea (min-height 56px) | What drew you to this? | e.g., Emma loves caterpillars and I thought we could explore lifecycles | This helps us understand what you want the learning to focus on | No, but improves AI inference |
| 5 | Usage intent | Chip selector (multi-select, 1-3) | How do you imagine using it? | — | Pick 1–3 | Yes (at least 1) |

Usage intent chips (multi-select — **new pattern, see below**):
- 📖 Read / watch together
- 🎨 Use as inspiration for a project
- 🔍 Explore a topic it introduces
- 🗣️ Discuss and reflect
- 🧪 Do the activity / experiment
- ✍️ Writing / drawing
- 🧠 Memorise / learn by heart

**Multi-select chip pattern:** Same `.pill` styling as single-select, but multiple can be `.selected` simultaneously. Add a `data-max="3"` attribute and JS logic to prevent more than 3 selections. When 3 are selected, remaining unselected pills get `opacity: 0.4; pointer-events: none`.

**Section C: Quick Settings** — standard Duration + Setting row (§1.5)

**Transition CTA:** `"Build the learning around this →"`

#### Entry Validation

Continue button enabled when: resource type selected AND resource name ≥ 3 chars AND resource description ≥ 10 chars AND at least 1 usage intent selected.

#### AI Inference → Loading Screen

On continue: capture all entry data. Show loading screen (§1.6 with Material-Anchored content). Simulate AI inference:
1. Understanding inference from resource + "what drew you" + intent
2. Session template selection from resource type × primary intent
3. Capability thread suggestion

#### Shared Editor Pre-Population

| Editor Field | Source | AI-Suggested? |
|--------------|--------|---------------|
| Title | AI-generated from resource name + topic (e.g., "Exploring Lifecycles with The Very Hungry Caterpillar") | Yes ✨ |
| Description | AI-generated from resource + intent | Yes ✨ |
| Duration | Carried from entry | No |
| Setting | Carried from entry | No |
| Steps | Pre-populated from session template (3-4 steps with observation hints) | Partially ✨ (template structure + AI-customised details) |
| Materials | Resource auto-added as first material (isCore: true) | Partially |
| Understanding | AI-inferred from resource + "what drew you" + intent | Yes ✨ |
| Watch-for | AI-generated | Yes ✨ |
| Pivot | AI-generated | Yes ✨ |
| Capabilities | AI-suggested (3-5 tags, all `confidence: 'suggested'`) | Yes ✨ |

**Demo data for prototype:** Use "The Very Hungry Caterpillar" example from the architecture spec. Resource type: Book. Intent: Read together + Explore a topic. Pre-populate with `book > read-together` session template steps.

#### Simulated AI Data

```javascript
const SIMULATED_AI = {
  title: "Exploring Lifecycles with The Very Hungry Caterpillar",
  description: "Read through this beloved picture book together, then explore the real science of metamorphosis and lifecycles",
  understanding: "Living things go through stages of change as they grow, and we can observe these stages in the world around us",
  watchFor: "They start noticing lifecycles elsewhere — asking about tadpoles, seeds growing, or other transformations they see",
  pivot: "If the concept feels abstract, focus on just one lifecycle they can observe directly — plant a bean seed and watch it day by day",
  capabilities: [
    { id: 'S2', name: 'Living Systems', domain: 'Scientific', color: '#4ADE80', confidence: 'suggested' },
    { id: 'S5', name: 'Scientific Observation', domain: 'Scientific', color: '#4ADE80', confidence: 'suggested' },
    { id: 'L3', name: 'Reading Comprehension', domain: 'Language', color: '#E8A0BF', confidence: 'suggested' },
    { id: 'M5', name: 'Measurement Sense', domain: 'Mathematical', color: '#7BA7CC', confidence: 'suggested' },
  ],
  steps: [
    {
      title: "Before reading",
      instructions: "Look at the cover together. What do you think this will be about?",
      hint: "Notice what predictions they make and what details they pick up on"
    },
    {
      title: "Read aloud",
      instructions: "Read through the book together. Pause at natural points to wonder aloud.",
      hint: "Watch for questions they ask or connections they make"
    },
    {
      title: "Talk about it",
      instructions: "Ask what they noticed, what surprised them, or what they want to know more about. Follow their lead.",
      hint: "Listen for new understanding — are they connecting the story to the wider world?"
    },
    {
      title: "Explore lifecycles",
      instructions: "Go outside and look for examples of things changing and growing — caterpillars, seeds, tadpoles. Draw or photograph what you find.",
      hint: "Notice whether they can transfer the lifecycle concept from the book to the real world — that's the conceptual leap"
    }
  ]
};
```

---

### 2.2 PATH 2: Process / Steps

**Filename:** `hearth-module-builder-process-v1.html`
**`createdVia`:** `'process'`

#### Entry Screen Fields

**Section A: What Are You Making / Doing?**

| Order | Field | Type | Label | Placeholder | Hint | Required? |
|-------|-------|------|-------|-------------|------|-----------|
| 1 | Activity name | Text input | What's the activity? | e.g., Building a birdhouse | Becomes the module title | Yes (min 3 chars) |
| 2 | Activity description | Textarea (min-height 56px) | In a sentence, what happens? | e.g., We build a simple wooden birdhouse from a kit, paint it, and hang it in the garden | — | Yes (min 10 chars) |

**Section B: Quick Settings + Product Toggle**

| Order | Field | Type | Label | Placeholder | Hint | Required? |
|-------|-------|------|-------|-------------|------|-----------|
| 3 | Duration | Dropdown | How long? | — | — | No (default 30) |
| 4 | Setting | Pills | Setting | — | — | No (default Either) |
| 5 | Finished product? | Toggle (Yes/No pills) | Is there a finished product? | — | — | No (default No) |
| 6 | Product description | Text input (shown only if toggle = Yes) | What do they end up with? | e.g., A painted birdhouse | Optional | No |

The Yes/No toggle uses the same `.pill-group` pattern as Setting pills.

**Transition CTA:** `"Capture the steps →"`

#### Entry Validation

Continue enabled when: activity name ≥ 3 chars AND description ≥ 10 chars.

#### The Critical Difference: No Loading Screen

Process is the only pathway where the parent goes **directly from entry to the shared editor** without an intermediate loading view. The entry data is simple metadata — no AI inference needed at this point.

**On transition:**
- Copy activity name → editor Title field (direct, not AI-suggested)
- Copy description → editor Description field (direct)
- Copy duration/setting → editor settings
- Open editor with **The Steps section expanded and focused**
- Steps section is **empty** — the parent writes steps from scratch
- The Learning section fields are **empty** — AI fills these later

**Deferred AI trigger:** When the parent has written at least 2 steps and either (a) saves for the first time, or (b) opens/scrolls to The Learning section, trigger deferred inference. Show an **inline loading indicator** within the Learning section (not the full-screen loading view):

```
┌─────────────────────────────────────────┐
│ 💡 The Learning                         │
│                                         │
│  ✨ Analysing your steps…               │
│  ████████░░░░░░░░░░░░░░                │
│  Finding the learning in your process   │
│                                         │
└─────────────────────────────────────────┘
```

After ~2 seconds (simulated), populate:
- Understanding → AI-inferred from steps + description
- Watch-for → AI-generated
- Pivot → AI-generated
- Capabilities → AI-suggested tags
- Per-step observation hints → AI-generated (appended to existing step cards)

Mark all populated fields with `✨ Suggested` badge.

#### Shared Editor Pre-Population

| Editor Field | Source | AI-Suggested? |
|--------------|--------|---------------|
| Title | Directly from entry (activity name) | No |
| Description | Directly from entry | No |
| Duration | Carried from entry | No |
| Setting | Carried from entry | No |
| Steps | **Empty — parent writes these** | No |
| Materials | Empty | No |
| Understanding | **Deferred AI** — populated after steps written | Yes ✨ (when triggered) |
| Watch-for | **Deferred AI** | Yes ✨ |
| Pivot | **Deferred AI** | Yes ✨ |
| Capabilities | **Deferred AI** | Yes ✨ |

#### Simulated AI Data (Deferred)

Use the birdhouse example from the spec. After the parent enters steps, the simulated AI populates:

```javascript
const SIMULATED_AI_DEFERRED = {
  understanding: "Planning, measuring, and building teaches us that creating something useful requires patience, precise measurement, and step-by-step thinking",
  watchFor: "Watch for how they approach the measuring — are they estimating or trying to be precise? Do they check their work before cutting?",
  pivot: "If they lose interest at the assembly stage, try simplifying — use pre-cut pieces and focus on the painting and design choices instead",
  capabilities: [
    { id: 'M5', name: 'Measurement Sense', domain: 'Mathematical', color: '#7BA7CC', confidence: 'suggested' },
    { id: 'P2', name: 'Fine Motor', domain: 'Physical', color: '#F59E0B', confidence: 'suggested' },
    { id: 'EF4', name: 'Planning', domain: 'Executive Function', color: '#C084FC', confidence: 'suggested' },
    { id: 'C3', name: 'Creative Problem-Solving', domain: 'Creative', color: '#EC4899', confidence: 'suggested' },
  ],
  observationHints: [
    "Notice whether they can follow the order of steps or want to jump ahead — sequencing is a thinking skill",
    "Watch for how they handle measurement — are they estimating or being precise?",
    "Notice their fine motor control and patience. Are they rushing or being careful?",
    "Watch for design choices in painting — are they planning or improvising? Both are valid.",
    "Listen for self-reflection — what are they proud of? What would they do differently?"
  ]
};
```

Pre-load 5 demo steps for the prototype:
1. "Measure and mark" / "Measure and mark the pieces of wood according to the plan"
2. "Cut the pieces" / "Carefully cut along the marks. Sand any rough edges"
3. "Assemble the walls" / "Nail the four walls together, checking alignment as you go"
4. "Attach the roof" / "Fit and secure the roof piece. Test for stability"
5. "Paint and personalise" / "Choose colours, paint the birdhouse, add any decorations"

---

### 2.3 PATH 3: Inquiry

**Filename:** `hearth-module-builder-inquiry-v1.html`
**`createdVia`:** `'inquiry'`

#### Entry Screen Fields

**Section A: The Question**

| Order | Field | Type | Label | Placeholder | Hint | Required? |
|-------|-------|------|-------|-------------|------|-----------|
| 1 | The question | Text input (generous width) | What came up? | e.g., Why do leaves change colour in autumn? | Use their exact words if you remember them — it doesn't need to be perfect | Yes (min 5 chars) |
| 2 | Who's wondering | Child selector (multi-select chips) | Who's wondering? | — | Pre-selects all if only 1 child | No (informational) |

Child selector uses family's children from simulated data. Each child is a `.pill` with their colour indicator. For prototype, use: Emma (rose), Liam (blue). Pre-select both.

**Section B: What You Already Know**

| Order | Field | Type | Label | Placeholder | Hint | Required? |
|-------|-------|------|-------|-------------|------|-----------|
| 3 | Prior knowledge | Textarea (min-height 56px) | What do you or your children already know (or think) about this? | e.g., We know leaves fall off trees. Emma thinks it's because they get old. Liam thinks the wind blows them off. | Starting from what you know helps build the exploration | No, but improves AI calibration |

**Section C: How Might You Explore This?**

This section introduces a **unique pattern: dynamically suggested investigation cards.** After the parent types their question (debounced 1.5s), 2-4 investigation approach cards appear below.

The cards are generated client-side from a domain keyword classifier (no LLM call). For the prototype, simulate with a static mapping.

**Investigation card layout:**

```
┌─────────────────────────────────────────┐
│  🔍 Observe closely                     │
│  Go look at the real thing              │
│                                 [    ]  │  ← checkbox/radio
└─────────────────────────────────────────┘
```

Cards use the same visual style as capability tags but larger — `background: var(--coffee-light); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 14px`. Selected state: `border-color: var(--ember); background: var(--ember-glow)`.

Parent selects 1-2 investigation approaches.

Investigation type options (from spec):
- 🔍 Observe closely — "Go look at the real thing"
- 🧪 Test it out — "Design a simple experiment"
- 📚 Look it up — "Find answers in books or reliable sources"
- 🗣️ Ask an expert — "Talk to someone who knows"
- 📍 Go somewhere — "Visit a place to find out"
- 🔧 Build or make something — "Learn by creating"

For the demo question "Why do leaves change colour in autumn?", show: Observe closely, Test it out, Look it up (pre-select Observe closely).

**Section D: Quick Settings** — standard Duration + Setting row (§1.5)

**Transition CTA:** `"Plan the exploration →"`

#### Entry Validation

Continue enabled when: question ≥ 5 chars AND at least 1 investigation approach selected.

#### AI Inference → Loading Screen

Standard loading screen flow with Inquiry-specific content (§1.6). Simulates:
1. Understanding reverse-engineering from question + prior knowledge
2. Step generation from investigation type × question domain
3. Capability thread mapping

#### Shared Editor Pre-Population

| Editor Field | Source | AI-Suggested? |
|--------------|--------|---------------|
| Title | AI-generated: "Exploring: [question summary]" | Yes ✨ |
| Description | AI-generated from question + investigation approach | Yes ✨ |
| Duration | Carried from entry | No |
| Setting | Carried from entry | No |
| Steps | Template from investigation type, AI-customised to question | Yes ✨ |
| Materials | AI-suggested from investigation type + question | Yes ✨ |
| Understanding | **AI reverse-engineered from question + prior knowledge** | Yes ✨ |
| Watch-for | AI-generated: "What would finding out look like?" | Yes ✨ |
| Pivot | AI-generated: "If the question leads somewhere new…" | Yes ✨ |
| Capabilities | AI-suggested (3-5 tags) | Yes ✨ |

#### Simulated AI Data

```javascript
const SIMULATED_AI = {
  title: "Exploring: Why Leaves Change Colour",
  description: "Investigate why leaves change colour in autumn through close observation, simple experiments, and research",
  understanding: "Plants respond to seasonal changes in daylight and temperature by withdrawing nutrients from their leaves, causing the colour change we observe",
  watchFor: "They start forming their own theories about why the colour changes. Do they connect it to the seasons? Are they noticing patterns?",
  pivot: "If new questions come up during the investigation (they will!), note them down. Each one could become its own module. For now, gently steer back to the original question.",
  capabilities: [
    { id: 'S5', name: 'Scientific Observation', domain: 'Scientific', color: '#4ADE80', confidence: 'suggested' },
    { id: 'S2', name: 'Living Systems', domain: 'Scientific', color: '#4ADE80', confidence: 'suggested' },
    { id: 'EF1', name: 'Sustained Attention', domain: 'Executive Function', color: '#C084FC', confidence: 'suggested' },
    { id: 'L1', name: 'Oral Communication', domain: 'Language', color: '#E8A0BF', confidence: 'suggested' },
  ],
  steps: [
    {
      title: "Collect and observe",
      instructions: "Go outside and collect 5-6 leaves in different stages of colour change. Sort them from greenest to most changed — what patterns do you notice?",
      hint: "Watch for how they categorise — are they noticing gradients or just 'green' and 'brown'?"
    },
    {
      title: "Look closely",
      instructions: "Examine each leaf with a magnifying glass if you have one. Can you see the colour underneath the green? What's happening at the edges vs the centre?",
      hint: "Notice whether they're making detailed observations or surface-level ones"
    },
    {
      title: "Form a theory",
      instructions: "Why do you think the colour changes? Draw or write your theory. It doesn't have to be right — scientists start with guesses too.",
      hint: "Listen for reasoning beyond 'because it's autumn.' Are they trying to explain the mechanism?"
    },
    {
      title: "Research and compare",
      instructions: "Look up why leaves change colour in a book or reliable website. How does the real answer compare to your theory?",
      hint: "Watch for how they handle the gap between their theory and the real answer — curiosity or frustration?"
    }
  ],
  materials: [
    { name: "Collected autumn leaves (variety of colours)", isCore: true },
    { name: "Magnifying glass", isCore: false },
    { name: "Drawing/notebook supplies", isCore: false },
  ]
};
```

---

### 2.4 PATH 4: Retrospective Lift

**Filename:** `hearth-module-builder-retrospective-v1.html`
**`createdVia`:** `'retrospective'`

#### Entry Screen — Unique Multi-Step Flow

This is the most distinctive entry screen. It has **three sequential stages within the entry view** before transitioning to the shared editor. Use a sub-step indicator within the entry screen (not the three-view architecture — this is all within `view-entry`).

**Stage indicator (top of entry screen, below intro):**

```
┌─────────────────────────────────────────┐
│  ① Select a pattern  →  ② Review  →  ③ Preview  │
└─────────────────────────────────────────┘
```

Three dots/circles with labels. Active stage: ember. Completed: sage. Future: text-muted. Use a simple `display: flex; justify-content: space-between` row.

#### Stage 1: Select a Pattern

Display 1-3 detected pattern cards. Each card:

```
┌─────────────────────────────────────────┐
│  Nature Observation Walks               │
│  Based on 5 recent logs                 │
│  Feb 12 – Mar 8                         │
│                                         │
│  Science · Maths · Physical             │  ← subject tag pills
│                                         │
│  "We walked to the creek and looked     │  ← representative snippet
│   for tadpoles…"                        │
│                                 [Select] │
└─────────────────────────────────────────┘
```

Card styling: `background: var(--coffee-light); border: 1px solid var(--border-subtle)`. Selected state: `border-color: var(--ember); background: var(--ember-glow)`. Subject tags: small pills using text-muted style.

For the prototype, show 2 patterns:
1. "Nature Observation Walks" — 5 logs, Science/Maths/Physical
2. "Cooking & Baking Sessions" — 4 logs, Maths/Science/Language

If no patterns exist (empty state): show dimmed text — "Keep logging — we'll spot patterns as they form." Continue button disabled.

#### Stage 2: Review the Evidence

After selecting a pattern, animate in the evidence list. Show 4-5 matching log entries as compact cards:

```
┌─────────────────────────────────────────┐
│ ✓  Creek Walk — Tadpole Hunting         │  ← checkbox + title
│    Mar 8 · Science, Maths               │
│    "Found three frogs and counted       │
│     tadpoles in the shallow water…"     │
│    Emma 😊  Liam 🤩                     │  ← per-child engagement
│    Emma: "Noticed the tadpoles have     │  ← discovery snippet
│     tiny legs growing"                  │
└─────────────────────────────────────────┘
```

Each entry card has a checkbox (pre-checked). Parent can deselect entries that don't belong. If fewer than 2 remain checked, show a hint: "We need at least 2 entries to build a module."

Button: `"Synthesise these →"` (triggers AI synthesis and shows loading screen).

#### Stage 3: Preview Synthesis

After loading screen, return to entry view but show Stage 3 — the synthesised module preview. Display:

```
┌─────────────────────────────────────────┐
│  Suggested Module                        │
│─────────────────────────────────────────│
│  📝 Title                                │
│  [Nature Observation Walks]  ✨           │
│                                         │
│  💡 What they're learning                │
│  [AI-synthesised understanding]  ✨       │
│                                         │
│  📋 Suggested steps (4)                  │
│  1. Choose your focus                    │
│  2. Walk and observe                     │
│  3. Record                               │
│  4. Reflect                              │
│                                         │
│  👀 Signs it's working                   │
│  [Pre-filled from parent's own           │
│   discovery notes]  ✨                    │
│                                         │
│  🧭 Capabilities                         │
│  [S5] [S2] [EF1] [L1] [P1]             │
│                                         │
└─────────────────────────────────────────┘
```

All fields are read-only preview here. Full editing happens in the shared editor.

**Transition CTA:** `"Refine this module →"`

#### Entry Validation

Stage 1: a pattern must be selected. Stage 2: at least 2 entries must be checked. Stage 3: no validation — everything is AI-pre-filled.

#### AI Inference → Loading Screen

Triggered between Stage 2 and Stage 3 (not between entry and editor). Standard loading screen with Retrospective-specific content. After loading completes, returns to `view-entry` showing Stage 3, NOT to the editor.

The transition to the shared editor happens when the parent clicks "Refine this module →" from Stage 3. This transition is **instant** (no second loading screen).

#### Shared Editor Pre-Population

**Everything is pre-populated.** This pathway has the most AI-filled editor of any path.

| Editor Field | Source | AI-Suggested? |
|--------------|--------|---------------|
| Title | AI-synthesised from pattern | Yes ✨ |
| Description | AI-synthesised | Yes ✨ |
| Duration | AI-estimated from log averages | Yes ✨ |
| Setting | AI-inferred from log locations | Yes ✨ |
| Steps | AI-derived from common entry structure | Yes ✨ |
| Materials | Extracted from entry descriptions | Yes ✨ |
| Understanding | AI-synthesised from enriched entry insights | Yes ✨ |
| Watch-for | **Pre-filled from parent's own discovery notes** | Partially (parent's words, aggregated) |
| Pivot | AI-generated | Yes ✨ |
| Capabilities | Already tagged by Logger pipeline | Mostly explicit (pre-computed) |

#### Simulated Data

Pattern entries:

```javascript
const DETECTED_PATTERNS = [
  {
    id: 'pattern-nature',
    label: 'Nature Observation Walks',
    entryCount: 5,
    dateRange: 'Feb 12 – Mar 8',
    subjects: ['Science', 'Maths', 'Physical'],
    snippet: 'We walked to the creek and looked for tadpoles…',
    entries: [
      {
        id: 'log-001',
        title: 'Creek Walk — Tadpole Hunting',
        date: 'Mar 8',
        subjects: ['Science', 'Maths'],
        excerpt: 'Found three frogs and counted tadpoles in the shallow water. Emma tried to catch one but it was too fast.',
        engagement: { emma: '😊', liam: '🤩' },
        discovery: { emma: 'Noticed the tadpoles have tiny legs growing', liam: 'Counted 23 tadpoles!' },
      },
      {
        id: 'log-002',
        title: 'Garden Bird Watch',
        date: 'Mar 3',
        subjects: ['Science'],
        excerpt: 'Set up the bird feeder and watched for 20 minutes. Identified four different species with the guide book.',
        engagement: { emma: '🤩', liam: '😊' },
        discovery: { emma: 'Drew a detailed sketch of the magpie', liam: 'Noticed the smaller birds wait for the bigger ones to leave' },
      },
      {
        id: 'log-003',
        title: 'Leaf Collection Walk',
        date: 'Feb 26',
        subjects: ['Science', 'Maths'],
        excerpt: 'Collected leaves from 8 different trees. Sorted by shape and size. Pressed them in the flower press.',
        engagement: { emma: '😊', liam: '😊' },
        discovery: { emma: 'Noticed that trees with similar leaves grow near each other', liam: null },
      },
      {
        id: 'log-004',
        title: 'Rock Pool Exploration',
        date: 'Feb 19',
        subjects: ['Science', 'Physical'],
        excerpt: 'Explored rock pools at low tide. Found sea anemones, crabs, and shells. Very wet but very engaged.',
        engagement: { emma: '🤩', liam: '🤩' },
        discovery: { emma: 'Asked why the crab hides under the rock — habitat question!', liam: 'Carefully returned every creature to its pool' },
      },
      {
        id: 'log-005',
        title: 'Park Nature Journal',
        date: 'Feb 12',
        subjects: ['Science', 'Language'],
        excerpt: 'Sat in the park for 15 minutes in silence, then wrote and drew what we observed. Surprisingly focused.',
        engagement: { emma: '😊', liam: '😐' },
        discovery: { emma: 'Wrote a full paragraph about the ants', liam: null },
      },
    ],
  },
  {
    id: 'pattern-cooking',
    label: 'Cooking & Baking Sessions',
    entryCount: 4,
    dateRange: 'Feb 15 – Mar 5',
    subjects: ['Maths', 'Science', 'Language'],
    snippet: 'Made banana bread together. Doubled the recipe…',
    entries: [], // Abbreviated for prototype
  },
];
```

Synthesised module:

```javascript
const SIMULATED_SYNTHESIS = {
  title: "Nature Observation Walks",
  description: "Regular outdoor walks with focused observation and recording of local wildlife and plant life",
  understanding: "Careful observation of our local environment reveals patterns, changes, and connections between living things that we can learn to notice and understand",
  watchFor: "They start noticing things without being prompted — pointing out a bird behaviour, asking about a plant, or wanting to go back to check on something they noticed last time",
  pivot: "If the walk feels routine, try a new location or give them a specific challenge — count all the different types of leaves, or listen for bird calls",
  duration: 45,
  setting: 'outdoor',
  capabilities: [
    { id: 'S5', name: 'Scientific Observation', domain: 'Scientific', color: '#4ADE80', confidence: 'explicit' },
    { id: 'S2', name: 'Living Systems', domain: 'Scientific', color: '#4ADE80', confidence: 'explicit' },
    { id: 'EF1', name: 'Sustained Attention', domain: 'Executive Function', color: '#C084FC', confidence: 'suggested' },
    { id: 'L1', name: 'Oral Communication', domain: 'Language', color: '#E8A0BF', confidence: 'suggested' },
    { id: 'P1', name: 'Gross Motor', domain: 'Physical', color: '#F59E0B', confidence: 'suggested' },
  ],
  steps: [
    { title: "Choose your focus", instructions: "Before heading out, pick one thing to pay special attention to today — birds, insects, plants, or tracks.", hint: "Notice whether they can choose a focus independently or need suggestions" },
    { title: "Walk and observe", instructions: "Walk your usual route slowly. Stop when something catches your attention. Look, listen, touch, smell.", hint: "Watch for the quality of their observation — are they noticing details? Asking questions?" },
    { title: "Record", instructions: "Draw, photograph, or write about what you found. Even a quick sketch counts.", hint: "Notice the detail in their recording. Are they capturing what they actually observed?" },
    { title: "Reflect", instructions: "On the way home or at the table: What was the most interesting thing? Any new questions?", hint: "Listen for connections to previous walks — 'Remember when we saw…'" },
  ],
};
```

---

### 2.5 PATH 5: Goal-Forward (Update to Existing Prototype)

**Filename:** `hearth-module-builder-goal-v1.html`
**`createdVia`:** `'goal'`

The existing `hearth-module-builder-understanding-v1.html` covers aspiration mode. For v2, this needs:

1. **Rename:** "Understanding-First" → "Goal-Forward" throughout (header title, pathway tag, page title)
2. **Add thread-matching detection** to the primary text input (debounced keyword matching against the 57-thread library, client-side, no LLM)
3. **Add capability mode branch** (Section B from the spec)
4. **Restructure entry screen** to accommodate the mode split

#### Entry Screen Restructure

**Primary input (always shown):**

| Field | Type | Label | Placeholder |
|-------|------|-------|-------------|
| Goal text | Text input (generous) | What do you want them to learn or get better at? | e.g., 'I want them to understand that living things depend on their environment' or 'better at measurement' |

Below the input, a **thread match suggestion area** that responds to input (debounced 1.5s):

```
┌─────────────────────────────────────────┐
│  It sounds like you're thinking about   │
│  M5: Measurement Sense                  │
│                                         │
│  [✓ Yes, that's it]  [✕ Not quite]     │
└─────────────────────────────────────────┘
```

If confirmed → show Capability Mode fields (Section B).
If dismissed or no match → show Aspiration Mode fields (Section C, the existing prototype's fields).

#### Capability Mode Fields (Section B — NEW)

**B.1: Where Are They Now?**
Per-child tier selector cards:

```
┌──────── Emma ────────┐  ┌──────── Liam ────────┐
│ [Just starting]      │  │ [Just starting]      │
│ [Getting there] ✓    │  │ [Getting there]      │
│ [Solid]              │  │ [Just starting] ✓    │
└──────────────────────┘  └──────────────────────┘
```

Each tier option is a pill-style button showing the tier name + brief description from thread indicators. For prototype, use simulated Constellation data.

**B.2: What Does Your Family Enjoy?**
Multi-select preference chips (max 3, same pattern as Material-Anchored usage intents):

- 🌿 Outdoors / nature
- 🎨 Art / craft / making
- 📚 Books / reading
- 🎲 Games / puzzles
- 🧑‍🍳 Cooking / baking
- 🔬 Experiments / science
- 💻 Digital / apps
- 🏃 Active / physical
- 🗣️ Discussion / storytelling

**B.3: Quick Settings** — Duration + Setting

**Transition CTA (capability mode):** `"See some ideas →"`

After transition: loading screen → then **skeleton selection intermediate** (2-3 cards to choose from) before the shared editor.

**Skeleton selection screen:** Show 2-3 module skeleton cards (between loading and editor). Each card shows title, brief description, approach type, estimated duration. Parent taps one → shared editor pre-populated from skeleton.

#### Aspiration Mode Fields (Section C — existing, minor updates)

Same as current prototype but with updated labels:
- "What do you want them to understand?" → already there
- "Why does this matter?" → already there
- "What would you see if they're getting it?" → already there
- "What would you try if they're not?" → already there
- Quick Settings → already there

**Transition CTA (aspiration mode):** `"Plan the activities →"`

This is a significant rebuild of the existing prototype. The entry screen now has a **branching flow** based on thread detection.

---

## 3. Divergence Map

### 3.1 Full Component Matrix

| Component | Material | Process | Inquiry | Retrospective | Goal-Forward |
|-----------|----------|---------|---------|---------------|-------------|
| **HEADER** | SHARED | SHARED | SHARED | SHARED | SHARED |
| **Entry intro block** | SHARED (text parameterised) | SHARED | SHARED | SHARED | SHARED |
| **Form elements CSS** | SHARED | SHARED | SHARED | SHARED | SHARED |
| **Quick settings row** | SHARED | SHARED | SHARED | SHARED | SHARED |
| **Continue button** | SHARED | SHARED | SHARED | SHARED | SHARED |
| **Design tokens** | SHARED | SHARED | SHARED | SHARED | SHARED |
| **Responsive breakpoint** | SHARED | SHARED | SHARED | SHARED | SHARED |
| **Module data init** | SHARED (createdVia differs) | SHARED | SHARED | SHARED | SHARED |
| — | — | — | — | — | — |
| **Entry field set** | UNIQUE: resource type chips, name, desc, "what drew you", usage intent multi-chips | UNIQUE: activity name, desc, product toggle + conditional field | UNIQUE: question, child selector, prior knowledge, investigation cards | UNIQUE: 3-stage wizard (pattern cards → entry review → synthesis preview) | UNIQUE: goal input with thread detection → branching to aspiration or capability mode |
| **Multi-select chip pattern** | YES (usage intents, max 3) | NO | YES (investigation approaches, max 2) | NO | YES (preference chips in capability mode, max 3) |
| **Child selector** | NO | NO | YES | NO | NO |
| **Entry sub-stages** | NO | NO | NO | YES (3-stage indicator) | YES (mode branching) |
| **Entry validation** | Type + name + desc + intent | Name + desc | Question + approach | Pattern selected + ≥2 entries | Goal text (aspiration) or goal + tier + prefs (capability) |
| — | — | — | — | — | — |
| **Loading screen** | SHARED (text parameterised) | **UNIQUE: deferred/inline** | SHARED | **UNIQUE: appears between Stage 2 and 3, returns to entry** | SHARED |
| **Skeleton selection** | NO | NO | NO | NO | YES (capability mode only — intermediate screen between loading and editor) |
| — | — | — | — | — | — |
| **Shared editor** | SHARED | SHARED | SHARED | SHARED | SHARED |
| **Completeness bar** | SHARED | SHARED | SHARED | SHARED | SHARED |
| **Section headers** | SHARED | SHARED | SHARED | SHARED | SHARED |
| **Step cards** | SHARED | SHARED | SHARED | SHARED | SHARED |
| **AI suggestion badges** | SHARED | SHARED | SHARED | SHARED | SHARED |
| **Capability tags** | SHARED | SHARED | SHARED | SHARED | SHARED |
| **Coherence check** | SHARED | SHARED | SHARED | SHARED | SHARED |
| **Materials management** | SHARED | SHARED | SHARED | SHARED | SHARED |
| **Save/toast** | SHARED | SHARED | SHARED | SHARED | SHARED |
| — | — | — | — | — | — |
| **Deferred AI inline loading** | NO | YES (unique to Process) | NO | NO | NO |
| **Pre-populated steps** | YES (from template) | NO (parent writes) | YES (from investigation type) | YES (from synthesis) | YES (aspiration: empty / capability: from skeleton) |
| **Pre-populated materials** | YES (resource auto-added) | NO | YES (AI-suggested) | YES (from logs) | Capability mode only (from skeleton) |

### 3.2 New Patterns Introduced

These are patterns that don't exist in the reference prototype and need to be designed:

| Pattern | Used By | Description |
|---------|---------|-------------|
| **Multi-select chips (max N)** | Material, Inquiry, Goal-Forward (capability) | Same `.pill` styling but multiple can be selected. Excess pills dim when max reached. |
| **Child selector** | Inquiry | Multi-select pills with child colour indicators (rose/blue). |
| **Investigation approach cards** | Inquiry | Larger selectable cards with emoji, label, description. 1-2 selectable. Client-side generated from domain classification. |
| **Entry sub-stage indicator** | Retrospective | Horizontal progress dots/circles showing 3 stages within the entry view. |
| **Pattern cards** | Retrospective | Cards showing detected activity patterns with entry count, date range, subjects, snippet. |
| **Evidence review cards** | Retrospective | Compact log entry cards with checkbox, per-child engagement emojis, discovery snippets. |
| **Synthesis preview** | Retrospective | Read-only preview of AI-synthesised module before editor. |
| **Thread match suggestion** | Goal-Forward | Inline suggestion that appears below text input when keyword matches a capability thread. |
| **Per-child tier selector** | Goal-Forward (capability) | Per-child column with 3 tier radio buttons (emerging/developing/demonstrating). |
| **Skeleton selection cards** | Goal-Forward (capability) | 2-3 activity skeleton cards as an intermediate screen between loading and editor. |
| **Deferred AI inline loading** | Process | Inline loading indicator within The Learning editor section instead of full-screen loading view. |

### 3.3 CSS Additions Required

Beyond what exists in the reference prototype, these new CSS rules are needed:

1. **Multi-select pill group:** `.pill-group.multi-select .pill.disabled { opacity: 0.4; pointer-events: none; }`
2. **Child chip:** `.child-chip { ... }` — small pill with colour dot
3. **Investigation card:** `.investigation-card { ... }` — larger than pills, with emoji + description
4. **Stage indicator:** `.stage-indicator { ... }` — horizontal dots with labels
5. **Pattern card:** `.pattern-card { ... }` — log pattern display
6. **Evidence card:** `.evidence-card { ... }` — compact log entry with checkbox
7. **Thread match suggestion:** `.thread-match { ... }` — inline callout below input
8. **Tier selector:** `.tier-selector { ... }` — per-child tier radio group
9. **Skeleton card:** `.skeleton-card { ... }` — selectable module skeleton preview
10. **Inline loading:** `.inline-loading { ... }` — loading indicator within editor section

All new CSS should follow the design system: `coffee-light` backgrounds, `border-subtle` borders, ember for selected/active states, sage for confirmed, standard radius and transition values.

---

## 4. Build Sequence

### Recommended Order

| Priority | Pathway | Filename | Rationale |
|----------|---------|----------|-----------|
| **1** | Process | `hearth-module-builder-process-v1.html` | Closest to existing v3 builder. Entry screen is simplest (2 fields + toggle). Introduces ONE new pattern (deferred inline loading). Highest shared component reuse. Tests the "direct to editor" flow variant. |
| **2** | Material-Anchored | `hearth-module-builder-material-v1.html` | Second-simplest entry screen. Introduces multi-select chips (reusable by later pathways). Standard loading → editor flow. Session template pre-population tests the "heavily pre-filled editor" experience. |
| **3** | Inquiry | `hearth-module-builder-inquiry-v1.html` | Reuses multi-select from Material. Introduces investigation cards and child selector. More entry fields but standard flow. Tests "dynamically generated UI based on input" pattern. |
| **4** | Retrospective Lift | `hearth-module-builder-retrospective-v1.html` | Most complex entry screen (3 stages). Most new patterns (pattern cards, evidence cards, synthesis preview, stage indicator). Introduces the multi-step entry wizard. Should be built last when all shared patterns are proven. |
| **5** | Goal-Forward (rebuild) | `hearth-module-builder-goal-v1.html` | Rebuild of existing prototype. Introduces branching entry flow + capability mode with tier selectors and skeleton cards. Built last because it's a revision of existing work rather than new ground, and the capability mode patterns are the most architecturally complex. |

### Build Dependencies

```
Process (no new shared patterns needed)
    ↓
Material-Anchored (introduces multi-select chips)
    ↓
Inquiry (reuses multi-select, adds investigation cards + child selector)
    ↓
Retrospective Lift (uses all prior patterns, adds 3-stage entry wizard)
    ↓
Goal-Forward rebuild (uses multi-select + adds branching + skeleton selection)
```

### Estimated Effort Per Pathway

| Pathway | New CSS Patterns | Entry Screen Complexity | Simulated Data Volume | Estimate |
|---------|-----------------|------------------------|----------------------|----------|
| Process | 1 (inline loading) | Low (2 fields + toggle) | Medium (5 demo steps + deferred AI) | 2-3 hours |
| Material-Anchored | 1 (multi-select) | Medium (type chips + name + desc + vision + intents) | Medium (template steps + AI fields) | 3-4 hours |
| Inquiry | 2 (investigation cards, child selector) | Medium-High (question + children + prior knowledge + dynamic cards) | Medium (4 steps + AI fields + materials) | 3-4 hours |
| Retrospective Lift | 4 (stage indicator, pattern cards, evidence cards, synthesis preview) | High (3-stage wizard) | High (5 log entries + synthesis) | 5-6 hours |
| Goal-Forward rebuild | 3 (thread match, tier selector, skeleton cards) | High (branching flow + capability mode) | High (thread matching + skeletons) | 5-6 hours |

### Per-Prototype Checklist (for Claude Code)

For each pathway prototype, Claude Code should:

1. Copy ALL shared CSS from `hearth-module-builder-understanding-v1.html` (tokens, header, form elements, loading screen, shared editor, step cards, AI badges, capability tags, coherence banner, completeness bar, toast, responsive breakpoint)
2. Copy ALL shared JS (view management, pill selection, section toggle, step CRUD, material CRUD, completeness tracking, coherence check, save flow, capability render/promote/remove)
3. Replace entry screen HTML with pathway-specific fields
4. Replace loading screen text content per §1.6 table
5. Replace `moduleData.createdVia` value
6. Replace header title string
7. Replace simulated AI data
8. Add any new CSS patterns from §3.3 as needed
9. Add pathway-specific JS logic (validation, transitions, deferred AI if Process)
10. Pre-load demo data for walkthrough
11. Add version comment block at top
12. Test: entry validation enables/disables continue; loading animation plays; editor pre-populates correctly; completeness bar tracks; save toast fires

---

## 5. File Outputs Expected

| File | Content |
|------|---------|
| `hearth-module-builder-process-v1.html` | Complete HTML prototype — Process pathway |
| `hearth-module-builder-material-v1.html` | Complete HTML prototype — Material-Anchored pathway |
| `hearth-module-builder-inquiry-v1.html` | Complete HTML prototype — Inquiry pathway |
| `hearth-module-builder-retrospective-v1.html` | Complete HTML prototype — Retrospective Lift pathway |
| `hearth-module-builder-goal-v1.html` | Complete HTML prototype — Goal-Forward pathway (rebuild of Understanding-First) |

Each file should be a self-contained, single-file HTML prototype with inline CSS and JS — matching the pattern of the reference implementation. No external dependencies beyond Google Fonts.

---

## 6. COMPONENT_REGISTRY.md Updates

After all pathways are built, update the Module Builder entry in COMPONENT_REGISTRY.md:

**Replace** the "Additional Module Builder prototypes" line with:

```
**Module Builder pathway prototypes:**
- `hearth-module-builder-process-v1.html` (Pathway: Process/Steps)
- `hearth-module-builder-material-v1.html` (Pathway: Material-Anchored)
- `hearth-module-builder-inquiry-v1.html` (Pathway: Inquiry/Question)
- `hearth-module-builder-retrospective-v1.html` (Pathway: Retrospective Lift)
- `hearth-module-builder-goal-v1.html` (Pathway: Goal-Forward — replaces Understanding-First)
- `hearth-module-builder-understanding-v1.html` (superseded by goal-v1, preserved)
```

Spec reference: `hearth-module-builder-pathways-architecture-v2.md`

---

*This design brief was produced in an Opus design session on 20 March 2026. It is the authoritative build instruction for the four remaining Module Builder pathway prototypes plus the Goal-Forward rebuild. Claude Code sessions should reference this document alongside the v2 architecture spec for any ambiguity.*
