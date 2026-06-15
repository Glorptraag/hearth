/**
 * Remediate stray capabilityThread references in production Sanity.
 *
 * Background (outcomes-spine Phase 2, Track A / A1):
 *   Production holds 74 capabilityThread docs: 57 canonical (`capabilityThread.{code}`)
 *   + 17 strays (12 UUID-keyed pre-v2 docs + 5 `seed-ct-*` stubs). Activities and
 *   modules that reference a stray contribute NO declared evidence — the app's
 *   57-code validation silently drops any thread id that isn't one of the canon.
 *
 * This script re-points every referencing doc's thread reference from the stray
 * id to the matching canonical `capabilityThread.{code}` (preserving _keys, and
 * deduping when the canonical thread is already present in the same array), then
 * — once nothing references the strays — deletes the 17 stray docs.
 *
 * Stray → canonical map (titles verified against docs/hearth-capability-dlo-reference.md;
 * the two ambiguous mappings — "Text Structure"→L6 and "Mathematical Communication"→M9 —
 * are Drew's decisions, 2026-06-14). Any stray whose title is NOT in the map causes a
 * hard STOP (no writes) so it can be escalated rather than guessed.
 *
 * Flags (mutually exclusive intents):
 *   --dry-run         read-only; prints the full inventory + every change, writes nothing.
 *   (no flag)         executes the re-point, then prints verification counts.
 *   --delete-strays   deletes the 17 stray docs — REFUSES unless 0 docs still reference them.
 *
 * Pattern: scripts/seed-dlos.ts (dotenv + @sanity/client, .env.local).
 * Run: npx tsx scripts/remediate-stray-thread-refs.ts --dry-run
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { THREAD_NAMES } from '../src/lib/capability-threads';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DRY_RUN = process.argv.includes('--dry-run');
const DELETE_STRAYS = process.argv.includes('--delete-strays');

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'g5zhwbxg',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const CANONICAL_CODES = new Set(Object.keys(THREAD_NAMES)); // 57 codes
const canonicalId = (code: string) => `capabilityThread.${code}`;
const isCanonicalThreadId = (id: string) =>
  /^capabilityThread\.([A-Z]+\d+)$/.test(id) && CANONICAL_CODES.has(id.slice('capabilityThread.'.length));

/** Normalise a stray title to a map key: lowercase, & → and, non-alnum → space, collapse. */
function normTitle(title: string): string {
  return (title ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

// Drew's verified stray-title → canonical-code map (normalised keys).
const TITLE_TO_CODE: Record<string, string> = {
  'oral communication': 'L1',
  'written expression': 'L5',
  'narrative understanding': 'L7',
  'critical thinking': 'EF5',
  'algebraic thinking': 'M4',
  'measurement': 'M5',
  'measurement and estimation': 'M5',
  'data and statistics': 'M7',
  'number sense and place value': 'M1',
  'scientific inquiry': 'S1',
  'scientific observation': 'S5',
  'living systems': 'S2',
  'visual expression': 'C1',
  'visual arts expression': 'C1',
  'text structure': 'L6',
  'mathematical communication': 'M9',
};

type ThreadDoc = { _id: string; title: string; legacyV1Id?: string };

/**
 * Deep-clone `value`, rewriting any `{ _ref: <stray> }` to its canonical id.
 * Records each rewrite into `changes`. Dedupes plain reference arrays
 * (arrays whose items are all `_type === 'reference'`) by `_ref`, keeping the
 * first occurrence's `_key`.
 */
function repoint(
  value: unknown,
  strayToCanonical: Map<string, string>,
  changes: string[],
): unknown {
  if (Array.isArray(value)) {
    const mapped = value.map((v) => repoint(v, strayToCanonical, changes));
    // Dedupe only when every item is a plain reference object.
    const allRefs = mapped.length > 0 && mapped.every(
      (v) => v && typeof v === 'object' && (v as any)._type === 'reference' && '_ref' in (v as any),
    );
    if (allRefs) {
      const seen = new Set<string>();
      const out: unknown[] = [];
      for (const item of mapped) {
        const r = (item as any)._ref as string;
        if (seen.has(r)) {
          changes.push(`      · dedupe: dropped duplicate ref ${r}`);
          continue;
        }
        seen.add(r);
        out.push(item);
      }
      return out;
    }
    return mapped;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj._ref === 'string' && strayToCanonical.has(obj._ref)) {
      const canon = strayToCanonical.get(obj._ref)!;
      changes.push(`      · ref ${obj._ref} → ${canon}` + (obj._key ? ` (key ${obj._key})` : ''));
      return { ...obj, _ref: canon };
    }
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) next[k] = repoint(v, strayToCanonical, changes);
    return next;
  }
  return value;
}

async function main() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('SANITY_API_TOKEN is required.');
    process.exit(2);
  }

  const mode = DELETE_STRAYS ? 'DELETE-STRAYS' : DRY_RUN ? 'DRY-RUN' : 'EXECUTE RE-POINT';
  console.log(`\n=== remediate-stray-thread-refs — ${mode} ===`);
  console.log(`Sanity: project ${client.config().projectId} / dataset ${client.config().dataset}\n`);

  // ── 1. Inventory all capabilityThread docs, partition canonical vs stray. ──
  const allThreads = await client.fetch<ThreadDoc[]>(
    `*[_type == "capabilityThread"]{ _id, title, legacyV1Id } | order(_id)`,
  );
  const canonical = allThreads.filter((t) => isCanonicalThreadId(t._id));
  const strays = allThreads.filter((t) => !isCanonicalThreadId(t._id));

  console.log(`capabilityThread docs: ${allThreads.length} total — ${canonical.length} canonical, ${strays.length} stray`);

  // ── 2. Map each stray → canonical code by title. Unmapped = hard stop. ──
  const strayToCanonical = new Map<string, string>();
  const unmapped: ThreadDoc[] = [];
  console.log(`\nStray inventory:`);
  for (const s of strays) {
    const code = TITLE_TO_CODE[normTitle(s.title)];
    if (code && CANONICAL_CODES.has(code)) {
      strayToCanonical.set(s._id, canonicalId(code));
      console.log(`  ${s._id.padEnd(42)} "${s.title}"  →  ${code}`);
    } else {
      unmapped.push(s);
      console.log(`  ${s._id.padEnd(42)} "${s.title}"  →  ⚠️  UNMAPPED`);
    }
  }

  const strayIds = strays.map((s) => s._id);

  // ── 3. Find every doc that references a stray. ──
  const refDocs = await client.fetch<any[]>(`*[references($strayIds)]`, { strayIds });
  const byType: Record<string, number> = {};
  for (const d of refDocs) byType[d._type] = (byType[d._type] ?? 0) + 1;
  console.log(`\nDocs referencing a stray: ${refDocs.length}  ${JSON.stringify(byType)}`);

  // Which referencing docs touch an UNMAPPED stray? Those block everything → STOP.
  if (unmapped.length > 0) {
    const unmappedIds = new Set(unmapped.map((u) => u._id));
    const blockedRefs = refDocs.filter((d) =>
      JSON.stringify(d).match(/"_ref":"([^"]+)"/g)?.some((m) => unmappedIds.has(m.slice(8, -1))),
    );
    console.error(`\n⚠️  STOP: ${unmapped.length} stray title(s) are not in the verified map:`);
    for (const u of unmapped) console.error(`     ${u._id}  "${u.title}"`);
    console.error(`     ${blockedRefs.length} referencing doc(s) touch an unmapped stray.`);
    console.error(`     Escalate to Drew for the mapping decision before any write.`);
    process.exit(3);
  }

  // ── 4. Compute per-doc changes. ──
  const patches: { id: string; type: string; set: Record<string, unknown> }[] = [];
  let totalRewrites = 0;
  console.log(`\nPer-doc re-point plan:`);
  for (const doc of refDocs) {
    const changes: string[] = [];
    const set: Record<string, unknown> = {};
    // Walk each top-level field independently so we set only what changed.
    for (const [field, value] of Object.entries(doc)) {
      if (field.startsWith('_')) continue;
      const fieldChanges: string[] = [];
      const next = repoint(value, strayToCanonical, fieldChanges);
      if (fieldChanges.length > 0) {
        set[field] = next;
        changes.push(`    field "${field}":`);
        changes.push(...fieldChanges);
        totalRewrites += fieldChanges.filter((c) => c.includes('→')).length;
      }
    }
    if (Object.keys(set).length > 0) {
      patches.push({ id: doc._id, type: doc._type, set });
      console.log(`  ${doc._type}/${doc._id}  "${(doc.title ?? '').slice(0, 50)}"`);
      for (const c of changes) console.log(c);
    }
    // Safety: no stray _ref may survive in the patched fields.
    const residual = JSON.stringify(set).match(/"_ref":"([^"]+)"/g)?.filter((m) => strayIds.includes(m.slice(8, -1)));
    if (residual && residual.length > 0) {
      console.error(`  ⚠️  STOP: ${doc._id} still has stray refs after re-point: ${residual.join(', ')}`);
      process.exit(4);
    }
  }

  const affectedActivities = patches.filter((p) => p.type === 'activity').length;
  const affectedModules = patches.filter((p) => p.type === 'module').length;
  const affectedOther = patches.filter((p) => p.type !== 'activity' && p.type !== 'module').length;
  console.log(`\nSummary: ${patches.length} docs to patch (${affectedActivities} activities, ${affectedModules} modules` +
    (affectedOther ? `, ${affectedOther} other` : '') + `), ${totalRewrites} ref rewrites.`);

  // ── 5a. DELETE-STRAYS path. ──
  if (DELETE_STRAYS) {
    if (refDocs.length > 0) {
      console.error(`\n⚠️  REFUSING to delete: ${refDocs.length} doc(s) still reference a stray. Run the re-point first.`);
      process.exit(5);
    }
    console.log(`\nDeleting ${strayIds.length} stray capabilityThread docs…`);
    const res = await client.delete({ query: `*[_id in $ids]`, params: { ids: strayIds } });
    console.log(`Delete result: ${JSON.stringify(res.results?.map((r: any) => r.id) ?? res)}`);
    const after = await client.fetch<number>(`count(*[_type == "capabilityThread"])`);
    console.log(`\nPost-delete capabilityThread count: ${after}  (expected 57)`);
    process.exit(after === 57 ? 0 : 6);
  }

  // ── 5b. DRY-RUN: stop here, no writes. ──
  if (DRY_RUN) {
    console.log(`\nDRY RUN — no writes performed.`);
    process.exit(0);
  }

  // ── 5c. EXECUTE re-point. ──
  if (patches.length === 0) {
    console.log(`\nNothing to re-point.`);
  } else {
    console.log(`\nWriting ${patches.length} patches…`);
    const BATCH = 25;
    for (let i = 0; i < patches.length; i += BATCH) {
      const slice = patches.slice(i, i + BATCH);
      const tx = client.transaction();
      for (const p of slice) tx.patch(p.id, (patch) => patch.set(p.set));
      await tx.commit();
      console.log(`  · committed ${Math.min(i + BATCH, patches.length)}/${patches.length}`);
    }
  }

  // Verify: 0 activities and 0 modules still reference a stray.
  const actLeft = await client.fetch<number>(`count(*[_type == "activity" && references($strayIds)])`, { strayIds });
  const modLeft = await client.fetch<number>(`count(*[_type == "module" && references($strayIds)])`, { strayIds });
  const anyLeft = await client.fetch<number>(`count(*[references($strayIds)])`, { strayIds });
  console.log(`\nVerification after re-point:`);
  console.log(`  activities referencing a stray: ${actLeft}  (expected 0)`);
  console.log(`  modules referencing a stray:    ${modLeft}  (expected 0)`);
  console.log(`  ANY doc referencing a stray:    ${anyLeft}  (expected 0)`);
  if (actLeft !== 0 || modLeft !== 0) {
    console.error(`\n⚠️  Re-point incomplete — NOT safe to delete strays.`);
    process.exit(7);
  }
  console.log(`\n✅ Re-point verified. Strays are now unreferenced; safe to run --delete-strays.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
