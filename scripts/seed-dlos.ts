/**
 * Seed Discrete Learning Objectives — one per (thread × tier) for all 57 capability threads.
 *
 * Source of prose (resolution order):
 *   1. Lo-fi content payload v1LegacyTiers (scripts/data/hearth-constellation-content-lo-fi-v1.ts)
 *      — the authored lo-fi set, 55 of 57 threads.
 *   2. DLO_DESCRIPTORS placeholder (the constellation fallback descriptors) — covers
 *      the threads the lo-fi set drops (H6 First Nations, PS5 Environmental Stewardship).
 *   3. Generic descriptor keyed off the thread name (so the seed always covers every
 *      entry in THREAD_NAMES — full 57 × 3 = 171 coverage).
 *
 * Idempotent: uses deterministic IDs (`dlo.{threadId}.{tier}`) + createOrReplace.
 *
 * Run: npx tsx scripts/seed-dlos.ts
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { DLO_DESCRIPTORS, fallbackDescriptor } from '../src/app/(auth)/our-story/capabilities/_constellation/dlo-descriptors';
import { THREAD_NAMES } from '../src/lib/capability-threads';
import { THREADS as LOFI_THREADS } from './data/hearth-constellation-content-lo-fi-v1';

// legacyV1Id → { emerging, developing, demonstrating } from the lo-fi payload.
const LOFI_BY_THREAD = new Map(
  LOFI_THREADS.map((t) => [t.legacyV1Id, t.v1LegacyTiers]),
);

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const TIERS = ['emerging', 'developing', 'demonstrating'] as const;
const TIER_LABELS: Record<(typeof TIERS)[number], string> = {
  emerging: 'Emerging',
  developing: 'Developing',
  demonstrating: 'Demonstrating',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

type DloDoc = {
  _id: string;
  _type: 'discreteLearningObjective';
  thread: { _type: 'reference'; _ref: string };
  tier: (typeof TIERS)[number];
  descriptor: string;
  slug: { _type: 'slug'; current: string };
  status: 'published';
};

function buildDocs(): DloDoc[] {
  const docs: DloDoc[] = [];
  for (const threadId of Object.keys(THREAD_NAMES)) {
    const descriptors = DLO_DESCRIPTORS[threadId];
    const lofiTiers = LOFI_BY_THREAD.get(threadId);
    TIERS.forEach((tier, idx) => {
      const descriptor =
        lofiTiers?.[tier] ??
        descriptors?.[idx] ??
        fallbackDescriptor(THREAD_NAMES[threadId], TIER_LABELS[tier]);
      docs.push({
        _id: `dlo.${threadId}.${tier}`,
        _type: 'discreteLearningObjective',
        thread: { _type: 'reference', _ref: `capabilityThread.${threadId}` },
        tier,
        descriptor,
        slug: { _type: 'slug', current: slugify(`${threadId}-${tier}-${descriptor}`).slice(0, 96) },
        status: 'published',
      });
    });
  }
  return docs;
}

async function main() {
  const docs = buildDocs();
  console.log(`Seeding ${docs.length} DLOs (${Object.keys(THREAD_NAMES).length} threads × 3 tiers)…`);

  const BATCH = 50;
  for (let i = 0; i < docs.length; i += BATCH) {
    const slice = docs.slice(i, i + BATCH);
    const tx = client.transaction();
    for (const doc of slice) tx.createOrReplace(doc);
    await tx.commit();
    console.log(`  · committed ${Math.min(i + BATCH, docs.length)}/${docs.length}`);
  }

  const perDomain: Record<string, number> = {};
  for (const threadId of Object.keys(THREAD_NAMES)) {
    const prefix = threadId.match(/^[A-Z]+/)?.[0] ?? '?';
    perDomain[prefix] = (perDomain[prefix] ?? 0) + 3;
  }
  console.log('Per-domain DLO counts:', perDomain);
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
