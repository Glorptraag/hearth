# Hearth LMS — Dashboard & Our Story Content Specification

> **Document ID:** A1 (per System Interaction Map artifact tracker)  
> **Status:** Draft specification — ready for implementation  
> **Created:** March 2026  
> **Updates:** Supersedes relevant sections of `hearth_dashboard_design_decisions.md`  
> **Related:** `Hearth_System_Interaction_Map.md`, `hearth-dashboard-evening.html`, `hearth-portfolio-learning-journey.html`

---

## Part 1: The Core Distinction

### Dashboard — "What's Happening Now"

**Audience:** The family talking to itself  
**Tense:** Present and immediate past  
**Emotional Register:** Warm, celebratory, encouraging  
**Child Context:** Family-wide aggregate (no per-child drill-down)  
**Data Density:** Low — glanceable summaries, not detailed metrics  
**Session Intent:** Quick check-in, orientation, momentum  

**The Dashboard Question:**  
> "What's happening with our learning right now?"

**Copy Voice:**
- Informal, warm, observational
- Uses "our" and "your family" language
- Celebrates without metrics
- Names children but doesn't compare them

**Example Copy:**
- ✅ "Great week — lots of outdoor discovery"
- ✅ "Emma and Liam worked together on magnets today"
- ✅ "Busy morning — three moments already logged"
- ❌ "Emma has logged 5 activities, Liam has logged 2"
- ❌ "You're 67% complete on this week's goals"

---

### Our Story — "What Has Been Learned"

**Audience:** Parent in reflective mode, external reviewers (HEU, schools)  
**Tense:** Retrospective and cumulative  
**Emotional Register:** Substantive, documented, confident  
**Child Context:** Per-child (select child on entry)  
**Data Density:** High — detailed evidence, capability mapping, compliance status  
**Session Intent:** Sit-down review, portfolio curation, compliance preparation  

**The Our Story Question:**  
> "What has [child] learned and how are we tracking?"

**Copy Voice:**
- Formal but not cold
- Uses specific capability language
- Documents with confidence
- Quantifies where meaningful

**Example Copy:**
- ✅ "Emma has demonstrated 14 capability threads this term, with strong evidence in Scientific Thinking"
- ✅ "3 of 6 required work samples collected for HEU reporting"
- ✅ "Mathematical Reasoning: progressing through fractional operations"
- ❌ "Lots of great learning happening!"
- ❌ "Emma is doing wonderfully"

---

## Part 2: Dashboard Content Specification

### 2.1 Dashboard Sections & Cards

The Dashboard consists of these sections, displayed in this order:

```
┌─────────────────────────────────────────────────────────────┐
│  TIME CONTEXT BAR                                           │
├─────────────────────────────────────────────────────────────┤
│  HEARTH GREETING (adaptive)                                 │
├─────────────────────────────────────────────────────────────┤
│  YOUR LEARNERS (family member row)                          │
├─────────────────────────────────────────────────────────────┤
│  [ADAPTIVE SECTION - varies by time of day]                 │
│  Morning: TODAY'S SHAPE                                     │
│  Afternoon: HAPPENING NOW                                   │
│  Evening: TODAY'S MOMENTS                                   │
├─────────────────────────────────────────────────────────────┤
│  [SECONDARY SECTION - varies by time of day]                │
│  Morning: THIS WEEK AT A GLANCE                             │
│  Afternoon: QUICK CAPTURE PROMPTS                           │
│  Evening: HEARTH VOICE (pedagogical reflection)             │
├─────────────────────────────────────────────────────────────┤
│  RIGHT PANEL (desktop only)                                 │
│  - Log a Moment (primary action)                            │
│  - Hearth Voice OR Week Summary                             │
│  - Gentle Prompt                                            │
└─────────────────────────────────────────────────────────────┘
```

---

### 2.2 Section Specifications

#### A. Time Context Bar

**Purpose:** Orient the parent to current adaptive state  
**Display:** Small text with pulsing indicator dot  
**Content:** Day of week + time period  

**Examples:**
- "Wednesday morning"
- "Friday afternoon"  
- "Sunday evening"

**Data Source:** Device time (no backend required)

---

#### B. Hearth Greeting

**Purpose:** Personalized welcome that sets emotional tone  
**Display:** Large serif headline + supporting message  

**Structure:**
```
[Greeting phrase], [Parent name].
[Summary observation about recent learning]
```

**Adaptive Content by Time:**

| Time | Greeting Phrase | Summary Focus |
|------|----------------|---------------|
| Morning (5am–12pm) | "Good morning" / "A fresh start" / "Morning light" | What's planned or possible today |
| Afternoon (12pm–5pm) | "The day unfolds" / "Afternoon warmth" | What's happening or just happened |
| Evening (5pm–10pm) | "A gentle close to the day" / "Evening reflection" | What was accomplished today |
| Late night (10pm–5am) | "Quiet hours" | Soft, no pressure, acknowledgment |

**Summary Copy Patterns:**

Morning:
- "Today holds [planned activity] and room for discovery."
- "No fixed plans — a day for following curiosity."
- "Emma has [module name] ready. The others are free to roam."

Afternoon:
- "Two moments logged so far. The Morrison hearth is humming."
- "[Child] just finished [activity]. What else is unfolding?"
- "Busy afternoon — you're in the thick of it."

Evening:
- "Today brought [N] logged moments, including [highlight]."
- "A quieter day — sometimes that's exactly right."
- "The Morrison hearth has been busy with quiet discoveries."

**Data Sources:**
- Parent first name (family profile)
- Family surname (family profile)
- Count of today's learning entries
- Most recent logged activity title
- Planned activities for today (if any)

---

#### C. Your Learners

**Purpose:** Show family members, invite deeper exploration  
**Display:** Horizontal row of child symbols with name + recent activity  

**Per-Child Display:**
```
[Abstract Symbol]
[Child Name]
Age [N]
[Most recent activity, truncated]
```

**Symbol System:**  
Each child assigned a unique abstract shape and colour on profile creation. Shapes are non-hierarchical (spiral, helix, star, leaf, mountain, wave, etc.). Colours are muted, distinguishable, and tied to the child throughout the interface.

**Interaction:**  
Tap/click child → Navigate to Our Story with that child pre-selected

**Data Sources:**
- Child name, age (learner profile)
- Child symbol + colour (learner profile)
- Most recent learning entry title for this child

**Empty State:**  
If no recent activity for a child: "Exploring quietly" or "No logged moments yet today"

---

#### D. Adaptive Primary Section

This section changes completely based on time of day.

##### D1. Morning State: "Today's Shape"

**Purpose:** Orientation for the day ahead  
**Emotional Goal:** Calm confidence, gentle structure  

**Content:**
1. **Planned Activities** (if any exist in weekly planner)
   - Card per planned activity, showing title + intended children
   - Tap to launch Module Experience prep mode
   
2. **Suggested Starting Point** (if no plans)
   - Single gentle suggestion based on:
     - Recent capability gaps
     - Incomplete modules from prior sessions
     - Seasonal/timely content
   - "If you're looking for a place to start..."

3. **Weather/Context Note** (optional, if location enabled)
   - "Sunny morning in Brisbane — good for outdoor discovery"

**Copy Examples:**
- "Today's plans: Nature Journal (Emma), Reading Time (all)"
- "Nothing scheduled — a day for following interests"
- "Liam's bridge project is halfway done. Pick it up?"

**Data Sources:**
- Weekly planner entries for today
- Incomplete module sessions
- Capability thread analysis (gaps)
- Weather API (optional)

##### D2. Afternoon State: "Happening Now"

**Purpose:** Quick capture prompts, momentum acknowledgment  
**Emotional Goal:** Supportive presence during active learning  

**Content:**
1. **In-Progress Indicator** (if module session is active)
   - "[Child] is mid-session on [Module Name]"
   - Quick "Log this session" action

2. **Recent Moment Preview**
   - If something logged in last 2 hours, show it
   - Warm acknowledgment: "Nice — [activity title] captured"

3. **Quick Capture Prompts**
   - 2–3 tap-friendly prompts for common afternoon activities
   - "Just finished reading?" / "Something hands-on?" / "A conversation worth noting?"

**Copy Examples:**
- "Emma's working through Fraction Baking. Liam's exploring outside."
- "Nothing logged yet today — that's fine. Learning is happening."
- "Quick capture: What just wrapped up?"

**Data Sources:**
- Active module sessions (in-progress state)
- Learning entries from last 2 hours
- Time since last log

##### D3. Evening State: "Today's Moments"

**Purpose:** Reflection on what was accomplished  
**Emotional Goal:** Satisfaction, gentle celebration  

**Content:**
1. **Moment Cards** (2–4 most recent from today)
   - Each shows: Child indicator, title, brief description, time
   - Collaborative moments highlighted (multiple children)
   - Tap → expand or navigate to full entry

2. **Empty Capture Card**
   - "Something we haven't captured?"
   - Gentle invitation, not pressure
   - Tap → open Retrospective Logger

3. **Day Summary Line** (below cards)
   - "[N] moments logged today" or "A quieter day — that's okay"

**Copy Examples:**
- Card: "Magnetic Discoveries — Emma & Liam • 2:30 PM"
- Card: "Baking Fractions — Emma • 10:15 AM"
- Empty: "Learning happens in small ways. What else did you notice?"

**Data Sources:**
- Learning entries with today's date
- Entry titles, descriptions, timestamps
- Participating children per entry

---

#### E. Adaptive Secondary Section

##### E1. Morning: "This Week at a Glance"

**Purpose:** Week-level orientation without pressure  
**Display:** Simple visual summary  

**Content:**
- Days of week with activity indicators (dots, not numbers)
- "3 days with logged activity so far"
- Link: "See full week →"

**NOT shown:**
- Per-child breakdowns
- Percentage complete
- Compliance status

##### E2. Afternoon: "Quick Capture Prompts"

**Purpose:** Reduce friction for logging  
**Display:** 2–3 large tap targets  

**Prompts rotate based on:**
- Time of day (lunch-related around noon)
- Recent activity types (if lots of reading, suggest hands-on)
- Family patterns (learned over time)

**Examples:**
- "We just read something"
- "A hands-on moment"
- "An interesting conversation"
- "Something outdoors"

##### E3. Evening: "Hearth Voice"

**Purpose:** Pedagogical reflection to build parent confidence  
**Display:** Styled card with flame icon, italic text  

**Content Structure:**
```
"[Observation about today's learning]"
— Pedagogical Insight
```

**Content Generation:**
Based on today's logged activities, the system identifies something pedagogically meaningful and reflects it back. This is where the Education Engine's voice appears.

**Examples:**
- "Emma showing Liam her experiment is beautiful peer teaching. When children explain concepts to each other, both deepen their understanding."
- "Three different subjects today, all self-directed. Following curiosity builds intrinsic motivation."
- "A quiet day can be a processing day. Learning often consolidates when we're not actively 'doing.'"

**Fallback (no activity logged):**
- "Sometimes the most important learning is invisible. Rest days matter too."

**Data Sources:**
- Today's learning entries
- Capability thread mappings
- Number of children involved
- Activity types

---

#### F. Right Panel (Desktop Only)

**Purpose:** Persistent actions and secondary information  
**Display:** Fixed sidebar, always visible  

**Contents (top to bottom):**

1. **Log a Moment** (primary CTA)
   - Large, warm button
   - Opens Retrospective Logger

2. **Hearth Voice OR Week Summary** (contextual)
   - Morning/Afternoon: Week Summary stats
   - Evening: Hearth Voice (if not shown in main area)

3. **Gentle Prompt** (always present)
   - Forward-looking suggestion based on observed patterns
   - Links to relevant screen (Activity Discovery, specific Module, etc.)

**Week Summary Stats:**
| Stat | Label | Display |
|------|-------|---------|
| Entries this week | "Moments logged" | Number |
| Collaborative entries | "Together activities" | Number (green if >0) |
| New capability evidence | "New capabilities" | Number |
| Evidence items | "Evidence collected" | "[N] items" |

**Gentle Prompt Examples:**
- "Liam has been asking 'why' questions more frequently. Explore inquiry-based activities?"
- "It's been a week since any outdoor logging. The weather looks good tomorrow."
- "Emma's close to a Mathematical Reasoning milestone. One more fraction activity might get her there."

---

### 2.3 Empty & First-Use States

#### First-Ever Login (No Children Added)

**Greeting:** "Welcome to Hearth, [Name]."  
**Message:** "Let's set up your family. Who's learning at your hearth?"  
**Action:** "Add your first learner →"

#### First Login After Adding Children (No Activity Yet)

**Greeting:** "Your hearth is ready, [Name]."  
**Message:** "Start by logging something that happened today — or explore activities to try."  
**Actions:** 
- "Log a moment" (primary)
- "Explore activities" (secondary)

#### Returning After Several Days Inactive

**Greeting:** "Welcome back, [Name]."  
**Message:** "It's been a few days. Learning has been happening — let's capture some of it."  
**Tone:** Warm, no guilt, assumes education continued offline

---

### 2.4 Adaptive State Transitions

**Time Boundaries (Default):**
- Morning: 5:00 AM – 12:00 PM
- Afternoon: 12:00 PM – 5:00 PM
- Evening: 5:00 PM – 10:00 PM
- Late Night: 10:00 PM – 5:00 AM (minimal UI, reduced prompts)

**Override Behaviour:**
- Manual override available in settings
- System learns family patterns over time (Phase 2)
- Stressed-use detection reduces complexity (Phase 2)

**Transition Behaviour:**
- No jarring reloads
- Content shifts on next page load or after 30+ minutes idle
- Current session respects state at load time

---

## Part 3: Our Story Content Specification

### 3.1 Entry Point & Child Selection

**Navigation:** Tap "Our Story" in primary nav  
**Behaviour:** 
- If 1 child: Direct to Our Story hub for that child
- If 2+ children: Show child selector overlay, then hub

**Child Selector:**
```
┌─────────────────────────────────────┐
│  Whose story?                       │
│                                     │
│  [Emma symbol]  [Liam symbol]  ...  │
│     Emma           Liam             │
│                                     │
│  or: View family overview           │
└─────────────────────────────────────┘
```

**Family Overview Option:**  
For multi-child families, a "Family Overview" option shows aggregate statistics without per-child detail. This is a summary view, not a comparison view.

---

### 3.2 Our Story Hub (Per-Child Landing)

When a parent selects a child, they land on the **Our Story Hub** — a summary page that links deeper into Portfolio, HEU Report, Capabilities, and Learner Profile.

**Design Decision:** Hub, not direct-to-Portfolio  
**Rationale:** Parents need orientation before diving into detail. The hub answers "where should I go?" before they commit to a drill-down.

#### Hub Layout

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard          [Child Switcher Dropdown]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Large Child Symbol]                                       │
│  EMMA'S STORY                                               │
│  Age 9 • Learning at the Morrison Hearth since March 2025  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  TERM SUMMARY                                               │
│  "Emma has demonstrated strong growth in Scientific        │
│  Thinking and Mathematical Reasoning this term, with       │
│  emerging confidence in Creative Expression."              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │  PORTFOLIO  │  │   HEU       │                          │
│  │  📁         │  │   REPORT    │                          │
│  │             │  │   📋        │                          │
│  │  47 entries │  │             │                          │
│  │  12 this    │  │  3 of 6     │                          │
│  │  term       │  │  samples    │                          │
│  │             │  │  ready      │                          │
│  │  View →     │  │  View →     │                          │
│  └─────────────┘  └─────────────┘                          │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐                          │
│  │ CAPABILITIES│  │  LEARNER    │                          │
│  │ ✦ ✦ ✦      │  │  PROFILE    │                          │
│  │             │  │  👤         │                          │
│  │  14 threads │  │             │                          │
│  │  active     │  │  Who Emma   │                          │
│  │             │  │  is         │                          │
│  │  View →     │  │  View →     │                          │
│  └─────────────┘  └─────────────┘                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  RECENT EVIDENCE                                            │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                       │
│  │ 📷   │ │ 📷   │ │ 📄   │ │ 📷   │  See all →           │
│  └──────┘ └──────┘ └──────┘ └──────┘                       │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.3 Hub Section Specifications

#### A. Child Header

**Purpose:** Identity and context  
**Display:** Large symbol, name, age, tenure  

**Content:**
```
[Child Symbol — large, 96px]
[CHILD NAME]'S STORY
Age [N] • Learning at the [Family Name] Hearth since [Month Year]
```

**Data Sources:**
- Child profile (name, birthdate, symbol)
- Family profile (surname)
- Account creation date OR first learning entry date

---

#### B. Term Summary

**Purpose:** AI-generated narrative summary of recent growth  
**Display:** 2–3 sentence paragraph in serif, slightly warm styling  

**Generation Logic:**
1. Identify capability threads with most evidence this term
2. Note any newly emerging threads
3. Synthesize into natural language

**Example:**
> "Emma has demonstrated strong growth in Scientific Thinking and Mathematical Reasoning this term, with emerging confidence in Creative Expression. Her collaborative work with Liam shows developing leadership in peer teaching."

**Fallback (limited data):**
> "Emma's learning story is just beginning. As more moments are logged, patterns and growth will become visible here."

**Data Sources:**
- Learning entries from current term
- Capability thread mappings
- Collaborative entry flags

---

#### C. Navigation Cards (4 cards)

Each card links to a deeper screen within Our Story.

##### Card 1: Portfolio

**Icon:** 📁 (or folder symbol)  
**Title:** "Portfolio"  
**Stat Line 1:** "[N] entries"  
**Stat Line 2:** "[N] this term"  
**Action:** "View →"

**Destination:** Portfolio / Learning Journey screen (existing: `hearth-portfolio-learning-journey.html`)

##### Card 2: HEU Report

**Icon:** 📋 (or clipboard symbol)  
**Title:** "HEU Report"  
**Stat Line 1:** "[N] of 6 samples ready" (or "Compliant ✓" if complete)  
**Stat Line 2:** "[N] weeks until deadline" (if deadline set)  
**Action:** "View →"

**Destination:** HEU Report screen (existing: `hearth-report-screen.html`)

**Conditional Display:**
- Only show if family has enabled Queensland HEU compliance
- If disabled: Card is hidden or shows "Enable compliance tracking →"

##### Card 3: Capabilities

**Icon:** ✦✦✦ (or constellation symbol)  
**Title:** "Capabilities"  
**Stat Line 1:** "[N] threads active"  
**Stat Line 2:** "[N] near milestone" (if any)  
**Action:** "View →"

**Destination:** Capabilities Constellation (existing: `hearth-capabilities-v3.html`)

##### Card 4: Learner Profile

**Icon:** 👤 (or abstract person symbol)  
**Title:** "Learner Profile"  
**Stat Line 1:** "Who [Child] is"  
**Stat Line 2:** (blank or "Last updated [date]")  
**Action:** "View →"

**Destination:** Learner Profile screen (existing: `hearth-learner-profile.html`)

---

#### D. Recent Evidence Strip

**Purpose:** Quick visual preview of recent portfolio items  
**Display:** Horizontal scroll of thumbnail images  

**Content:**
- 4–6 most recent evidence items (photos, document thumbnails)
- "See all →" link to full Portfolio

**Interaction:**
- Tap thumbnail → open that evidence item in Portfolio context

**Empty State:**
- "No evidence captured yet. Photos and artifacts appear here as you log."

---

### 3.4 Our Story vs Dashboard — Summary Table

| Aspect | Dashboard | Our Story |
|--------|-----------|-----------|
| **Scope** | Family-wide | Per-child |
| **Tense** | Present | Retrospective |
| **Tone** | Warm, celebratory | Substantive, documented |
| **Data density** | Low (glanceable) | High (detailed) |
| **Session length** | 1–2 minutes | 5–15 minutes |
| **Primary action** | Log a moment | Review, curate, export |
| **Compliance visibility** | Hidden | Prominent |
| **Capability detail** | None | Full constellation |
| **Comparison risk** | None (aggregate only) | Low (per-child, not comparative) |
| **Example copy** | "Great week — lots of outdoor discovery" | "14 capability threads demonstrated this term" |

---

## Part 4: Data Requirements Summary

### Dashboard Data Sources

| Data Point | Source | Update Frequency |
|------------|--------|------------------|
| Parent name | Family profile | Static |
| Family surname | Family profile | Static |
| Child names, ages, symbols | Learner profiles | Static |
| Today's learning entries | Learning entries table | Real-time |
| This week's entries | Learning entries table | Real-time |
| Planned activities | Weekly planner | Real-time |
| Active module sessions | Session state | Real-time |
| Capability gaps | Capability analysis (backend) | Daily |
| Pedagogical insights | AI generation (backend) | Per-entry or daily |

### Our Story Hub Data Sources

| Data Point | Source | Update Frequency |
|------------|--------|------------------|
| Child profile details | Learner profile | Static |
| Total entry count | Learning entries table | Real-time |
| Term entry count | Learning entries table | Real-time |
| HEU sample status | HEU compliance state | Real-time |
| HEU deadline | Family settings | Static |
| Active capability threads | Capability mappings | Daily |
| Near-milestone threads | Capability analysis | Daily |
| Term summary narrative | AI generation | Weekly or on-demand |
| Recent evidence thumbnails | Evidence storage | Real-time |

---

## Part 5: Updates to Existing Documentation

### Conflicts with `hearth_dashboard_design_decisions.md`

The following sections of the existing design decisions document are **superseded** by this specification:

1. **Section 1 (Adaptive Interface States):** This spec provides detailed content for each state. The original doc's Phase 1/Phase 2 approach remains valid.

2. **Section 5 (Primary Action):** This spec confirms "Log a Moment" placement but adds context for right panel structure on desktop.

3. **Section 6 (Compliance Integration):** This spec clarifies that compliance is **visible in Our Story, hidden in Dashboard**. The original doc's "background support" principle is extended.

### Additions Required

Add to `hearth_dashboard_design_decisions.md`:

> **Dashboard vs Our Story Separation**
> 
> As of March 2026, Dashboard and Our Story are formally separated as distinct navigation destinations. Dashboard is the family-wide present-tense messaging surface. Our Story is the per-child retrospective evidence layer. See `Hearth_Dashboard_Our_Story_Content_Spec.md` for full content specification.

---

## Part 6: Implementation Notes

### Phase 1 (MVP)

**Dashboard:**
- Time-based adaptive states (no pattern learning)
- Static Hearth Voice content (curated list, not AI-generated)
- Basic greeting rotation
- All sections functional but simplified

**Our Story:**
- Hub page with all four navigation cards
- Child selector for multi-child families
- Static term summary (template-based, not AI-generated)

### Phase 2 (Post-Test Families)

**Dashboard:**
- AI-generated Hearth Voice based on daily entries
- Pattern-based adaptive timing
- Stressed-use detection and simplification

**Our Story:**
- AI-generated term summaries
- Trend analysis in capability cards
- Comparative term-over-term view (optional)

---

## Appendix: Copy Bank

### Dashboard Greetings

**Morning:**
- "Good morning, [Name]."
- "A fresh start, [Name]."
- "Morning light at the [Family] hearth."
- "The day begins, [Name]."

**Afternoon:**
- "The day unfolds, [Name]."
- "Afternoon warmth, [Name]."
- "Mid-day at the hearth."
- "The [Family] hearth is humming."

**Evening:**
- "A gentle close to the day, [Name]."
- "Evening reflection, [Name]."
- "The day winds down."
- "Quiet evening at the hearth."

**Late Night:**
- "Quiet hours, [Name]."
- "Late night planning?"
- "Burning the midnight oil."

### Hearth Voice Templates (Phase 1)

**Collaborative Learning:**
- "When children teach each other, both deepen their understanding."
- "Working together builds skills that can't be taught alone."
- "Collaboration today — that's social learning in action."

**Self-Directed:**
- "Following curiosity builds intrinsic motivation."
- "Self-directed days often produce the deepest learning."
- "When children choose, they invest."

**Quiet Days:**
- "Sometimes the most important learning is invisible."
- "A quiet day can be a processing day."
- "Rest is part of the rhythm."

**Outdoor/Nature:**
- "Time outside is never wasted."
- "Nature is the oldest classroom."
- "Outdoor discovery — whole-body learning."

**Reading:**
- "Reading together builds bonds as well as comprehension."
- "Stories teach what textbooks can't."
- "Another book, another world explored."

---

*This specification defines the content and copy for Hearth's two primary navigation destinations. Implementation should follow Mont Blanc aesthetic guidelines and existing component patterns.*

*Last updated: March 2026*
