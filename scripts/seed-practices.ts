/**
 * Hearth Sanity Seed — Practices (Methodology Layer)
 *
 * Seeds the twelve practice documents introduced by the Methodology Overlay Bundle spec.
 * Anchor pedagogies and theme keywords drive the practice-relevance retrieval filter
 * applied during overlay generation (docs/hearth-methodology-overlay-bundle-v1.md §9).
 *
 * Run: npx tsx scripts/seed-practices.ts
 * Idempotent — uses createOrReplace.
 *
 * Spec: docs/hearth-methodology-overlay-bundle-v1.md
 * Schema: src/sanity/schemas/practice.ts
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

type PracticeSeed = {
  key: string;
  title: string;
  description: string;
  practiceVocabulary: string[];
  anchorPedagogySlugs: string[]; // matches pedagogicalFramework.slug
  themeKeywords: string[];
};

// Anchor table: docs/hearth-methodology-overlay-bundle-v1.md §9.
const PRACTICES: PracticeSeed[] = [
  {
    key: 'narration',
    title: 'Narration & Discussion',
    description:
      'The child tells back what they encountered, in their own words, after the reading or activity.',
    practiceVocabulary: ['tell back', 'in their own words', 'after the reading', 'narration'],
    anchorPedagogySlugs: ['charlotte_mason', 'classical'],
    themeKeywords: ['narration', 'oral_language', 'tell_back', 'discussion'],
  },
  {
    key: 'copywork',
    title: 'Copywork & Handwriting',
    description:
      'Transcribing carefully chosen passages to internalise grammar, rhythm, and the shape of good prose.',
    practiceVocabulary: ['passage', 'transcribe', 'fair copy', 'copywork'],
    anchorPedagogySlugs: ['charlotte_mason', 'classical'],
    themeKeywords: ['copywork', 'handwriting', 'transcription', 'penmanship'],
  },
  {
    key: 'nature-journaling',
    title: 'Nature Journaling',
    description:
      'Sustained attention to a small piece of the natural world, captured in drawing and a few words.',
    practiceVocabulary: ['nature notebook', 'firsthand observation', 'sketch', 'nature study'],
    anchorPedagogySlugs: ['charlotte_mason', 'waldorf_steiner'],
    themeKeywords: ['nature_study', 'firsthand_knowledge', 'observation', 'outdoor'],
  },
  {
    key: 'short-lessons',
    title: 'Short, Focused Lessons',
    description:
      'Brief, full-attention lessons (typically 10–20 minutes) that end before fatigue sets in.',
    practiceVocabulary: ['short lesson', 'full attention', 'before fatigue', 'fresh interest'],
    anchorPedagogySlugs: ['charlotte_mason'],
    themeKeywords: ['short_lessons', 'attention', 'habit_of_attention', 'focus'],
  },
  {
    key: 'memory-work',
    title: 'Memory Work & Recitation',
    description:
      'Memorising and reciting passages, verses, facts, and tables — building the storehouse of the mind.',
    practiceVocabulary: ['memorise', 'recite', 'verse', 'commit to memory', 'recitation'],
    anchorPedagogySlugs: ['classical', 'charlotte_mason'],
    themeKeywords: ['memory_work', 'recitation', 'verse', 'storehouse'],
  },
  {
    key: 'hands-on',
    title: 'Hands-On Materials',
    description:
      'Concrete, manipulable materials the child works with directly — the abstraction follows the hand.',
    practiceVocabulary: ['material', 'work with', 'manipulate', 'concrete'],
    anchorPedagogySlugs: ['montessori', 'waldorf_steiner'],
    themeKeywords: ['hands_on', 'materials', 'manipulative', 'concrete', 'tactile'],
  },
  {
    key: 'rhythm',
    title: 'Daily & Weekly Rhythms',
    description:
      'Predictable rhythms — morning, afternoon, weekly — that hold the learning week without rigid scheduling.',
    practiceVocabulary: ['rhythm', 'main lesson', 'morning', 'weekly arc'],
    anchorPedagogySlugs: ['waldorf_steiner', 'charlotte_mason'],
    themeKeywords: ['rhythm', 'routine', 'cadence', 'weekly_arc', 'daily_rhythm'],
  },
  {
    key: 'extended-projects',
    title: 'Extended Projects',
    description:
      'Multi-session projects that unfold across days or weeks, allowing depth and the kind of learning that needs time to settle.',
    practiceVocabulary: ['main lesson block', 'extended project', 'unfolds', 'over weeks'],
    anchorPedagogySlugs: ['waldorf_steiner'],
    themeKeywords: ['extended_projects', 'main_lesson_block', 'depth', 'multi_session'],
  },
  {
    key: 'living-books',
    title: 'Living Books & Literature',
    description:
      'Books written by an author with a passion for the subject — narrative, ideas-rich, carrying the topic alive into the child.',
    practiceVocabulary: ['living book', 'one mind to another', 'narrative', 'literary'],
    anchorPedagogySlugs: ['charlotte_mason', 'classical'],
    themeKeywords: ['living_books', 'literature', 'narrative', 'reading_aloud'],
  },
  {
    key: 'documentation',
    title: 'Documentation & Portfolios',
    description:
      'Capturing evidence of learning — photographs, work samples, narrations — into a portfolio the family revisits.',
    practiceVocabulary: ['portfolio', 'evidence', 'work sample', 'capture'],
    anchorPedagogySlugs: [], // platform-side practice; no corpus anchor
    themeKeywords: ['documentation', 'portfolio', 'evidence', 'capture'],
  },
  {
    key: 'free-play',
    title: 'Unstructured Play Time',
    description:
      'Open, child-directed play time with no adult agenda — the imaginative work that does not look like work.',
    practiceVocabulary: ['free play', 'child-led', 'unstructured time', 'imagine'],
    anchorPedagogySlugs: ['unschooling', 'waldorf_steiner'],
    themeKeywords: ['free_play', 'unstructured', 'child_led', 'imagination'],
  },
  {
    key: 'movement',
    title: 'Movement Integration',
    description:
      'Physical movement woven through learning — large-motor play, finger games, eurythmy, walking lessons.',
    practiceVocabulary: ['movement', 'finger games', 'eurythmy', 'embodied'],
    anchorPedagogySlugs: ['waldorf_steiner', 'montessori'],
    themeKeywords: ['movement', 'embodied', 'physical', 'eurythmy', 'finger_games'],
  },
];

async function run() {
  console.log(`Seeding ${PRACTICES.length} practices…`);

  const tx = client.transaction();
  for (const p of PRACTICES) {
    tx.createOrReplace({
      _id: `practice.${p.key.replace(/-/g, '_')}`,
      _type: 'practice',
      key: p.key,
      title: p.title,
      description: p.description,
      practiceVocabulary: p.practiceVocabulary,
      anchorPedagogies: p.anchorPedagogySlugs.map((slug, idx) => ({
        _key: `anchor-${idx}`,
        _type: 'reference',
        _ref: `pedagogicalFramework.${slug}`,
      })),
      themeKeywords: p.themeKeywords,
    });
  }
  await tx.commit();

  console.log('Done.');
  for (const p of PRACTICES) {
    const anchors = p.anchorPedagogySlugs.length
      ? p.anchorPedagogySlugs.join(', ')
      : '(no corpus anchor — uses Sanity template fallback)';
    console.log(`  ✓ ${p.title} [${p.key}] — anchors: ${anchors}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
