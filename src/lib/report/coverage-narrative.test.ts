import { describe, it, expect } from 'vitest';
import {
  buildCoverageNarrative,
  type CoverageResponse,
  type NarrativeEntry,
} from './coverage-narrative';
import type { DeterministicCoverage, SubjectCoverage } from './deterministic-coverage';

// The report screen's canonical subject order.
const SUBJECTS = ['english', 'mathematics', 'science', 'hass', 'arts', 'technologies', 'hpe', 'languages'];

function entry(over: Partial<NarrativeEntry> = {}): NarrativeEntry {
  return { subjects: null, evidenceUrls: null, aiEnrichment: null, ...over };
}

function subjectCoverage(over: Partial<SubjectCoverage> = {}): SubjectCoverage {
  return { codes: [], weightedScore: 0, byContribution: { primary: 0, partial: 0, incidental: 0 }, ...over };
}

function emptyCoverage(): DeterministicCoverage {
  const c: DeterministicCoverage = {};
  for (const s of SUBJECTS) c[s] = subjectCoverage();
  return c;
}

function deterministic(
  per: Record<string, SubjectCoverage>,
  signals: { countingDloCount: number; mappedCountingDloCount: number; mappedSubjectCount: number },
): CoverageResponse {
  return { mode: 'deterministic', coverage: { ...emptyCoverage(), ...per }, signals };
}

describe('buildCoverageNarrative — activity (the counter-weight)', () => {
  it('counts entries, distinct subjects, evidence items and threads — never a percentage', () => {
    const entries: NarrativeEntry[] = [
      entry({
        subjects: ['english'],
        evidenceUrls: ['a.jpg', 'b.jpg'],
        aiEnrichment: { capability_threads: [{ thread_id: 'L3' }, { thread_id: 'L9' }] },
      }),
      entry({
        subjects: ['mathematics'],
        evidenceUrls: ['c.jpg'],
        aiEnrichment: { subjects_detected: ['Science'], capability_threads: [{ thread_id: 'L3' }] },
      }),
    ];
    const n = buildCoverageNarrative({ entries, coverage: null, confirmedWorkSamples: 3, subjectKeys: SUBJECTS });
    expect(n.activity).toEqual({
      entriesLogged: 2,
      subjectsTouched: 3, // english, mathematics, science (case-folded from subjects_detected)
      evidenceItems: 3,
      confirmedWorkSamples: 3,
      threadsObserved: 2, // L3 deduped across both entries, plus L9
    });
  });
});

describe('buildCoverageNarrative — states', () => {
  it('pre_log when nothing is logged', () => {
    const n = buildCoverageNarrative({ entries: [], coverage: null, confirmedWorkSamples: 0, subjectKeys: SUBJECTS });
    expect(n.state).toBe('pre_log');
    expect(n.formal.available).toBe(false);
  });

  it('observed when there is activity but no deterministic coverage (fallback / learning-area tier)', () => {
    // Mei-Lin (NSW): no deterministic mode, but her log carries real signal.
    const entries = [
      entry({
        subjects: ['english'],
        aiEnrichment: { curriculum_descriptors: [{ code: 'AC9E2LY05' }] },
      }),
    ];
    const n = buildCoverageNarrative({ entries, coverage: { mode: 'fallback' }, confirmedWorkSamples: 0, subjectKeys: SUBJECTS });
    expect(n.state).toBe('observed');
    expect(n.formal.available).toBe(false);
    // The LLM descriptor surfaces as an observed area (nothing formal to subtract).
    expect(n.observedAreas).toEqual([{ subject: 'english', codeCount: 1 }]);
  });

  it('mapped when ≥1 subject scored — the happy path', () => {
    const entries = [entry({ subjects: ['mathematics'] })];
    const coverage = deterministic(
      { mathematics: subjectCoverage({ codes: ['AC9M3N01'], weightedScore: 1 }) },
      { countingDloCount: 1, mappedCountingDloCount: 1, mappedSubjectCount: 1 },
    );
    const n = buildCoverageNarrative({ entries, coverage, confirmedWorkSamples: 0, subjectKeys: SUBJECTS });
    expect(n.state).toBe('mapped');
    expect(n.formal).toEqual({ available: true, mappedSubjects: ['mathematics'], mappedCodeCount: 1 });
  });

  it('mapping_gap (class A) when evidence sits at the bar but on unmapped threads', () => {
    // Fox-Lewer: demonstrating gross motor, zero formal coverage.
    const entries = [entry({ subjects: ['hpe'] })];
    const coverage = deterministic({}, { countingDloCount: 3, mappedCountingDloCount: 0, mappedSubjectCount: 0 });
    const n = buildCoverageNarrative({ entries, coverage, confirmedWorkSamples: 0, subjectKeys: SUBJECTS });
    expect(n.state).toBe('mapping_gap');
    expect(n.formal.mappedSubjects).toEqual([]);
  });

  it('emerging (class B) when nothing has reached the developing bar yet', () => {
    // Barkley: logged on mapped threads but none promoted to developing.
    const entries = [entry({ subjects: ['english'] })];
    const coverage = deterministic({}, { countingDloCount: 0, mappedCountingDloCount: 0, mappedSubjectCount: 0 });
    const n = buildCoverageNarrative({ entries, coverage, confirmedWorkSamples: 0, subjectKeys: SUBJECTS });
    expect(n.state).toBe('emerging');
  });
});

describe('buildCoverageNarrative — observed areas stay distinct from the formal count', () => {
  it('subtracts codes already claimed by the formal set so the two never overlap', () => {
    const entries = [
      entry({
        aiEnrichment: {
          curriculum_descriptors: [
            { code: 'AC9M3N01' }, // already in the formal maths set → excluded
            { code: 'AC9S5N03' }, // science, not formally mapped → surfaces
            { code: 'AC9HP1K01' }, // hpe, not formally mapped → surfaces
          ],
        },
      }),
    ];
    const coverage = deterministic(
      { mathematics: subjectCoverage({ codes: ['AC9M3N01'], weightedScore: 1 }) },
      { countingDloCount: 1, mappedCountingDloCount: 1, mappedSubjectCount: 1 },
    );
    const n = buildCoverageNarrative({ entries, coverage, confirmedWorkSamples: 0, subjectKeys: SUBJECTS });
    // Maths is formally mapped, so it must NOT also appear as "observed".
    expect(n.observedAreas).toEqual([
      { subject: 'science', codeCount: 1 },
      { subject: 'hpe', codeCount: 1 },
    ]);
    expect(n.formal.mappedSubjects).toEqual(['mathematics']);
  });

  it('orders observed areas by the canonical subject order, deduping codes per subject', () => {
    const entries = [
      entry({ aiEnrichment: { curriculum_descriptors: [{ code: 'AC9HP1K01' }, { code: 'AC9HP1K01' }] } }),
      entry({ aiEnrichment: { curriculum_descriptors: [{ code: 'AC9E2LY05' }] } }),
    ];
    const n = buildCoverageNarrative({ entries, coverage: { mode: 'fallback' }, confirmedWorkSamples: 0, subjectKeys: SUBJECTS });
    // english precedes hpe in SUBJECTS; the duplicated hpe code counts once.
    expect(n.observedAreas).toEqual([
      { subject: 'english', codeCount: 1 },
      { subject: 'hpe', codeCount: 1 },
    ]);
  });
});
