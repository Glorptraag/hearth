/**
 * Supplementary Sanity seed for dev preview — adds extra packs.
 * Run with: npx tsx src/lib/sanity/seed-preview.ts
 *
 * Run AFTER the main seed.ts to add more marketplace content.
 * Idempotent: checks for existing documents before creating.
 */

import 'dotenv/config';
import { createClient } from '@sanity/client';

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

// ─── IDs ─────────────────────────────────────────────────────────────────────

const IDS = {
  // Use existing capability threads from main seed
  ct_numberSense: 'seed-ct-number-sense',
  ct_narrative: 'seed-ct-narrative',
  ct_visualArts: 'seed-ct-visual-arts',
  ct_sciObs: 'seed-ct-sci-obs',

  // Pack 2: Nature Explorers
  pack_nature: 'seed-pack-nature-explorers',
  mod_birdwatch: 'seed-mod-birdwatching',
  mod_waterCycle: 'seed-mod-water-cycle',
  app_birdwatch: 'seed-app-birdwatch',
  app_waterCycle: 'seed-app-water-cycle',
  act_bird1: 'seed-act-bird-spot',
  act_bird2: 'seed-act-bird-journal',
  act_water1: 'seed-act-water-obs',
  act_water2: 'seed-act-water-cycle-model',

  // Pack 3: Story Builders
  pack_story: 'seed-pack-story-builders',
  mod_folktales: 'seed-mod-folktales',
  mod_poetry: 'seed-mod-poetry',
  app_folktales: 'seed-app-folktales',
  app_poetry: 'seed-app-poetry',
  act_folk1: 'seed-act-retell',
  act_folk2: 'seed-act-rewrite',
  act_poem1: 'seed-act-haiku',
  act_poem2: 'seed-act-shape-poem',

  // Pack 4: Ancient Worlds (premium)
  pack_ancient: 'seed-pack-ancient-worlds',
  mod_egypt: 'seed-mod-ancient-egypt',
  app_egypt: 'seed-app-egypt-maps',
  act_egypt1: 'seed-act-nile-map',
  act_egypt2: 'seed-act-hieroglyphs',

  // Pedagogy overlays
  overlay_cm_bird1: 'seed-overlay-cm-bird-spot',
  overlay_mont_bird1: 'seed-overlay-mont-bird-spot',
};

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

// ─── Nature Explorers Pack ──────────────────────────────────────────────────

async function seedNatureExplorers() {
  console.log('\n── Nature Explorers Pack');

  // Activities
  await upsert({
    _id: IDS.act_bird1,
    _type: 'activity',
    title: 'Backyard Bird Spotting',
    slug: { _type: 'slug', current: 'backyard-bird-spotting' },
    approach: ref(IDS.app_birdwatch),
    instructions: blockText('Set up a bird-watching station with binoculars and a field guide. Sit quietly for 15 minutes and record every bird you see or hear. Note colour, size, beak shape, and behaviour.'),
    materials: [
      { _key: 'm-1', name: 'Binoculars', required: false },
      { _key: 'm-2', name: 'Field guide or phone app', required: true },
      { _key: 'm-3', name: 'Notebook and pencil', required: true },
    ],
    duration: { min: 20, max: 30 },
    setting: 'outdoor',
    energyLevel: 'calm',
    modality: 'exploratory',
    observationPrompts: ['Does the learner use specific vocabulary to describe features?', 'Can they identify birds by sound?'],
    capabilityThreads: [ref(IDS.ct_sciObs)],
    status: 'active',
  });
  await upsert({
    _id: IDS.act_bird2,
    _type: 'activity',
    title: 'Bird Behaviour Journal',
    slug: { _type: 'slug', current: 'bird-behaviour-journal' },
    approach: ref(IDS.app_birdwatch),
    instructions: blockText('Create a journal page for each bird observed. Include a sketch, the date, time, weather, and what the bird was doing. Over a week, look for patterns in when and where birds appear.'),
    materials: [
      { _key: 'm-1', name: 'Journal or sketchbook', required: true },
      { _key: 'm-2', name: 'Coloured pencils', required: false },
    ],
    duration: { min: 15, max: 25 },
    setting: 'indoor',
    energyLevel: 'calm',
    modality: 'visual',
    capabilityThreads: [ref(IDS.ct_sciObs), ref(IDS.ct_visualArts)],
    status: 'active',
  });
  await upsert({
    _id: IDS.act_water1,
    _type: 'activity',
    title: 'Water Observation Walk',
    slug: { _type: 'slug', current: 'water-observation-walk' },
    approach: ref(IDS.app_waterCycle),
    instructions: blockText('Walk around your neighbourhood after rain and find water in different states: puddles, steam from hot surfaces, dew on plants, condensation on windows. Photograph or sketch each example.'),
    materials: [{ _key: 'm-1', name: 'Camera or sketchbook', required: true }],
    duration: { min: 20, max: 30 },
    setting: 'outdoor',
    energyLevel: 'active',
    modality: 'exploratory',
    capabilityThreads: [ref(IDS.ct_sciObs)],
    status: 'active',
  });
  await upsert({
    _id: IDS.act_water2,
    _type: 'activity',
    title: 'Build a Water Cycle Model',
    slug: { _type: 'slug', current: 'water-cycle-model' },
    approach: ref(IDS.app_waterCycle),
    instructions: blockText('Use a clear container, warm water, ice cubes, and plastic wrap to create a miniature water cycle. Observe evaporation, condensation, and precipitation over 30 minutes.'),
    materials: [
      { _key: 'm-1', name: 'Clear container', required: true },
      { _key: 'm-2', name: 'Plastic wrap', required: true },
      { _key: 'm-3', name: 'Ice cubes', required: true },
      { _key: 'm-4', name: 'Warm water', required: true },
    ],
    duration: { min: 25, max: 40 },
    setting: 'indoor',
    energyLevel: 'calm',
    modality: 'kinesthetic',
    capabilityThreads: [ref(IDS.ct_sciObs)],
    status: 'active',
  });

  // Approaches
  await upsert({
    _id: IDS.app_birdwatch,
    _type: 'approach',
    title: 'Birdwatching & Journaling',
    slug: { _type: 'slug', current: 'birdwatching-journaling' },
    module: ref(IDS.mod_birdwatch),
    modality: 'exploratory',
    description: 'Patient outdoor observation combined with detailed journaling.',
    activities: [ref(IDS.act_bird1), ref(IDS.act_bird2)],
    status: 'active',
  });
  await upsert({
    _id: IDS.app_waterCycle,
    _type: 'approach',
    title: 'Water Cycle Investigation',
    slug: { _type: 'slug', current: 'water-cycle-investigation' },
    module: ref(IDS.mod_waterCycle),
    modality: 'kinesthetic',
    description: 'Hands-on observation and modelling of water states.',
    activities: [ref(IDS.act_water1), ref(IDS.act_water2)],
    status: 'active',
  });

  // Modules
  await upsert({
    _id: IDS.mod_birdwatch,
    _type: 'module',
    title: 'Backyard Birdwatching',
    slug: { _type: 'slug', current: 'backyard-birdwatching' },
    targetUnderstanding: 'Scientific observation skills developed through patient study of local bird life',
    subjects: ['science'],
    ageRange: { min: 6, max: 10 },
    duration: { min: 35, max: 55 },
    approaches: [ref(IDS.app_birdwatch)],
    capabilityThreads: [ref(IDS.ct_sciObs), ref(IDS.ct_visualArts)],
    status: 'active',
  });
  await upsert({
    _id: IDS.mod_waterCycle,
    _type: 'module',
    title: 'The Water Cycle',
    slug: { _type: 'slug', current: 'the-water-cycle' },
    targetUnderstanding: 'Understanding how water moves through the environment in a continuous cycle',
    subjects: ['science'],
    ageRange: { min: 5, max: 9 },
    duration: { min: 45, max: 70 },
    approaches: [ref(IDS.app_waterCycle)],
    capabilityThreads: [ref(IDS.ct_sciObs)],
    status: 'active',
  });

  // Pack
  await upsert({
    _id: IDS.pack_nature,
    _type: 'pack',
    title: 'Nature Explorers',
    slug: { _type: 'slug', current: 'nature-explorers' },
    description: 'Hands-on field guides, nature journals, and outdoor learning sequences for young naturalists ready to explore the backyard and beyond.',
    subjects: ['science', 'arts'],
    ageRange: { min: 5, max: 10 },
    termWeeks: 4,
    moduleCount: 2,
    totalActivities: 4,
    worldview: 'neutral',
    availability: 'included',
    version: '1.0.0',
    status: 'active',
    modules: [ref(IDS.mod_birdwatch), ref(IDS.mod_waterCycle)],
  });
}

// ─── Story Builders Pack ─────────────────────────────────────────────────────

async function seedStoryBuilders() {
  console.log('\n── Story Builders Pack');

  await upsert({
    _id: IDS.act_folk1,
    _type: 'activity',
    title: 'Retell a Folktale',
    slug: { _type: 'slug', current: 'retell-a-folktale' },
    approach: ref(IDS.app_folktales),
    instructions: blockText('Read a traditional folktale together, then ask your learner to retell it in their own words. Use a story map to identify characters, setting, problem, and resolution.'),
    materials: [{ _key: 'm-1', name: 'Folktale book or printout', required: true }],
    duration: { min: 15, max: 25 },
    setting: 'indoor',
    energyLevel: 'calm',
    modality: 'narrative',
    capabilityThreads: [ref(IDS.ct_narrative)],
    status: 'active',
  });
  await upsert({
    _id: IDS.act_folk2,
    _type: 'activity',
    title: 'Rewrite the Ending',
    slug: { _type: 'slug', current: 'rewrite-the-ending' },
    approach: ref(IDS.app_folktales),
    instructions: blockText('After retelling, ask: "What if the story ended differently?" Write or dictate a new ending that changes the resolution while keeping the same characters.'),
    materials: [{ _key: 'm-1', name: 'Writing materials', required: true }],
    duration: { min: 15, max: 25 },
    setting: 'indoor',
    energyLevel: 'calm',
    modality: 'narrative',
    capabilityThreads: [ref(IDS.ct_narrative)],
    status: 'active',
  });
  await upsert({
    _id: IDS.act_poem1,
    _type: 'activity',
    title: 'Haiku Walk',
    slug: { _type: 'slug', current: 'haiku-walk' },
    approach: ref(IDS.app_poetry),
    instructions: blockText('Go for a short walk and observe nature closely. Return home and write a haiku (5-7-5 syllables) about something you noticed. Clap out syllables to check the count.'),
    materials: [{ _key: 'm-1', name: 'Notebook', required: true }],
    duration: { min: 20, max: 30 },
    setting: 'outdoor',
    energyLevel: 'moderate',
    modality: 'narrative',
    capabilityThreads: [ref(IDS.ct_narrative)],
    status: 'active',
  });
  await upsert({
    _id: IDS.act_poem2,
    _type: 'activity',
    title: 'Shape Poems',
    slug: { _type: 'slug', current: 'shape-poems' },
    approach: ref(IDS.app_poetry),
    instructions: blockText('Choose an object and write a poem in the shape of that object. The words follow the outline, so a poem about a tree would be written in the shape of a tree.'),
    materials: [
      { _key: 'm-1', name: 'Large paper', required: true },
      { _key: 'm-2', name: 'Coloured pens', required: false },
    ],
    duration: { min: 20, max: 30 },
    setting: 'indoor',
    energyLevel: 'calm',
    modality: 'visual',
    capabilityThreads: [ref(IDS.ct_narrative), ref(IDS.ct_visualArts)],
    status: 'active',
  });

  await upsert({
    _id: IDS.app_folktales,
    _type: 'approach',
    title: 'Folktale Exploration',
    slug: { _type: 'slug', current: 'folktale-exploration' },
    module: ref(IDS.mod_folktales),
    modality: 'narrative',
    description: 'Story reading, retelling, and creative rewriting.',
    activities: [ref(IDS.act_folk1), ref(IDS.act_folk2)],
    status: 'active',
  });
  await upsert({
    _id: IDS.app_poetry,
    _type: 'approach',
    title: 'Poetry in Motion',
    slug: { _type: 'slug', current: 'poetry-in-motion' },
    module: ref(IDS.mod_poetry),
    modality: 'narrative',
    description: 'Outdoor observation turned into structured verse forms.',
    activities: [ref(IDS.act_poem1), ref(IDS.act_poem2)],
    status: 'active',
  });

  await upsert({
    _id: IDS.mod_folktales,
    _type: 'module',
    title: 'Folktales Around the World',
    slug: { _type: 'slug', current: 'folktales-around-the-world' },
    targetUnderstanding: 'Understanding story structure through traditional tales from diverse cultures',
    subjects: ['english'],
    ageRange: { min: 5, max: 9 },
    duration: { min: 30, max: 50 },
    approaches: [ref(IDS.app_folktales)],
    capabilityThreads: [ref(IDS.ct_narrative)],
    status: 'active',
  });
  await upsert({
    _id: IDS.mod_poetry,
    _type: 'module',
    title: 'Poetry Workshop',
    slug: { _type: 'slug', current: 'poetry-workshop' },
    targetUnderstanding: 'Using structured verse forms to capture observations and emotions',
    subjects: ['english', 'arts'],
    ageRange: { min: 6, max: 10 },
    duration: { min: 40, max: 60 },
    approaches: [ref(IDS.app_poetry)],
    capabilityThreads: [ref(IDS.ct_narrative), ref(IDS.ct_visualArts)],
    status: 'active',
  });

  await upsert({
    _id: IDS.pack_story,
    _type: 'pack',
    title: 'Story Builders',
    slug: { _type: 'slug', current: 'story-builders' },
    description: 'Oral storytelling, poetry, and creative writing woven together to build comprehension, imaginative expression, and a love of language.',
    subjects: ['english', 'arts'],
    ageRange: { min: 5, max: 10 },
    termWeeks: 4,
    moduleCount: 2,
    totalActivities: 4,
    worldview: 'neutral',
    availability: 'included',
    version: '1.0.0',
    status: 'active',
    modules: [ref(IDS.mod_folktales), ref(IDS.mod_poetry)],
  });
}

// ─── Ancient Worlds Pack (premium) ──────────────────────────────────────────

async function seedAncientWorlds() {
  console.log('\n── Ancient Worlds Pack (premium)');

  await upsert({
    _id: IDS.act_egypt1,
    _type: 'activity',
    title: 'Map the Nile',
    slug: { _type: 'slug', current: 'map-the-nile' },
    approach: ref(IDS.app_egypt),
    instructions: blockText('Using a blank outline map of Egypt, trace the Nile River from its source to the Mediterranean. Label key cities: Memphis, Thebes, Alexandria. Shade the fertile flood plains green and the desert yellow.'),
    materials: [
      { _key: 'm-1', name: 'Blank Egypt map (printed)', required: true },
      { _key: 'm-2', name: 'Coloured pencils', required: true },
    ],
    duration: { min: 20, max: 30 },
    setting: 'indoor',
    energyLevel: 'calm',
    modality: 'visual',
    capabilityThreads: [ref(IDS.ct_narrative)],
    status: 'active',
  });
  await upsert({
    _id: IDS.act_egypt2,
    _type: 'activity',
    title: 'Write in Hieroglyphs',
    slug: { _type: 'slug', current: 'write-in-hieroglyphs' },
    approach: ref(IDS.app_egypt),
    instructions: blockText('Using a hieroglyph reference chart, write your name and a short message using Egyptian symbols. Discuss: why did the Egyptians develop a writing system? What made it different from our alphabet?'),
    materials: [
      { _key: 'm-1', name: 'Hieroglyph reference chart', required: true },
      { _key: 'm-2', name: 'Paper and markers', required: true },
    ],
    duration: { min: 15, max: 25 },
    setting: 'indoor',
    energyLevel: 'calm',
    modality: 'visual',
    capabilityThreads: [ref(IDS.ct_narrative), ref(IDS.ct_visualArts)],
    status: 'active',
  });

  await upsert({
    _id: IDS.app_egypt,
    _type: 'approach',
    title: 'Egypt Through Maps & Writing',
    slug: { _type: 'slug', current: 'egypt-maps-writing' },
    module: ref(IDS.mod_egypt),
    modality: 'visual',
    description: 'Geographical and linguistic exploration of Ancient Egypt.',
    activities: [ref(IDS.act_egypt1), ref(IDS.act_egypt2)],
    status: 'active',
  });

  await upsert({
    _id: IDS.mod_egypt,
    _type: 'module',
    title: 'Ancient Egypt: Land of the Nile',
    slug: { _type: 'slug', current: 'ancient-egypt-nile' },
    targetUnderstanding: 'How geography shaped Ancient Egyptian civilisation and its cultural expressions',
    subjects: ['hass', 'english'],
    ageRange: { min: 8, max: 12 },
    duration: { min: 35, max: 55 },
    approaches: [ref(IDS.app_egypt)],
    capabilityThreads: [ref(IDS.ct_narrative), ref(IDS.ct_visualArts)],
    status: 'active',
  });

  await upsert({
    _id: IDS.pack_ancient,
    _type: 'pack',
    title: 'Ancient Worlds',
    slug: { _type: 'slug', current: 'ancient-worlds' },
    description: 'A rigorous journey through ancient civilisations — Egypt, Greece, Rome, and China — with primary source analysis and critical thinking prompts.',
    subjects: ['hass', 'english'],
    ageRange: { min: 8, max: 12 },
    termWeeks: 6,
    moduleCount: 1,
    totalActivities: 2,
    worldview: 'neutral',
    availability: 'premium',
    version: '1.0.0',
    status: 'active',
    modules: [ref(IDS.mod_egypt)],
  });
}

// ─── Pedagogy Overlays ──────────────────────────────────────────────────────

async function seedPedagogyOverlays() {
  console.log('\n── Pedagogy Overlays');

  await upsert({
    _id: IDS.overlay_cm_bird1,
    _type: 'pedagogyOverlay',
    title: 'Bird Spotting — Charlotte Mason',
    activity: ref(IDS.act_bird1),
    framework: 'charlotte_mason',
    lens: {
      perspective: 'This is a nature study in the purest Charlotte Mason tradition — direct observation of God\'s creation with careful attention to detail.',
      facilitatorTips: 'Encourage narration after the observation period. Ask your learner to describe what they saw in their own words before drawing. A nature journal entry should follow every outdoor session.',
      languageFrame: 'Use "nature study" rather than "science experiment". Emphasise the beauty and wonder of what is observed.',
      watchFor: 'Look for the habit of attention developing — can they sit quietly and observe for the full 15 minutes? This is the foundation of all Charlotte Mason learning.',
    },
    status: 'active',
  });
  await upsert({
    _id: IDS.overlay_mont_bird1,
    _type: 'pedagogyOverlay',
    title: 'Bird Spotting — Montessori',
    activity: ref(IDS.act_bird1),
    framework: 'montessori',
    lens: {
      perspective: 'This activity connects to the Montessori cosmic education — understanding our place within the natural world and the interconnectedness of living things.',
      facilitatorTips: 'Prepare the environment: set out classified cards of local birds beforehand. After observation, invite the child to match what they saw with the prepared materials. Follow the child\'s interest — if they become fascinated by one bird, let that guide the work.',
      languageFrame: 'Use precise scientific terminology — "ornithology", "plumage", "habitat". Children absorb correct vocabulary naturally when it\'s used consistently.',
      watchFor: 'Notice the moment of deep concentration. When the child is fully absorbed in observation, step back and protect that focus.',
    },
    status: 'active',
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Hearth preview seed starting...');
  console.log(`   Project: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}`);
  console.log(`   Dataset: ${process.env.NEXT_PUBLIC_SANITY_DATASET}`);

  await seedNatureExplorers();
  await seedStoryBuilders();
  await seedAncientWorlds();
  await seedPedagogyOverlays();

  console.log('\n✅ Preview seed complete.\n');
}

main().catch((err) => {
  console.error('Preview seed failed:', err);
  process.exit(1);
});
