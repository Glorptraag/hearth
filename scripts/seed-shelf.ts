/**
 * Hearth Sanity Seed — Shelf Resources (wave 1)
 *
 * Seeds the curriculum + universal shelfResource documents the Shelf photo
 * matcher recognises. Ids are deterministic: shelfResource.<slug>.
 *
 * Dry run (default, no network, no token needed):
 *   npx tsx scripts/seed-shelf.ts
 * Write (explicit dataset required, never read from env):
 *   npx tsx scripts/seed-shelf.ts --write --dataset <name>
 *
 * Idempotent — uses createOrReplace.
 * Schema: src/sanity/schemas/shelfResource.ts  Types: src/lib/shelf/types.ts
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import type { ShelfResource } from '../src/lib/shelf/types';

type ShelfSeed = ShelfResource & { _type: 'shelfResource' };

function doc(slug: string, rest: Omit<ShelfResource, '_id' | 'slug' | 'status'>): ShelfSeed {
  return {
    _id: `shelfResource.${slug}`,
    _type: 'shelfResource',
    slug: { current: slug },
    status: 'published',
    ...rest,
  };
}

const lessonRegex = 'Lesson\\s+(\\d+)';
const chapterRegex = 'Chapter\\s+(\\d+)';

export const SHELF_RESOURCES: ShelfSeed[] = [
  doc('math-u-see', {
    title: 'Math-U-See',
    publisher: 'Demme Learning',
    kind: 'curriculum',
    aliases: ['Math U See', 'MathUSee', 'Math-U-See', 'Demme Learning', 'Steve Demme'],
    lessonPattern: lessonRegex,
    levels: [
      { name: 'Primer' },
      { name: 'Alpha' },
      { name: 'Beta' },
      { name: 'Gamma' },
      { name: 'Delta' },
      { name: 'Epsilon' },
      { name: 'Zeta' },
      { name: 'Pre-Algebra', aliases: ['Pre Algebra', 'PreAlgebra'] },
      { name: 'Algebra 1', aliases: ['Algebra I'] },
      { name: 'Geometry' },
      { name: 'Algebra 2', aliases: ['Algebra II'] },
      { name: 'Pre-Calculus', aliases: ['Pre Calculus', 'Precalculus'] },
      { name: 'Calculus' },
    ],
    ageBand: { min: 5, max: 18 },
    isUniversal: false,
  }),
  doc('the-good-and-the-beautiful', {
    title: 'The Good and the Beautiful',
    publisher: 'The Good and the Beautiful',
    kind: 'curriculum',
    aliases: [
      'Good and the Beautiful',
      'The Good & the Beautiful',
      'Good & Beautiful',
      'TGATB',
      'goodandbeautiful.com',
    ],
    lessonPattern: lessonRegex,
    levels: [
      { name: 'Language Arts K', aliases: ['Language Arts Kindergarten', 'Level K'] },
      { name: 'Language Arts 1', aliases: ['Language Arts Level 1', 'Level 1'] },
      { name: 'Language Arts 2', aliases: ['Language Arts Level 2', 'Level 2'] },
      { name: 'Language Arts 3', aliases: ['Language Arts Level 3', 'Level 3'] },
      { name: 'Language Arts 4', aliases: ['Language Arts Level 4', 'Level 4'] },
      { name: 'Language Arts 5', aliases: ['Language Arts Level 5', 'Level 5'] },
      { name: 'Language Arts 6', aliases: ['Language Arts Level 6', 'Level 6'] },
      { name: 'Math K', aliases: ['Math Kindergarten', 'Math Level K'] },
      { name: 'Math 1', aliases: ['Math Level 1'] },
      { name: 'Math 2', aliases: ['Math Level 2'] },
      { name: 'Math 3', aliases: ['Math Level 3'] },
      { name: 'Math 4', aliases: ['Math Level 4'] },
      { name: 'Math 5', aliases: ['Math Level 5'] },
      { name: 'Math 6', aliases: ['Math Level 6'] },
    ],
    ageBand: { min: 5, max: 14 },
    isUniversal: false,
  }),
  doc('all-about-reading', {
    title: 'All About Reading',
    publisher: 'All About Learning Press',
    kind: 'curriculum',
    aliases: ['AAR', 'All About Learning Press', 'AALP', 'allaboutlearningpress.com'],
    lessonPattern: lessonRegex,
    levels: [
      { name: 'Pre-reading', aliases: ['Pre-Reading', 'Pre Reading', 'Pre-reading Level'] },
      { name: 'Level 1', aliases: ['Level One'] },
      { name: 'Level 2', aliases: ['Level Two'] },
      { name: 'Level 3', aliases: ['Level Three'] },
      { name: 'Level 4', aliases: ['Level Four'] },
    ],
    ageBand: { min: 4, max: 12 },
    isUniversal: false,
  }),
  doc('story-of-the-world', {
    title: 'Story of the World',
    publisher: 'Peace Hill Press',
    kind: 'curriculum',
    aliases: [
      'The Story of the World',
      'SOTW',
      'Susan Wise Bauer',
      'Peace Hill Press',
      'History for the Classical Child',
    ],
    lessonPattern: chapterRegex,
    levels: [
      { name: 'Volume 1', aliases: ['Vol. 1', 'Vol 1', 'Ancient Times'] },
      { name: 'Volume 2', aliases: ['Vol. 2', 'Vol 2', 'The Middle Ages'] },
      { name: 'Volume 3', aliases: ['Vol. 3', 'Vol 3', 'Early Modern Times'] },
      { name: 'Volume 4', aliases: ['Vol. 4', 'Vol 4', 'The Modern Age'] },
    ],
    ageBand: { min: 6, max: 12 },
    isUniversal: false,
  }),
  doc('my-own-plan', {
    title: 'My own plan',
    kind: 'universal',
    aliases: ['My own plan', 'Own plan', 'Self-directed'],
    isUniversal: true,
  }),
  doc('an-ai-made-plan', {
    title: 'An AI-made plan',
    kind: 'universal',
    aliases: ['AI-made plan', 'AI plan', 'AI generated plan', 'ChatGPT plan'],
    isUniversal: true,
  }),
];

function argValue(args: string[], flag: string): string | undefined {
  const eq = args.find((a) => a.startsWith(`${flag}=`));
  if (eq) return eq.slice(flag.length + 1);
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main() {
  const args = process.argv.slice(2);

  if (!args.includes('--write')) {
    console.log(
      `[dry-run] ${SHELF_RESOURCES.length} shelfResource docs (pass --write --dataset <name> to write)\n`,
    );
    for (const d of SHELF_RESOURCES) console.log(JSON.stringify(d, null, 2));
    console.log(`\n[dry-run] ${SHELF_RESOURCES.length} docs printed, nothing written.`);
    return;
  }

  const dataset = argValue(args, '--dataset');
  if (!dataset || dataset.startsWith('--')) {
    console.error('--write requires an explicit --dataset <name>. Aborting.');
    process.exit(1);
  }

  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const token = process.env.SANITY_API_TOKEN;
  if (!projectId || !token) {
    console.error('NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN are required for --write. Aborting.');
    process.exit(1);
  }

  const client = createClient({ projectId, dataset, token, apiVersion: '2024-01-01', useCdn: false });
  console.log(`Writing ${SHELF_RESOURCES.length} docs to dataset "${dataset}"`);
  const tx = client.transaction();
  for (const d of SHELF_RESOURCES) tx.createOrReplace(d);
  await tx.commit();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
