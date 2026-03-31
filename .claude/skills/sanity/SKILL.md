---
name: sanity
description: Use this skill whenever the user wants to create, update, delete, or manage content in Sanity CMS. Trigger when the user mentions creating modules, activities, approaches, packs, badges, capability threads, pedagogy overlays, projects, or project stages — or says things like "add content to Sanity", "seed Sanity", "write to Sanity", "create a new module/activity/pack", "update the badge", "delete the approach", "build a module", or any variation involving Sanity content operations. Also trigger when discussing content hierarchy (Pack > Module > Approach > Activity) or when the user wants to populate the CMS with new learning content. If in doubt about whether this skill applies, it probably does — Sanity content operations are central to Hearth.
---

# Sanity Content Operations

Hearth has a typed mutation layer for Sanity CMS. Use it instead of raw `sanityWriteClient` calls.

## Files

| File | Purpose |
|------|---------|
| `src/lib/sanity/mutations.ts` | CRUD operations + typed document creators |
| `src/lib/sanity/helpers.ts` | Primitives: `ref`, `keyedRef`, `keyedRefs`, `autoSlug`, `blockText`, `key`, `material`, `dlo`, `range` |
| `src/lib/sanity/client.ts` | `sanityClient` (read/CDN) and `sanityWriteClient` (write/token) |
| `src/lib/sanity/queries.ts` | GROQ read queries |
| `src/sanity/schemas/*.ts` | Schema definitions for all 9 document types |
| `src/app/api/modules/publish/route.ts` | HTTP API for creating full module trees |

## Content hierarchy

```
Pack → Module → Approach → Activity
```

A Pack contains Modules. Each Module has Approaches (different teaching modalities). Each Approach contains Activities (the actual lesson steps). Badges and Capability Threads are cross-cutting — referenced by modules, activities, and badges.

## Building a Module — The Recommended Path

### Option A: Publish API (best for external tools and other Claude chats)

`POST /api/modules/publish` accepts a full module tree and creates all Sanity documents in one call. Auth required (Clerk). Zod-validated.

```json
{
  "title": "Kitchen Chemistry: The Magic of Bread",
  "targetUnderstanding": "Bread-making reveals how ingredients transform through chemical and physical processes, connecting mathematics with science",
  "understandingIndicators": {
    "emerging": "Notices that ingredients change when combined",
    "developing": "Can describe the role of yeast and explain why kneading matters",
    "demonstrating": "Independently adjusts recipes and predicts outcomes"
  },
  "subjects": ["mathematics", "science"],
  "ageRange": { "min": 5, "max": 8 },
  "duration": { "min": 55, "max": 120 },
  "status": "published",
  "approaches": [
    {
      "title": "Hands-On Kitchen Lab",
      "modality": "kinesthetic",
      "description": "Sequential kitchen activities that build on each other to produce real bread.",
      "status": "published",
      "activities": [
        {
          "title": "Measure & Mix",
          "summary": "Measure ingredients and mix dough while exploring fractions and estimation.",
          "instructions": "Gather all ingredients. Start by measuring 2 cups of plain flour into the large mixing bowl...",
          "facilitatorGuidance": {
            "before": "Gather all ingredients before starting.",
            "during": "Ask questions like 'What do you think the yeast does?'",
            "challenges": "If they lose focus, let them taste the yeast mixture."
          },
          "materials": [
            { "name": "Plain flour (2 cups)", "required": true },
            { "name": "Measuring cups", "required": true },
            { "name": "Kitchen scale", "required": false, "alternative": "Extra measuring cups" }
          ],
          "duration": { "min": 10, "max": 15 },
          "setting": "indoor",
          "energyLevel": "calm",
          "modality": "kinesthetic",
          "observationPrompts": ["Watch for whether they estimate before measuring"],
          "reflectionPrompts": ["What do you think the yeast does?"],
          "status": "published"
        }
      ]
    }
  ]
}
```

**Response:** `{ "moduleId": "...", "approaches": [{ "approachId": "...", "activityIds": ["..."] }] }`

### Option B: createFullModule (best for scripts and server-side code)

```ts
import { createFullModule } from '@/lib/sanity/mutations';

const result = await createFullModule({
  title: 'Ocean Explorers',
  targetUnderstanding: 'Marine ecosystems demonstrate interdependence...',
  subjects: ['science'],
  ageRange: { min: 6, max: 9 },
  duration: { min: 60, max: 90 },
  status: 'published',
  approaches: [
    {
      title: 'Coastal Field Study',
      modality: 'exploratory',
      description: 'Direct observation at the beach.',
      status: 'published',
      activities: [
        {
          title: 'Rock Pool Census',
          summary: 'Count and classify creatures in a rock pool.',
          instructions: 'Visit a rock pool at low tide. Count every creature you can find...',
          facilitatorGuidance: {
            before: 'Check tide times. Bring a bucket.',
            during: 'Let them discover. Ask what they notice.',
            challenges: 'If squeamish about touching creatures, start with observation only.',
          },
          materials: [
            { name: 'Clear container or bucket', required: true },
            { name: 'Field guide', required: false, alternative: 'Phone with marine ID app' },
          ],
          duration: { min: 30, max: 45 },
          setting: 'outdoor',
          energyLevel: 'moderate',
          modality: 'kinesthetic',
          observationPrompts: ['Does the child sort creatures by type or by habitat?'],
          reflectionPrompts: ['Which creature surprised you the most?'],
          status: 'published',
        },
      ],
    },
  ],
});
// result.module._id — the created module's ID
// result.approaches[0]._id — the approach ID
// result.approaches[0].activityIds — array of activity IDs
```

## Module Anatomy — What Makes a Good Module

A module needs at minimum:

| Field | Required | What it is |
|-------|----------|------------|
| `title` | Yes | Module name |
| `targetUnderstanding` | Yes | 1-2 sentences: what the child will understand. Philosophy-neutral. |
| `subjects` | Recommended | `english`, `mathematics`, `science`, `hass`, `arts`, `technologies`, `hpe`, `languages` |
| `ageRange` | Recommended | `{ min, max }` in years |
| `duration` | Recommended | `{ min, max }` total minutes across all activities |
| `understandingIndicators` | Recommended | Three tiers of observable behaviour |
| `approaches` | Yes (min 1) | At least one approach with at least one activity |

### Understanding Indicators

Three tiers describe observable learner behaviour. These are shown to parents and used for progress tracking:

- **emerging** — Early signs. The child is noticing but not yet describing or applying.
- **developing** — Active engagement. The child can describe, explain, or do with support.
- **demonstrating** — Independent capability. The child applies knowledge without prompting.

```ts
understandingIndicators: {
  emerging: 'Notices that ingredients change when combined',
  developing: 'Can describe the role of yeast and explain why kneading matters',
  demonstrating: 'Independently adjusts recipes and predicts outcomes based on ingredient ratios',
}
```

### Approach Anatomy

Each approach is a themed angle into the module's understanding:

| Field | Required | Values |
|-------|----------|--------|
| `title` | Yes | Describes the teaching angle |
| `modality` | Recommended | `kinesthetic`, `visual`, `auditory`, `narrative`, `social`, `exploratory` |
| `description` | Recommended | 1-2 sentences: how this approach enters the understanding |
| `activities` | Yes (min 1) | Ordered array of activities |

### Activity Anatomy

The activity is the atomic unit — one learning session:

| Field | Required | Values / Notes |
|-------|----------|----------------|
| `title` | Yes | Activity name |
| `summary` | Recommended | 1-2 sentence overview for card display |
| `instructions` | Yes | Plain text (auto-converted to Portable Text). The core "what to do". |
| `facilitatorGuidance` | Recommended | `{ before, during, challenges }` — parent guidance |
| `materials` | Optional | `[{ name, required, alternative? }]` |
| `duration` | Recommended | `{ min, max }` in minutes |
| `setting` | Recommended | `indoor`, `outdoor`, `either` |
| `energyLevel` | Recommended | `calm`, `moderate`, `active` |
| `modality` | Recommended | `kinesthetic`, `visual`, `auditory`, `narrative`, `social` |
| `observationPrompts` | Optional | What the parent should watch for during the activity |
| `reflectionPrompts` | Optional | Post-activity discussion questions |
| `capabilityThreadIds` | Optional | References to existing capability thread documents |
| `badgeIds` | Optional | References to existing badge documents |

### Content Principles

1. **Philosophy-neutral.** Never assume a pedagogy. Write instructions any family can use regardless of educational philosophy. Pedagogy overlays are separate documents applied at runtime.
2. **Parent as facilitator.** Instructions address the parent, not the child. The parent guides; the child discovers.
3. **Concrete and actionable.** "Count the petals on five different flowers" not "Explore mathematical patterns in nature."
4. **Facilitator guidance is essential.** The `before/during/challenges` structure helps parents who aren't trained teachers.

## Individual Document Creators

For creating documents one at a time (useful when building trees manually or adding to existing structures):

### createActivity

```ts
await createActivity({
  title: 'Build a Volcano',
  approachId: 'the-approach-id',   // REQUIRED — approach must exist first
  summary: 'Build and erupt a model volcano using kitchen ingredients.',
  instructions: 'Mix baking soda and vinegar...',  // string or blockText()
  facilitatorGuidance: { before: '...', during: '...', challenges: '...' },
  materials: [
    { name: 'Baking soda', required: true },
    { name: 'Food colouring', required: false, alternative: 'Paint' },
  ],
  duration: { min: 15, max: 25 },
  setting: 'outdoor',
  energyLevel: 'active',
  modality: 'kinesthetic',
  observationPrompts: ['Does the learner predict the eruption?'],
  reflectionPrompts: ['What caused the reaction?'],
  capabilityThreadIds: ['seed-ct-sci-obs'],
  badgeIds: ['seed-badge-kitchen-scientist'],
  status: 'published',
});
```

### createApproach

```ts
await createApproach({
  title: 'Hands-On Kitchen Lab',
  moduleId: 'the-module-id',      // REQUIRED — module must exist first
  modality: 'kinesthetic',
  description: 'Sequential kitchen activities.',
  activityIds: ['act-1', 'act-2'],  // optional — can patch later
  status: 'published',
});
```

### createModule

```ts
await createModule({
  title: 'Kitchen Chemistry',
  targetUnderstanding: 'Bread-making reveals chemical processes...',
  understandingIndicators: {
    emerging: 'Notices ingredients change',
    developing: 'Describes the role of yeast',
    demonstrating: 'Adjusts recipes independently',
  },
  subjects: ['mathematics', 'science'],
  ageRange: { min: 5, max: 8 },
  duration: { min: 55, max: 120 },
  badgeIds: ['badge-id'],
  capabilityThreadIds: ['ct-id'],
  status: 'published',
});
```

### createPack

```ts
await createPack({
  title: 'Hearth Starter Collection',
  description: 'Three rich learning modules...',
  moduleIds: ['mod-1', 'mod-2'],
  badgeIds: ['badge-1'],
  subjects: ['english', 'mathematics', 'science'],
  ageRange: { min: 5, max: 8 },
  termWeeks: 4,
  moduleCount: 3,
  totalActivities: 9,
  worldview: 'neutral',           // christian-classical | secular | neutral
  availability: 'included',       // included | premium
  status: 'published',
});
```

### createCapabilityThread

```ts
await createCapabilityThread({
  title: 'Spatial Reasoning',
  domain: 'mathematics',
  description: 'Understanding of shape, space, and position.',
  dlos: [
    { title: 'Recognises basic shapes', tier: 'emerging' },
    { title: 'Describes spatial relationships', tier: 'developing' },
    { title: 'Applies transformations', tier: 'demonstrating' },
  ],
});
```

### createBadge

```ts
await createBadge({
  title: 'Shape Explorer',
  emoji: '📐',
  description: 'Awarded for demonstrating spatial reasoning skills.',
  criteriaSummary: 'Identifies and describes 2D and 3D shapes in context',
  capabilityThreadIds: ['seed-ct-spatial'],
  observationThreshold: 3,
  status: 'published',
});
```

### createPedagogyOverlay

```ts
await createPedagogyOverlay({
  activityId: 'the-activity-id',
  framework: 'montessori',         // charlotte_mason | classical | montessori | waldorf_steiner | unschooling | eclectic
  lens: {
    perspective: 'Follow the child...',
    facilitatorTips: 'Prepare the environment...',
    languageFrame: 'Use invitational language...',
    watchFor: 'Signs of deep concentration...',
  },
  status: 'published',
});
```

### createProject / createProjectStage

```ts
const project = await createProject({
  title: 'Build a Weather Station',
  description: 'Multi-week project...',
  subjects: ['science', 'technologies'],
  ageRange: { min: 7, max: 10 },
  duration: '3-4 weeks',
});

await createProjectStage({
  title: 'Design Phase',
  projectId: project._id,
  stageNumber: 1,
  instructions: 'Sketch your design...',
  materials: [{ name: 'Graph paper' }],
  estimatedDuration: '45 minutes',
});
```

## Generic CRUD

For operations not covered by typed creators:

```ts
import { patch, unsetFields, appendToArray, remove, getDoc, query, createMany, patchMany, removeMany } from '@/lib/sanity/mutations';

await patch('doc-id', { title: 'New Title', status: 'published' });
await unsetFields('doc-id', ['deprecatedField']);
await appendToArray('doc-id', 'activities', [keyedRef('new-activity-id')]);
await remove('doc-id');

const doc = await getDoc('doc-id');
const packs = await query('*[_type == "pack" && status == "published"]');

// Batch — transactional (all-or-nothing)
await createMany([doc1, doc2, doc3]);
await patchMany([
  { id: 'id-1', fields: { status: 'published' } },
  { id: 'id-2', fields: { status: 'published' } },
]);
await removeMany(['id-1', 'id-2']);
```

## Helpers (src/lib/sanity/helpers.ts)

```ts
import { ref, keyedRef, keyedRefs, autoSlug, slug, slugify, key, blockText, material, dlo, range } from '@/lib/sanity/helpers';

ref('doc-id')                    // { _type: 'reference', _ref: 'doc-id' } — for single refs (approach.module)
keyedRef('doc-id')               // { _type: 'reference', _ref: 'doc-id', _key: 'ref-xxxx' } — for array items
keyedRefs(['id-1', 'id-2'])      // array of keyed refs — USE THIS for all array reference fields
autoSlug('My Title')             // { _type: 'slug', current: 'my-title' }
slug('custom-slug')              // { _type: 'slug', current: 'custom-slug' }
slugify('My Title!')             // 'my-title'
key('mat')                       // 'mat-a1b2c3d4' (unique _key for array items)
blockText('Plain text')          // Portable Text block array
material('Flour', true)          // { _key: '...', name: 'Flour', required: true }
dlo('Counts to 10', 'emerging')  // { _key: '...', title: '...', tier: 'emerging' }
range(5, 8)                      // { min: 5, max: 8 }
```

**Important:** Use `keyedRef`/`keyedRefs` for array reference fields (e.g., `module.approaches`, `approach.activities`). Use plain `ref` for single reference fields (e.g., `approach.module`, `activity.approach`). Sanity requires `_key` on array items.

## Dependency ordering

Sanity enforces referential integrity — you can't reference a document that doesn't exist yet.

**The dependency chain:**
1. Capability Threads and Badges (no outbound refs to other content types)
2. Modules (reference badges + capability threads)
3. Approaches (reference modules)
4. Activities (reference approaches, badges, capability threads)
5. Patch approaches with activity arrays, modules with approach arrays
6. Packs (reference modules, badges)

`createFullModule` and the publish API handle steps 2-5 automatically.

## Running scripts that write to Sanity

The `.env.local` file contains Sanity credentials but `dotenv/config` only reads `.env`. When running standalone scripts (like seeds), either:
- Pass env vars explicitly: `NEXT_PUBLIC_SANITY_PROJECT_ID=... npx tsx script.ts`
- Or use the app's env loading (API routes and server components load `.env.local` automatically)

For API routes, `sanityWriteClient` works out of the box since Next.js loads `.env.local`.
