<!-- Version: 1 | Date: 2026-03-18 | Changes: Initial pack data architecture spec. Covers document boundaries, manifest, app integration, authoring format, and weight audit. -->

# Hearth Pack Data Architecture

> **Date:** 18 March 2026
> **Status:** Architecture specification — defines how packs are structured, imported, queried, and authored
> **References:** `hearth-hcms-strategy-v1.md`, `hearth-jumpstart-classical-pack-plan-v2.md`, `hearth-module-builder-pathways-architecture-v2.md`, `Hearth_LMS_Content_Creation_Framework.md`, `hearth-decisions-log-v1.md`
> **Decisions incorporated:** N4 (badges in Sanity), N23 (packs fully independent), N24 (pack intro as richText on pack doc), N34 (delivery channel in schema, shelved)

---

## Layer 1 — What Lives in the Pack

### The Hierarchy Revisited

The content hierarchy is Pack → Module → Approach → Activity, with Projects as a parallel type. The question at each level: is it a Sanity document (independently addressable, referenceable, cacheable) or a nested object (embedded in its parent, no independent identity)?

**Decision framework:** A thing is a Sanity document if any of these are true: (a) it needs to be referenced from PostgreSQL, (b) it appears in more than one parent's context, (c) it has its own lifecycle (draft/published), or (d) it needs independent cache invalidation. Otherwise it's an embedded object.

### Document vs Object Boundaries

| Level | Sanity Type | Document or Object | Rationale |
|-------|------------|-------------------|-----------|
| Pack | `pack` | **Document** | Referenced from `family_library`, `purchases`. Has its own marketplace card. Independent cache (1 day TTL). |
| Module | `module` | **Document** | Referenced from `learning_entries.module_id`, `planner_entries`. Appears in Activity Discovery independently. 1 hour TTL. |
| Approach | `approach` | **Document** | Referenced from Module Experience runner to select which approach a family is using. Needs independent identity for pedagogy overlay attachment. |
| Activity | `activity` | **Document** | Referenced from `learning_entries.activity_id`, `planner_entries.activity_id`. The atomic unit the Logger links to. This is the bridge between Sanity content and PostgreSQL transactional data. |
| Understanding Indicators | embedded in `module` | **Object** | Always read in the context of their parent module. No external references. Three tiers (emerging/developing/demonstrating) are properties of the module, not standalone entities. |
| Materials list | embedded in `activity` | **Object** | Always read with the activity. No reason for independent identity. |
| Facilitator guidance | embedded in `activity` | **Object** | Before/during/challenges guidance is a property of the activity, not a separate document. |
| Pack Intro | embedded in `pack` | **Object** (richText field) | Decision N24. No independent lifecycle. Rendered only when viewing the pack detail. Adding a separate document type creates orphan risk and complicates the manifest for zero benefit. |
| Badge Definition | `badge` | **Document** | Referenced from `learner_badges.badge_id`. Shared across modules (a badge can be earnable from multiple modules). Decision N4 confirmed badges in Sanity. |
| Pedagogy Overlay | `pedagogyOverlay` | **Document** | One overlay per activity per pedagogical framework. Queried at runtime by activity ID + family's framework preference. Must be independently cacheable (1 week TTL). |
| Capability Thread | `capabilityThread` | **Document** | Platform reference data (57 threads). Not pack-authored — packs reference existing threads. Imported once, updated rarely. |

### What the Pack Authors vs What Already Exists

A pack author creates new instances of: `pack`, `module`, `approach`, `activity`, `badge`, `pedagogyOverlay`.

A pack author references existing instances of: `capabilityThread`, `pedagogicalFramework`.

A pack author never creates: `capabilityThread` (platform data), `pedagogicalFramework` (platform data), `educator` (account data), `assessment` (deferred to post-MVP).

### The Activity Document — Canonical Schema

The activity is the pack's workhorse. Here's what an activity document actually contains:

```javascript
// Sanity schema: activity
{
  _type: 'activity',
  _id: string,                    // Sanity-generated or pack-assigned

  // Identity
  title: string,                  // "Observe What Lives Under a Rock"
  slug: slug,                     // Auto-generated from title
  summary: text,                  // 1-2 sentence overview shown on activity cards

  // Parent reference
  approach: reference,            // → approach document

  // Layer 1 — Philosophy-neutral content
  instructions: portableText,     // Rich text: the core "what to do"
  facilitatorGuidance: {
    before: text,                 // Setup notes for parent
    during: text,                 // What to watch for, what to say
    challenges: text,             // "If the child isn't engaged, try..."
  },
  materials: [{
    name: string,                 // "Magnifying glass"
    alternative: string,          // "Phone camera zoom" (optional)
    required: boolean,            // true = must-have, false = nice-to-have
  }],

  // Session metadata
  duration: {
    min: number,                  // Minutes
    max: number,
  },
  setting: 'indoor' | 'outdoor' | 'either',
  energyLevel: 'calm' | 'moderate' | 'active',
  modality: string,               // 'kinesthetic' | 'visual' | 'auditory' | 'narrative' | 'social'

  // Observation & assessment hooks
  observationPrompts: [string],   // "Watch for whether they notice..." (Layer 1, not philosophy-specific)
  reflectionPrompts: [string],    // Post-activity questions for family discussion

  // Curriculum connection (references to existing platform data)
  capabilityThreads: [reference], // → capabilityThread documents
  enabledBadges: [reference],     // → badge documents earnable through this activity

  // Delivery channel (schema present per N34, not rendered in UI)
  deliveryChannel: 'screen' | 'audio' | 'physical' | 'cast' | 'print' | 'journal',

  // Publishing
  status: 'draft' | 'published',
}
```

### What Is NOT in the Pack

These are generated at runtime by the app, never authored in the pack:

| Data | Where It Lives | Why Not in Pack |
|------|---------------|-----------------|
| Family Intelligence Snapshot entries | PostgreSQL | Per-family, AI-generated at write-time |
| Capability thread tier state | PostgreSQL | Per-learner progression data |
| Learning entries (logs) | PostgreSQL | Per-family transactional data |
| Badge awards | PostgreSQL | Per-learner, timestamped |
| HEU coverage calculations | PostgreSQL / computed | Derived from logged entries against pack's capability thread mappings |
| Planner entries | PostgreSQL | Per-family scheduling data |
| Module completion state | PostgreSQL | Per-learner progress tracking |
| AI enrichment text (insights, connections) | PostgreSQL (snapshot) | Generated by Haiku at log-save time |

---

## Layer 2 — The Pack as a Portable Unit

### The Manifest

Every pack carries a manifest — a lightweight descriptor that tells the system what's inside without loading every document. This is the `pack` document itself, enhanced with computed summary fields.

```javascript
// Sanity schema: pack (the manifest IS the pack document)
{
  _type: 'pack',
  _id: string,

  // Identity
  title: string,                      // "Jumpstart Classical"
  slug: slug,
  description: text,                  // Short sell copy (2-3 sentences, shown on Marketplace card)

  // Pack Intro (N24 — embedded richText, not separate doc)
  intro: {
    title: string,                    // "Welcome to Classical Learning"
    body: portableText,               // 400-600 words, gentle friend tone
    keyPoints: [string],              // 3-5 bullet takeaways
    furtherReading: [{                // Optional external resources
      title: string,
      url: url,
    }],
  },

  // Content manifest — what's inside
  modules: [reference],               // Ordered array of → module documents
  badges: [reference],                 // All badge definitions used by this pack
  projects: [reference],               // Parallel project content (if any)

  // Metadata for browse/filter (Marketplace, Activity Discovery)
  ageRange: {
    min: number,                       // 5
    max: number,                       // 7
  },
  subjects: [string],                  // ['english', 'maths', 'science', 'hass', 'hpe']
  termWeeks: number,                   // 10 (how many weeks of content)
  moduleCount: number,                 // 12 (denormalised for card display without resolving refs)
  totalActivities: number,             // ~192 (denormalised estimate for Marketplace card)

  // Worldview declaration
  worldview: string,                   // 'christian-classical' | 'secular' | 'neutral' | ...
  worldviewStatement: text,            // For content production tooling, not displayed to families

  // Commerce
  availability: 'included' | 'premium',
  stripePriceId: string,              // Stripe Price ID for premium packs (AUD, per N10)

  // Creator
  creator: reference,                  // → educator document (or Hearth's own profile)

  // Versioning
  version: string,                     // Semver: "1.0.0"
  publishedAt: datetime,
  updatedAt: datetime,

  // Publishing
  status: 'draft' | 'published' | 'archived',
}
```

### Why the Pack Document Is the Manifest

Separating the manifest from the pack document creates a sync problem — the manifest can drift from reality. By making the pack document carry its own summary metadata (`moduleCount`, `totalActivities`, `subjects`), the Marketplace card can render from a single GROQ query hitting only the `pack` document, no reference resolution needed.

The denormalised count fields (`moduleCount`, `totalActivities`) are set during import and updated if the pack is revised. They're display hints, not source of truth — the actual module array is the truth.

### Versioning Model

Packs use **replace-in-place** versioning, not immutable snapshots. When a pack is updated:

1. The `pack` document's `version` field increments.
2. Individual module/approach/activity documents are updated in Sanity.
3. The `updatedAt` timestamp on the pack advances.
4. Families who already have the pack in their library get the update automatically (Sanity content is always live — there's no "installed version" concept).

This works because Sanity content is read-through-cache. When cache expires, the next read gets the latest version. There is no concept of "the family has v1.0 installed and needs to upgrade to v1.1" — they always see current published content.

**What about in-progress learning?** If a family is mid-way through a module and the pack author changes an activity's instructions, the family sees the new instructions next time they open it. This is acceptable for the same reason a textbook publisher can issue errata — the content improves, and the family benefits. The family's *logs* (PostgreSQL) are unaffected; they record what actually happened, not what the content said at the time.

**What if a module is removed from a pack?** The module document stays in Sanity (content is never deleted, only unpublished). The pack's `modules` array removes the reference. Families who logged against that module still have valid log entries — the `module_id` in PostgreSQL still resolves to a Sanity document. The module just no longer appears in the pack's flow.

### Pack Independence (N23)

Packs are fully independent. No `prerequisitePack` references. No cross-pack module references. Each pack is a self-contained unit. If two packs happen to address similar capability threads, the Constellation handles the overlap at runtime — the content layer doesn't need to know.

---

## Layer 3 — Communication with the App

### What Happens When a Family Adds a Pack

**PostgreSQL writes:**

```sql
-- 1. Library record created
INSERT INTO family_library (
  family_id,
  content_type,    -- 'pack'
  content_id,      -- Sanity pack _id
  source,          -- 'marketplace' | 'onboarding'
  added_at
) VALUES (...);

-- 2. Family Intelligence Snapshot queued for rebuild
INSERT INTO snapshot_rebuild_queue (
  family_id,
  trigger,         -- 'library_addition'
  queued_at
) VALUES (...);
```

**What does NOT happen:** No per-module or per-activity records are created in PostgreSQL. The library record is at the pack level only. Module and activity access is inferred: "Does this family have a library record for a pack that contains this module?" This avoids an explosion of rows when a pack has 192 activities.

### The Query Path — Rendering a Module

When a family opens a module from a pack in their library:

```
1. App checks: Does family_library contain a record where content_id matches
   any pack that references this module?
   → Single PostgreSQL query with a Sanity pack._id join

2. App fetches module from Sanity (cached, 1 hour TTL):
   GROQ: *[_type == 'module' && _id == $moduleId][0]{
     ...,
     approaches[]->{ ..., activities[]->{ ... } }
   }
   → Full module tree in one query (Sanity handles reference expansion)

3. App fetches pedagogy overlay for the family's framework:
   GROQ: *[_type == 'pedagogyOverlay'
     && activity._ref in $activityIds
     && framework._ref == $familyFrameworkId
   ]
   → Batch fetch all overlays for all activities in the module

4. App reads family's pedagogy profile from PostgreSQL:
   SELECT pedagogy_framework_id, pedagogy_preferences
   FROM families WHERE id = $familyId

5. Frontend merges: Layer 1 (activity content) + Layer 3 (matching overlay)
   → Rendered Module Experience
```

**Key efficiency point:** Step 2 is a single GROQ query that resolves the full module → approaches → activities tree. Sanity's reference expansion (`->`) handles the joins server-side. With 1-hour cache TTL, this query hits Sanity's CDN for the vast majority of reads.

### How Pedagogy Overlays Attach

Overlays are per-activity, per-framework. The overlay doesn't "attach" to the pack — it attaches to individual activities. This means:

- A pack with 192 activities and 5 pedagogical frameworks = up to 960 overlay documents.
- But most families only need overlays for their one chosen framework.
- The runtime query filters by `framework._ref == $familyFrameworkId`, returning only the relevant overlays.
- Overlays cache for 1 week (they rarely change).

If a family changes their pedagogical framework (an intentional, costly action per existing design), the next module render fetches overlays for the new framework. No data migration needed — it's just a different Sanity query filter.

### Pack Update Handling

When a pack is updated after a family has started using it:

| Scenario | What Happens | Family Impact |
|----------|-------------|---------------|
| Activity instructions edited | Sanity doc updated, cache expires within TTL | Family sees new instructions on next open. No notification. |
| New activity added to an approach | Approach's activity array gains a reference | Activity appears in the module flow. Existing logs unaffected. |
| Activity removed from an approach | Reference removed from approach array. Activity doc stays (unpublished). | Activity no longer appears in module flow. Existing logs still reference the activity doc (valid). |
| New module added to pack | Pack's module array gains a reference | Module appears in pack. Family can start it. |
| Module removed from pack | Reference removed from pack array. Module doc stays. | Module no longer appears in pack flow. Existing logs and completion records intact. |
| Badge criteria changed | Badge doc updated | Existing awards unaffected (awarded badges are records of what happened). Future assessments use new criteria. |
| Understanding indicators revised | Module doc updated | Constellation/portfolio read new indicators. Existing DLO observations reference old text — acceptable. |

**No "update notification" for content changes.** The content just gets better. The family doesn't need to know about errata. If a structural change is significant (new module added), the notification system can surface it as a nudge: "Jumpstart Classical has a new module — Seasonal Rhythms."

---

## Layer 4 — Orchestrator Ergonomics

### The Authoring Format

Whether hand-crafted by Drew or generated by MiniMax Agent, the pack enters the system as a **Pack JSON Package** — a folder of JSON files that map 1:1 to Sanity document types.

```
jumpstart-classical/
├── manifest.json              # Pack metadata + import instructions
├── pack.json                  # The pack document (1 file)
├── modules/
│   ├── a1-listening.json      # Module A1
│   ├── a2-copywork.json       # Module A2
│   └── ...                    # (12 files for Jumpstart Classical)
├── approaches/
│   ├── a1-read-aloud.json     # Approach for A1
│   ├── a1-narration.json
│   └── ...                    # (~48 files)
├── activities/
│   ├── a1-ra-aesop-fox.json   # Activity: Aesop's Fox & Grapes read-aloud
│   ├── a1-ra-joseph.json      # Activity: Joseph narrative
│   └── ...                    # (~192 files)
├── overlays/
│   ├── cm/                    # Charlotte Mason overlays
│   │   ├── a1-ra-aesop-fox.json
│   │   └── ...
│   ├── montessori/
│   │   └── ...
│   └── unschooling/
│       └── ...                # (~576 files total across frameworks)
├── badges/
│   ├── story-listener.json
│   ├── story-keeper.json
│   └── ...                    # (~14 files)
└── README.md                  # Human-readable pack summary
```

### The Manifest File

`manifest.json` is the orchestrator's control file. It tells the import pipeline what's in the package and how to wire it together.

```json
{
  "$schema": "hearth-pack-manifest/1.0",
  "pack": {
    "title": "Jumpstart Classical",
    "version": "1.0.0",
    "worldview": "christian-classical",
    "ageRange": { "min": 5, "max": 7 },
    "subjects": ["english", "maths", "science", "hass", "hpe"],
    "termWeeks": 10,
    "availability": "included",
    "creator": "hearth-team"
  },
  "counts": {
    "modules": 12,
    "approaches": 48,
    "activities": 192,
    "overlays": 576,
    "badges": 14
  },
  "frameworks": ["charlotte-mason", "montessori", "unschooling"],
  "capabilityThreadRefs": [
    "L1", "L2", "L3", "L4", "L5", "L9",
    "M1", "M4", "M5", "M6",
    "S2", "S5",
    "H1", "H3",
    "C1", "C3", "C4", "C5",
    "EF1", "EF3"
  ],
  "importOrder": [
    "badges",
    "activities",
    "approaches",
    "modules",
    "overlays",
    "pack"
  ]
}
```

### Why This Import Order

References flow upward: activities reference badges. Approaches reference activities. Modules reference approaches. The pack references modules. Overlays reference activities and frameworks. So the import creates leaf documents first, then parents, then the pack document that ties everything together.

The `overlays` step comes after `pack` in the list but could also run in parallel with modules — they reference activities (already created) and frameworks (already exist in the platform). The order is a guideline for sequential importers; a parallel importer can use the dependency graph.

### Internal ID Convention

Each JSON file uses a deterministic `_id` based on the pack slug and the document's position in the hierarchy:

```
pack:         pack.jumpstart-classical
module:       module.jumpstart-classical.a1-listening
approach:     approach.jumpstart-classical.a1-listening.read-aloud
activity:     activity.jumpstart-classical.a1-ra-aesop-fox
overlay:      overlay.jumpstart-classical.a1-ra-aesop-fox.charlotte-mason
badge:        badge.jumpstart-classical.story-listener
```

This convention means: references between documents within the pack are predictable (the import script doesn't need a separate ID mapping file). The `references.json` file from the original import contract is eliminated — the IDs are the mapping.

### What an Activity JSON File Looks Like

```json
{
  "_type": "activity",
  "_id": "activity.jumpstart-classical.a1-ra-aesop-fox",
  "title": "The Fox and the Grapes",
  "slug": { "current": "the-fox-and-the-grapes" },
  "approach": { "_ref": "approach.jumpstart-classical.a1-listening.read-aloud" },
  "instructions": [
    {
      "_type": "block",
      "style": "normal",
      "children": [
        { "_type": "span", "text": "Read the fable aloud slowly, with expression..." }
      ]
    }
  ],
  "facilitatorGuidance": {
    "before": "Find a comfortable reading spot. Have the child settle in.",
    "during": "Pause after the fox gives up. Ask: 'What do you think he's feeling?'",
    "challenges": "If the child doesn't want to narrate, try drawing what happened instead."
  },
  "materials": [
    { "name": "Aesop's Fables (any edition)", "required": true },
    { "name": "Drawing paper and crayons", "alternative": "Blank notebook", "required": false }
  ],
  "duration": { "min": 10, "max": 20 },
  "setting": "indoor",
  "energyLevel": "calm",
  "modality": "narrative",
  "observationPrompts": [
    "Can they retell the main events in order?",
    "Do they identify the fox's mistake — wanting something then pretending he didn't?"
  ],
  "reflectionPrompts": [
    "Have you ever said something wasn't good just because you couldn't have it?"
  ],
  "capabilityThreads": [
    { "_ref": "capabilityThread.L1" },
    { "_ref": "capabilityThread.L3" },
    { "_ref": "capabilityThread.L9" }
  ],
  "enabledBadges": [
    { "_ref": "badge.jumpstart-classical.story-listener" }
  ],
  "deliveryChannel": "screen",
  "status": "published"
}
```

### What a Pedagogy Overlay JSON File Looks Like

```json
{
  "_type": "pedagogyOverlay",
  "_id": "overlay.jumpstart-classical.a1-ra-aesop-fox.charlotte-mason",
  "activity": { "_ref": "activity.jumpstart-classical.a1-ra-aesop-fox" },
  "framework": { "_ref": "pedagogicalFramework.charlotte-mason" },
  "lens": {
    "insight": "Charlotte Mason believed fables train the moral imagination. This story exercises the child's ability to recognise self-deception — a cornerstone of character formation.",
    "facilitation": "Read the fable once through without interruption (Mason's 'single reading' principle). Then ask for a full narration. Resist the urge to correct — let the child's narration reveal their understanding.",
    "observation": "In narration, listen for whether the child captures the fox's shift in attitude. Mason called this 'moral discernment' — recognising vice in a character before being able to name it.",
    "nextSteps": "Follow with copywork of the moral ('It is easy to despise what you cannot get') for Module A2. The fable and the copywork reinforce each other."
  },
  "valuesAlignment": "Living books and oral narration are central to Mason's method. This activity is pure Mason territory.",
  "practiceSuggestions": "Keep to a single reading. Narration first, discussion second. Mason's sequence matters — the child processes before the parent probes.",
  "status": "published"
}
```

### What the AI Agent Needs to Produce vs What the Import Pipeline Handles

| Responsibility | Agent produces | Import pipeline handles |
|---------------|---------------|------------------------|
| Document content | All field values per the JSON schema | — |
| `_id` values | Deterministic IDs per the convention above | Validates uniqueness, no collisions |
| `_ref` values | Correct references using the ID convention | Validates all refs resolve to existing docs |
| Portable Text | Valid Portable Text block arrays for `instructions` fields | — |
| `slug` generation | `{ "current": "kebab-case-title" }` | Validates uniqueness within type |
| Sanity asset uploads | NOT produced by agent (no images in v1 pack content) | Future: image pipeline for activity photos |
| `_createdAt`, `_updatedAt` | NOT produced by agent | Sanity sets these automatically on import |
| `_rev` | NOT produced by agent | Sanity manages revisions |

### The Import Script Contract

The import script (Claude Code or manual) does this:

1. Reads `manifest.json` to understand the package.
2. Validates: every `_ref` in every JSON file resolves to either (a) another file in the package or (b) an existing Sanity document (capability threads, frameworks).
3. Creates documents in `importOrder` sequence using Sanity's `createOrReplace` mutation (idempotent — re-running the import updates existing docs rather than creating duplicates).
4. Sets the pack document's denormalised counts (`moduleCount`, `totalActivities`) from the actual file count.
5. Reports: documents created, documents updated, validation errors.

```bash
# The import command (future Claude Code task)
npx hearth-import ./jumpstart-classical --dataset production --dry-run
npx hearth-import ./jumpstart-classical --dataset production
```

---

## Layer 5 — Weight Audit

### What's Currently in the Pack

Using Jumpstart Classical as the reference (~845 documents):

| Document Type | Count | Authored Content |
|--------------|-------|-----------------|
| Pack | 1 | Title, description, intro (richText), metadata |
| Module | 12 | Title, target understanding, understanding indicators (3 tiers × ~3 indicators each), capability thread refs, badge refs |
| Approach | ~48 | Title, angle description, modality tag |
| Activity | ~192 | Title, instructions (richText), facilitator guidance (3 fields), materials, duration, setting, energy, modality, observation prompts, reflection prompts, capability thread refs, badge refs |
| Overlay | ~576 | Lens (4 fields: insight, facilitation, observation, nextSteps), values alignment, practice suggestions |
| Badge | ~14 | Title, description, criteria, skills represented, capability thread refs |

### What Can Be Removed — Derived at Runtime

| Candidate for removal | Current location | Can it be derived? | Verdict |
|----------------------|-----------------|-------------------|---------|
| `pack.moduleCount` | Pack doc | Yes — `count(modules)` | **Keep as denormalised hint.** Avoids resolving refs for Marketplace card render. Set by import script, not hand-authored. |
| `pack.totalActivities` | Pack doc | Yes — expensive multi-level count | **Keep as denormalised hint.** Same reasoning. |
| `pack.subjects` | Pack doc | Derivable from modules' capability thread mappings → thread domain classification | **Keep authored.** The derivation path is fragile (requires mapping threads to HEU areas) and the subjects list is a simple editorial decision. 5 strings. |
| `activity.capabilityThreads` | Activity doc | Could be inferred by AI from instructions at import time | **Keep authored.** Thread mapping is an editorial judgement call. AI can suggest, human confirms. The thread mapping IS the educational value of the pack — removing it gutts the pack's contribution to HEU reporting and Constellation. |
| `activity.observationPrompts` | Activity doc | Could be AI-generated from target understanding + instructions | **Keep authored.** Observation prompts are high-value facilitation content. AI-generated prompts are generic. Hand-crafted prompts reflect domain expertise. For agent-generated packs, the agent writes them from the module brief — they're still "authored," just by an AI following a detailed brief. |
| `activity.reflectionPrompts` | Activity doc | Same as above | **Keep authored.** Same reasoning. |
| `approach.angle` | Approach doc | Could be derived from its activities' modalities | **Keep authored.** The angle is a pedagogical framing decision ("Explore fractions through cooking"), not a mechanical derivation. 1-2 sentences per approach. |
| `module.indicators` | Module doc (embedded) | Could be AI-generated from target understanding | **Arguably derivable, but keep authored.** Indicators define what "emerging/developing/demonstrating" looks like for THIS specific understanding. They drive badge assessment, Constellation tier classification, and HEU evidence quality. AI can draft them, but they need editorial review — they're the module's assessment backbone. |
| `overlay.lens.insight` | Overlay doc | Could be AI-generated from activity + framework definition | **Candidate for runtime generation — but keep pre-authored for v1.** Pre-authored overlays are zero-cost at read time, consistent, and hallucination-free. Runtime AI generation would require an LLM call per overlay per render, which violates the "AI at write-time only" principle (A9). |
| `overlay.valuesAlignment` | Overlay doc | Same as above | **Same verdict.** |
| `overlay.practiceSuggestions` | Overlay doc | Same as above | **Same verdict.** |

### The Overlays Question

Overlays are the single largest contributor to document count — ~576 of ~845 documents (68%) in Jumpstart Classical. For a pack with 5 pedagogical frameworks instead of 3, that's 960 overlay documents.

**Could overlays be generated at write-time instead of pre-authored?**

Technically yes — when the import script creates activities, it could call Haiku to generate overlays for each activity × framework combination. This would remove overlays from the authoring surface entirely. The agent would produce ~269 documents (pack + modules + approaches + activities + badges) instead of ~845.

**Arguments for keeping overlays pre-authored:**
- Zero runtime AI cost (principle A9 — no LLM on screen load)
- Consistent quality (same overlay every time, no variance between renders)
- Opus/human review possible before publish (quality gate in production pipeline)
- Overlays are cached for 1 week — the "pre-authored" cost is amortised across all families

**Arguments for generating overlays at import time:**
- 68% reduction in authored content volume
- Faster pack production (agent only writes Layer 1 content)
- Framework additions don't require re-authoring existing packs (add a new framework → regenerate all overlays)

**Recommendation:** Keep overlays pre-authored for the first 5 hand-crafted packs. Move to import-time generation (Haiku call during import, with Opus spot-check) for Phase 2 agent-produced packs. The authoring format supports both — the `overlays/` folder is populated either way; the question is whether a human wrote the files or a pipeline generated them.

### The Thinnest Possible Pack

After the weight audit, here's what absolutely must be authored:

| Must author | Why it can't be derived |
|------------|------------------------|
| Pack metadata (title, description, intro, age range, subjects, worldview) | Editorial decisions |
| Module target understanding statements | The entire educational thesis of the module |
| Module understanding indicators (3 tiers) | Assessment backbone — defines what progress looks like |
| Approach titles and angle descriptions | Pedagogical framing decisions |
| Activity instructions (Layer 1 content) | The actual learning experience |
| Activity facilitator guidance (before/during/challenges) | Domain expertise for parents |
| Activity materials lists | Practical requirements |
| Activity observation prompts | Facilitation quality depends on these |
| Activity capability thread mappings | Educational alignment — the HEU/Constellation link |
| Badge definitions with criteria | Milestone structure |
| Pedagogy overlays (or overlay generation prompts) | Layer 3 delivery |

**What can be automated/derived:**
- `_id` values (deterministic from convention)
- `slug` values (from titles)
- `pack.moduleCount` and `pack.totalActivities` (from file count)
- `activity.slug` (from title)
- Session metadata (duration, setting, energy, modality) could be AI-suggested from instructions but should be human-confirmed

### Minimum Viable Activity

The thinnest valid activity document has these required fields:

```json
{
  "_type": "activity",
  "_id": "activity.{pack-slug}.{activity-slug}",
  "title": "string (required)",
  "approach": { "_ref": "approach.{pack-slug}.{...}" },
  "instructions": [{ "_type": "block", "children": [{ "_type": "span", "text": "..." }] }],
  "duration": { "min": 5, "max": 30 },
  "setting": "either",
  "modality": "narrative",
  "capabilityThreads": [{ "_ref": "capabilityThread.L1" }],
  "status": "published"
}
```

Everything else — facilitator guidance, materials, observation prompts, reflection prompts, energy level, badges — is valuable but not structurally required. A pack could ship with bare-minimum activities and be enhanced over time. The import script should validate required fields and warn on missing optional fields without blocking import.

---

## Summary — Decision Record

| # | Decision | Rationale |
|---|----------|-----------|
| PDA1 | Every level in the hierarchy (pack, module, approach, activity) is a Sanity document | All are referenced from PostgreSQL or need independent cache/lifecycle |
| PDA2 | Understanding indicators are embedded objects in the module document | No external references, always read with parent |
| PDA3 | Pack Intro is a richText field on the pack document (confirms N24) | No independent lifecycle, no orphan risk |
| PDA4 | Pack manifest is the pack document itself, with denormalised count fields | Avoids manifest-reality drift |
| PDA5 | Replace-in-place versioning (no immutable snapshots) | Sanity is read-through-cache; families always see latest content |
| PDA6 | `family_library` records at pack level only; module/activity access inferred | Avoids row explosion (1 row per pack, not 192 rows per pack) |
| PDA7 | Deterministic `_id` convention eliminates `references.json` | IDs are the mapping; import is simpler and idempotent |
| PDA8 | Import uses `createOrReplace` (idempotent) | Re-running import updates rather than duplicates |
| PDA9 | Overlays pre-authored for hand-crafted packs; import-time generated for agent packs | Balances quality control with production velocity |
| PDA10 | Capability thread mappings always human-authored (or human-confirmed) | Thread mapping is the pack's educational value; can't be fully automated |
| PDA11 | Agent produces complete JSON files; import pipeline validates and uploads | Clean separation: content production ≠ Sanity operations |

---

## Related Documents

| Document | Relationship |
|----------|-------------|
| `hearth-hcms-strategy-v1.md` | Parent architecture — document types, GROQ patterns, three-layer model |
| `hearth-jumpstart-classical-pack-plan-v2.md` | First pack using this architecture — production plan, module list |
| `hearth-module-builder-pathways-architecture-v2.md` | Parent-created modules (different authoring surface, same module schema) |
| `hearth-marketplace-spec-v1.md` | Downstream — how packs appear in browse/purchase flows |
| `hearth-claude-code-transition-plan-v1.md` | Phase 4 — Sanity schema creation and first content import |
| `hearth-decisions-log-v1.md` | N4, N23, N24, N34 and other governing decisions |

---

## COMPONENT_REGISTRY.md Update

Add to documentation section:

```
| Pack Data Architecture | hearth-pack-data-architecture-v1.md | Pack structure, manifest, import format, authoring contract, weight audit |
```

---

*This specification defines the data architecture for Hearth content packs. Update when overlay generation strategy is finalised, when the import script is built, or when the first pack import reveals schema gaps.*
