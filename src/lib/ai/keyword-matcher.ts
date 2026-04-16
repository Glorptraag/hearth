export const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Mathematics: [
    'count', 'number', 'add', 'subtract', 'measure', 'shape',
    'pattern', 'graph', 'fraction', 'multiply', 'divide', 'group',
    'tens', 'ones', 'place value', 'estimate', 'compare', 'sort',
    'weigh', 'length', 'height', 'timer', 'clock', 'money', 'half',
  ],
  English: [
    'read', 'write', 'story', 'book', 'letter', 'word',
    'sentence', 'poem', 'author', 'narrate', 'spell', 'grammar',
    'rhyme', 'sound', 'phonics', 'vocabulary', 'paragraph', 'chapter',
    'library', 'journal', 'copywork', 'dictation', 'retell', 'listen',
  ],
  Science: [
    'observe', 'experiment', 'predict', 'test', 'grow',
    'animal', 'plant', 'weather', 'lifecycle', 'habitat', 'force',
    'magnet', 'float', 'sink', 'dissolve', 'insect', 'bird',
    'rock', 'soil', 'seed', 'tadpole', 'butterfly', 'moon', 'shadow',
  ],
  HASS: [
    'history', 'geography', 'map', 'community', 'family',
    'past', 'present', 'culture', 'country', 'tradition', 'rule',
    'place', 'environment', 'celebration', 'indigenous', 'timeline',
    'government', 'needs', 'wants', 'resources', 'trade',
  ],
  'The Arts': [
    'draw', 'paint', 'sculpt', 'sing', 'dance', 'act',
    'music', 'instrument', 'colour', 'collage', 'craft', 'perform',
    'rhythm', 'melody', 'sketch', 'clay', 'drama', 'puppet',
    'gallery', 'compose', 'design',
  ],
  Technologies: [
    'build', 'construct', 'code', 'program', 'robot',
    'design', 'make', 'tool', 'digital', 'computer', 'app',
    'algorithm', 'scratch', 'lego', 'engineer', 'bridge', 'circuit',
    '3d', 'printer', 'minecraft',
  ],
  HPE: [
    'run', 'jump', 'climb', 'swim', 'throw', 'catch',
    'balance', 'stretch', 'yoga', 'sport', 'game', 'team',
    'healthy', 'nutrition', 'feelings', 'emotions', 'body',
    'exercise', 'coordination', 'obstacle',
  ],
  Languages: [
    'french', 'mandarin', 'japanese', 'italian', 'german',
    'spanish', 'auslan', 'language', 'greeting', 'translate',
    'bilingual', 'vocabulary', 'pronunciation', 'conversation',
  ],
};

export const THREAD_KEYWORDS: Record<string, string[]> = {
  L1: ['conversation', 'listening', 'speaking', 'talking', 'discussing'],
  L2: ['phonics', 'sounds', 'rhyming', 'blending', 'decoding'],
  L3: ['reading', 'comprehension', 'book', 'story', 'chapter'],
  L4: ['vocabulary', 'words', 'meaning', 'definition', 'language'],
  L5: ['writing', 'sentence', 'paragraph', 'essay', 'journal'],
  L6: ['spelling', 'grammar', 'punctuation', 'editing', 'conventions'],
  L7: ['narration', 'retelling', 'storytelling', 'sequence', 'narrative'],
  L8: ['argument', 'persuade', 'opinion', 'debate', 'evidence'],
  L9: ['literature', 'poetry', 'author', 'genre', 'analysis'],
  M1: ['counting', 'place value', 'tens', 'ones', 'groups'],
  M2: ['addition', 'subtraction', 'multiplication', 'division', 'operations'],
  M3: ['fraction', 'half', 'quarter', 'decimal', 'proportion'],
  M4: ['pattern', 'sequence', 'rule', 'algebra', 'equal'],
  M5: ['measurement', 'length', 'weight', 'capacity', 'time'],
  M6: ['shape', 'spatial', 'geometry', 'symmetry', 'position'],
  M7: ['data', 'graph', 'chart', 'survey', 'statistics'],
  M8: ['probability', 'chance', 'likely', 'unlikely', 'random'],
  M9: ['modelling', 'problem solving', 'strategy', 'reasoning', 'proof'],
  S1: ['inquiry', 'hypothesis', 'experiment', 'variable', 'conclusion'],
  S2: ['living things', 'animal', 'plant', 'habitat', 'lifecycle'],
  S3: ['materials', 'properties', 'chemical', 'physical', 'change'],
  S4: ['forces', 'motion', 'energy', 'electricity', 'magnetism'],
  S5: ['observation', 'noticing', 'magnifying', 'recording', 'detail'],
  S6: ['earth', 'weather', 'seasons', 'rocks', 'environment'],
  H1: ['history', 'past', 'timeline', 'primary source', 'change'],
  H2: ['source analysis', 'evidence', 'perspective', 'bias', 'reliability'],
  H3: ['geography', 'place', 'map', 'landscape', 'environment'],
  H4: ['citizenship', 'community', 'rules', 'government', 'rights'],
  H5: ['economics', 'resources', 'trade', 'needs', 'wants'],
  H6: ['cultural', 'identity', 'diversity', 'tradition', 'belonging'],
  P1: ['gross motor', 'running', 'jumping', 'climbing', 'throwing'],
  P2: ['fine motor', 'cutting', 'threading', 'writing grip', 'manipulation'],
  P3: ['body awareness', 'coordination', 'balance', 'spatial', 'movement'],
  P4: ['team', 'sport', 'game', 'rules', 'sportsmanship'],
  P5: ['swimming', 'water safety', 'aquatic', 'floating', 'stroke'],
  PS1: ['empathy', 'perspective', 'feelings', 'understanding', 'kindness'],
  PS2: ['social skills', 'sharing', 'cooperation', 'friendship', 'conflict'],
  PS3: ['self-regulation', 'calm', 'managing', 'emotions', 'impulse'],
  PS4: ['identity', 'self-concept', 'confidence', 'strengths', 'growth'],
  PS5: ['responsibility', 'independence', 'initiative', 'helping', 'chores'],
  PS6: ['resilience', 'perseverance', 'challenge', 'setback', 'recovery'],
  PS7: ['safety', 'risk assessment', 'boundaries', 'awareness', 'protective'],
  C1: ['visual art', 'drawing', 'painting', 'sculpture', 'colour'],
  C2: ['music', 'rhythm', 'melody', 'instrument', 'singing'],
  C3: ['drama', 'acting', 'roleplay', 'performance', 'theatre'],
  C4: ['dance', 'movement', 'choreography', 'expression', 'body'],
  C5: ['media', 'photography', 'film', 'animation', 'digital art'],
  C6: ['design', 'construction', 'building', 'engineering', 'making'],
  C7: ['appreciation', 'critique', 'gallery', 'audience', 'aesthetic'],
  EF1: ['focus', 'attention', 'concentration', 'sustained', 'engaged'],
  EF2: ['working memory', 'remembering', 'recall', 'holding', 'instructions'],
  EF3: ['flexibility', 'adapting', 'changing', 'new approach', 'switching'],
  EF4: ['planning', 'organising', 'steps', 'order', 'preparation'],
  EF5: ['critical thinking', 'reasoning', 'logic', 'evaluating', 'analysing'],
  EF6: ['collaboration', 'teamwork', 'group', 'together', 'contributing'],
  EF7: ['metacognition', 'thinking about thinking', 'strategy', 'self-aware', 'reflection'],
  EF8: ['transfer', 'applying', 'connecting', 'across', 'new context'],
};

export const ENGAGEMENT_VOCABULARY = {
  positive: [
    'loved', 'fascinated', 'absorbed', 'excited', 'delighted',
    'curious', 'engaged', 'focused', 'enthusiastic', 'passionate',
    'joyful', 'thrilled', 'captivated', 'motivated', 'proud',
  ],
  neutral: [
    'explored', 'tried', 'worked on', 'practised', 'spent time',
    'attempted', 'completed', 'finished', 'did', 'participated',
  ],
  challenging: [
    'struggled', 'frustrated', 'confused', 'difficult',
    'bored', 'resistant', 'reluctant', 'refused', 'upset', 'overwhelmed',
  ],
} as const;

export type KeywordMatchResult = {
  subjects: string[];
  threads: string[];
  engagement: 'positive' | 'neutral' | 'challenging' | null;
  mentionedChildren: string[];
};

export function matchKeywords(text: string, childNames: string[]): KeywordMatchResult {
  const lower = text.toLowerCase();

  const subjects = Object.entries(SUBJECT_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => lower.includes(kw)))
    .map(([subject]) => subject);

  const threads = Object.entries(THREAD_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => lower.includes(kw)))
    .map(([threadId]) => threadId);

  const engagement = (Object.entries(ENGAGEMENT_VOCABULARY) as [keyof typeof ENGAGEMENT_VOCABULARY, readonly string[]][])
    .find(([, words]) => words.some((w) => lower.includes(w)));

  const mentionedChildren = childNames.filter((name) =>
    lower.includes(name.toLowerCase())
  );

  return {
    subjects,
    threads,
    engagement: engagement ? engagement[0] : null,
    mentionedChildren,
  };
}

// ─── Reflection Prompt Engine ───
// Generates 1-2 Socratic questions based on current form state.
// Pure function — no API calls. Used client-side during entry composition.

export type ReflectionPrompt = {
  id: string;
  question: string;
};

export type SnapshotSignals = {
  // Per-child quiet and active thread ids from the Family Intelligence Snapshot.
  perChild: Record<string, { quiet: string[]; active: string[] }>;
  // True when the family is in the onboarding window (e.g. <20 entries).
  // When true, one prompt gets "why this matters" teaching framing.
  onboarding?: boolean;
};

// Maps an activityType to the thread ids it plausibly touches. Used to match
// a child's quiet threads against the current activity so we can emit a
// gap-linked reflection prompt (the activity is a live chance to nudge a gap).
const ACTIVITY_THREAD_MAP: Record<string, string[]> = {
  cooking: ['M3', 'M5', 'S3', 'PS5', 'P2'],
  nature: ['S2', 'S5', 'S6', 'S4', 'H3'],
  reading: ['L3', 'L4', 'L7', 'L9'],
  writing: ['L5', 'L6', 'L8'],
  freeplay: ['PS2', 'PS4', 'EF3', 'EF6', 'C3'],
  art: ['C1', 'C4', 'C7'],
  music: ['C2', 'C4'],
  outing: ['H1', 'H3', 'H6', 'S6'],
  project: ['EF4', 'EF5', 'EF8', 'M9', 'C6'],
  maths: ['M1', 'M2', 'M9'],
  sport: ['P1', 'P3', 'P4', 'EF6'],
};

// Short human labels + an activity-specific cue for the gap-linked prompt.
const THREAD_PROMPT_CUES: Record<string, { label: string; cue: string }> = {
  L3: { label: 'reading comprehension', cue: 'talk about what the story meant' },
  L4: { label: 'vocabulary', cue: 'pick up new words' },
  L5: { label: 'writing', cue: 'write anything down — a label, a list, a line' },
  L7: { label: 'narration', cue: 'retell what happened in their own words' },
  M1: { label: 'counting & number sense', cue: 'count, group, or compare amounts' },
  M2: { label: 'operations', cue: 'add, subtract, or share things out' },
  M3: { label: 'fractions & parts', cue: 'split, halve, or measure portions' },
  M5: { label: 'measurement', cue: 'measure time, weight, or length' },
  M9: { label: 'problem solving', cue: 'get stuck and work out a strategy' },
  S1: { label: 'scientific inquiry', cue: 'predict or test an idea' },
  S2: { label: 'living things', cue: 'notice an animal or plant up close' },
  S5: { label: 'observation', cue: 'notice fine detail you might have missed' },
  S6: { label: 'earth & environment', cue: 'notice weather, landscape, or seasons' },
  H3: { label: 'geography & place', cue: 'talk about where things are or come from' },
  H6: { label: 'culture & identity', cue: 'connect to a family or cultural tradition' },
  PS2: { label: 'social skills', cue: 'share, take turns, or negotiate' },
  PS3: { label: 'self-regulation', cue: 'manage a big feeling' },
  PS6: { label: 'resilience', cue: 'push through something hard' },
  EF1: { label: 'focus & attention', cue: 'stay with one thing for a stretch' },
  EF4: { label: 'planning', cue: 'plan the order of steps' },
  EF5: { label: 'critical thinking', cue: 'reason through why or how' },
  EF6: { label: 'collaboration', cue: 'work with someone else' },
  C1: { label: 'visual art', cue: 'draw, paint, or make something visual' },
  C3: { label: 'drama & roleplay', cue: 'act a role or tell a story through play' },
  C6: { label: 'design & making', cue: 'build or design a thing' },
  P1: { label: 'gross motor', cue: 'run, climb, or throw' },
  P2: { label: 'fine motor', cue: 'cut, thread, or manipulate small things' },
};

type ReflectionContext = {
  match: KeywordMatchResult | null;
  descriptionLength: number;
  observations: string[];
  activityType: string | null;
  engagementByName: Record<string, number>; // child name → 1–4
  discoveryByName: Record<string, string>;  // child name → discovery text
  snapshotSignals?: SnapshotSignals | null;
  // snapshotSignals.perChild is keyed by learnerId (UUID) for privacy — names
  // stay client-side. Pass this map so gap-linked prompts can resolve a
  // human-readable name for the parent-facing question text.
  learnerNamesById?: Record<string, string>;
};

export function generateReflectionPrompts(ctx: ReflectionContext): ReflectionPrompt[] {
  const { match, descriptionLength, observations, activityType, engagementByName, discoveryByName, snapshotSignals, learnerNamesById } = ctx;
  const prompts: ReflectionPrompt[] = [];

  // Very thin — ask them to paint the picture before anything else
  if (descriptionLength < 30) {
    return [{ id: 'thin', question: 'What were they actually doing? Try to paint the picture — what did you see or hear?' }];
  }

  // Gap-linked prompt: activity touches a thread that's quiet for one of the
  // selected children. Inserted first so it takes priority; total is still
  // capped at 2, so it displaces the last heuristic prompt.
  if (snapshotSignals && activityType && ACTIVITY_THREAD_MAP[activityType]) {
    const activityThreads = ACTIVITY_THREAD_MAP[activityType];
    for (const [learnerId, sig] of Object.entries(snapshotSignals.perChild)) {
      const matchedThread = sig.quiet.find((t) => activityThreads.includes(t) && THREAD_PROMPT_CUES[t]);
      if (matchedThread) {
        const displayName = learnerNamesById?.[learnerId];
        // Skip if we can't resolve a human-readable name — better to fall back
        // to other prompts than render a UUID in the question text.
        if (!displayName) continue;
        const { label, cue } = THREAD_PROMPT_CUES[matchedThread];
        prompts.push({
          id: `gap-${learnerId}-${matchedThread}`,
          question: `${displayName} has been quiet on ${label} lately — this is a natural place to notice it. Did they ${cue}?`,
        });
        break; // one gap-linked prompt max
      }
    }
  }

  // Description written but no learning signals detected
  if (match && match.subjects.length === 0 && match.threads.length === 0) {
    prompts.push({ id: 'no-signals', question: 'What were they thinking about or working out? What question or problem were they exploring?' });
  }

  // Science / nature — probe for inquiry moment
  if ((match?.threads.some(t => t.startsWith('S')) || activityType === 'nature') && prompts.length < 2) {
    prompts.push({ id: 'science', question: 'Did they make a prediction or test an idea? What surprised them about what they found?' });
  }

  // Maths — probe for mathematical thinking
  if (match?.threads.some(t => t.startsWith('M')) && prompts.length < 2) {
    prompts.push({ id: 'maths', question: 'Did they count, measure, or compare anything? Did they have a strategy, or figure it out as they went?' });
  }

  // Language — probe for specifics
  if (match?.threads.some(t => t.startsWith('L')) && prompts.length < 2) {
    prompts.push({ id: 'language', question: 'What specifically did they read, write, or say? Was there a word or idea that caught their attention?' });
  }

  // Observation: Deeply focused
  if (observations.includes('Deeply focused') && prompts.length < 2) {
    prompts.push({ id: 'deep-focus', question: 'What were they so absorbed in? Did they stay with it without any prompting? How long did that last?' });
  }

  // Observation: Asked questions
  if (observations.includes('Asked questions') && prompts.length < 2) {
    prompts.push({ id: 'asked-questions', question: "What was the best question they asked? Write it out exactly if you can remember — their own words matter." });
  }

  // Observation: Made connections
  if (observations.includes('Made connections') && prompts.length < 2) {
    prompts.push({ id: 'connections', question: 'What did they connect this to? What earlier knowledge or experience did they draw on?' });
  }

  // Observation: Explained reasoning
  if (observations.includes('Explained reasoning') && prompts.length < 2) {
    prompts.push({ id: 'reasoning', question: "Can you write out what they said? Even roughly — their reasoning in their own words is valuable." });
  }

  // Child struggled but discovery is thin
  const strugglers = Object.entries(engagementByName)
    .filter(([name, v]) => v === 1 && (discoveryByName[name] ?? '').length < 20)
    .map(([name]) => name);
  if (strugglers.length > 0 && prompts.length < 2) {
    prompts.push({ id: `struggle-${strugglers[0]}`, question: `What made this difficult for ${strugglers[0]}? Did they ask for help, push through on their own, or step away?` });
  }

  // Child loved it but discovery is thin
  const lovedIt = Object.entries(engagementByName)
    .filter(([name, v]) => v === 4 && (discoveryByName[name] ?? '').length < 20)
    .map(([name]) => name);
  if (lovedIt.length > 0 && prompts.length < 2) {
    prompts.push({ id: `loved-${lovedIt[0]}`, question: `What specifically delighted ${lovedIt[0]}? What did they say or do that showed their enthusiasm?` });
  }

  // Free play — probe for self-direction
  if (activityType === 'freeplay' && prompts.length < 2) {
    prompts.push({ id: 'freeplay', question: 'Who initiated it? What rules or story did they create? What role did each child take on?' });
  }

  // Nature — probe for noticing
  if (activityType === 'nature' && prompts.length < 2) {
    prompts.push({ id: 'nature', question: "What did they notice that you didn't point out? Did they touch, smell, or listen to anything closely?" });
  }

  const capped = prompts.slice(0, 2);

  // Onboarding teaching cue: prepend a "why this matters" frame to the first
  // prompt so new families learn what the question is reaching for. Applied
  // once, only when snapshotSignals.onboarding is true.
  if (snapshotSignals?.onboarding && capped.length > 0) {
    const first = capped[0];
    // Don't re-wrap the "thin" fallback or an already-wrapped prompt.
    if (first.id !== 'thin' && !first.id.startsWith('teach-')) {
      capped[0] = {
        id: `teach-${first.id}`,
        question: `Why this matters: the specific moments you notice now are what the snapshot learns from. ${first.question}`,
      };
    }
  }

  return capped;
}
