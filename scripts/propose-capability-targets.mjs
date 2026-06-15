#!/usr/bin/env node
/**
 * WS-6 — propose `capabilityTargets` for published activities that lack them.
 *
 * D1 (#195) made `capabilityTargets: [{thread, tier}]` the authoring standard,
 * but 0 of 272 prod activities have any. This script produces a REVIEWABLE
 * proposal — it does not write to prod by default.
 *
 * Two activity populations, handled differently:
 *
 *   1. Has legacy `capabilityThreads` (e.g. The Golden Years' 96 activities):
 *      MECHANICALLY MIGRATABLE. We propose one target per existing thread,
 *      preserving the SAME thread `_ref`, at tier 'developing' — which equals
 *      the DEFAULT_TIER that src/lib/ai/thread-links.ts already assigns bare
 *      threads. So applying this is behaviour-preserving: it makes the implicit
 *      explicit in the new field. The author can then promote/demote tiers.
 *
 *   2. No `capabilityThreads` at all (e.g. Music Makers, Story Architects):
 *      NOT mechanically migratable — there is no thread to seed from. These are
 *      listed as "needs authoring" for a human/Kindler pass; no target proposed.
 *
 * ⚠️ PREREQUISITE (WS-7): the canonical `capabilityThread.<CODE>` docs do not
 * currently exist in prod — activity thread refs dangle (resolve to null). The
 * proposed targets reuse those same refs, so they ALSO dangle until the
 * canonical threads are seeded (scripts/seed-capability-threads.ts). Applying
 * before that seed is harmless (no regression) but pointless. By default the
 * script REFUSES --apply when referenced threads don't resolve; override with
 * --force-dangling only with explicit sign-off.
 *
 * Flags:
 *   (default)             DRY RUN — print the proposal + summary, write nothing.
 *   --json <path>         also write the full machine-readable proposal to <path>.
 *   --pack <slug>         limit to one published pack (default: all published).
 *   --tier <tier>         tier to assign migratable threads (default: developing).
 *   --apply               WRITE the proposed targets to Sanity (gated; see below).
 *   --force-dangling      allow --apply even when thread refs don't resolve.
 *
 * --apply is GATED ON DREW. It writes only to activities in population (1),
 * only sets capabilityTargets (never touches capabilityThreads), and refuses to
 * overwrite an activity that already has targets.
 *
 * Required env (loaded from .env.local):
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   NEXT_PUBLIC_SANITY_DATASET
 *   SANITY_API_TOKEN     (required for --apply; recommended for reads)
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

// ─── CLI args ──────────────────────────────────────────────────────────────
const arg = (name, fallback) => {
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.split('=', 2)[1];
  const i = process.argv.indexOf(`--${name}`);
  if (i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--')) return process.argv[i + 1];
  return fallback;
};
const flag = (name) => process.argv.includes(`--${name}`);

const apply = flag('apply');
const forceDangling = flag('force-dangling');
const onlyPack = arg('pack', null);
const tier = arg('tier', 'developing');
const jsonOut = arg('json', null);

const VALID_TIERS = ['emerging', 'developing', 'demonstrating'];
if (!VALID_TIERS.includes(tier)) {
  console.error(`--tier must be one of ${VALID_TIERS.join(', ')}`);
  process.exit(2);
}

// ─── Env ─────────────────────────────────────────────────────────────────────
const PID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DS = process.env.NEXT_PUBLIC_SANITY_DATASET;
const TOKEN = process.env.SANITY_API_TOKEN ?? '';
if (!PID || !DS) {
  console.error('NEXT_PUBLIC_SANITY_PROJECT_ID / NEXT_PUBLIC_SANITY_DATASET not set (check .env.local)');
  process.exit(2);
}
if (apply && !TOKEN) {
  console.error('--apply needs SANITY_API_TOKEN');
  process.exit(2);
}

async function sanityFetch(groq, params = {}) {
  const url = new URL(`/v2024-01-01/data/query/${DS}`, `https://${PID}.api.sanity.io`);
  url.searchParams.set('query', groq);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(`$${k}`, JSON.stringify(v));
  const headers = {};
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`Sanity query ${res.status}: ${await res.text()}`);
  return (await res.json()).result;
}

async function sanityMutate(mutations) {
  const url = `https://${PID}.api.sanity.io/v2024-01-01/data/mutate/${DS}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ mutations }),
  });
  if (!res.ok) throw new Error(`Sanity mutate ${res.status}: ${await res.text()}`);
  return res.json();
}

/** bare thread code from a deterministic id or stub, e.g. capabilityThread.M1 -> M1 */
const bareCode = (ref) => (ref ?? '').replace(/^capabilityThread\./, '').replace(/^seed-ct-/, '');

// ─── Gather published packs + their activities lacking targets ───────────────
const PACKS_GROQ = `*[_type=="pack" && status=="published" ${onlyPack ? '&& slug.current==$slug' : ''}] | order(title asc){
  "pack": title, "slug": slug.current,
  "activities": modules[]->approaches[]->activities[]->{
    _id, title,
    "threadRefs": capabilityThreads[]._ref,
    "nTargets": count(capabilityTargets)
  }
}`;

const packs = await sanityFetch(PACKS_GROQ, onlyPack ? { slug: onlyPack } : {});

const migratable = []; // {pack, _id, title, threadRefs, proposedTargets}
const needsAuthoring = []; // {pack, _id, title}
const alreadyHasTargets = [];

for (const p of packs) {
  for (const a of p.activities ?? []) {
    if ((a.nTargets ?? 0) > 0) {
      alreadyHasTargets.push({ pack: p.pack, _id: a._id, title: a.title });
      continue;
    }
    const refs = (a.threadRefs ?? []).filter(Boolean);
    if (refs.length === 0) {
      needsAuthoring.push({ pack: p.pack, _id: a._id, title: a.title });
      continue;
    }
    migratable.push({
      pack: p.pack,
      _id: a._id,
      title: a.title,
      threadRefs: refs,
      proposedTargets: refs.map((ref) => ({ _key: bareCode(ref) || ref, thread: { _type: 'reference', _ref: ref }, tier })),
    });
  }
}

// ─── Check the WS-7 prerequisite: do referenced threads resolve? ─────────────
const allRefs = [...new Set(migratable.flatMap((m) => m.threadRefs))];
let resolvable = new Set();
if (allRefs.length) {
  const present = await sanityFetch(`*[_type=="capabilityThread" && _id in $ids]._id`, { ids: allRefs });
  resolvable = new Set(present ?? []);
}
const danglingRefs = allRefs.filter((r) => !resolvable.has(r));

// ─── Report ──────────────────────────────────────────────────────────────────
console.log(`\nWS-6 capabilityTargets proposal — ${PID}/${DS}${apply ? '  [APPLY]' : '  (dry run)'}\n`);
const byPack = {};
for (const m of migratable) (byPack[m.pack] ??= { migratable: 0, authoring: 0 }).migratable++;
for (const n of needsAuthoring) (byPack[n.pack] ??= { migratable: 0, authoring: 0 }).authoring++;
for (const [pack, c] of Object.entries(byPack)) {
  console.log(`  ${pack}`);
  console.log(`    mechanically migratable (threads -> targets@${tier}): ${c.migratable}`);
  console.log(`    needs authoring (no threads to seed from):           ${c.authoring}`);
}
console.log(`\n  TOTAL migratable: ${migratable.length}   needs-authoring: ${needsAuthoring.length}   already-have-targets: ${alreadyHasTargets.length}`);

if (danglingRefs.length) {
  console.log(`\n  ⚠️ WS-7 PREREQUISITE NOT MET: ${danglingRefs.length}/${allRefs.length} referenced threads do not resolve in this dataset.`);
  console.log(`     e.g. ${danglingRefs.slice(0, 8).join(', ')}${danglingRefs.length > 8 ? ' …' : ''}`);
  console.log(`     Seed the canonical capabilityThread.<CODE> docs (scripts/seed-capability-threads.ts) first.`);
}

// Sample proposed patches
console.log(`\n  Sample proposed patches (first 5 migratable):`);
for (const m of migratable.slice(0, 5)) {
  console.log(`    ${m._id}  "${(m.title ?? '').slice(0, 50)}"`);
  for (const t of m.proposedTargets) console.log(`        + ${t.thread._ref}  @${t.tier}`);
}
console.log(`\n  Activities needing authored targets (no mechanical proposal) — first 10:`);
for (const n of needsAuthoring.slice(0, 10)) console.log(`    ${n.pack}: "${(n.title ?? '').slice(0, 55)}"  (${n._id})`);
if (needsAuthoring.length > 10) console.log(`    … and ${needsAuthoring.length - 10} more`);

if (jsonOut) {
  const fs = await import('node:fs/promises');
  await fs.writeFile(jsonOut, JSON.stringify({ tier, migratable, needsAuthoring, danglingRefs }, null, 2));
  console.log(`\n  Full proposal written to ${jsonOut}`);
}

// ─── Apply (gated) ─────────────────────────────────────────────────────────────
if (!apply) {
  console.log(`\nDry run only. Re-run with --apply (gated on Drew) to write the ${migratable.length} migratable patches.`);
  process.exit(0);
}
if (danglingRefs.length && !forceDangling) {
  console.error(`\nREFUSING to --apply: ${danglingRefs.length} thread refs dangle (WS-7 not done). Override with --force-dangling only with sign-off.`);
  process.exit(1);
}

console.log(`\nApplying ${migratable.length} patches (capabilityTargets only; never overwrites existing)…`);
let ok = 0, failed = 0;
for (let i = 0; i < migratable.length; i += 50) {
  const batch = migratable.slice(i, i + 50);
  const mutations = batch.map((m) => ({
    patch: { id: m._id, setIfMissing: { capabilityTargets: m.proposedTargets } },
  }));
  try {
    await sanityMutate(mutations);
    ok += batch.length;
    process.stdout.write(`  ${Math.min(i + 50, migratable.length)}/${migratable.length}\r`);
  } catch (err) {
    failed += batch.length;
    console.error(`\n  batch ${i} failed: ${err.message}`);
  }
}
console.log(`\nApply complete: ${ok} set, ${failed} failed.`);
console.log(`Next: re-run hearth QA (/admin/content/qa) and rebuild affected snapshots so targets surface in the constellation.`);
process.exit(failed > 0 ? 1 : 0);
