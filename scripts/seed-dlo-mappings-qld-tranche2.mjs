/**
 * Seed DLO → regulatory-framework mappings — `ac-v9-qld` tranche 2 (WS-5).
 *
 * Tranche 1 (`scripts/seed-dlo-mappings.ts` + `scripts/data/dlo-regulatory-mappings.ts`)
 * covers 17 threads / 51 DLOs. Evidenced pilot families report 0% coverage in
 * subjects whose threads have no `ac-v9-qld` mapping yet — HPE (Health and
 * Physical Education) is the highest-priority gap because P1 (Gross Motor) and
 * PS2 (Social Skills) both show real developing/demonstrating evidence with
 * nowhere to land. This tranche adds those two threads (6 DLOs) only.
 *
 * ── Codes ────────────────────────────────────────────────────────────────
 *   P1 Gross Motor & Physical Coordination → HPE Movement strand (AC9HP*M*):
 *     emerging     AC9HP2M01 — F–2 "practise fundamental movement skills…"
 *     developing   AC9HP4M01 — 3–4 "refine fundamental movement skills…"
 *     demonstrating AC9HP6M01 — 5–6 "perform specialised movement skills in
 *                    dynamic movement situations"
 *   PS2 Social Skills & Cooperation → HPE Personal, social and community
 *   health strand, "Interacting with others" sub-strand (AC9HP*P*):
 *     emerging     AC9HP2P05 — F–2 "identify actions that help them interact
 *                    positively with others"
 *     developing   AC9HP4P07 — 3–4 "practise skills to establish and manage
 *                    relationships"
 *     demonstrating AC9HP6P07 — 5–6 "evaluate and apply strategies to
 *                    respond to challenging social situations"
 *   These are AUTHORED against my knowledge of the published ACARA v9 HPE
 *   content descriptors and lint clean against AC9_CODE_PATTERN, but — like
 *   every regulatory mapping in this repo — MUST be verified against the live
 *   v9.australiancurriculum.edu.au listing by a human before publish (flagged
 *   for Drew/council review; not a code decision).
 *
 * ── reportTier / contribution / evidenceWeight ──────────────────────────
 *   Same convention as tranche 1: `reportTier` is 'cd_level' throughout (every
 *   code is a content descriptor); `contribution` is 'primary' (each DLO's
 *   descriptor is the direct intent of its matched code); `evidenceWeight`
 *   1.0 at developing/demonstrating (clean direct match), 0.9 at emerging
 *   (still a clean match, slightly broader early-band descriptor).
 *
 * Idempotent + non-destructive: patches the existing `discreteLearningObjective`
 * documents created by `scripts/seed-dlos.ts` (deterministic ids
 * `dlo.P1.{tier}` / `dlo.PS2.{tier}`), setting ONLY `regulatoryMappings` via
 * `.set()` (not `createOrReplace`) so descriptor/thread/tier/status are left
 * untouched, and deterministic per-mapping `_key`s keep re-runs stable.
 *
 * Every authored code is linted against AC9_CODE_PATTERN before any write — a
 * single invalid code aborts the run with a non-zero exit and no partial
 * commit.
 *
 * This module performs NO writes on import — `main()` only runs when the file
 * is executed directly (`node scripts/seed-dlo-mappings-qld-tranche2.mjs`),
 * so requiring/importing it for review or from a test is always network-free.
 *
 * Publishing to Sanity is gated on human decision D-publish — do NOT run this
 * against prod until that gate clears.
 *
 * Run (gated): node scripts/seed-dlo-mappings-qld-tranche2.mjs
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Mirrors src/lib/curriculum/ac9.ts AC9_CODE_PATTERN. Duplicated (not imported)
// so this plain-JS seed script stays dependency-free of the TS build.
const AC9_CODE_PATTERN = /^AC9[A-Z]{1,4}\d{1,2}[A-Z]{1,3}\d{2}$/;

/** ac-v9-qld content-descriptor mapping. Single framework, single mapping/DLO. */
function qld(codes, contribution, evidenceWeight) {
  return {
    frameworkKey: 'ac-v9-qld',
    frameworkVersion: '9.0',
    codes,
    reportTier: 'cd_level',
    contribution,
    evidenceWeight,
  };
}

export const DLO_REGULATORY_MAPPINGS_TRANCHE2 = [
  // P1 Gross Motor & Physical Coordination — HPE Movement strand.
  { dloId: 'dlo.P1.emerging', mappings: [qld(['AC9HP2M01'], 'primary', 0.9)] },
  { dloId: 'dlo.P1.developing', mappings: [qld(['AC9HP4M01'], 'primary', 1.0)] },
  { dloId: 'dlo.P1.demonstrating', mappings: [qld(['AC9HP6M01'], 'primary', 1.0)] },

  // PS2 Social Skills & Cooperation — HPE Personal/social/community health,
  // "Interacting with others" sub-strand.
  { dloId: 'dlo.PS2.emerging', mappings: [qld(['AC9HP2P05'], 'primary', 0.9)] },
  { dloId: 'dlo.PS2.developing', mappings: [qld(['AC9HP4P07'], 'primary', 1.0)] },
  { dloId: 'dlo.PS2.demonstrating', mappings: [qld(['AC9HP6P07'], 'primary', 1.0)] },
];

/** Collect every (dloId → framework → code) that fails the AC9 shape lint. */
export function lintCodes(entries = DLO_REGULATORY_MAPPINGS_TRANCHE2) {
  const failures = [];
  for (const entry of entries) {
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
export function keyedMappings(entry) {
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

  dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
    token: process.env.SANITY_API_TOKEN,
    apiVersion: '2024-01-01',
    useCdn: false,
  });

  console.log(
    `Patching ${DLO_REGULATORY_MAPPINGS_TRANCHE2.length} DLO document(s) (P1 + PS2, tranche 2) with regulatory mappings…`,
  );

  const tx = client.transaction();
  for (const entry of DLO_REGULATORY_MAPPINGS_TRANCHE2) {
    tx.patch(entry.dloId, { set: { regulatoryMappings: keyedMappings(entry) } });
  }
  await tx.commit();
  console.log(`  · committed ${DLO_REGULATORY_MAPPINGS_TRANCHE2.length}/${DLO_REGULATORY_MAPPINGS_TRANCHE2.length}`);

  console.log('Per-framework mapping counts:', { 'ac-v9-qld': DLO_REGULATORY_MAPPINGS_TRANCHE2.length });
  console.log('Done.');
}

// Only run when executed directly (`node scripts/seed-dlo-mappings-qld-tranche2.mjs`).
// Importing this module (e.g. from a test, or for review) never triggers a write.
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
