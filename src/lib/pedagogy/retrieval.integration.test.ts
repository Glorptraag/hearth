/**
 * INTEGRATION: pedagogy retrieval — deterministic end-to-end rerank harness.
 *
 * retrievePedagogyChunks() (the vector search + metadata rerank + selection
 * pipeline) had no direct test against a real pgvector index — only the
 * attribution pipeline test exercised it indirectly, with a single fixed
 * embedding and no coverage of the boost math, the layer-balance selection,
 * or the eclectic cross-framework spread.
 *
 * This suite seeds pedagogy_knowledge_chunks rows via insertPedagogyChunk
 * (real Postgres, real pgvector `<=>` distance) and mocks only embedText, so
 * cosine similarity is fully controlled per test via unitVector() while the
 * SQL search, rerank boosts, and selection algorithms (selectWithLayerBalance
 * / selectEclectic) run for real. Each test runs inside the shared rollback
 * transaction (vitest.integration.setup.ts), so no cleanup is needed.
 */
import { describe, it, expect, vi } from 'vitest';
import { db } from '@/lib/db';
import { insertPedagogyChunk, unitVector } from '@/test/pkb-factories';
import { embedText } from '@/lib/pedagogy/embedding';
import { retrievePedagogyChunks, type RetrievalRequest } from '@/lib/pedagogy/retrieval';

// Deterministic embedding — every call to embedText() in a test resolves to
// whatever unitVector() the test supplies via mockResolvedValueOnce, rather
// than depending on Voyage AI. EMBEDDING_DIMENSIONS is preserved via
// importOriginal so unitVector() (imported by pkb-factories) still builds
// 1024-dim vectors.
vi.mock('@/lib/pedagogy/embedding', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/pedagogy/embedding')>();
  return {
    ...actual,
    embedText: vi.fn(),
  };
});

function mockQueryEmbedding(vector: number[]): void {
  vi.mocked(embedText).mockResolvedValueOnce(vector);
}

function makeRequest(overrides: Partial<RetrievalRequest> = {}): RetrievalRequest {
  return {
    pedagogyKey: 'charlotte_mason',
    capabilityThreads: [],
    ageRange: { min: 5, max: 7 },
    situationalSignals: [],
    ...overrides,
  };
}

describe('INTEGRATION: retrievePedagogyChunks', () => {
  it('filters to the requested framework only', async () => {
    const queryVec = unitVector({ 0: 1 });
    await insertPedagogyChunk(db, {
      id: 'cm-1',
      pedagogyKey: 'charlotte_mason',
      layer: 'source_excerpt',
      embedding: queryVec,
    });
    await insertPedagogyChunk(db, {
      id: 'cm-2',
      pedagogyKey: 'charlotte_mason',
      layer: 'practice_pattern',
      embedding: queryVec,
    });
    await insertPedagogyChunk(db, {
      id: 'mont-1',
      pedagogyKey: 'montessori',
      layer: 'source_excerpt',
      embedding: queryVec,
    });
    await insertPedagogyChunk(db, {
      id: 'mont-2',
      pedagogyKey: 'montessori',
      layer: 'worked_example',
      embedding: queryVec,
    });

    mockQueryEmbedding(queryVec);
    const res = await retrievePedagogyChunks(makeRequest({ pedagogyKey: 'charlotte_mason' }));

    expect(res.fallbackUsed).toBe(false);
    expect(res.totalMatched).toBe(2);
    expect(res.chunks.length).toBe(2);
    expect(res.chunks.every((c) => c.pedagogyKey === 'charlotte_mason')).toBe(true);
    expect(res.chunks.some((c) => c.id === 'mont-1' || c.id === 'mont-2')).toBe(false);
  });

  it('ranks the closer embedding above the orthogonal one', async () => {
    await insertPedagogyChunk(db, {
      id: 'sim-a',
      pedagogyKey: 'classical',
      layer: 'source_excerpt',
      embedding: unitVector({ 0: 1 }),
    });
    await insertPedagogyChunk(db, {
      id: 'sim-b',
      pedagogyKey: 'classical',
      layer: 'worked_example',
      embedding: unitVector({ 1: 1 }),
    });

    mockQueryEmbedding(unitVector({ 0: 1 }));
    const res = await retrievePedagogyChunks(makeRequest({ pedagogyKey: 'classical' }));

    expect(res.chunks[0]?.id).toBe('sim-a');
    const a = res.chunks.find((c) => c.id === 'sim-a');
    const b = res.chunks.find((c) => c.id === 'sim-b');
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(a!.similarityScore).toBeGreaterThan(b!.similarityScore);
  });

  it('boosts a chunk whose ageRange overlaps the request and ranks it above an identical-embedding chunk without one', async () => {
    const queryVec = unitVector({ 0: 1 });
    await insertPedagogyChunk(db, {
      id: 'age-a-no-meta',
      pedagogyKey: 'montessori',
      layer: 'source_excerpt',
      embedding: queryVec,
    });
    await insertPedagogyChunk(db, {
      id: 'age-b-overlap',
      pedagogyKey: 'montessori',
      layer: 'source_excerpt',
      embedding: queryVec,
      metadata: { ageRange: { min: 4, max: 8 } },
    });

    mockQueryEmbedding(queryVec);
    const res = await retrievePedagogyChunks(
      makeRequest({ pedagogyKey: 'montessori', ageRange: { min: 5, max: 7 } })
    );

    expect(res.chunks[0]?.id).toBe('age-b-overlap');
    const boosted = res.chunks.find((c) => c.id === 'age-b-overlap')!;
    const plain = res.chunks.find((c) => c.id === 'age-a-no-meta')!;
    expect(boosted.similarityScore).toBeGreaterThan(plain.similarityScore);
    expect(boosted.matchReasons.some((r) => r.includes('matched age range 4-8'))).toBe(true);
  });

  it('caps the capability-thread boost at 0.15 even with more overlapping threads', async () => {
    const queryVec = unitVector({ 0: 1 });
    await insertPedagogyChunk(db, {
      id: 'thr-none',
      pedagogyKey: 'montessori',
      layer: 'source_excerpt',
      embedding: queryVec,
    });
    await insertPedagogyChunk(db, {
      id: 'thr-many',
      pedagogyKey: 'montessori',
      layer: 'source_excerpt',
      embedding: queryVec,
      metadata: { capabilityThreads: ['L1', 'M1', 'S1', 'S2'] },
    });

    mockQueryEmbedding(queryVec);
    const res = await retrievePedagogyChunks(
      makeRequest({
        pedagogyKey: 'montessori',
        capabilityThreads: ['L1', 'M1', 'S1', 'S2'],
      })
    );

    const none = res.chunks.find((c) => c.id === 'thr-none')!;
    const many = res.chunks.find((c) => c.id === 'thr-many')!;
    expect(none.matchReasons).toEqual([]);
    expect(many.matchReasons.some((r) => r === 'matched threads: L1, M1, S1, S2')).toBe(true);

    // Raw similarity is identical (byte-identical embeddings against the same
    // query vector), so the entire score differential is the thread boost.
    // Uncapped it would be 4 * 0.05 = 0.20; the code caps it at 0.15.
    const boost = many.similarityScore - none.similarityScore;
    expect(boost).toBeLessThanOrEqual(0.15 + 1e-9);
    expect(boost).toBeCloseTo(0.15, 6);
  });

  it('matches situational signals against tags exactly (controlled vocabulary, no substring)', async () => {
    await insertPedagogyChunk(db, {
      id: 'tag-fallback',
      pedagogyKey: 'unschooling',
      layer: 'practice_pattern',
      embedding: unitVector({ 0: 1 }),
      metadata: { tags: ['outdoor_play', 'nature_walk'] },
    });

    mockQueryEmbedding(unitVector({ 0: 1 }));
    const res = await retrievePedagogyChunks(
      makeRequest({ pedagogyKey: 'unschooling', situationalSignals: ['nature_walk', 'outdoor'] })
    );

    const chunk = res.chunks.find((c) => c.id === 'tag-fallback')!;
    expect(chunk).toBeDefined();
    // `nature_walk` is an exact tag; the bare fragment `outdoor` no longer
    // matches `outdoor_play` by substring.
    expect(chunk.matchReasons).toContain('tags matched signals: nature_walk');
  });

  it('surfaces minority layers (practice_pattern, worked_example) alongside a majority of source_excerpt chunks', async () => {
    const queryVec = unitVector({ 0: 1 });
    for (let i = 1; i <= 10; i++) {
      await insertPedagogyChunk(db, {
        id: `layer-se-${i}`,
        pedagogyKey: 'waldorf_steiner',
        layer: 'source_excerpt',
        embedding: queryVec,
      });
    }
    await insertPedagogyChunk(db, {
      id: 'layer-pp-low',
      pedagogyKey: 'waldorf_steiner',
      layer: 'practice_pattern',
      embedding: unitVector({ 1: 1 }),
    });
    await insertPedagogyChunk(db, {
      id: 'layer-we-low',
      pedagogyKey: 'waldorf_steiner',
      layer: 'worked_example',
      embedding: unitVector({ 2: 1 }),
    });

    mockQueryEmbedding(queryVec);
    const res = await retrievePedagogyChunks(
      makeRequest({ pedagogyKey: 'waldorf_steiner', topN: 8 })
    );

    expect(res.totalMatched).toBe(12);
    expect(res.chunks.length).toBe(8);
    expect(res.chunks.some((c) => c.layer === 'practice_pattern')).toBe(true);
    expect(res.chunks.some((c) => c.layer === 'worked_example')).toBe(true);
  });

  it('eclectic requests spread across frameworks, cap at 3 per framework, and always surface a contraindication', async () => {
    const queryVec = unitVector({ 0: 1 });
    const lowVec = unitVector({ 5: 1 });

    // Charlotte Mason: 2 high-similarity source_excerpt + 1 low contraindication.
    await insertPedagogyChunk(db, {
      id: 'ecl-cm-se-1',
      pedagogyKey: 'charlotte_mason',
      layer: 'source_excerpt',
      embedding: queryVec,
    });
    await insertPedagogyChunk(db, {
      id: 'ecl-cm-se-2',
      pedagogyKey: 'charlotte_mason',
      layer: 'source_excerpt',
      embedding: queryVec,
    });
    await insertPedagogyChunk(db, {
      id: 'ecl-cm-ci-1',
      pedagogyKey: 'charlotte_mason',
      layer: 'contraindication',
      embedding: lowVec,
    });

    // Montessori: 2 high-similarity source_excerpt + 1 practice_pattern.
    await insertPedagogyChunk(db, {
      id: 'ecl-mont-se-1',
      pedagogyKey: 'montessori',
      layer: 'source_excerpt',
      embedding: queryVec,
    });
    await insertPedagogyChunk(db, {
      id: 'ecl-mont-se-2',
      pedagogyKey: 'montessori',
      layer: 'source_excerpt',
      embedding: queryVec,
    });
    await insertPedagogyChunk(db, {
      id: 'ecl-mont-pp-1',
      pedagogyKey: 'montessori',
      layer: 'practice_pattern',
      embedding: queryVec,
    });

    // Classical: 2 high-similarity source_excerpt + 1 worked_example.
    await insertPedagogyChunk(db, {
      id: 'ecl-classical-se-1',
      pedagogyKey: 'classical',
      layer: 'source_excerpt',
      embedding: queryVec,
    });
    await insertPedagogyChunk(db, {
      id: 'ecl-classical-se-2',
      pedagogyKey: 'classical',
      layer: 'source_excerpt',
      embedding: queryVec,
    });
    await insertPedagogyChunk(db, {
      id: 'ecl-classical-we-1',
      pedagogyKey: 'classical',
      layer: 'worked_example',
      embedding: queryVec,
    });

    mockQueryEmbedding(queryVec);
    const res = await retrievePedagogyChunks(
      makeRequest({ pedagogyKey: 'eclectic', topN: 8 })
    );

    expect(res.fallbackUsed).toBe(false);
    expect(res.chunks.length).toBe(8);

    const perFramework = new Map<string, number>();
    for (const c of res.chunks) {
      perFramework.set(c.pedagogyKey, (perFramework.get(c.pedagogyKey) ?? 0) + 1);
    }
    expect(perFramework.size).toBeGreaterThanOrEqual(2);
    for (const count of perFramework.values()) {
      expect(count).toBeLessThanOrEqual(3);
    }

    const contraindication = res.chunks.find((c) => c.id === 'ecl-cm-ci-1');
    expect(contraindication).toBeDefined();
    expect(
      contraindication!.matchReasons.some((r) => r === 'tension surfacing (contraindication)')
    ).toBe(true);
  });

  it('returns a fallback response with no chunks when the table is empty', async () => {
    mockQueryEmbedding(unitVector({ 0: 1 }));
    const res = await retrievePedagogyChunks(makeRequest({ pedagogyKey: 'charlotte_mason' }));

    expect(res.fallbackUsed).toBe(true);
    expect(res.chunks).toEqual([]);
    expect(res.totalMatched).toBe(0);
  });
});
