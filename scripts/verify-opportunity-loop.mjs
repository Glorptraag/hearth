#!/usr/bin/env node
/**
 * Loop proof (read-only): mirror enrich.ts's declared-target assembly against
 * the REAL applied Starter Pack content, and show the `declared` DLO
 * opportunity each completed run would write.
 *
 * Reproduces, without the DB:
 *   1. enrich.ts assembleContext GROQ + normalizeThreadId → declaredTargets
 *   2. dlo-persistence.declaredTargetsToDloIds → dlo.<thread>.<tier> ids,
 *      validated against the prod published-DLO catalog
 *   3. the row persistDeclaredOpportunities would insert
 *      (provenance 'declared', evidence_state 'opportunity', confidence null)
 *
 * The DB write + status-unmoved guarantee is covered by the existing integration
 * test src/lib/ai/__tests__/dlo-opportunity.integration.test.ts (green in CI).
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
const PID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DS = process.env.NEXT_PUBLIC_SANITY_DATASET;
const TOKEN = process.env.SANITY_API_TOKEN ?? '';
async function q(groq, params = {}) {
  const url = new URL(`/v2024-01-01/data/query/${DS}`, `https://${PID}.api.sanity.io`);
  url.searchParams.set('query', groq);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(`$${k}`, JSON.stringify(v));
  const headers = {};
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`Sanity ${res.status}: ${await res.text()}`);
  return (await res.json()).result;
}
const VALID_TIERS = new Set(['emerging', 'developing', 'demonstrating']);
// mirrors normalizeThreadId: strip the deterministic-id prefix to the bare code
const bare = (id) => (id ?? '').replace(/^capabilityThread\./, '');

const ids = [
  'seed-act-measure-mix', 'seed-act-knead-wait', 'seed-act-shape-bake',
  'seed-act-stars-a1', 'seed-act-stars-a2', 'seed-act-stars-a3',
  'seed-act-patterns-a1', 'seed-act-patterns-a2', 'seed-act-patterns-a3',
];

// 1. EXACT enrich.ts assembleContext query (status=="published" gated)
const acts = await q(
  `*[_type == "activity" && _id in $ids && status == "published"]{
     _id, title,
     capabilityThreads[]->{ _id },
     capabilityTargets[]{ tier, thread->{ _id } }
   }`,
  { ids },
);

// prod published-DLO catalog (the validDloIds set declaredTargetsToDloIds checks)
const allDloIds = await q(`*[_type=="discreteLearningObjective" && status=="published"]._id`);
const validDlo = new Set(allDloIds);

let totalOpps = 0;
for (const id of ids) {
  const a = acts.find((x) => x._id === id);
  console.log(`\n${id}  "${a?.title ?? '?'}"`);
  if (!a) { console.log('  (not published / not found)'); continue; }
  // build declaredTargets exactly as enrich.ts does
  const declaredTargets = [];
  const seen = new Set();
  for (const t of a.capabilityTargets ?? []) {
    const code = t?.thread?._id ? bare(t.thread._id) : null;
    const tier = t?.tier;
    if (!code || !VALID_TIERS.has(tier)) continue;
    const k = `${code}.${tier}`;
    if (!seen.has(k)) { seen.add(k); declaredTargets.push({ threadId: code, tier }); }
  }
  // map to opportunity DLO ids (declaredTargetsToDloIds) + validate
  for (const dt of declaredTargets) {
    const dloId = `dlo.${dt.threadId}.${dt.tier}`;
    const ok = validDlo.has(dloId);
    if (ok) totalOpps++;
    console.log(`  → opportunity row: { dloId: '${dloId}', tier: '${dt.tier}', provenance: 'declared', evidence_state: 'opportunity', confidence: null }  ${ok ? '✓ published DLO' : '✗ MISSING'}`);
  }
  if (declaredTargets.length === 0) console.log('  (no capabilityTargets → no declared opportunity)');
}
console.log(`\nTotal declared opportunities a full Starter-Pack run would write: ${totalOpps}`);
console.log(`Status impact: NONE — opportunities never roll up to learner_dlo_status until corroborated (D-OS1).`);
