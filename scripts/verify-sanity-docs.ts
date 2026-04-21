/**
 * Verify PKB corpus documents exist in Sanity.
 * Run: npx tsx scripts/verify-sanity-docs.ts
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

async function main() {
  const docs = await client.fetch<{ _type: string; _id: string }[]>(
    `*[_type in [
      "pedagogySourceExcerpt",
      "pedagogyPracticePattern",
      "pedagogyObservationalMarker",
      "pedagogyFacilitationVocabulary",
      "pedagogyContraindication",
      "pedagogyWorkedExample"
    ] && !(_id in path("drafts.**"))]{_type, _id}`
  );

  const breakdown: Record<string, number> = {};
  for (const doc of docs) {
    breakdown[doc._type] = (breakdown[doc._type] ?? 0) + 1;
  }

  console.log(`\nTotal PKB documents: ${docs.length}\n`);
  console.log('Breakdown by type:');
  for (const [type, count] of Object.entries(breakdown).sort()) {
    console.log(`  ${type}: ${count}`);
  }
  console.log();

  if (docs.length === 45) {
    console.log('✓ Count verified: 45 documents present.');
  } else {
    console.error(`✗ Expected 45, found ${docs.length}.`);
    process.exit(1);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
