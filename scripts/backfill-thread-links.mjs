#!/usr/bin/env node
/**
 * Backfill thread_links for pre-WS-1 learning entries that were completed
 * via a module run but never had their activity-declared thread links
 * written to learning_entries.thread_links.
 *
 * Before PR WS-1, thread_links was written at entry-save time but only for
 * new entries. Historical entries with sourceActivityIds that had empty or
 * null thread_links receive no declared-thread evidence in the snapshot.
 * This script fills them in using the same inline GROQ query that
 * src/lib/ai/thread-links.ts uses (replicated here because .mjs cannot use
 * @/ imports or TypeScript).
 *
 * Eligibility:
 *   - status = 'complete'
 *   - source_activity_ids is non-empty
 *   - thread_links IS NULL OR thread_links = '[]'
 *
 * Flags:
 *   --dry-run            list eligible entries, don't write
 *   --family-id <uuid>   limit to one family (default: all)
 *   --limit <n>          max entries to process this run (default: 100)
 *
 * Required env vars (loaded from .env.local):
 *   DATABASE_URL
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   NEXT_PUBLIC_SANITY_DATASET
 *   SANITY_API_TOKEN     (optional but recommended to avoid rate limits)
 *
 * NOTE: Do NOT run against prod without the explicit sign-off in P-1.
 *       Prod execution is a separately gated task. Use --dry-run first.
 */
import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });

// ─── CLI args ─────────────────────────────────────────────────────────────────

const arg = (name, fallback) => {
  const m = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (m) return m.split('=', 2)[1];
  const i = process.argv.indexOf(`--${name}`);
  if (i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) {
    return process.argv[i + 1];
  }
  return fallback;
};
const flag = (name) => process.argv.includes(`--${name}`);

const dryRun  = flag('dry-run');
const familyId = arg('family-id', null);
const limit   = Number(arg('limit', '100'));

// ─── Env validation ───────────────────────────────────────────────────────────

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(2);
}
if (!process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  console.error('NEXT_PUBLIC_SANITY_PROJECT_ID not set');
  process.exit(2);
}
if (!process.env.NEXT_PUBLIC_SANITY_DATASET) {
  console.error('NEXT_PUBLIC_SANITY_DATASET not set');
  process.exit(2);
}

// ─── Sanity client (inline — .mjs cannot use @/lib/sanity/client) ─────────────

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const SANITY_DATASET    = process.env.NEXT_PUBLIC_SANITY_DATASET;
const SANITY_TOKEN      = process.env.SANITY_API_TOKEN ?? '';

async function sanityFetch(groq, params = {}) {
  const url = new URL(
    `/v2021-06-07/data/query/${SANITY_DATASET}`,
    `https://${SANITY_PROJECT_ID}.api.sanity.io`,
  );
  url.searchParams.set('query', groq);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(`$${k}`, JSON.stringify(v));
  }
  const headers = { 'Content-Type': 'application/json' };
  if (SANITY_TOKEN) headers['Authorization'] = `Bearer ${SANITY_TOKEN}`;

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`Sanity fetch failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.result;
}

// Replicate the GROQ from src/lib/ai/thread-links.ts.
// Sanity-gated by status == "published" — drafts are ignored.
const ACTIVITY_THREADS_GROQ = `*[_type == "activity" && _id in $ids && status == "published"]{
  _id,
  capabilityThreads[]->{ _id }
}`;

const DEFAULT_STAGE_BAND = 'intermediate';
const DEFAULT_TIER       = 'developing';

/**
 * Build thread_links for a set of activity ids.
 * Returns an array in the same shape that thread-links.ts produces.
 */
async function buildThreadLinks(activityIds) {
  if (!activityIds || activityIds.length === 0) return [];
  try {
    const activities = await sanityFetch(ACTIVITY_THREADS_GROQ, { ids: activityIds });
    const seen  = new Set();
    const links = [];
    for (const activity of activities ?? []) {
      for (const thread of activity.capabilityThreads ?? []) {
        if (!thread?._id || seen.has(thread._id)) continue;
        seen.add(thread._id);
        links.push({
          threadId:   thread._id,   // Sanity _id, e.g. "capabilityThread.L1"
          stageBand:  DEFAULT_STAGE_BAND,
          tierAtTime: DEFAULT_TIER,
          confidence: 'confirmed',
          atomicLinks: [],
        });
      }
    }
    return links;
  } catch (err) {
    console.error('[backfill-thread-links] Sanity fetch failed:', err.message);
    return [];
  }
}

// ─── Candidate discovery ──────────────────────────────────────────────────────

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

let candidates;
try {
  const whereParts = [
    `e.status = 'complete'`,
    `e.source_activity_ids IS NOT NULL`,
    `array_length(e.source_activity_ids, 1) > 0`,
    `(e.thread_links IS NULL OR e.thread_links::text = '[]')`,
  ];
  const params = [];
  if (familyId) {
    params.push(familyId);
    whereParts.push(`e.family_id = $${params.length}`);
  }

  const sqlText = `
    SELECT e.id, e.family_id, e.date_occurred, e.title, e.source_activity_ids
    FROM learning_entries e
    WHERE ${whereParts.join(' AND ')}
    ORDER BY e.date_occurred DESC
    LIMIT ${Number.isFinite(limit) ? limit : 100}
  `;
  const res = await client.query(sqlText, params);
  candidates = res.rows;
} finally {
  client.release();
}

console.log(
  `Found ${candidates.length} entries eligible for thread-links backfill${dryRun ? ' (DRY RUN)' : ''}.`
);

if (candidates.length === 0) {
  await pool.end();
  process.exit(0);
}

// ─── Dry run ──────────────────────────────────────────────────────────────────

if (dryRun) {
  for (const e of candidates.slice(0, 20)) {
    const rawIds = e.source_activity_ids;
    const actIds = Array.isArray(rawIds)
      ? rawIds
      : typeof rawIds === 'string'
        ? rawIds.replace(/^{|}$/g, '').split(',').filter(Boolean)
        : [];
    console.log(
      `  ${e.date_occurred}  ${e.id}  family=${e.family_id}  activities=${actIds.length}  "${(e.title ?? '').slice(0, 60)}"`
    );
  }
  if (candidates.length > 20) console.log(`  … and ${candidates.length - 20} more`);
  await pool.end();
  process.exit(0);
}

// ─── Backfill ─────────────────────────────────────────────────────────────────

let ok   = 0;
let fail = 0;
const affectedFamilies = new Set();

for (let i = 0; i < candidates.length; i++) {
  const e = candidates[i];
  process.stdout.write(`[${i + 1}/${candidates.length}] ${e.id} … `);

  try {
    // Neon returns text[] as a JS array; Docker/plain pg may return a string "{a,b}" — normalise both.
    const rawIds = e.source_activity_ids;
    const activityIds = Array.isArray(rawIds)
      ? rawIds
      : typeof rawIds === 'string'
        ? rawIds.replace(/^{|}$/g, '').split(',').filter(Boolean)
        : [];
    const links = await buildThreadLinks(activityIds);

    if (links.length === 0) {
      console.log('skip (no published activities with thread links)');
      ok++;
      continue;
    }

    const writeClient = await pool.connect();
    try {
      await writeClient.query(
        `UPDATE learning_entries SET thread_links = $1, updated_at = now() WHERE id = $2`,
        [JSON.stringify(links), e.id],
      );
    } finally {
      writeClient.release();
    }

    affectedFamilies.add(e.family_id);
    console.log(`ok (${links.length} thread links written)`);
    ok++;
  } catch (err) {
    console.log(`fail (${err.message})`);
    fail++;
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\nBackfill complete: ${ok} processed, ${fail} failed.`);

if (affectedFamilies.size > 0) {
  console.log(`\nDistinct affected families (${affectedFamilies.size}):`);
  for (const fid of affectedFamilies) {
    console.log(`  ${fid}`);
  }
  console.log(
    '\nNext: run scripts/rebuild-snapshots.mjs --family-id <id> (or manual trigger)\n' +
    'for each affected family so declared threads surface in the constellation.'
  );
}

await pool.end();
process.exit(fail > 0 ? 1 : 0);
