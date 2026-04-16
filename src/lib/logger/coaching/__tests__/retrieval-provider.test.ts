import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CoachHintInput } from '../types';
import type { RetrievedChunk, RetrievalResponse } from '@/lib/pedagogy/retrieval';

// Mock the db-dependent retrieval module so tests run without a live Neon connection.
// The RetrievalCoachProvider accepts retrieval fn + framework lookup via DI, so all
// behaviour can be exercised through the constructor parameters — the top-level import
// is only mocked to prevent neon() from firing on module load.
vi.mock('@/lib/pedagogy/retrieval', () => ({
  retrievePedagogyChunks: vi.fn(),
}));
vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('@/lib/db/schema', () => ({
  familySettings: {},
}));

// Import after mocks are registered
const { RetrievalCoachProvider, mapChunksToHints } = await import('../retrieval-provider');

function makeChunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    id: 'chunk-1',
    pedagogyKey: 'eclectic',
    layer: 'practice_pattern',
    text: 'Observation is deepened when the parent describes the child\'s specific actions rather than general impressions. Look for moments of self-correction.',
    metadata: { heading: 'Deep Observation' },
    similarityScore: 0.82,
    matchReasons: ['semantic match'],
    ...overrides,
  };
}

function makeInput(overrides: Partial<CoachHintInput> = {}): CoachHintInput {
  return {
    familyId: 'family-1',
    learnerIds: ['learner-1'],
    activityType: 'nature',
    description: 'We went for a walk and looked at tadpoles in the pond.',
    observations: ['Deeply focused'],
    snapshotSignals: {
      perChild: { 'learner-1': { quiet: ['S5'], active: ['L3'] } },
    },
    ...overrides,
  };
}

describe('RetrievalCoachProvider', () => {
  beforeEach(() => {
    vi.stubEnv('PEDAGOGY_KB_ENABLED', 'true');
  });

  it('returns [] when PEDAGOGY_KB_ENABLED is not true', async () => {
    vi.stubEnv('PEDAGOGY_KB_ENABLED', 'false');
    const mockRetrieve = vi.fn();
    const mockFramework = vi.fn().mockResolvedValue('eclectic');
    const provider = new RetrievalCoachProvider(mockRetrieve, mockFramework);
    const hints = await provider.getHints(makeInput());
    expect(hints).toEqual([]);
    expect(mockRetrieve).not.toHaveBeenCalled();
  });

  it('returns mapped hints from retrieval chunks', async () => {
    const chunks = [makeChunk(), makeChunk({ id: 'chunk-2', metadata: { heading: 'Second Hint' }, text: 'Second sentence here.' })];
    const mockRetrieve = vi.fn<(opts: import('@/lib/pedagogy/retrieval').RetrievalRequest) => Promise<RetrievalResponse>>().mockResolvedValue({
      chunks,
      totalMatched: 2,
      retrievalLatencyMs: 12,
      fallbackUsed: false,
    });
    const mockFramework = vi.fn().mockResolvedValue('eclectic');
    const provider = new RetrievalCoachProvider(mockRetrieve, mockFramework);

    const hints = await provider.getHints(makeInput());
    expect(hints).toHaveLength(2);
    expect(hints[0].title).toBe('Deep Observation');
    expect(hints[0].id).toMatch(/^hint-/);
  });

  it('returns at most 2 hints even when retrieval returns more', async () => {
    const chunks = [1, 2, 3].map((i) =>
      makeChunk({ id: `chunk-${i}`, metadata: { heading: `Hint ${i}` } })
    );
    const mockRetrieve = vi.fn<(opts: import('@/lib/pedagogy/retrieval').RetrievalRequest) => Promise<RetrievalResponse>>().mockResolvedValue({
      chunks,
      totalMatched: 3,
      retrievalLatencyMs: 10,
      fallbackUsed: false,
    });
    const mockFramework = vi.fn().mockResolvedValue('eclectic');
    const provider = new RetrievalCoachProvider(mockRetrieve, mockFramework);

    const hints = await provider.getHints(makeInput());
    expect(hints.length).toBeLessThanOrEqual(2);
  });

  it('cache hit on identical input returns synchronously without re-calling retrieval', async () => {
    const mockRetrieve = vi.fn<(opts: import('@/lib/pedagogy/retrieval').RetrievalRequest) => Promise<RetrievalResponse>>().mockResolvedValue({
      chunks: [makeChunk()],
      totalMatched: 1,
      retrievalLatencyMs: 8,
      fallbackUsed: false,
    });
    const mockFramework = vi.fn().mockResolvedValue('eclectic');
    const provider = new RetrievalCoachProvider(mockRetrieve, mockFramework);

    const input = makeInput();
    await provider.getHints(input);
    await provider.getHints(input); // identical — should hit cache
    expect(mockRetrieve).toHaveBeenCalledTimes(1);
  });

  it('cache miss on different description', async () => {
    const mockRetrieve = vi.fn<(opts: import('@/lib/pedagogy/retrieval').RetrievalRequest) => Promise<RetrievalResponse>>().mockResolvedValue({
      chunks: [makeChunk()],
      totalMatched: 1,
      retrievalLatencyMs: 8,
      fallbackUsed: false,
    });
    const mockFramework = vi.fn().mockResolvedValue('eclectic');
    const provider = new RetrievalCoachProvider(mockRetrieve, mockFramework);

    await provider.getHints(makeInput({ description: 'First entry text.' }));
    await provider.getHints(makeInput({ description: 'Completely different text.' }));
    expect(mockRetrieve).toHaveBeenCalledTimes(2);
  });

  it('returns [] cleanly when retrieval fallbackUsed=true', async () => {
    const mockRetrieve = vi.fn<(opts: import('@/lib/pedagogy/retrieval').RetrievalRequest) => Promise<RetrievalResponse>>().mockResolvedValue({
      chunks: [],
      totalMatched: 0,
      retrievalLatencyMs: 5,
      fallbackUsed: true,
    });
    const mockFramework = vi.fn().mockResolvedValue('eclectic');
    const provider = new RetrievalCoachProvider(mockRetrieve, mockFramework);

    const hints = await provider.getHints(makeInput());
    expect(hints).toEqual([]);
  });

  it('returns [] cleanly when retrieval throws', async () => {
    const mockRetrieve = vi.fn<(opts: import('@/lib/pedagogy/retrieval').RetrievalRequest) => Promise<RetrievalResponse>>().mockRejectedValue(new Error('DB unavailable'));
    const mockFramework = vi.fn().mockResolvedValue('eclectic');
    const provider = new RetrievalCoachProvider(mockRetrieve, mockFramework);

    const hints = await provider.getHints(makeInput());
    expect(hints).toEqual([]);
  });
});

describe('mapChunksToHints', () => {
  it('uses metadata heading as title when present', () => {
    const hints = mapChunksToHints([makeChunk({ metadata: { heading: 'My Heading' } })]);
    expect(hints[0].title).toBe('My Heading');
  });

  it('falls back to formatted layer label when no heading', () => {
    const hints = mapChunksToHints([makeChunk({ metadata: {}, layer: 'source_excerpt' })]);
    expect(hints[0].title).toBe('Source Excerpt');
  });

  it('uses first sentence of text as body', () => {
    const hints = mapChunksToHints([
      makeChunk({ text: 'First sentence here. Second sentence follows.' }),
    ]);
    expect(hints[0].body).toBe('First sentence here.');
  });

  it('assigns kind=pattern for practice_pattern layer', () => {
    const hints = mapChunksToHints([makeChunk({ layer: 'practice_pattern' })]);
    expect(hints[0].kind).toBe('pattern');
  });

  it('assigns kind=teaching for unknown layer', () => {
    const hints = mapChunksToHints([makeChunk({ layer: 'source_excerpt' })]);
    expect(hints[0].kind).toBe('teaching');
  });

  it('respects MAX_HINTS cap regardless of chunk count', () => {
    // MAX_HINTS=2; even with 5 chunks, we get at most 2 hints
    const chunks = [1, 2, 3, 4, 5].map((i) =>
      makeChunk({ id: `c-${i}`, metadata: { heading: `Hint ${i}` } })
    );
    const hints = mapChunksToHints(chunks);
    expect(hints.length).toBeLessThanOrEqual(2);
  });
});
