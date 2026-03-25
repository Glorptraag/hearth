<!-- Version: 1 | Date: 2026-03-09 | Changes: Initial creation. Supersedes 03_CMS_Usage_Mapping.md, 04_Quick_Reference_Guide.md, and 05_Visual_Architecture_Guide.md with matured Hearth architecture. -->

# Hearth h-CMS Strategy — Sanity Content Architecture & Data Boundary

> **Status:** Active reference document
> **Supersedes:** `03_CMS_Usage_Mapping.md`, `04_Quick_Reference_Guide.md`, `05_Visual_Architecture_Guide.md`
> **Read alongside:** `Hearth_AI_Intelligence_Layer_Architecture.md`, `Hearth_System_Interaction_Map.md`, `hearth-pedagogy-integration-framework.md`, `module-builder-implementation-brief.md`
> **Last updated:** March 2026

---

## Why Headless CMS — And Why It Matters for Hearth

Hearth is a learning management system that serves two fundamentally different kinds of data. On one side there's **content** — learning activities, module structures, badge definitions, pedagogical overlay templates, and the entire curriculum hierarchy that educational designers author once and thousands of families consume. On the other side there's **life** — the messy, personal, timestamped record of what Emma did on Tuesday morning, which badges Liam earned this term, how a family's engagement has shifted over the past six weeks. These two kinds of data have completely different characteristics, and jamming them into a single system produces a worse version of both.

A headless CMS (h-CMS) separates the editorial content layer from the application layer. Sanity handles the "what families can learn" — the structured, reusable, editable content that needs rich text, media hosting, relational hierarchies, and real-time collaborative editing in Sanity Studio. PostgreSQL handles the "what families actually did" — transactional records, user accounts, AI enrichments, and the Family Intelligence Snapshot that powers every screen.

This separation gives Hearth three concrete advantages that compound as the platform scales:

**Content is authored once, consumed many ways.** The same module content renders in Activity Discovery, Module Experience, Weekly Planner, HEU Report, and (eventually) the student-facing device — all without duplicating data. When an educational designer improves an activity's instructions in Sanity Studio, every family sees the update on their next screen load. No migration, no per-family patching.

**Philosophy stays out of the content.** Hearth's three-layer content model depends on content being philosophy-neutral at its core (Layer 1), structured into Hearth's learning journey format (Layer 2), and interpreted through a family's chosen pedagogical lens at runtime (Layer 3). Sanity stores Layers 1 and 2 as stable documents plus Layer 3 as overlay template sets. The frontend reads the family's profile from PostgreSQL, selects the matching overlay template from Sanity, and renders the philosophy-specific experience without any Layer 1 content being aware of which philosophy is active. This architecture breaks if content and user state live in the same system, because the temptation to embed philosophy-specific logic into content records becomes irresistible.

**Scaling content production is a CMS problem, not an app problem.** When Hearth moves from hand-crafted packs to MiniMax Agent-generated content at scale, the entire output is structured JSON that imports directly into Sanity. The application database doesn't know or care how many modules exist — it just tracks which ones a family has access to and what they've done with them. This means content production can accelerate independently of application development.

---

## The Governing Principle — One Question Per Record

Every piece of data in Hearth answers exactly one of these two questions:

**"What can a family learn?"** → Sanity.
This is reusable content. Multiple families read it. Educators edit it. It has rich text, media, hierarchical relationships. It changes slowly and deliberately through editorial workflows.

**"What did this family do?"** → PostgreSQL.
This is transactional state. One family owns it. The system writes it. It has timestamps, user IDs, AI enrichments. It changes frequently through user actions and background jobs.

When a record answers both questions, split it. The template goes to Sanity, the instance goes to PostgreSQL, and a string reference (the Sanity document `_id`) bridges them. This is the core pattern that repeats across every feature in Hearth.

---

## Hearth's Content Hierarchy in Sanity

Hearth's content model uses a specific hierarchy that differs from generic LMS terminology. Every Sanity document type maps to a level in this hierarchy:

```
PACK (purchasable unit — 2+ weeks of content)
│
├── MODULE (learning journey — one target understanding)
│   ├── Target understanding statement
│   ├── Understanding indicators (Emerging / Developing / Demonstrating)
│   ├── 4–6 Approaches (doors into understanding)
│   │   └── APPROACH (themed angle into the same concept)
│   │       ├── Modality (kinesthetic, visual, narrative, etc.)
│   │       └── ACTIVITY (flexible session, 5–45 minutes)
│   │           ├── Core instructions (Layer 1 — philosophy-neutral)
│   │           ├── Facilitator guidance (before / during / challenges)
│   │           ├── Materials list
│   │           └── Pedagogy overlays (Layer 3 — applied at runtime)
│   └── Badge connections
│
└── PROJECT (sequential multi-stage build — parallel content type)
    ├── 6–10 stages with strict ordering
    ├── Artifact dependency chains (each stage's output feeds the next)
    ├── Cross-domain by design (3–5 subjects)
    └── Capstone badge + stage badges
```

### Sanity Document Types — Complete Map

| Document Type | Sanity `_type` | Purpose | Edited By | Cache Duration |
|---|---|---|---|---|
| Pack | `pack` | Purchasable content bundle | Content team | 1 day |
| Module | `module` | Single understanding target with approaches | Content team | 1 hour |
| Approach | `approach` | Themed angle into a module's understanding | Content team | 1 hour |
| Activity | `activity` | Single learning session with instructions | Content team | 1 hour |
| Project | `project` | Multi-stage sequential build | Content team | 1 day |
| Project Stage | `projectStage` | Single stage within a project | Content team | 1 hour |
| Badge Definition | `badge` | Reusable badge with criteria and skills | Content team | 1 day |
| Pedagogy Overlay Set | `pedagogyOverlay` | Philosophy-specific lens templates per activity | Content team | 1 week |
| Pedagogical Framework | `pedagogicalFramework` | Framework definition (CM, Montessori, etc.) | Content team | 1 week |
| Capability Thread | `capabilityThread` | One of 57 curriculum capability threads | Platform team | 1 week |
| Assessment Template | `assessment` | Reusable rubric or assessment structure | Content team | 1 day |
| Educator Profile | `educator` | Public profile for marketplace creators | Educator | 1 day |

### What Sanity Does NOT Store

Sanity never holds records that are per-family, per-child, timestamped, or AI-generated. Specifically: user accounts, family memberships, learning entries (retrospective logs), badge awards, module completion records, assessment submissions, grades, portfolio contents, purchase records, the Family Intelligence Snapshot, AI enrichment data, notification state, planner entries, or HEU report submissions.

---

## PostgreSQL — The Family's Story

PostgreSQL holds everything that makes Hearth personal. The key tables and their relationship to Sanity:

| Table | What It Stores | Sanity Reference |
|---|---|---|
| `families` | Family account, pedagogy profile, HEU details | — |
| `learners` | Per-child profiles within a family | — |
| `learning_entries` | Retrospective log entries (the core data artifact) | `activity_id` or `module_id` (string ref to Sanity `_id`) |
| `learning_entries.ai_enrichment` | JSONB — subjects, threads, descriptors from LLM pipeline | Thread/descriptor IDs map to Sanity capability threads |
| `family_intelligence_snapshots` | Pre-computed JSON — one per family, powers all screens | — |
| `learner_badges` | Badge award records with date and evidence | `badge_id` (string ref to Sanity `_id`) |
| `module_completions` | Family's completion/progress state per module | `module_id` (string ref to Sanity `_id`) |
| `family_library` | Which packs/modules a family has access to | `content_id` (string ref to Sanity `_id`) |
| `planner_entries` | Weekly Planner items (planned and completed) | `activity_id` or `module_id` (string ref) |
| `purchases` | Transaction records for marketplace content | `content_id` (string ref to Sanity `_id`) |
| `assessment_submissions` | Per-child assessment responses and grades | `assessment_id` (string ref to Sanity `_id`) |
| `portfolio_items` | Curated evidence items per child | May ref Sanity assets |
| `ai_pipeline_logs` | LLM call audit trail (cost tracking, debugging) | — |
| `notification_state` | Per-family notification queue and read state | — |

The bridge pattern is always the same: PostgreSQL stores a string column containing a Sanity document `_id`. The application fetches the Sanity document when it needs the content (title, instructions, criteria), and reads the PostgreSQL record when it needs the state (when, who, how well, AI analysis).

---

## The Three-Layer Content Model in Practice

Understanding how Layers 1–3 map to Sanity and PostgreSQL is essential for anyone creating content, building screens, or writing queries.

**Layer 1 — Philosophy-Neutral Content (Sanity)**
The activity instructions, module structure, approach definitions, materials lists, and understanding indicators. Authored once by the content team. Contains no philosophy-specific language. Example: "Find a damp area with rocks. Carefully lift a rock and observe what lives beneath." Stored as Sanity documents of type `activity`, `module`, `approach`.

**Layer 2 — Hearth Learning Journey Structure (Sanity)**
The relationships between documents: which approaches belong to which module, which modules form a pack, how understanding indicators tier from Emerging to Demonstrating, which capability threads a module addresses, which badges connect to which evidence criteria. This is Hearth's unique structure layer. Stored as Sanity references and embedded objects within the document types above.

**Layer 3 — Pedagogical Overlays (Sanity + PostgreSQL at runtime)**
Pre-authored overlay template sets stored in Sanity as `pedagogyOverlay` documents. Each set contains philosophy-specific lenses (insight, facilitation, observation, next steps), values alignments, and practice suggestions for a given activity or module. At runtime, the frontend reads the family's `pedagogy_profile` from PostgreSQL, queries Sanity for the matching overlay set, and renders the philosophy-framed experience. This is string interpolation, not AI generation — consistent quality, zero cost, no hallucination.

**Critical rule:** Layer 3 overlays change how content is *facilitated*, never what the content *is*. A Charlotte Mason family and a Montessori family see the same Layer 1 activity. They receive different facilitator guidance, observation prompts, and values connections. The content stays neutral; the lens shifts.

**Exception — worldview packs:** Individual packs can carry a worldview (e.g., Jumpstart Classical is explicitly Christian classical). In these cases, Layer 1 content reflects that worldview, and Layer 3 overlays adjust *teaching method* only, not content perspective. The platform engine is neutral; the fuel is not.

---

## Content Production Pipeline — From Hand-Crafted to Scaled

### Phase 1: Hand-Crafted (Now — First 5 Packs)

Content is authored manually by the team, using Hearth's 7-stage creation pipeline:

1. Define Understanding → 2. Design Approaches (modality matrix) → 3. Create Activities (Layer 1) → 4. Write Understanding Indicators → **Gate 1: Philosophy-Neutral Review** → 5. Write Philosophy Lenses → 6. Write Values & Practice Alignments → **Gates 2–3: Quality Review** → 7. Final Assembly & QA

Output is structured JSON matching Sanity schemas, imported into Sanity Studio or via the Sanity API.

### Phase 2: Agent-Assisted (Scaling — 50+ Packs)

The MiniMax Agent (agent.minimax.io) automates bulk content generation using prompt engineering spec v3. The pipeline:

1. **Opus** authors the pack plan — module briefs, worldview statement, cross-module coherence
2. **Opus** writes prompt templates with few-shot exemplars from hand-crafted packs
3. **Haiku/Sonnet coworkers** generate activity content, Layer 1 instructions, and Layer 3 lenses at scale (~200 Sanity documents per pack output)
4. **Opus** reviews 10% sample per phase for quality and drift detection
5. **Claude Code** handles Sanity import — structured JSON → Sanity document creation with reference linking

Each delegated phase uses a standardised prompt template that includes: the module brief, Hearth's content creation rules, the pack's worldview statement, the exact JSON output schema matching Sanity types, and 2–3 exemplar activities.

### The Import Contract

Regardless of whether content is hand-crafted or agent-generated, the final artifact entering Sanity is always:

```
Pack JSON Package:
├── pack.json          (1 pack document)
├── modules/           (N module documents with embedded indicator objects)
├── approaches/        (N×4-6 approach documents)
├── activities/        (N×4-6×M activity documents, Layer 1 only)
├── overlays/          (N×4-6×M×P overlay documents, one per philosophy per activity)
├── badges/            (badge definition documents)
└── references.json    (mapping file linking document IDs for Sanity reference fields)
```

This contract means content production tooling and Sanity schema evolution can be developed independently — as long as both sides honour the JSON package format.

---

## Key GROQ Queries — Hearth-Specific Patterns

These reflect Hearth's actual document types, not generic LMS patterns.

### Browse modules for Activity Discovery

```groq
*[_type == 'module' && status == 'published'] | order(title) {
  _id,
  title,
  "packTitle": pack->title,
  targetUnderstanding,
  ageRange,
  "approachCount": count(approaches),
  "approaches": approaches[]->{
    title,
    modality,
    "activityCount": count(activities)
  },
  materials,
  "subjectAreas": subjectAreas[]
}
```

### Load full module for Module Experience

```groq
*[_type == 'module' && _id == $moduleId][0] {
  ...,
  "approaches": approaches[]->{
    ...,
    "activities": activities[]->{
      ...,
      facilitatorGuidance
    }
  },
  "badges": connectedBadges[]->{
    _id, name, description, criteria, skillsRepresented
  },
  indicators
}
```

### Fetch pedagogy overlay for a family's philosophy

```groq
*[_type == 'pedagogyOverlay'
  && activity._ref == $activityId
  && framework._ref == $frameworkId][0] {
  insight,
  facilitation,
  observation,
  nextSteps,
  valuesAlignment,
  practiceSuggestions
}
```

### Load pack contents for Marketplace preview

```groq
*[_type == 'pack' && _id == $packId][0] {
  title,
  description,
  price,
  "moduleCount": count(modules),
  "modules": modules[]->{
    title,
    targetUnderstanding,
    ageRange,
    "approachCount": count(approaches)
  },
  "totalActivities": count(modules[]->approaches[]->activities[]),
  creator->{name, bio, photo}
}
```

### Badge definitions linked to a module

```groq
*[_type == 'badge' && references($moduleId)] {
  _id, name, description, criteria, skillsRepresented, image
}
```

---

## Caching Strategy

Sanity content changes slowly and deliberately. Family data changes constantly. The caching strategy reflects this:

| Content Type | Cache TTL | Invalidation | Why |
|---|---|---|---|
| Pedagogical frameworks | 1 week | Manual flush on schema change | Almost never changes |
| Badge definitions | 1 day | Webhook on Sanity publish | Rarely edited after creation |
| Pack/module metadata | 1 day | Webhook on Sanity publish | Stable after initial authoring |
| Full module content | 1 hour | Webhook on Sanity publish | May receive editorial refinements |
| Activity details | 1 hour | Webhook on Sanity publish | Active editing during content sprints |
| Pedagogy overlays | 1 week | Webhook on Sanity publish | Stable reference data |
| Capability threads | 1 week | Manual flush | Mapped to Australian Curriculum V9, changes rarely |
| Family data (PostgreSQL) | Never cached in Sanity layer | N/A | Always read fresh from PostgreSQL |

### Denormalisation Rules

To avoid N+1 queries, PostgreSQL denormalises a few Sanity fields into its own tables:

- `learning_entries` stores `activity_title` and `module_title` alongside the Sanity `_id` reference, so the Logger and Dashboard can render without Sanity round-trips
- `learner_badges` stores `badge_name` for the same reason
- `family_library` stores `content_title` and `content_type` for Planner and Discovery list rendering
- The Family Intelligence Snapshot stores all pre-computed display text, so screens never need to call Sanity at read-time for intelligence-driven content

When Sanity content changes (detected via webhook), a background job updates the denormalised fields in PostgreSQL. This is eventually consistent — a few seconds of staleness is acceptable for titles.

---

## Integration Points Per Screen

How each major screen combines Sanity and PostgreSQL data:

| Screen | From Sanity | From PostgreSQL |
|---|---|---|
| **Dashboard** | — (reads from Snapshot) | Family Intelligence Snapshot, recent entries, badge counts |
| **Activity Discovery** | Module list, approach metadata, subject areas | Family library (access filter), coverage data |
| **Module Experience** | Full module content, approaches, activities, facilitator guidance | Completion state, planner status, log mode entry |
| **Retrospective Logger** | Activity/module title (denormalised) | Entry fields, AI enrichment, per-child engagement |
| **Weekly Planner** | Activity titles (denormalised) | Planner entries, completion status, subject balance |
| **Capabilities Constellation** | Thread definitions, observable indicators | Per-child thread progress, confirmed/suggested DLOs |
| **Our Story** | — | Per-child entry history, badge timeline, Snapshot summaries |
| **Portfolio / Learning Journey** | Badge images, capability thread names | Portfolio items, evidence, progression data |
| **HEU Report** | Curriculum descriptor text | Coverage counts, entry evidence, date ranges |
| **Badge Assessment** | Badge criteria, skills represented | Assessment answers, award decision, evidence links |
| **Marketplace** | Pack listings, educator profiles, pricing | Purchase records, family access, reviews |
| **Pedagogy Engine** | Framework definitions, overlay previews | Family's selected philosophy, values |
| **Family Settings** | — | Family profile, learner list, HEU dates, preferences |
| **Learner Profile** | — | Per-child data, recent entries, badge collection |
| **Notification Centre** | — | Notification queue from Snapshot triggers |

---

## Error Handling & Graceful Degradation

If Sanity is unreachable, Hearth should not break. The application handles this through three mechanisms:

**Cached content serves stale.** If a Sanity query fails, the application serves the most recent cached version. Module content that was valid an hour ago is still valid now. Caches are warmed on deploy and refreshed on webhook.

**Denormalised fields cover essentials.** The Dashboard, Logger, Planner, and Notification Centre can render entirely from PostgreSQL because titles and display text are denormalised. These screens function fully without Sanity.

**Content-heavy screens degrade to empty state.** Activity Discovery and Module Experience depend on Sanity for their primary content. If Sanity is down and cache is cold, these screens show a friendly empty state: "Content is temporarily unavailable. Your logged learning and family data are safe." No alarm language — just a pause.

The AI intelligence layer has its own zero-dependency baseline documented in `Hearth_AI_Intelligence_Layer_Architecture.md` — if the entire AI layer is unavailable, families can still log entries, view portfolios, and run reports using manual fields.

---

## Sanity Studio Configuration Notes

Sanity Studio is the editorial interface where the content team and (eventually) marketplace educators manage documents. Key configuration decisions:

**Dataset strategy:** Single `production` dataset for MVP. Add `staging` dataset when content team exceeds 2 people, to support editorial review before publish.

**Role model:** Two roles for MVP — `editor` (content team, full CRUD on all document types) and `viewer` (marketplace educators, read-only on platform content, full CRUD on their own educator profile and content). Expand when marketplace opens.

**Custom input components:** The Module Builder (React) is a frontend tool that authors content locally, validates through UbD gates, and pushes to Sanity. Sanity Studio is the fallback/power-user editor, not the primary authoring surface for modules. Studio handles bulk operations, schema migrations, and content types that don't have dedicated frontend builders.

**Webhook targets:** On document publish events, Sanity sends webhooks to the Hearth API to trigger cache invalidation and denormalised field updates. Configured per document type — high-frequency types (activity, module) trigger immediate invalidation; low-frequency types (framework, capability thread) are batched.

---

## Cost Model

Sanity's pricing scales with API requests and asset storage, not document count:

| Phase | Families | Est. API Requests/Month | Plan | Monthly Cost |
|---|---|---|---|---|
| MVP (10–20 families) | 20 | ~50K | Free (300K included) | $0 |
| Early growth (50–100) | 100 | ~500K | Starter | ~$99 |
| Scale (500+) | 500 | ~2.5M | Growth | ~$300–500 |

Caching is the primary cost control lever. With the TTLs above, most Sanity reads hit cache, not the API. The expensive Sanity operations are media asset uploads (evidence photos/videos) — consider S3 or Cloudflare R2 for family-uploaded media if asset costs grow, keeping Sanity assets reserved for editorial content (activity images, badge artwork, educator photos).

---

## Document Relationships — Reference Architecture

This shows how Sanity documents reference each other internally, and how PostgreSQL records point to Sanity:

```
SANITY INTERNAL REFERENCES
───────────────────────────

pack
 └──→ module[]              (array of references)

module
 ├──→ pack                  (back-reference)
 ├──→ approach[]            (array of references)
 ├──→ badge[]               (connectedBadges)
 └──→ capabilityThread[]    (curriculum mapping)

approach
 ├──→ module                (parent reference)
 └──→ activity[]            (array of references)

activity
 ├──→ approach              (parent reference)
 └──→ badge[]               (enabledBadges)

pedagogyOverlay
 ├──→ activity              (which activity this overlays)
 └──→ pedagogicalFramework  (which philosophy)

project
 ├──→ projectStage[]        (ordered array of references)
 └──→ badge[]               (capstone + stage badges)

projectStage
 ├──→ project               (parent reference)
 └──→ activity[]            (stage activities)

badge
 └──→ capabilityThread[]    (skills represented)


POSTGRESQL → SANITY BRIDGES
────────────────────────────

learning_entries.activity_id        → activity._id
learning_entries.module_id          → module._id
learner_badges.badge_id             → badge._id
family_library.content_id           → pack._id or module._id
planner_entries.activity_id         → activity._id
purchases.content_id                → pack._id
assessment_submissions.assessment_id → assessment._id
families.pedagogy_framework_id      → pedagogicalFramework._id
```

---

## Migration & Schema Evolution

Sanity schemas evolve as Hearth's content model matures. Key principles:

**Additive changes are free.** Adding new fields to a document type doesn't break existing documents — they simply have `undefined` for the new field. This is the preferred evolution path.

**Destructive changes require migration.** Renaming fields, changing types, or removing fields requires a Sanity migration script that transforms existing documents. Always write and test migration scripts before deploying schema changes to production.

**PostgreSQL denormalised fields track schema changes.** If a Sanity field name changes, the denormalisation sync job and any GROQ queries referencing that field must be updated simultaneously. The deploy checklist includes: schema change → GROQ query audit → sync job update → cache flush → deploy.

**Version content, not schemas, where possible.** If a module needs fundamentally different structure, create a new module rather than retrofitting the schema. Sanity's document model supports this naturally — old modules keep working with the old shape, new modules use the new shape, and the frontend handles both.

---

*This document is the canonical reference for Hearth's content infrastructure decisions. Update it when the Sanity schema evolves, the data boundary shifts, or the content production pipeline changes. It supersedes the earlier `03_CMS_Usage_Mapping.md`, `04_Quick_Reference_Guide.md`, and `05_Visual_Architecture_Guide.md` documents, which reflected a pre-architecture understanding of the system.*
