import type { Pedagogy } from '@/types';

// ─── Pedagogy Language Adapter ───
// Provides philosophy-appropriate vocabulary across all screens.
// Eclectic is the neutral default — all other frameworks shift tone.

interface PedagogyVocabulary {
  // How the pedagogy refers to a learning session
  sessionNoun: string;
  // How it refers to the facilitating parent
  facilitatorNoun: string;
  // How it refers to the child's role
  learnerNoun: string;
  // What "doing learning" is called
  activityVerb: string;
  // How to describe growth/progress
  growthNoun: string;
  // Short philosophy tagline for UI
  tagline: string;
  // Dashboard greeting style
  greetingTone: 'warm' | 'structured' | 'playful' | 'poetic';
  // Nudge framing (how to encourage logging)
  logNudge: string;
  // How to frame curriculum coverage
  coverageFrame: string;
  // How to describe a gap
  gapFrame: string;
  // Celebration framing
  celebrationFrame: string;
  // Planner framing
  plannerFrame: string;
}

const VOCABULARY: Record<Pedagogy, PedagogyVocabulary> = {
  charlotte_mason: {
    sessionNoun: 'lesson',
    facilitatorNoun: 'guide',
    learnerNoun: 'student',
    activityVerb: 'studied',
    growthNoun: 'habit formation',
    tagline: 'Living books, nature study, narration',
    greetingTone: 'warm',
    logNudge: 'What living ideas did your child encounter today?',
    coverageFrame: 'Breadth of living ideas explored',
    gapFrame: 'This area is waiting for its living book moment',
    celebrationFrame: 'A beautiful habit is forming',
    plannerFrame: 'Plan a feast of ideas for the week',
  },
  classical: {
    sessionNoun: 'lesson',
    facilitatorNoun: 'teacher',
    learnerNoun: 'student',
    activityVerb: 'practised',
    growthNoun: 'mastery',
    tagline: 'Grammar, logic, rhetoric',
    greetingTone: 'structured',
    logNudge: 'What knowledge was gathered or practised today?',
    coverageFrame: 'Subjects under study',
    gapFrame: 'This subject needs attention in the trivium',
    celebrationFrame: 'Excellent progress through the stages',
    plannerFrame: 'Structure the week across your trivium',
  },
  montessori: {
    sessionNoun: 'work cycle',
    facilitatorNoun: 'guide',
    learnerNoun: 'child',
    activityVerb: 'explored',
    growthNoun: 'development',
    tagline: 'Hands-on, child-led, prepared environment',
    greetingTone: 'warm',
    logNudge: 'What did the child choose to work on today?',
    coverageFrame: 'Areas of the prepared environment touched',
    gapFrame: 'This area of the environment is waiting to be discovered',
    celebrationFrame: 'Deep concentration and self-directed work',
    plannerFrame: 'Prepare the environment for the week ahead',
  },
  waldorf_steiner: {
    sessionNoun: 'main lesson',
    facilitatorNoun: 'teacher',
    learnerNoun: 'child',
    activityVerb: 'experienced',
    growthNoun: 'unfolding',
    tagline: 'Arts integration, seasonal rhythms',
    greetingTone: 'poetic',
    logNudge: 'What stories, art, or rhythm shaped today?',
    coverageFrame: 'Subjects woven through the rhythms',
    gapFrame: 'This thread of learning is ready to be woven in',
    celebrationFrame: 'A beautiful unfolding of understanding',
    plannerFrame: 'Weave the week with rhythm and imagination',
  },
  unschooling: {
    sessionNoun: 'experience',
    facilitatorNoun: 'facilitator',
    learnerNoun: 'learner',
    activityVerb: 'discovered',
    growthNoun: 'growth',
    tagline: 'Interest-led, life as the curriculum',
    greetingTone: 'playful',
    logNudge: 'What sparked curiosity or joy today?',
    coverageFrame: 'Interests and experiences captured',
    gapFrame: 'Opportunities to follow curiosity here',
    celebrationFrame: 'Following the spark led somewhere wonderful',
    plannerFrame: 'Ideas and invitations for the week',
  },
  eclectic: {
    sessionNoun: 'session',
    facilitatorNoun: 'parent',
    learnerNoun: 'child',
    activityVerb: 'learned',
    growthNoun: 'progress',
    tagline: 'Mix and match what works for your family',
    greetingTone: 'warm',
    logNudge: 'What happened in learning today?',
    coverageFrame: 'Subject areas covered',
    gapFrame: 'This area could use some attention',
    celebrationFrame: 'Great progress this week',
    plannerFrame: 'Plan the week ahead',
  },
};

export function getPedagogyVocabulary(pedagogy: Pedagogy | string): PedagogyVocabulary {
  return VOCABULARY[pedagogy as Pedagogy] ?? VOCABULARY.eclectic;
}

// ─── Context-Specific Adaptations ───

export function adaptGreeting(
  pedagogy: Pedagogy | string,
  childNames: string[],
  context: { timeOfDay: 'morning' | 'afternoon' | 'evening'; streak?: number }
): string {
  const vocab = getPedagogyVocabulary(pedagogy);
  const names = childNames.length > 0 ? childNames.join(' & ') : 'your learners';

  const baseGreetings: Record<typeof vocab.greetingTone, Record<string, string>> = {
    warm: {
      morning: `Good morning. A new day of learning awaits ${names}.`,
      afternoon: `Hope the afternoon is going well with ${names}.`,
      evening: `What a day of learning with ${names}.`,
    },
    structured: {
      morning: `Good morning. Ready to build on yesterday's ${vocab.sessionNoun}s?`,
      afternoon: `Afternoon check-in. How are today's ${vocab.sessionNoun}s progressing?`,
      evening: `Evening review. What was ${vocab.activityVerb} today?`,
    },
    playful: {
      morning: `What will ${names} discover today?`,
      afternoon: `What's sparking curiosity this afternoon?`,
      evening: `What adventures unfolded today?`,
    },
    poetic: {
      morning: `A fresh morning unfolds. What stories will ${names} live today?`,
      afternoon: `The afternoon rhythm continues with ${names}.`,
      evening: `As the day draws to a close, what was ${vocab.activityVerb}?`,
    },
  };

  return baseGreetings[vocab.greetingTone][context.timeOfDay] ?? baseGreetings.warm[context.timeOfDay];
}

export function adaptNotificationCopy(
  pedagogy: Pedagogy | string,
  type: string,
  context: Record<string, unknown>
): { title: string; body?: string } | null {
  const vocab = getPedagogyVocabulary(pedagogy);

  switch (type) {
    case 'log_invitation':
      return {
        title: vocab.logNudge,
        body: `Capture what ${context.childName ?? 'your child'} ${vocab.activityVerb} while it's fresh.`,
      };
    case 'streak_prompt':
      return {
        title: `It's been a few days since your last ${vocab.sessionNoun} log.`,
        body: `Even a quick note helps track ${vocab.growthNoun}.`,
      };
    case 'compliance_nudge':
      return {
        title: 'Your report is approaching.',
        body: `${vocab.coverageFrame}: check your report for gaps.`,
      };
    case 'badge_ready':
      return {
        title: `${vocab.celebrationFrame}!`,
        body: `${context.childName ?? 'Your child'} may be ready for a badge in ${context.threadName ?? 'a capability thread'}.`,
      };
    default:
      return null;
  }
}

export function adaptGapMessage(
  pedagogy: Pedagogy | string,
  subjectLabel: string
): string {
  const vocab = getPedagogyVocabulary(pedagogy);
  return `${subjectLabel}: ${vocab.gapFrame}`;
}

export function adaptCelebration(
  pedagogy: Pedagogy | string,
  context: { entryCount: number; subjectCount: number }
): string {
  const vocab = getPedagogyVocabulary(pedagogy);
  return `${vocab.celebrationFrame} — ${context.entryCount} ${vocab.sessionNoun}${context.entryCount !== 1 ? 's' : ''} across ${context.subjectCount} area${context.subjectCount !== 1 ? 's' : ''} this week.`;
}
