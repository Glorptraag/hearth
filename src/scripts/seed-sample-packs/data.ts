/**
 * Sample-pack content sketches — published as `status: 'draft'` so they
 * never auto-surface to a real family without an editorial pass.
 *
 * What this file IS:
 *   - Three coherent pack-shaped sketches that exercise the full
 *     Pack → Module → Approach → Activity hierarchy.
 *   - A starting point a Hearth editor (or LLM with editorial brief)
 *     can flesh out before pilot launch.
 *
 * What this file IS NOT:
 *   - Production-ready curriculum content. Activity instructions are
 *     deliberately short; reflection prompts are placeholders; no
 *     Australian Curriculum descriptors are mapped yet.
 *
 * Treat this as scaffolding. Run the seed once, edit in Sanity Studio
 * until each pack reads well, then flip `status: 'published'`.
 */

export type PackSketch = {
  title: string;
  slug: string;
  description: string;
  subjects: ('english' | 'mathematics' | 'science' | 'hass' | 'arts' | 'technologies' | 'hpe' | 'languages')[];
  ageRange: { min: number; max: number };
  termWeeks: number;
  worldview: 'christian-classical' | 'secular' | 'neutral';
  modules: ModuleSketch[];
};

export type ModuleSketch = {
  title: string;
  slug: string;
  targetUnderstanding: string;
  subjects: PackSketch['subjects'];
  ageRange: { min: number; max: number };
  duration: { min: number; max: number }; // minutes per session
  approaches: ApproachSketch[];
};

export type ApproachSketch = {
  title: string;
  slug: string;
  modality: 'kinesthetic' | 'visual' | 'auditory' | 'narrative' | 'social' | 'exploratory';
  description: string;
  activities: ActivitySketch[];
};

export type ActivitySketch = {
  title: string;
  slug: string;
  summary: string;
  instructions: string;
  facilitatorGuidance: { before?: string; during?: string; challenges?: string };
  materials: { name: string; required?: boolean; alternative?: string }[];
  duration: { min: number; max: number };
  setting?: 'indoor' | 'outdoor' | 'either';
  energyLevel?: 'calm' | 'moderate' | 'active';
  modality?: ApproachSketch['modality'];
};

export const SAMPLE_PACKS: PackSketch[] = [
  // ─── Pack 1 ─────────────────────────────────────────────────────────────
  {
    title: 'First Term Foundations',
    slug: 'first-term-foundations',
    description:
      'A 10-week anchor pack for families starting their homeschool rhythm. Mixes early numeracy, read-aloud routines, and backyard nature observation so a parent with no prior planning has something honest to draw on each morning.',
    subjects: ['english', 'mathematics', 'science'],
    ageRange: { min: 5, max: 7 },
    termWeeks: 10,
    worldview: 'neutral',
    modules: [
      {
        title: 'Counting With Real Things',
        slug: 'counting-with-real-things',
        targetUnderstanding:
          'Numbers describe quantities of real objects, not just symbols on a page. Children build a felt sense of "how many" before any worksheet.',
        subjects: ['mathematics'],
        ageRange: { min: 5, max: 7 },
        duration: { min: 15, max: 25 },
        approaches: [
          {
            title: 'Hands and Stones',
            slug: 'hands-and-stones',
            modality: 'kinesthetic',
            description:
              'Counting through movement and tactile manipulation — natural objects, not commercial manipulatives.',
            activities: [
              {
                title: 'Five-Stone Tens',
                slug: 'five-stone-tens',
                summary: 'Group small stones into bundles of ten on a tea towel.',
                instructions:
                  'Collect about 30 small stones from the garden. Sit on a tea towel together. Count the first ten stones into a small pile. Then the next ten. Then the last. Notice that "30" is just three groups of ten. Mix the stones and let the child rebuild the bundles on their own.',
                facilitatorGuidance: {
                  before: 'Pick stones large enough that small hands can hold them comfortably.',
                  during: 'Resist correcting miscounts immediately — let the child notice when a bundle "feels wrong".',
                  challenges:
                    'If the child loses interest, try the same bundling with different objects (buttons, almonds, dry pasta).',
                },
                materials: [
                  { name: '~30 small stones', required: true, alternative: 'buttons, almonds, or dry pasta' },
                  { name: 'tea towel or small mat', required: true },
                ],
                duration: { min: 10, max: 20 },
                setting: 'either',
                energyLevel: 'calm',
                modality: 'kinesthetic',
              },
              {
                title: 'Walking the Number Line',
                slug: 'walking-the-number-line',
                summary: 'Mark numbers 1–20 with chalk and walk them.',
                instructions:
                  'Use chalk to mark numbers 1 through 20 along a hard surface (driveway, footpath). Take turns: one person calls a number, the other walks to it. Try forward, backward, and "the number two more than seven".',
                facilitatorGuidance: {
                  during: 'Watch for the child counting under their breath as they walk — that is the felt-sense forming.',
                },
                materials: [
                  { name: 'chalk', required: true, alternative: 'masking tape and paper for indoors' },
                  { name: 'flat surface 5+ metres long', required: true },
                ],
                duration: { min: 15, max: 25 },
                setting: 'outdoor',
                energyLevel: 'moderate',
                modality: 'kinesthetic',
              },
            ],
          },
          {
            title: 'Numbers as Stories',
            slug: 'numbers-as-stories',
            modality: 'narrative',
            description:
              'Counting embedded in story rhythm — books, finger plays, repeated patterns.',
            activities: [
              {
                title: 'Counting Read-Alouds',
                slug: 'counting-read-alouds',
                summary: 'Read three counting books over the week and notice the patterns.',
                instructions:
                  'Pick three counting picture books (One Is a Drummer, Anno\'s Counting Book, or any from the library). Read one each morning for three days. On the fourth day, ask the child which page from any of the three was their favourite. Re-visit it together.',
                facilitatorGuidance: {
                  before: 'Library hold or local borrow is plenty — no need to buy.',
                },
                materials: [{ name: 'three counting picture books', required: true }],
                duration: { min: 10, max: 15 },
                setting: 'indoor',
                energyLevel: 'calm',
                modality: 'narrative',
              },
            ],
          },
        ],
      },
      {
        title: 'Read-Aloud Anchor',
        slug: 'read-aloud-anchor',
        targetUnderstanding:
          'Daily read-aloud is the simplest, highest-leverage homeschool habit. Children build vocabulary, attention, and shared reference faster from being read to than from any worksheet.',
        subjects: ['english'],
        ageRange: { min: 5, max: 7 },
        duration: { min: 15, max: 25 },
        approaches: [
          {
            title: 'Morning Story',
            slug: 'morning-story',
            modality: 'auditory',
            description: 'A predictable morning anchor — same chair, same time, varied book.',
            activities: [
              {
                title: 'Pick the Week\'s Book',
                slug: 'pick-the-weeks-book',
                summary: 'Co-choose a chapter book Monday; read a chapter each morning.',
                instructions:
                  'On Monday, lay three books out and let the child pick one. Read the first chapter together. Each morning that week, read one more chapter at the same chair, same time. End the week by drawing a picture of the favourite scene.',
                facilitatorGuidance: {
                  during: 'Pause to ask "what do you think happens next?" only once per chapter — over-questioning kills the rhythm.',
                  challenges:
                    'If the child loses interest mid-week, finish the chapter and switch books on Friday — habit beats stubbornness.',
                },
                materials: [
                  { name: 'three age-appropriate chapter books', required: true, alternative: 'three picture books for shorter attention' },
                  { name: 'paper + pencils', required: false },
                ],
                duration: { min: 15, max: 20 },
                setting: 'indoor',
                energyLevel: 'calm',
                modality: 'auditory',
              },
            ],
          },
        ],
      },
    ],
  },

  // ─── Pack 2 ─────────────────────────────────────────────────────────────
  {
    title: 'Outdoor Naturalist',
    slug: 'outdoor-naturalist',
    description:
      'A six-week place-based pack for families with regular access to a backyard, park, or bushland. Children build observation, pattern-finding, and the habit of paying attention to the same place over time.',
    subjects: ['science', 'hass'],
    ageRange: { min: 6, max: 9 },
    termWeeks: 6,
    worldview: 'neutral',
    modules: [
      {
        title: 'My Patch',
        slug: 'my-patch',
        targetUnderstanding:
          'Choosing one small place and revisiting it weekly reveals change that a single visit hides. This is the foundation of every naturalist tradition.',
        subjects: ['science'],
        ageRange: { min: 6, max: 9 },
        duration: { min: 20, max: 40 },
        approaches: [
          {
            title: 'Watching the Patch',
            slug: 'watching-the-patch',
            modality: 'exploratory',
            description: 'Repeated observation of a single chosen square metre.',
            activities: [
              {
                title: 'Map a Square Metre',
                slug: 'map-a-square-metre',
                summary: 'Stake out one square metre of ground and sketch what you see.',
                instructions:
                  'Pick a patch of ground in the backyard or a park — about a metre square. Mark its corners with sticks or stones. Sit beside it for ten minutes; sketch what you see. Note plants, insects, soil colour, any movement. Date the sketch and tuck it into a folder.',
                facilitatorGuidance: {
                  before: 'Pick a patch you can visit weekly without a long trip.',
                  during: 'Resist naming things — "look at the small one with the legs" is more interesting than "ant".',
                  challenges:
                    'If the child says "nothing\'s happening", set a timer for two minutes of silent watching first.',
                },
                materials: [
                  { name: 'sketchbook or paper folder', required: true },
                  { name: 'pencils', required: true },
                  { name: 'four sticks or stones to mark corners', required: true },
                ],
                duration: { min: 20, max: 35 },
                setting: 'outdoor',
                energyLevel: 'calm',
                modality: 'exploratory',
              },
              {
                title: 'Same Patch, One Week Later',
                slug: 'same-patch-one-week-later',
                summary: 'Return to the same patch and sketch again. Compare.',
                instructions:
                  'Bring last week\'s sketch. Sit at the patch for ten minutes again. Make a new sketch on a new page. Then put the two side by side and circle anything that has changed.',
                facilitatorGuidance: {
                  during:
                    'Ask "what is different?" — let the child notice rather than telling them. The answers are sometimes surprising (soil colour after rain, ant trails moved).',
                },
                materials: [
                  { name: 'previous week\'s sketch', required: true },
                  { name: 'sketchbook + pencils', required: true },
                ],
                duration: { min: 20, max: 30 },
                setting: 'outdoor',
                energyLevel: 'calm',
                modality: 'exploratory',
              },
            ],
          },
        ],
      },
      {
        title: 'Weather Watch',
        slug: 'weather-watch',
        targetUnderstanding:
          'Daily simple weather observation builds pattern-finding and a felt sense of seasons.',
        subjects: ['science', 'hass'],
        ageRange: { min: 6, max: 9 },
        duration: { min: 5, max: 10 },
        approaches: [
          {
            title: 'Backyard Weather Log',
            slug: 'backyard-weather-log',
            modality: 'visual',
            description: 'Three-column daily log: temperature, sky, wind.',
            activities: [
              {
                title: 'Five-Minute Morning Weather',
                slug: 'five-minute-morning-weather',
                summary: 'Each morning for two weeks, log temperature, sky, and wind.',
                instructions:
                  'Make a three-column page in a notebook. Each morning at the same time, step outside, look up, feel the air. Write the temperature (an outdoor thermometer if you have one, otherwise "warm/cool/cold"), draw the sky in a small circle, and note the wind ("still / breeze / gusty"). After two weeks, look back at the patterns.',
                facilitatorGuidance: {
                  during:
                    'The child writes; you handle the thermometer reading until the child can read numbers reliably.',
                },
                materials: [
                  { name: 'notebook + pencil', required: true },
                  { name: 'outdoor thermometer', required: false, alternative: 'a felt-sense scale' },
                ],
                duration: { min: 5, max: 10 },
                setting: 'outdoor',
                energyLevel: 'calm',
                modality: 'visual',
              },
            ],
          },
        ],
      },
    ],
  },

  // ─── Pack 3 ─────────────────────────────────────────────────────────────
  {
    title: 'Storytellers',
    slug: 'storytellers',
    description:
      'A six-week pack for families with children who love books but want to make their own. Story shape, character, performance, and shared family lore.',
    subjects: ['english', 'arts'],
    ageRange: { min: 7, max: 10 },
    termWeeks: 6,
    worldview: 'neutral',
    modules: [
      {
        title: 'Shape of a Story',
        slug: 'shape-of-a-story',
        targetUnderstanding:
          'Most stories share a simple shape: someone wants something, something gets in the way, something changes. Children who feel this shape can make their own.',
        subjects: ['english'],
        ageRange: { min: 7, max: 10 },
        duration: { min: 20, max: 35 },
        approaches: [
          {
            title: 'Story Mountain',
            slug: 'story-mountain',
            modality: 'visual',
            description: 'Map a known story onto a five-point mountain shape.',
            activities: [
              {
                title: 'Mountain a Favourite',
                slug: 'mountain-a-favourite',
                summary: 'Pick a known story and map its five-point shape.',
                instructions:
                  'Draw a mountain on a big sheet of paper: foot, climb, peak, descent, foot. Pick a story the child knows well (a film, a book, a family story). Together, place the five points: 1) Who and what they want. 2) The first thing that goes wrong. 3) The hardest moment. 4) The change. 5) The new normal. Talk about each point as you fill it in.',
                facilitatorGuidance: {
                  before: 'Have the story fresh — re-read it the night before if needed.',
                  challenges: 'If the child can\'t locate "the change", that\'s the most useful conversation in the activity.',
                },
                materials: [
                  { name: 'big sheet of paper (A3+)', required: true },
                  { name: 'pencils or markers', required: true },
                ],
                duration: { min: 20, max: 35 },
                setting: 'indoor',
                energyLevel: 'moderate',
                modality: 'visual',
              },
            ],
          },
          {
            title: 'Make Your Own',
            slug: 'make-your-own',
            modality: 'narrative',
            description: 'Use the same five-point shape to invent a tiny story.',
            activities: [
              {
                title: 'Five-Point Story',
                slug: 'five-point-story',
                summary: 'Invent a five-point story; tell it aloud at dinner.',
                instructions:
                  'On the same mountain shape from the earlier activity, invent a new story. Choose a character (anything — a teaspoon, a wombat, a grandmother). Fill in the five points together. At dinner, the child tells the story aloud. The grown-ups listen.',
                facilitatorGuidance: {
                  during:
                    'Help with structure questions ("what does the teaspoon want?") not vocabulary. The child\'s words are the point.',
                },
                materials: [
                  { name: 'paper + pencils', required: true },
                ],
                duration: { min: 25, max: 40 },
                setting: 'indoor',
                energyLevel: 'moderate',
                modality: 'narrative',
              },
            ],
          },
        ],
      },
    ],
  },
];
