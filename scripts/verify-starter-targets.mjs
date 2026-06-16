#!/usr/bin/env node
/** Read-only: verify Starter Pack capabilityTargets applied + dereference. */
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

// 1. Count activitiesWithTargets across the Starter Pack tree
const tree = await q(`*[_id=="drafts.seed-pack-starter-collection"][0]{
  "acts": modules[]->approaches[]->activities[]->{ _id, title, "n": count(capabilityTargets) }
}`);
const acts = tree?.acts ?? [];
const withTargets = acts.filter((a) => (a.n ?? 0) > 0);
console.log(`Starter Pack activities: ${acts.length}`);
console.log(`  activitiesWithTargets: ${withTargets.length}`);
for (const a of acts) console.log(`    ${(a.n ?? 0) > 0 ? '✓' : '·'} ${a._id}  targets=${a.n}`);

// 2. Spot-check: dereference one activity's targets (thread resolves to a real doc)
const spot = await q(`*[_id=="seed-act-knead-wait"][0]{
  _id, title,
  "targets": capabilityTargets[]{ tier, "thread": thread->{ _id, title } }
}`);
console.log(`\nSpot-check ${spot._id} "${spot.title}":`);
for (const t of spot.targets ?? []) {
  const resolved = t.thread?._id ? `${t.thread._id} "${t.thread.title}"` : 'DANGLING ⚠️';
  console.log(`    ${t.tier}  →  ${resolved}   (opportunity dlo.${(t.thread?._id ?? '').replace('capabilityThread.','')}.${t.tier})`);
}
