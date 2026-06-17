/**
 * Coverage narrative (B6 — humane coverage framing).
 *
 * Pure derivation that turns the deterministic rollup + the family's logged
 * activity into the shape the report screen needs to keep a sparse-but-honest
 * report from ever reading "you did nothing" at the Stage-4 compliance event
 * (`docs/hearth-parent-journey-v1.md` §4 — Renee/QLD-HEU, Mei-Lin/NSW-NESA).
 *
 * Why this exists: B3 put QLD reports on deterministic coverage (it scores only
 * `developing`/`demonstrating` DLOs) and the C3 bar is strict, so a real family
 * can roll up to **zero formal coverage** while their log is full of evidence
 * (#204 audit, failure classes A "mapping gap" and B "status-bar gap"). This
 * builder surfaces the real activity alongside the formal number, and adds an
 * "also observed" signal sourced from the already-stored LLM curriculum
 * descriptors — clearly separated from the formal count, never conflated, and
 * with NO read-time LLM call (the determinism guarantee stays intact).
 *
 * No I/O, no server imports — safe to run in the client component that renders
 * the report. Everything is a pure function of its arguments.
 */

import {
  descriptorToSubject,
  type CoverageSignals,
  type DeterministicCoverage,
} from './deterministic-coverage';

/** The `/api/report/coverage` response shape, mirrored client-side. */
export type CoverageResponse =
  | { mode: 'fallback' }
  | { mode: 'deterministic'; coverage: DeterministicCoverage; signals: CoverageSignals };

/** Minimal slice of a learning entry the narrative reads. */
export type NarrativeEntry = {
  subjects: string[] | null;
  evidenceUrls: string[] | null;
  aiEnrichment: {
    curriculum_descriptors?: { code: string; confidence?: number }[] | null;
    capability_threads?: { thread_id: string; confidence?: number }[] | null;
    subjects_detected?: string[] | null;
  } | null;
};

/**
 * The framing state that selects the parent-facing copy. Deliberately gentle —
 * none of these surface as the word the engineering audit uses.
 */
export type CoverageState =
  | 'pre_log' //       nothing logged yet — the page's own EmptyState covers this
  | 'mapped' //        deterministic, ≥1 subject formally mapped — the happy path
  | 'mapping_gap' //   deterministic, 0 mapped, but evidence sits at the bar (class A)
  | 'emerging' //      deterministic, 0 mapped, nothing at the bar yet (class B)
  | 'observed'; //     non-deterministic (fallback / learning-area tiers) with activity

/** A subject whose log shows curriculum signal that the formal count hasn't claimed. */
export type ObservedArea = { subject: string; codeCount: number };

export type CoverageNarrative = {
  state: CoverageState;
  /** The "you have done a lot" counter-weight — always real, never a percentage. */
  activity: {
    entriesLogged: number;
    subjectsTouched: number;
    evidenceItems: number;
    confirmedWorkSamples: number;
    threadsObserved: number;
  };
  /** The formal, compliance-facing number. Only meaningful when `available`. */
  formal: {
    available: boolean;
    mappedSubjects: string[];
    mappedCodeCount: number;
  };
  /** Areas the log shows but the formal count hasn't claimed — kept distinct. */
  observedAreas: ObservedArea[];
};

/**
 * Build the coverage narrative for one learner's report.
 *
 * `subjectKeys` is the canonical subject order (the report's `ALL_SUBJECTS`);
 * outputs respect it so the UI renders in a stable order. `confirmedWorkSamples`
 * is the count of work-sample slots the parent has actually confirmed.
 */
export function buildCoverageNarrative(input: {
  entries: NarrativeEntry[];
  coverage: CoverageResponse | null;
  confirmedWorkSamples: number;
  subjectKeys: string[];
}): CoverageNarrative {
  const { entries, coverage, confirmedWorkSamples, subjectKeys } = input;
  const subjectSet = new Set(subjectKeys);

  // ── Real activity (always available, independent of any mapping) ──
  const touched = new Set<string>();
  const threads = new Set<string>();
  let evidenceItems = 0;
  // Per-subject set of LLM-recalled descriptor codes — the "also observed" raw
  // signal. Computed for every family; whether we show it depends on state.
  const observedCodes: Record<string, Set<string>> = {};
  for (const key of subjectKeys) observedCodes[key] = new Set();

  for (const e of entries) {
    evidenceItems += e.evidenceUrls?.length ?? 0;
    for (const s of e.subjects ?? []) if (subjectSet.has(s)) touched.add(s);
    for (const s of e.aiEnrichment?.subjects_detected ?? []) {
      const k = s.toLowerCase();
      if (subjectSet.has(k)) touched.add(k);
    }
    for (const t of e.aiEnrichment?.capability_threads ?? []) {
      if (t?.thread_id) threads.add(t.thread_id);
    }
    for (const d of e.aiEnrichment?.curriculum_descriptors ?? []) {
      const subj = descriptorToSubject(d.code);
      if (subj && observedCodes[subj]) observedCodes[subj].add(d.code);
    }
  }

  const activity = {
    entriesLogged: entries.length,
    subjectsTouched: touched.size,
    evidenceItems,
    confirmedWorkSamples,
    threadsObserved: threads.size,
  };

  // ── Formal, compliance-facing coverage (deterministic mode only) ──
  const deterministic = coverage?.mode === 'deterministic' ? coverage : null;
  const mappedSubjects: string[] = [];
  const formalCodes = new Set<string>();
  if (deterministic) {
    for (const key of subjectKeys) {
      const sc = deterministic.coverage[key];
      if (!sc) continue;
      for (const c of sc.codes) formalCodes.add(c);
      if (sc.weightedScore > 0) mappedSubjects.push(key);
    }
  }
  const formal = {
    available: Boolean(deterministic),
    mappedSubjects,
    mappedCodeCount: formalCodes.size,
  };

  // ── "Also observed" — LLM descriptor subjects the formal count hasn't claimed.
  // We subtract codes already in the formal set so the two views never overlap.
  const observedAreas: ObservedArea[] = [];
  for (const key of subjectKeys) {
    let codeCount = 0;
    for (const code of observedCodes[key]) if (!formalCodes.has(code)) codeCount++;
    if (codeCount > 0) observedAreas.push({ subject: key, codeCount });
  }

  // ── State selection ──
  let state: CoverageState;
  if (activity.entriesLogged === 0) {
    state = 'pre_log';
  } else if (!deterministic) {
    state = 'observed';
  } else if (mappedSubjects.length > 0) {
    state = 'mapped';
  } else if (deterministic.signals.countingDloCount > 0) {
    state = 'mapping_gap'; // class A — evidence at the bar, threads not yet mapped
  } else {
    state = 'emerging'; // class B — nothing at the developing bar yet
  }

  return { state, activity, formal, observedAreas };
}

// ── Shared report wording (B6 follow-up) ──
// Single home for the posture + per-subject activity language, so the report
// screen and the compliance PDF speak with one gentle, non-shaming voice
// (assume-good-faith; "sparse weeks aren't failure" — founding brief §4.5,
// Renee's job-to-be-done). These replace the old "At Risk" / "Critical" /
// "Coverage %" framing.

export type Posture = 'established' | 'building' | 'getting_started';

/**
 * Overall posture from breadth + volume of real activity. Same thresholds the
 * report screen and PDF previously each kept their own copy of — centralised
 * here so they can never drift.
 */
export function derivePosture(coveredSubjects: number, entriesLogged: number): Posture {
  if (coveredSubjects >= 6 && entriesLogged >= 5) return 'established';
  if (coveredSubjects >= 4 || entriesLogged >= 3) return 'building';
  return 'getting_started';
}

/** Parent-facing posture label. Never shaming — "Getting Started", not "At Risk". */
export const POSTURE_LABEL: Record<Posture, string> = {
  established: 'On Track',
  building: 'Building',
  getting_started: 'Getting Started',
};

/**
 * Gentle, number-free word for how much activity a subject shows. Used in the
 * compliance PDF in place of an entry-share "Coverage %" that read as a
 * curriculum-coverage zero for any lightly-logged subject.
 */
export function subjectActivityLabel(entryCount: number): string {
  if (entryCount <= 0) return 'Not yet logged';
  if (entryCount === 1) return 'Emerging';
  if (entryCount <= 3) return 'Developing';
  return 'Strong';
}
