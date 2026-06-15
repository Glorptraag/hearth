/**
 * DLO → regulatory-framework mappings — `ac-v9-qld` tranche 1 (WS-5 transposer).
 *
 * This is the FIRST REAL authored tranche, replacing the former 2–3 row
 * illustrative scaffold (plan item B2). It is NOT the full 171: scope is the
 * DLOs whose capability threads are observed in pilot evidence (the WS-3 golden
 * set, `scripts/data/dlo-golden-set.ts`) ∪ declared by the Hearth Starter
 * Collection (`src/lib/sanity/seed.ts`). Tranche 2 (the remaining threads)
 * follows the same pattern once tranche 1 survives a real report.
 *
 * ── Scope (17 threads × 3 tiers = 51 DLOs) ──────────────────────────────────
 *   Literacy:   L1 L3 L5 L7 L8 L9
 *   Maths:      M1 M2 M5 M9
 *   Science:    S1 S5
 *   Humanities: H1 H2 H3        (AC9HS… — see prefix-map caveat below)
 *   Wellbeing:  PS3             (AC9HP… HPE)
 *   Literary:   C1              (narrative/storytelling — see C1 note below)
 *
 * ── Deliberately EXCLUDED from tranche 1 ────────────────────────────────────
 *   EF5 (Critical Thinking) and EF7 (Metacognition) ARE observed in pilot data
 *   (golden gs-11, gs-15) but correspond to the AC9 *Critical and Creative
 *   Thinking GENERAL CAPABILITY*, which has no learning-area `AC9XXNN` content
 *   descriptor. Forcing them onto a learning-area code would either fabricate
 *   subject coverage in the rollup or be a meaningless incidental tag — both
 *   contrary to the WS-4 honesty mandate. They are left to a future GC-continuum
 *   mapping under a distinct framework scheme (out of `AC9_CODE_PATTERN` scope).
 *
 * ── Keys, codes, lint ───────────────────────────────────────────────────────
 *   Keys are the deterministic DLO ids written by `scripts/seed-dlos.ts`
 *   (`dlo.{threadId}.{tier}`). Every `codes[]` entry is a real ACARA v9 content
 *   descriptor code, verified verbatim against the published v9 curriculum (see
 *   the PR description for the per-code verification log + sources). Every code
 *   lints clean against `AC9_CODE_PATTERN` and is checked by the seed script
 *   before any write. Tier→year anchoring: emerging ≈ Year 1–2, developing ≈
 *   Year 3, demonstrating ≈ Year 5–6 (HPE is banded: F / Yr1–2 / Yr3–4 / Yr5–6).
 *   Foundation codes (`AC9xFxxNN`) are avoided — they carry a letter year and
 *   fail `AC9_CODE_PATTERN`.
 *
 * ── reportTier / contribution / evidenceWeight ──────────────────────────────
 *   reportTier      'cd_level' throughout — every code is a content descriptor.
 *   contribution    'primary' where the DLO's described capability is the direct
 *                   intent of the descriptor(s); 'partial' where it covers part
 *                   of a broad descriptor or one of several.
 *   evidenceWeight  match strength of the DLO→descriptor link (NOT the tier — the
 *                   rollup already weights by observed status): 1.0 clean direct
 *                   match · 0.8–0.9 clean-but-broad · 0.6–0.7 partial.
 *   NB the rollup (`src/lib/report/deterministic-coverage.ts`) only counts a
 *   learner's `developing`/`demonstrating` *status*, so emerging-tier mappings
 *   are authored for completeness but do not move the weighted score today.
 *
 * ── NOTES (caveats 1–2 RESOLVED in this PR; 3–4 are confirmed mappings) ──────
 *   1. PREFIX-MAP BUG — RESOLVED. `AC9_SUBJECT_MAP` in
 *      `src/lib/report/deterministic-coverage.ts` carried an invented HASS key
 *      (`AC9HAS`/`AC9HI`/…); the real v9 F–6 HASS prefix is `AC9HS`. The map is
 *      now reconciled against real ACARA v9 prefixes (`AC9HS` + 7–10 subjects
 *      `AC9HH/HG/HC/HE`), so every H1/H2/H3 code below resolves to `hass`. A unit
 *      assertion (`deterministic-coverage.test.ts`) fails if ANY code in this
 *      file resolves to null. This was plan item C3.
 *   2. PS3 demonstrating code — RESOLVED. Was `AC9HP6P02` ("manage changes and
 *      transitions, incl. puberty"); corrected to `AC9HP6P06` ("apply strategies
 *      to manage emotions and analyse how emotional responses influence
 *      interactions"), the emotion-management match for the PS3 demonstrating
 *      descriptor. Verified via Scootle/QCAA v9 listings.
 *   3. C1 is "Visual Art" in `THREAD_NAMES` but the SEEDED `dlo.C1.*` descriptor
 *      (from the lo-fi payload, which `seed-dlos.ts` resolves first) is
 *      narrative/storytelling — matching `THREAD_TO_V2_DOMAIN` (C1 →
 *      literaryTradition). Mappings below follow the seeded descriptor (English
 *      Literature — "Creating literary texts"), not the stale label.
 *   4. L7 is "Narrative & Retelling" in `THREAD_NAMES` but the seeded descriptor
 *      is text-structure-&-purpose; mapped accordingly (English LA "text
 *      organisation by purpose").
 */

export type RegulatoryMappingSeed = {
  frameworkKey: string;
  frameworkVersion: string;
  codes: string[];
  reportTier: 'cd_level' | 'learning_area' | 'standard' | 'outcome';
  contribution: 'primary' | 'partial' | 'incidental';
  evidenceWeight: number;
};

export type DloRegulatoryMappingSeed = {
  /** Deterministic DLO id — `dlo.{threadId}.{tier}` (see scripts/seed-dlos.ts). */
  dloId: string;
  mappings: RegulatoryMappingSeed[];
};

/** ac-v9-qld content-descriptor mapping. Single framework, single mapping/DLO. */
function qld(
  codes: string[],
  contribution: RegulatoryMappingSeed['contribution'],
  evidenceWeight: number,
): RegulatoryMappingSeed {
  return {
    frameworkKey: 'ac-v9-qld',
    frameworkVersion: '9.0',
    codes,
    reportTier: 'cd_level',
    contribution,
    evidenceWeight,
  };
}

export const DLO_REGULATORY_MAPPINGS: DloRegulatoryMappingSeed[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // LITERACY → English (AC9E*)
  // ─────────────────────────────────────────────────────────────────────────

  // L1 Oral Communication — Literacy "Interacting with others" + oral presentation.
  { dloId: 'dlo.L1.emerging', mappings: [qld(['AC9E1LY02'], 'primary', 0.8)] },
  { dloId: 'dlo.L1.developing', mappings: [qld(['AC9E3LY02', 'AC9E3LY07'], 'primary', 0.9)] },
  { dloId: 'dlo.L1.demonstrating', mappings: [qld(['AC9E5LY02', 'AC9E5LY07'], 'primary', 1.0)] },

  // L3 Reading Comprehension — Literacy comprehension/reading-process strand.
  { dloId: 'dlo.L3.emerging', mappings: [qld(['AC9E1LY04', 'AC9E1LY05'], 'primary', 0.8)] },
  { dloId: 'dlo.L3.developing', mappings: [qld(['AC9E3LY04', 'AC9E3LY05'], 'primary', 1.0)] },
  { dloId: 'dlo.L3.demonstrating', mappings: [qld(['AC9E5LY05', 'AC9E5LE02'], 'primary', 1.0)] },

  // L5 Written Expression — Literacy "Creating texts".
  { dloId: 'dlo.L5.emerging', mappings: [qld(['AC9E1LY06'], 'primary', 0.8)] },
  { dloId: 'dlo.L5.developing', mappings: [qld(['AC9E3LY06'], 'primary', 1.0)] },
  { dloId: 'dlo.L5.demonstrating', mappings: [qld(['AC9E5LY06'], 'primary', 1.0)] },

  // L7 Text Structure & Purpose (seeded descriptor; see caveat 4) — Language
  // "text organisation by purpose" + Literacy purpose/audience.
  { dloId: 'dlo.L7.emerging', mappings: [qld(['AC9E1LA03', 'AC9E1LY01'], 'primary', 0.8)] },
  { dloId: 'dlo.L7.developing', mappings: [qld(['AC9E3LA03', 'AC9E3LY01'], 'primary', 0.9)] },
  { dloId: 'dlo.L7.demonstrating', mappings: [qld(['AC9E5LA03', 'AC9E5LY03'], 'primary', 1.0)] },

  // L8 Persuasion & Argument — Language evaluative/objective-subjective language
  // + Literacy creating persuasive texts.
  { dloId: 'dlo.L8.emerging', mappings: [qld(['AC9E1LA02'], 'primary', 0.8)] },
  { dloId: 'dlo.L8.developing', mappings: [qld(['AC9E3LA02', 'AC9E3LY06'], 'primary', 0.9)] },
  { dloId: 'dlo.L8.demonstrating', mappings: [qld(['AC9E5LA02', 'AC9E5LY06'], 'primary', 1.0)] },

  // L9 Literary Response & Appreciation — Literature "responding to / examining".
  { dloId: 'dlo.L9.emerging', mappings: [qld(['AC9E1LE02', 'AC9E1LE03'], 'primary', 0.8)] },
  { dloId: 'dlo.L9.developing', mappings: [qld(['AC9E3LE02', 'AC9E3LE04'], 'primary', 0.9)] },
  { dloId: 'dlo.L9.demonstrating', mappings: [qld(['AC9E5LE02', 'AC9E5LE04'], 'primary', 1.0)] },

  // C1 Narrative & Storytelling (seeded descriptor; see caveat 3) — Literature
  // "Creating literary texts".
  { dloId: 'dlo.C1.emerging', mappings: [qld(['AC9E1LE05'], 'primary', 0.9)] },
  { dloId: 'dlo.C1.developing', mappings: [qld(['AC9E3LE05'], 'primary', 1.0)] },
  { dloId: 'dlo.C1.demonstrating', mappings: [qld(['AC9E5LE05'], 'primary', 1.0)] },

  // ─────────────────────────────────────────────────────────────────────────
  // MATHEMATICS → Maths (AC9M*)
  // ─────────────────────────────────────────────────────────────────────────

  // M1 Number Sense & Place Value — Number strand (whole-number place value).
  { dloId: 'dlo.M1.emerging', mappings: [qld(['AC9M1N01', 'AC9M1N02'], 'primary', 0.9)] },
  { dloId: 'dlo.M1.developing', mappings: [qld(['AC9M2N01', 'AC9M2N02'], 'primary', 1.0)] },
  { dloId: 'dlo.M1.demonstrating', mappings: [qld(['AC9M3N01', 'AC9M4N07'], 'primary', 1.0)] },

  // M2 Operations & Computation — Number + Algebra (facts/strategies).
  { dloId: 'dlo.M2.emerging', mappings: [qld(['AC9M1N04', 'AC9M1N06'], 'primary', 0.9)] },
  { dloId: 'dlo.M2.developing', mappings: [qld(['AC9M3A02', 'AC9M3N04'], 'primary', 1.0)] },
  { dloId: 'dlo.M2.demonstrating', mappings: [qld(['AC9M4N06', 'AC9M4A02'], 'primary', 1.0)] },

  // M5 Measurement Sense — Measurement strand.
  { dloId: 'dlo.M5.emerging', mappings: [qld(['AC9M1M01', 'AC9M1M02'], 'primary', 0.9)] },
  { dloId: 'dlo.M5.developing', mappings: [qld(['AC9M3M02', 'AC9M3M04'], 'primary', 0.9)] },
  { dloId: 'dlo.M5.demonstrating', mappings: [qld(['AC9M6M01', 'AC9M6M02', 'AC9M6M03'], 'primary', 1.0)] },

  // M9 Mathematical Modelling & Problem Solving — the explicit "mathematical
  // modelling" content descriptors (N05/N06/N09 across the years).
  { dloId: 'dlo.M9.emerging', mappings: [qld(['AC9M1N05'], 'primary', 0.8)] },
  { dloId: 'dlo.M9.developing', mappings: [qld(['AC9M3N06'], 'primary', 0.9)] },
  { dloId: 'dlo.M9.demonstrating', mappings: [qld(['AC9M6N09'], 'primary', 1.0)] },

  // ─────────────────────────────────────────────────────────────────────────
  // SCIENCE → Science (AC9S*)
  // ─────────────────────────────────────────────────────────────────────────

  // S1 Scientific Inquiry — Science Inquiry: questioning/predicting, planning,
  // evaluating.
  { dloId: 'dlo.S1.emerging', mappings: [qld(['AC9S1I01', 'AC9S1I03'], 'primary', 0.8)] },
  { dloId: 'dlo.S1.developing', mappings: [qld(['AC9S3I01', 'AC9S3I02', 'AC9S3I05'], 'primary', 0.9)] },
  { dloId: 'dlo.S1.demonstrating', mappings: [qld(['AC9S6I02', 'AC9S6I05'], 'primary', 1.0)] },

  // S5 Scientific Observation — Science Inquiry: observing/recording, processing.
  { dloId: 'dlo.S5.emerging', mappings: [qld(['AC9S1I03'], 'primary', 0.8)] },
  { dloId: 'dlo.S5.developing', mappings: [qld(['AC9S3I03', 'AC9S3I04'], 'primary', 0.9)] },
  { dloId: 'dlo.S5.demonstrating', mappings: [qld(['AC9S6I03', 'AC9S6I04'], 'primary', 1.0)] },

  // ─────────────────────────────────────────────────────────────────────────
  // HUMANITIES → HASS (AC9HS*) — resolves via AC9HS (prefix-map reconciled; note 1)
  // ─────────────────────────────────────────────────────────────────────────

  // H1 Historical Understanding & Chronology — History knowledge + chronology
  // skills. Thinking-thread mapped onto history-content descriptors → partial at
  // emerging, primary-but-broad upward.
  { dloId: 'dlo.H1.emerging', mappings: [qld(['AC9HS2K02', 'AC9HS2S02'], 'partial', 0.6)] },
  { dloId: 'dlo.H1.developing', mappings: [qld(['AC9HS4K03', 'AC9HS4S02'], 'primary', 0.8)] },
  { dloId: 'dlo.H1.demonstrating', mappings: [qld(['AC9HS6K01', 'AC9HS6S03'], 'primary', 0.9)] },

  // H2 Source Analysis & Evidence — HASS Skills (questioning/researching +
  // interpreting/analysing/evaluating sources). Direct match → primary.
  { dloId: 'dlo.H2.emerging', mappings: [qld(['AC9HS2S02', 'AC9HS2S03'], 'primary', 0.8)] },
  { dloId: 'dlo.H2.developing', mappings: [qld(['AC9HS4S02', 'AC9HS4S04'], 'primary', 0.9)] },
  { dloId: 'dlo.H2.demonstrating', mappings: [qld(['AC9HS6S02', 'AC9HS6S04'], 'primary', 1.0)] },

  // H3 Geography & Environmental Awareness — Geography knowledge descriptors.
  { dloId: 'dlo.H3.emerging', mappings: [qld(['AC9HS2K03', 'AC9HS2K04'], 'primary', 0.7)] },
  { dloId: 'dlo.H3.developing', mappings: [qld(['AC9HS4K05', 'AC9HS4K06'], 'primary', 0.8)] },
  { dloId: 'dlo.H3.demonstrating', mappings: [qld(['AC9HS6K04', 'AC9HS6K05'], 'primary', 0.9)] },

  // ─────────────────────────────────────────────────────────────────────────
  // WELLBEING → HPE (AC9HP*) — Personal, social and community health (banded)
  // ─────────────────────────────────────────────────────────────────────────

  // PS3 Self-Regulation & Wellbeing — Personal/Social/Community Health emotion &
  // resilience descriptors. Demonstrating uses AC9HP6P06 ("apply strategies to
  // manage emotions and analyse how emotional responses influence interactions")
  // — the emotion-management match for the PS3 demonstrating descriptor, NOT the
  // mis-numbered AC9HP6P02 ("manage changes and transitions, incl. puberty"). See
  // resolved caveat 2.
  { dloId: 'dlo.PS3.emerging', mappings: [qld(['AC9HP2P03'], 'primary', 0.9)] },
  { dloId: 'dlo.PS3.developing', mappings: [qld(['AC9HP4P01'], 'primary', 0.9)] },
  { dloId: 'dlo.PS3.demonstrating', mappings: [qld(['AC9HP6P06'], 'primary', 0.9)] },
];
