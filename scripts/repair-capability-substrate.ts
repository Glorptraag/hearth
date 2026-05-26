/**
 * Repair the capability substrate in Sanity production.
 *
 * Fixes drift between src/lib/capability-universe-v2.ts (authoritative) and
 * the live Sanity dataset that accumulated from earlier (pre-v2) seeds:
 *
 *   1. The 15 v2 capabilityDomain docs are missing numericId (1–15) and
 *      use the OLD superDomain vocabulary (literacySymbolic, inquiryWorld,
 *      …) instead of the spec-canonical kebab-case (foundations,
 *      cultural-inheritance, …). Schema currently rejects both — every doc
 *      is failing validation in Studio. Fix: patch each by deterministic
 *      ID with the canonical numericId + superDomain.
 *
 *   2. 17 legacy v1 capabilityThread docs exist with UUID or seed-ct-*
 *      IDs and the old string `domain` field (e.g. "mathematics",
 *      "literacy"). They are superseded by the canonical 57 threads at
 *      capabilityThread.{L1, M3, …} and have no DLOs or inbound refs.
 *      Fix: delete.
 *
 * Idempotent. Re-running is safe. Default mode is --dry-run; pass
 * --execute to actually mutate.
 *
 * Usage:
 *   SANITY_API_TOKEN=<write-token> npx tsx scripts/repair-capability-substrate.ts            # dry run
 *   SANITY_API_TOKEN=<write-token> npx tsx scripts/repair-capability-substrate.ts --execute  # apply
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { V2_DOMAINS } from '../src/lib/capability-universe-v2';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DRY_RUN = !process.argv.includes('--execute');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? process.env.SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? process.env.SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

// Map V2_DOMAINS.superDomain → spec-canonical kebab-case superDomain key
// (the schema's accepted vocabulary in src/sanity/schemas/capabilityDomain.ts).
const SUPER_DOMAIN: Record<string, string> = {
  foundations: 'foundations',
  'cultural-inheritance': 'cultural-inheritance',
  'classical-disciplines': 'classical-disciplines',
  'aesthetic-expression': 'aesthetic-expression',
  'practical-vocational': 'practical-vocational',
  'human-formation': 'human-formation',
};

// 17 legacy v1 thread IDs (UUIDs + seed-ct-*). Pulled via:
//   *[_type == "capabilityThread" && !(_id match "capabilityThread.*")]._id
// All have no DLOs, no inbound references, and the old string `domain` field.
const LEGACY_THREAD_IDS = [
  '01cc7b05-3178-4819-831c-2b3030baf27c', // algebraic-thinking
  '0f1fbb7d-7a22-4ce7-8132-4ddd7bafbf30', // critical-thinking
  '27ee9cd2-9d17-4550-805a-f33859e9f4d6', // living-systems
  '3033a779-013a-4e3e-8eee-74b0f30eebcd', // scientific-observation (uuid)
  '656423d8-b2d3-4ca1-a55e-ff7c036b6662', // measurement
  '6c15c5af-b8f0-4320-b2a9-3cb1ae70f8a7', // text-structure
  '7553ce52-388f-4f99-b04f-4606b2917e23', // mathematical-communication
  '84159095-c48d-4c81-8b00-bdd19ae63e5b', // scientific-inquiry
  '8dafa6db-2242-4d4f-8258-8c15039b5ac5', // data-and-statistics
  '9a5ed5dc-0f32-480d-bfb8-44f45dff5703', // written-expression
  'cc50d67f-2cea-4b0b-b6de-fd514692ab81', // visual-expression
  'fc972f10-569c-4580-9f60-4420af6b573c', // oral-communication
  'seed-ct-measurement',
  'seed-ct-narrative',
  'seed-ct-number-sense',
  'seed-ct-sci-obs',
  'seed-ct-visual-arts',
];

async function patchDomains() {
  console.log(`\n[1/2] Patching numericId + superDomain on 15 v2 capabilityDomain docs...`);
  const transaction = client.transaction();
  for (const domain of V2_DOMAINS) {
    const id = `capabilityDomain.${domain.key}`;
    const superDomain = SUPER_DOMAIN[domain.superDomain];
    if (!superDomain) {
      throw new Error(`Unknown superDomain "${domain.superDomain}" for ${domain.key}`);
    }
    console.log(
      `  ${String(domain.numericId).padStart(2)}. ${domain.key.padEnd(28)} → numericId=${domain.numericId}, superDomain=${superDomain}`
    );
    transaction.patch(id, { set: { numericId: domain.numericId, superDomain } });
  }
  if (DRY_RUN) {
    console.log(`  (dry-run — no mutations sent)`);
    return;
  }
  const result = await transaction.commit();
  console.log(`  ✓ Patched ${result.results.length} domain docs.`);
}

async function deleteLegacyThreads() {
  console.log(`\n[2/2] Deleting ${LEGACY_THREAD_IDS.length} legacy v1 capabilityThread docs...`);
  for (const id of LEGACY_THREAD_IDS) {
    console.log(`  - ${id}`);
  }
  if (DRY_RUN) {
    console.log(`  (dry-run — no mutations sent)`);
    return;
  }
  const transaction = client.transaction();
  for (const id of LEGACY_THREAD_IDS) {
    transaction.delete(id);
  }
  const result = await transaction.commit();
  console.log(`  ✓ Deleted ${result.results.length} thread docs.`);
}

async function run() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('SANITY_API_TOKEN is required.');
    process.exit(1);
  }

  console.log(
    DRY_RUN
      ? '═══ DRY RUN — no mutations will be sent. Pass --execute to apply. ═══'
      : '═══ EXECUTE MODE — mutations will be sent to production. ═══'
  );

  await patchDomains();
  await deleteLegacyThreads();

  console.log(
    DRY_RUN
      ? '\nDry run complete. Re-run with --execute to apply.'
      : '\nRepair complete.'
  );
}

run().catch((err) => {
  console.error('✗ Repair failed:', err);
  process.exit(1);
});
