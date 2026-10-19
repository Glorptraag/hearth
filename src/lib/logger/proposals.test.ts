/**
 * Unit tests for the Confirm surface's chip derivation (`deriveProposals`) and
 * its D-OS2 client mirror (`attributedLearnerIds`). The parity block imports
 * the REAL server gate (`gateLearnersByNamedSignals`) with `@/lib/db` mocked —
 * the same seam `src/lib/ai/__tests__/dlo-attribution.test.ts` uses — so the
 * client mirror can never silently drift from what the server persists.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: {} }));

import { gateLearnersByNamedSignals } from '@/lib/ai/dlo-persistence';
import { getThreadName } from '@/lib/capability-threads';
import type { AiEnrichment, DloEnrichmentItem } from '@/types/enrichment';
import {
  attributedLearnerIds,
  deriveProposals,
  isEnriched,
  nobodyNamed,
  type ProposalLearner,
} from './proposals';

const signal = () => ({ engagement_score: 0.8, complexity_level: 'developing' as const, notable: null });

const dlo = (dlo_id: string, confidence = 0.8): DloEnrichmentItem => ({
  dlo_id,
  tier: 'developing',
  confidence,
});

function enriched(
  dlos: DloEnrichmentItem[],
  perChild: Record<string, ReturnType<typeof signal>> = {},
): AiEnrichment {
  return {
    status: 'enriched',
    capability_threads: [],
    per_child_signals: perChild,
    discrete_learning_objectives: dlos,
  };
}

const ada: ProposalLearner = { id: 'learner-ada', name: 'Ada', colourToken: 'sage' };
const ben: ProposalLearner = { id: 'learner-ben', name: 'Ben', colourToken: 'sky' };
const cal: ProposalLearner = { id: 'learner-cal', name: 'Cal', colourToken: null };

describe('isEnriched', () => {
  it('terminal success is enriched; pending/failed/null are not', () => {
    expect(isEnriched({ status: 'enriched' })).toBe(true);
    expect(isEnriched({ status: 'pending' })).toBe(false);
    expect(isEnriched({ status: 'failed', error: 'boom' })).toBe(false);
    expect(isEnriched(null)).toBe(false);
    expect(isEnriched(undefined)).toBe(false);
  });

  it('a legacy row with no status but populated capability_threads is treated as enriched', () => {
    expect(isEnriched({ capability_threads: [{ thread_id: 'L3', confidence: 0.7 }] })).toBe(true);
    expect(isEnriched({ capability_threads: [] })).toBe(false);
    expect(isEnriched({})).toBe(false);
  });
});

describe('deriveProposals — enrichment state', () => {
  it('pending, failed and null enrichment yield no chips', () => {
    expect(deriveProposals({ status: 'pending' }, [ada])).toEqual([]);
    expect(deriveProposals({ status: 'failed' }, [ada])).toEqual([]);
    expect(deriveProposals(null, [ada])).toEqual([]);
    expect(deriveProposals(undefined, [ada])).toEqual([]);
  });

  it('a legacy enriched row (no status, populated threads) still proposes', () => {
    const legacy: AiEnrichment = {
      capability_threads: [{ thread_id: 'M1', confidence: 0.7 }],
      discrete_learning_objectives: [dlo('dlo.M1.developing')],
    };
    expect(deriveProposals(legacy, [ada]).map((p) => p.dloId)).toEqual(['dlo.M1.developing']);
  });

  it('enriched with no DLOs yields no chips', () => {
    expect(deriveProposals(enriched([]), [ada])).toEqual([]);
    expect(deriveProposals({ status: 'enriched' }, [ada])).toEqual([]);
  });
});

describe('deriveProposals — attribution (D-OS2)', () => {
  it('single child: every usable DLO is attributed to that child, even with empty signals', () => {
    const out = deriveProposals(enriched([dlo('dlo.M1.developing'), dlo('dlo.S5.emerging')]), [ada]);
    expect(out.map((p) => [p.learnerId, p.dloId])).toEqual([
      ['learner-ada', 'dlo.M1.developing'],
      ['learner-ada', 'dlo.S5.emerging'],
    ]);
  });

  it('multi-child with one named (odd casing, whitespace) attributes only that child', () => {
    const out = deriveProposals(
      enriched([dlo('dlo.M1.developing')], { '  bEn ': signal() }),
      [ada, ben, cal],
    );
    expect(out).toHaveLength(1);
    expect(out[0].learnerId).toBe('learner-ben');
    expect(out[0].learnerName).toBe('Ben');
  });

  it('multi-child with nobody named yields [] and nobodyNamed() is true', () => {
    const e = enriched([dlo('dlo.M1.developing')], {});
    expect(deriveProposals(e, [ada, ben])).toEqual([]);
    expect(nobodyNamed(e, [ada, ben])).toBe(true);
  });

  it('multi-child where only a non-learner is named is treated as nobody named', () => {
    const e = enriched([dlo('dlo.M1.developing')], { Zed: signal() });
    expect(deriveProposals(e, [ada, ben])).toEqual([]);
    expect(nobodyNamed(e, [ada, ben])).toBe(true);
  });

  it('nobodyNamed is false for a single child, for no usable DLOs, and for pending', () => {
    expect(nobodyNamed(enriched([dlo('dlo.M1.developing')], {}), [ada])).toBe(false);
    expect(nobodyNamed(enriched([], {}), [ada, ben])).toBe(false);
    expect(nobodyNamed(enriched([dlo('dlo.H6.emerging')], {}), [ada, ben])).toBe(false);
    expect(nobodyNamed({ status: 'pending' }, [ada, ben])).toBe(false);
    expect(nobodyNamed(null, [ada, ben])).toBe(false);
  });

  it('nobodyNamed is false when at least one child is named', () => {
    expect(nobodyNamed(enriched([dlo('dlo.M1.developing')], { Ada: signal() }), [ada, ben])).toBe(false);
  });
});

describe('deriveProposals — DLO hygiene', () => {
  it('drops a DLO on the alpha-suppressed thread H6', () => {
    const out = deriveProposals(enriched([dlo('dlo.H6.emerging'), dlo('dlo.S5.developing')]), [ada]);
    expect(out.map((p) => p.dloId)).toEqual(['dlo.S5.developing']);
    expect(out.some((p) => p.threadId === 'H6')).toBe(false);
  });

  it('drops malformed ids', () => {
    const out = deriveProposals(
      enriched([dlo('M1'), dlo('dlo.M1'), dlo('dlo.M1.bogus'), dlo('dlo.M1.developing')]),
      [ada],
    );
    expect(out.map((p) => p.dloId)).toEqual(['dlo.M1.developing']);
  });

  it('collapses duplicates by dlo_id, keeping the first', () => {
    const out = deriveProposals(
      enriched([dlo('dlo.M1.developing', 0.4), dlo('dlo.M1.developing', 0.9)]),
      [ada],
    );
    expect(out).toHaveLength(1);
    expect(out[0].confidence).toBe(0.4);
  });

  it('tolerates null-ish and non-string entries in the DLO array', () => {
    const e = enriched([
      null as unknown as DloEnrichmentItem,
      { dlo_id: 42 } as unknown as DloEnrichmentItem,
      dlo('dlo.L3.emerging'),
    ]);
    expect(deriveProposals(e, [ada]).map((p) => p.dloId)).toEqual(['dlo.L3.emerging']);
  });
});

describe('deriveProposals — ordering and shape', () => {
  it('orders by confidence desc, then original order on ties', () => {
    const out = deriveProposals(
      enriched([dlo('dlo.M1.developing', 0.5), dlo('dlo.S5.emerging', 0.9), dlo('dlo.L3.emerging', 0.5)]),
      [ada],
    );
    expect(out.map((p) => p.dloId)).toEqual(['dlo.S5.emerging', 'dlo.M1.developing', 'dlo.L3.emerging']);
  });

  it('preferThreadId sorts that thread first regardless of confidence', () => {
    const out = deriveProposals(
      enriched([dlo('dlo.M1.developing', 0.5), dlo('dlo.S5.emerging', 0.9), dlo('dlo.L3.emerging', 0.7)]),
      [ada],
      { preferThreadId: 'L3' },
    );
    expect(out.map((p) => p.dloId)).toEqual(['dlo.L3.emerging', 'dlo.S5.emerging', 'dlo.M1.developing']);
  });

  it('an unknown or null preferThreadId leaves confidence ordering untouched', () => {
    const e = enriched([dlo('dlo.M1.developing', 0.5), dlo('dlo.S5.emerging', 0.9)]);
    expect(deriveProposals(e, [ada], { preferThreadId: 'PS3' }).map((p) => p.dloId)).toEqual([
      'dlo.S5.emerging',
      'dlo.M1.developing',
    ]);
    expect(deriveProposals(e, [ada], { preferThreadId: null }).map((p) => p.dloId)).toEqual([
      'dlo.S5.emerging',
      'dlo.M1.developing',
    ]);
  });

  it('groups by learner in the learners array order, each with the full ranked set', () => {
    const out = deriveProposals(
      enriched([dlo('dlo.M1.developing', 0.5), dlo('dlo.S5.emerging', 0.9)], { Ben: signal(), Ada: signal() }),
      [ada, ben, cal],
    );
    expect(out.map((p) => `${p.learnerId}:${p.dloId}`)).toEqual([
      'learner-ada:dlo.S5.emerging',
      'learner-ada:dlo.M1.developing',
      'learner-ben:dlo.S5.emerging',
      'learner-ben:dlo.M1.developing',
    ]);
  });

  it('threadName comes from getThreadName, key is learnerId:dloId, tier/thread parsed from the id', () => {
    const [p] = deriveProposals(enriched([dlo('dlo.S5.demonstrating', 0.66)]), [ben]);
    expect(p).toEqual({
      key: 'learner-ben:dlo.S5.demonstrating',
      learnerId: 'learner-ben',
      learnerName: 'Ben',
      colourToken: 'sky',
      dloId: 'dlo.S5.demonstrating',
      threadId: 'S5',
      threadName: getThreadName('S5'),
      tier: 'demonstrating',
      confidence: 0.66,
    });
    expect(p.threadName).not.toBe('S5');
  });

  it('non-numeric confidence is reported as 0', () => {
    const e = enriched([{ dlo_id: 'dlo.M1.developing', tier: 'developing', confidence: 'high' as unknown as number }]);
    expect(deriveProposals(e, [ada])[0].confidence).toBe(0);
  });
});

describe('attributedLearnerIds parity with gateLearnersByNamedSignals', () => {
  const a = { id: 'a', name: 'Ada' };
  const b = { id: 'b', name: 'Ben' };
  const c = { id: 'c', name: 'Cal' };

  const cases: Array<{
    label: string;
    learners: { id: string; name: string }[];
    signals: Record<string, unknown> | null | undefined;
  }> = [
    { label: '0 learners, one named', learners: [], signals: { Ada: signal() } },
    { label: '0 learners, null signals', learners: [], signals: null },
    { label: '1 learner, none named', learners: [a], signals: {} },
    { label: '1 learner, null signals', learners: [a], signals: null },
    { label: '1 learner, undefined signals', learners: [a], signals: undefined },
    { label: '1 learner, someone else named', learners: [a], signals: { Zed: signal() } },
    { label: '2 learners, none named', learners: [a, b], signals: {} },
    { label: '2 learners, null signals', learners: [a, b], signals: null },
    { label: '2 learners, one named', learners: [a, b], signals: { Ben: signal() } },
    { label: '2 learners, all named', learners: [a, b], signals: { Ada: signal(), Ben: signal() } },
    { label: '2 learners, odd casing + whitespace', learners: [a, b], signals: { '  aDa ': signal() } },
    { label: '2 learners, non-learner plus one learner named', learners: [a, b], signals: { Zed: signal(), ben: signal() } },
    { label: '3 learners, none named', learners: [a, b, c], signals: {} },
    { label: '3 learners, one named', learners: [a, b, c], signals: { CAL: signal() } },
    { label: '3 learners, two named', learners: [a, b, c], signals: { Ada: signal(), cal: signal() } },
    { label: '3 learners, all named with whitespace', learners: [a, b, c], signals: { ' Ada': signal(), 'Ben ': signal(), ' Cal ': signal() } },
    {
      label: '3 learners, learner names carry whitespace too',
      learners: [{ id: 'a', name: ' Ada ' }, b, c],
      signals: { ada: signal() },
    },
  ];

  it.each(cases)('$label', ({ learners, signals }) => {
    expect(attributedLearnerIds(learners, signals)).toEqual(
      gateLearnersByNamedSignals({ learners, perChildSignals: signals }),
    );
  });
});
