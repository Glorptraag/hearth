/**
 * WS-6 — apply author-declared `capabilityTargets` to activities (gated).
 *
 * Reads the editorial proposal in `scripts/data/starter-pack-targets.ts`
 * (activityId → [{threadCode, tier}]) and writes each activity's
 * `capabilityTargets` array in Sanity, resolving `threadCode → capabilityThread.<code>`
 * references with a stable `_key`.
 *
 * Safety contract (this is a GATED content change — D2 Part 2):
 *   - DRY RUN BY DEFAULT. Prints every patch it would make and writes nothing.
 *     Pass `--apply` to actually write.
 *   - `setIfMissing` only — never overwrites an activity that already has
 *     `capabilityTargets`. Never touches `capabilityThreads` (the legacy field).
 *   - Refuses to apply unless every referenced thread doc AND every implied
 *     `dlo.<thread>.<tier>` opportunity id resolves to a published doc (so a
 *     completed run can't write a dangling opportunity). Override only with
 *     `--force-dangling` + explicit sign-off.
 *   - `--only a,b,c` limits to specific activity ids (staging).
 *
 * Run (dry run):   npx tsx scripts/apply-capability-targets.ts
 *      (apply):    npx tsx scripts/apply-capability-targets.ts --apply
 *      (staged):   npx tsx scripts/apply-capability-targets.ts --apply --only seed-act-knead-wait
 *
 * Required env (.env.local):
 *   NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET
 *   SANITY_API_TOKEN (required for --apply; recommended for reads)
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

import { STARTER_PACK_TARGETS, type ProposedTarget } from './data/starter-pack-targets';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ─── CLI ─────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const has = (f: string) => argv.includes(f);
const valueOf = (name: string): string | null => {
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.split('=', 2)[1];
  const i = argv.indexOf(`--${name}`);
  if (i > -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  return null;
};
const apply = has('--apply');
const forceDangling = has('--force-dangling');
const only = (valueOf('only') ?? '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const PID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DS = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production';
const TOKEN = process.env.SANITY_API_TOKEN;
if (!PID) {
  console.error('NEXT_PUBLIC_SANITY_PROJECT_ID not set (check .env.local)');
  process.exit(2);
}
if (apply && !TOKEN) {
  console.error('--apply needs SANITY_API_TOKEN');
  process.exit(2);
}

const client = createClient({
  projectId: PID,
  dataset: DS,
  token: TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

type Patch = {
  activityId: string;
  targets: ProposedTarget[];
  capabilityTargets: Array<{
    _key: string;
    _type: 'object';
    thread: { _type: 'reference'; _ref: string };
    tier: ProposedTarget['tier'];
  }>;
};

function buildPatches(): Patch[] {
  const ids = only.length ? only : Object.keys(STARTER_PACK_TARGETS);
  const patches: Patch[] = [];
  for (const activityId of ids) {
    const targets = STARTER_PACK_TARGETS[activityId];
    if (!targets) {
      console.error(`  ⚠️ --only id "${activityId}" is not in the proposal — skipping`);
      continue;
    }
    patches.push({
      activityId,
      targets,
      capabilityTargets: targets.map((t) => ({
        _key: t.threadCode,
        _type: 'object' as const,
        thread: { _type: 'reference' as const, _ref: `capabilityThread.${t.threadCode}` },
        tier: t.tier,
      })),
    });
  }
  return patches;
}

async function main() {
  const patches = buildPatches();
  if (patches.length === 0) {
    console.error('No patches to apply.');
    process.exit(2);
  }

  console.log(`\nWS-6 apply-capability-targets — ${PID}/${DS}${apply ? '  [APPLY]' : '  (DRY RUN — writes nothing)'}\n`);

  // ── Integrity gate: threads + implied DLO opportunity ids must resolve ──────
  const threadRefs = [
    ...new Set(patches.flatMap((p) => p.targets.map((t) => `capabilityThread.${t.threadCode}`))),
  ];
  const dloIds = [
    ...new Set(patches.flatMap((p) => p.targets.map((t) => `dlo.${t.threadCode}.${t.tier}`))),
  ];
  const [foundThreads, foundDlos, activityRows] = await Promise.all([
    client.fetch<string[]>(`*[_type=="capabilityThread" && _id in $ids]._id`, { ids: threadRefs }),
    client.fetch<string[]>(`*[_type=="discreteLearningObjective" && _id in $ids && status=="published"]._id`, { ids: dloIds }),
    client.fetch<Array<{ _id: string; status: string; nTargets: number }>>(
      `*[_type=="activity" && _id in $ids]{_id, status, "nTargets": count(capabilityTargets)}`,
      { ids: patches.map((p) => p.activityId) },
    ),
  ]);
  const okThreads = new Set(foundThreads);
  const okDlos = new Set(foundDlos);
  const actById = new Map(activityRows.map((a) => [a._id, a]));

  const danglingThreads = threadRefs.filter((r) => !okThreads.has(r));
  const danglingDlos = dloIds.filter((d) => !okDlos.has(d));

  // ── Print every patch ───────────────────────────────────────────────────────
  let willWrite = 0;
  let skipExisting = 0;
  let missingActs = 0;
  for (const p of patches) {
    const act = actById.get(p.activityId);
    const existing = act?.nTargets ?? 0;
    const status =
      !act ? 'MISSING-ACTIVITY'
      : act.status !== 'published' ? `not-published(${act.status})`
      : existing > 0 ? `HAS-TARGETS(${existing})→skip`
      : 'will-set';
    if (!act) missingActs++;
    else if (existing > 0) skipExisting++;
    else if (act.status === 'published') willWrite++;
    console.log(`  ${p.activityId}  [${status}]`);
    for (const t of p.capabilityTargets) {
      const tDangle = okThreads.has(t.thread._ref) ? '' : '  ⚠️ thread-missing';
      const dId = `dlo.${t._key}.${t.tier}`;
      const dDangle = okDlos.has(dId) ? '' : '  ⚠️ dlo-missing';
      console.log(`      + ${t.thread._ref} @${t.tier}  (→ ${dId})${tDangle}${dDangle}`);
    }
  }

  console.log(
    `\n  ${patches.length} activities in scope · will-set ${willWrite} · skip(has targets) ${skipExisting} · missing ${missingActs}`,
  );
  if (danglingThreads.length || danglingDlos.length) {
    console.log(`\n  ⚠️ INTEGRITY: ${danglingThreads.length} thread refs and ${danglingDlos.length} DLO ids do not resolve.`);
    if (danglingThreads.length) console.log(`     threads: ${danglingThreads.join(', ')}`);
    if (danglingDlos.length) console.log(`     dlos:    ${danglingDlos.join(', ')}`);
    console.log(`     Seed/repair before applying (scripts/seed-capability-threads.ts, scripts/seed-dlos.ts).`);
  } else {
    console.log(`  ✓ integrity: all ${threadRefs.length} threads and ${dloIds.length} DLO ids resolve.`);
  }

  if (!apply) {
    console.log(`\nDry run only. Re-run with --apply (gated on Drew) to write ${willWrite} activities.`);
    return;
  }
  if ((danglingThreads.length || danglingDlos.length) && !forceDangling) {
    console.error(`\nREFUSING to --apply: unresolved refs (see above). Override with --force-dangling only with sign-off.`);
    process.exit(1);
  }

  // ── Apply (setIfMissing only) ────────────────────────────────────────────────
  console.log(`\nApplying ${willWrite} patches (setIfMissing capabilityTargets; never overwrites)…`);
  let ok = 0;
  let failed = 0;
  for (const p of patches) {
    const act = actById.get(p.activityId);
    if (!act || act.status !== 'published' || (act.nTargets ?? 0) > 0) continue;
    try {
      await client
        .patch(p.activityId)
        .setIfMissing({ capabilityTargets: p.capabilityTargets })
        .commit();
      ok++;
      console.log(`  ✓ ${p.activityId}  (${p.capabilityTargets.length} targets)`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${p.activityId}: ${(err as Error).message}`);
    }
  }
  console.log(`\nApply complete: ${ok} set, ${failed} failed, ${skipExisting} skipped (already had targets).`);
  console.log(`Next: re-run /admin/content/qa for the pack; a completed run on these activities now writes 'declared' DLO opportunities.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
