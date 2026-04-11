/**
 * Hearth Sanity Seed — Pedagogical Frameworks
 * Seeds the 6 canonical pedagogical framework documents.
 *
 * Run: npx tsx scripts/seed-pedagogy-frameworks.ts
 * Idempotent — uses createOrReplace throughout.
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

const FRAMEWORKS = [
  {
    _id: 'pedagogicalFramework.charlotte_mason',
    _type: 'pedagogicalFramework',
    slug: 'charlotte_mason',
    title: 'Charlotte Mason',
    tagline: 'Living books, nature study, narration',
    greetingTone: 'warm',
    vocabulary: {
      sessionNoun: 'lesson',
      facilitatorNoun: 'guide',
      learnerNoun: 'student',
      activityVerb: 'studied',
      growthNoun: 'habit formation',
    },
    uiCopy: {
      logNudge: 'What living ideas did your child encounter today?',
      logWhatLabel: 'What living ideas were encountered?',
      logWhatPlaceholder: 'Describe the lesson… What living books or nature moments captured attention?',
      logObserveLabel: 'What habits did you notice forming?',
      coverageFrame: 'Breadth of living ideas explored',
      gapFrame: 'This area is waiting for its living book moment',
      celebrationFrame: 'A beautiful habit is forming',
      plannerFrame: 'Plan a feast of ideas for the week',
    },
  },
  {
    _id: 'pedagogicalFramework.classical',
    _type: 'pedagogicalFramework',
    slug: 'classical',
    title: 'Classical',
    tagline: 'Grammar, logic, rhetoric',
    greetingTone: 'structured',
    vocabulary: {
      sessionNoun: 'lesson',
      facilitatorNoun: 'teacher',
      learnerNoun: 'student',
      activityVerb: 'practised',
      growthNoun: 'mastery',
    },
    uiCopy: {
      logNudge: 'What knowledge was gathered or practised today?',
      logWhatLabel: 'What was studied or practised?',
      logWhatPlaceholder: 'Describe the lesson… What knowledge was gathered or skills drilled?',
      logObserveLabel: 'What mastery or progress did you observe?',
      coverageFrame: 'Subjects under study',
      gapFrame: 'This subject needs attention in the trivium',
      celebrationFrame: 'Excellent progress through the stages',
      plannerFrame: 'Structure the week across your trivium',
    },
  },
  {
    _id: 'pedagogicalFramework.montessori',
    _type: 'pedagogicalFramework',
    slug: 'montessori',
    title: 'Montessori',
    tagline: 'Hands-on, child-led, prepared environment',
    greetingTone: 'warm',
    vocabulary: {
      sessionNoun: 'work cycle',
      facilitatorNoun: 'guide',
      learnerNoun: 'child',
      activityVerb: 'explored',
      growthNoun: 'development',
    },
    uiCopy: {
      logNudge: 'What did the child choose to work on today?',
      logWhatLabel: 'What work was chosen?',
      logWhatPlaceholder: 'Describe the work cycle… What did the child choose? How long did they concentrate?',
      logObserveLabel: 'What concentration or self-direction did you observe?',
      coverageFrame: 'Areas of the prepared environment touched',
      gapFrame: 'This area of the environment is waiting to be discovered',
      celebrationFrame: 'Deep concentration and self-directed work',
      plannerFrame: 'Prepare the environment for the week ahead',
    },
  },
  {
    _id: 'pedagogicalFramework.waldorf_steiner',
    _type: 'pedagogicalFramework',
    slug: 'waldorf_steiner',
    title: 'Waldorf / Steiner',
    tagline: 'Arts integration, seasonal rhythms',
    greetingTone: 'poetic',
    vocabulary: {
      sessionNoun: 'main lesson',
      facilitatorNoun: 'teacher',
      learnerNoun: 'child',
      activityVerb: 'experienced',
      growthNoun: 'unfolding',
    },
    uiCopy: {
      logNudge: 'What stories, art, or rhythm shaped today?',
      logWhatLabel: 'What was experienced?',
      logWhatPlaceholder: 'Describe the main lesson… What stories, art, or rhythm shaped the day?',
      logObserveLabel: 'What unfolding of understanding did you notice?',
      coverageFrame: 'Subjects woven through the rhythms',
      gapFrame: 'This thread of learning is ready to be woven in',
      celebrationFrame: 'A beautiful unfolding of understanding',
      plannerFrame: 'Weave the week with rhythm and imagination',
    },
  },
  {
    _id: 'pedagogicalFramework.unschooling',
    _type: 'pedagogicalFramework',
    slug: 'unschooling',
    title: 'Unschooling',
    tagline: 'Interest-led, life as the curriculum',
    greetingTone: 'playful',
    vocabulary: {
      sessionNoun: 'experience',
      facilitatorNoun: 'facilitator',
      learnerNoun: 'learner',
      activityVerb: 'discovered',
      growthNoun: 'growth',
    },
    uiCopy: {
      logNudge: 'What sparked curiosity or joy today?',
      logWhatLabel: 'What sparked curiosity?',
      logWhatPlaceholder: 'What happened naturally… What caught their interest? Where did it lead?',
      logObserveLabel: 'What connections or enthusiasm did you notice?',
      coverageFrame: 'Interests and experiences captured',
      gapFrame: 'Opportunities to follow curiosity here',
      celebrationFrame: 'Following the spark led somewhere wonderful',
      plannerFrame: 'Ideas and invitations for the week',
    },
  },
  {
    _id: 'pedagogicalFramework.eclectic',
    _type: 'pedagogicalFramework',
    slug: 'eclectic',
    title: 'Eclectic',
    tagline: 'Mix and match what works for your family',
    greetingTone: 'warm',
    vocabulary: {
      sessionNoun: 'session',
      facilitatorNoun: 'parent',
      learnerNoun: 'child',
      activityVerb: 'learned',
      growthNoun: 'progress',
    },
    uiCopy: {
      logNudge: 'What happened in learning today?',
      logWhatLabel: 'What happened?',
      logWhatPlaceholder: 'Describe the activity or moment… What were they doing?',
      logObserveLabel: 'What did you observe?',
      coverageFrame: 'Subject areas covered',
      gapFrame: 'This area could use some attention',
      celebrationFrame: 'Great progress this week',
      plannerFrame: 'Plan the week ahead',
    },
  },
];

async function run() {
  console.log(`Seeding ${FRAMEWORKS.length} pedagogical frameworks…`);

  const tx = client.transaction();
  for (const framework of FRAMEWORKS) {
    tx.createOrReplace(framework);
  }
  await tx.commit();

  console.log('Done.');
  for (const f of FRAMEWORKS) {
    console.log(`  ✓ ${f.title} (${f._id})`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
