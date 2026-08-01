import { describe, expect, it } from 'vitest';
import { selectEclectic, type RankedCandidate } from './retrieval';

let idCounter = 0;

function candidate(overrides: Partial<RankedCandidate> = {}): RankedCandidate {
  idCounter += 1;
  return {
    id: `chunk-${idCounter}`,
    pedagogyKey: 'charlotte_mason',
    layer: 'source_excerpt',
    text: 'some reference text',
    metadata: {},
    rawScore: 0.5,
    adjustedScore: 0.5,
    matchReasons: [],
    ...overrides,
  };
}

describe('selectEclectic', () => {
  it('guarantees a contraindication when one exists, tagging it with the tension reason', () => {
    const candidates: RankedCandidate[] = [
      candidate({ pedagogyKey: 'charlotte_mason', layer: 'source_excerpt', adjustedScore: 0.9 }),
      candidate({ pedagogyKey: 'classical', layer: 'source_excerpt', adjustedScore: 0.85 }),
      candidate({ pedagogyKey: 'montessori', layer: 'practice_pattern', adjustedScore: 0.8 }),
      candidate({ pedagogyKey: 'waldorf_steiner', layer: 'worked_example', adjustedScore: 0.75 }),
      candidate({ pedagogyKey: 'unschooling', layer: 'contraindication', adjustedScore: 0.1 }),
    ];

    const selected = selectEclectic(candidates, 8);

    const contraindication = selected.find((c) => c.layer === 'contraindication');
    expect(contraindication).toBeDefined();
    expect(contraindication?.pedagogyKey).toBe('unschooling');
    expect(contraindication?.matchReasons).toContain('tension surfacing (contraindication)');
  });

  it('degrades gracefully when no contraindication is present in the candidate pool', () => {
    const candidates: RankedCandidate[] = [
      candidate({ pedagogyKey: 'charlotte_mason', layer: 'source_excerpt', adjustedScore: 0.9 }),
      candidate({ pedagogyKey: 'classical', layer: 'source_excerpt', adjustedScore: 0.85 }),
      candidate({ pedagogyKey: 'montessori', layer: 'practice_pattern', adjustedScore: 0.8 }),
      candidate({ pedagogyKey: 'waldorf_steiner', layer: 'worked_example', adjustedScore: 0.75 }),
    ];

    const selected = selectEclectic(candidates, 8);

    expect(selected.some((c) => c.layer === 'contraindication')).toBe(false);
    expect(selected.length).toBe(4);
  });

  it('enforces the per-framework cap even when one framework dominates the score order', () => {
    const dominant = Array.from({ length: 10 }, (_, i) =>
      candidate({
        pedagogyKey: 'charlotte_mason',
        layer: i % 2 === 0 ? 'source_excerpt' : 'practice_pattern',
        adjustedScore: 1 - i * 0.01,
      })
    );
    // Enough non-CM candidates that the cap alone (without relaxation) can
    // still fill topN — this isolates the cap-enforcement behaviour from the
    // separate relaxation behaviour covered by the next test.
    const others = [
      candidate({ pedagogyKey: 'classical', layer: 'source_excerpt', adjustedScore: 0.5 }),
      candidate({ pedagogyKey: 'montessori', layer: 'worked_example', adjustedScore: 0.4 }),
      candidate({ pedagogyKey: 'waldorf_steiner', layer: 'source_excerpt', adjustedScore: 0.35 }),
      candidate({ pedagogyKey: 'unschooling', layer: 'contraindication', adjustedScore: 0.3 }),
      candidate({ pedagogyKey: 'classical', layer: 'practice_pattern', adjustedScore: 0.2 }),
    ];

    const selected = selectEclectic([...dominant, ...others], 8, 3);

    const cmCount = selected.filter((c) => c.pedagogyKey === 'charlotte_mason').length;
    expect(cmCount).toBeLessThanOrEqual(3);
    expect(selected.length).toBe(8);
  });

  it('relaxes the cap to fill topN when one framework dominates the whole pool', () => {
    const onlyCm = Array.from({ length: 6 }, (_, i) =>
      candidate({
        pedagogyKey: 'charlotte_mason',
        layer: i === 0 ? 'source_excerpt' : i === 1 ? 'practice_pattern' : 'source_excerpt',
        adjustedScore: 1 - i * 0.01,
      })
    );

    const selected = selectEclectic(onlyCm, 5, 3);

    expect(selected.length).toBe(5);
    expect(selected.every((c) => c.pedagogyKey === 'charlotte_mason')).toBe(true);
  });

  it('returns the final selection sorted by adjusted score descending', () => {
    const candidates: RankedCandidate[] = [
      candidate({ pedagogyKey: 'charlotte_mason', layer: 'source_excerpt', adjustedScore: 0.3 }),
      candidate({ pedagogyKey: 'classical', layer: 'source_excerpt', adjustedScore: 0.95 }),
      candidate({ pedagogyKey: 'montessori', layer: 'practice_pattern', adjustedScore: 0.6 }),
      candidate({ pedagogyKey: 'waldorf_steiner', layer: 'worked_example', adjustedScore: 0.7 }),
      candidate({ pedagogyKey: 'unschooling', layer: 'contraindication', adjustedScore: 0.2 }),
    ];

    const selected = selectEclectic(candidates, 8);

    const scores = selected.map((c) => c.adjustedScore);
    const sortedScores = [...scores].sort((a, b) => b - a);
    expect(scores).toEqual(sortedScores);
  });

  it('slices the final result to topN', () => {
    const candidates: RankedCandidate[] = Array.from({ length: 20 }, (_, i) =>
      candidate({
        pedagogyKey: ['charlotte_mason', 'classical', 'montessori', 'waldorf_steiner', 'unschooling'][i % 5],
        layer: 'source_excerpt',
        adjustedScore: 1 - i * 0.01,
      })
    );

    const selected = selectEclectic(candidates, 8);

    expect(selected.length).toBe(8);
  });
});
