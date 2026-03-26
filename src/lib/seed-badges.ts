export type SeedBadge = {
  id: string;
  name: string;
  emoji: string;
  threadId: string;
  threadName: string;
  requiredObservations: number;
  assessmentQuestions: { id: string; question: string }[];
};

export const SEED_BADGES: SeedBadge[] = [
  {
    id: 'badge-number-navigator',
    name: 'Number Navigator',
    emoji: '🔢',
    threadId: 'M1',
    threadName: 'Number Sense & Place Value',
    requiredObservations: 4,
    assessmentQuestions: [
      { id: 'q1', question: 'Can [child] count forwards and backwards to at least 20?' },
      { id: 'q2', question: 'Does [child] understand that numbers represent quantities (not just sequence)?' },
      { id: 'q3', question: 'Can [child] group objects into tens and ones?' },
    ],
  },
  {
    id: 'badge-story-explorer',
    name: 'Story Explorer',
    emoji: '📖',
    threadId: 'L3',
    threadName: 'Reading Comprehension',
    requiredObservations: 4,
    assessmentQuestions: [
      { id: 'q1', question: "Can [child] retell a story they've heard in their own words?" },
      { id: 'q2', question: 'Does [child] ask questions about stories or make predictions?' },
      { id: 'q3', question: 'Can [child] identify main characters and what happened in a story?' },
    ],
  },
  {
    id: 'badge-nature-detective',
    name: 'Nature Detective',
    emoji: '🔍',
    threadId: 'S5',
    threadName: 'Scientific Observation',
    requiredObservations: 4,
    assessmentQuestions: [
      { id: 'q1', question: 'Does [child] notice details in nature that others miss?' },
      { id: 'q2', question: "Can [child] describe what they observe using specific words (not just 'cool')?" },
      { id: 'q3', question: 'Does [child] spontaneously compare or classify things they find?' },
    ],
  },
];
