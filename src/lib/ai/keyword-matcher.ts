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
