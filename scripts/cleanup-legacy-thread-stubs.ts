/**
 * Deletes the 5 pre-v2 capabilityThread stubs from production.
 *
 * These docs (`seed-ct-*`) pre-date the v2 architecture and use IDs that don't
 * match the `capabilityThread.{legacyV1Id}` convention the rest of the codebase
 * expects. Per Wave-1 unblock plan they must be removed before
 * seed-capability-threads.ts seeds the 57 canonical threads.
 *
 * If any of these docs are referenced by other documents (modules, packs, etc.)
 * the delete will fail with a reference-integrity error — in which case STOP
 * and rewrite those refs to the new capabilityThread.{id} form first.
 *
 * Usage:
 *   SANITY_API_TOKEN=<write-token> npx tsx scripts/cleanup-legacy-thread-stubs.ts
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const LEGACY_IDS = [
  'seed-ct-measurement',
  'seed-ct-narrative',
  'seed-ct-number-sense',
  'seed-ct-sci-obs',
  'seed-ct-visual-arts',
];

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? process.env.SANITY_PROJECT_ID ?? 'g5zhwbxg',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? process.env.SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

async function run() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('SANITY_API_TOKEN is required.');
    process.exit(1);
  }

  const before = await client.fetch<number>('count(*[_type == "capabilityThread"])');
  console.log(`Pre-delete capabilityThread count: ${before}`);

  try {
    const res = await client.delete({ query: `*[_id in $ids]`, params: { ids: LEGACY_IDS } });
    console.log('Delete result:', JSON.stringify(res, null, 2));
  } catch (err: any) {
    console.error('Delete failed:', err.message ?? err);
    console.error('\nLikely cause: one or more legacy threads are referenced by other docs.');
    console.error('Query for referrers, rewrite refs to capabilityThread.{id}, then re-run.');
    process.exit(1);
  }

  const after = await client.fetch<number>('count(*[_type == "capabilityThread"])');
  console.log(`Post-delete capabilityThread count: ${after}`);
  console.log('\nNext: npx tsx scripts/seed-capability-domains.ts');
}

run();
