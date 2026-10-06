import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { evaluateGoldenQuery as evaluate, GOLDEN_EXPECTATION_KEYS } from './golden-queries';

type TagRegistry = Record<string, { category: string }>;
const tags: TagRegistry = JSON.parse(readFileSync(resolve(process.cwd(), 'corpus/pedagogy/tags.json'), 'utf8'));
const fixture = JSON.parse(readFileSync(resolve(process.cwd(), 'scripts/data/pkb-golden-queries.json'), 'utf8')) as {
  queries: Array<{ id: string; pedagogyKey: string; situationalSignals?: string[]; expect: Record<string, unknown> }>;
};

describe('pkb golden queries fixture', () => {
  it('has unique ids and only registered situational signals', () => {
    const ids = fixture.queries.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    const unknown = fixture.queries.flatMap((q) => (q.situationalSignals ?? []).filter((s) => !tags[s]).map((s) => `${q.id}:${s}`));
    expect(unknown).toEqual([]);
  });

  it('never pins document ids (framework/layer-level expectations only)', () => {
    for (const q of fixture.queries) {
      expect(Object.keys(q.expect).every((k) => (GOLDEN_EXPECTATION_KEYS as readonly string[]).includes(k))).toBe(true);
    }
  });
});

describe('evaluate', () => {
  const chunk = (id: string, layer: string, pedagogyKey: string) => ({ id, layer, pedagogyKey, text: '', metadata: {}, similarityScore: 0.8, matchReasons: [] as string[] });
  const res = (chunks: ReturnType<typeof chunk>[]) => ({ chunks, totalMatched: chunks.length, retrievalLatencyMs: 5, fallbackUsed: false });

  it('passes when every expectation is met', () => {
    const v = evaluate(
      { id: 'q', pedagogyKey: 'montessori', text: '', expect: { minChunks: 2, layersInclude: ['worked_example'], frameworksOnly: ['montessori'] } },
      res([chunk('a', 'worked_example', 'montessori'), chunk('b', 'source_excerpt', 'montessori')]),
    );
    expect(v.passed).toBe(true);
  });

  it('names each failed expectation', () => {
    const v = evaluate(
      { id: 'q', pedagogyKey: 'eclectic', text: '', expect: { minChunks: 3, layersInclude: ['contraindication'], minFrameworks: 2 } },
      res([chunk('a', 'source_excerpt', 'charlotte_mason')]),
    );
    expect(v.passed).toBe(false);
    expect(v.failures).toEqual([
      'expected ≥3 chunks, got 1',
      'expected a contraindication chunk in the top 1',
      'expected ≥2 frameworks, got 1',
    ]);
  });

  it('flags a framework outside frameworksOnly and carries the optional marker', () => {
    const v = evaluate(
      { id: 'q', pedagogyKey: 'classical', optional: true, text: '', expect: { frameworksOnly: ['classical'] } },
      res([chunk('a', 'source_excerpt', 'charlotte_mason')]),
    );
    expect(v.optional).toBe(true);
    expect(v.failures).toEqual(['unexpected framework charlotte_mason']);
  });
});
