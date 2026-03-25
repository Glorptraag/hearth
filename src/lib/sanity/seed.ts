/**
 * Sanity seed script — "Hearth Starter Collection"
 * Run with: npx tsx src/lib/sanity/seed.ts
 *
 * Idempotent: checks for existing documents before creating.
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { families, familyLibrary } from '../db/schema';

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

// ─── IDs (stable, predictable for idempotency) ───────────────────────────────

const IDS = {
  // Capability threads
  ct_numberSense: 'seed-ct-number-sense',
  ct_measurement: 'seed-ct-measurement',
  ct_sciObs: 'seed-ct-sci-obs',
  ct_narrative: 'seed-ct-narrative',
  ct_visualArts: 'seed-ct-visual-arts',

  // Badges
  badge_kitchenSci: 'seed-badge-kitchen-scientist',
  badge_patternSpotter: 'seed-badge-pattern-spotter',

  // Activities — Bread module
  act_measureMix: 'seed-act-measure-mix',
  act_kneadWait: 'seed-act-knead-wait',
  act_shapeBake: 'seed-act-shape-bake',

  // Activities — Stars module
  act_starsA1: 'seed-act-stars-a1',
  act_starsA2: 'seed-act-stars-a2',
  act_starsA3: 'seed-act-stars-a3',

  // Activities — Patterns module
  act_patternsA1: 'seed-act-patterns-a1',
  act_patternsA2: 'seed-act-patterns-a2',
  act_patternsA3: 'seed-act-patterns-a3',

  // Approaches
  app_kitchenLab: 'seed-app-kitchen-lab',
  app_stargazing: 'seed-app-stargazing',
  app_natureWalk: 'seed-app-nature-walk',

  // Modules
  mod_bread: 'seed-mod-bread',
  mod_stars: 'seed-mod-stars',
  mod_patterns: 'seed-mod-patterns',

  // Pack
  pack_starter: 'seed-pack-starter-collection',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ref(id: string) {
  return { _type: 'reference', _ref: id };
}

function blockText(text: string) {
  return [
    {
      _type: 'block',
      _key: `block-${Math.random().toString(36).slice(2)}`,
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: 'span-1', text, marks: [] }],
    },
  ];
}

async function upsert(doc: Record<string, unknown> & { _id: string }) {
  const existing = await sanity.getDocument(doc._id);
  if (existing) {
    console.log(`  ↩  exists: ${doc._id}`);
    return existing;
  }
  const result = await sanity.createOrReplace(doc as Parameters<typeof sanity.createOrReplace>[0]);
  console.log(`  ✓  created: ${doc._id}`);
  return result;
}

// ─── Seed functions ───────────────────────────────────────────────────────────

async function seedCapabilityThreads() {
  console.log('\n── Capability Threads');
  await upsert({
    _id: IDS.ct_numberSense,
    _type: 'capabilityThread',
    title: 'Number Sense & Place Value',
    slug: { _type: 'slug', current: 'number-sense-place-value' },
    domain: 'mathematics',
    description: 'Understanding of quantity, counting, and the structure of the number system.',
    dlos: [
      { _key: 'dlo-1', title: 'Recognises quantities', tier: 'emerging' },
      { _key: 'dlo-2', title: 'Compares and orders numbers', tier: 'developing' },
      { _key: 'dlo-3', title: 'Composes and decomposes numbers fluently', tier: 'demonstrating' },
    ],
  });
  await upsert({
    _id: IDS.ct_measurement,
    _type: 'capabilityThread',
    title: 'Measurement & Estimation',
    slug: { _type: 'slug', current: 'measurement-estimation' },
    domain: 'mathematics',
    description: 'Ability to measure, estimate, and use appropriate units.',
    dlos: [
      { _key: 'dlo-1', title: 'Compares objects by size', tier: 'emerging' },
      { _key: 'dlo-2', title: 'Uses standard units with support', tier: 'developing' },
      { _key: 'dlo-3', title: 'Selects appropriate units and measures accurately', tier: 'demonstrating' },
    ],
  });
  await upsert({
    _id: IDS.ct_sciObs,
    _type: 'capabilityThread',
    title: 'Scientific Observation',
    slug: { _type: 'slug', current: 'scientific-observation' },
    domain: 'science',
    description: 'Capacity to observe, record, and interpret scientific phenomena.',
    dlos: [
      { _key: 'dlo-1', title: 'Notices changes in materials', tier: 'emerging' },
      { _key: 'dlo-2', title: 'Records observations with detail', tier: 'developing' },
      { _key: 'dlo-3', title: 'Designs and conducts simple investigations', tier: 'demonstrating' },
    ],
  });
  await upsert({
    _id: IDS.ct_narrative,
    _type: 'capabilityThread',
    title: 'Narrative Understanding',
    slug: { _type: 'slug', current: 'narrative-understanding' },
    domain: 'english',
    description: 'Comprehension of story structure, characters, and meaning-making through narrative.',
    dlos: [
      { _key: 'dlo-1', title: 'Retells familiar stories', tier: 'emerging' },
      { _key: 'dlo-2', title: 'Identifies characters, settings, and events', tier: 'developing' },
      { _key: 'dlo-3', title: 'Analyses how narrative choices create meaning', tier: 'demonstrating' },
    ],
  });
  await upsert({
    _id: IDS.ct_visualArts,
    _type: 'capabilityThread',
    title: 'Visual Arts Expression',
    slug: { _type: 'slug', current: 'visual-arts-expression' },
    domain: 'arts',
    description: 'Creative expression through visual media and art materials.',
    dlos: [
      { _key: 'dlo-1', title: 'Experiments with materials', tier: 'emerging' },
      { _key: 'dlo-2', title: 'Uses elements of art purposefully', tier: 'developing' },
      { _key: 'dlo-3', title: 'Creates works that communicate ideas', tier: 'demonstrating' },
    ],
  });
}

async function seedBadges() {
  console.log('\n── Badges');
  await upsert({
    _id: IDS.badge_kitchenSci,
    _type: 'badge',
    title: 'Kitchen Scientist',
    slug: { _type: 'slug', current: 'kitchen-scientist' },
    emoji: '🧪',
    description: 'Awarded for demonstrating scientific thinking through hands-on kitchen experiments.',
    criteriaSummary:
      'Demonstrates understanding of how ingredients interact through measurement, observation, and prediction',
    capabilityThreads: [ref(IDS.ct_sciObs), ref(IDS.ct_measurement)],
    observationThreshold: 3,
    status: 'published',
  });
  await upsert({
    _id: IDS.badge_patternSpotter,
    _type: 'badge',
    title: 'Pattern Spotter',
    slug: { _type: 'slug', current: 'pattern-spotter' },
    emoji: '🔍',
    description: 'Awarded for identifying and describing patterns in natural environments.',
    criteriaSummary: 'Identifies and describes patterns in natural environments',
    capabilityThreads: [ref(IDS.ct_numberSense), ref(IDS.ct_visualArts)],
    observationThreshold: 3,
    status: 'published',
  });
}

async function seedBreadActivities() {
  console.log('\n── Bread Activities');
  await upsert({
    _id: IDS.act_measureMix,
    _type: 'activity',
    title: 'Measure & Mix',
    slug: { _type: 'slug', current: 'measure-and-mix' },
    approach: ref(IDS.app_kitchenLab),
    instructions: blockText(
      'Gather all ingredients. Start by measuring 2 cups of plain flour into the large mixing bowl — ask your learner to estimate how much flour you need before measuring. Add 1 teaspoon of dried yeast, 1 teaspoon of sugar, and half a teaspoon of salt. Mix the dry ingredients together. Talk about fractions as you measure: "This is half a cup — how many halves make a whole?" Make a well in the centre of the flour. Pour in 3/4 cup of warm water (test it on your wrist — it should feel like a warm bath, not hot). Mix until a shaggy dough forms.'
    ),
    facilitatorGuidance: {
      before:
        'Gather all ingredients before starting. Warm the water to the right temperature — too hot will kill the yeast, too cold and it won\'t activate. Have measuring cups and a large bowl ready.',
      during:
        'Ask questions like "What do you think the yeast does?" and "Why did we use warm water and not cold?" Encourage estimation before measuring. Let them pour and mix independently.',
      challenges:
        'If they lose focus, let them taste the yeast mixture after you dissolve it in warm water — the smell is distinctive and interesting. If measuring is too abstract, use visual comparisons.',
    },
    materials: [
      { _key: 'm-1', name: 'Plain flour (2 cups)', required: true },
      { _key: 'm-2', name: 'Dried yeast (1 tsp)', required: true },
      { _key: 'm-3', name: 'Sugar (1 tsp)', required: true },
      { _key: 'm-4', name: 'Warm water (3/4 cup)', required: true },
      { _key: 'm-5', name: 'Salt (1/2 tsp)', required: true },
      { _key: 'm-6', name: 'Measuring cups and spoons', required: true },
      { _key: 'm-7', name: 'Large mixing bowl', required: true },
    ],
    duration: { min: 10, max: 15 },
    setting: 'indoor',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'Watch for whether they estimate before measuring',
      'Notice if they comment on texture changes as dry and wet ingredients combine',
    ],
    reflectionPrompts: [
      'What do you think the yeast does?',
      'Why did we use warm water and not cold?',
    ],
    capabilityThreads: [ref(IDS.ct_measurement), ref(IDS.ct_sciObs)],
    enabledBadges: [ref(IDS.badge_kitchenSci)],
    status: 'published',
  });

  await upsert({
    _id: IDS.act_kneadWait,
    _type: 'activity',
    title: 'Knead & Wait',
    slug: { _type: 'slug', current: 'knead-and-wait' },
    approach: ref(IDS.app_kitchenLab),
    instructions: blockText(
      'Turn the dough out onto a lightly floured surface. Show your learner the push-fold-turn kneading technique. Knead together for 8-10 minutes until the dough is smooth and elastic. Talk about what is happening: the gluten strands are stretching and strengthening. Place the dough in a bowl, cover with a damp cloth, and leave in a warm spot for 45 minutes. While waiting, observe the dough every 10-15 minutes and record its size. When it has doubled, gently press it — it should spring back slowly.'
    ),
    facilitatorGuidance: {
      before: 'Lightly flour the bench. Have a timer ready.',
      during:
        'Kneading is tiring for small hands — take turns. Talk about the change in texture from sticky to smooth.',
      challenges:
        'If dough is too sticky, add flour a tablespoon at a time. Use the waiting time for a walk or other activity.',
    },
    materials: [
      { _key: 'm-1', name: 'Floured surface', required: true },
      { _key: 'm-2', name: 'Timer', required: false, alternative: 'Phone timer' },
      { _key: 'm-3', name: 'Damp cloth or cling wrap', required: true },
    ],
    duration: { min: 15, max: 65 },
    setting: 'indoor',
    energyLevel: 'moderate',
    modality: 'kinesthetic',
    observationPrompts: [
      'Does the learner notice the texture change during kneading?',
      'Can they predict how much the dough will rise?',
    ],
    reflectionPrompts: [
      'What is happening inside the dough while it rests?',
      'Why do you think it doubled in size?',
    ],
    capabilityThreads: [ref(IDS.ct_sciObs)],
    enabledBadges: [ref(IDS.badge_kitchenSci)],
    status: 'published',
  });

  await upsert({
    _id: IDS.act_shapeBake,
    _type: 'activity',
    title: 'Shape, Bake & Discover',
    slug: { _type: 'slug', current: 'shape-bake-discover' },
    approach: ref(IDS.app_kitchenLab),
    instructions: blockText(
      'Knock back the risen dough with a firm punch. Divide into 8 equal pieces. Shape each into a smooth ball by rolling against the bench with a cupped hand. Place on a greased baking tray. Cover loosely and leave for a second rise — 20 minutes. Preheat oven to 200°C. Bake for 15-18 minutes until golden brown and hollow-sounding when tapped underneath. Cool on a rack, then taste and compare to store-bought bread.'
    ),
    facilitatorGuidance: {
      before: 'Preheat oven before shaping so it is ready in time.',
      during:
        'Division into equal pieces is a great maths moment — how do we make sure each piece is the same? Let them use their hands to judge.',
      challenges:
        'If rolls are browning too fast, cover loosely with foil. Keep little hands away from the hot oven.',
    },
    materials: [
      { _key: 'm-1', name: 'Baking tray (greased)', required: true },
      { _key: 'm-2', name: 'Oven (preheated to 200°C)', required: true },
      { _key: 'm-3', name: 'Cooling rack', required: false },
    ],
    duration: { min: 30, max: 40 },
    setting: 'indoor',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    observationPrompts: [
      'Does the learner connect the second rise to the first?',
      'What sensory language do they use when tasting?',
    ],
    reflectionPrompts: [
      'How is this bread different from what we bought at the shop?',
      'What would happen if we changed one ingredient?',
    ],
    capabilityThreads: [ref(IDS.ct_sciObs), ref(IDS.ct_measurement)],
    enabledBadges: [ref(IDS.badge_kitchenSci)],
    status: 'published',
  });
}

async function seedStarsActivities() {
  console.log('\n── Stars Activities');
  const starsActs = [
    {
      _id: IDS.act_starsA1,
      title: 'Find the Southern Cross',
      slug: { _type: 'slug', current: 'find-southern-cross' },
      duration: { min: 15, max: 20 },
      setting: 'outdoor',
      energyLevel: 'calm',
      description: 'Go outside after dark and locate the Southern Cross constellation.',
      materials: [{ _key: 'm-1', name: 'Clear night sky', required: true }],
    },
    {
      _id: IDS.act_starsA2,
      title: 'Draw Your Own Constellation',
      slug: { _type: 'slug', current: 'draw-your-constellation' },
      duration: { min: 20, max: 30 },
      setting: 'indoor',
      energyLevel: 'calm',
      description: 'Connect dots on black paper to make up your own constellation and write its story.',
      materials: [
        { _key: 'm-1', name: 'Black paper', required: true },
        { _key: 'm-2', name: 'White or gold pen', required: true },
      ],
    },
    {
      _id: IDS.act_starsA3,
      title: 'Constellation Stories from Around the World',
      slug: { _type: 'slug', current: 'constellation-stories' },
      duration: { min: 20, max: 25 },
      setting: 'indoor',
      energyLevel: 'calm',
      description: 'Read and compare Indigenous Australian and Greek stories about the same stars.',
      materials: [{ _key: 'm-1', name: 'Reference books or printed cards', required: false }],
    },
  ];
  for (const act of starsActs) {
    await upsert({
      ...act,
      _type: 'activity',
      approach: ref(IDS.app_stargazing),
      instructions: blockText(act.description),
      status: 'published',
    });
  }
}

async function seedPatternsActivities() {
  console.log('\n── Patterns Activities');
  const patternActs = [
    {
      _id: IDS.act_patternsA1,
      title: 'Nature Pattern Hunt',
      slug: { _type: 'slug', current: 'nature-pattern-hunt' },
      duration: { min: 20, max: 30 },
      setting: 'outdoor',
      energyLevel: 'active',
      description: 'Walk outside and collect or photograph 5 examples of patterns in nature.',
      materials: [{ _key: 'm-1', name: 'Collection bag or camera', required: false }],
    },
    {
      _id: IDS.act_patternsA2,
      title: 'Pattern Rubbings',
      slug: { _type: 'slug', current: 'pattern-rubbings' },
      duration: { min: 15, max: 20 },
      setting: 'indoor',
      energyLevel: 'calm',
      description: 'Place paper over textured natural objects and rub with crayon to reveal patterns.',
      materials: [
        { _key: 'm-1', name: 'Paper', required: true },
        { _key: 'm-2', name: 'Crayons', required: true },
        { _key: 'm-3', name: 'Natural objects (leaves, bark)', required: true },
      ],
    },
    {
      _id: IDS.act_patternsA3,
      title: 'Fibonacci in the Garden',
      slug: { _type: 'slug', current: 'fibonacci-garden' },
      duration: { min: 25, max: 35 },
      setting: 'outdoor',
      energyLevel: 'moderate',
      description: 'Count spiral patterns on sunflowers, pinecones or succulents and discover the Fibonacci sequence.',
      materials: [
        { _key: 'm-1', name: 'Sunflower, pinecone, or succulent', required: true },
        { _key: 'm-2', name: 'Notebook', required: false },
      ],
    },
  ];
  for (const act of patternActs) {
    await upsert({
      ...act,
      _type: 'activity',
      approach: ref(IDS.app_natureWalk),
      instructions: blockText(act.description),
      capabilityThreads: [ref(IDS.ct_numberSense), ref(IDS.ct_visualArts)],
      enabledBadges: [ref(IDS.badge_patternSpotter)],
      status: 'published',
    });
  }
}

async function seedApproaches() {
  console.log('\n── Approaches');
  await upsert({
    _id: IDS.app_kitchenLab,
    _type: 'approach',
    title: 'Hands-On Kitchen Lab',
    slug: { _type: 'slug', current: 'hands-on-kitchen-lab' },
    module: ref(IDS.mod_bread),
    modality: 'kinesthetic',
    description: 'Sequential kitchen activities that build on each other to produce real bread.',
    activities: [ref(IDS.act_measureMix), ref(IDS.act_kneadWait), ref(IDS.act_shapeBake)],
    status: 'published',
  });
  await upsert({
    _id: IDS.app_stargazing,
    _type: 'approach',
    title: 'Night Sky Exploration',
    slug: { _type: 'slug', current: 'night-sky-exploration' },
    module: ref(IDS.mod_stars),
    modality: 'exploratory',
    description: 'Direct observation and creative activities connecting stars to storytelling.',
    activities: [ref(IDS.act_starsA1), ref(IDS.act_starsA2), ref(IDS.act_starsA3)],
    status: 'published',
  });
  await upsert({
    _id: IDS.app_natureWalk,
    _type: 'approach',
    title: 'Nature Pattern Walk',
    slug: { _type: 'slug', current: 'nature-pattern-walk' },
    module: ref(IDS.mod_patterns),
    modality: 'kinesthetic',
    description: 'Outdoor exploration discovering mathematical patterns in living things.',
    activities: [ref(IDS.act_patternsA1), ref(IDS.act_patternsA2), ref(IDS.act_patternsA3)],
    status: 'published',
  });
}

async function seedModules() {
  console.log('\n── Modules');
  await upsert({
    _id: IDS.mod_bread,
    _type: 'module',
    title: 'Kitchen Chemistry: The Magic of Bread',
    slug: { _type: 'slug', current: 'kitchen-chemistry-magic-of-bread' },
    targetUnderstanding:
      'Bread-making reveals how ingredients transform through chemical and physical processes, connecting mathematics (measurement, fractions) with science (living organisms, states of matter)',
    understandingIndicators: {
      emerging: 'Notices that ingredients change when combined',
      developing: 'Can describe the role of yeast and explain why kneading matters',
      demonstrating:
        'Independently adjusts recipes and predicts outcomes based on ingredient ratios',
    },
    approaches: [ref(IDS.app_kitchenLab)],
    subjects: ['mathematics', 'science'],
    ageRange: { min: 5, max: 8 },
    duration: { min: 55, max: 120 },
    badges: [ref(IDS.badge_kitchenSci)],
    capabilityThreads: [ref(IDS.ct_measurement), ref(IDS.ct_sciObs)],
    status: 'published',
  });
  await upsert({
    _id: IDS.mod_stars,
    _type: 'module',
    title: 'Stories in the Stars',
    slug: { _type: 'slug', current: 'stories-in-the-stars' },
    targetUnderstanding:
      'Constellation stories connect cultures across time, showing how humans use narrative to make sense of the natural world',
    approaches: [ref(IDS.app_stargazing)],
    subjects: ['english', 'science', 'hass'],
    ageRange: { min: 5, max: 8 },
    duration: { min: 55, max: 75 },
    badges: [],
    capabilityThreads: [ref(IDS.ct_narrative)],
    status: 'published',
  });
  await upsert({
    _id: IDS.mod_patterns,
    _type: 'module',
    title: "Nature's Patterns",
    slug: { _type: 'slug', current: 'natures-patterns' },
    targetUnderstanding:
      'Patterns in nature reveal mathematical relationships that can be observed, recorded, and described',
    approaches: [ref(IDS.app_natureWalk)],
    subjects: ['mathematics', 'science', 'arts'],
    ageRange: { min: 5, max: 8 },
    duration: { min: 60, max: 85 },
    badges: [ref(IDS.badge_patternSpotter)],
    capabilityThreads: [ref(IDS.ct_numberSense), ref(IDS.ct_visualArts)],
    status: 'published',
  });
}

async function seedPack() {
  console.log('\n── Pack');
  await upsert({
    _id: IDS.pack_starter,
    _type: 'pack',
    title: 'Hearth Starter Collection',
    slug: { _type: 'slug', current: 'hearth-starter-collection' },
    description:
      'Three rich learning modules to kickstart your homeschool year. Covers kitchen science, storytelling, and mathematical patterns in nature.',
    ageRange: { min: 5, max: 8 },
    subjects: ['english', 'mathematics', 'science', 'arts'],
    termWeeks: 4,
    moduleCount: 3,
    totalActivities: 9,
    worldview: 'neutral',
    availability: 'included',
    version: '1.0.0',
    status: 'published',
    modules: [ref(IDS.mod_bread), ref(IDS.mod_stars), ref(IDS.mod_patterns)],
    badges: [ref(IDS.badge_kitchenSci), ref(IDS.badge_patternSpotter)],
  });
}

async function seedFamilyLibrary() {
  console.log('\n── Family Library (PostgreSQL)');
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema: { families, familyLibrary } });

  // Find the Campbells family (or any family — seed for first family found)
  const allFamilies = await db.select().from(families).limit(5);
  if (allFamilies.length === 0) {
    console.log('  ⚠  No families in database — skipping library seed');
    return;
  }

  const family = allFamilies.find((f) => f.familyName.toLowerCase().includes('campbell')) ?? allFamilies[0];
  console.log(`  → seeding library for: ${family.familyName} (${family.id})`);

  // Check if record already exists
  const existing = await db
    .select()
    .from(familyLibrary)
    .where(eq(familyLibrary.familyId, family.id))
    .limit(1);

  if (existing.length > 0) {
    console.log('  ↩  library record already exists');
    return;
  }

  await db.insert(familyLibrary).values({
    familyId: family.id,
    sanityPackId: IDS.pack_starter,
  });
  console.log('  ✓  inserted family_library record');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Hearth Sanity seed starting...');
  console.log(`   Project: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}`);
  console.log(`   Dataset: ${process.env.NEXT_PUBLIC_SANITY_DATASET}`);

  await seedCapabilityThreads();
  await seedBadges();
  await seedBreadActivities();
  await seedStarsActivities();
  await seedPatternsActivities();
  await seedApproaches();
  await seedModules();
  await seedPack();
  await seedFamilyLibrary();

  console.log('\n✅ Seed complete.\n');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
