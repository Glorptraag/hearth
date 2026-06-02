#!/usr/bin/env node
/**
 * Backfill `sessionType` on every Sanity `module` document that lacks one.
 *
 * Phase 1 of the intelligence refactor (Task 1.6).
 *
 * Strategy: every module gets the conservative default `sustained`. Modules
 * whose slug appears in scripts/data/open-ended-modules.json are flipped to
 * `open_ended` and have `idleDaysBeforeAutoClose` set to null (open-ended
 * runs never auto-close). Idempotent — filters by `!defined(sessionType)`
 * so a re-run is a no-op once the field is set.
 *
 * Operates on BOTH drafts and published documents so editorial workflow
 * doesn't break on the next publish attempt (the schema marks the field
 * as required).
 *
 * Flags:
 *   --dry-run      list what would be patched, don't write
 *   --dataset <n>  override dataset (default: env NEXT_PUBLIC_SANITY_DATASET or 'production')
 *
 * Spec: docs/PLAN-intelligence-refactor.md Q2 + Task 1.6.
 */
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from 'dotenv';

config({ path: '.env.local' });

const flag = (name) => process.argv.includes(`--${name}`);
const arg = (name, fallback) => {
  const m = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (m) return m.split('=', 2)[1];
  const i = process.argv.indexOf(`--${name}`);
  if (i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) {
    return process.argv[i + 1];
  }
  return fallback;
};

const dryRun = flag('dry-run');
const dataset = arg('dataset', process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production');

if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  console.error('NEXT_PUBLIC_SANITY_PROJECT_ID not set');
  process.exit(2);
}
if (!process.env.SANITY_API_TOKEN && !dryRun) {
  console.error('SANITY_API_TOKEN not set — required unless --dry-run');
  process.exit(2);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

let openEndedSlugs;
try {
  const raw = readFileSync(resolve(process.cwd(), 'scripts/data/open-ended-modules.json'), 'utf8');
  const parsed = JSON.parse(raw);
  openEndedSlugs = new Set(parsed.slugs ?? []);
} catch (e) {
  console.error(`Cannot read scripts/data/open-ended-modules.json: ${e.message}`);
  process.exit(2);
}

console.log(`[backfill] dataset=${dataset} dryRun=${dryRun} openEnded=${openEndedSlugs.size}`);

const modules = await client.fetch(
  `*[_type == "module" && !defined(sessionType)]{ _id, _type, "slug": slug.current, title }`,
);

if (modules.length === 0) {
  console.log('[backfill] No modules lack sessionType — nothing to do.');
  process.exit(0);
}

console.log(`[backfill] Found ${modules.length} module(s) to backfill:`);

const plan = modules.map((m) => {
  const isOpenEnded = openEndedSlugs.has(m.slug);
  return {
    id: m._id,
    slug: m.slug,
    title: m.title,
    sessionType: isOpenEnded ? 'open_ended' : 'sustained',
    idleDaysBeforeAutoClose: isOpenEnded ? null : 14,
  };
});

for (const p of plan) {
  console.log(`  ${p.id.padEnd(36)} ${p.slug?.padEnd(30) ?? '(no slug)'.padEnd(30)} → ${p.sessionType}`);
}

if (dryRun) {
  console.log('\n[backfill] --dry-run set, no writes performed.');
  process.exit(0);
}

let tx = client.transaction();
for (const p of plan) {
  tx = tx.patch(p.id, (patch) =>
    patch
      .setIfMissing({ sessionType: p.sessionType })
      .set({ idleDaysBeforeAutoClose: p.idleDaysBeforeAutoClose }),
  );
}

const result = await tx.commit();
console.log(`\n[backfill] Patched ${result.results?.length ?? plan.length} document(s).`);
console.log('[backfill] Verify with: npx sanity exec scripts/sanity-backfill-session-type.mjs --dry-run');
