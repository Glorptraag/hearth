/**
 * Seed DLO → regulatory-framework mappings (WS-5 transposer plumbing).
 *
 * SCAFFOLD — wired end-to-end but loaded with 2–3 SAMPLE rows only. Authoring
 * the real `ac-v9-qld` mapping set (and seeding it against prod) is a
 * separately gated task (plan items P-3 / P-2). Do NOT run this against prod
 * until those gates clear.
 *
 * Idempotent + non-destructive: patches the existing `discreteLearningObjective`
 * documents created by `scripts/seed-dlos.ts`, setting ONLY `regulatoryMappings`
 * (descriptor / thread / tier / status are left untouched — so this deliberately
 * does NOT use createOrReplace, which would clobber those fields). Deterministic
 * DLO ids + deterministic per-mapping `_key`s keep re-runs stable, and `.set()`
 * replaces the field wholesale rather than appending duplicates.
 *
 * Every authored code is linted against AC9_CODE_PATTERN (shared with the
 * enrichment boundary) before any write — a single invalid code aborts the run
 * with a non-zero exit and no partial commit.
 *
 * Run (gated): npx tsx scripts/seed-dlo-mappings.ts
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { AC9_CODE_PATTERN } from '../src/lib/curriculum/ac9';
import { DLO_REGULATORY_MAPPINGS, type DloRegulatoryMappingSeed } from './data/dlo-regulatory-mappings';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

/** Collect every (dloId → framework → code) that fails the AC9 shape lint. */
function lintCodes(): string[] {
  const failures: string[] = [];
  for (const entry of DLO_REGULATORY_MAPPINGS) {
    for (const m of entry.mappings) {
      for (const code of m.codes) {
        if (!AC9_CODE_PATTERN.test(code)) {
          failures.push(`${entry.dloId} → ${m.frameworkKey} → "${code}"`);
        }
      }
    }
  }
  return failures;
}

/** Attach deterministic `_key`/`_type` so the array items are stable across re-runs. */
function keyedMappings(entry: DloRegulatoryMappingSeed) {
  return entry.mappings.map((m, i) => ({
    _key: `${m.frameworkKey}-${i}`,
    _type: 'regulatoryMapping',
    ...m,
  }));
}

async function main() {
  const failures = lintCodes();
  if (failures.length > 0) {
    console.error(`AC9 code lint failed for ${failures.length} code(s):`);
    failures.forEach((f) => console.error(`  · ${f}`));
    process.exit(1);
  }

  console.log(`Patching ${DLO_REGULATORY_MAPPINGS.length} DLO document(s) with regulatory mappings…`);

  const BATCH = 50;
  for (let i = 0; i < DLO_REGULATORY_MAPPINGS.length; i += BATCH) {
    const slice = DLO_REGULATORY_MAPPINGS.slice(i, i + BATCH);
    const tx = client.transaction();
    for (const entry of slice) {
      tx.patch(entry.dloId, { set: { regulatoryMappings: keyedMappings(entry) } });
    }
    await tx.commit();
    console.log(`  · committed ${Math.min(i + BATCH, DLO_REGULATORY_MAPPINGS.length)}/${DLO_REGULATORY_MAPPINGS.length}`);
  }

  const perFramework: Record<string, number> = {};
  for (const entry of DLO_REGULATORY_MAPPINGS) {
    for (const m of entry.mappings) {
      perFramework[m.frameworkKey] = (perFramework[m.frameworkKey] ?? 0) + 1;
    }
  }
  console.log('Per-framework mapping counts:', perFramework);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
