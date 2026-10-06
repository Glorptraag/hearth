/**
 * Hearth Sanity Seed — Site Copy
 *
 * Pushes the code-owned copy keys (src/lib/copy/defaults.ts) into Sanity as one
 * published `siteCopy` document per surface. Idempotent and NON-DESTRUCTIVE by
 * default: values an editor changed in Studio are kept; new keys are added with
 * their default; keys removed from code are dropped.
 *
 * Run:   npm run seed:copy            # merge (safe to re-run after every deploy)
 *        npm run seed:copy -- --reset # overwrite every value with the code default
 *        npm run copy:check           # report drift, exit 1 if a seed would change Sanity
 *        npm run seed:copy -- --dry-run
 *
 * Requires SANITY_API_TOKEN with write access (reads .env.local).
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import {
  describePlan,
  hasDrift,
  orphanSurfaces,
  planAllSurfaces,
  type ExistingSiteCopyDoc,
} from '../src/lib/copy/seed-plan';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const args = new Set(process.argv.slice(2));
const RESET = args.has('--reset');
const DRY_RUN = args.has('--dry-run');
const CHECK = args.has('--check');

async function main() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is not set');
  const token = process.env.SANITY_API_TOKEN;
  if (!token && !CHECK) throw new Error('SANITY_API_TOKEN is not set (required to write)');

  const client = createClient({
    projectId,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
    token,
    apiVersion: '2024-01-01',
    useCdn: false,
  });

  const existing = await client.fetch<ExistingSiteCopyDoc[]>(
    `*[_type == "siteCopy" && !(_id in path("drafts.**"))]{ _id, surface, entries[]{ key, value } }`,
  );
  const drafts = await client.fetch<string[]>(`*[_type == "siteCopy" && _id in path("drafts.**")]._id`);

  const plans = planAllSurfaces(existing, { reset: RESET });
  const orphans = orphanSurfaces(existing);

  console.log(describePlan(plans, orphans));
  if (drafts.length > 0) {
    console.log(
      `\nNOTE: ${drafts.length} unpublished Site Copy draft(s) exist in Studio (${drafts.join(', ')}). ` +
        'This seed writes PUBLISHED documents only; publish or discard those drafts in Studio so they do not shadow the seeded values.',
    );
  }

  if (CHECK) {
    const drift = hasDrift(plans);
    console.log(drift ? '\nDRIFT: a seed would change Sanity.' : '\nOK: Sanity matches the code-owned keys.');
    process.exit(drift ? 1 : 0);
  }

  if (!hasDrift(plans)) {
    console.log('\nNothing to do.');
    return;
  }
  if (DRY_RUN) {
    console.log('\n--dry-run: no writes performed.');
    return;
  }

  const tx = client.transaction();
  for (const p of plans) tx.createOrReplace(p.doc);
  await tx.commit();
  console.log(`\nWrote ${plans.length} siteCopy document(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
