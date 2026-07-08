import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RetrievedChunk, RetrievalResponse } from '@/lib/pedagogy/retrieval';

// Mock the db-dependent retrieval module so tests run without a live Neon connection.
vi.mock('@/lib/pedagogy/retrieval', () => ({
  retrievePedagogyChunks: vi.fn(),
}));

const { retrievePedagogyChunks } = await import('@/lib/pedagogy/retrieval');
const { buildPedagogyContextWithSources } = await import('./pedagogy-context');

const mockRetrieve = vi.mocked(retrievePedagogyChunks);

function makeChunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    id: 'chunk-1',
    pedagogyKey: 'charlotte_mason',
    layer: 'source_excerpt',
    text: 'Narration deepens retention when the child retells in their own words.',
    metadata: {},
    similarityScore: 0.8,
    matchReasons: ['semantic match'],
    ...overrides,
  };
}

function makeResponse(chunks: RetrievedChunk[]): RetrievalResponse {
  return {
    chunks,
    totalMatched: chunks.length,
    retrievalLatencyMs: 10,
    fallbackUsed: false,
  };
}

describe('buildPedagogyContextWithSources', () => {
  beforeEach(() => {
    vi.stubEnv('PEDAGOGY_KB_ENABLED', 'true');
    mockRetrieve.mockReset();
  });

  it('produces a byte-identical non-eclectic prompt (pinned)', async () => {
    mockRetrieve.mockResolvedValue(
      makeResponse([
        makeChunk({
          id: 'cm-1',
          layer: 'source_excerpt',
          pedagogyKey: 'charlotte_mason',
          text: 'Narration deepens retention when the child retells in their own words.',
        }),
      ])
    );

    const { prompt } = await buildPedagogyContextWithSources({
      entryTitle: 'Pond walk',
      entryDescription: 'We looked at tadpoles.',
      framework: 'charlotte_mason',
    });

    const expected = `<pedagogy_reference_material>
The family follows the charlotte_mason pedagogical approach. The following reference material has been retrieved as relevant to this entry. Use it to inform interpretation and suggestions, attributing specific guidance back to its source where appropriate.

<reference layer="source_excerpt" id="cm-1">
Narration deepens retention when the child retells in their own words.
</reference>

</pedagogy_reference_material>`;

    expect(prompt).toBe(expected);
  });

  it('adds tradition attributes and the tension sentence for eclectic families', async () => {
    mockRetrieve.mockResolvedValue(
      makeResponse([
        makeChunk({
          id: 'cm-1',
          layer: 'source_excerpt',
          pedagogyKey: 'charlotte_mason',
          text: 'Narration deepens retention.',
        }),
        makeChunk({
          id: 'un-1',
          layer: 'contraindication',
          pedagogyKey: 'unschooling',
          text: 'Avoid imposing structured recall on unschooled learners.',
          matchReasons: ['semantic match', 'tension surfacing (contraindication)'],
        }),
      ])
    );

    const { prompt } = await buildPedagogyContextWithSources({
      entryTitle: 'Pond walk',
      entryDescription: 'We looked at tadpoles.',
      framework: 'eclectic',
    });

    expect(prompt).toContain('tradition="charlotte_mason"');
    expect(prompt).toContain('tradition="unschooling"');
    expect(prompt).toContain(
      "Where a contraindication from one tradition tensions with another tradition's suggestion, surface the tension honestly rather than resolving it silently."
    );
  });

  it('falls back when retrieval reports fallbackUsed', async () => {
    mockRetrieve.mockResolvedValue({
      chunks: [],
      totalMatched: 0,
      retrievalLatencyMs: 5,
      fallbackUsed: true,
    });

    const { prompt, sources } = await buildPedagogyContextWithSources({
      entryTitle: 'Pond walk',
      entryDescription: 'We looked at tadpoles.',
      framework: 'eclectic',
    });

    expect(prompt).toBe('PEDAGOGY CONTEXT:\nFamily follows the eclectic approach.');
    expect(sources).toEqual([]);
  });
});
