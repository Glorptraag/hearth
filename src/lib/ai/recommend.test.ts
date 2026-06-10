/**
 * Recommend scoring tests — especially the Q10 invariant:
 *   pedagogy is additive, never a filter. A book-heavy Charlotte Mason
 *   module with strong spark/gap signal must still surface to a Montessori
 *   family — the pedagogy weight just doesn't boost it.
 */
import { describe, it, expect } from 'vitest';
import { scoreModules, summariseReasonDistribution, type ScoringModule, type PedagogyContext } from './recommend';
import type { ChildSnapshot, SnapshotRecommendation } from '@/types/snapshot';

function makeChild(overrides: Partial<ChildSnapshot> = {}): ChildSnapshot {
  return {
    learner_id: 'child-1',
    name: 'Maya',
    curriculum_coverage: { english: 0, mathematics: 0, science: 0, hass: 0, arts: 0, technologies: 0, hpe: 0, languages: 0 },
    active_threads: [],
    badge_thresholds: [],
    recent_activity: {
      entries_last_7_days: 0,
      entries_last_30_days: 0,
      subjects_this_week: [],
      current_sparks: [],
    },
    gap_analysis: {
      underserved_subjects: [],
      suggested_focus_threads: [],
    },
    monthly_narrative: null,
    dlo_status: { emerging: 0, developing: 0, demonstrating: 0 },
    ...overrides,
  } as ChildSnapshot;
}

const baseModule = (overrides: Partial<ScoringModule> = {}): ScoringModule => ({
  _id: 'mod-default',
  title: 'Default module',
  subjects: [],
  capabilityThreadIds: [],
  averageEnergyLevel: 'moderate',
  methodAffinity: null,
  ...overrides,
});

describe('scoreModules — pedagogy weight (Phase 3 / Q10)', () => {
  it('boosts a pedagogy-tagged module when a pedagogyContext is given', () => {
    const child = makeChild();
    const cmModule = baseModule({
      _id: 'mod-cm-books',
      title: 'Living Books — Plutarch',
      methodAffinity: { pedagogies: ['charlotte_mason'], interpretivePatterns: [] },
    });
    const neutralModule = baseModule({ _id: 'mod-neutral', title: 'Generic activity' });

    const ctx: PedagogyContext = { pedagogyKey: 'charlotte_mason', values: [], practices: [] };
    const ranked = scoreModules(
      [cmModule, neutralModule],
      { 'child-1': child },
      [],
      {},
      new Set(),
      ctx,
    );

    const cm = ranked.find((r) => r.module_id === 'mod-cm-books');
    const neutral = ranked.find((r) => r.module_id === 'mod-neutral');
    expect(cm).toBeDefined();
    expect(neutral).toBeDefined();
    // CM module should outrank the neutral one purely on pedagogy contribution.
    expect((cm?.priority_score ?? 0)).toBeGreaterThan(neutral?.priority_score ?? 0);
    expect(cm?.primary_reason).toBe('pedagogy_match');
  });

  it('Q10 invariant: book-heavy CM module with strong spark/gap still surfaces to a Montessori family', () => {
    const sparkThread = 'thread-reading';
    const gapSubject = 'english';

    const child = makeChild({
      recent_activity: {
        entries_last_7_days: 0,
        entries_last_30_days: 0,
        subjects_this_week: [],
        current_sparks: [{ name: sparkThread, count: 5 }],
      },
      gap_analysis: {
        underserved_subjects: [gapSubject],
        suggested_focus_threads: [sparkThread],
      },
    });

    // The CM module: NOT tagged for Montessori. But it covers Maya's spark
    // thread AND the underserved English subject. High intrinsic merit.
    const cmModule = baseModule({
      _id: 'mod-cm',
      title: 'Living Books — Tom Sawyer',
      subjects: [gapSubject],
      capabilityThreadIds: [sparkThread],
      methodAffinity: { pedagogies: ['charlotte_mason'], interpretivePatterns: [] },
    });

    // A Montessori-tagged module that has NO spark/gap signal. Pedagogy match
    // would be its only contribution; we expect spark+gap on the CM module
    // to outweigh that.
    const montessoriModule = baseModule({
      _id: 'mod-montessori-blank',
      title: 'Practical Life Tray',
      subjects: [],
      capabilityThreadIds: [],
      methodAffinity: { pedagogies: ['montessori'], interpretivePatterns: [] },
    });

    const ctx: PedagogyContext = { pedagogyKey: 'montessori', values: [], practices: [] };
    const ranked = scoreModules(
      [cmModule, montessoriModule],
      { 'child-1': child },
      [],
      {},
      new Set(),
      ctx,
    );

    const cmIdx = ranked.findIndex((r) => r.module_id === 'mod-cm');
    const montIdx = ranked.findIndex((r) => r.module_id === 'mod-montessori-blank');

    // Both surface — pedagogy never gates.
    expect(cmIdx).toBeGreaterThanOrEqual(0);
    expect(montIdx).toBeGreaterThanOrEqual(0);

    // The high-signal CM module ranks ABOVE the pedagogy-matched-but-empty one.
    expect(cmIdx).toBeLessThan(montIdx);

    // And its primary reason reflects its merit, not the pedagogy mismatch.
    expect(ranked[cmIdx].primary_reason === 'spark_match' || ranked[cmIdx].primary_reason === 'gap_fill').toBe(true);
  });

  it('omitting pedagogyContext leaves spark-weight intact (W_PEDAGOGY rerouted to spark)', () => {
    const child = makeChild({
      recent_activity: {
        entries_last_7_days: 0,
        entries_last_30_days: 0,
        subjects_this_week: [],
        current_sparks: [{ name: 'thread-x', count: 3 }],
      },
      gap_analysis: { underserved_subjects: [], suggested_focus_threads: [] },
    });
    const mod = baseModule({
      _id: 'mod-x',
      title: 'Module X',
      capabilityThreadIds: ['thread-x'],
    });

    // Score with and without pedagogy context — same spark, no methodAffinity.
    const noCtx = scoreModules([mod], { 'child-1': child }, [], {}, new Set());
    const withCtx = scoreModules([mod], { 'child-1': child }, [], {}, new Set(), {
      pedagogyKey: 'eclectic',
      values: [],
      practices: [],
    });

    // Without ctx, pedagogy weight folds back into spark, so the module's
    // ranking shape is preserved for pre-pedagogy callers.
    expect(noCtx[0].priority_score).toBeGreaterThanOrEqual(withCtx[0].priority_score);
  });

  it('emits a pedagogy_match reason text that names the family pedagogy', () => {
    const child = makeChild();
    const mod = baseModule({
      _id: 'mod-cm',
      title: 'CM Module',
      methodAffinity: { pedagogies: ['charlotte_mason'] },
    });
    const ctx: PedagogyContext = { pedagogyKey: 'charlotte_mason', values: [], practices: [] };
    const ranked = scoreModules([mod], { 'child-1': child }, [], {}, new Set(), ctx);
    expect(ranked[0].reason_text).toMatch(/charlotte mason/i);
  });
});

describe('summariseReasonDistribution', () => {
  function makeRec(overrides: Partial<SnapshotRecommendation> = {}): SnapshotRecommendation {
    return {
      module_id: 'mod-1',
      module_title: 'Test',
      priority_score: 0.5,
      primary_reason: 'spark_match',
      reason_text: 'Builds on interest',
      target_learner_ids: [],
      ...overrides,
    };
  }

  it('returns zero counts and default top_reason for empty list', () => {
    const d = summariseReasonDistribution([]);
    expect(d.rec_count).toBe(0);
    expect(d.spark_match_count).toBe(0);
    expect(d.top_score).toBe(0);
    expect(d.top_reason).toBe('spark_match');
  });

  it('counts each reason correctly', () => {
    const recs = [
      makeRec({ primary_reason: 'spark_match', priority_score: 0.9 }),
      makeRec({ primary_reason: 'gap_fill', priority_score: 0.7 }),
      makeRec({ primary_reason: 'gap_fill', priority_score: 0.6 }),
      makeRec({ primary_reason: 'pedagogy_match', priority_score: 0.5 }),
    ];
    const d = summariseReasonDistribution(recs);
    expect(d.rec_count).toBe(4);
    expect(d.spark_match_count).toBe(1);
    expect(d.gap_fill_count).toBe(2);
    expect(d.pedagogy_match_count).toBe(1);
    expect(d.repeat_value_count).toBe(0);
    expect(d.energy_match_count).toBe(0);
  });

  it('top_reason is the most frequent reason', () => {
    const recs = [
      makeRec({ primary_reason: 'gap_fill' }),
      makeRec({ primary_reason: 'gap_fill' }),
      makeRec({ primary_reason: 'spark_match' }),
    ];
    expect(summariseReasonDistribution(recs).top_reason).toBe('gap_fill');
  });

  it('top_score is the priority_score of the first rec (sorted desc)', () => {
    const recs = [
      makeRec({ priority_score: 0.85 }),
      makeRec({ priority_score: 0.60 }),
    ];
    expect(summariseReasonDistribution(recs).top_score).toBe(0.85);
  });
});
