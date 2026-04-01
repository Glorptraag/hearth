export const THREAD_NAMES: Record<string, string> = {
  L1: 'Oral Communication',
  L2: 'Phonological Awareness',
  L3: 'Reading Comprehension',
  L4: 'Vocabulary & Word Knowledge',
  L5: 'Written Expression',
  L6: 'Spelling & Grammar',
  L7: 'Narrative & Retelling',
  L8: 'Persuasion & Argument',
  L9: 'Literary Appreciation',
  M1: 'Number Sense',
  M2: 'Operations',
  M3: 'Fractional Thinking',
  M4: 'Algebraic Thinking',
  M5: 'Measurement',
  M6: 'Spatial Reasoning',
  M7: 'Data & Statistics',
  M8: 'Probability',
  M9: 'Mathematical Modelling',
  S1: 'Scientific Inquiry',
  S2: 'Biological Sciences',
  S3: 'Chemical Sciences',
  S4: 'Physical Sciences',
  S5: 'Scientific Observation',
  S6: 'Earth & Space',
  H1: 'Historical Understanding',
  H2: 'Source Analysis',
  H3: 'Geographical Understanding',
  H4: 'Civics & Citizenship',
  H5: 'Economics & Business',
  H6: 'Cultural Understanding',
  P1: 'Gross Motor',
  P2: 'Fine Motor',
  P3: 'Body Awareness',
  P4: 'Team & Sport',
  P5: 'Aquatics',
  PS1: 'Empathy',
  PS2: 'Social Skills',
  PS3: 'Self-Regulation',
  PS4: 'Identity',
  PS5: 'Responsibility',
  PS6: 'Resilience',
  PS7: 'Safety',
  C1: 'Visual Art',
  C2: 'Music',
  C3: 'Drama',
  C4: 'Dance',
  C5: 'Media Arts',
  C6: 'Design & Construction',
  C7: 'Arts Appreciation',
  EF1: 'Sustained Attention',
  EF2: 'Working Memory',
  EF3: 'Cognitive Flexibility',
  EF4: 'Planning & Organisation',
  EF5: 'Critical Thinking',
  EF6: 'Collaboration',
  EF7: 'Metacognition',
  EF8: 'Transfer',
};

export function getThreadName(threadId: string): string {
  return THREAD_NAMES[threadId] ?? threadId;
}

export type ThreadDomain = {
  key: string;
  label: string;
  emoji: string;
  prefix: string;
  threadCount: number;
};

export const THREAD_DOMAINS: ThreadDomain[] = [
  { key: 'literacy', label: 'Literacy', emoji: '📚', prefix: 'L', threadCount: 9 },
  { key: 'mathematics', label: 'Mathematics', emoji: '🔢', prefix: 'M', threadCount: 9 },
  { key: 'science', label: 'Science', emoji: '🔬', prefix: 'S', threadCount: 6 },
  { key: 'humanities', label: 'Humanities', emoji: '🌏', prefix: 'H', threadCount: 6 },
  { key: 'personal', label: 'Personal', emoji: '🏃', prefix: 'P', threadCount: 5 },
  { key: 'psychosocial', label: 'Psychosocial', emoji: '💡', prefix: 'PS', threadCount: 7 },
  { key: 'creative', label: 'Creative', emoji: '🎨', prefix: 'C', threadCount: 7 },
  { key: 'executiveFunction', label: 'Executive Function', emoji: '🧠', prefix: 'EF', threadCount: 8 },
];

export function getThreadDomain(threadId: string): ThreadDomain | null {
  for (const domain of THREAD_DOMAINS) {
    if (threadId.startsWith(domain.prefix) && threadId.slice(domain.prefix.length).match(/^\d+$/)) {
      return domain;
    }
  }
  return null;
}

// ─── Thread Connections (prerequisite → enables) ─────────────────────────────
// Static map of developmental progression lines within and across domains.
// Each entry: [prerequisite, enables]. Rendered as curved SVG connections.

export const THREAD_CONNECTIONS: Array<[string, string]> = [
  // Literacy progression
  ['L1', 'L3'],  // Oral Communication → Reading Comprehension
  ['L2', 'L6'],  // Phonological Awareness → Spelling & Grammar
  ['L3', 'L5'],  // Reading Comprehension → Written Expression
  ['L4', 'L3'],  // Vocabulary → Reading Comprehension
  ['L7', 'L8'],  // Narrative → Persuasion
  ['L5', 'L8'],  // Written Expression → Persuasion
  ['L3', 'L9'],  // Reading Comprehension → Literary Appreciation
  // Mathematics progression
  ['M1', 'M2'],  // Number Sense → Operations
  ['M2', 'M3'],  // Operations → Fractional Thinking
  ['M1', 'M4'],  // Number Sense → Algebraic Thinking
  ['M5', 'M6'],  // Measurement → Spatial Reasoning
  ['M1', 'M7'],  // Number Sense → Data & Statistics
  ['M7', 'M8'],  // Data → Probability
  ['M4', 'M9'],  // Algebraic Thinking → Mathematical Modelling
  // Science progression
  ['S5', 'S1'],  // Scientific Observation → Scientific Inquiry
  ['S1', 'S2'],  // Scientific Inquiry → Biological Sciences
  ['S1', 'S3'],  // Scientific Inquiry → Chemical Sciences
  ['S1', 'S4'],  // Scientific Inquiry → Physical Sciences
  ['S1', 'S6'],  // Scientific Inquiry → Earth & Space
  // Executive Function progression
  ['EF1', 'EF2'],  // Sustained Attention → Working Memory
  ['EF2', 'EF3'],  // Working Memory → Cognitive Flexibility
  ['EF3', 'EF4'],  // Cognitive Flexibility → Planning & Organisation
  ['EF4', 'EF5'],  // Planning → Critical Thinking
  ['EF5', 'EF7'],  // Critical Thinking → Metacognition
  ['EF7', 'EF8'],  // Metacognition → Transfer
  ['EF6', 'EF4'],  // Collaboration → Planning
  // Psychosocial progression
  ['PS1', 'PS2'],  // Empathy → Social Skills
  ['PS3', 'PS6'],  // Self-Regulation → Resilience
  ['PS4', 'PS5'],  // Identity → Responsibility
  ['PS2', 'PS7'],  // Social Skills → Safety
  // Creative progression
  ['C1', 'C7'],  // Visual Art → Arts Appreciation
  ['C6', 'C1'],  // Design & Construction → Visual Art
  ['C2', 'C4'],  // Music → Dance
  ['C3', 'C5'],  // Drama → Media Arts
  // Cross-domain connections
  ['L3', 'H1'],  // Reading Comprehension → Historical Understanding
  ['M5', 'S4'],  // Measurement → Physical Sciences
  ['PS3', 'EF1'], // Self-Regulation → Sustained Attention
  ['P2', 'C6'],  // Fine Motor → Design & Construction
  ['L1', 'C3'],  // Oral Communication → Drama
];
