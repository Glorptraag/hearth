/**
 * Seed DLO → regulatory-framework mappings — `ac-v9-nsw` exit demo (WS-5).
 *
 * WS-5's headline claim is that the transposer is framework-agnostic: adding a
 * second jurisdiction is AUTHORING DATA ONLY, no change to
 * `src/lib/report/*.ts`. This script is that proof for NSW — it patches a
 * small `ac-v9-nsw` mapping (5 threads, one per tier = 15 DLOs) onto DLO docs
 * that carry ZERO mappings today, so it can never clobber the QLD tranche-1/
 * tranche-2 work (`scripts/data/dlo-regulatory-mappings.ts` +
 * `scripts/seed-dlo-mappings-qld-tranche2.mjs`, which together cover L1, L3,
 * L5, L7, L8, L9, C1, M1, M2, M5, M9, S1, S5, H1, H2, H3, PS3, P1, PS2).
 *
 * ── Threads chosen (5, one per Hearth subject bucket) ───────────────────────
 *   L2  Phonological Awareness   → english
 *   M3  Fractional Thinking      → mathematics
 *   S2  Biological Sciences      → science
 *   H4  Civics & Citizenship     → hass
 *   P2  Fine Motor               → hpe
 *
 * ── Codes ────────────────────────────────────────────────────────────────
 * These are DEMO codes authored in the same AC9-shaped convention as the QLD
 * tranches (real NSW/NESA syllabus outcome coding is a distinct scheme —
 * `EN2-...`, `MA3-...`, etc. — and is intentionally out of scope for this exit
 * demo, which exists to prove the *rollup* is framework-agnostic, not to ship
 * a production-accurate NSW mapping). Lint clean against AC9_CODE_PATTERN.
 * Like every regulatory mapping in this repo, these MUST be verified — or, for
 * NSW, replaced with the real NESA outcome codes — by a human before any
 * publish (flagged for Drew/council review; not a code decision).
 *
 *   L2 emerging      AC9E1LA01 · developing AC9E3LA01 · demonstrating AC9E5LA01
 *   M3 emerging      AC9M1N03  · developing AC9M3N05  · demonstrating AC9M5N01
 *   S2 emerging      AC9S1U01  · developing AC9S3U03  · demonstrating AC9S5U04
 *   H4 emerging      AC9HS2K06 · developing AC9HS4K07 · demonstrating AC9HS6K07
 *   P2 emerging      AC9HP2M04 · developing AC9HP4M04 · demonstrating AC9HP6M05
 *
 * ── reportTier / contribution / evidenceWeight ──────────────────────────
 *   Same convention as the QLD tranches: `reportTier` is 'cd_level' throughout
 *   (every code is a content descriptor); `contribution` is 'primary' (each
 *   DLO's descriptor is the direct intent of its matched code); `evidenceWeight`
 *   1.0 at developing/demonstrating (clean direct match), 0.9 at emerging
 *   (still a clean match, slightly broader early-band descriptor).
 *
 * Idempotent + non-destructive: patches the existing `discreteLearningObjective`
 * documents created by `scripts/seed-dlos.ts` (deterministic ids
 * `dlo.{L2,M3,S2,H4,P2}.{tier}`), setting ONLY `regulatoryMappings` via `.set()`
 * (not `createOrReplace`) so descriptor/thread/tier/status are left untouched,
 * and deterministic per-mapping `_key`s keep re-runs stable. `.set()` REPLACES
 * the whole `regulatoryMappings` array — safe here only because these 5
 * threads carry no prior mapping; do not point this script at an
 * already-mapped thread without switching to a merge.
 *
 * Every authored code is linted against AC9_CODE_PATTERN before any write — a
 * single invalid code aborts the run with a non-zero exit and no partial
 * commit.
 *
 * This module performs NO writes on import — `main()` only runs when the file
 * is executed directly (`node scripts/seed-dlo-mappings-nsw-demo.mjs`), so
 * requiring/importing it for review or from a test is always network-free.
 *
 * Publishing to Sanity is gated on human decision D-publish — do NOT run this
 * against prod until that gate clears.
 *
 * Run (gated): node scripts/seed-dlo-mappings-nsw-demo.mjs
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Mirrors src/lib/curriculum/ac9.ts AC9_CODE_PATTERN. Duplicated (not imported)
// so this plain-JS seed script stays dependency-free of the TS build.
const AC9_CODE_PATTERN = /^AC9[A-Z]{1,4}\d{1,2}[A-Z]{1,3}\d{2}$/;

/** ac-v9-nsw content-descriptor mapping. Single framework, single mapping/DLO. */
function nsw(codes, contribution, evidenceWeight) {
  return {
    frameworkKey: 'ac-v9-nsw',
    frameworkVersion: '9.0',
    codes,
    reportTier: 'cd_level',
    contribution,
    evidenceWeight,
  };
}

export const DLO_REGULATORY_MAPPINGS_NSW_DEMO = [
  // L2 Phonological Awareness — English Language strand.
  { dloId: 'dlo.L2.emerging', mappings: [nsw(['AC9E1LA01'], 'primary', 0.9)] },
  { dloId: 'dlo.L2.developing', mappings: [nsw(['AC9E3LA01'], 'primary', 1.0)] },
  { dloId: 'dlo.L2.demonstrating', mappings: [nsw(['AC9E5LA01'], 'primary', 1.0)] },

  // M3 Fractional Thinking — Mathematics Number strand.
  { dloId: 'dlo.M3.emerging', mappings: [nsw(['AC9M1N03'], 'primary', 0.9)] },
  { dloId: 'dlo.M3.developing', mappings: [nsw(['AC9M3N05'], 'primary', 1.0)] },
  { dloId: 'dlo.M3.demonstrating', mappings: [nsw(['AC9M5N01'], 'primary', 1.0)] },

  // S2 Biological Sciences — Science Understanding strand.
  { dloId: 'dlo.S2.emerging', mappings: [nsw(['AC9S1U01'], 'primary', 0.9)] },
  { dloId: 'dlo.S2.developing', mappings: [nsw(['AC9S3U03'], 'primary', 1.0)] },
  { dloId: 'dlo.S2.demonstrating', mappings: [nsw(['AC9S5U04'], 'primary', 1.0)] },

  // H4 Civics & Citizenship — HASS (F–6 combined) strand.
  { dloId: 'dlo.H4.emerging', mappings: [nsw(['AC9HS2K06'], 'primary', 0.9)] },
  { dloId: 'dlo.H4.developing', mappings: [nsw(['AC9HS4K07'], 'primary', 1.0)] },
  { dloId: 'dlo.H4.demonstrating', mappings: [nsw(['AC9HS6K07'], 'primary', 1.0)] },

  // P2 Fine Motor — HPE Movement strand.
  { dloId: 'dlo.P2.emerging', mappings: [nsw(['AC9HP2M04'], 'primary', 0.9)] },
  { dloId: 'dlo.P2.developing', mappings: [nsw(['AC9HP4M04'], 'primary', 1.0)] },
  { dloId: 'dlo.P2.demonstrating', mappings: [nsw(['AC9HP6M05'], 'primary', 1.0)] },
];

/** Collect every (dloId → framework → code) that fails the AC9 shape lint. */
export function lintCodes(entries = DLO_REGULATORY_MAPPINGS_NSW_DEMO) {
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
    `Patching ${DLO_REGULATORY_MAPPINGS_NSW_DEMO.length} DLO document(s) (L2 + M3 + S2 + H4 + P2, ac-v9-nsw exit demo) with regulatory mappings…`,
  );

  const tx = client.transaction();
  for (const entry of DLO_REGULATORY_MAPPINGS_NSW_DEMO) {
    tx.patch(entry.dloId, { set: { regulatoryMappings: keyedMappings(entry) } });
  }
  await tx.commit();
  console.log(
    `  · committed ${DLO_REGULATORY_MAPPINGS_NSW_DEMO.length}/${DLO_REGULATORY_MAPPINGS_NSW_DEMO.length}`,
  );

  console.log('Per-framework mapping counts:', { 'ac-v9-nsw': DLO_REGULATORY_MAPPINGS_NSW_DEMO.length });
  console.log('Done.');
}

// Only run when executed directly (`node scripts/seed-dlo-mappings-nsw-demo.mjs`).
// Importing this module (e.g. from a test, or for review) never triggers a write.
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
