import { describe, it, expect } from 'vitest';
import { scoreCompleteness, canSaveEntry, GUIDED_THRESHOLD, QUICK_THRESHOLD } from '@/lib/logger/completeness';

// DETAIL_CHIPS must match the keys in ObservationChipDetail. We import it
// indirectly via scoreCompleteness — the function closes over it internally.

type Input = Parameters<typeof scoreCompleteness>[0];

const BASE: Input = {
  selectedLearners: ['l1'],
  description: 'We went for a nature walk and observed tadpoles in the pond for a while.',
  activityType: 'nature',
  engagement: { l1: 3 },
  discoveries: { l1: 'She noticed the tadpoles had legs forming already.' },
  observations: ['Deeply focused'],
  observationDetails: {
    'Deeply focused': { detail: 'Watched the pond for 20 minutes without prompting.', durationMin: 20 },
  },
  duration: '~30 min',
  location: 'outdoors',
  evidence: [],
  mode: 'guided',
};

// ─── Threshold constants ──────────────────────────────────────────────────────

describe('threshold constants', () => {
  it('GUIDED_THRESHOLD is 65', () => expect(GUIDED_THRESHOLD).toBe(65));
  it('QUICK_THRESHOLD is 50', () => expect(QUICK_THRESHOLD).toBe(50));
});

// ─── canSaveEntry ─────────────────────────────────────────────────────────────

describe('canSaveEntry', () => {
  it('Quick: allows at 50', () => expect(canSaveEntry(50, 'quick')).toBe(true));
  it('Quick: blocks at 49', () => expect(canSaveEntry(49, 'quick')).toBe(false));
  it('Guided: allows at 65', () => expect(canSaveEntry(65, 'guided')).toBe(true));
  it('Guided: blocks at 64', () => expect(canSaveEntry(64, 'guided')).toBe(false));
});

// ─── Quick Mode — baseline scoring ───────────────────────────────────────────

describe('scoreCompleteness — Quick Mode', () => {
  it('full baseline clears 50', () => {
    const score = scoreCompleteness({ ...BASE, mode: 'quick' });
    expect(score).toBeGreaterThanOrEqual(50);
  });

  it('no learners → lower score than with learners', () => {
    const withLearners = scoreCompleteness({ ...BASE, mode: 'quick' });
    const noLearners = scoreCompleteness({ ...BASE, mode: 'quick', selectedLearners: [] });
    // Learner presence contributes 20pts + engagement + discovery gates
    expect(noLearners).toBeLessThan(withLearners);
    // Engagement and discovery gates are skipped when no learners
    expect(noLearners).toBeLessThan(50);
  });

  it('caps at 100', () => {
    const score = scoreCompleteness({
      ...BASE,
      mode: 'quick',
      description: 'A'.repeat(21),
      observations: ['a', 'b', 'c'],
      evidence: [{}, {}],
      duration: '1 hr+',
      location: 'home',
    });
    expect(score).toBeLessThanOrEqual(100);
  });

  it('guided bonus gates do NOT fire in quick mode', () => {
    const quick = scoreCompleteness({ ...BASE, mode: 'quick' });
    const guided = scoreCompleteness({ ...BASE, mode: 'guided' });
    // Guided with full detail should score >= quick (bonus gates add points)
    expect(guided).toBeGreaterThanOrEqual(quick);
  });
});

// ─── Guided Mode gate — boundary at 65 ───────────────────────────────────────

describe('scoreCompleteness — Guided Mode gate at 65', () => {
  it('well-formed guided entry clears 65', () => {
    const score = scoreCompleteness({ ...BASE, mode: 'guided' });
    expect(score).toBeGreaterThanOrEqual(65);
  });

  it('missing activity type reduces score (Guided penalises)', () => {
    const with_ = scoreCompleteness({ ...BASE, mode: 'guided' });
    const without = scoreCompleteness({ ...BASE, mode: 'guided', activityType: null });
    expect(without).toBeLessThan(with_);
  });

  it('no chip detail filled → detail bonus not awarded', () => {
    const with_ = scoreCompleteness({ ...BASE, mode: 'guided' });
    const without = scoreCompleteness({ ...BASE, mode: 'guided', observationDetails: {} });
    expect(without).toBeLessThan(with_);
  });

  it('deep discovery ≥20 chars on rated child → discovery bonus awarded', () => {
    const with_ = scoreCompleteness({
      ...BASE,
      mode: 'guided',
      discoveries: { l1: 'She noticed the tadpoles had fully formed back legs.' }, // ≥20 chars
    });
    const without = scoreCompleteness({
      ...BASE,
      mode: 'guided',
      discoveries: { l1: 'cool.' }, // <20 chars
    });
    expect(with_).toBeGreaterThan(without);
  });

  it('thin entry stays below 65 when activity + detail + deep discovery all missing', () => {
    const score = scoreCompleteness({
      ...BASE,
      mode: 'guided',
      activityType: null,           // penalty applied
      observationDetails: {},       // no detail bonus
      discoveries: { l1: 'ok' },   // <20 chars, no discovery bonus
    });
    expect(score).toBeLessThan(65);
  });

  it('multi-learner: 1-in-4 rule — 4 rated learners require at least 1 with ≥20 char discovery', () => {
    const fourLearners = ['l1', 'l2', 'l3', 'l4'];
    const base4: Input = {
      ...BASE,
      selectedLearners: fourLearners,
      engagement: { l1: 3, l2: 2, l3: 3, l4: 2 },
      discoveries: {
        l1: 'She noticed the tadpoles had legs forming already.', // ≥20
        l2: 'ok', l3: 'ok', l4: 'ok',
      },
      mode: 'guided',
    };
    const withBonus = scoreCompleteness(base4);
    const withoutBonus = scoreCompleteness({
      ...base4,
      discoveries: { l1: 'ok', l2: 'ok', l3: 'ok', l4: 'ok' }, // none ≥20
    });
    expect(withBonus).toBeGreaterThan(withoutBonus);
  });
});
