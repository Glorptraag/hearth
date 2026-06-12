/**
 * Deterministic curriculum coverage — transposer v0 (WS-5).
 *
 * Pure rollup: learner DLO statuses × a static DLO→framework mapping → coverage
 * by subject, for one regulatory framework. No I/O, no LLM. The same history
 * produces byte-identical output every time — the Stage-4 promise that "the
 * same report tomorrow says the same thing". The server-side fetch + the
 * deterministic-vs-fallback decision live in `src/lib/report/coverage.ts`;
 * everything here is a pure function of its arguments.
 *
 * Adding a second framework (e.g. `ac-v9-nsw` for NESA) is authoring mapping
 * data, not changing code: this rollup is framework-agnostic.
 */

export type Contribution = 'primary' | 'partial' | 'incidental';

/** Verbatim shape of a `discreteLearningObjective.regulatoryMappings[]` item. */
export type RegulatoryMapping = {
  frameworkKey: string;
  frameworkVersion?: string | null;
  codes?: string[] | null;
  reportTier?: string | null;
  contribution?: Contribution | null;
  evidenceWeight?: number | null;
};

/** Minimal slice of a `learner_dlo_status` row this rollup needs. */
export type DloStatus = { status: string };

export type SubjectCoverage = {
  codes: string[];
  weightedScore: number;
  byContribution: Record<Contribution, number>;
};

export type DeterministicCoverage = Record<string, SubjectCoverage>;

/**
 * AC9 descriptor-code prefix → Hearth subject key. Single source of truth: the
 * report export route and the report page both import this (it was duplicated,
 * verbatim, in each before WS-5). Order is preserved from those originals so
 * `descriptorToSubject` resolves first-match identically — this is a de-dupe,
 * not a behaviour change.
 */
export const AC9_SUBJECT_MAP: Record<string, string> = {
  AC9E: 'english',
  AC9M: 'mathematics',
  AC9S: 'science',
  AC9HAS: 'hass',
  AC9HI: 'hass',
  AC9GE: 'hass',
  AC9CI: 'hass',
  AC9EB: 'hass',
  AC9AR: 'arts',
  AC9MU: 'arts',
  AC9DR: 'arts',
  AC9DA: 'arts',
  AC9MA: 'arts',
  AC9TD: 'technologies',
  AC9TDI: 'technologies',
  AC9HP: 'hpe',
  AC9LA: 'languages',
};

/** Canonical subject order (distinct values of AC9_SUBJECT_MAP, insertion order). */
export const SUBJECT_KEYS: string[] = [...new Set(Object.values(AC9_SUBJECT_MAP))];

/**
 * Resolve an AC9 descriptor code to a subject key. First-match over
 * AC9_SUBJECT_MAP insertion order — identical to the logic this centralises
 * out of the export route and report page.
 */
export function descriptorToSubject(code: string): string | null {
  for (const [prefix, subject] of Object.entries(AC9_SUBJECT_MAP)) {
    if (code.startsWith(prefix)) return subject;
  }
  return null;
}

/**
 * Framework key for a family's jurisdiction. `ac-v9-{state}`, lowercased,
 * defaulting to QLD when state is missing or blank.
 */
export function frameworkKeyForState(state: string | null | undefined): string {
  const s = state && state.trim() ? state.trim() : 'QLD';
  return `ac-v9-${s.toLowerCase()}`;
}

// Only observed evidence counts toward coverage. `demonstrating` carries full
// weight; `developing` is halved; everything else (emerging / unobserved /
// absent) contributes nothing.
const TIER_WEIGHT: Record<string, number> = {
  demonstrating: 1,
  developing: 0.5,
};

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function round4(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}

function emptySubjectCoverage(): SubjectCoverage {
  return { codes: [], weightedScore: 0, byContribution: { primary: 0, partial: 0, incidental: 0 } };
}

/**
 * Roll DLO statuses up into per-subject coverage for one framework.
 *
 * A DLO contributes only if its status is `developing` or `demonstrating`.
 * Each of its mappings that targets `frameworkKey` contributes
 * `tierWeight × evidenceWeight` once per distinct subject its codes touch;
 * the running total lands in `weightedScore` and, bucketed by `contribution`,
 * in `byContribution` (so the three buckets sum to `weightedScore`). Codes are
 * collected deduped and returned sorted. Output is the full SUBJECT_KEYS set
 * (zero-filled for untouched subjects) so the shape is stable for callers and
 * for determinism assertions.
 */
export function rollupCoverage(input: {
  dloStatuses: Record<string, DloStatus>;
  mappings: Record<string, RegulatoryMapping[]>;
  frameworkKey: string;
}): DeterministicCoverage {
  const { dloStatuses, mappings, frameworkKey } = input;

  const result: DeterministicCoverage = {};
  const codeSets: Record<string, Set<string>> = {};
  for (const subject of SUBJECT_KEYS) {
    result[subject] = emptySubjectCoverage();
    codeSets[subject] = new Set();
  }

  // Sort DLO ids so summation order is stable regardless of input key order —
  // floating-point addition is not associative, so this guards determinism.
  const dloIds = Object.keys(dloStatuses).sort();

  for (const dloId of dloIds) {
    const tierWeight = TIER_WEIGHT[dloStatuses[dloId].status];
    if (!tierWeight) continue;

    for (const m of mappings[dloId] ?? []) {
      if (m.frameworkKey !== frameworkKey) continue;

      const evidenceWeight = clamp01(m.evidenceWeight ?? 1);
      const contribution: Contribution = m.contribution ?? 'partial';

      // Attribute the mapping's score once per distinct subject it touches,
      // while collecting every code into that subject's set.
      const subjectsTouched = new Set<string>();
      for (const code of m.codes ?? []) {
        const subject = descriptorToSubject(code);
        if (!subject || !result[subject]) continue;
        codeSets[subject].add(code);
        subjectsTouched.add(subject);
      }

      const contrib = tierWeight * evidenceWeight;
      for (const subject of subjectsTouched) {
        result[subject].weightedScore += contrib;
        result[subject].byContribution[contribution] += contrib;
      }
    }
  }

  for (const subject of SUBJECT_KEYS) {
    result[subject].codes = [...codeSets[subject]].sort();
    result[subject].weightedScore = round4(result[subject].weightedScore);
    result[subject].byContribution = {
      primary: round4(result[subject].byContribution.primary),
      partial: round4(result[subject].byContribution.partial),
      incidental: round4(result[subject].byContribution.incidental),
    };
  }

  return result;
}
