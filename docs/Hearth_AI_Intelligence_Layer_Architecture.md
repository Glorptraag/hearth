# Hearth LMS — AI/Intelligence Layer Architecture

> **Purpose:** Complete architecture specification for the cross-cutting intelligence layer that powers logger insights, recommendations, gap analysis, badge detection, dashboard messaging, and pedagogy-informed communication across all screens.
> **Status:** Architecture specification — resolves Open Question #4 from `Hearth_System_Interaction_Map.md`
> **Date:** March 2026
> **Read first:** `Hearth_System_Interaction_Map.md`, `hearth-capabilities-connector-architecture.md`, `hearth-pedagogy-integration-framework.md`
> **Companion files:** `lms-database-schema.js` (data model), `03_CMS_Usage_Mapping.md` (Sanity vs PostgreSQL boundary)

---

## Part 1: Architecture Overview

### The Core Problem

Hearth's intelligence layer needs to do two fundamentally different things, and conflating them creates cost and latency problems:

**Expensive, infrequent operation:** Transform freeform parent language ("We spent the morning at the creek catching tadpoles and Emma counted them into groups of ten") into structured educational data (subject tags, capability thread mappings, curriculum descriptor matches, engagement signals).

**Cheap, frequent operation:** Use pre-computed structured data to surface recommendations, generate messaging, detect gaps, and frame content through a pedagogical lens.

The architecture separates these two concerns completely. The expensive operation happens once, at write-time. Everything else reads from its output.

### Design Principles

**1. Write-heavy, read-cheap.** All AI inference happens when data enters the system (logging). Every downstream screen reads from pre-computed state, never calls the LLM directly.

**2. The Family Intelligence Snapshot.** A single pre-computed JSON object per family, updated asynchronously after each write event, that every screen can read without AI calls. This is Hearth's equivalent of "memory" — shaped intelligence, not raw data.

**3. Smaller library = cheaper intelligence.** The family's content pool (My Library) is the primary constraint on recommendation cost. Families with 20 modules need less computation than families with 200. The four content buckets (unpurchased → purchased → library → planned → completed) are a natural cost boundary.

**4. Pedagogy overlay is string interpolation, not AI.** Framing content through a family's philosophy lens is a template operation using the `familyPedagogicalProfile`, not an LLM call. Pre-authored overlays stored in Sanity, selected at runtime by family profile match.

**5. Token budget per operation.** Every AI call has a defined token ceiling. The logger pipeline (the only real-time LLM interaction) targets under 2,000 tokens total round-trip. Everything else is zero-LLM.

---

## Part 2: System Architecture

### 2.1 The Two-Layer Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                     HEARTH INTELLIGENCE LAYER                       │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  LAYER A: WRITE-TIME INTELLIGENCE (LLM-powered)              │  │
│  │  ═══════════════════════════════════════════════              │  │
│  │                                                               │  │
│  │  Triggered by: Learning entry save (Logger or Module Log)     │  │
│  │  Frequency: 1–5 times per day per family                      │  │
│  │  Latency budget: <3 seconds                                   │  │
│  │  Token budget: <2,000 tokens round-trip                       │  │
│  │                                                               │  │
│  │  Operations:                                                  │  │
│  │   1. Freeform text → structured educational data              │  │
│  │   2. Capability thread mapping suggestions                    │  │
│  │   3. Curriculum descriptor auto-tagging                       │  │
│  │   4. Subject/learning area detection                          │  │
│  │   5. Engagement signal extraction                             │  │
│  │                                                               │  │
│  │  Output: Enriched Learning Entry (structured fields populated)│  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              │                                      │
│                              ▼ triggers                             │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  LAYER B: READ-TIME INTELLIGENCE (zero-LLM)                  │  │
│  │  ═══════════════════════════════════════════════              │  │
│  │                                                               │  │
│  │  Triggered by: Post-write async job + screen load             │  │
│  │  Frequency: Every screen render that needs intelligence       │  │
│  │  Latency budget: <100ms (reading pre-computed data)           │  │
│  │  Token budget: 0 (no LLM calls)                               │  │
│  │                                                               │  │
│  │  Operations (all pre-computed, stored in PostgreSQL):         │  │
│  │   1. Family Intelligence Snapshot rebuild                     │  │
│  │   2. Activity recommendations (sort + filter)                 │  │
│  │   3. Curriculum gap analysis                                  │  │
│  │   4. Badge threshold detection                                │  │
│  │   5. Dashboard summary generation                             │  │
│  │   6. Weekly Planner smart suggestions                         │  │
│  │   7. Pedagogy overlay selection                               │  │
│  │                                                               │  │
│  │  Output: Family Intelligence Snapshot (JSON in PostgreSQL)    │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow — Complete Pipeline

```
PARENT ACTION                    WRITE-TIME (LLM)           ASYNC JOB              READ-TIME (screens)
═══════════════                  ═══════════════            ═════════              ═══════════════════

Retrospective Logger ──┐
                       │
                       ├──► Learning Entry   ──► NLP Pipeline  ──► Enriched Entry ──► Snapshot Rebuild ──┐
                       │    (raw fields)         (LLM call)        (structured)       (async worker)     │
Module Log Mode ───────┘                                                                                 │
                                                                                                         │
                                                                                                         ▼
                                                                                          ┌──────────────────────────┐
                                                                                          │ FAMILY INTELLIGENCE      │
                                                                                          │ SNAPSHOT (PostgreSQL)    │
                                                                                          │                          │
OTHER WRITE EVENTS (no LLM):                                                              │ Per-child:               │
                                                                                          │  • capability_state{}    │
  Pedagogy Engine save ────► Profile update ────► Snapshot Rebuild ──────────────────────►│  • curriculum_coverage{} │
  Family Settings save ────► Config update  ────► Snapshot Rebuild ──────────────────────►│  • gap_analysis{}        │
  Library add/remove   ────► Pool change    ────► Snapshot Rebuild ──────────────────────►│  • badge_thresholds[]    │
  Planner change       ────► Schedule update ───► Snapshot Rebuild ──────────────────────►│  • recent_activity{}     │
                                                                                          │                          │
                                                                                          │ Family-wide:             │
                                                                                          │  • recommendations[]     │
                                                                                          │  • planner_suggestions[] │
                                                                                          │  • dashboard_summary{}   │
                                                                                          │  • pedagogy_overlay_key  │
                                                                                          │  • library_pool_hash     │
                                                                                          └──────────────────────────┘
                                                                                                         │
                                                                                                         ▼
                                                                                               SCREEN READS
                                                                                          (all zero-LLM, <100ms)
                                                                                          ┌──────────────────┐
                                                                                          │ Dashboard        │
                                                                                          │ Activity Disc.   │
                                                                                          │ Weekly Planner   │
                                                                                          │ HEU Report       │
                                                                                          │ Portfolio         │
                                                                                          │ Capabilities     │
                                                                                          │ Learner Profile  │
                                                                                          └──────────────────┘
```

---

## Part 3: Write-Time Intelligence — The NLP Pipeline

This is the only place in the entire platform where an LLM is called. It runs when a learning entry is saved from either the Retrospective Logger or Module Log Mode.

### 3.1 The Two Entry Paths

The pipeline handles two different input contexts with different token costs:

**Module Log Mode (cheap path):**
The system already knows what module was run, what outcomes were expected, which capability threads are mapped, and which curriculum descriptors apply. The LLM's job is narrow: extract per-child engagement signals and novel discoveries from the freeform observation text. Most structured fields are pre-populated from module metadata.

Estimated token cost: 300–600 tokens round-trip.

**Retrospective Logger (expensive path):**
The system knows nothing except what the parent typed. The LLM must infer subjects, map capability threads, suggest curriculum descriptors, and detect engagement signals from entirely freeform input.

Estimated token cost: 1,200–2,000 tokens round-trip.

### 3.2 Pipeline Stages

```
PARENT INPUT                                              ENRICHED OUTPUT
════════════                                              ═══════════════

  title: "Creek exploration"                              title: "Creek exploration"
  description: "Spent the morning                        description: (unchanged)
    at the creek. Emma counted                            ┌─────────────────────────────┐
    tadpoles into groups of ten                           │ STRUCTURED FIELDS (new)     │
    while Liam sketched the                               │                             │
    different species we found.                           │ subjects_detected:          │
    Both kids were fascinated                             │   ["Mathematics",           │
    by the lifecycle chart I                              │    "Science",               │
    drew in the mud."                                     │    "Visual Arts"]           │
  learner_ids: [emma, liam]                               │                             │
  evidence: [3 photos]                                    │ capability_suggestions:     │
  source: "retrospective"                                 │   emma:                     │
                                                          │     - M1 Number Sense       │
         │                                                │       (grouping by tens)    │
         │                                                │     - S2 Living Things      │
         │                                                │       (lifecycle awareness) │
         ▼                                                │   liam:                     │
                                                          │     - A1 Visual Expression  │
  ┌──────────────────────┐                                │       (observational sketch)│
  │ STAGE 1: CONTEXT     │                                │     - S2 Living Things      │
  │ ASSEMBLY             │                                │       (species ID)          │
  │                      │                                │                             │
  │ Gather:              │                                │ curriculum_descriptors:     │
  │ • Family ped profile │                                │   ["ACMNA012",             │
  │ • Child ages/levels  │                                │    "ACSSU030",             │
  │ • Recent entries     │                                │    "ACAVAM106"]            │
  │   (last 5, summaries │                                │                             │
  │    only — not full   │                                │ per_child_signals:          │
  │    text)             │                                │   emma: {                   │
  │ • Active cap threads │                                │     engagement: "absorbed", │
  │   for these children │                                │     discovery: "Grouped     │
  └──────────┬───────────┘                                │       tadpoles by tens —    │
             │                                            │       applied place value   │
             ▼                                            │       in natural context"   │
  ┌──────────────────────┐                                │   }                         │
  │ STAGE 2: LLM CALL    │                                │   liam: {                   │
  │ (single call)        │                                │     engagement: "focused",  │
  │                      │                                │     discovery: "Sketched    │
  │ System prompt:       │                                │       species — scientific  │
  │  structured output   │                                │       observation through   │
  │  format, curriculum  │                                │       art"                  │
  │  descriptor list,    │                                │   }                         │
  │  capability thread   │                                │                             │
  │  taxonomy (compact)  │                                │ insight_suggestions:        │
  │                      │                                │   ["Emma naturally used     │
  │ User prompt:         │                                │    grouping — this connects │
  │  entry text +        │                                │    to her Number Sense      │
  │  assembled context   │                                │    thread",                 │
  │                      │                                │    "Both children showed    │
  │ Output: JSON with    │                                │    sustained curiosity      │
  │  all structured      │                                │    about lifecycles — look  │
  │  fields              │                                │    for a Living Things      │
  └──────────┬───────────┘                                │    module to build on       │
             │                                            │    this"]                   │
             ▼                                            │                             │
  ┌──────────────────────┐                                │ confidence: 0.82           │
  │ STAGE 3: VALIDATION  │                                │ status: "suggested"        │
  │ & SAVE               │                                │  (awaiting parent confirm) │
  │                      │                                └─────────────────────────────┘
  │ • Parse JSON response│
  │ • Validate cap thread│
  │   IDs exist          │
  │ • Validate descriptor│
  │   codes are real     │
  │ • Mark all mappings  │
  │   as "suggested"     │
  │   (not confirmed)    │
  │ • Save enriched entry│
  │ • Queue snapshot     │
  │   rebuild job        │
  └──────────────────────┘
```

### 3.3 The LLM Prompt — Design Specification

The system prompt is static and cached (Anthropic prompt caching reduces cost for repeated system prompts). It contains:

**Static payload (cached, ~1,500 tokens):**
- Output JSON schema definition
- Compact capability thread taxonomy (57 threads, ID + name + 3 keywords each — ~600 tokens)
- Compact curriculum descriptor index (grouped by learning area, code + short label — ~700 tokens)
- Behaviour instructions: structured output only, no conversational preamble, confidence scoring rules

**Dynamic payload (per-call, variable):**
- The learning entry text (title + description): ~50–300 tokens
- Family pedagogical profile (philosophy + top 3 values): ~30 tokens
- Child context (names, ages, year levels for participating children): ~30 tokens
- Recent entry summaries (last 5 entries, one sentence each): ~100 tokens
- Active capability threads for participating children (threads with recent evidence): ~50 tokens

**Total per-call input estimate:**
- Cached system prompt: ~1,500 tokens (billed at reduced rate after first call)
- Dynamic user content: ~300–500 tokens
- Total input: ~1,800–2,000 tokens

**Output estimate:** ~200–400 tokens (structured JSON, no prose)

**Round-trip cost:** Under 2,000 billable tokens with prompt caching. At Haiku-tier pricing, this is fractions of a cent per entry.

### 3.4 Model Selection Strategy

> **Implementation note (April 2026):** All entries currently use a single Haiku pipeline. Haiku handles all cases well; the per-source routing below is a future optimization, not a current gap.

The pipeline is designed to route based on complexity:

```
ENTRY ARRIVES
     │
     ├── Source: "module_log"?
     │      │
     │      └── YES → Module metadata pre-populates 80% of fields
     │                LLM fills: per_child_signals, novel discoveries
     │                Model: Haiku (fast, cheap, structured extraction)
     │                Token budget: 600
     │
     └── Source: "logger" / "hearth_session"?
            │
            ├── Description < 50 words?
            │      │
            │      └── SHORT ENTRY → Limited inference needed
            │                        Model: Haiku
            │                        Token budget: 1,000
            │
            └── Description >= 50 words?
                   │
                   └── RICH ENTRY → Full NLP pipeline
                                    Model: Haiku
                                    Token budget: 2,000
```

**Why Haiku for everything:** The task is structured extraction with a well-defined output schema and a constrained taxonomy. This is exactly what smaller models excel at.

**Retry logic:** Retry is triggered on JSON parse errors — the pipeline retries once with the same model. If the final result has confidence < 0.5, an async Sonnet re-enrichment fires (fire-and-forget) and overwrites the entry if successful, triggering a snapshot rebuild.

### 3.5 The Live Insights Panel (Retrospective Logger)

The Logger's right-hand panel shows AI suggestions in real-time as the parent types. This appears to need streaming LLM calls, but it doesn't.

**How it actually works:**

The live panel uses **debounced partial inference**, not continuous streaming:

```
PARENT TYPING                    DEBOUNCE            PARTIAL INFERENCE
═════════════                    ═══════            ═════════════════

Keystroke → buffer
Keystroke → buffer
Keystroke → buffer
[pause 1.5s] ──────────────────► trigger ──────────► Quick classification
                                                     (no LLM — rule-based)
                                                     │
                                                     ├── Subject keywords detected?
                                                     │   → Show: "📐 Looks like Maths"
                                                     │
                                                     ├── Child name mentioned?
                                                     │   → Show: "👦 Emma mentioned"
                                                     │
                                                     ├── Capability keyword match?
                                                     │   → Show: "🌱 Possible: Number Sense"
                                                     │
                                                     └── Engagement language detected?
                                                         → Show: "✨ Sounds like deep engagement"

[parent continues typing...]

Keystroke → buffer
Keystroke → buffer
[pause 1.5s] ──────────────────► trigger ──────────► Updated classification
                                                     (still no LLM — refined
                                                      keyword matching with
                                                      more text context)

[SAVE button pressed] ─────────────────────────────► FULL LLM PIPELINE
                                                     (Stage 1-2-3 above)
                                                     Results replace partial
                                                     suggestions with confirmed
                                                     structured data
```

**The keyword matcher** is a lightweight client-side (or edge function) operation using:
- Subject keyword lists (curated, ~200 terms mapped to 8 learning areas)
- Capability thread keyword lists (from the thread taxonomy, ~500 terms mapped to 57 threads)
- Engagement vocabulary list (~50 terms: "loved", "fascinated", "struggled", "bored", etc.)
- Child name matching (from family profile, exact string match)

This gives responsive, useful feedback without any LLM calls during typing. The suggestions are clearly marked as preliminary ("Looks like..." rather than "This is..."). The full LLM pipeline runs once at save, replacing preliminary suggestions with confirmed structured data.

**Cost of the live panel: zero tokens.** All keyword matching. The LLM only fires on save.

---

## Part 4: The Family Intelligence Snapshot

### 4.1 What It Is

A single JSON document per family, stored in PostgreSQL, rebuilt asynchronously after any write event. Every screen in the platform reads from this snapshot instead of computing intelligence on the fly.

Think of it as a materialised view of everything the platform knows about a family's learning state, pre-shaped for consumption by every screen.

### 4.2 Structure

```javascript
family_intelligence_snapshot = {
  family_id: "fam_abc123",
  snapshot_version: 47,              // Incremented on each rebuild
  rebuilt_at: "2026-03-02T14:30:00Z",
  rebuild_trigger: "entry_saved",    // What caused this rebuild

  // ═══════════════════════════════════════════
  // PER-CHILD STATE
  // ═══════════════════════════════════════════
  children: {
    "emma_id": {
      // CAPABILITY STATE — feeds Constellation, Portfolio, HEU
      capability_state: {
        active_threads: [
          {
            thread_id: "M1",
            thread_name: "Number Sense & Place Value",
            observation_count: 14,
            last_evidence_date: "2026-02-28",
            suggested_tier: "demonstrating",
            current_badge_level: "number_explorer",
            next_badge: "number_navigator",
            next_badge_progress: 0.72,
            dlos_confirmed: 2,
            dlos_total: 3,
            trajectory: "steady_growth",
            recent_evidence_quality: "strong"
          }
          // ... more threads
        ],
        dormant_threads: ["A3", "H2"],   // Threads with no evidence in 60+ days
        thread_count_active: 12,
        thread_count_total: 18            // Threads with any evidence ever
      },

      // CURRICULUM COVERAGE — feeds HEU Report
      curriculum_coverage: {
        year_level: "Year 2",
        learning_areas: {
          "English": {
            descriptors_evidenced: 8,
            descriptors_total: 15,
            coverage_pct: 53,
            gap_descriptors: ["ACELA1461", "ACELT1587"],
            strongest_strand: "Literature",
            weakest_strand: "Language"
          },
          "Mathematics": { /* ... */ },
          "Science": { /* ... */ },
          "HASS": { /* ... */ },
          "The Arts": { /* ... */ }
        },
        overall_coverage_pct: 61,
        heu_posture: "on_track",         // on_track | needs_attention | at_risk
        days_until_next_review: 47,
        work_samples_available: 9,
        work_samples_required: 6
      },

      // GAP ANALYSIS — feeds HEU Report recommendations
      gap_analysis: {
        priority_gaps: [
          {
            learning_area: "English",
            strand: "Language",
            descriptor: "ACELA1461",
            plain_language: "Understanding how texts are structured",
            suggested_modules: ["mod_abc", "mod_def"],
            urgency: "moderate",           // low | moderate | high
            estimated_sessions_to_fill: 2
          }
        ],
        gap_count: 4,
        gaps_addressable_from_library: 3,  // How many can be filled with My Library
        gaps_requiring_new_content: 1       // How many need marketplace or creation
      },

      // BADGE THRESHOLDS — feeds post-logging badge trigger
      badge_thresholds: {
        ready: [
          {
            thread_id: "M1",
            badge_id: "number_navigator",
            badge_name: "Number Navigator",
            progress: 0.92,
            remaining_dlos: ["M1-DLO-11"],
            trigger_on_next_relevant_entry: true
          }
        ],
        approaching: [
          {
            thread_id: "S2",
            badge_id: "living_things_explorer",
            progress: 0.65,
            estimated_entries_to_ready: 3
          }
        ]
      },

      // RECENT ACTIVITY — feeds Dashboard, Learner Profile
      recent_activity: {
        entries_last_7_days: 4,
        entries_last_30_days: 12,
        most_active_subjects: ["Mathematics", "Science"],
        most_active_threads: ["M1", "S2", "S3"],
        current_sparks: ["insects", "building", "water"],
        engagement_trend: "consistent",     // increasing | consistent | declining | new
        preferred_session_times: ["morning", "outdoor_afternoon"],
        average_session_length_minutes: 22
      }
    },
    "liam_id": { /* same structure */ }
  },

  // ═══════════════════════════════════════════
  // FAMILY-WIDE STATE
  // ═══════════════════════════════════════════

  // RECOMMENDATIONS — feeds Activity Discovery sort order
  recommendations: {
    suggested_next: [
      {
        module_id: "mod_xyz",
        module_title: "Pond Life Investigation",
        reason_code: "spark_match",        // spark_match | gap_fill | repeat_value | energy_match
        reason_text: "Builds on recent creek exploration",
        relevant_children: ["emma_id", "liam_id"],
        priority_score: 0.89
      }
    ],
    // Sorted by priority_score, capped at 10
    generated_from_library_size: 34        // How many modules were in the pool
  },

  // PLANNER SUGGESTIONS — feeds Weekly Planner smart fill
  planner_suggestions: {
    week_of: "2026-03-02",
    already_planned: ["mod_abc", "mod_ghi"],
    suggested_additions: [
      {
        module_id: "mod_jkl",
        suggested_day: "Wednesday",
        reason_code: "gap_fill",
        reason_text: "English Language strand needs attention",
        energy_match: "calm_focus",         // active | calm_focus | creative | outdoor
        estimated_duration_minutes: 25
      }
    ],
    subject_balance: {
      "Mathematics": { planned: 2, recommended: 2, status: "balanced" },
      "English": { planned: 0, recommended: 2, status: "under" },
      "Science": { planned: 1, recommended: 1, status: "balanced" }
    }
  },

  // DASHBOARD SUMMARY — feeds Dashboard messaging
  dashboard_summary: {
    headline: "A curious week of outdoor discovery",
    // NOT generated by LLM — assembled from templates:
    // Template: "A {engagement_adj} week of {top_theme}"
    // engagement_adj derived from engagement_trend
    // top_theme derived from most_active_subjects + recent_sparks
    body_sentences: [
      "Emma and Liam logged 4 sessions this week, with a strong pull toward science and nature.",
      "Emma is close to earning her Number Navigator badge — look for chances to practice grouping and place value."
    ],
    // Template-assembled, not LLM-generated
    pedagogy_frame: "charlotte_mason",     // Which overlay set to use for language
    celebration_moment: null,              // Populated when badge awarded or milestone hit
    nudge: {
      type: "gap_gentle",
      text: "It's been a while since an English session — maybe a living books afternoon?",
      action_module_id: "mod_def"
    }
  },

  // LIBRARY METADATA — feeds recommendation freshness
  library_state: {
    total_modules: 34,
    modules_never_run: 12,
    modules_completed_once: 18,
    modules_completed_multiple: 4,
    last_library_change: "2026-02-25",
    pool_hash: "a3f8c2..."                 // Changes when library contents change
  },

  // PEDAGOGY — feeds all overlay screens
  pedagogy_key: {
    philosophy: "charlotte_mason",
    top_values: ["nature", "child_led", "whole_child"],
    top_practices: ["nature_journaling", "narration", "living_books"],
    overlay_set_id: "cm_nature_v2"         // Pre-built overlay template set in Sanity
  }
}
```

### 4.3 Rebuild Strategy

The snapshot is rebuilt asynchronously by a background worker. Not every trigger requires a full rebuild — the worker performs targeted updates:

```
TRIGGER EVENT                    REBUILD SCOPE                         COST
═════════════                    ═════════════                         ════

Learning entry saved             Per-child: capability_state,          Medium
  (post-LLM enrichment)           curriculum_coverage, gap_analysis,
                                   badge_thresholds, recent_activity
                                 Family: recommendations,
                                   planner_suggestions,
                                   dashboard_summary

Library add/remove               Family: recommendations,              Low
                                   planner_suggestions
                                 (recalculate against new pool)

Planner change                   Family: planner_suggestions,          Low
                                   dashboard_summary.nudge

Pedagogy profile change          Family: pedagogy_key,                 Low
                                   dashboard_summary (re-template)
                                 (Does NOT re-run LLM on past entries)

Family Settings change           Per-child: year_level dependent       Low
  (child age/year level)           fields in curriculum_coverage
                                 Family: gap_analysis recalculation

Badge awarded/deferred           Per-child: badge_thresholds,          Low
                                   capability_state
                                 Family: dashboard_summary
                                   (celebration_moment)
```

**Rebuild latency target:** Under 500ms for targeted updates. The snapshot is available for the next screen load, not guaranteed for the current request. Screens that triggered the rebuild may show stale data for up to one page load.

**Staleness tolerance:** Most screens tolerate a snapshot that's one write event behind. The exception is the Logger's post-save confirmation screen, which should reflect the just-saved entry. This is handled by the Logger directly reading the enriched entry response, not the snapshot.

### 4.4 What No Screen Ever Does

No screen in the platform ever:
- Calls the LLM directly
- Computes curriculum coverage at render time
- Runs gap analysis on the fly
- Generates recommendation sort order during page load
- Assembles dashboard messaging from raw entries

Every screen reads from the snapshot. If the snapshot is stale, the screen shows slightly outdated intelligence — which is acceptable because the snapshot is rebuilt within seconds of any write event.

---

## Part 5: Token Optimisation Strategies

### 5.1 The Cost Model

```
MONTHLY TOKEN BUDGET PER FAMILY
════════════════════════════════

Assumptions:
  • 1–2 retrospective entries per day (5 days/week)
  • 1–2 module log entries per day (5 days/week)
  • Average 1.5 entries/day = ~45 entries/month

Module log entries (cheap path):
  45 × 0.5 = ~22.5 module entries × 500 tokens = 11,250 tokens

Retrospective entries (expensive path):
  45 × 0.5 = ~22.5 retro entries × 1,500 tokens = 33,750 tokens

Total: ~45,000 tokens/month/family

At Haiku pricing (~$0.25/M input, $1.25/M output):
  Input: 35,000 × $0.25/M = $0.009
  Output: 10,000 × $1.25/M = $0.013
  Total: ~$0.02/month/family

With prompt caching (system prompt cached):
  Effective cost: ~$0.01/month/family
```

**At 20 test families:** ~$0.20/month total AI cost.
**At 500 families:** ~$5.00/month total AI cost.
**At 5,000 families:** ~$50/month total AI cost.

This is negligible. The architecture is designed for cost efficiency, but at these volumes the actual spend is trivial. The real value of the optimisation is latency, not dollars.

### 5.2 Prompt Caching Strategy

The system prompt contains static reference data (capability thread taxonomy, curriculum descriptor index) that doesn't change between calls. Anthropic's prompt caching stores this on the server side after the first call, dramatically reducing input token costs on subsequent calls.

```
SYSTEM PROMPT STRUCTURE (cacheable)
════════════════════════════════════

┌─────────────────────────────────────────────────┐
│ CACHED BLOCK (~1,500 tokens)                    │
│                                                 │
│ • Output JSON schema                            │
│ • Capability thread taxonomy (57 threads)       │
│   Format: "M1|Number Sense|counting,place,group"│
│   (pipe-delimited, 3 keywords per thread)       │
│ • Curriculum descriptor index                    │
│   Format: "ACMNA012|Count to 20|Maths|F-Y2"    │
│   (code, short label, area, year range)         │
│ • Behaviour rules                               │
│   - Always return valid JSON                    │
│   - confidence field required (0.0–1.0)         │
│   - Mark all mappings as "suggested"            │
│   - Never invent descriptor codes               │
│   - Per-child differentiation required           │
│                                                 │
│ Cache lifetime: refreshed when taxonomy or       │
│ descriptor list is updated in Sanity CMS         │
│ (rare — quarterly at most)                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ DYNAMIC BLOCK (~300–500 tokens, never cached)   │
│                                                 │
│ • Family pedagogy: "charlotte_mason, values:    │
│   nature/child_led/whole_child"                 │
│ • Children: "Emma (Y2, 7yo), Liam (F, 5yo)"    │
│ • Entry text: [title + description]             │
│ • Recent context: [5 one-line entry summaries]  │
│ • Active threads: "Emma: M1,S2,S3 | Liam: S2"  │
└─────────────────────────────────────────────────┘
```

### 5.3 Taxonomy Compression

The capability thread taxonomy (57 threads, each with 8–25 DLOs) would be enormous if sent in full. The system prompt uses a compressed format:

**Full taxonomy** (~15,000 tokens — too expensive):
```
Thread M1: Number Sense & Place Value
  Domain: Mathematics
  Description: Understanding of whole numbers, their relative size...
  DLO M1-DLO-1: Counts forwards and backwards to at least 20
  DLO M1-DLO-2: Partitions two-digit numbers into tens and ones
  ...
```

**Compressed taxonomy** (~600 tokens — sent in prompt):
```
M1|Number Sense|counting,place_value,grouping,tens,ones,partition
M2|Patterns & Algebra|pattern,sequence,equal,rule,unknown,balance
S1|Scientific Inquiry|question,predict,observe,test,conclude,record
...
```

The LLM maps to thread IDs only. The full thread detail is looked up in PostgreSQL during the validation stage. This is safe because the LLM only needs to recognise which thread is relevant, not reproduce the full definition.

**Curriculum descriptors** use the same approach — code + short label + area + year range, not full descriptions.

### 5.4 The Library Pool Size Advantage

A family with 20 modules in their library needs recommendations computed across 20 options. A family with 200 modules needs computation across 200 options. But this computation happens in the snapshot rebuild (no LLM), so the cost scaling is in database query time, not token spend.

The library pool size affects the LLM call only indirectly: families with smaller libraries tend to log fewer entries (fewer modules to run = fewer sessions = fewer logs). The correlation is natural cost scaling without any explicit throttling.

---

## Part 6: Screen-by-Screen Intelligence Consumption

Each screen reads specific fields from the Family Intelligence Snapshot. No screen calls the LLM.

### 6.1 Consumption Map

```
SCREEN                          SNAPSHOT FIELDS READ                    OVERLAY?
══════                          ════════════════════                    ════════

Dashboard                       dashboard_summary.*                    ✅ Yes
                                children.*.recent_activity
                                children.*.badge_thresholds.ready
                                pedagogy_key

Retrospective Logger            (SPECIAL — see 6.2 below)              ✅ Yes
 • During typing                keyword matcher (no snapshot)
 • On save                      LLM pipeline (writes TO snapshot)
 • Insights panel               pedagogy_key (for language framing)

Module Experience               (Module metadata from Sanity CMS)      ✅ Yes
 • Prep/Facilitate modes        pedagogy_key (for overlay selection)
 • Log mode                     LLM pipeline (writes TO snapshot)

Activity Discovery              recommendations.*                      ✅ Yes
                                children.*.recent_activity.current_sparks
                                library_state
                                pedagogy_key

Weekly Planner                  planner_suggestions.*                  ✅ Yes
                                children.*.gap_analysis.priority_gaps
                                library_state
                                pedagogy_key

HEU Report                      children.[child].curriculum_coverage    ✅ Yes
                                children.[child].gap_analysis
                                children.[child].capability_state
                                pedagogy_key

Portfolio                        children.[child].capability_state      ✅ Yes
                                children.[child].recent_activity
                                pedagogy_key

Capabilities Constellation      children.[child].capability_state       ❌ No
                                children.[child].badge_thresholds

Learner Profile                 children.[child].recent_activity        ❌ No
                                (sparks, rhythms, engagement_trend)

Family Settings                 (no intelligence consumed)              ❌ No

Marketplace                     pedagogy_key (for recommendation sort)  ✅ Yes

Module Builder                  (no intelligence consumed)              ❌ No

Badge Creator                   (no intelligence consumed)              ❌ No
```

### 6.2 The Logger — Special Case

The Logger is the only screen that both reads from and writes to intelligence:

```
LOGGER LIFECYCLE                 INTELLIGENCE INTERACTION
════════════════                 ════════════════════════

1. Screen loads                  Reads: pedagogy_key (for insight panel language)
                                 Reads: children capability_state (for thread suggestions)

2. Parent types                  NO READS — client-side keyword matcher only

3. Parent pauses typing          NO READS — keyword matcher updates (still client-side)
   (debounced at 1.5s)

4. Parent taps save              WRITE: Fires LLM pipeline (Stage 1-2-3)
                                 Receives: enriched entry JSON
                                 Displays: confirmed mappings replace suggestions

5. Entry saved to DB             WRITE: Queues snapshot rebuild
                                 The rebuild happens async — Logger doesn't wait for it

6. Badge threshold check         READ: badge_thresholds.ready from snapshot
   (post-save)                   If match → show secondary badge interface
                                 NOTE: Uses PREVIOUS snapshot (pre-this-entry).
                                 This is correct: the badge threshold was crossed
                                 by accumulated prior evidence. The current entry
                                 is just the trigger, not the sole evidence.
```

---

## Part 7: Pedagogy Overlay — Not AI

The pedagogy overlay is frequently described alongside AI features, but it is explicitly not an AI operation. It is template selection and string interpolation.

### 7.1 How It Works

```
SANITY CMS                              RUNTIME
══════════                              ═══════

Overlay template sets:                  Family profile says:
                                          philosophy: "charlotte_mason"
  charlotte_mason_v2:                     overlay_set_id: "cm_nature_v2"
    dashboard_headline_templates:
      - "A {adj} week of {theme}"            │
      - "Living books and {theme}"           │
    module_why_this_matters:                  ▼
      - science: "Nature study reveals..."
      - maths: "Mathematics lives in..."   Template selected by overlay_set_id
    observation_prompts:                   Variables filled from snapshot data
      - "What did your child narrate?"     Result: rendered string, no LLM
      - "What caught their attention
         in nature today?"
    gap_nudge_templates:
      - "{area} through living books?"
    engagement_vocabulary:
      - positive: ["delighted in",
         "was drawn to", "showed wonder"]
      - neutral: ["explored", "engaged
         with", "spent time on"]

  montessori_v1:
    dashboard_headline_templates:
      - "A {adj} week of {theme}"
      - "Independent discovery in {theme}"
    module_why_this_matters:
      - science: "The prepared environment..."
      - maths: "Concrete materials reveal..."
    observation_prompts:
      - "What did they choose to work on?"
      - "How long did they concentrate?"
    ...

  unschooling_v1:
    ...

  eclectic_v1:                           Used when philosophy is null
    ...                                  or "eclectic"
```

**Cost: zero tokens. Zero LLM. Pure template logic.**

The overlay sets are authored once by the Hearth content team, stored in Sanity CMS, and selected at runtime by matching the family's `overlay_set_id`. Variables like `{adj}`, `{theme}`, `{area}` are populated from the snapshot's `recent_activity`, `most_active_subjects`, and `gap_analysis` fields.

### 7.2 When Overlays Are Built

Overlay template sets are a content authoring task, not a technical one. They are created in Sanity CMS by the Hearth content team as part of the content creation pipeline. Each supported philosophy needs one overlay set. New philosophies or values require new template authoring, not new code.

**Phase 1 MVP:** A single "eclectic" overlay set that works for all families regardless of philosophy selection. Philosophy-specific language is a Phase 2 enhancement that requires content authoring capacity.

**Phase 2+:** Philosophy-specific overlay sets (Charlotte Mason, Montessori, Waldorf, Classical, Unschooling) authored and tested with real families.

---

## Part 8: Badge Threshold Detection

Badge thresholds are computed during the snapshot rebuild, not by the LLM. The logic is deterministic.

### 8.1 The Algorithm

```python
# Pseudocode — runs during snapshot rebuild

for child in family.children:
    for thread in child.active_threads:
        badge = thread.next_badge_level()
        required_dlos = badge.required_dlos()
        confirmed_dlos = child.confirmed_dlos_for(thread)

        progress = len(confirmed_dlos) / len(required_dlos)

        if progress >= 0.90:
            # Ready — trigger assessment on next relevant log
            child.badge_thresholds.ready.append({
                thread_id: thread.id,
                badge_id: badge.id,
                progress: progress,
                remaining_dlos: required_dlos - confirmed_dlos,
                trigger_on_next_relevant_entry: True
            })
        elif progress >= 0.60:
            # Approaching — informational only
            child.badge_thresholds.approaching.append({
                thread_id: thread.id,
                badge_id: badge.id,
                progress: progress,
                estimated_entries_to_ready: estimate_entries(remaining_dlos)
            })
```

**DLO confirmation** happens in two ways:
1. **Explicit:** Parent confirms a DLO in the Constellation drill-down view (clicking "Yes, I've seen this")
2. **Implicit:** The LLM pipeline maps a learning entry to a DLO with high confidence (≥0.8), and the parent doesn't reject the mapping. After 3+ implicit mappings to the same DLO across separate entries, the DLO is auto-confirmed with a "suggested" flag.

**The LLM's role in badge detection is indirect:** It maps entries to capability threads and DLOs at write-time. The badge threshold calculation itself is pure arithmetic on the resulting data.

---

## Part 9: Recommendation Engine

### 9.1 The Scoring Algorithm

Recommendations are computed during the snapshot rebuild by scoring every module in My Library against multiple signals:

```
RECOMMENDATION SCORE = weighted sum of:
═══════════════════

  0.30 × spark_match
       How many of the child's current sparks (from Learner Profile)
       match this module's subject/theme tags?
       Score: 0.0 (no match) → 1.0 (multiple spark matches)

  0.25 × gap_fill
       Does this module address a curriculum gap identified
       in gap_analysis?
       Score: 0.0 (no gap addressed) → 1.0 (addresses priority gap)

  0.20 × freshness
       How recently was this module added or last completed?
       Never-run modules score highest.
       Score: 0.0 (completed yesterday) → 1.0 (never run)

  0.15 × energy_match
       Does this module's energy profile (active, calm, creative, outdoor)
       match the family's usage patterns for the current time of day?
       Score: 0.0 (mismatch) → 1.0 (strong match)

  0.10 × repeat_value
       For previously completed modules: has enough time passed
       and has the child grown enough to benefit from a repeat?
       Score: 0.0 (too soon) → 1.0 (good time to repeat)
```

**All inputs are pre-computed.** Spark data comes from Learner Profile. Gap data comes from curriculum_coverage. Freshness comes from library_state. Energy patterns come from recent_activity. No LLM is involved.

### 9.2 Planner Suggestions

Weekly Planner suggestions use the same recommendation scores but add scheduling constraints:

- Which subjects are already planned for the week?
- Which days have open time?
- Subject balance targets (from pedagogy profile — a Charlotte Mason family values nature study; an academically focused family values literacy/numeracy coverage)
- Energy distribution (don't suggest 3 high-energy modules on the same day)

This is a constraint satisfaction problem solved with straightforward scoring heuristics, not AI inference.

---

## Part 10: Implementation Roadmap

### Phase 1 MVP (10–20 families)

**Ship:**
1. **Keyword matcher for Logger live panel.** Client-side, no backend needed. Subject keyword lists and capability thread keyword lists curated manually. Gives immediate responsiveness.
2. **LLM pipeline for entry enrichment.** Single API call to Haiku on entry save. Structured JSON output parsed and stored. Capability thread and curriculum descriptor mappings marked as "suggested."
3. **Snapshot rebuild worker.** Async PostgreSQL job triggered by entry save. Computes all per-child and family-wide fields. Simple — no complex optimisation needed at this scale.
4. **Eclectic overlay templates.** One overlay set that works for all families. Philosophy-specific language deferred.

**Defer:**
- Sonnet fallback retry (Haiku confidence is sufficient at this scale)
- Energy matching in recommendations (insufficient usage data)
- Repeat module scoring (insufficient completion data)
- Planner subject balance (requires more than a few weeks of data)
- Philosophy-specific overlay authoring

### Phase 2 (50–100 families)

**Add:**
- Sonnet fallback for low-confidence Haiku results
- Philosophy-specific overlay template sets (content authoring task)
- Energy matching based on accumulated usage patterns
- Planner smart suggestions with subject balance
- Recommendation refinement based on completion feedback (did the family enjoy this module?)

### Phase 3+ (500+ families)

**Add:**
- Cross-family anonymised insights ("Families like yours often enjoy...")
- Fine-tuned classification model replacing generic Haiku for entry enrichment (trained on accumulated structured entries)
- Predictive gap analysis (anticipating HEU compliance issues before they become urgent)
- Real-time overlay A/B testing (which template phrasing resonates with which family profiles)

---

## Part 11: Technical Specifications

### 11.1 New Database Tables

```sql
-- The core intelligence artifact
CREATE TABLE family_intelligence_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) NOT NULL,
  snapshot_version INTEGER NOT NULL DEFAULT 1,
  snapshot_data JSONB NOT NULL,        -- The full snapshot JSON
  rebuilt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rebuild_trigger VARCHAR(50) NOT NULL, -- entry_saved, library_change, etc.
  rebuild_duration_ms INTEGER,          -- Performance tracking
  UNIQUE(family_id)                     -- One snapshot per family, overwritten
);

CREATE INDEX idx_fis_family ON family_intelligence_snapshots(family_id);

-- LLM call audit log (for cost tracking and debugging)
CREATE TABLE ai_pipeline_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) NOT NULL,
  entry_id UUID REFERENCES learning_entries(id),
  model_used VARCHAR(50) NOT NULL,      -- haiku, sonnet
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL,
  confidence DECIMAL(3,2),              -- Model self-reported confidence
  retry_triggered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_apl_family ON ai_pipeline_logs(family_id);
CREATE INDEX idx_apl_created ON ai_pipeline_logs(created_at);

-- Enrichment fields added to existing learning_entries table
ALTER TABLE learning_entries ADD COLUMN enrichment JSONB;
-- Contains: subjects_detected, capability_suggestions,
--   curriculum_descriptors, per_child_signals,
--   insight_suggestions, confidence, enrichment_status
-- enrichment_status: 'pending' | 'enriched' | 'failed' | 'retry_queued'
```

### 11.2 API Endpoints

```
POST   /api/entries/:id/enrich         Trigger LLM pipeline for an entry
       (called internally on entry save — not a public endpoint)
       Returns: enriched entry JSON

GET    /api/families/:id/snapshot       Read the family intelligence snapshot
       Query: ?fields=recommendations,dashboard_summary
       (supports partial field selection to reduce payload)

POST   /api/families/:id/snapshot/rebuild   Trigger snapshot rebuild
       (called internally by worker — not a public endpoint)

GET    /api/families/:id/ai-cost        Cost tracking dashboard
       Returns: token usage this month, cost estimate, call count
```

### 11.3 Keyword Matcher Specification

The client-side keyword matcher for the Logger live panel:

```javascript
// Loaded once when Logger screen opens
// Total payload: ~15KB compressed

const SUBJECT_KEYWORDS = {
  "Mathematics": ["count", "number", "add", "subtract", "measure", "shape",
    "pattern", "graph", "fraction", "multiply", "divide", "group",
    "tens", "ones", "place value", "estimate", "compare", ...],
  "English": ["read", "write", "story", "book", "letter", "word",
    "sentence", "poem", "author", "narrate", "spell", "grammar", ...],
  "Science": ["observe", "experiment", "predict", "test", "grow",
    "animal", "plant", "weather", "lifecycle", "habitat", "force", ...],
  // ... 8 learning areas, ~25 keywords each
};

const THREAD_KEYWORDS = {
  "M1": ["counting", "place value", "tens", "ones", "groups"],
  "M2": ["pattern", "sequence", "rule", "algebra", "equal"],
  "S1": ["question", "predict", "observe", "test", "conclude"],
  "S2": ["living", "animal", "plant", "habitat", "lifecycle"],
  // ... 57 threads, ~5 keywords each
};

const ENGAGEMENT_VOCABULARY = {
  positive: ["loved", "fascinated", "absorbed", "excited", "delighted",
    "curious", "engaged", "focused", "enthusiastic", "passionate"],
  neutral: ["explored", "tried", "worked on", "practised", "spent time"],
  challenging: ["struggled", "frustrated", "confused", "difficult",
    "bored", "resistant", "reluctant"]
};

// Match function — runs on 1.5s debounce after typing pauses
function matchKeywords(text) {
  const lower = text.toLowerCase();
  const subjects = [];
  const threads = [];
  let engagement = null;

  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      subjects.push(subject);
    }
  }

  for (const [threadId, keywords] of Object.entries(THREAD_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      threads.push(threadId);
    }
  }

  for (const [level, words] of Object.entries(ENGAGEMENT_VOCABULARY)) {
    if (words.some(w => lower.includes(w))) {
      engagement = level;
      break; // Take first match priority
    }
  }

  return { subjects, threads, engagement };
}
```

---

## Part 12: Failure Modes and Graceful Degradation

### 12.1 What Happens When the LLM Fails

```
FAILURE SCENARIO                 BEHAVIOUR                              USER IMPACT
════════════════                 ═════════                              ═══════════

LLM API timeout                  Entry saves with enrichment_status:    Parent sees entry saved
(>5 seconds)                     "pending". Retry queued as async job.  without AI suggestions.
                                 Logger shows: "We'll add insights      Insights appear later
                                 shortly — your entry is saved."        on next visit.

LLM returns invalid JSON         Retry once immediately with same       Same as timeout — entry
                                 prompt. If second failure, save        saves, insights deferred.
                                 without enrichment.

LLM confidence < 0.5             Entry saves with Haiku results.        Parent sees lower-
(low quality output)             Sonnet retry queued (async).           confidence suggestions
                                 If Sonnet succeeds, replaces           that may improve later.
                                 Haiku mappings silently.

LLM returns hallucinated         Validation stage catches: thread ID    Invalid mappings silently
thread IDs or descriptors        not in taxonomy → mapping dropped.     dropped. Parent sees
                                 Descriptor code not in index →         only valid suggestions.
                                 mapping dropped. Logged for monitoring.

Snapshot rebuild fails           Previous snapshot version remains.     Screens show slightly
                                 Retry queued. Alert if 3+ failures.    stale intelligence.
                                                                        Functionally fine.

Keyword matcher load fails       Logger works without live panel.       No real-time suggestions
                                 Full LLM pipeline still runs on save.  during typing. Save
                                                                        still produces full
                                                                        enrichment.
```

### 12.2 The "Zero AI" Baseline

If the entire AI layer is unavailable, Hearth still functions:

- Parents can log entries (title, description, evidence, engagement — all manual fields)
- Module experiences run normally (content from Sanity CMS, no AI dependency)
- Portfolio shows entries chronologically (no thread organisation)
- HEU Report shows manual curriculum descriptor counts (if parent tagged manually)
- Capabilities Constellation shows manually confirmed DLOs
- Dashboard shows activity counts without generated messaging

The AI layer enriches the experience but doesn't gate it. A family can use Hearth with zero intelligence and still maintain a useful learning record.

---

## Appendix A: Glossary of Intelligence Terms

| Term | Definition |
|------|-----------|
| **Enrichment** | The process of adding structured fields (subjects, threads, descriptors) to a raw learning entry via the LLM pipeline |
| **Family Intelligence Snapshot** | Pre-computed JSON object containing all intelligence state for a family, rebuilt asynchronously after write events |
| **Keyword matcher** | Client-side JavaScript function that provides real-time subject/thread/engagement suggestions during typing, without LLM calls |
| **Overlay template set** | Pre-authored strings in Sanity CMS that adapt platform language to a family's pedagogical philosophy. Selected by profile match, not generated by AI |
| **Pipeline** | The three-stage process (context assembly → LLM call → validation) that transforms freeform text into structured educational data |
| **Snapshot rebuild** | Async background job that recomputes the Family Intelligence Snapshot after a write event. Targeted updates based on trigger type |
| **Write-time intelligence** | AI operations that run when data enters the system (entry save). The only place LLM calls occur |
| **Read-time intelligence** | Pre-computed data served to screens on load. Zero LLM calls, under 100ms |

## Appendix B: Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| LLM calls only at write-time | All inference happens on entry save, never on screen load | Predictable cost, fast screen loads, no user-facing latency for read operations |
| Haiku as default model | Haiku for all classification, Sonnet only as fallback | Task is structured extraction with constrained taxonomy — ideal for smaller models |
| Keyword matcher over streaming LLM | Client-side keyword matching for live panel, not streaming AI | Zero cost, instant response, sufficient quality for preliminary suggestions |
| Single snapshot per family | One JSON document overwritten on rebuild, not per-screen caches | Simplicity. One source of truth. All screens consistent. Easy to debug |
| Pedagogy overlay as templates | String interpolation from Sanity CMS, not LLM generation | Consistent quality, zero cost, content-team controlled, no hallucination risk |
| Enrichments marked "suggested" | All LLM-generated mappings require implicit or explicit parent confirmation | Maintains parent agency, prevents automation anxiety, aligns with trust-based philosophy |
| Compressed taxonomy in prompt | Thread IDs + keywords only, not full definitions | 25x token reduction in system prompt while maintaining classification accuracy |
| Snapshot staleness tolerance | Screens may show data one write event behind | Acceptable tradeoff for async rebuild speed. Logger handles its own post-save display |

---

*This document resolves Open Question #4 from the System Interaction Map. Update when AI capabilities expand or model strategy changes.*
*Last updated: March 2026*
