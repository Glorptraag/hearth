/**
 * Unit tests for gateLearnersByNamedSignals — the D-OS2 per-learner attribution
 * gate. DLO evidence must attach ONLY to the learner(s) the enrichment named in
 * per_child_signals; a multi-child entry never copies an objective to siblings
 * the enrichment didn't name.
 *
 * @/lib/db is mocked because dlo-persistence.ts imports it at module load; the
 * gate itself is pure and touches neither the DB nor the Sanity cache.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: {} }));

import { gateLearnersByNamedSignals } from '../dlo-persistence';

const signal = () => ({ engagement_score: 0.8, complexity_level: 'developing' as const, notable: null });

describe('gateLearnersByNamedSignals', () => {
  it('multi-child entry, only one child named → only that child is attributed', () => {
    const lily = { id: 'learner-lily', name: 'Lily' };
    const jake = { id: 'learner-jake', name: 'Jake' };
    const out = gateLearnersByNamedSignals({
      learners: [lily, jake],
      perChildSignals: { Lily: signal() },
    });
    expect(out).toEqual(['learner-lily']);
    // The unnamed sibling gets nothing.
    expect(out).not.toContain('learner-jake');
  });

  it('multi-child entry, nobody named → nobody attributed (never copy-to-all)', () => {
    const out = gateLearnersByNamedSignals({
      learners: [
        { id: 'a', name: 'Ada' },
        { id: 'b', name: 'Ben' },
      ],
      perChildSignals: {},
    });
    expect(out).toEqual([]);
  });

  it('multi-child entry, all children named → all attributed', () => {
    const out = gateLearnersByNamedSignals({
      learners: [
        { id: 'a', name: 'Ada' },
        { id: 'b', name: 'Ben' },
      ],
      perChildSignals: { Ada: signal(), Ben: signal() },
    });
    expect(out).toEqual(['a', 'b']);
  });

  it('single-child entry with empty signals → the lone child is attributed (gate is a no-op)', () => {
    const out = gateLearnersByNamedSignals({
      learners: [{ id: 'solo', name: 'Mira' }],
      perChildSignals: {},
    });
    expect(out).toEqual(['solo']);
  });

  it('single-child entry with null/undefined signals → still attributes the lone child', () => {
    expect(
      gateLearnersByNamedSignals({ learners: [{ id: 'solo', name: 'Mira' }], perChildSignals: null }),
    ).toEqual(['solo']);
    expect(
      gateLearnersByNamedSignals({ learners: [{ id: 'solo', name: 'Mira' }], perChildSignals: undefined }),
    ).toEqual(['solo']);
  });

  it('no learners on the entry → empty result', () => {
    expect(gateLearnersByNamedSignals({ learners: [], perChildSignals: { Lily: signal() } })).toEqual([]);
  });

  it('matches names case-insensitively and trims whitespace', () => {
    const out = gateLearnersByNamedSignals({
      learners: [
        { id: 'a', name: 'Ada' },
        { id: 'b', name: 'Ben' },
      ],
      perChildSignals: { '  ada  ': signal() },
    });
    expect(out).toEqual(['a']);
  });

  it('ignores signal names that are not learners on the entry', () => {
    const out = gateLearnersByNamedSignals({
      learners: [
        { id: 'a', name: 'Ada' },
        { id: 'b', name: 'Ben' },
      ],
      // Charlie isn't on the entry; Ada is the only valid named learner.
      perChildSignals: { Ada: signal(), Charlie: signal() },
    });
    expect(out).toEqual(['a']);
  });
});
