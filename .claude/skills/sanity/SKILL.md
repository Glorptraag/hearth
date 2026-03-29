---
name: sanity
description: Use this skill whenever the user wants to create, update, delete, or manage content in Sanity CMS. Trigger when the user mentions creating modules, activities, approaches, packs, badges, capability threads, pedagogy overlays, projects, or project stages — or says things like "add content to Sanity", "seed Sanity", "write to Sanity", "create a new module/activity/pack", "update the badge", "delete the approach", or any variation involving Sanity content operations. Also trigger when discussing content hierarchy (Pack > Module > Approach > Activity) or when the user wants to populate the CMS with new learning content. If in doubt about whether this skill applies, it probably does — Sanity content operations are central to Hearth.
---

# Sanity Content Operations

Hearth has a typed mutation layer for Sanity CMS. Use it instead of raw `sanityWriteClient` calls.

## Files

| File | Purpose |
|------|---------|
| `src/lib/sanity/mutations.ts` | CRUD operations + typed document creators |
| `src/lib/sanity/helpers.ts` | Primitives: `ref`, `refs`, `autoSlug`, `blockText`, `key`, `material`, `dlo`, `range` |
| `src/lib/sanity/client.ts` | `sanityClient` (read/CDN) and `sanityWriteClient` (write/token) |
| `src/lib/sanity/queries.ts` | GROQ read queries |
| `src/sanity/schemas/*.ts` | Schema definitions for all 9 document types |

## Content hierarchy

```
Pack → Module → Approach → Activity
```

A Pack contains Modules. Each Module has Approaches (different teaching modalities). Each Approach contains Activities (the actual lesson steps). Badges and Capability Threads are cross-cutting — referenced by modules, activities, and badges.

## Typed creators

Every creator takes a plain object, auto-generates slugs from titles, and defaults `status` to `'draft'`. Pass `_id` for deterministic IDs (seeds, cross-refs) or omit for Sanity auto-IDs.

### createCapabilityThread

```ts
await createCapabilityThread({
  title: 'Spatial Reasoning',
  domain: 'mathematics',          // english | mathematics | science | hass | arts | technologies | hpe | languages
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
  observationThreshold: 3,        // defaults to 3
  status: 'published',
});
```

### createActivity

```ts
await createActivity({
  title: 'Build a Volcano',
  approachId: 'the-approach-id',   // REQUIRED — approach must exist first
  instructions: 'Mix baking soda and vinegar...',  // string or blockText()
  facilitatorGuidance: { before: '...', during: '...', challenges: '...' },
  materials: [
    { name: 'Baking soda', required: true },
    { name: 'Food colouring', required: false, alternative: 'Paint' },
  ],
  duration: { min: 15, max: 25 },
  setting: 'outdoor',             // indoor | outdoor | either
  energyLevel: 'active',          // calm | moderate | active
  modality: 'kinesthetic',        // kinesthetic | visual | auditory | narrative | social
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

### createPedagogyOverlay

```ts
await createPedagogyOverlay({
  activityId: 'the-activity-id',   // REQUIRED
  framework: 'montessori',         // charlotte-mason | classical | montessori | waldorf-steiner | unschooling | eclectic
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

## Creating a full module tree

When building a complete module with approaches and activities, use `createFullModule`. It handles the circular reference problem automatically (module → approaches → activities, then patches back-references).

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
          instructions: 'Count and classify creatures in a rock pool.',
          setting: 'outdoor',
          energyLevel: 'moderate',
          modality: 'kinesthetic',
          status: 'published',
        },
        {
          title: 'Seaweed Press',
          instructions: 'Collect and press seaweed specimens.',
          setting: 'outdoor',
          energyLevel: 'calm',
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

## Generic CRUD

For operations not covered by typed creators:

```ts
import { patch, unsetFields, appendToArray, remove, getDoc, query, createMany, patchMany, removeMany } from '@/lib/sanity/mutations';

// Update fields
await patch('doc-id', { title: 'New Title', status: 'published' });

// Remove fields
await unsetFields('doc-id', ['deprecatedField']);

// Append to an array field
await appendToArray('doc-id', 'activities', [ref('new-activity-id')]);

// Delete
await remove('doc-id');

// Read
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

## Dependency ordering

Sanity enforces referential integrity — you can't reference a document that doesn't exist yet.

**The dependency chain:**
1. Capability Threads and Badges (no outbound refs to other content types)
2. Modules (reference badges + capability threads)
3. Approaches (reference modules)
4. Activities (reference approaches, badges, capability threads)
5. Patch approaches with activity arrays, modules with approach arrays
6. Packs (reference modules, badges)

`createFullModule` handles steps 2-5 automatically. For manual creation, follow this order.

## Helpers (src/lib/sanity/helpers.ts)

Use these when building documents manually or extending the typed creators:

```ts
import { ref, refs, autoSlug, slug, slugify, key, blockText, material, dlo, range } from '@/lib/sanity/helpers';

ref('doc-id')                    // { _type: 'reference', _ref: 'doc-id' }
refs(['id-1', 'id-2'])           // array of refs
autoSlug('My Title')             // { _type: 'slug', current: 'my-title' }
slug('custom-slug')              // { _type: 'slug', current: 'custom-slug' }
slugify('My Title!')             // 'my-title'
key('mat')                       // 'mat-a1b2c3d4' (unique _key for array items)
blockText('Plain text')          // Portable Text block array
material('Flour', true)          // { _key: '...', name: 'Flour', required: true }
dlo('Counts to 10', 'emerging')  // { _key: '...', title: '...', tier: 'emerging' }
range(5, 8)                      // { min: 5, max: 8 }
```

## Running scripts that write to Sanity

The `.env.local` file contains Sanity credentials but `dotenv/config` only reads `.env`. When running standalone scripts (like seeds), either:
- Pass env vars explicitly: `NEXT_PUBLIC_SANITY_PROJECT_ID=... npx tsx script.ts`
- Or use the app's env loading (API routes and server components load `.env.local` automatically)

For API routes, `sanityWriteClient` works out of the box since Next.js loads `.env.local`.
