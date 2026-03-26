# Hearth Capabilities Connector
## Multi-Layer Learning Progression Architecture

> **Status:** Architecture specification â€” companion to `hearth-capability-thread-library.md`
> **Date:** 16 February 2026
> **Purpose:** Define the full-depth capability system from Achievement Standards down to discrete learning objectives, with badge integration, parent assessment, galaxy zoom UX, and moment-to-capability mapping.
> **Design framework:** Understanding by Design (UbD) â€” start from desired outcomes, work backwards to finest-grain evidence.

---

## The Five Layers

The capabilities system operates across five nested layers. Think of it as a galaxy: zoomed all the way out you see domains and achievement standards; zoomed all the way in you see individual moments a parent logged last Tuesday.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  LAYER 1: ACHIEVEMENT STANDARD                          â”‚
â”‚  "By the end of Year 2, students partition, rearrange,  â”‚
â”‚   regroup and rename two-digit numbers..."              â”‚
â”‚  â”€â”€â”€ This is what QLD Education requires demonstrated   â”‚
â”‚                                                         â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚  LAYER 2: CAPABILITY THREAD                       â”‚  â”‚
â”‚  â”‚  "Number Sense & Place Value"                     â”‚  â”‚
â”‚  â”‚  â”€â”€â”€ The constellation node. A lifelong thread.   â”‚  â”‚
â”‚  â”‚                                                   â”‚  â”‚
â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚  â”‚
â”‚  â”‚  â”‚  LAYER 3: BADGE LEVEL                       â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  "Number Explorer" â†’ "Number Navigator"     â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”€â”€â”€ Meaningful milestones. What you show   â”‚  â”‚  â”‚
â”‚  â”‚  â”‚      to assessors and stakeholders.          â”‚  â”‚  â”‚
â”‚  â”‚  â”‚                                             â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚  LAYER 4: DISCRETE LEARNING OBJECTIVE â”‚  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚  "Counts forwards to at least 20"     â”‚  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚  "Partitions 2-digit into tens+ones"  â”‚  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚  â”€â”€â”€ The finest assessable grain.     â”‚  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚      Parents can check these with a   â”‚  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚      simple question or observation.  â”‚  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚                                       â”‚  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚  â”‚  LAYER 5: OBSERVATION / MOMENT  â”‚  â”‚  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚  â”‚  "Counted to 20 for first time" â”‚  â”‚  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚  â”‚  "Sorted coins into tens pile"  â”‚  â”‚  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚  â”‚  â”€â”€â”€ What parents actually log. â”‚  â”‚  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚  â”‚      Raw data points.           â”‚  â”‚  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚  â”‚  â”‚  â”‚
â”‚  â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚  â”‚  â”‚
â”‚  â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Layer Definitions

| Layer | What It Is | Who Defines It | Where It Lives | How Many |
|-------|-----------|----------------|---------------|----------|
| **Achievement Standard** | QLD Education's formal description of what a child should know/do by end of year level | ACARA / QCAA | Sanity CMS (reference data) | ~5 per learning area per year level |
| **Capability Thread** | A transferable, lifelong learning thread that spans year levels | Hearth content team | Sanity CMS | 57 pre-defined + custom |
| **Badge Level** | A meaningful milestone within a thread â€” demonstrable accomplishment | Hearth content team + families | Sanity CMS (templates) + PostgreSQL (awards) | 2â€“4 per thread (~150â€“200 total) |
| **Discrete Learning Objective (DLO)** | The finest assessable grain â€” a specific thing a child can do | Hearth content team, derived from AC V9 content descriptors | Sanity CMS | 8â€“25 per thread (~800â€“1200 total) |
| **Observation / Moment** | A logged event from parent or module | Parent / module system | PostgreSQL | Unlimited (family-generated data) |

---

## Layer-by-Layer Architecture

### Layer 1: Achievement Standards

Achievement Standards are the top of the hierarchy â€” they're what Queensland Education (via ACARA/QCAA) requires demonstrated. In QLD, the Achievement Standard represents the **C standard** â€” a sound level of knowledge and understanding.

For Hearth's purposes, Achievement Standards serve as the **reporting anchor**. When a parent generates an HEU report, the system maps their child's capability data upward to show coverage against these standards.

**We do not assess against Achievement Standards directly.** Instead, we collect evidence at lower layers (DLOs and observations) that, in aggregate, demonstrate the standard has been met.

**Example â€” Mathematics Year 2 Achievement Standard (excerpt):**
> "By the end of Year 2, students connect number names, numerals and quantities, including zero, initially up to 10 and then beyond. They count to and from at least 20. Students partition, rearrange, regroup and rename two-digit numbers using standard and non-standard groupings. They represent, compare, and order numbers to at least 100 using physical and virtual materials, number lines and other representations."

This single paragraph maps downward to:
- Capability Thread: **M1 Number Sense & Place Value**
- Badge Level: **Number Explorer** (Foundationâ€“Y1), **Number Navigator** (Y2â€“Y3)
- 12+ Discrete Learning Objectives
- Potentially hundreds of observations over a child's Foundationâ€“Year 2 journey

### Layer 2: Capability Threads

Defined in full in `hearth-capability-thread-library.md`. These are the **constellation nodes** â€” what appears in the Skyrim-style skill tree UI.

Key addition for the connector: each thread now carries:
- **Upward mappings** to Achievement Standards (by year level)
- **Downward mappings** to DLOs (the fine grain)
- **Badge level definitions** (milestone markers)
- **Unlock relationships** (what this thread enables)

### Layer 3: Badge Levels

Badges are the **stakeholder-facing layer** â€” they represent meaningful accomplishments that make sense to a parent, a receiving school, or a post-secondary institution.

**Badge design principles:**
- A badge should represent a capability that **matters beyond the curriculum** â€” not just "completed 5 worksheets" but "can navigate confidently with maps and directions"
- Badges are **forward-looking tools**, not backward-looking trophies â€” "You now have this in your toolkit"
- A badge should be **assessable by a parent** through 3â€“5 simple questions (not moment-logging)
- Long-duration, multi-skill activities (building a dune buggy, fixing a walkie-talkie, running a market stall) are prime badge candidates
- Badges should be **meaningful to someone assessing the student** â€” a teacher receiving a transfer should understand what the badge represents

**Badge structure:**

```javascript
{
  badgeId: 'number-navigator',
  name: 'Number Navigator',
  thread: 'M1',                          // Parent capability thread
  level: 2,                              // Position within thread (1 = earliest)
  
  // What this badge represents
  summary: "Confidently works with numbers to 100, understands tens and ones, and uses number knowledge to solve everyday problems.",
  
  // What this badge unlocks
  unlocksCapabilities: ['M2-level2', 'M3-level1', 'M5-level1'],
  prerequisiteBadges: ['number-explorer'],
  
  // The DLOs that comprise this badge
  requiredDLOs: ['M1-DLO-06', 'M1-DLO-07', 'M1-DLO-08', 'M1-DLO-09', 'M1-DLO-10'],
  
  // Parent assessment â€” 3â€“5 questions a parent can ask/observe
  assessmentQuestions: [
    {
      question: "If you give them a two-digit number like 47, can they tell you it's 4 tens and 7 ones?",
      lookingFor: "Understands place value â€” not just counting but the structure of numbers",
      dloMapping: 'M1-DLO-08'
    },
    {
      question: "Can they count backwards from 50 without getting stuck?",
      lookingFor: "Flexible number sequence knowledge, not just forward counting",
      dloMapping: 'M1-DLO-07'
    },
    {
      question: "If you ask 'which is more, 38 or 83?', can they explain why?",
      lookingFor: "Uses place value reasoning to compare, not just guessing",
      dloMapping: 'M1-DLO-09'
    },
    {
      question: "Can they make 35 using different combinations? (30+5, 20+15, 10+25)",
      lookingFor: "Flexible composition and decomposition of numbers",
      dloMapping: 'M1-DLO-10'
    }
  ],
  
  // How this maps to formal reporting
  achievementStandardMapping: {
    yearLevel: 'Year 2',
    learningArea: 'Mathematics',
    standardExcerpt: "Students partition, rearrange, regroup and rename two-digit numbers using standard and non-standard groupings."
  },
  
  // Badge is awarded when:
  awardCriteria: {
    type: 'parent-assessed',             // not automatic
    requiredDLOsComplete: 4,             // at least 4 of 5 DLOs
    parentConfirmation: true,            // parent explicitly awards
    evidenceRecommended: true,           // suggest but don't require evidence
    evidencePrompt: "A photo of them working with numbers, a video of them explaining place value, or a work sample showing two-digit number work."
  }
}
```

### Layer 4: Discrete Learning Objectives (DLOs)

DLOs are the **finest assessable grain** â€” each one represents a specific, observable thing a child can do. They're derived directly from AC V9 content descriptor elaborations, broken down to the level where a parent can answer "yes, my child can do this" or "not yet."

**DLO design principles:**
- Each DLO is a **single assessable capability** â€” not a cluster
- Phrased as **"Can [child] do X?"** â€” directly answerable
- Observable through **everyday life**, not just structured activities
- Maps to at least one AC V9 content descriptor
- Can be evidenced by logged moments (observations) but **doesn't require** moment-logging â€” a parent can confirm a DLO through direct observation or a quick check question

**DLO structure:**

```javascript
{
  dloId: 'M1-DLO-08',
  thread: 'M1',                          // Parent capability thread
  badgeLevel: 'number-navigator',        // Which badge this contributes to
  
  // The specific capability
  statement: "Partitions two-digit numbers into tens and ones",
  
  // Parent-friendly version
  parentVersion: "Can break a number like 47 into '4 tens and 7 ones'",
  
  // Quick check â€” what a parent can do to assess this
  checkQuestion: "Give them a number like 63 and ask: 'How many tens? How many ones?'",
  checkLookingFor: "They can identify 6 tens and 3 ones (or equivalent), not just read the digits",
  
  // What parents might log that maps here
  momentKeywords: ['tens and ones', 'place value', 'tens column', 'ones column', 'partitioned', 'split into tens', 'broke the number into'],
  
  // Curriculum mapping
  contentDescriptors: ['AC9M2N01'],
  yearLevel: 'Year 2',
  
  // Scaffolding
  prerequisiteDLOs: ['M1-DLO-05', 'M1-DLO-06'],  // Must understand counting to 100 and skip counting by 10s
  enablesDLOs: ['M1-DLO-09', 'M1-DLO-10', 'M2-DLO-05'],  // Enables comparison, flexible composition, and mental computation
  
  // Status tracking (per-learner, in PostgreSQL)
  // status: 'not-started' | 'emerging' | 'confirmed'
  // confirmedDate: timestamp
  // confirmedBy: 'parent-assessment' | 'moment-inference' | 'module-completion'
  // supportingMoments: [observationId, ...]
}
```

### Layer 5: Observations / Moments

These are the raw data points â€” what parents log through the Retrospective Logger, what modules generate on completion, and what quick-capture creates. Each observation maps to one or more DLOs.

**The mapping is bidirectional:**

**Upward (moment â†’ capability):** When a parent logs "Emma counted all the coins and sorted them into piles of 10," the system:
1. Identifies keywords: "counted", "coins", "sorted", "piles of 10"
2. Suggests DLOs: M1-DLO-06 (skip counts by 10s), M1-DLO-08 (partitions into tens)
3. Suggests threads: M1 (Number Sense), M5 (Measurement â€” money context)
4. Parent confirms with a tap
5. Observation is woven into the constellation

**Downward (capability â†’ evidence):** When viewing a capability node in the constellation, clicking into it shows all the moments that feed it â€” "Here are the 7 times we've seen Emma working with tens and ones."

---

## Galaxy Zoom Levels â€” The UI Architecture

The constellation UI operates at four zoom levels. The user starts at **Level 2 (capability view)** focused on current learning, and can zoom in or out.

### Zoom Level 1: Domain Overview (Most Zoomed Out)

**What you see:** The 8 domain clusters, each showing aggregate health. Like seeing an entire galaxy from deep space.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  EMMA'S LEARNING UNIVERSE                        â”‚
â”‚                                                  â”‚
â”‚     â˜… Language & Literacy                        â”‚
â”‚       9 threads Â· 23 active DLOs Â· â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘ 78%â”‚
â”‚                                                  â”‚
â”‚     â˜… Mathematical Thinking                      â”‚
â”‚       9 threads Â· 18 active DLOs Â· â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘ 62%â”‚
â”‚                                                  â”‚
â”‚     â˜… Scientific Thinking                        â”‚
â”‚       6 threads Â· 12 active DLOs Â· â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘ 51%â”‚
â”‚                                                  â”‚
â”‚     â˜… Humanities & Social                        â”‚
â”‚       6 threads Â· 8 active DLOs  Â· â–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘â–‘â–‘ 34%â”‚
â”‚                                                  â”‚
â”‚     â˜… Physical Capability                        â”‚
â”‚       5 threads Â· 14 active DLOs Â· â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘ 72%â”‚
â”‚                                                  â”‚
â”‚     â˜… Personal & Social                          â”‚
â”‚       7 threads Â· 11 active DLOs Â· â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘ 65%â”‚
â”‚                                                  â”‚
â”‚     â˜… Creative Expression                        â”‚
â”‚       7 threads Â· 9 active DLOs  Â· â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘ 48%â”‚
â”‚                                                  â”‚
â”‚     â˜… Executive Function                         â”‚
â”‚       8 threads Â· 15 active DLOs Â· â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘ 60%â”‚
â”‚                                                  â”‚
â”‚  Also maps to Achievement Standards:             â”‚
â”‚  English Y2: â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘  Maths Y2: â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘   â”‚
â”‚  Science Y2: â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘  HASS Y2:  â–ˆâ–ˆâ–ˆâ–‘â–‘â–‘â–‘â–‘â–‘â–‘   â”‚
â”‚  HPE Y1-2:   â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–‘â–‘â–‘                          â”‚
â”‚                                                  â”‚
â”‚  [This is the HEU reporting bridge]              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Use case:** Parent wants a bird's-eye view. Also the view the HEU report pulls from.

### Zoom Level 2: Capability Thread View (Default â€” The Skyrim Tree)

**What you see:** Individual capability threads as constellation nodes, connected by prerequisite/unlock lines. **This is the primary view.** Focused on where the child is NOW.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  MATHEMATICAL THINKING                           â”‚
â”‚                                                  â”‚
â”‚  â”Œâ”€ Current Focus â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚                                          â”‚    â”‚
â”‚  â”‚  â—‰ M1: Number Sense        â†â”€â”€ YOU ARE  â”‚    â”‚
â”‚  â”‚     Badge: Number Navigator     HERE     â”‚    â”‚
â”‚  â”‚     12/15 DLOs confirmed                 â”‚    â”‚
â”‚  â”‚     â†“ unlocks â†“                          â”‚    â”‚
â”‚  â”‚                                          â”‚    â”‚
â”‚  â”‚  â—Ž M2: Operations          â†â”€â”€ EMERGING â”‚    â”‚
â”‚  â”‚     Badge: Operation Explorer            â”‚    â”‚
â”‚  â”‚     5/12 DLOs confirmed                  â”‚    â”‚
â”‚  â”‚                                          â”‚    â”‚
â”‚  â”‚  â—Ž M3: Fractional Thinking â†â”€â”€ EMERGING â”‚    â”‚
â”‚  â”‚     Badge: Fraction Finder               â”‚    â”‚
â”‚  â”‚     3/10 DLOs confirmed                  â”‚    â”‚
â”‚  â”‚                                          â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                                                  â”‚
â”‚  â”Œâ”€ Unlocking Soon â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚                                          â”‚    â”‚
â”‚  â”‚  â—‹ M4: Algebraic Thinking  â†â”€â”€ GHOST    â”‚    â”‚
â”‚  â”‚     Needs: M1 (Developing), M2 (Emerg.) â”‚    â”‚
â”‚  â”‚     2 of 2 prerequisites progressing     â”‚    â”‚
â”‚  â”‚                                          â”‚    â”‚
â”‚  â”‚  â—‹ M8: Probability         â†â”€â”€ GHOST    â”‚    â”‚
â”‚  â”‚     Needs: M1 (Emerg.), M3 (Emerg.)     â”‚    â”‚
â”‚  â”‚     1 of 2 prerequisites met             â”‚    â”‚
â”‚  â”‚                                          â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                                                  â”‚
â”‚  â”Œâ”€ Solid Foundation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”‚
â”‚  â”‚                                          â”‚    â”‚
â”‚  â”‚  â— M6: Spatial Reasoning   â†â”€â”€ SOLID    â”‚    â”‚
â”‚  â”‚     Badge: Shape Explorer âœ“              â”‚    â”‚
â”‚  â”‚     All Level 1 DLOs confirmed           â”‚    â”‚
â”‚  â”‚                                          â”‚    â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚
â”‚                                                  â”‚
â”‚  Lines connect nodes showing prerequisites:      â”‚
â”‚  M1 â”€â”€â†’ M2 â”€â”€â†’ M4                               â”‚
â”‚  M1 â”€â”€â†’ M3 â”€â”€â†’ M8                               â”‚
â”‚  M1 â”€â”€â†’ M5                                       â”‚
â”‚  M6 â”€â”€â†’ M5                                       â”‚
â”‚  etc.                                            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Interaction:** Tap any node to zoom to Level 3. The default focus centers on threads with active learning â€” what's being worked on THIS WEEK based on recent logs and module activity.

### Zoom Level 3: Badge & DLO View (Zoomed into a Thread)

**What you see:** A single capability thread expanded to show its badge levels and the DLOs within each. This is where parents **assess capability** and **see evidence**.

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  â† Back to Mathematical Thinking                 â”‚
â”‚                                                  â”‚
â”‚  M1: NUMBER SENSE & PLACE VALUE                  â”‚
â”‚  A lifelong thread â€” from first counting          â”‚
â”‚  to confident number fluency                     â”‚
â”‚                                                  â”‚
â”‚  â”Œâ”€ ðŸ… Number Explorer (Badge Level 1) â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚  EARNED âœ“  â€” Awarded 14 March 2025        â”‚   â”‚
â”‚  â”‚                                           â”‚   â”‚
â”‚  â”‚  âœ“ Counts objects with 1-to-1 matching    â”‚   â”‚
â”‚  â”‚  âœ“ Recognises numerals to 10              â”‚   â”‚
â”‚  â”‚  âœ“ Compares two groups (more/fewer)       â”‚   â”‚
â”‚  â”‚  âœ“ Counts forwards to at least 20         â”‚   â”‚
â”‚  â”‚  âœ“ Understands "how many" after counting  â”‚   â”‚
â”‚  â”‚                                           â”‚   â”‚
â”‚  â”‚  12 linked moments Â· View evidence â†’      â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚           â”‚                                      â”‚
â”‚           â–¼                                      â”‚
â”‚  â”Œâ”€ ðŸ… Number Navigator (Badge Level 2) â”€â”€â”€â”€â”   â”‚
â”‚  â”‚  IN PROGRESS â€” 12/15 DLOs confirmed       â”‚   â”‚
â”‚  â”‚                                           â”‚   â”‚
â”‚  â”‚  âœ“ Counts forwards and backwards from     â”‚   â”‚
â”‚  â”‚    any starting point                     â”‚   â”‚
â”‚  â”‚  âœ“ Skip counts by 2s, 5s, and 10s        â”‚   â”‚
â”‚  â”‚  âœ“ Reads and writes numbers to 100        â”‚   â”‚
â”‚  â”‚  âœ“ Orders numbers on a number line        â”‚   â”‚
â”‚  â”‚  âœ“ Understands tens and ones              â”‚   â”‚
â”‚  â”‚  âœ“ Partitions 2-digit numbers             â”‚   â”‚
â”‚  â”‚  âœ“ Compares 2-digit numbers using         â”‚   â”‚
â”‚  â”‚    place value                            â”‚   â”‚
â”‚  â”‚  âœ“ Estimates quantities and checks        â”‚   â”‚
â”‚  â”‚  âœ“ Recognises patterns in number          â”‚   â”‚
â”‚  â”‚    sequences                              â”‚   â”‚
â”‚  â”‚  âœ“ Counts collections beyond 100          â”‚   â”‚
â”‚  â”‚  âœ“ Uses number lines flexibly             â”‚   â”‚
â”‚  â”‚  âœ“ Identifies odd and even numbers        â”‚   â”‚
â”‚  â”‚  â—‹ Composes numbers in multiple ways      â”‚   â”‚
â”‚  â”‚    (38 = 30+8 = 20+18)                   â”‚   â”‚
â”‚  â”‚  â—‹ Rounds to nearest 10                   â”‚   â”‚
â”‚  â”‚  â—‹ Uses place value for mental            â”‚   â”‚
â”‚  â”‚    estimation                             â”‚   â”‚
â”‚  â”‚                                           â”‚   â”‚
â”‚  â”‚  [Review: Ready to award? â†’]              â”‚   â”‚
â”‚  â”‚  23 linked moments Â· View evidence â†’      â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚           â”‚                                      â”‚
â”‚           â–¼                                      â”‚
â”‚  â”Œâ”€ ðŸ… Number Architect (Badge Level 3) â”€â”€â”€â”€â”   â”‚
â”‚  â”‚  LOCKED â€” Needs Number Navigator          â”‚   â”‚
â”‚  â”‚                                           â”‚   â”‚
â”‚  â”‚  â—‹ Understands place value to thousands   â”‚   â”‚
â”‚  â”‚  â—‹ Reads and writes numbers to 10,000     â”‚   â”‚
â”‚  â”‚  â—‹ Rounds to nearest 10, 100, 1000        â”‚   â”‚
â”‚  â”‚  â—‹ ... (8 more DLOs)                      â”‚   â”‚
â”‚  â”‚                                           â”‚   â”‚
â”‚  â”‚  Unlocks: M3 Level 2, M7 Level 2         â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

**Interaction:** Tap any DLO to see its evidence. Tap "Review: Ready to award?" to enter the badge assessment flow with parent check questions.

### Zoom Level 4: Moment Detail (Most Zoomed In)

**What you see:** Individual observations linked to a specific DLO. This is the evidence layer â€” "here are the times we've seen this."

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  â† Back to Number Navigator                      â”‚
â”‚                                                  â”‚
â”‚  DLO: "Partitions 2-digit numbers into           â”‚
â”‚        tens and ones"                            â”‚
â”‚                                                  â”‚
â”‚  Status: âœ“ Confirmed (parent-assessed)           â”‚
â”‚  Confirmed: 28 June 2025                         â”‚
â”‚                                                  â”‚
â”‚  QUICK CHECK QUESTION:                           â”‚
â”‚  "Give them a number like 63 and ask:            â”‚
â”‚   How many tens? How many ones?"                 â”‚
â”‚                                                  â”‚
â”‚  â”Œâ”€ Supporting Evidence (5 moments) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚                                           â”‚   â”‚
â”‚  â”‚  ðŸ“¸ 14 Jun â€” Sorted coins into piles      â”‚   â”‚
â”‚  â”‚     of 10 at the op shop                  â”‚   â”‚
â”‚  â”‚     [from Retro Logger]                   â”‚   â”‚
â”‚  â”‚                                           â”‚   â”‚
â”‚  â”‚  ðŸ“ 18 Jun â€” Module: Kitchen Explorers    â”‚   â”‚
â”‚  â”‚     Measured 24 teaspoons, grouped        â”‚   â”‚
â”‚  â”‚     into "2 tens and 4 more"              â”‚   â”‚
â”‚  â”‚     [from Module completion]              â”‚   â”‚
â”‚  â”‚                                           â”‚   â”‚
â”‚  â”‚  ðŸ“¸ 22 Jun â€” Used base-10 blocks to       â”‚   â”‚
â”‚  â”‚     build numbers while playing shop      â”‚   â”‚
â”‚  â”‚     [from Retro Logger]                   â”‚   â”‚
â”‚  â”‚                                           â”‚   â”‚
â”‚  â”‚  ðŸ“ 25 Jun â€” Told me "47 has 4 tens       â”‚   â”‚
â”‚  â”‚     hiding inside it" during car game     â”‚   â”‚
â”‚  â”‚     [from Quick Capture]                  â”‚   â”‚
â”‚  â”‚                                           â”‚   â”‚
â”‚  â”‚  ðŸ“¸ 28 Jun â€” Parent confirmed via badge   â”‚   â”‚
â”‚  â”‚     assessment questions                  â”‚   â”‚
â”‚  â”‚     [from Badge Review]                   â”‚   â”‚
â”‚  â”‚                                           â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                                  â”‚
â”‚  This DLO feeds into:                            â”‚
â”‚  â†’ Number Navigator badge (Level 2)              â”‚
â”‚  â†’ Unlocks: "Compares 2-digit numbers using      â”‚
â”‚    place value" (M1-DLO-09)                      â”‚
â”‚  â†’ Maps to: AC9M2N01 (Year 2 Number)             â”‚
â”‚                                                  â”‚
â”‚  [Need to revisit? Find activities for this â†’]   â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

---

## Worked Example: M1 Number Sense â€” Full Depth

This section shows the complete architecture for **one capability thread** as the pattern for all 57. Every thread will eventually have this level of detail.

### Achievement Standard Mapping (Layer 1)

| Year Level | Achievement Standard Excerpt | Thread Coverage |
|-----------|------------------------------|-----------------|
| Foundation | "Students connect number names, numerals and quantities, including zero, initially up to 10 and then beyond" | Badge Level 1: Number Explorer |
| Year 1 | "Students count to and from at least 20, partition and combine collections up to 10, and order numbers to at least 50" | Badge Level 1 (cap) â†’ Level 2 (start) |
| Year 2 | "Students partition, rearrange, regroup and rename two-digit numbers, represent and compare numbers to at least 100" | Badge Level 2: Number Navigator |
| Year 3 | "Students order and represent natural numbers to at least 10,000, apply knowledge of place value" | Badge Level 3: Number Architect |
| Year 4â€“6 | "Students use place value understanding with increasingly large numbers, decimals, and for estimation" | Badge Levels 3â€“4 |

### Badge Levels (Layer 3)

**Badge Level 1: Number Explorer**
- Typical age: 4â€“6 (Foundationâ€“Year 1)
- Theme: "I understand that numbers mean something"
- DLOs: M1-DLO-01 through M1-DLO-05
- Parent assessment questions: 3

**Badge Level 2: Number Navigator**
- Typical age: 6â€“8 (Year 1â€“2)
- Theme: "I understand how our number system is built"
- DLOs: M1-DLO-06 through M1-DLO-15
- Prerequisite badge: Number Explorer
- Parent assessment questions: 4

**Badge Level 3: Number Architect**
- Typical age: 7â€“10 (Year 3â€“4)
- Theme: "I can work with numbers flexibly and confidently"
- DLOs: M1-DLO-16 through M1-DLO-22
- Prerequisite badge: Number Navigator
- Parent assessment questions: 4

**Badge Level 4: Number Strategist**
- Typical age: 9â€“12 (Year 5â€“6)
- Theme: "I see patterns and power in our number system"
- DLOs: M1-DLO-23 through M1-DLO-28
- Prerequisite badge: Number Architect
- Parent assessment questions: 4

### Discrete Learning Objectives â€” Full List (Layer 4)

#### Badge Level 1: Number Explorer

| DLO ID | Statement | Parent Check Question | Keywords for Moment Matching | AC V9 Codes |
|--------|-----------|----------------------|------------------------------|-------------|
| M1-DLO-01 | Counts objects using one-to-one correspondence | "When counting toys, do they touch each one and say one number per object?" | counted, one by one, touching each, pointed at each | AC9MFN01 |
| M1-DLO-02 | Recognises that the last number counted tells "how many" (cardinality) | "After counting 7 blocks, if you ask 'how many?', do they say '7' without recounting?" | how many, that's seven, there are, total | AC9MFN01 |
| M1-DLO-03 | Names and recognises numerals 0â€“10 | "Can they read the numbers on a clock, a letterbox, or a price tag?" | read the number, pointed at, recognised, knew it was | AC9MFN02 |
| M1-DLO-04 | Compares two groups and identifies which has more or fewer | "If you put out two piles of fruit, can they tell which pile has more?" | more, fewer, less, bigger pile, most, least | AC9MFN03 |
| M1-DLO-05 | Counts forwards to at least 20 in sequence | "Can they count to 20 without skipping numbers?" | counted to twenty, counted to 20, count up to | AC9MFN01, AC9M1N01 |

#### Badge Level 2: Number Navigator

| DLO ID | Statement | Parent Check Question | Keywords for Moment Matching | AC V9 Codes |
|--------|-----------|----------------------|------------------------------|-------------|
| M1-DLO-06 | Counts forwards and backwards from any starting point (not just 1) | "If you say 'start at 14 and count backwards', can they do it smoothly?" | counted backwards, counted from, started at | AC9M1N01 |
| M1-DLO-07 | Skip counts by 2s, 5s, and 10s | "Can they count by 10s (10, 20, 30, 40â€¦) without hesitating?" | skip counted, by tens, by fives, by twos, counted in groups | AC9M1N01, AC9M2N01 |
| M1-DLO-08 | Partitions two-digit numbers into tens and ones | "If you give them 47, can they tell you it's 4 tens and 7 ones?" | tens and ones, place value, tens column, broke the number, partitioned | AC9M2N01 |
| M1-DLO-09 | Compares and orders two-digit numbers using place value reasoning | "Can they explain why 83 is bigger than 38 (not just guess)?" | which is more, bigger number, smaller number, compared, ordered | AC9M2N01, AC9M2N02 |
| M1-DLO-10 | Composes numbers in flexible ways (38 = 30+8 = 20+18) | "Can they show you different ways to make the same number?" | different ways, another way to make, same number, regrouped | AC9M2N01 |
| M1-DLO-11 | Reads and writes numbers to at least 100 | "Can they read numbers on pages, prices, or signs up to 100?" | read the number, wrote, hundred, numbers up to | AC9M2N01 |
| M1-DLO-12 | Locates numbers on a number line with reasonable accuracy | "If you draw a line from 0 to 100, can they place 47 roughly in the right spot?" | number line, placed, where does, between | AC9M2N01 |
| M1-DLO-13 | Estimates quantities before counting | "Before counting a jar of items, can they make a reasonable guess?" | guessed, estimated, about, approximately, roughly | AC9M2N02 |
| M1-DLO-14 | Recognises odd and even numbers | "Can they sort numbers into odd and even groups?" | odd, even, pairs, leftovers, no partner | AC9M2N01 |
| M1-DLO-15 | Identifies patterns in number sequences (3, 6, 9, 12â€¦) | "Can they spot and continue a pattern like 5, 10, 15, 20â€¦?" | pattern, what comes next, the rule is, keeps going | AC9M2A01 |

#### Badge Level 3: Number Architect

| DLO ID | Statement | Parent Check Question | Keywords for Moment Matching | AC V9 Codes |
|--------|-----------|----------------------|------------------------------|-------------|
| M1-DLO-16 | Reads, writes, and orders numbers to at least 10,000 | "Can they read large numbers like 3,847 and tell you which of two large numbers is bigger?" | thousand, large number, bigger number | AC9M3N01 |
| M1-DLO-17 | Understands place value through thousands (ones, tens, hundreds, thousands) | "What's the 5 worth in 5,302? Can they say 'five thousand'?" | thousands, place value, what is the [digit] worth | AC9M3N01, AC9M4N01 |
| M1-DLO-18 | Rounds numbers to the nearest 10 and 100 | "What's 67 rounded to the nearest 10? Can they explain why 70?" | rounded, nearest ten, about, approximately | AC9M3N01 |
| M1-DLO-19 | Uses place value to add and subtract mentally (46+30=76) | "Can they quickly tell you 46+30 without writing it down?" | added in my head, mental maths, quick calculation | AC9M3N01, AC9M3N03 |
| M1-DLO-20 | Recognises and uses number patterns to solve problems | "Can they use a pattern to predict the 10th number in a sequence?" | pattern, predicted, the rule, figured out | AC9M3A01 |
| M1-DLO-21 | Understands and uses the concept of zero as a placeholder | "Why do we need the 0 in 305? Can they explain it would be 35 without it?" | zero, placeholder, why the zero, means nothing but | AC9M3N01 |
| M1-DLO-22 | Applies number knowledge to check reasonableness of answers | "If a calculator shows 3+4=34, do they notice something is wrong?" | doesn't look right, that can't be, checked, makes sense | AC9M3N01 |

#### Badge Level 4: Number Strategist

| DLO ID | Statement | Parent Check Question | Keywords for Moment Matching | AC V9 Codes |
|--------|-----------|----------------------|------------------------------|-------------|
| M1-DLO-23 | Works with numbers to at least 1,000,000 | "Can they read and compare numbers in the hundred thousands?" | million, hundred thousand, large numbers | AC9M5N01, AC9M6N01 |
| M1-DLO-24 | Understands negative numbers in context | "Do they understand what -3Â°C means, or that you can owe money?" | negative, below zero, minus, owe, debt | AC9M6N01 |
| M1-DLO-25 | Connects place value to the metric system (milli, centi, kilo) | "Can they explain why there are 100cm in a metre using place value thinking?" | metric, centimetre, millimetre, kilo means thousand | AC9M5N01, AC9M5M01 |
| M1-DLO-26 | Uses place value understanding for decimal numbers | "Can they explain what 3.47 means in terms of ones, tenths, hundredths?" | decimal, tenths, hundredths, decimal point, point four | AC9M5N01, AC9M6N01 |
| M1-DLO-27 | Applies estimation strategies to real-world problems | "Can they estimate the total grocery bill before checkout?" | estimated, roughly, about, ballpark, approximate | AC9M5N01, AC9M6N06 |
| M1-DLO-28 | Demonstrates deep place value flexibility across contexts | "Can they explain why our number system works the way it does?" | base ten, number system, why tens, how numbers work | AC9M6N01 |

### DLO Prerequisite Graph for M1

```
M1-DLO-01 (one-to-one counting)
    â”œâ”€â”€ M1-DLO-02 (cardinality)
    â”‚       â””â”€â”€ M1-DLO-04 (comparing groups)
    â”‚               â””â”€â”€ M1-DLO-09 (comparing 2-digit)
    â”œâ”€â”€ M1-DLO-03 (recognises numerals)
    â”‚       â””â”€â”€ M1-DLO-11 (reads/writes to 100)
    â”‚               â””â”€â”€ M1-DLO-16 (reads/writes to 10,000)
    â”‚                       â””â”€â”€ M1-DLO-23 (to 1,000,000)
    â””â”€â”€ M1-DLO-05 (counts to 20)
            â”œâ”€â”€ M1-DLO-06 (counts from any start)
            â”‚       â””â”€â”€ M1-DLO-07 (skip counting)
            â”‚               â”œâ”€â”€ M1-DLO-08 (partitions tens/ones)
            â”‚               â”‚       â”œâ”€â”€ M1-DLO-10 (flexible composition)
            â”‚               â”‚       â”‚       â””â”€â”€ M1-DLO-19 (mental add/subtract)
            â”‚               â”‚       â””â”€â”€ M1-DLO-17 (PV through thousands)
            â”‚               â”‚               â””â”€â”€ M1-DLO-26 (decimal PV)
            â”‚               â””â”€â”€ M1-DLO-14 (odd/even)
            â”œâ”€â”€ M1-DLO-12 (number line)
            â”‚       â””â”€â”€ M1-DLO-18 (rounding)
            â”‚               â””â”€â”€ M1-DLO-27 (estimation)
            â””â”€â”€ M1-DLO-13 (estimates)
                    â””â”€â”€ M1-DLO-22 (reasonableness)
```

---

## Worked Example: L5 Written Expression â€” Full Depth

Showing a second thread to demonstrate the pattern works across domains.

### Badge Levels

**Badge Level 1: First Words**
- Typical age: 4â€“6
- DLOs: L5-DLO-01 through L5-DLO-05
- Theme: "I can put my ideas on paper"

**Badge Level 2: Story Builder**
- Typical age: 6â€“8
- DLOs: L5-DLO-06 through L5-DLO-13
- Theme: "I can write to share ideas and tell stories"

**Badge Level 3: Confident Writer**
- Typical age: 8â€“10
- DLOs: L5-DLO-14 through L5-DLO-20
- Theme: "I can write clearly for different purposes and readers"

**Badge Level 4: Skilled Communicator**
- Typical age: 10â€“12
- DLOs: L5-DLO-21 through L5-DLO-26
- Theme: "I write with purpose, style, and awareness of my reader"

### DLOs â€” Badge Level 1: First Words

| DLO ID | Statement | Parent Check Question | Keywords | AC V9 |
|--------|-----------|----------------------|----------|-------|
| L5-DLO-01 | Dictates ideas for someone else to write | "If you ask them to tell you a sentence about their day, can they give you one?" | told me to write, dictated, said to write down | AC9EFLY06 |
| L5-DLO-02 | Draws pictures to convey a message | "When they draw, do they explain what their picture 'says' or 'tells'?" | drew a picture of, this is about, picture story | AC9EFLY06 |
| L5-DLO-03 | Writes or copies own name | "Can they write their name without a model to copy?" | wrote name, signed, put their name | AC9EFLY08 |
| L5-DLO-04 | Attempts to write words using letter-sound knowledge | "When they try to write a word, do the letters roughly match the sounds?" | wrote, sounded out, tried to spell, invented spelling | AC9EFLY06 |
| L5-DLO-05 | Writes a simple sentence with capital and full stop | "Can they write a sentence that starts with a capital letter and ends with a full stop?" | sentence, capital letter, full stop, period | AC9E1LY06 |

### DLOs â€” Badge Level 2: Story Builder

| DLO ID | Statement | Parent Check Question | Keywords | AC V9 |
|--------|-----------|----------------------|----------|-------|
| L5-DLO-06 | Writes multiple connected sentences on a topic | "Can they write 3â€“4 sentences that are all about the same thing?" | wrote about, paragraph, sentences about, wrote more | AC9E1LY06, AC9E2LY06 |
| L5-DLO-07 | Includes beginning, middle, and end in narrative writing | "When they write a story, does it have a proper start, something happening, and an ending?" | beginning middle end, story, what happened, the end | AC9E2LY06, AC9E2LE02 |
| L5-DLO-08 | Uses time connectives (first, then, next, finally) | "Do they use words like 'first', 'then', 'after that' to connect their sentences?" | first, then, next, after that, finally, later | AC9E2LY06 |
| L5-DLO-09 | Includes descriptive language (adjectives, simple adverbs) | "Do they write things like 'the big red truck' or 'ran quickly' rather than just 'the truck ran'?" | describing words, adjectives, details, colourful language | AC9E2LY06 |
| L5-DLO-10 | Writes for more than one purpose (list, letter, story, recount) | "Have they tried writing different things â€” a list AND a story AND a letter?" | list, letter, story, instructions, recount, recipe | AC9E2LY06, AC9E2LA01 |
| L5-DLO-11 | Re-reads own writing and notices something to change | "After writing, do they read it back and fix or add anything?" | read it back, changed, fixed, added more, noticed | AC9E2LY06 |
| L5-DLO-12 | Uses basic punctuation beyond full stops (question marks, exclamation marks) | "Do they use question marks when asking something and exclamation marks for excitement?" | question mark, exclamation mark, comma, punctuation | AC9E2LA02 |
| L5-DLO-13 | Writes with enough fluency that ideas aren't lost while forming letters | "Can they get their ideas down before they forget them, or does handwriting slow them down too much?" | wrote quickly, kept up, got ideas down, flowed | AC9E2LY06, AC9E2LY08 |

### Parent Assessment Questions â€” Badge Level 2: Story Builder

```
Ready to award "Story Builder"?
Let's think through it together:

1. WRITING FLUENCY
   "Can [child] sit down and write a page about something 
   they care about â€” without needing help with every word?"
   
   What you're looking for: They can get ideas flowing onto 
   paper. Some spelling mistakes are fine â€” the ideas matter.

2. STORY STRUCTURE  
   "When they write a story, does it have a clear beginning 
   (setting up the story), middle (something happening), and 
   end (how it wraps up)?"
   
   What you're looking for: Not a perfect narrative, but a 
   sense of sequence â€” not just random sentences.

3. PURPOSE VARIETY
   "Has [child] written at least 3 different types of text 
   this term? (e.g., a story, a letter, a list, instructions, 
   a recount of an event)"
   
   What you're looking for: They understand that writing 
   serves different purposes, not just "writing stories."

4. SELF-EDITING
   "After writing, does [child] ever read it back and change 
   something â€” adding a word, fixing a sentence, improving 
   an idea?"
   
   What you're looking for: Any sign of revision â€” even small. 
   This shows they understand writing is a process.
```

---

## Cross-Thread Unlock Mechanics

The Skyrim-style skill tree shows connections between threads. Here's how unlocking works:

### Types of Connections

| Connection Type | Visual | Meaning | Example |
|----------------|--------|---------|---------|
| **Prerequisite** | Solid line with arrow | This thread typically develops after the other | M2 (Operations) requires M1 (Number Sense) at Developing |
| **Co-requisite** | Dotted line | These threads often develop together | L5 (Written Expression) and L6 (Handwriting) develop in parallel |
| **Enables** | Glowing dotted line (ghost) | This thread opens up the possibility of another | M3 (Fractions) enables M8 (Probability) |
| **Cross-domain** | Thin bridge line | Skills in one domain support another | M5 (Measurement) supports S1 (Scientific Inquiry) |

### Badge-to-Badge Unlocks

The most visible unlock pattern is at the badge level. When a child earns a badge, new badges in connected threads become **visible** (ghost â†’ emerging):

```
Number Explorer (M1-L1) â”€â”€EARNEDâ”€â”€â†’ unlocks:
  â”œâ”€â”€ Operation Explorer (M2-L1) â€” can now start
  â”œâ”€â”€ Fraction Finder (M3-L1) â€” can now start  
  â””â”€â”€ Measurement Starter (M5-L1) â€” can now start

Number Navigator (M1-L2) â”€â”€EARNEDâ”€â”€â†’ unlocks:
  â”œâ”€â”€ Operation Explorer (M2-L1) â€” now recommended
  â”œâ”€â”€ Pattern Spotter (M4-L1) â€” can now start
  â””â”€â”€ Data Collector (M7-L1) â€” can now start
```

### How This Drives the Weekly Planner

The capabilities connector feeds directly into activity recommendations:

1. System identifies **active threads** (threads with recent observations or in-progress badges)
2. System identifies **DLOs that are close to confirmation** (3+ supporting moments but not yet parent-confirmed)
3. System identifies **badges that are close to being awarded** (most DLOs confirmed)
4. System identifies **ghost threads about to unlock** (prerequisites nearly met)
5. Weekly planner suggests activities that:
   - Deepen active threads (more evidence for emerging DLOs)
   - Close out badges (activities that target remaining DLOs)
   - Bridge to new capabilities (activities that touch both established and ghost threads)

---

## AI-Powered Moment Mapping

### How It Works

When a parent logs a moment, the system needs to map it to the right DLOs. This is the AI-powered core of the capability connector.

**Input processing pipeline:**

```
Parent writes: "Emma counted all the seeds in her sunflower head. 
She grouped them into piles of 10 and had 7 left over. She said 
'that's 127 seeds!' and then wrote 127 on her nature journal."

Step 1: Extract capability signals
  â”œâ”€â”€ "counted" â†’ M1 (Number Sense)
  â”œâ”€â”€ "grouped into piles of 10" â†’ M1-DLO-07 (skip counting), M1-DLO-08 (tens and ones)
  â”œâ”€â”€ "7 left over" â†’ M1-DLO-10 (flexible composition)
  â”œâ”€â”€ "127" â†’ M1-DLO-16 (numbers beyond 100)
  â”œâ”€â”€ "wrote 127" â†’ L5 (Written Expression), L6 (Handwriting)
  â”œâ”€â”€ "sunflower head" â†’ S5 (Scientific Observation)
  â””â”€â”€ "nature journal" â†’ S5 (Scientific Observation)

Step 2: Suggest DLO mappings (ranked by confidence)
  â”œâ”€â”€ HIGH: M1-DLO-07 â€” Skip counts by 10s âœ“ (grouped into piles of 10)
  â”œâ”€â”€ HIGH: M1-DLO-08 â€” Partitions into tens and ones âœ“ (grouped + 7 left over)  
  â”œâ”€â”€ MED:  M1-DLO-16 â€” Reads/writes numbers beyond 100 (127)
  â”œâ”€â”€ MED:  S5-DLO-03 â€” Records observations systematically (nature journal)
  â”œâ”€â”€ LOW:  L5-DLO-06 â€” Writes connected sentences (wrote in journal)
  â””â”€â”€ LOW:  L6-DLO-04 â€” Writes numbers and words legibly

Step 3: Present to parent for confirmation
  "This moment touches these capabilities:"
  [âœ“] Number Sense â€” skip counting, tens & ones    â† auto-selected (HIGH)
  [âœ“] Scientific Observation â€” recording in journal â† auto-selected (MED)
  [ ] Written Expression â€” writing in journal       â† available, not selected
  
  [Confirm]  [Edit]
```

### For Self-Designed Resources / Non-Module Activities

When parents are doing things beyond Hearth's modules â€” fixing a walkie-talkie, building a dune buggy, running a market stall â€” the system needs to catch the learning in those activities too.

**Auto-detection approach:**

The parent describes the activity in the Retrospective Logger. The AI analyses the description and suggests not just individual DLOs but entire **capability clusters** that the activity touches:

```
Parent logs: "Spent three weekends building a go-kart from 
scrap materials. Drew plans first, measured and cut wood, 
figured out steering geometry, tested and redesigned the 
brakes twice, painted it, and raced it down the hill."

Capability cluster detection:
  â˜… Design & Construction (C6) â€” drew plans, built, redesigned
    â”œâ”€â”€ C6-DLO-08: Uses the design cycle (define â†’ design â†’ make â†’ evaluate â†’ improve)
    â”œâ”€â”€ C6-DLO-07: Selects materials based on properties
    â””â”€â”€ C6-DLO-09: Modifies designs based on testing

  â˜… Measurement Sense (M5) â€” measured and cut
    â”œâ”€â”€ M5-DLO-08: Measures accurately using standard metric units
    â””â”€â”€ M5-DLO-10: Applies measurement to practical problems

  â˜… Spatial Reasoning (M6) â€” steering geometry
    â””â”€â”€ M6-DLO-07: Applies spatial reasoning to solve real problems

  â˜… Planning & Organisation (EF4) â€” plans, multi-weekend project
    â”œâ”€â”€ EF4-DLO-08: Plans multi-day projects
    â””â”€â”€ EF4-DLO-07: Adjusts plans when things don't work

  â˜… Physical & Chemical Sciences (S4) â€” brakes, forces
    â””â”€â”€ S4-DLO-05: Understands forces in practical contexts

  BADGE SUGGESTION: This activity could earn "Maker" badge (C6-L2)
  if [child] can answer the assessment questions.
  [Review for badge? â†’]
```

---

## Flexibility & Expansion Architecture

### Why Categories Must Be Modifiable

The initial 57 threads and ~800â€“1200 DLOs are a starting hypothesis. After launch with 10â€“20 families, we'll discover:
- Threads that are too broad (need splitting)
- Threads that are too narrow (need merging)
- DLOs that don't match how parents actually describe learning
- Missing capabilities that homeschool families value
- Keyword mappings that produce false positives or miss real learning

### Schema Flexibility

Every entity in the system has a version field and supports non-destructive changes:

```javascript
{
  // Thread versioning
  threadVersion: 2,
  previousVersionId: 'M1-v1',
  
  // DLO migration
  // When a DLO is split, merged, or moved:
  dloMigrations: [
    { 
      type: 'split',
      originalDLO: 'M1-DLO-08-v1',
      newDLOs: ['M1-DLO-08a-v2', 'M1-DLO-08b-v2'],
      // Existing observations maintain their mapping
      observationMigration: 'map-to-both'
    },
    {
      type: 'merge',
      originalDLOs: ['M1-DLO-14-v1', 'M1-DLO-15-v1'],
      newDLO: 'M1-DLO-14-v2',
      observationMigration: 'map-to-new'
    }
  ]
}
```

### Family-Defined Extensions

Families can create:
- **Custom capability threads** (e.g., "Bushcraft," "Animal Husbandry," "Mandarin")
- **Custom DLOs within any thread** (e.g., adding "Can identify 10 native bird species" to Scientific Observation)
- **Custom badge levels** (e.g., a "Master Gardener" badge within a custom "Gardening" thread)

Custom elements don't map to AC V9 but still appear in the constellation and contribute to the child's learning profile.

### The Personality Layer

As Drew noted: capabilities should create "a real sense of personality â€” some aspects of the branching will not be taken by everyone."

The constellation becomes a **fingerprint of who this learner is**:
- A child deeply into construction and design will have thick, glowing threads in C6, M5, M6, S4
- A child who loves stories will have dense L9, C1, C3, C4 threads
- A child passionate about animals will have custom threads alongside strong S2 and PS5

When someone looks at this child's capability profile â€” whether that's a receiving school, a post-secondary institution, or the child themselves years later â€” they see not just "completed Year 3 curriculum" but a rich, unique learning identity.

---

## Reporting Integration

### HEU Report Bridge

The capability system maps directly to HEU reporting requirements through a clear chain:

```
Observation moments
  â†’ map to DLOs
    â†’ DLOs map to AC V9 Content Descriptors
      â†’ Content Descriptors aggregate into Achievement Standard coverage
        â†’ Achievement Standards are what HEU requires demonstrated

The HEU report screen already tracks content descriptor coverage.
The capabilities connector provides the EVIDENCE PIPELINE that feeds it.
```

### School Transfer Document

When a child transitions to school, the capability profile provides:

```
LEARNER CAPABILITY PROFILE â€” Emma Morrison, Age 9

MATHEMATICAL THINKING
  â— Number Sense & Place Value â€” Demonstrating
    Badges earned: Number Explorer âœ“, Number Navigator âœ“, Number Architect âœ“
    Current work: Number Strategist (14/16 DLOs confirmed)
    Equivalent: Working at Year 4â€“5 level
    
  â— Operations & Computation â€” Developing
    Badges earned: Operation Explorer âœ“
    Current work: Operation Builder (8/12 DLOs confirmed)
    Equivalent: Working at Year 3 level

  â— Fractional Thinking â€” Emerging
    Badges earned: Fraction Finder âœ“
    Current work: Fraction Builder (4/10 DLOs confirmed)
    Note: Strong practical understanding (cooking, measurement)
    
  [... all 57 threads with status ...]

UNIQUE STRENGTHS (custom threads):
  â— Bushcraft & Outdoor Skills â€” Demonstrating
    4 custom badges earned
    258 logged observations over 3 years
    
  â— Animal Husbandry â€” Developing
    2 custom badges earned
    Maintains and cares for chickens and a vegetable garden
```

This gives a receiving school far more useful information than a report card ever could.

---

## Data Schema Summary

### Sanity CMS (Content â€” Shared Across Families)

```javascript
// Achievement Standard
achievementStandard {
  yearLevel, learningArea, strand, 
  standardText, contentDescriptors[]
}

// Capability Thread (from thread library)
capabilityThread {
  threadId, name, domain, summary,
  emergingIndicators[], developingIndicators[], demonstratingIndicators[],
  prerequisiteThreads[], enablesThreads[],
  achievementStandardMappings[],
  typicalEmergingAge, typicalDemonstratingAge
}

// Badge Level
badgeLevel {
  badgeId, name, thread (ref), level, 
  summary, theme,
  prerequisiteBadges[], unlocksBadges[],
  requiredDLOs[] (ref), assessmentQuestions[],
  awardCriteria, achievementStandardMapping,
  evidencePrompt
}

// Discrete Learning Objective
discreteLearningObjective {
  dloId, thread (ref), badgeLevel (ref),
  statement, parentVersion, 
  checkQuestion, checkLookingFor,
  momentKeywords[], contentDescriptors[],
  prerequisiteDLOs[], enablesDLOs[],
  yearLevel
}
```

### PostgreSQL (User Data â€” Per Family)

```sql
-- Learner capability state
learner_dlo_status (
  learner_id, dlo_id,
  status: 'not-started' | 'emerging' | 'confirmed',
  confirmed_date, confirmed_by,
  supporting_observations[]
)

-- Badge awards
learner_badge_awards (
  learner_id, badge_id,
  awarded_date, awarded_by,
  assessment_responses,  -- parent's answers to check questions
  evidence_ids[]
)

-- Observations (from thread library spec)
observations (
  id, family_id, learner_id, timestamp,
  title, description, evidence[],
  source, source_id,
  dlo_mappings[{ dlo_id, confidence }],
  thread_mappings[{ thread_id }]
)
```

---

## Implementation Sequence

| Phase | Work | Output |
|-------|------|--------|
| **A1** | Complete DLO library for all 57 threads (~800â€“1200 DLOs) | Sanity content |
| **A2** | Define badge levels for all threads (~150â€“200 badges) with assessment questions | Sanity content |
| **A3** | Map all DLOs to AC V9 content descriptors | Sanity reference data |
| **A4** | Build DLO prerequisite graph | Sanity reference data |
| **B1** | Build moment â†’ DLO mapping engine (keyword + AI) | Backend service |
| **B2** | Build badge assessment flow (parent check questions) | Frontend component |
| **B3** | Connect Retrospective Logger to DLO tagging | Integration |
| **B4** | Connect Module Experience to DLO completion | Integration |
| **C1** | Build galaxy zoom UI (Levels 1â€“4) | Frontend â€” constellation |
| **C2** | Build Skyrim-style skill tree navigation | Frontend â€” constellation |
| **C3** | Build badge award ceremony UX | Frontend component |
| **D1** | Connect to HEU report (DLO â†’ CD coverage) | Integration |
| **D2** | Build school transfer capability profile | Export feature |
| **D3** | Connect to weekly planner recommendations | Integration |

---

## Open Questions

1. **DLO confirmation without moments:** Should a parent be able to confirm a DLO purely through the badge assessment questions, without any logged moments? (Proposed answer: YES â€” the check questions are sufficient. Moments are supporting evidence, not requirements.)

2. **Badge award ceremony:** What does it feel like to earn a badge? The current badge creation flow exists but the EARNING experience needs design. This should feel meaningful â€” not a checkbox, but a celebration.

3. **Regression handling:** What happens if a capability that was confirmed seems to regress? A child who could count to 100 last month seems to have lost that. Do we allow parents to "un-confirm" a DLO? (Proposed: yes, with a supportive framing â€” "Sometimes skills need revisiting, that's completely normal.")

4. **Multi-child badge sharing:** Siblings might earn the same badge at different times. The family constellation should celebrate both without comparison.

5. **Import from existing data:** Families who've been homeschooling for years have extensive existing evidence. How do we help them bootstrap their capability profile from historical data?

---

*This document defines the full multi-layer architecture of the Hearth Capabilities Connector. It is the engineering companion to `hearth-capability-thread-library.md` and provides the specification for the galaxy zoom UI, badge integration, DLO library, moment mapping engine, and reporting bridges.*
