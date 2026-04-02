# Hearth LMS — System Interaction Map

> **Purpose:** Exhaustive mapping of every screen-to-screen connection, data object lifecycle, state transition, and shared concept across the platform. The single source of truth for how the system coheres.
> **Status:** Working draft — derived from all project specs + design clarifications (Feb 2026)
> **Supersedes:** `hearth-complete-user-flow.md` (partially outdated)
> **Read first:** `PROJECT_STATUS.md`, `COMPONENT_REGISTRY.md`

---

## Part 1: Navigation Architecture

### Primary Navigation (Revised)

```
┌──────────────────────────────────────────────────────────┐
│  HEARTH                                                  │
│                                                          │
│  ┌──────┐ ┌──────────┐ ┌─────────┐ ┌─────┐ ┌────────┐ ┌───┐
│  │ Home │ │Our Story │ │ Explore │ │ Log │ │ Build  │ │ ⚙ │
│  └──┬───┘ └────┬─────┘ └────┬────┘ └──┬──┘ └───┬────┘ └─┬─┘
│     │          │            │          │         │        │
│     ▼          ▼            ▼          ▼         ▼        ▼
│  Dashboard  Portfolio    Activity    Retro    Module    Family
│  (family    HEU Report  Discovery   Logger   Builder  Settings
│   hub)      Capabilities Marketplace          Badge
│             Learner                           Creator
│             Profile
└──────────────────────────────────────────────────────────┘
```

### Dashboard vs. Our Story — The Distinction

**Dashboard** is the family's internal messaging surface. It answers "what's happening with our learning right now?" in warm, opaque, family-wide language. It shows aggregate activity, today's plan, recent moments, gentle nudges — but deliberately avoids per-child detail or compliance pressure. The audience is the family talking to itself.

**Our Story** is the per-child reflective and evidence layer. It answers "what has [child] learned and how are we tracking?" The audience shifts: this is the data a parent reviews when they sit down intentionally, and the evidence base that feeds HEU compliance. Our Story contains:
- **Portfolio / Learning Journey** — the child's evidence gallery and growth narrative
- **HEU Compliance Report** — Queensland compliance status and gap analysis
- **Capabilities Constellation** — visual growth map across capability threads
- **Learner Profile** — identity portrait (who they are, not what they've done)

The key content distinction: Dashboard **celebrates** learning in present tense ("Great week — lots of outdoor discovery"). Our Story **documents** learning in retrospective ("Emma has demonstrated 14 capability threads this term, with strong evidence in Scientific Thinking"). Dashboard is a glance. Our Story is a sit-down.

> ⚠️ **ARTIFACT NEEDED:** The specific copy, card layout, and content differences between Dashboard and Our Story need a dedicated design artifact. See Artifact Tracker at end of document.

### Navigation Rules

1. **Dashboard** is always family-wide. It shows aggregate family learning, not per-child detail.
2. **Our Story** is the per-child branch. Entering Our Story requires selecting a child (or defaults to the first/only child). Portfolio, HEU Report, Capabilities, and Learner Profile all live here.
3. **Activity Discovery, Logger, Module Builder, Badge Creator, Family Settings** are family-level screens — they operate across children.
4. **Module Experience** is launched in session context (one or more children participating) and is not a navigation destination — it's opened from Activity Discovery, Weekly Planner, or a notification.

### Child Context Model

There is **no global active-child concept**. Each screen handles child context independently:

| Screen | Child Context | How Selected |
|--------|--------------|--------------|
| Dashboard | All children shown | N/A — family-wide |
| Portfolio | Single child | Tap child card from dashboard, or child dropdown |
| HEU Report | Single child | Child dropdown in breadcrumb |
| Learner Profile | Single child | Tap child card from dashboard |
| Capabilities | Single child | Tap child card from dashboard |
| Logger | Multi-select | "Who participated?" checkboxes during logging |
| Module Experience | Multi-select | "Who's joining?" during Prep mode |
| Weekly Planner | Family-wide | Activities may note intended children |
| Activity Discovery | Family-wide | Filtered by age range (which implicitly reflects children) |

---

## Part 2: Data Object Lifecycle

### 2.1 The Learning Entry — Core Data Object

Every logged learning event produces a **Learning Entry**. This is the atomic unit of data that flows through the entire system. Two creation paths produce the same core object with different metadata.

```
LEARNING ENTRY (core fields)
├── entry_id
├── family_id
├── learner_ids[]              ← which children participated
├── timestamp                  ← when the learning happened
├── title                      ← what happened (parent language)
├── description                ← freeform capture
├── evidence[]                 ← photos, audio, artifacts
├── per_child_data{}           ← keyed by learner_id
│   ├── [learner_id].engagement  ← emoji rating (colour-coded to child)
│   └── [learner_id].discoveries ← per-child observation text
├── source                     ← 'module' | 'retrospective'
├── source_module_id           ← null for retrospective entries
├── source_project_id          ← null unless part of a project
├── source_chunk_ids[]         ← which chunks were completed (modules only)
├── concepts_explored[]        ← checklist items (modules only)
├── capability_thread_mappings[] ← auto-suggested + confirmed
├── curriculum_descriptor_tags[] ← auto-mapped on backend
├── pedagogy_overlay_applied   ← which lens was active
└── status                     ← 'draft' | 'complete'
```

**Two creation paths:**

```
MODULE EXPERIENCE → Log Mode          RETROSPECTIVE LOGGER
─────────────────────────             ──────────────────────
• Knows which module was run          • Open-ended capture
• Pre-loads expected outcomes         • AI suggests connections
• Concepts checklist pre-filled       • Parent describes freely
• Capability mappings suggested       • System infers mappings
• 2-min completion target             • 5-min completion target
• Streamlined (context known)         • Guided (context discovered)
                     │                              │
                     └──────────┬───────────────────┘
                                ▼
                        LEARNING ENTRY
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
               Portfolio    HEU Report   Capabilities
               (per-child   (per-child   (per-child
                evidence)    compliance)  thread data)
```

**Key distinction:** Module logging is the preferred long-term path. It's faster and richer because the system already knows what outcomes to look for. The Retrospective Logger exists primarily for:
- Families onboarding who have existing learning to capture
- Genuinely spontaneous learning moments (park discoveries, kitchen conversations)
- Ad-hoc sessions outside the module system

The goal is to gently migrate families toward module-based learning over time, where logging is a streamlined 2-minute capstone rather than a 5-minute reconstruction.

### 2.2 Multi-Child Entry Behavior

When a learning entry involves multiple children:

- **One entry is created** with multiple `learner_ids` — not N duplicate entries
- **Per-child differentiation** is captured within the single entry via modified form fields:
  - Engagement level uses **colour-coded multi-select** — each child's emoji/rating is tagged to their colour identifier (matching their abstract shape)
  - Discovery/observation fields support **per-child annotations** — two form fields rather than one, allowing the parent to note different things for different children
  - The logging UI does NOT require separate loops per child — it's a single pass with multi-select inputs
- **Portfolio views** show this entry in each child's portfolio, surfacing only that child's engagement level and discoveries
- **HEU Report** counts this entry toward each child's curriculum coverage
- **Capabilities** maps the entry to each child's thread independently — the same activity may evidence different capability levels for different children
- **If two activities are planned at the same time for different children**, the system recognises distinct context and creates separate entries

> ⚠️ **ARTIFACT UPDATE NEEDED:** The Retrospective Logger (`hearth-logger-workspace.html`) and Module Experience Log Mode need UI updates to support colour-coded multi-select engagement and per-child discovery fields. See Artifact Tracker.

### 2.3 Content Object Lifecycle

Content moves through distinct states before becoming a learning entry:

```
CONTENT LIFECYCLE

  ┌─────────────────┐
  │  1. MARKETPLACE │  Premium packs and modules from educators
  │     (browse)    │  Visible in Marketplace screen
  │                 │  "Expand your library"
  └───────┬─────────┘
          │ Purchase
          ▼
  ┌─────────────────┐
  │  2. PURCHASED   │  Owned but not yet added to library
  │     (owned)     │  Still visible in Marketplace as "Owned"
  │                 │  Pack view shows all contained modules
  │                 │  "Add entire pack" or individual "Add"
  └───────┬─────────┘
          │ Add to library
          ▼
  ┌─────────────────┐
  │  3. MY LIBRARY  │  The family's activity pool
  │     (available) │  Browsable in Activity Discovery
  │                 │  "Things we'd like to try"
  │                 │  AI surfaces recommendations from here
  │                 │  Smaller pool = cheaper intelligence
  └───────┬─────────┘
          │ Assign to planner
          ▼
  ┌─────────────────┐
  │  4. PLANNED     │  Assigned to a specific day/week
  │     (scheduled) │  Visible in Weekly Planner
  │                 │  Triggers prep notifications
  └───────┬─────────┘
          │ Complete session + log
          ▼
  ┌─────────────────┐
  │  5. COMPLETED   │  Session done, learning logged
  │     (done)      │  Remains in library (can repeat)
  │                 │  Planner entry updates to "completed"
  │                 │  Repeat sessions keep same identity
  │                 │  but seek new insights/outcomes
  └─────────────────┘

MEMBERSHIP-INCLUDED CONTENT:
  Hearth-published modules are included with membership.
  No $0 pricing, no purchase flow, no transactional framing.
  Once published by the Hearth team → added directly to the
  platform catalog. Families add to their library like any
  other content. The belief: a large enough free catalog
  means parents can teach effectively with included content.
  Premium purchases come naturally once value is proven.

PARENT-CREATED MODULES skip to bucket 3:
  Module Builder → Save → My Library (directly)
  These are not marketplace content.
```

### 2.4 Badge Lifecycle

Two separate badge systems exist and must not be conflated:

**System Badges** — Pre-defined milestones within capability threads
- Defined in Sanity CMS as part of the capability thread library
- **Awarded seldomly.** Badges are meaningful milestones, not participation trophies.
- Triggered when the Capabilities Constellation detects a threshold has been passed, OR when project capstone outcomes are met
- The trigger generates a **secondary logging interface** that appears after the main logging flow completes
- Parent or learner answers 3–5 assessment questions in this secondary interface
- Parent then awards or defers the badge
- Map to Achievement Standards for HEU reporting
- **Physical badges** can be ordered or procured alongside purchased modules — tangible recognition matters

**User Badges** — Custom badges created by families
- Created via Badge Creator tool
- Represent personal goals, family values, or custom capabilities
- Tracked for patterns and personal milestones
- Treated as legitimate but **separate from system badges**
- Do NOT appear in the Capabilities Constellation
- Created in the context of user-created content

```
BADGE AWARD FLOW (System Badges)

  Module / Project Session → Log Mode (primary)
        │
        ▼
  Learning entry saved
  Capability thread data updated
        │
        ▼
  Constellation checks: has a badge threshold been crossed?
  OR: Has a project capstone been completed?
        │
        ├── No → Entry saved normally. Session ends.
        │
        └── Yes → SECONDARY LOGGING INTERFACE appears
                  (after main log, not during)
                  │
                  ▼
            "It looks like [Child] might be ready for
             [Badge Name]. Let's find out together."
                  │
                  ▼
            3–5 assessment questions
            (parent answers, or has learner answer)
                  │
                  ├── Award → Badge granted
                  │           Portfolio + Constellation updated
                  │           Physical badge available for order
                  │
                  └── Defer → "Not quite yet — we'll check
                               again as more evidence comes in."
                               No penalty. Threshold stays flagged.

  IMPORTANT: The delight of badge award is secondhand —
  the parent is the device user, not the child. The reward
  moment should be designed for the parent to share with
  the child, not as a screen animation the child watches.
  Consider: "Show [Child] what they've earned" as a
  shareable moment rather than an in-app celebration.
```

**Physical badges:** Modules and packs purchased from the Marketplace may include physical badge options. These are ordered alongside content, not earned separately. When a system badge is awarded digitally, the physical counterpart (if purchased) is unlocked for fulfilment. This creates a tangible bridge between platform evidence and real-world recognition.

---

## Part 3: Screen-by-Screen Interaction Specifications

### 3.1 Dashboard

**Role:** Family learning hub. Internal messaging. The "how are we doing together" view.

**Consumes from:**
- Weekly Planner → today's planned activities
- Learning Entries → recent family activity summary
- Notification queue → pending nudges, half-complete drafts
- Pedagogy profile → tone and framing of dashboard messaging

**Produces:**
- Navigation events to all other screens
- Child-context selection (tapping a child card navigates to Our Story for that child)

**Links to:**

| Destination | Trigger | Context Passed |
|-------------|---------|----------------|
| Our Story → Portfolio | Tap child card → "See journey" | child_id |
| Our Story → HEU Report | Tap child card → "See report" | child_id |
| Our Story → Learner Profile | Tap child card → "About [name]" | child_id |
| Our Story → Capabilities | Tap child card → "See growth" | child_id |
| Retrospective Logger | "Log" nav item or "Log a session" CTA | none |
| Activity Discovery | "Explore" nav item | none |
| Weekly Planner | "This week" section tap | none |
| Module Experience | Tap a planned activity for today | module_id, planned_activity_id |
| Family Settings | "Settings" nav item | none |
| Module Builder | "Build" nav item | none |
| Draft resume | Notification: "Continue logging?" | draft_entry_id |

**Adaptive behavior:**
- Phase 1: Time-based states (morning/afternoon/evening)
- Phase 2: Pattern detection after 2+ weeks of usage
- Always allows manual override without explanation

**Pedagogy overlay:** Active. Dashboard messaging uses family's philosophy vocabulary and values to frame learning summaries. Example: a Charlotte Mason family sees "A rich week of living books and nature study" rather than generic "5 activities completed."

### 3.2 Retrospective Logger

**Role:** Capture spontaneous or historical learning. Primary onboarding tool for families with existing learning history. Long-term secondary logging surface behind Module log mode.

**Consumes from:**
- Pedagogy profile → AI insights panel language and suggestions
- Capability thread library → auto-suggestion of relevant threads
- Learner profiles → child selector, interest matching
- Draft state → auto-saved incomplete entries

**Produces:**
- Learning Entries (source: 'retrospective')
- Draft entries (auto-saved)
- Capability thread evidence
- Curriculum descriptor mappings (backend)
- Badge assessment triggers (when evidence threshold met)

**Links to:**

| Destination | Trigger | Context Passed |
|-------------|---------|----------------|
| Dashboard | Save complete → return | none |
| Dashboard | Abandon/pause → auto-save → return | draft_entry_id stored |

**Does NOT link to:**
- Portfolio (no direct navigation from Logger to Portfolio)
- Capabilities Constellation (Logger doesn't navigate there)

**Draft/interrupt behavior:**
- Auto-save continuously
- After ~10 minutes of inactivity, queue a gentle notification: "Looks like you're busy — we've saved your progress. Come back when you have a moment."
- Close the logging surface, don't keep it open demanding attention
- Draft appears in notification queue and dashboard as "Continue logging?"
- Completeness gate at 50% — but drafts below 50% are still saved, just can't be "completed"

**Desktop vs. mobile:**
- Desktop: Two-column workspace (form left, AI insights right). Optimized for reflection.
- Mobile: Single-column tap-driven. Optimized for quick capture. AI insights collapsed behind a tab or swipe.

**Pedagogy overlay:** Active in AI insights panel. Suggestions framed through family's philosophy lens.

### 3.3 Module Experience

**Role:** The facilitation shell. Runs any content module through Prep → Facilitate → Log.

**Consumes from:**
- Module content (from Sanity CMS via My Library)
- Pedagogy profile → facilitation language, observation prompts, "Why This Matters" framing
- Learner profiles → age adjustment for content display
- Planned activity context → which module, which children, prep notification state

**Produces:**
- Learning Entries (source: 'module', with module_id and chunk completion data)
- In-session capture (photos, voice, notes during facilitation)
- Badge assessment triggers
- Planner status update → "completed"

**Three modes and their transitions:**

```
PREP MODE                    FACILITATE MODE              LOG MODE
─────────                    ───────────────              ────────
Materials checklist          Chunk-by-chunk steps         Who participated
Why This Matters             Say / Watch / Science blocks  Engagement levels
Session flow overview        Timers                       Concepts checklist
Key prompts preview          Quick capture (photo/voice)  Discoveries (freeform)
Pedagogy lens framing        Age adjustments              Media upload
                             Pivots ("if not landing")
         │                              │                        │
         │ "Start Session"              │ "End & Log"            │ "Save"
         └──────────►──────────────────►└──────────►────────────►│
                                                                 ▼
                                                         Learning Entry
                                                         + Badge check
                                                         + Planner update
```

**Draft/interrupt behavior:**
- Chunk position auto-saved
- Timer states preserved if navigating away
- Materials checklist states preserved
- After ~10 minutes inactivity: "We've bookmarked your spot in [Module Name]. Pick up when you're ready."
- Return to exact chunk and step position

**Links to:**

| Destination | Trigger | Context Passed |
|-------------|---------|----------------|
| Activity Discovery | "Back" from Prep mode | none |
| Dashboard | Save from Log mode | none |
| Badge assessment | Post-save if threshold met | badge_id, entry evidence |

**Desktop vs. mobile:**
- Desktop: 3-column (sidebar + main + guidance panel). Full facilitation workspace.
- Mobile: Single column with sticky header/footer. Optimized for the parent standing at the kitchen counter running a session. **This is the primary mobile-optimized experience.**

**Pedagogy overlay:** Active throughout. Prep mode shows philosophy-specific "Why This Matters." Facilitate mode uses philosophy-appropriate facilitation language. Watch For blocks may emphasize different observables based on family values.

### 3.4 Activity Discovery

**Role:** Module browser. The family's filtered view into My Library.

**Consumes from:**
- My Library → all modules added by the family
- Pedagogy profile → sort order, surfacing logic
- Learner profiles → age range filtering, spark matching
- Weekly Planner → "This week" coverage indicators (which subjects already covered)
- Learning Entries → completion history (which modules done, which repeatable)

**Produces:**
- Navigation to Module Experience (Start Module)
- Saved module bookmarks
- Weekly Planner additions (Save for Later → Library, or direct to Planner)

**Links to:**

| Destination | Trigger | Context Passed |
|-------------|---------|----------------|
| Module Experience | "Start Module" in preview modal | module_id |
| Weekly Planner | "Add to This Week" action | module_id, suggested_day |
| Marketplace | "Get More Modules" CTA | none |
| Learner Profile | (reverse: Sparks tap leads here) | pre-filtered by spark interest |

**Pedagogy overlay:** Active. Sort order and "suggested for you" recommendations use pedagogy profile. Module cards may show philosophy-specific framing text.

### 3.5 Weekly Planner

**Role:** 7-day scheduling. Aspirational planning with notification-driven handoff to execution.

**Consumes from:**
- My Library → activity pool to draw from
- Learning Entries → completion status
- Pedagogy profile → subject balance framing
- Notification system → prep reminders

**Produces:**
- Planned activity assignments (day + module + optional child context)
- Prep notifications (triggered before planned session time)
- Post-session logging invitations
- Subject balance statistics

**The Planner → Module → Logger pipeline:**

```
WEEKLY PLANNER
  Parent plans "Bread Module — Tuesday afternoon"
      │
      ▼
  NOTIFICATION (Tuesday morning or configurable)
  "Time to prep for The Magic of Bread! Gather: flour, yeast, water..."
      │
      ▼
  MODULE EXPERIENCE (Prep mode)
  Parent taps notification → opens Module prep
      │
      ▼
  MODULE EXPERIENCE (Facilitate mode)
  Session runs through chunks
      │
      ▼
  MODULE EXPERIENCE (Log mode)
  "End & Log" → 2-minute logging capture
      │
      ▼
  LEARNING ENTRY saved
  + PLANNER updates to "completed" for Tuesday
  + BADGE check runs
  + Library records session completion
      │
      ▼
  NOTIFICATION (optional, end-of-day)
  "Great session today! [Child] seemed to love the kneading."
```

**Planned and logged activities share identity.** A planned activity is not a separate object that gets "matched" to a log — they are the same record transitioning through states: `planned → in_progress → completed`.

**Repeating activities:** If a module is scheduled again, a new planned-activity instance is created with the same module_id. The experience changes: logging prompts shift toward "What was different this time?" and "Any new insights?" rather than repeating the same outcome checklist.

**Pedagogy overlay:** Active. Subject balance display uses family's value priorities to frame what's "balanced" — a nature-focused family sees outdoor time weighted differently than an academic-focused family.

### 3.6 Portfolio / Learning Journey

**Role:** Per-child evidence gallery. The "look how far you've come" view.

**Consumes from:**
- Learning Entries → filtered to this child
- Badge awards → earned badges display
- Capability thread mappings → thread-organized evidence
- Learner Profile → tagline, shape identifier
- Pedagogy profile → presentation framing

**Produces:**
- Evidence selection for HEU Report (work sample curation)
- Emotional reassurance for parents (primary purpose)

**Links to:**

| Destination | Trigger | Context Passed |
|-------------|---------|----------------|
| HEU Report | "See compliance status" or similar CTA | child_id |
| Capabilities Constellation | "See growth map" CTA | child_id |
| Learner Profile | Child name/shape tap | child_id |

**Does NOT link to:**
- Retrospective Logger (no "add evidence from here" flow)
- Module Experience (portfolio is retrospective, not a launch point)

**Pedagogy overlay:** Active. How learning evidence is presented and described uses family's philosophy language.

### 3.7 HEU Compliance Report

**Role:** Queensland compliance documentation. Honest self-assessment tool.

**Consumes from:**
- Learning Entries → curriculum descriptor coverage calculations
- Badge awards → capability evidence
- Capability thread data → DLO completion rates
- Family registration → timeline calculations
- Achievement Standards (Sanity CMS reference data) → what's required

**Produces:**
- Compliance posture assessment (On Track / Needs Attention / At Risk)
- Gap identification → recommended modules
- HEU export document (auto-generated on backend)
- Work sample annotations

**Links to:**

| Destination | Trigger | Context Passed |
|-------------|---------|----------------|
| Activity Discovery | "Recommended modules" to fill gaps | pre-filtered by gap subject |
| Portfolio | "View evidence" for a subject area | child_id + subject filter |

**Pedagogy overlay:** Active. The tone of gap recommendations uses family's philosophy framing rather than generic curriculum language.

### 3.8 Learner Profile

**Role:** Identity portrait. Who is this person as a learner?

**Consumes from:**
- Family Settings → name, DOB, year level (read-only here)
- Learner-specific data → sparks, rhythms, facilitator notes
- My Library → module count matching sparks (for spark count badges)

**Produces:**
- Spark-filtered navigation to Activity Discovery
- Rhythm data consumed by recommendation engine
- Facilitator notes (private, never exported)

**Links to:**

| Destination | Trigger | Context Passed |
|-------------|---------|----------------|
| Activity Discovery | Tap a Spark tag | pre-filtered by spark interest |
| Activity Discovery | "Explore all matches" CTA | filtered by union of all sparks |
| Family Settings | "Edit name/DOB" scope note link | child_id |

**Pedagogy overlay:** Not directly. Profile is philosophy-neutral. The Rhythms section captures individual differences that exist regardless of philosophy.

### 3.9 Capabilities Constellation

**Role:** Visual map of capability thread growth. Tracking, visibility, AND badge threshold detection.

**Consumes from:**
- Capability thread library (Sanity CMS) → thread definitions, badge levels, DLOs
- Learning Entries → observation/moment data mapped to DLOs
- Badge awards → milestone markers on threads
- Achievement Standard mappings → for HEU reporting bridge

**Produces:**
- Visual growth representation
- Thread-level detail views (zoom into DLOs)
- Data consumed by HEU Report for coverage calculations
- **Badge threshold detection** — when accumulated evidence crosses a badge-level boundary, the Constellation flags this for the next logging session

**Does NOT produce:**
- Learning entries (constellation doesn't log)
- Module recommendations (that's Activity Discovery / HEU Report)
- The badge assessment interface itself (that's triggered post-logging)

**Badge threshold mechanics:** The Constellation continuously evaluates DLO evidence against badge requirements. When a threshold is crossed, it doesn't interrupt the parent — it queues the badge assessment to appear as a secondary interface after the next relevant logging session. This keeps the badge moment connected to active learning rather than appearing as a random notification.

**Links to:**

| Destination | Trigger | Context Passed |
|-------------|---------|----------------|
| Portfolio | "See evidence" for a specific thread | child_id + thread_id |
| HEU Report | "See compliance mapping" | child_id |

### 3.10 Marketplace

**Role:** Content discovery and acquisition for packs and modules from other educators.

**Consumes from:**
- Pack/module catalog (Sanity CMS)
- Family's purchase history
- Pedagogy profile → recommendation surfacing

**Produces:**
- Purchase events → content moves to "Purchased" bucket
- "Add to Library" events → content moves to My Library

**Links to:**

| Destination | Trigger | Context Passed |
|-------------|---------|----------------|
| Activity Discovery | After adding modules to library | none (modules now appear in browse) |
| Pack detail view | Tap purchased pack → see all modules → individual "Add" | pack_id |

### 3.11 Module Builder

**Role:** Content creation. UbD backward design enforced.

**Consumes from:**
- Template library → starting structures
- Capability thread library → for curriculum tagging
- Pedagogy framework → to ensure philosophy-neutral content creation

**Produces:**
- New modules → saved directly to My Library (not Marketplace)
- Modules follow the three-layer content model (raw content only — no pedagogy baked in)

**Links to:**

| Destination | Trigger | Context Passed |
|-------------|---------|----------------|
| My Library / Activity Discovery | Module saved → appears in browse | module_id |

### 3.12 Badge Creator

**Role:** Custom badge design for family-specific goals.

**Consumes from:**
- Capability descriptors (optional linking)
- Family context

**Produces:**
- User badges (separate from system badges)
- Custom capability descriptions

**User badges are legitimate but separate.** They track personal goals and patterns. They do not appear in the Capabilities Constellation and do not map to Achievement Standards.

### 3.13 Pedagogy Engine

**Role:** Family philosophy configuration. Set once, applied everywhere.

**Consumes from:**
- Philosophy definitions (5 core + Eclectic)
- Values catalog (10 options, pick up to 5, prioritized)
- Practices catalog (12 options, pick up to 5, prioritized)

**Produces:**
- `familyPedagogicalProfile` object consumed by almost every screen
- No per-child philosophy settings (pedagogy is family-level)

**Where the overlay is active (confirmed):**

| Screen | How Overlay Manifests |
|--------|----------------------|
| Module Experience | Facilitation language, "Why This Matters," observation prompts |
| Activity Discovery | Sort order, recommendation surfacing, module card framing |
| Retrospective Logger | AI insights panel suggestions and language |
| Portfolio | Evidence presentation and description framing |
| HEU Report | Gap recommendation framing, tone of assessment |
| Weekly Planner | Subject balance framing relative to family values |
| Dashboard | Learning summary messaging vocabulary |

**Where overlay is NOT active:**
- Learner Profile (philosophy-neutral identity portrait)
- Capabilities Constellation (curriculum-aligned, not philosophy-specific)
- Family Settings (configuration, not content)
- Badge Creator (capability descriptions are philosophy-neutral)
- Module Builder (content created philosophy-neutral by design)

### 3.14 Family Settings

**Role:** Account configuration hub. Onboarding gate for new families.

**Consumes from:**
- Account data → family details, subscription
- Child data → names, DOBs, year levels
- Pedagogy Engine output → current philosophy settings
- HEU registration → compliance timeline data

**Produces:**
- Family configuration consumed by entire platform
- Child records referenced everywhere
- Pedagogy profile (via embedded Pedagogy Engine access)

**Critical path:** This is the first screen after onboarding account creation. New test families configure their account here before accessing the dashboard.

### 3.15 Notification / Nudge System (PLANNED — Not Yet Built)

**Role:** The connective tissue between screens. Drives the Planner → Module → Logger pipeline.

**Notification types required:**

| Type | Trigger | Action |
|------|---------|--------|
| Prep reminder | Planned activity approaching | Opens Module Experience Prep mode |
| Log invitation | Module session completed OR end-of-day | Opens Module Log mode or Logger |
| Draft resume | Auto-saved incomplete entry | Opens Logger with draft loaded |
| Pause acknowledgment | ~10 min inactivity during logging/module | Saves state, closes, invites return |
| Compliance nudge | HEU deadline approaching + gaps detected | Opens HEU Report |
| Streak prompt | X days since last logged activity | Opens Logger or Dashboard |
| Badge ready | Evidence threshold met for a badge | Opens badge assessment flow |

**Design principle:** Notifications revolve around the half-completed state. The most common notification is "you started something, here's a gentle invitation to finish it" — not "you should be doing something."

---

## Part 4: Cross-Cutting Concerns

### 4.1 Auto-Save Pattern

Every screen with user input implements auto-save:

| Screen | What's Saved | Resume Path |
|--------|-------------|-------------|
| Retrospective Logger | All form fields, media uploads | Notification → draft resume → Logger with state |
| Module Experience | Current chunk, step, timer states, checklist states | Notification → resume → exact position |
| Module Builder | All stage content | Builder reopens at last stage |
| Weekly Planner | Partial plan changes | Planner reopens with unsaved changes |

**Inactivity timeout:** ~10 minutes → save + gentle close + notification queued. Not urgent. Life happens.

### 4.2 Desktop vs. Mobile Strategy

The principle is: **reward desktop use, never limit mobile capability.**

| Screen | Desktop Experience | Mobile Experience |
|--------|-------------------|-------------------|
| Dashboard | Full family hub with all cards visible | Scrollable cards, same content |
| Logger | Two-column workspace (form + AI insights) | Single column, AI insights behind tab |
| Module Experience | 3-column (sidebar + main + guidance) | Single column, sticky header/footer. **Primary mobile experience** |
| Portfolio | Gallery grid with detail panels | Scrollable gallery, tap-to-expand |
| HEU Report | Full data display with charts | Scrollable, charts scale down |
| Activity Discovery | 3-column grid with sticky filters | Single column, filter drawer |
| Weekly Planner | Full 7-day view | Day-at-a-time with swipe |
| Module Builder | Full workspace with preview | Functional but desktop-optimized |
| Capabilities | Full constellation with zoom | Simplified thread list with expandable detail |

**Key mobile-optimized screens** (where the parent is most likely standing, phone in hand):
1. Module Experience — running a session at the kitchen table
2. Retrospective Logger — quick capture while the moment is fresh
3. Dashboard — glancing at what's planned

**Desktop-optimized screens** (where the parent has sat down intentionally):
1. Module Builder — content creation requires focus
2. HEU Report — compliance review is reflective
3. Portfolio — evidence curation is a sit-down activity
4. Weekly Planner — planning benefits from full view
5. Family Settings — configuration is a one-time setup

### 4.3 Onboarding → Real App Data Handoff

Onboarding captures real data that persists into the real account:

| Onboarding Action | Persists? | Where It Lands |
|-------------------|-----------|----------------|
| Log an activity | Yes | Learning Entry in Portfolio + Logger history |
| Light planning with free content | Yes | Weekly Planner + My Library (starter content) |
| See progress | Demonstrative only | Portfolio shows the logged activity |
| Explore | Demonstrative only | Activity Discovery shows available free content |
| Account details | Yes | Family Settings (name, email, children) |

The purpose is to get families into "learning mode" immediately with real data, not to demo features they won't use. Every onboarding action produces real artifacts the family will see when they land on the dashboard.

### 4.4 Content Hierarchy Summary

```
PROJECT (3–6 week sequential build, cross-domain)
  └── STAGE (sequential, artifact dependencies)
       └── MODULE (multi-session, single understanding target)
            └── APPROACH (door into understanding, different paths)
                 └── CHUNK (5–15 min discrete phase)
                      └── STEP (sub-phase within chunk)

PACK (themed collection of related modules, flexible order)
  └── MODULE → APPROACH → CHUNK → STEP

ACTIVITY (standalone, single session, 15–45 min)
  └── Essentially a single-chunk module
```

**Content is philosophy-neutral at every level.** Pedagogy is a Layer 3 runtime overlay, never baked into content structure.

### 4.5 Project Experience — Integration Architecture

Projects are the most complex content type. They are interconnected, scaffolded modules where each session's output is required to proceed to the next. This extends the Module Experience pattern but adds sequential dependency and capstone synthesis.

**How Projects differ from loose Modules:**

```
MODULE (standalone)              PROJECT (scaffolded sequence)
──────────────────               ──────────────────────────────
Session output is self-contained Each session output feeds the next
Logging captures the session     Logging captures session + project context
Badge check runs per-session     Badge check runs at capstone
Portfolio gets individual entry  Portfolio gets individual entries
                                 PLUS capstone summary of entire arc
```

**Project session logging flow:**

```
PROJECT: "My Imaginary Friend" (8 stages, 3–4 weeks)

  Stage 1: Create Your Character
       │
       ▼ Session runs via Module Experience shell
       │
       ▼ Log Mode (primary) — captures session evidence
       │   Output: character description artifact
       │   Learning entry saved to Portfolio
       │   Capability threads updated
       │
       ▼ Output artifact stored as PROJECT DATA
         (feeds Stage 2 as input/dependency)
       │
  Stage 2: Build Their World
       │
       ▼ Prep mode shows: "Last time, [Child] created [Character].
         Today we'll build the world they live in."
       │
       ▼ ... sessions continue, each building on prior artifacts ...
       │
  Stage 8 (Capstone): Present Your Story
       │
       ▼ Session runs + logs (primary logging)
       │
       ▼ CAPSTONE FEEDBACK LAYER (additional)
         Summarises all stage outputs into a synthesis:
         - What was built across the project
         - Growth demonstrated from Stage 1 → 8
         - Cross-domain capability evidence
         - Feeds Portfolio as a rich project narrative
       │
       ▼ Badge threshold check (project-level badges)
         If met → secondary badge assessment interface
```

**Key architectural points:**
- Each stage produces its own learning entry (logged individually)
- Stage artifacts are stored as **project data** — accessible to subsequent stages
- The capstone stage produces an additional **synthesis entry** that aggregates all stage evidence into a single portfolio narrative
- Project-level badges are checked at capstone completion, not per-stage
- This process runs **alongside** the Constellation — project data feeds capability threads the same way module data does
- The Module Experience shell handles individual stage facilitation; the Project Experience screen handles the cross-stage navigation and artifact threading

> **IMPLEMENTED (2 April 2026):** Project Experience at `src/app/(auth)/project/[id]/page.tsx`. Stage locking enforces sequential dependencies. Artifact notes captured per-stage via localStorage. Each completed stage creates a `learning_entry` with `sourceProjectId` and `sourceStageNumber`. Entries flow through standard AI enrichment → snapshot rebuild pipeline. Pedagogy overlay applied via `usePedagogy()` hook. Project discovery integrated into Activity Discovery page (`/explore/activities`).

---

## Part 5: Integration Pipeline — The Core Value Loop

This is the sequence of interactions that constitutes Hearth's primary value delivery:

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE CORE VALUE LOOP                          │
│                                                                 │
│  1. DISCOVER                                                    │
│     Activity Discovery (or Planner, or Notification)            │
│     Parent finds/is prompted with a module                      │
│              │                                                  │
│              ▼                                                  │
│  2. FACILITATE                                                  │
│     Module Experience (Prep → Chunks → Log)                     │
│     Parent runs session, captures evidence                      │
│              │                                                  │
│              ▼                                                  │
│  3. LOG                                                         │
│     Module Log Mode (or Retro Logger for spontaneous)           │
│     Learning entry created with evidence                        │
│              │                                                  │
│              ▼                                                  │
│  4. GROW                                                        │
│     Capabilities update, badge thresholds checked               │
│     Portfolio enriched, HEU coverage advances                   │
│              │                                                  │
│              ▼                                                  │
│  5. REFLECT                                                     │
│     Portfolio shows journey, HEU shows compliance               │
│     Constellation shows growth, Dashboard celebrates            │
│              │                                                  │
│              ▼                                                  │
│  6. PLAN                                                        │
│     Weekly Planner, AI recommendations, gap-filling             │
│     HEU gaps → suggested modules → back to Discover             │
│              │                                                  │
│              └──────────► back to step 1                        │
└─────────────────────────────────────────────────────────────────┘
```

**Every screen in the platform serves one or more stages of this loop.** If a screen doesn't clearly contribute, it needs justification.

---

## Part 6: Identified Gaps and Open Questions

### Resolved by This Document

| Previously Unclear | Resolution |
|-------------------|------------|
| Two logging surfaces overlap | Same data object, different creation contexts. Module logging is preferred long-term path. |
| "Our Story" vs Dashboard | Both retained. Dashboard = family-wide internal messaging, present tense, celebrates. Our Story = per-child reflective evidence layer, retrospective, documents. |
| Planned vs. logged identity | Same record, state transition: planned → in_progress → completed. |
| Badge trigger mechanism | Constellation detects threshold OR project capstone met → secondary logging interface appears after next relevant log session. Badges awarded seldomly. |
| Pedagogy overlay scope | Active on 7+ screens, inactive on 5. Vocabulary adapter at `src/lib/pedagogy/adapter.ts` + `usePedagogy()` hook drive terminology. Sanity `pedagogyOverlay` documents provide per-activity guidance. Overlay-active screens: Dashboard, Logger, Module Experience, Activity Discovery, Portfolio, HEU Report, Capabilities Constellation. |
| Content library buckets | Five states: unpurchased → purchased → library → planned → completed. Membership-included content skips purchase. |
| Multi-child entries | One entry with colour-coded multi-select per-child engagement and per-child discovery fields. Not N separate loops. |
| User vs. system badges | Separate systems. User badges are legitimate but outside Constellation. |
| Free content model | Membership-included, no $0 pricing or transactional framing. Published by Hearth team → available in catalog. |
| Facilitator Dashboard | Shelved. No distinct facilitator role in MVP. Parent IS the facilitator. Revisit when community hubs/"hearths" are built. |
| Project Experience logging | Each stage logs independently. Capstone produces synthesis entry feeding portfolio. Project data (artifacts) thread between stages. Runs alongside Constellation, not separate from it. |

### Still Open — Requires Design Work

| # | Question | Impact | Status |
|---|----------|--------|--------|
| 1 | **Badge secondary logging interface** | High | RESOLVED — `hearth-badge-assessment-spec.md` + `/badges/assess/[id]` implemented |
| 2 | **Badge award moment** | High | RESOLVED — Badge assessment UI with secondhand delight moment implemented |
| 3 | **Dashboard vs Our Story content spec** | High | RESOLVED — `Hearth_Dashboard_Our_Story_Content_Spec.md` created |
| 4 | **AI/Intelligence layer architecture** | High | RESOLVED — `Hearth_AI_Intelligence_Layer_Architecture.md` created, pipeline operational |
| 5 | **Notification system detailed design** | High | RESOLVED — `hearth-notification-system-spec.md` created, `/notifications` route implemented |
| 6 | **HEU six-work-sample curation flow** | High | RESOLVED — `hearth-heu-work-sample-curation-spec-v1.md` created, report APIs with sample slots + annotations implemented |
| 7 | **Regression handling** | Medium | RESOLVED — Tier override API at `/api/capabilities/[learnerId]/override`, stored in `profileData.tierOverrides` |
| 8 | **Historical data import / batch retrospective logging** | Medium | PARTIAL — CSV import at `/api/entries/import`. Bulk retrospective not designed |
| 9 | **Constellation → logged moments drill-down** | Medium | RESOLVED — Evidence drill-down in Capabilities Constellation, filters entries by thread_id from `/api/entries` |
| 10 | **Repeat module logging evolution** | Medium | RESOLVED — Module log mode detects attempt number, shifts prompts (Session 1: capture, Session 2+: what shifted/deepening) |
| 11 | **Voice input integration** | Medium | RESOLVED — Web Speech API (en-AU) in Logger |
| 12 | **Empty/first-use states per screen** | Medium | RESOLVED — All screens have empty states via shared EmptyState component |
| 13 | **Gentle migration from retro logging to modules** | Low | RESOLVED — `module_nudge` notification trigger after 10+ retro entries, 2-week cooldown |
| 14 | **Data deletion and privacy model** | Medium | RESOLVED — `hearth-data-deletion-privacy-model-v1.md`, `/api/account/delete` + `/api/account/export` |
| 15 | **Learner-facing views** | Low | Scoped to Phase 2 |
| 16 | **Offline/poor connectivity** | Low | OPEN — not addressed |

### Shelved — Not MVP

| Item | Why Shelved | Revisit When |
|------|-------------|-------------|
| Facilitator Pedagogical Dashboard (`Facilitator_Pedagogical_Dashboard.tsx`) | No distinct facilitator role yet. Parent IS the facilitator in home education context. | Community hubs / "hearths" feature set, Phase 2+ |
| Learner-facing experience | MVP serves parent-facilitators only. Children don't interact with the device as primary users. | Phase 2+ when children are old enough / families request it |
| Community features | No social, sharing, or peer features in MVP | Phase 2 (50–100 families) |

---

## Part 7: Screen Dependency Graph

Which screens MUST work for others to function:

```
CRITICAL PATH (must work for MVP test families):

  Family Settings (onboarding gate)
       │
       ▼
  Dashboard ◄──── Pedagogy Engine (family profile)
       │
       ├──► Our Story (per-child branch)
       │      ├──► Portfolio
       │      ├──► HEU Report
       │      ├──► Capabilities Constellation
       │      └──► Learner Profile
       │
       ├──► Retrospective Logger ──► Learning Entries
       │                                    │
       ├──► Activity Discovery              ▼
       │         │                    Portfolio
       │         ▼                    HEU Report
       │    Module Experience         Capabilities
       │         │
       │         ▼
       │    Module Log Mode ──► Learning Entries
       │         │                    │
       │         ▼                    ▼
       │    Badge threshold? ──► Secondary badge interface
       │
       └──► Weekly Planner
                 │
                 ▼
            Notifications (prep, log, resume)
                 │
                 ▼
            Module Experience (via notification)
```

**Phase 1 MVP minimum viable loop:**
1. Family Settings → configure account
2. Dashboard → see family hub
3. Retrospective Logger → capture learning (immediate value)
4. Module Experience → run a module + log (richer value)
5. Portfolio → see evidence accumulated
6. HEU Report → see compliance status

**Everything else enhances the loop but isn't blocking.**

---

## Part 8: Artifact Tracker

Work identified by this document that requires new artifacts or updates to existing ones. Items marked 🆕 need creation in new sessions. Items marked 🔄 need returning to previous chats to update existing project documents.

### New Artifacts Needed

| # | Artifact | Description | Priority | Status |
|---|----------|-------------|----------|--------|
| A1 | ~~Dashboard vs Our Story Content Spec~~ | Content differentiation spec | High | **DONE** — `Hearth_Dashboard_Our_Story_Content_Spec.md` |
| A2 | ~~Badge Assessment Secondary Interface~~ | Badge assessment UI | High | **DONE** — `hearth-badge-assessment-spec.md` + `/badges/assess/[id]` |
| A3 | ~~Notification / Nudge System Design Spec~~ | Notification system spec | High | **DONE** — `hearth-notification-system-spec.md` + `/notifications` route |
| A4 | ~~AI/Intelligence Layer Architecture~~ | AI service design | High | **DONE** — `Hearth_AI_Intelligence_Layer_Architecture.md`, pipeline operational |
| A5 | ~~Project Experience Integration Spec~~ | Project stage artifacts + logging pipeline | Medium | **DONE** — Implemented in `src/app/(auth)/project/[id]/page.tsx`. Stage locking, artifact notes, `sourceProjectId` entries |
| A6 | ~~Data Deletion & Privacy Model~~ | Cascade rules, privacy compliance | Medium | **DONE** — `hearth-data-deletion-privacy-model-v1.md` + `/api/account/delete` |

### Existing Artifacts Needing Updates

| # | Artifact | File | What Needs Updating | Status |
|---|----------|------|---------------------|--------|
| B1 | 🔄 **Retrospective Logger** | `hearth-logger-workspace-v3.html` | Per-child engagement fields, discovery fields | **DONE** — v3 prototype + React implementation |
| B2 | 🔄 **Module Experience Log Mode** | `hearth-module-experience-v3.html` | Per-child multi-select, badge threshold transition | **DONE** — v3 prototype + React at `/module/[id]` |
| B3 | 🔄 **HEU Report Screen** | `hearth-report-screen-v2.html` | Six-work-sample curation flow | **DONE** — Spec + report APIs with sample slots + annotations |
| B4 | 🔄 **Capabilities Constellation** | `hearth-capabilities-v4.html` | DLO → moments drill-down, evidence trail | **DONE** — Evidence drill-down in React at `/our-story/capabilities` |
| B5 | 🔄 **Activity Discovery** | `hearth-activity-discovery-v3.html` | Planner integration, project discovery | **DONE** — v3 prototype + React at `/explore/activities` with project cards |
| B6 | 🔄 **Weekly Planner** | `hearth-weekly-planner-v4.html` | Subject balance data source, state transitions | **DONE** — v4 prototype + React at `/planner` |
| B7 | 🔄 **Complete User Flow** | `hearth-complete-user-flow.md` | Replace with System Interaction Map | **DONE** — Marked deprecated in COMPONENT_REGISTRY |
| B8 | 🔄 **Module Experience UX Flows** | `Hearth_Module_Experience_UX_Flows.md` | Repeat-session logging, voice input | Repeat logging **DONE** in React. Voice input Logger only |
| B9 | 🔄 **Dashboard Design Decisions** | `hearth_dashboard_design_decisions.md` | Content specification | Covered by `Hearth_Dashboard_Our_Story_Content_Spec.md` |
| B10 | 🔄 **Project Design Specification** | `hearth-project-design-specification.md` | Stage logging, artifact threading | **DONE** — Implemented in React at `/project/[id]` |
| B11 | 🔄 **COMPONENT_REGISTRY.md** | `COMPONENT_REGISTRY.md` | Shelved items, badge assessment | **DONE** — Updated 2 April 2026 |
| B12 | 🔄 **PROJECT_STATUS.md** | `PROJECT_STATUS.md` | Known gaps, API counts, table counts | **DONE** — Updated 2 April 2026 |

### Session Planning

| Session | Scope | Artifacts Touched |
|---------|-------|-------------------|
| **Session A: Dashboard + Our Story** | Define the content and copy distinction. Design both surfaces with clear data differentiation. | A1, B9 |
| **Session B: Badge Assessment + Award** | Design the secondary logging interface, award ceremony, physical badge integration. | A2 |
| **Session C: Notification System** | Full design spec for the last unbuilt screen. | A3 |
| **Session D: AI/Intelligence Layer** | Expansive architecture session. Token optimisation, memory-like backend, logger intelligence. | A4 |
| **Session E: Logger + Module Log Updates** | Rebuild per-child logging with colour-coded multi-selects. | B1, B2 |
| **Session F: HEU Work Sample Curation** | Design the six-sample selection and annotation flow. | B3 |
| **Session G: Project Integration** | Stage artifact threading, capstone synthesis, logging pipeline. | A5, B10 |
| **Session H: Constellation Drill-down** | DLO → moments evidence trail, badge threshold visibility. | B4 |
| **Housekeeping: Registry + Status Updates** | Align project files with decisions made here. | B7, B11, B12 |

---

*This document maps the complete interaction surface of Hearth LMS as designed. Update when screens are added, removed, or when integration decisions change.*
*Last updated: 2 April 2026*
