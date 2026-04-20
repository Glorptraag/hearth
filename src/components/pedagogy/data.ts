import type { Pedagogy } from '@/types';

// ─── Pedagogy Wizard Catalogs ─────────────────────────────────────────────
// IDs intentionally match the `Pedagogy` union (snake_case) and the
// string arrays stored in `familySettings.pedagogyValues` /
// `familySettings.pedagogyPractices`. Keep in sync with
// `src/lib/pedagogy/adapter.ts` vocabulary entries.

export interface PhilosophyOption {
  id: Pedagogy;
  name: string;
  tagline: string;
  description: string;
  keyElements: string[];
  isEclectic?: boolean;
}

export const PHILOSOPHIES: PhilosophyOption[] = [
  {
    id: 'montessori',
    name: 'Montessori',
    tagline: 'The child constructs themselves through purposeful work',
    description:
      'Self-directed activity with hands-on materials. Children choose their work from a prepared environment, developing independence and concentration.',
    keyElements: ['Prepared environment', 'Mixed ages', 'Uninterrupted work', 'Concrete to abstract'],
  },
  {
    id: 'charlotte_mason',
    name: 'Charlotte Mason',
    tagline: 'Children are born persons, fed with living ideas',
    description:
      'Living books, nature study, and short lessons. Emphasises narration, habit formation, and treating children as capable thinkers.',
    keyElements: ['Living books', 'Nature journals', 'Narration', 'Short lessons'],
  },
  {
    id: 'waldorf_steiner',
    name: 'Waldorf · Steiner',
    tagline: 'The child unfolds in stages, nourished by imagination',
    description:
      'Arts-integrated, imagination-rich education following developmental stages. Delays formal academics, emphasises rhythm and handwork.',
    keyElements: ['Artistic expression', 'Daily rhythm', 'Delayed academics', 'Natural materials'],
  },
  {
    id: 'classical',
    name: 'Classical',
    tagline: 'The mind is trained through the Trivium stages',
    description:
      'Grammar, Logic, and Rhetoric stages aligned with child development. Emphasises great books, memorisation, and logical thinking.',
    keyElements: ['Trivium stages', 'Memory work', 'Great books', 'Latin roots'],
  },
  {
    id: 'unschooling',
    name: 'Unschooling',
    tagline: 'Children learn naturally when trusted to follow their interests',
    description:
      'Child-led learning without formal curriculum. Life is the classroom; interests drive deep exploration.',
    keyElements: ['Interest-led', 'No curriculum', 'Life as learning', 'Trust the child'],
  },
  {
    id: 'eclectic',
    name: 'Eclectic',
    tagline: 'We draw consciously from multiple traditions',
    description:
      'Intentionally combining elements from different philosophies based on what works for your family. Requires more synthesis but offers flexibility.',
    keyElements: ['Flexible approach', 'Take what works', 'Conscious mixing', 'Family-defined'],
    isEclectic: true,
  },
];

export interface ProfileItem {
  id: string;
  name: string;
  description: string;
  compatibleWith: Pedagogy[];
  tensionWith: Pedagogy[];
}

export const VALUES: ProfileItem[] = [
  { id: 'child-led', name: 'Child-Led Exploration', description: "Following the child's interests and questions", compatibleWith: ['unschooling', 'montessori'], tensionWith: ['classical'] },
  { id: 'structured', name: 'Structured Progression', description: 'Clear sequence and milestones', compatibleWith: ['classical', 'charlotte_mason'], tensionWith: ['unschooling'] },
  { id: 'nature', name: 'Nature Connection', description: 'Outdoor learning and environmental awareness', compatibleWith: ['charlotte_mason', 'waldorf_steiner'], tensionWith: [] },
  { id: 'arts', name: 'Arts & Creativity', description: 'Artistic expression integrated throughout', compatibleWith: ['waldorf_steiner'], tensionWith: [] },
  { id: 'academic', name: 'Academic Rigor', description: 'Strong emphasis on traditional academics', compatibleWith: ['classical', 'charlotte_mason'], tensionWith: ['waldorf_steiner', 'unschooling'] },
  { id: 'real-world', name: 'Real-World Application', description: 'Learning connected to practical life', compatibleWith: ['unschooling', 'montessori'], tensionWith: [] },
  { id: 'flexibility', name: 'Flexibility & Flow', description: 'Adapting to daily rhythms and energy', compatibleWith: ['unschooling', 'eclectic'], tensionWith: ['classical'] },
  { id: 'whole-child', name: 'Whole-Child Development', description: 'Social, emotional, physical alongside academic', compatibleWith: ['waldorf_steiner', 'montessori'], tensionWith: [] },
  { id: 'independence', name: 'Independence & Self-Direction', description: 'Building autonomous learners', compatibleWith: ['montessori', 'unschooling'], tensionWith: [] },
  { id: 'mastery', name: 'Mastery Before Moving On', description: 'Deep understanding over coverage', compatibleWith: ['montessori', 'classical'], tensionWith: [] },
];

export const PRACTICES: ProfileItem[] = [
  { id: 'short-lessons', name: 'Short, Focused Lessons', description: '10–20 minute concentrated learning', compatibleWith: ['charlotte_mason'], tensionWith: ['waldorf_steiner'] },
  { id: 'extended-projects', name: 'Extended Projects', description: 'Multi-day or multi-week deep dives', compatibleWith: ['waldorf_steiner'], tensionWith: ['charlotte_mason'] },
  { id: 'living-books', name: 'Living Books & Literature', description: 'Real books over textbooks', compatibleWith: ['charlotte_mason', 'classical'], tensionWith: [] },
  { id: 'hands-on', name: 'Hands-On Materials', description: 'Concrete manipulatives and materials', compatibleWith: ['montessori', 'waldorf_steiner'], tensionWith: [] },
  { id: 'narration', name: 'Narration & Discussion', description: 'Retelling and oral processing', compatibleWith: ['charlotte_mason', 'classical'], tensionWith: [] },
  { id: 'nature-journaling', name: 'Nature Journaling', description: 'Observational drawing and notes', compatibleWith: ['charlotte_mason', 'waldorf_steiner'], tensionWith: [] },
  { id: 'movement', name: 'Movement Integration', description: 'Physical activity woven through learning', compatibleWith: ['waldorf_steiner', 'montessori'], tensionWith: [] },
  { id: 'rhythm', name: 'Daily & Weekly Rhythms', description: 'Predictable patterns and routines', compatibleWith: ['waldorf_steiner', 'charlotte_mason'], tensionWith: ['unschooling'] },
  { id: 'documentation', name: 'Documentation & Portfolios', description: 'Capturing learning as it happens', compatibleWith: [], tensionWith: [] },
  { id: 'free-play', name: 'Unstructured Play Time', description: 'Open-ended exploration without agenda', compatibleWith: ['unschooling', 'waldorf_steiner'], tensionWith: ['classical'] },
  { id: 'memory-work', name: 'Memory Work & Recitation', description: 'Poems, facts, and passages committed to memory', compatibleWith: ['classical', 'charlotte_mason'], tensionWith: ['unschooling'] },
  { id: 'copywork', name: 'Copywork & Handwriting', description: 'Careful transcription of quality writing', compatibleWith: ['charlotte_mason', 'classical'], tensionWith: [] },
];

export type CompatibilityStatus = 'compatible' | 'tension' | 'neutral';

export function getCompatibilityStatus(
  item: ProfileItem,
  philosophy: Pedagogy | null,
): CompatibilityStatus {
  if (!philosophy) return 'neutral';
  if (item.compatibleWith.includes(philosophy)) return 'compatible';
  if (item.tensionWith.includes(philosophy)) return 'tension';
  return 'neutral';
}

export function getPhilosophyById(id: Pedagogy | null): PhilosophyOption | undefined {
  if (!id) return undefined;
  return PHILOSOPHIES.find((p) => p.id === id);
}

export function getValueById(id: string): ProfileItem | undefined {
  return VALUES.find((v) => v.id === id);
}

export function getPracticeById(id: string): ProfileItem | undefined {
  return PRACTICES.find((p) => p.id === id);
}

// ─── Synthesis narrative ──────────────────────────────────────────────────

export function generateSynthesis(
  philosophyId: Pedagogy | null,
  valueIds: string[],
  practiceIds: string[],
): string {
  const philosophy = getPhilosophyById(philosophyId);
  if (!philosophy) {
    return 'Complete your selections to see your synthesised approach.';
  }

  const topValues = valueIds.slice(0, 3).map(getValueById).filter(Boolean) as ProfileItem[];
  const topPractices = practiceIds.slice(0, 3).map(getPracticeById).filter(Boolean) as ProfileItem[];

  let synthesis = `Your family follows a ${philosophy.name} foundation`;
  if (topValues.length > 0) {
    synthesis += `, prioritising ${topValues.map((v) => v.name.toLowerCase()).join(', ')}`;
  }
  if (topPractices.length > 0) {
    synthesis += `. Your daily learning will feature ${topPractices.map((p) => p.name.toLowerCase()).join(', ')}`;
  }
  synthesis += `. Hearth will interpret activities through this lens, offering ${philosophy.name}-informed observations and suggestions that align with your values.`;
  return synthesis;
}

// ─── Demo activity + per-philosophy insights ─────────────────────────────
// The Review step's proof-of-value moment. Content mirrors the Logger's
// real AI insight format — this is the contract: "this is what you'll get."

export const DEMO_ACTIVITY = {
  title: 'Bug Observation Under Rocks',
  description:
    'Yesterday we went outside and Emma was looking at bugs under a rock. She found a slater and wanted to know why it rolls up. We looked at it for ages.',
  duration: '30 minutes',
  subjects: ['Science', 'Language'],
};

export interface DemoInsight {
  title: string;
  content: string;
}

export function getPhilosophyInsight(philosophyId: Pedagogy | null): DemoInsight {
  if (!philosophyId) {
    return {
      title: 'Select a philosophy to see insights',
      content: 'Your chosen educational philosophy will shape how Hearth interprets this activity.',
    };
  }

  const insights: Record<Pedagogy, DemoInsight> = {
    montessori: {
      title: 'Through a Montessori Lens',
      content:
        'Emma demonstrated concentrated attention and self-directed exploration. The extended observation time shows deep engagement. Consider providing a magnifying glass and specimen containers to extend this prepared environment for future investigations.',
    },
    charlotte_mason: {
      title: 'Through a Charlotte Mason Lens',
      content:
        "This is classic nature study. Emma showed sustained attention, natural curiosity in asking 'why', and close observation in noticing the rolling behaviour. This calls for a nature journal entry — even a simple drawing captures this living encounter.",
    },
    waldorf_steiner: {
      title: 'Through a Waldorf Lens',
      content:
        "Emma entered into relationship with the natural world through wonder and patience. The reverence for small creatures reflects the Waldorf approach to nature. Consider following with a story about the slater's life, drawn from imagination rather than facts.",
    },
    classical: {
      title: 'Through a Classical Lens',
      content:
        "Emma is in the Grammar stage — absorbing facts and asking 'what' and 'why'. This observation provides concrete knowledge to build upon. Consider introducing the proper taxonomic name (Armadillidium vulgare) and its Latin meaning.",
    },
    unschooling: {
      title: 'Through an Unschooling Lens',
      content:
        "Emma's self-initiated inquiry led to extended, joyful learning. Her question emerged naturally from genuine curiosity. The learning was driven entirely by her interest — this is exactly how unschooling works.",
    },
    eclectic: {
      title: 'Multiple Perspectives',
      content:
        "This activity touches several traditions: Charlotte Mason's nature study, Montessori's concentration, and Unschooling's interest-led learning. Your eclectic approach lets you draw insights from each.",
    },
  };

  return insights[philosophyId];
}

export function getValuesInsight(valueIds: string[]): DemoInsight {
  if (valueIds.length === 0) {
    return {
      title: 'Select values to see alignment',
      content: 'Your prioritised values will highlight what matters most in this activity.',
    };
  }

  const alignments: string[] = [];
  if (valueIds.includes('child-led'))
    alignments.push('Emma initiated this exploration entirely on her own — child-led learning in action');
  if (valueIds.includes('nature'))
    alignments.push('Direct encounter with living creatures builds lasting nature connection');
  if (valueIds.includes('whole-child'))
    alignments.push('This engaged curiosity, patience, observation skills, and emotional wonder');
  if (valueIds.includes('independence'))
    alignments.push('Emma directed her own investigation without adult prompting');
  if (valueIds.includes('mastery'))
    alignments.push('The extended observation time suggests deep, focused understanding');

  return {
    title: 'Values Alignment',
    content:
      alignments.length > 0
        ? alignments.join('. ') + '.'
        : 'This activity connects to your selected values through authentic, engaged learning.',
  };
}

export function getPracticesInsight(practiceIds: string[]): DemoInsight {
  if (practiceIds.length === 0) {
    return {
      title: 'Select practices to see suggestions',
      content: 'Your chosen practices will shape what Hearth suggests for follow-up.',
    };
  }

  const suggestions: string[] = [];
  if (practiceIds.includes('nature-journaling'))
    suggestions.push('Start a nature journal entry with a drawing of the slater, noting the date and location');
  if (practiceIds.includes('narration'))
    suggestions.push('Ask Emma to tell you about the slater in her own words — what did she notice?');
  if (practiceIds.includes('living-books'))
    suggestions.push("Read 'Diary of a Wombat' or similar — seeing the world from an animal's perspective");
  if (practiceIds.includes('documentation'))
    suggestions.push("Take a photo for Emma's portfolio and record her questions for later investigation");
  if (practiceIds.includes('extended-projects'))
    suggestions.push("This could become a 'mini-beast' project — returning daily to observe what lives under rocks");
  if (practiceIds.includes('hands-on'))
    suggestions.push("Create a temporary habitat to observe the slater's behaviour up close");

  return {
    title: 'Suggested Next Steps',
    content:
      suggestions.length > 0
        ? suggestions.slice(0, 3).join('. ') + '.'
        : "Based on your practices, continue following Emma's curiosity about the natural world.",
  };
}

export const VALID_VALUE_IDS = VALUES.map((v) => v.id);
export const VALID_PRACTICE_IDS = PRACTICES.map((p) => p.id);
export const VALID_PHILOSOPHY_IDS = PHILOSOPHIES.map((p) => p.id);
