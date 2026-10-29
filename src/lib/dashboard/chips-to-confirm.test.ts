import { describe, expect, it } from 'vitest';
import type { AiEnrichment } from '@/types/enrichment';
import { buildChipsToConfirm, type ChipsEntryInput } from './chips-to-confirm';

const enrichment = (dlos: string[], named: string[] = []): AiEnrichment =>
  ({
    status: 'enriched',
    capability_threads: [],
    per_child_signals: Object.fromEntries(named.map((n) => [n, {}])),
    discrete_learning_objectives: dlos.map((dlo_id) => ({ dlo_id, tier: dlo_id.split('.').pop(), confidence: 0.8 })),
  }) as unknown as AiEnrichment;

const sam = { id: 'sam', name: 'Sam', colourToken: 'sage' };
const ivy = { id: 'ivy', name: 'Ivy', colourToken: 'rose' };

const entry = (id: string, over: Partial<ChipsEntryInput> = {}): ChipsEntryInput => ({
  id,
  title: `Moment ${id}`,
  dateOccurred: '2026-10-25',
  learnerIds: ['sam'],
  aiEnrichment: enrichment(['dlo.M1.emerging']),
  ...over,
});

describe('buildChipsToConfirm', () => {
  it('lists proposed chips the parent has not confirmed', () => {
    const out = buildChipsToConfirm([entry('e1')], [sam, ivy], new Set());
    expect(out).toHaveLength(1);
    expect(out[0].proposals.map((p) => p.key)).toEqual(['sam:dlo.M1.emerging']);
  });

  it('drops chips already confirmed, and the entry when nothing is left', () => {
    expect(buildChipsToConfirm([entry('e1')], [sam], new Set(['sam:dlo.M1.emerging']))).toEqual([]);
  });

  it('skips unenriched entries and entries for unknown learners', () => {
    expect(
      buildChipsToConfirm(
        [entry('e1', { aiEnrichment: null }), entry('e2', { learnerIds: ['ghost'] })],
        [sam],
        new Set(),
      ),
    ).toEqual([]);
  });

  it('keeps D-OS2 attribution and H6 suppression from deriveProposals', () => {
    const out = buildChipsToConfirm(
      [entry('e1', { learnerIds: ['sam', 'ivy'], aiEnrichment: enrichment(['dlo.M1.emerging', 'dlo.H6.emerging'], ['ivy']) })],
      [sam, ivy],
      new Set(),
    );
    expect(out[0].proposals.map((p) => p.key)).toEqual(['ivy:dlo.M1.emerging']);
  });

  it('does not repeat a chip under an older moment, and caps the number of moments', () => {
    const out = buildChipsToConfirm(
      [
        entry('e1'),
        entry('e2'),
        entry('e3', { aiEnrichment: enrichment(['dlo.L1.emerging']) }),
        entry('e4', { aiEnrichment: enrichment(['dlo.L2.emerging']) }),
      ],
      [sam],
      new Set(),
    );
    expect(out.map((e) => e.entryId)).toEqual(['e1', 'e3']);
  });
});
