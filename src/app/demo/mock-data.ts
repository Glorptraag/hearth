/**
 * Mock data for demo mode.
 * Single source of truth for all demo screens.
 * Shapes match real server responses — no API calls, no Sanity, no DB.
 */

// ─── Relative Dates ──────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
const fourDaysAgo = new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0];
const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
const sixDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0];
const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0];
const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
const twentyOneDaysAgo = new Date(Date.now() - 21 * 86400000).toISOString().split('T')[0];

// ─── Family ──────────────────────────────────────────────────────────────────

export const mockFamily = {
  id: 1,
  familyName: 'Douglas',
  clerkUserId: 'demo',
  onboardingComplete: true,
};

// ─── Learners ────────────────────────────────────────────────────────────────

export const mockLearners = [
  {
    id: '1',
    name: 'Isla',
    dateOfBirth: '2017-04-12',
    shapeIcon: '🌟',
    colourToken: 'rose',
    displayOrder: 0,
  },
  {
    id: '2',
    name: 'Archie',
    dateOfBirth: '2020-09-03',
    shapeIcon: '🦋',
    colourToken: 'blue',
    displayOrder: 1,
  },
];

// ─── Type Definitions ────────────────────────────────────────────────────────

interface Activity {
  id: string;
  title: string;
  summary: string;
  instructions: string;
  facilitatorGuidance: {
    before: string;
    during: string;
    challenges: string;
  };
  materials: Array<{
    name: string;
    required: boolean;
    alternative?: string;
  }>;
  duration: { min: number; max: number };
  setting: 'indoor' | 'outdoor' | 'either';
  energyLevel: 'calm' | 'moderate' | 'active';
  modality: 'kinesthetic' | 'visual' | 'auditory' | 'reading';
  observationPrompts: string[];
}

interface Approach {
  id: string;
  title: string;
  modality: 'kinesthetic' | 'visual' | 'auditory' | 'reading';
  description: string;
  activities: Activity[];
}

interface Module {
  id: string;
  title: string;
  slug: string;
  targetUnderstanding: string;
  subjects: string[];
  ageRange: { min: number; max: number };
  duration: { min: number; max: number };
  status: 'active';
  approaches: Approach[];
}

interface Pack {
  id: string;
  title: string;
  slug: string;
  description: string;
  subjects: string[];
  moduleCount: number;
  ageRange: { min: number; max: number };
  status: 'active';
  imageEmoji: string;
}

interface AssessmentQuestion {
  id: string;
  text: string;
  observableIndicator: string;
}

interface Badge {
  id: string;
  title: string;
  emoji: string;
  description: string;
  threadName: string;
  threshold: number;
  assessmentQuestions: AssessmentQuestion[];
}

interface CapabilityThread {
  threadId: string;
  threadName: string;
  domain: 'literacy' | 'numeracy' | 'science' | 'humanities' | 'arts' | 'wellbeing';
  observationCount: number;
  suggestedTier: 'emerging' | 'developing' | 'demonstrating';
  lastEvidenceDate: string;
  recentGrowth: boolean;
}

interface AIEnrichment {
  summary: string;
  capabilityThreads: string[];
  curriculumLinks: string[];
}

interface PortfolioEntry {
  id: string;
  title: string;
  description: string;
  dateOccurred: string;
  subjects: string[];
  learnerIds: string[];
  aiEnrichment: AIEnrichment;
  evidenceType: 'photo' | 'note' | 'document' | 'artwork';
  status: 'complete';
}

interface LearnerProfile {
  about: string;
  interests: string[];
  strengths: string[];
  workingStyle: string;
  facilitatorNotes: string;
}

// ─── Modules ─────────────────────────────────────────────────────────────────

export const mockModules: Module[] = [
  {
    id: 'mod-nature-2',
    title: 'Nature Explorers: Creek Life',
    slug: 'nature-explorers-creek-life',
    targetUnderstanding:
      'Children will understand freshwater ecosystems and the organisms that inhabit creeks and waterways, developing observational skills and scientific curiosity.',
    subjects: ['science', 'arts'],
    ageRange: { min: 5, max: 10 },
    duration: { min: 45, max: 60 },
    status: 'active',
    approaches: [
      {
        id: 'app-nature-kinesthetic',
        title: 'Creek Exploration Walk',
        modality: 'kinesthetic',
        description: 'Direct outdoor exploration of a local creek, observing plants, animals, and water features firsthand.',
        activities: [
          {
            id: 'act-creek-walk',
            title: 'Banksia Brook Investigation',
            summary: 'A hands-on creek exploration where children observe flora and fauna in their natural habitat.',
            instructions:
              'Walk to a local creek or waterway early morning. Take hand lenses and collection containers. Look for water boatmen, tadpoles, and waterweed. Collect a leaf from a banksia tree and compare with field guide. Sketch one plant or animal found. Return samples to the water. Journal observations.',
            facilitatorGuidance: {
              before: 'Scout the location beforehand. Bring first aid and water. Dress for muddy conditions. Have a simple creek field guide printed.',
              during:
                'Let children lead discovery. Ask: "What patterns do you see?" "How do these creatures move?" "Why might this plant grow here?" Support identification without rushing to answers.',
              challenges:
                'Cold water may inhibit younger ones. Bring towels. Some kids fear insects—validate and explore gently. Limited visibility in murky creeks—wade in shallow areas first.',
            },
            materials: [
              { name: 'Hand lenses (2-3)', required: true },
              { name: 'Clear collection containers', required: true },
              { name: 'Field guide to Australian waterbugs', required: false, alternative: 'Printed photos of local species' },
              { name: 'Notebook and pencil', required: true },
              { name: 'Towels', required: true },
              { name: 'Waders or old shoes', required: false },
            ],
            duration: { min: 45, max: 60 },
            setting: 'outdoor',
            energyLevel: 'active',
            modality: 'kinesthetic',
            observationPrompts: [
              'Describe the texture of the creek bed.',
              'How many different insects can you spot?',
              'Why do you think water plants grow there?',
              'How does the banksia look different from other trees?',
            ],
          },
          {
            id: 'act-creek-sketch',
            title: 'Waterside Sketching & Recording',
            summary: 'Children sit by the creek and sketch what they observe, building observational drawing skills.',
            instructions:
              'Find a comfortable spot by the water. Spend 15-20 minutes sketching one living thing you observe: a water beetle, a leaf, ripples on the water. Label your sketch with words or arrows. Note colours, patterns, textures. If comfortable, try a "bug\'s eye view" by lying on the bank and drawing what you see from ground level.',
            facilitatorGuidance: {
              before: 'Bring lightweight clipboards. Have pencils and markers ready. Suggest subjects but let curiosity guide choices.',
              during:
                'Encourage detailed observation. "What lines make up this leaf?" "How does light hit the water?" Sketching is about seeing, not artistic skill.',
              challenges:
                'Windier days make drawing tricky—choose a sheltered spot. Younger children may need hand-over-hand support. Restless energy—offer nature-themed fidget prompts.',
            },
            materials: [
              { name: 'Clipboard with clip', required: true },
              { name: 'Paper (A4 or larger)', required: true },
              { name: 'Pencils and erasers', required: true },
              { name: 'Coloured pencils or markers', required: false },
              { name: 'Magnifying glass', required: false },
            ],
            duration: { min: 20, max: 30 },
            setting: 'outdoor',
            energyLevel: 'calm',
            modality: 'visual',
            observationPrompts: [
              'What shape is this leaf?',
              'Where is the light coming from?',
              'What colours do you really see?',
            ],
          },
        ],
      },
      {
        id: 'app-nature-visual',
        title: 'Creek Ecosystem Poster Study',
        modality: 'visual',
        description: 'Indoor exploration of creek ecosystems using visual aids, diagrams, and reference materials.',
        activities: [
          {
            id: 'act-ecosystem-poster',
            title: 'Build a Creek Life Poster',
            summary: 'Children create a visual diagram of a creek ecosystem showing producer, consumer, and decomposer relationships.',
            instructions:
              'Draw a large poster showing the creek and its inhabitants. Include: water surface, rocks, weed, banksia tree (roots visible). Place labels: tadpole, water beetle, minnow, snail, plant matter. Draw arrows showing "who eats what." Colour it.',
            facilitatorGuidance: {
              before: 'Have a printed reference image of a creek food web. Discuss: "What do you think fish eat?"',
              during:
                'Guide the arrow-drawing. Is energy flowing correctly? Does a beetle really eat a banksia leaf? Validate all guesses then refine together.',
              challenges:
                'Complexity can feel abstract. Relate to home: "Our compost heap is a tiny ecosystem." Keep focus on local creek.',
            },
            materials: [
              { name: 'Large paper or poster board (A1 or similar)', required: true },
              { name: 'Coloured pencils, markers, or paints', required: true },
              { name: 'Ruler (for arrows)', required: false },
              { name: 'Reference images of creek organisms', required: true },
              { name: 'Glue stick and cut-out images', required: false, alternative: 'Hand-drawn illustrations' },
            ],
            duration: { min: 30, max: 45 },
            setting: 'indoor',
            energyLevel: 'moderate',
            modality: 'visual',
            observationPrompts: [
              'What does this organism eat?',
              'Where does energy enter the ecosystem?',
              'What would happen if there were no plants?',
            ],
          },
          {
            id: 'act-ecosystem-compare',
            title: 'Compare Creek Habitats Across Seasons',
            summary: 'Study photographs of the same creek location in different seasons to understand ecological change.',
            instructions:
              'Look at four images: creek in spring (fast-flowing), summer (slower), autumn (fallen leaves), winter (cooler). For each season, predict: Water speed? Animal count? Food available? Make a chart.',
            facilitatorGuidance: {
              before: 'Gather 4 simple seasonal images. If possible, use photos from the same local creek taken 3 months apart.',
              during:
                'Compare and contrast. "Why does water move faster in spring?" Introduce concepts: snowmelt, growing season, hibernation.',
              challenges:
                'Seasonal thinking requires pattern recognition. Use local references: "When do wattles flower here?"',
            },
            materials: [
              { name: 'Photographs or drawings (4 seasons)', required: true },
              { name: 'Paper for chart', required: true },
              { name: 'Pencils', required: true },
              { name: 'Calendar showing local seasons', required: false },
            ],
            duration: { min: 25, max: 35 },
            setting: 'indoor',
            energyLevel: 'calm',
            modality: 'visual',
            observationPrompts: [
              'What changes between seasons?',
              'Why do you think animals disappear in winter?',
              'What would happen if it never rained?',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'mod-kitchen-1',
    title: 'Kitchen Mathematics: Fractions in Action',
    slug: 'kitchen-mathematics-fractions',
    targetUnderstanding:
      'Children will develop practical understanding of fractions through measuring, combining, and dividing ingredients in cooking contexts.',
    subjects: ['mathematics'],
    ageRange: { min: 6, max: 10 },
    duration: { min: 30, max: 45 },
    status: 'active',
    approaches: [
      {
        id: 'app-kitchen-kinesthetic',
        title: 'Fractions Baking',
        modality: 'kinesthetic',
        description: 'Hands-on cooking using recipe doubling and halving to develop fraction sense.',
        activities: [
          {
            id: 'act-banana-bread',
            title: 'Banana Bread Recipe: Doubling & Halving',
            summary: 'Follow a recipe and adjust quantities by doubling or halving, physically experiencing fraction multiplication.',
            instructions:
              'Start with a simple banana bread recipe: 1 cup flour, 1/2 cup sugar, 1/4 cup butter, 2 eggs, 3 bananas. Practise halving each ingredient. Record the halved amounts. Then measure out full recipe. Mix, bake. Discuss: "If we doubled the recipe, how much flour would we need?"',
            facilitatorGuidance: {
              before:
                'Print recipe with space for writing adjustments. Have measuring cups clearly marked: 1 cup, 1/2, 1/4. Cold oven while measuring.',
              during:
                'Let children handle the measuring cups. "This cup holds 1. How many of the half-cup would fill it?" Hands-on is the point, not speed.',
              challenges:
                'Converting larger fractions stretches understanding. Start with simple halves/quarters. Some children get distracted—anchor: "We can only bake if measurements are right."',
            },
            materials: [
              { name: 'Recipe printed with space to annotate', required: true },
              { name: 'Measuring cups (1, 1/2, 1/4)', required: true },
              { name: 'Measuring spoons', required: true },
              { name: 'Mixing bowls', required: true },
              { name: 'Ingredients (flour, sugar, butter, eggs, bananas)', required: true },
              { name: 'Baking tin', required: true },
              { name: 'Oven access', required: true },
            ],
            duration: { min: 30, max: 45 },
            setting: 'indoor',
            energyLevel: 'moderate',
            modality: 'kinesthetic',
            observationPrompts: [
              'What is half of 1 cup?',
              'If the recipe makes 12 pieces and we eat half, how many are left?',
              'How would the recipe change if we had only 1 banana instead of 3?',
            ],
          },
          {
            id: 'act-pizza-fractions',
            title: 'Pizza Slicing & Fraction Notation',
            summary: 'Divide a pizza (real or paper) into equal slices and name the fractions.',
            instructions:
              'Make or obtain a circular pizza. Ask: "How can we share this fairly between 2 people?" (Cut in half.) "What if 4 people?" (Quarters.) "What if 8?" (Eighths.) Repeat with multiple pizzas. Record fractions: 1/2, 1/4, 1/8. Compare: "Which is bigger, 1/2 or 1/4?"',
            facilitatorGuidance: {
              before: 'Paper pizza discs work fine (draw circles on paper, decorate with markers). Real pizza adds sensory richness but is optional.',
              during:
                'Emphasize equal pieces. An unequal cut is not a "half". Use language: "I gave you 1 piece out of 4 equal pieces, so you got 1/4 of the pizza."',
              challenges:
                'Comparing fractions requires visual reference. Use the pizza itself—lay 1/4 pieces next to the 1/2 piece. "See, 1/2 is bigger?"',
            },
            materials: [
              { name: 'Pizza (homemade or store-bought) or paper circle', required: true },
              { name: 'Pizza cutter or knife', required: true },
              { name: 'Paper for recording fractions', required: true },
              { name: 'Pencils and colours', required: false },
            ],
            duration: { min: 20, max: 30 },
            setting: 'indoor',
            energyLevel: 'moderate',
            modality: 'kinesthetic',
            observationPrompts: [
              'Is this half bigger than that quarter?',
              'How many eighths make a whole pizza?',
              'If you eat 2 slices of a 4-slice pizza, what fraction did you eat?',
            ],
          },
        ],
      },
      {
        id: 'app-kitchen-reading',
        title: 'Recipe Reading & Notation',
        modality: 'reading',
        description: 'Explore how recipes use fraction notation and practice reading measuring language.',
        activities: [
          {
            id: 'act-recipe-hunt',
            title: 'Find Fractions in Real Recipes',
            summary: 'Collect family recipes and circle all the fraction measurements.',
            instructions:
              'Ask family for 3-4 favourite recipes. Circle or highlight every fraction you see. Make a list: How many 1/2 measurements? How many 1/4? Any 1/3 or 3/4? Create a tally chart. Which fraction appears most often in cooking?',
            facilitatorGuidance: {
              before: 'Gather written recipes. Having variety—a cake, a stew, a biscuit—shows fractions across cooking styles.',
              during:
                'Ask: "Why do recipes use fractions?" (Precision, sharing, scaling.) "Is 1/2 of an egg possible?" (Explores egg-free baking.)',
              challenges:
                'Some children confuse measurement (1/2 cup) with serving size (serves 4). Clarify: "This measures how much flour. This tells us how many people eat it."',
            },
            materials: [
              { name: 'Printed or written recipes (3-4)', required: true },
              { name: 'Coloured pencils or highlighters', required: true },
              { name: 'Paper for tally chart', required: true },
            ],
            duration: { min: 20, max: 30 },
            setting: 'indoor',
            energyLevel: 'calm',
            modality: 'reading',
            observationPrompts: [
              'What fractions appear in recipes?',
              'Do all recipes use the same fractions?',
              'What fraction appears most often?',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'mod-ancient-1',
    title: 'Ancient Worlds: Egypt',
    slug: 'ancient-worlds-egypt',
    targetUnderstanding:
      'Children will explore the geography, culture, and achievements of Ancient Egypt, understanding how civilizations adapt to their environments.',
    subjects: ['hass', 'arts'],
    ageRange: { min: 7, max: 12 },
    duration: { min: 40, max: 60 },
    status: 'active',
    approaches: [
      {
        id: 'app-egypt-visual',
        title: 'Maps & Geography of the Nile',
        modality: 'visual',
        description: 'Visual exploration of Egypt\'s geography and the Nile\'s role in civilization.',
        activities: [
          {
            id: 'act-nile-map',
            title: 'Trace the Nile: Blank Map Activity',
            summary: 'Using a blank map of Egypt, trace the Nile and label key cities and landmarks.',
            instructions:
              'Print a blank map of Egypt. Trace the Nile River from south to north. Label: Aswan, Luxor, Cairo, Nile Delta, Mediterranean Sea. Colour the Nile blue. Shade the desert regions gold. Mark pyramids (Giza, Saqqara) with symbols. Add a compass rose. Title: "Ancient Egypt."',
            facilitatorGuidance: {
              before: 'Have a reference map visible. Discuss: "What does a river provide?" (Water, fertile soil, transport.)',
              during:
                'Guide the tracing gently. Celebrate effort. "Now find where the pyramids are. Why build them near Cairo?"',
              challenges:
                'Spelling Egyptian city names can frustrate. Pronunciation guides help: Aswan (AS-wahn), Luxor (LUX-or). Some children rush through—anchor: "Each label tells a story."',
            },
            materials: [
              { name: 'Blank map of Egypt (printed)', required: true },
              { name: 'Coloured pencils or markers', required: true },
              { name: 'Ruler (for compass rose)', required: false },
              { name: 'Reference map of Ancient Egypt', required: true },
              { name: 'Eraser', required: false },
            ],
            duration: { min: 25, max: 35 },
            setting: 'indoor',
            energyLevel: 'calm',
            modality: 'visual',
            observationPrompts: [
              'Why do you think cities grew along the river?',
              'What does the desert look like on the map?',
              'How far is Cairo from the Nile Delta?',
            ],
          },
          {
            id: 'act-pyramid-scale',
            title: 'Pyramid Scale & Perspective',
            summary: 'Research pyramid dimensions and create a scale drawing showing their enormous size.',
            instructions:
              'The Great Pyramid of Giza is about 146 metres tall. Draw your house or school to scale, then draw a tiny pyramid next to it on the same scale. Or measure your house and write the Giza pyramid\'s height in those units. Create a visual comparison poster.',
            facilitatorGuidance: {
              before: 'Have pyramid dimension facts ready. Discuss scale: "A model train represents a big train."',
              during:
                'Ask perspective questions: "Can you imagine something 146m tall?" Use familiar references: "That\'s taller than a 40-storey building."',
              challenges:
                'Large numbers feel abstract. Use pacing: "If a pyramid took 20 years to build and 100 people worked every day, how many person-days is that?"',
            },
            materials: [
              { name: 'Graph paper (for scale drawing)', required: true },
              { name: 'Ruler and pencil', required: true },
              { name: 'Calculator (optional)', required: false },
              { name: 'Pyramid dimension reference', required: true },
            ],
            duration: { min: 20, max: 30 },
            setting: 'indoor',
            energyLevel: 'calm',
            modality: 'visual',
            observationPrompts: [
              'How tall is the pyramid compared to buildings you know?',
              'How many houses high is the pyramid?',
              'Why would people build something so enormous?',
            ],
          },
        ],
      },
      {
        id: 'app-egypt-reading',
        title: 'Ancient Egypt Stories & Culture',
        modality: 'reading',
        description: 'Explore Egyptian culture, mythology, and daily life through reading and storytelling.',
        activities: [
          {
            id: 'act-egypt-myths',
            title: 'Egyptian Gods & Myths Read-Aloud',
            summary: 'Read or listen to stories of Egyptian deities and record key details.',
            instructions:
              'Choose a simple book about Egyptian gods (Ra, Isis, Thoth). Read aloud together. After each myth, ask: Who is this god? What are they in charge of? What animal represents them? Create a reference sheet: God Name | Symbol | Domain.',
            facilitatorGuidance: {
              before: 'Choose age-appropriate retellings. Print or have the book ready.',
              during:
                'Pause to discuss: "Why did they connect the sun to a god?" "What does this tell us about what Egyptians valued?"',
              challenges:
                'Name pronunciation can feel unwelcoming. Pronunciation guides ease this. Some children disconnect myth from history—clarify: "Egyptians believed these stories. That belief shaped what they built."',
            },
            materials: [
              { name: 'Age-appropriate book on Egyptian mythology', required: true },
              { name: 'Paper for notes', required: true },
              { name: 'Pencils and colours', required: false },
              { name: 'Pronunciation guide for deity names', required: false },
            ],
            duration: { min: 25, max: 40 },
            setting: 'indoor',
            energyLevel: 'calm',
            modality: 'reading',
            observationPrompts: [
              'What qualities did Egyptians see in their gods?',
              'Which myth was your favourite?',
              'Why would a symbol like an ibis represent Thoth?',
            ],
          },
          {
            id: 'act-egypt-daily-life',
            title: 'Daily Life in Ancient Egypt: Imagine a Day',
            summary: 'Read about roles and routines in Ancient Egypt, then write or draw a "day in the life".',
            instructions:
              'Read about different roles: a farmer, a scribe, a noble, a priest. Choose one. Write or draw a day in their life: What time do they wake? What do they eat? What tasks fill their day? How do they dress? What worries them? Create a detailed account (2-3 paragraphs or a comic strip).',
            facilitatorGuidance: {
              before: 'Provide reading material about daily life. Have examples: A farmer would wake before dawn, irrigate fields, eat bread and onions.',
              during:
                'Encourage imaginative detail grounded in research: "A scribe would have to practice their letters for hours. What would that feel like?"',
              challenges:
                'Some children over-romanticize or assume modern comforts. Gently ground: "There was no electricity then. How did people see at night?"',
            },
            materials: [
              { name: 'Reading material on Egyptian daily life', required: true },
              { name: 'Paper (for writing or drawing)', required: true },
              { name: 'Pencils and coloured pencils', required: true },
              { name: 'Optional: comic strip template', required: false },
            ],
            duration: { min: 30, max: 45 },
            setting: 'indoor',
            energyLevel: 'calm',
            modality: 'reading',
            observationPrompts: [
              'What was hard about daily life then?',
              'What do you think they would think of your life?',
              'Which role would you have chosen and why?',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'mod-reading-1',
    title: 'Story Companions: Charlotte\'s Web',
    slug: 'story-companions-charlottes-web',
    targetUnderstanding:
      'Children will deepen their reading comprehension, discussion skills, and emotional understanding through exploring themes of friendship, mortality, and legacy in classic literature.',
    subjects: ['english'],
    ageRange: { min: 6, max: 9 },
    duration: { min: 20, max: 30 },
    status: 'active',
    approaches: [
      {
        id: 'app-reading-auditory',
        title: 'Read-Aloud & Discussion',
        modality: 'auditory',
        description: 'Shared reading experience with pauses for discussion and reflection.',
        activities: [
          {
            id: 'act-charlotte-readaloud',
            title: 'Charlotte\'s Web: Read-Aloud Sessions',
            summary: 'Read chapters aloud, pausing to discuss character feelings and story developments.',
            instructions:
              'Read 1-2 chapters per session (15-20 minutes). After each section, pause and discuss: "How does Wilbur feel about Charlotte?" "Why did Templeton help?" "What do you think will happen next?" Encourage questions and predictions. Note favourite passages. Return to them later.',
            facilitatorGuidance: {
              before: 'Read ahead to identify emotional moments and good stopping points. Have the book marked.',
              during:
                'Use voices and pacing to bring characters alive. Read Charlotte\'s messages with reverence. Pause for reactions. Children may want to re-read favourite parts—honor that.',
              challenges:
                'Charlotte\'s death will evoke grief. Validate: "It\'s sad, and that\'s okay. The story gives us time to say goodbye." Younger kids may need reassurance about spiders and death.',
            },
            materials: [
              { name: 'Charlotte\'s Web (book)', required: true },
              { name: 'Bookmarks or tabs', required: false },
              { name: 'Comfortable seating', required: true },
              { name: 'Optional: recording device to listen to scenes later', required: false },
            ],
            duration: { min: 20, max: 30 },
            setting: 'indoor',
            energyLevel: 'calm',
            modality: 'auditory',
            observationPrompts: [
              'How do you think Wilbur feels right now?',
              'Why did Charlotte help Wilbur?',
              'What would you do if you were Templeton?',
              'What does Charlotte\'s friendship mean?',
            ],
          },
          {
            id: 'act-charlotte-soundscape',
            title: 'Character Voices & Soundscape Activity',
            summary: 'Create sound effects and vocal interpretations of characters to deepen understanding.',
            instructions:
              'Assign characters: someone reads as Wilbur, Charlotte, Templeton, the Goose. Use different voices—Charlotte is wise and soft, Templeton is sneaky and quick. Add sound effects: barn creaking, web spinning, fair crowd murmuring. Record a short scene (2-3 minutes).',
            facilitatorGuidance: {
              before: 'Choose a short, simple scene (e.g., Charlotte first meets Wilbur, or weaving "Some Pig"). Have parts printed.',
              during:
                'Encourage exaggerated voices. "Charlotte is wise—how does wise sound?" Celebrate effort and creativity.',
              challenges:
                'Some children feel shy about voices. Offer choices: "You can read, or you can be sound effects." Recording can feel exposing—it\'s optional.',
            },
            materials: [
              { name: 'Printed scene dialogue', required: true },
              { name: 'Optional: simple sound-making objects (spoons, crinkly paper)', required: false },
              { name: 'Optional: recording device (phone, tablet)', required: false },
              { name: 'Comfortable, informal space', required: true },
            ],
            duration: { min: 20, max: 30 },
            setting: 'indoor',
            energyLevel: 'moderate',
            modality: 'auditory',
            observationPrompts: [
              'How would Charlotte\'s voice sound? Why?',
              'What emotions do the characters have?',
              'What sounds belong in this scene?',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'mod-art-1',
    title: 'Colour & Light: Watercolour Landscapes',
    slug: 'colour-light-watercolour',
    targetUnderstanding:
      'Children will explore how colour mixing, light, and perspective create mood and depth in landscape painting.',
    subjects: ['arts'],
    ageRange: { min: 5, max: 12 },
    duration: { min: 30, max: 45 },
    status: 'active',
    approaches: [
      {
        id: 'app-art-kinesthetic',
        title: 'Watercolour Painting Process',
        modality: 'kinesthetic',
        description: 'Hands-on watercolour painting with exploration of colour mixing and water control.',
        activities: [
          {
            id: 'act-colour-mixing',
            title: 'Colour Mixing Experiments',
            summary: 'Discover secondary and tertiary colours by mixing primary watercolours.',
            instructions:
              'Set up watercolours with primary colours (red, blue, yellow). Paint a chart: 3 primary colour squares. Below, mix red + blue (purple), yellow + blue (green), yellow + red (orange). Then mix: red + green (brown), blue + yellow + a bit of red (muted green). Label each. Does the mixing order matter? What happens if you add more water?',
            facilitatorGuidance: {
              before: 'Have watercolour sets with clearly visible primaries. Paper (watercolour paper or thick mixed-media paper) prevents buckling.',
              during:
                'Let children mix freely. "What happens if you add more water?" Encourage observation: "Is that orange the same as this orange?" Celebrate surprises.',
              challenges:
                'Muddy colours happen when children over-mix. Introduce the concept: "Sometimes new colours happen. Sometimes colours get tired." Frame as discovery.',
            },
            materials: [
              { name: 'Watercolour set with primary colours', required: true },
              { name: 'Watercolour paper or thick paper', required: true },
              { name: 'Two water containers (one for rinsing, one for clean water)', required: true },
              { name: 'Brushes (various sizes)', required: true },
              { name: 'Paper towels', required: true },
              { name: 'Palette (or ceramic plate)', required: false },
            ],
            duration: { min: 25, max: 35 },
            setting: 'indoor',
            energyLevel: 'calm',
            modality: 'kinesthetic',
            observationPrompts: [
              'What colour does red and blue make?',
              'What happens when you add more water?',
              'What happens when you mix all the colours together?',
            ],
          },
          {
            id: 'act-landscape-painting',
            title: 'Landscape with Sky, Distance, Foreground',
            summary: 'Paint a simple landscape exploring depth through colour perspective.',
            instructions:
              'Plan a landscape: sky at top, distant hills in middle, foreground (grass, flowers, trees) at bottom. Paint sky first (light blue, clouds if desired). Paint hills with muted colours (add grey or brown to make them recede). Paint foreground with richer, darker colours and more detail. Step back and look. Does it feel deep?',
            facilitatorGuidance: {
              before: 'Show examples of landscapes with clear foreground/middle ground/background. Discuss: "How do distant mountains look different than nearby trees?"',
              during:
                'Guide the layering: "Paint light first, dark last." If a colour is too bright for distance, lighten it. "Does it feel far away?"',
              challenges:
                'Watercolour dries quickly; working wet-on-wet takes practice. Encourage experimentation: "Let colours blend on the paper." Some children want hyperrealism—validate: "This is how artists see light."',
            },
            materials: [
              { name: 'Watercolour set (or acrylics)', required: true },
              { name: 'Watercolour paper (A4 minimum)', required: true },
              { name: 'Brushes (large and medium)', required: true },
              { name: 'Two water containers', required: true },
              { name: 'Paper towels', required: true },
              { name: 'Reference landscape image', required: false },
            ],
            duration: { min: 30, max: 45 },
            setting: 'indoor',
            energyLevel: 'calm',
            modality: 'kinesthetic',
            observationPrompts: [
              'How do distant hills look different from the foreground?',
              'What colours make things look far away?',
              'What does your eye look at first in this painting?',
            ],
          },
        ],
      },
      {
        id: 'app-art-visual',
        title: 'Landscape Study & Analysis',
        modality: 'visual',
        description: 'Study how artists use colour and light to create mood and depth.',
        activities: [
          {
            id: 'act-artist-study',
            title: 'Analyse a Master Landscape Painting',
            summary: 'Study a landscape by a famous artist and discuss colour choices.',
            instructions:
              'Display a high-quality image of a landscape painting (Monet, Turner, Cézanne, etc.). Ask: What colours did the artist use? Are they realistic or exaggerated? What mood do the colours create? How do you know what\'s far and near? Create a simple analysis: Title | Artist | Colours Used | Mood | How Depth is Shown.',
            facilitatorGuidance: {
              before: 'Choose accessible paintings—Monet\'s water lilies, Turner\'s seascapes, or contemporary illustrators work well. Have the image large and clear.',
              during:
                'Ask open questions: "What colours do you see?" before telling them. Celebrate observations: "You noticed the trees get lighter as they go back—that\'s perspective!"',
              challenges:
                'Abstract or unfamiliar styles might feel confusing. Ground it: "This artist was painting light and feeling, not just things." Validate: "Art that feels strange is often showing us something new."',
            },
            materials: [
              { name: 'High-quality image of landscape painting', required: true },
              { name: 'Paper for notes', required: true },
              { name: 'Pencils and colours', required: false },
              { name: 'Information about the artist (optional)', required: false },
            ],
            duration: { min: 20, max: 30 },
            setting: 'indoor',
            energyLevel: 'calm',
            modality: 'visual',
            observationPrompts: [
              'What colours did the artist choose?',
              'What mood does this painting have?',
              'How did the artist show distance?',
              'What would you paint from this view?',
            ],
          },
        ],
      },
    ],
  },
];

// ─── Packs ───────────────────────────────────────────────────────────────────

export const mockPacks: Pack[] = [
  {
    id: 'pack-nature',
    title: 'Nature Explorers',
    slug: 'nature-explorers',
    description:
      'A journey through natural environments, from creek ecosystems to bush walks. Children develop observational skills and scientific curiosity through direct exploration.',
    subjects: ['science', 'arts', 'hpe'],
    moduleCount: 8,
    ageRange: { min: 5, max: 12 },
    status: 'active',
    imageEmoji: '🌿',
  },
  {
    id: 'pack-kitchen',
    title: 'Kitchen Classroom',
    slug: 'kitchen-classroom',
    description:
      'Mathematics, nutrition, and culture come alive through cooking and kitchen science. Build confidence with measurements, fractions, and real-world maths.',
    subjects: ['mathematics', 'science'],
    moduleCount: 6,
    ageRange: { min: 5, max: 10 },
    status: 'active',
    imageEmoji: '🍳',
  },
  {
    id: 'pack-stories',
    title: 'Story Companions',
    slug: 'story-companions',
    description:
      'Explore beloved books and stories through read-alouds, discussion, and creative response. Build reading comprehension and emotional literacy.',
    subjects: ['english'],
    moduleCount: 10,
    ageRange: { min: 5, max: 9 },
    status: 'active',
    imageEmoji: '📖',
  },
  {
    id: 'pack-ancient',
    title: 'Ancient Worlds',
    slug: 'ancient-worlds',
    description:
      'Discover civilisations that shaped human history. From Egypt to Rome, explore geography, culture, and human ingenuity across time.',
    subjects: ['hass', 'arts'],
    moduleCount: 8,
    ageRange: { min: 7, max: 12 },
    status: 'active',
    imageEmoji: '🏺',
  },
];

// ─── Badges ──────────────────────────────────────────────────────────────────

export const mockBadges: Badge[] = [
  {
    id: 'b-scientific',
    title: 'Scientific Thinker',
    emoji: '🔬',
    description: 'Demonstrates curiosity, careful observation, and inquiry skills across learning experiences.',
    threadName: 'scientific-thinking',
    threshold: 3,
    assessmentQuestions: [
      {
        id: 'q1',
        text: 'Does the child ask "why" and "how" questions about natural phenomena?',
        observableIndicator: 'Child generates questions about the world; asks follow-up questions.',
      },
      {
        id: 'q2',
        text: 'Can they describe observations in detail using sensory language?',
        observableIndicator: 'Child uses specific words (textures, colours, behaviours) in descriptions.',
      },
      {
        id: 'q3',
        text: 'Do they predict outcomes and test ideas?',
        observableIndicator: 'Child makes predictions before activities; tries multiple approaches.',
      },
      {
        id: 'q4',
        text: 'Can they explain their findings or what they learned?',
        observableIndicator: 'Child articulates connections between observations and understanding.',
      },
    ],
  },
  {
    id: 'b-number-sense',
    title: 'Number Sense Navigator',
    emoji: '🔢',
    description: 'Shows growing confidence with number concepts, measurement, and mathematical reasoning in everyday contexts.',
    threadName: 'mathematical-reasoning',
    threshold: 3,
    assessmentQuestions: [
      {
        id: 'q1',
        text: 'Can they use measurement tools (rulers, cups) with increasing accuracy?',
        observableIndicator: 'Child measures objects or ingredients with minimal guidance; corrects own mistakes.',
      },
      {
        id: 'q2',
        text: 'Do they understand part-whole relationships (fractions, grouping)?',
        observableIndicator: 'Child explains halves, quarters, or groups; shows with objects or drawings.',
      },
      {
        id: 'q3',
        text: 'Can they solve simple word problems or real-life maths scenarios?',
        observableIndicator: 'Child applies maths to cooking, sharing, building; explains thinking.',
      },
      {
        id: 'q4',
        text: 'Do they notice and describe patterns or sequences?',
        observableIndicator: 'Child identifies patterns in nature, music, or number sequences independently.',
      },
    ],
  },
  {
    id: 'b-storyteller',
    title: 'Storyteller',
    emoji: '📖',
    description: 'Engages deeply with stories, expressing ideas through writing, discussion, and creative response.',
    threadName: 'written-communication',
    threshold: 2,
    assessmentQuestions: [
      {
        id: 'q1',
        text: 'Can they retell stories with key details in order?',
        observableIndicator: 'Child summarises plot; recalls character names and important events.',
      },
      {
        id: 'q2',
        text: 'Do they make predictions or infer character feelings?',
        observableIndicator: 'Child predicts "what happens next"; explains why a character acts a certain way.',
      },
      {
        id: 'q3',
        text: 'Can they write simple stories with beginning, middle, end?',
        observableIndicator: 'Child writes or dictates a coherent narrative; shows cause and effect.',
      },
    ],
  },
];

// ─── Capabilities (Capability Threads) ────────────────────────────────────────

export const mockCapabilities: Record<string, CapabilityThread[]> = {
  '1': [
    {
      threadId: 'scientific-thinking',
      threadName: 'Scientific Thinking',
      domain: 'science',
      observationCount: 16,
      suggestedTier: 'developing',
      lastEvidenceDate: today,
      recentGrowth: true,
    },
    {
      threadId: 'mathematical-reasoning',
      threadName: 'Mathematical Reasoning',
      domain: 'numeracy',
      observationCount: 9,
      suggestedTier: 'emerging',
      lastEvidenceDate: yesterday,
      recentGrowth: false,
    },
    {
      threadId: 'written-communication',
      threadName: 'Written Communication',
      domain: 'literacy',
      observationCount: 14,
      suggestedTier: 'developing',
      lastEvidenceDate: today,
      recentGrowth: true,
    },
    {
      threadId: 'creative-expression',
      threadName: 'Creative Expression',
      domain: 'arts',
      observationCount: 11,
      suggestedTier: 'emerging',
      lastEvidenceDate: threeDaysAgo,
      recentGrowth: false,
    },
    {
      threadId: 'critical-thinking',
      threadName: 'Critical Thinking',
      domain: 'humanities',
      observationCount: 8,
      suggestedTier: 'emerging',
      lastEvidenceDate: sevenDaysAgo,
      recentGrowth: false,
    },
    {
      threadId: 'physical-coordination',
      threadName: 'Physical Coordination',
      domain: 'wellbeing',
      observationCount: 5,
      suggestedTier: 'emerging',
      lastEvidenceDate: tenDaysAgo,
      recentGrowth: false,
    },
    {
      threadId: 'oral-communication',
      threadName: 'Oral Communication',
      domain: 'literacy',
      observationCount: 12,
      suggestedTier: 'developing',
      lastEvidenceDate: yesterday,
      recentGrowth: true,
    },
    {
      threadId: 'imagination',
      threadName: 'Imagination & Play',
      domain: 'arts',
      observationCount: 10,
      suggestedTier: 'developing',
      lastEvidenceDate: twoDaysAgo,
      recentGrowth: false,
    },
    {
      threadId: 'spatial-reasoning',
      threadName: 'Spatial Reasoning',
      domain: 'numeracy',
      observationCount: 7,
      suggestedTier: 'emerging',
      lastEvidenceDate: fourDaysAgo,
      recentGrowth: false,
    },
    {
      threadId: 'persistence',
      threadName: 'Persistence & Resilience',
      domain: 'wellbeing',
      observationCount: 9,
      suggestedTier: 'developing',
      lastEvidenceDate: yesterday,
      recentGrowth: true,
    },
    {
      threadId: 'collaboration',
      threadName: 'Collaboration & Empathy',
      domain: 'wellbeing',
      observationCount: 13,
      suggestedTier: 'developing',
      lastEvidenceDate: today,
      recentGrowth: false,
    },
    {
      threadId: 'environmental-awareness',
      threadName: 'Environmental Awareness',
      domain: 'science',
      observationCount: 10,
      suggestedTier: 'emerging',
      lastEvidenceDate: threeDaysAgo,
      recentGrowth: true,
    },
    {
      threadId: 'cultural-literacy',
      threadName: 'Cultural Literacy',
      domain: 'humanities',
      observationCount: 6,
      suggestedTier: 'emerging',
      lastEvidenceDate: fiveDaysAgo,
      recentGrowth: false,
    },
    {
      threadId: 'aesthetic-appreciation',
      threadName: 'Aesthetic Appreciation',
      domain: 'arts',
      observationCount: 8,
      suggestedTier: 'emerging',
      lastEvidenceDate: sixDaysAgo,
      recentGrowth: false,
    },
  ],
  '2': [
    {
      threadId: 'mathematical-reasoning',
      threadName: 'Mathematical Reasoning',
      domain: 'numeracy',
      observationCount: 7,
      suggestedTier: 'emerging',
      lastEvidenceDate: today,
      recentGrowth: true,
    },
    {
      threadId: 'physical-coordination',
      threadName: 'Physical Coordination',
      domain: 'wellbeing',
      observationCount: 11,
      suggestedTier: 'developing',
      lastEvidenceDate: yesterday,
      recentGrowth: false,
    },
    {
      threadId: 'oral-communication',
      threadName: 'Oral Communication',
      domain: 'literacy',
      observationCount: 6,
      suggestedTier: 'emerging',
      lastEvidenceDate: twoDaysAgo,
      recentGrowth: false,
    },
    {
      threadId: 'imagination',
      threadName: 'Imagination & Play',
      domain: 'arts',
      observationCount: 9,
      suggestedTier: 'emerging',
      lastEvidenceDate: threeDaysAgo,
      recentGrowth: true,
    },
    {
      threadId: 'collaboration',
      threadName: 'Collaboration & Empathy',
      domain: 'wellbeing',
      observationCount: 8,
      suggestedTier: 'developing',
      lastEvidenceDate: yesterday,
      recentGrowth: false,
    },
    {
      threadId: 'environmental-awareness',
      threadName: 'Environmental Awareness',
      domain: 'science',
      observationCount: 7,
      suggestedTier: 'emerging',
      lastEvidenceDate: tenDaysAgo,
      recentGrowth: false,
    },
    {
      threadId: 'fine-motor-skills',
      threadName: 'Fine Motor Skills',
      domain: 'wellbeing',
      observationCount: 5,
      suggestedTier: 'emerging',
      lastEvidenceDate: fourDaysAgo,
      recentGrowth: false,
    },
    {
      threadId: 'curiosity-exploration',
      threadName: 'Curiosity & Exploration',
      domain: 'science',
      observationCount: 10,
      suggestedTier: 'developing',
      lastEvidenceDate: today,
      recentGrowth: true,
    },
  ],
};

// ─── Portfolio Entries ────────────────────────────────────────────────────────

export const mockPortfolioEntries: PortfolioEntry[] = [
  {
    id: 'e1',
    title: 'Nature journaling at the creek',
    description:
      'We spent the morning sketching banksia pods and recording bird calls. Isla identified three new species using her field guide. Archie collected creek rocks and sorted by size.',
    dateOccurred: today,
    subjects: ['science', 'arts'],
    learnerIds: ['1', '2'],
    aiEnrichment: {
      summary:
        'Both learners engaged in direct observation and classification tasks. Isla demonstrated developing scientific thinking and artistic observation skills. Archie built spatial awareness and scientific vocabulary.',
      capabilityThreads: ['scientific-thinking', 'creative-expression', 'spatial-reasoning'],
      curriculumLinks: ['AC9S1WS02 (observe and describe)', 'AC9A1PA01 (visual communication)'],
    },
    evidenceType: 'photo',
    status: 'complete',
  },
  {
    id: 'e2',
    title: 'Fraction baking — banana bread',
    description:
      'Doubling the recipe gave us great practice with halves and quarters. Archie measured all the wet ingredients independently. Isla calculated portions for serving.',
    dateOccurred: today,
    subjects: ['mathematics', 'science'],
    learnerIds: ['1', '2'],
    aiEnrichment: {
      summary:
        'Hands-on fraction practice in context. Both learners applied measurement skills to a real recipe. Isla showed advanced thinking about scaling and portions.',
      capabilityThreads: ['mathematical-reasoning', 'persistence'],
      curriculumLinks: ['AC9M1A01 (fractions)', 'AC9S1WS02 (measurement)'],
    },
    evidenceType: 'note',
    status: 'complete',
  },
  {
    id: 'e3',
    title: 'Reading aloud — Charlotte\'s Web Ch.7-8',
    description:
      'Isla read two chapters aloud with excellent expression. We discussed friendship and loyalty themes. She predicted what Charlotte might do next.',
    dateOccurred: yesterday,
    subjects: ['english'],
    learnerIds: ['1'],
    aiEnrichment: {
      summary:
        'Strong engagement with text. Isla demonstrated fluent reading, emotional comprehension, and inferential thinking. Growing appreciation for character motivation and narrative arc.',
      capabilityThreads: ['written-communication', 'critical-thinking', 'oral-communication'],
      curriculumLinks: ['AC9E1LT01 (reading comprehension)', 'AC9E1LT04 (character analysis)'],
    },
    evidenceType: 'note',
    status: 'complete',
  },
  {
    id: 'e4',
    title: 'Block building & symmetry',
    description:
      'Archie built a castle with perfect bilateral symmetry, then drew it from above. Great spatial reasoning. He explained why the left and right matched.',
    dateOccurred: twoDaysAgo,
    subjects: ['mathematics', 'arts'],
    learnerIds: ['2'],
    aiEnrichment: {
      summary:
        'Exceptional spatial reasoning and geometric thinking. Archie demonstrated understanding of symmetry through construction and representation. Ready for formal geometry concepts.',
      capabilityThreads: ['spatial-reasoning', 'physical-coordination'],
      curriculumLinks: ['AC9M1SP01 (shape and symmetry)'],
    },
    evidenceType: 'photo',
    status: 'complete',
  },
  {
    id: 'e5',
    title: 'Community garden volunteering',
    description:
      'Both kids helped plant seedlings and learned about composting cycles. Wonderful social interaction with other families. Isla explained nitrogen in soil.',
    dateOccurred: threeDaysAgo,
    subjects: ['science', 'hpe', 'hass'],
    learnerIds: ['1', '2'],
    aiEnrichment: {
      summary:
        'Real-world science application and community engagement. Both learners demonstrated environmental awareness and collaborative skills. Isla showed emerging understanding of soil ecology.',
      capabilityThreads: ['environmental-awareness', 'collaboration', 'scientific-thinking'],
      curriculumLinks: ['AC9S1LW02 (living world)', 'AC9H1KC02 (community)'],
    },
    evidenceType: 'note',
    status: 'complete',
  },
  {
    id: 'e6',
    title: 'History maps — Ancient Egypt',
    description:
      'Isla traced the Nile on a blank map and labelled key cities. Archie coloured the desert regions. Both discussed why settlements cluster along rivers.',
    dateOccurred: fourDaysAgo,
    subjects: ['hass'],
    learnerIds: ['1', '2'],
    aiEnrichment: {
      summary:
        'Geography and historical thinking. Both learners engaged with spatial reasoning and human-environment relationships. Isla showed emerging understanding of settlement patterns.',
      capabilityThreads: ['critical-thinking', 'spatial-reasoning', 'cultural-literacy'],
      curriculumLinks: ['AC9H1HF01 (historical sources)', 'AC9H1KC03 (geography and resources)'],
    },
    evidenceType: 'artwork',
    status: 'complete',
  },
  {
    id: 'e7',
    title: 'Egyptian pyramid scale model',
    description:
      'Isla researched Giza pyramid dimensions and created a scale comparison with our house. Used metres and ratios. Demonstrated impressive mathematical thinking.',
    dateOccurred: fiveDaysAgo,
    subjects: ['mathematics', 'hass'],
    learnerIds: ['1'],
    aiEnrichment: {
      summary:
        'Advanced mathematical reasoning applied to historical context. Isla demonstrated scale thinking and unit conversion. Bridges numeracy and humanities beautifully.',
      capabilityThreads: ['mathematical-reasoning', 'critical-thinking'],
      curriculumLinks: ['AC9M1M01 (measurement)', 'AC9H1HF01 (historical investigation)'],
    },
    evidenceType: 'document',
    status: 'complete',
  },
  {
    id: 'e8',
    title: 'Watercolour colour mixing exploration',
    description:
      'Both children experimented with mixing primary colours to create secondary and tertiary colours. Isla created an organized swatch chart. Archie enjoyed the sensory experience.',
    dateOccurred: sixDaysAgo,
    subjects: ['arts'],
    learnerIds: ['1', '2'],
    aiEnrichment: {
      summary:
        'Hands-on colour theory exploration. Both learners engaged in scientific observation (colour mixing) within artistic context. Isla showed organizational thinking.',
      capabilityThreads: ['creative-expression', 'scientific-thinking'],
      curriculumLinks: ['AC9A1PA02 (colour theory)', 'AC9S1WS02 (observation)'],
    },
    evidenceType: 'artwork',
    status: 'complete',
  },
  {
    id: 'e9',
    title: 'Landscape painting — creek scene',
    description:
      'Isla painted a layered landscape of the creek we visited, using colour perspective (lighter distant banks, richer foreground). Showed sophisticated understanding of depth.',
    dateOccurred: sevenDaysAgo,
    subjects: ['arts'],
    learnerIds: ['1'],
    aiEnrichment: {
      summary:
        'Visual thinking about depth and perspective. Isla demonstrated artistic understanding of colour relationships. Strong connection between observation and artistic representation.',
      capabilityThreads: ['creative-expression', 'aesthetic-appreciation'],
      curriculumLinks: ['AC9A1PA02 (colour and composition)'],
    },
    evidenceType: 'artwork',
    status: 'complete',
  },
  {
    id: 'e10',
    title: 'Character voices role-play — Charlotte\'s Web',
    description:
      'Isla and Archie performed a scene from Charlotte\'s Web using different character voices. Isla voiced Charlotte with wisdom and softness. Archie added sound effects.',
    dateOccurred: tenDaysAgo,
    subjects: ['english', 'arts'],
    learnerIds: ['1', '2'],
    aiEnrichment: {
      summary:
        'Deep character engagement through performance. Both learners showed emotional comprehension and creative expression. Isla demonstrated sophisticated understanding of Charlotte\'s wisdom.',
      capabilityThreads: ['oral-communication', 'imagination', 'creative-expression'],
      curriculumLinks: ['AC9E1LT04 (character)', 'AC9A1PA01 (drama and performance)'],
    },
    evidenceType: 'note',
    status: 'complete',
  },
  {
    id: 'e11',
    title: 'Cooking fractions — pizza slicing',
    description:
      'Made pizza and divided into halves, quarters, eighths. Discussed which fraction was bigger. Archie predicted: "Two quarters is one half." Excellent emerging understanding.',
    dateOccurred: fourteenDaysAgo,
    subjects: ['mathematics'],
    learnerIds: ['2'],
    aiEnrichment: {
      summary:
        'Concrete fraction practice through cooking. Archie demonstrated emerging understanding of fraction equivalence. Ready for more complex fraction relationships.',
      capabilityThreads: ['mathematical-reasoning'],
      curriculumLinks: ['AC9M1A01 (fractions and equivalence)'],
    },
    evidenceType: 'note',
    status: 'complete',
  },
  {
    id: 'e12',
    title: 'Egyptian daily life writing — "A Day as a Scribe"',
    description:
      'Isla wrote a detailed fictional account of a day in an ancient Egyptian scribe\'s life. Included: waking time, breakfast, letter writing practice, temple visit. Strong research and imagination.',
    dateOccurred: twentyOneDaysAgo,
    subjects: ['hass', 'english'],
    learnerIds: ['1'],
    aiEnrichment: {
      summary:
        'Strong historical research and imaginative writing. Isla synthesized learning about Egyptian culture into a coherent narrative. Demonstrated developed critical thinking.',
      capabilityThreads: ['written-communication', 'critical-thinking', 'cultural-literacy'],
      curriculumLinks: ['AC9E1WC01 (narrative writing)', 'AC9H1HF01 (historical perspective)'],
    },
    evidenceType: 'document',
    status: 'complete',
  },
  {
    id: 'e13',
    title: 'Rock collection & classification from creek walk',
    description:
      'Archie collected creek rocks and sorted by size, colour, and texture. Created labels. Showed developing classification skills and scientific vocabulary.',
    dateOccurred: tenDaysAgo,
    subjects: ['science'],
    learnerIds: ['2'],
    aiEnrichment: {
      summary:
        'Hands-on earth science. Archie engaged in classification and observation. Developing scientific vocabulary and organization skills.',
      capabilityThreads: ['scientific-thinking', 'spatial-reasoning'],
      curriculumLinks: ['AC9S1PS01 (earth and space)', 'AC9S1WS02 (observation)'],
    },
    evidenceType: 'photo',
    status: 'complete',
  },
  {
    id: 'e14',
    title: 'Recipe hunting — fraction treasure hunt',
    description:
      'Isla searched through family recipes and marked all fractions. Created a tally chart of which fractions appear most (1/2 cups very common). Showed mathematical thinking in context.',
    dateOccurred: sevenDaysAgo,
    subjects: ['mathematics', 'english'],
    learnerIds: ['1'],
    aiEnrichment: {
      summary:
        'Mathematical pattern-finding applied to real texts. Isla demonstrated data literacy and fraction recognition. Strong connection between maths and everyday life.',
      capabilityThreads: ['mathematical-reasoning'],
      curriculumLinks: ['AC9M1A01 (fractions)', 'AC9M1P02 (data literacy)'],
    },
    evidenceType: 'document',
    status: 'complete',
  },
  {
    id: 'e15',
    title: 'Egyptian gods mythology study & symbols',
    description:
      'Both children read myths of Egyptian gods and created a reference chart: Ra | Sun | disk symbol. Isla added detailed notes on domain and stories.',
    dateOccurred: fiveDaysAgo,
    subjects: ['hass', 'english'],
    learnerIds: ['1', '2'],
    aiEnrichment: {
      summary:
        'Cultural literacy and mythology exploration. Both learners engaged with ancient worldviews. Isla showed advanced comprehension and synthesis skills.',
      capabilityThreads: ['cultural-literacy', 'written-communication'],
      curriculumLinks: ['AC9H1KC02 (culture and societies)', 'AC9E1LT01 (reading comprehension)'],
    },
    evidenceType: 'document',
    status: 'complete',
  },
];

// ─── Learner Profiles ─────────────────────────────────────────────────────────

export const mockLearnerProfiles: Record<string, LearnerProfile> = {
  '1': {
    about:
      'Isla is a thoughtful, curious nine-year-old who loves reading and nature observation. She enjoys quiet morning work focused on writing and research. Her scientific curiosity drives learning across subjects.',
    interests: ['reading', 'creek exploration', 'nature sketching', 'storytelling', 'Egyptian history', 'watercolour painting'],
    strengths: ['observational thinking', 'written expression', 'research and synthesis', 'visual analysis', 'emotional intelligence'],
    workingStyle:
      'Isla prefers morning sessions, sustained focus on projects over multiple days, detailed instructions, and time for quiet reflection. She benefits from discussion partners who validate her ideas.',
    facilitatorNotes:
      'Isla is ready for more complex research tasks and independent projects. Watch for perfectionism—celebrate effort and process, not just polish. She benefits from mixing structured learning with open-ended exploration. Annual reading age is 1-2 years ahead of chronological age.',
  },
  '2': {
    about:
      'Archie is a hands-on, active seven-year-old who learns through direct exploration and movement. He loves animals, building, and sensory experiences. High energy drives him towards active learning and physical challenges.',
    interests: ['building blocks', 'animals and insects', 'climbing and movement', 'water play', 'construction', 'cooking'],
    strengths: ['spatial reasoning', 'physical coordination', 'curiosity about how things work', 'collaborative energy', 'resilience'],
    workingStyle:
      'Archie needs active engagement, variety to maintain focus, and clear physical boundaries. He thrives with hands-on materials, short bursts of focused work interspersed with movement. He benefits from co-learning with Isla.',
    facilitatorNotes:
      'Reading is emerging—use multi-sensory approaches, lots of picture support, and audiobooks. Archie\'s strength in spatial reasoning is a gateway to maths and science. Watch for frustration when skills don\'t match ambition—frame challenge as "growing" not "failing."',
  },
};

// ─── Planner Entries ─────────────────────────────────────────────────────────

export const mockPlannerEntries = [
  {
    id: 'p1',
    title: 'Nature Explorers — Module 2',
    status: 'completed',
    moduleId: 'mod-nature-2',
    learnerIds: ['1', '2'],
    date: today,
    session: 'morning',
    subjects: ['science', 'arts'],
  },
  {
    id: 'p2',
    title: 'Kitchen Mathematics — Fractions',
    status: 'completed',
    moduleId: 'mod-kitchen-1',
    learnerIds: ['1', '2'],
    date: today,
    session: 'afternoon',
    subjects: ['mathematics'],
  },
  {
    id: 'p3',
    title: 'Reading aloud — Charlotte\'s Web',
    status: 'planned',
    moduleId: 'mod-reading-1',
    learnerIds: ['1'],
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    session: 'morning',
    subjects: ['english'],
  },
  {
    id: 'p4',
    title: 'Ancient Worlds — Egypt mapping',
    status: 'planned',
    moduleId: 'mod-ancient-1',
    learnerIds: ['1', '2'],
    date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    session: 'morning',
    subjects: ['hass', 'arts'],
  },
];

// ─── Notifications ───────────────────────────────────────────────────────────

export const mockNotifications = [
  {
    id: 'n1',
    type: 'draft_resume',
    title: 'You were logging "Watercolour landscapes"…',
    body: 'You started this entry yesterday. Pick up where you left off.',
    bodyData: {},
    tier: 'whisper',
    state: 'visible',
    destinationRoute: '/demo/log',
    createdAt: new Date(Date.now() - 3600000),
  },
  {
    id: 'n2',
    type: 'badge_ready',
    title: 'Isla might be ready for Scientific Thinker',
    body: '12 observations recorded across 4 weeks. Would you like to check together?',
    bodyData: { learnerId: '1', badgeId: 'b-scientific' },
    tier: 'nudge',
    state: 'visible',
    destinationRoute: '/demo/badges/assess/b-scientific',
    createdAt: new Date(Date.now() - 7200000),
  },
  {
    id: 'n3',
    type: 'compliance_nudge',
    title: 'Your reporting check-in is 8 weeks away',
    body: 'You have 3 of 6 required work samples. Science and HPE need attention.',
    bodyData: {},
    tier: 'nudge',
    state: 'visible',
    destinationRoute: '/demo/our-story/report',
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: 'n4',
    type: 'streak_prompt',
    title: 'Four days running — keep the story going',
    body: 'You\'ve logged learning four days in a row. That\'s a lovely rhythm.',
    bodyData: {},
    tier: 'chime',
    state: 'visible',
    destinationRoute: '/demo/log',
    createdAt: new Date(Date.now() - 2 * 86400000),
  },
  {
    id: 'n5',
    type: 'log_invitation',
    title: 'You ran Nature Explorers today — capture it?',
    body: null,
    bodyData: { moduleTitle: 'Nature Explorers — Module 2' },
    tier: 'chime',
    state: 'actioned',
    destinationRoute: '/demo/log',
    createdAt: new Date(Date.now() - 4 * 3600000),
  },
];

// ─── Settings ────────────────────────────────────────────────────────────────

export const mockSettings = {
  familyName: 'Douglas',
  pedagogyPreference: 'charlotte_mason',
  values: ['child-led', 'nature', 'whole-child'],
  practices: ['living-books', 'narration', 'nature-journaling'],
  registrationNumber: 'HEU-2025-04821',
  nextReportDate: '2026-05-30',
  state: 'QLD',
  notificationPrefs: {
    draft_resume: true,
    badge_ready: true,
    compliance_nudge: true,
    streak_prompt: true,
    log_invitation: true,
    prep_reminder: false,
    quietHoursStart: '20:00',
    quietHoursEnd: '07:00',
  },
};

export const mockChildren = [
  {
    id: '1',
    name: 'Isla',
    colourToken: 'rose',
    dateOfBirth: '2017-04-12',
  },
  {
    id: '2',
    name: 'Archie',
    colourToken: 'blue',
    dateOfBirth: '2020-09-03',
  },
];

// ─── Learning Entries (simple) ───────────────────────────────────────────────

export const mockEntries = [
  {
    id: 'e1',
    title: 'Nature journaling at the creek',
    description: 'We spent the morning sketching banksia pods and recording bird calls. Isla identified three new species using her field guide.',
    dateOccurred: today,
    subjects: ['science', 'arts'],
    learnerIds: ['1', '2'],
    source: 'logger',
  },
  {
    id: 'e2',
    title: 'Fraction baking — banana bread',
    description: 'Doubling the recipe gave us great practice with halves and quarters. Archie measured all the wet ingredients independently.',
    dateOccurred: today,
    subjects: ['mathematics'],
    learnerIds: ['1', '2'],
    source: 'logger',
  },
  {
    id: 'e3',
    title: 'Reading aloud — Charlotte\'s Web Ch.7-8',
    description: 'Isla read two chapters aloud with excellent expression. We discussed friendship and loyalty themes.',
    dateOccurred: yesterday,
    subjects: ['english'],
    learnerIds: ['1'],
    source: 'hearth_session',
  },
  {
    id: 'e4',
    title: 'Block building & symmetry',
    description: 'Archie built a castle with perfect bilateral symmetry, then drew it from above. Great spatial reasoning.',
    dateOccurred: twoDaysAgo,
    subjects: ['mathematics', 'arts'],
    learnerIds: ['2'],
    source: 'logger',
  },
  {
    id: 'e5',
    title: 'Community garden volunteering',
    description: 'Both kids helped plant seedlings and learned about composting cycles. Wonderful social interaction with other families.',
    dateOccurred: threeDaysAgo,
    subjects: ['science', 'hpe'],
    learnerIds: ['1', '2'],
    source: 'hearth_session',
  },
  {
    id: 'e6',
    title: 'History maps — Ancient Egypt',
    description: 'Isla traced the Nile on a blank map and labelled key cities. Archie coloured the desert regions.',
    dateOccurred: fourDaysAgo,
    subjects: ['hass'],
    learnerIds: ['1', '2'],
    source: 'logger',
  },
];

// ─── Intelligence Snapshot ──────────────────────────────────────────────────

export const mockSnapshot = {
  activityStreak: 4,
  lastLogDate: today,
  weeklyThreadCoverage: 68,
  activeModulesCount: 3,
  hearthVoice:
    'Isla\'s nature observations are becoming increasingly detailed — she\'s naturally building scientific inquiry skills through her journaling practice. Archie\'s hands-on measurement work this week shows real confidence with fractions.',
  weekStats: {
    momentsLogged: 6,
    collaborativeActivities: 4,
    newCapabilities: 2,
    evidenceCollected: 8,
  },
  recommendations: [
    { title: 'Try a poetry writing session', subject: 'english' },
    { title: 'Revisit map skills with a local walk', subject: 'hass' },
    { title: 'Archie is ready for simple multiplication', subject: 'mathematics' },
  ],
  activeThreads: [
    { thread_id: 'scientific-thinking', observation_count: 12, suggested_tier: 'developing', last_evidence_date: today },
    { thread_id: 'mathematical-reasoning', observation_count: 8, suggested_tier: 'emerging', last_evidence_date: today },
    { thread_id: 'creative-expression', observation_count: 6, suggested_tier: 'emerging', last_evidence_date: yesterday },
    { thread_id: 'written-communication', observation_count: 10, suggested_tier: 'developing', last_evidence_date: yesterday },
    { thread_id: 'physical-coordination', observation_count: 4, suggested_tier: 'emerging', last_evidence_date: threeDaysAgo },
  ],
};

// ─── Our Story Hub (learner stats) ──────────────────────────────────────────

export const mockOurStoryLearners = [
  {
    id: '1',
    name: 'Isla',
    dateOfBirth: '2017-04-12',
    shapeIcon: '🌟',
    colourToken: 'rose',
    learningSince: 'March 2025',
    termSummary:
      'Isla has demonstrated strong growth in Scientific Thinking and Written Communication this term, with emerging confidence in Creative Expression. Her nature journaling practice is a real strength.',
    portfolioTotal: 47,
    portfolioThisTerm: 12,
    heuSamplesReady: 3,
    heuWeeksUntilDeadline: 8,
    capabilityThreadsActive: 14,
    capabilityNearMilestone: 2,
    evidenceThumbs: ['📷', '📷', '📄', '📷', '🎨', '📷'],
  },
  {
    id: '2',
    name: 'Archie',
    dateOfBirth: '2020-09-03',
    shapeIcon: '🦋',
    colourToken: 'blue',
    learningSince: 'January 2026',
    termSummary:
      'Archie is building a strong foundation in Number Sense and Physical Exploration this term. His curiosity and hands-on approach continue to drive meaningful learning moments.',
    portfolioTotal: 18,
    portfolioThisTerm: 4,
    heuSamplesReady: 1,
    heuWeeksUntilDeadline: 8,
    capabilityThreadsActive: 8,
    capabilityNearMilestone: 0,
    evidenceThumbs: ['📷', '📄', '🎨'],
  },
];

// ─── Pedagogy Overlays (per framework × activity) ───────────────────────────

type ActivityOverlay = { perspective?: string; facilitatorTips?: string; languageFrame?: string; watchFor?: string };

export const mockOverlays: Record<string, Record<string, ActivityOverlay>> = {
  charlotte_mason: {
    'act-creek-walk': {
      perspective: 'Nature study is the living book of the outdoors — invite the child to observe closely and narrate what they see.',
      facilitatorTips: 'Read a passage from a nature study book before heading out. Encourage narration on the walk home.',
      languageFrame: 'student',
      watchFor: 'Detailed narration of what was observed, ability to draw from nature without copying.',
    },
    'act-creek-sketch': {
      perspective: 'Nature journaling builds the habit of attention — accuracy matters less than careful looking.',
      facilitatorTips: 'Let the student choose their subject. Guide with gentle questions, not corrections.',
      watchFor: 'Sustained attention to a single subject, growing detail in sketches over time.',
    },
  },
  classical: {
    'act-creek-walk': {
      perspective: 'At the Grammar stage, gathering concrete facts about creek life builds the foundation for later scientific reasoning.',
      facilitatorTips: 'Name species and features clearly — this is knowledge-gathering. Quiz gently on the walk back.',
      languageFrame: 'student',
      watchFor: 'Retention of vocabulary and facts about organisms observed.',
    },
    'act-creek-sketch': {
      perspective: 'Precise observation and classification train the student in systematic thinking.',
      facilitatorTips: 'Have the student label their sketch with proper terms.',
      watchFor: 'Accurate labelling and attempts at classification.',
    },
  },
  montessori: {
    'act-creek-walk': {
      perspective: 'The creek is a prepared environment created by nature — follow the child\'s interest as they explore it.',
      facilitatorTips: 'Resist directing attention. Observe which element draws the child\'s concentration and support that thread.',
      languageFrame: 'child',
      watchFor: 'Deep concentration on a self-chosen element, independent exploration without prompting.',
    },
    'act-creek-sketch': {
      perspective: 'The hand and eye work together to build the child\'s understanding of the natural world.',
      facilitatorTips: 'Offer real specimens alongside the drawing. Allow repeated attempts without judgement.',
      watchFor: 'Refinement of motor control, satisfaction in the process over the product.',
    },
  },
  waldorf_steiner: {
    'act-creek-walk': {
      perspective: 'A creek walk is a sensory journey — the sounds, textures, and rhythms of water connect the child to the living earth.',
      facilitatorTips: 'Begin with a verse or song about water. Walk in reverent silence for part of the journey.',
      languageFrame: 'child',
      watchFor: 'Sense impressions shared imaginatively, wonder expressed through stories or movement.',
    },
    'act-creek-sketch': {
      perspective: 'Drawing from nature cultivates the artistic eye and connects feeling to form.',
      facilitatorTips: 'Use watercolours or beeswax crayons. Let colours blend as the child captures the mood of the scene.',
      watchFor: 'Expressive use of colour and form rather than photographic accuracy.',
    },
  },
  unschooling: {
    'act-creek-walk': {
      perspective: 'The creek is an invitation, not an assignment — real learning happens when curiosity leads.',
      facilitatorTips: 'Don\'t set goals for the visit. Notice what sparks excitement and follow that thread wherever it leads.',
      languageFrame: 'learner',
      watchFor: 'Self-directed investigation, questions that lead to further exploration, joy in discovery.',
    },
    'act-creek-sketch': {
      perspective: 'Sketching is one of many ways to process experience — offer it without requiring it.',
      facilitatorTips: 'If the learner prefers to collect objects, photograph, or narrate instead, honour that.',
      watchFor: 'Voluntary engagement, creative expression in any medium.',
    },
  },
  eclectic: {
    'act-creek-walk': {
      perspective: 'Outdoor exploration combines science, observation, and physical activity in one natural session.',
      facilitatorTips: 'Bring a mix of tools — field guides, magnifying glasses, containers. See what approach works today.',
      watchFor: 'Engagement with the environment, questions asked, connections made to prior learning.',
    },
    'act-creek-sketch': {
      perspective: 'Sketching integrates art and science — a flexible tool that suits many learning styles.',
      facilitatorTips: 'Some children prefer detailed diagrams, others prefer impressionistic sketches. Both are valid.',
      watchFor: 'Willingness to observe closely and transfer observations to paper.',
    },
  },
};
