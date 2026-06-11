import { describe, it, expect } from 'vitest';
import { normalizeThreadId, entryThreadIds, VALID_THREAD_IDS } from '../thread-aggregation';

describe('VALID_THREAD_IDS', () => {
  it('contains exactly 57 canonical thread ids', () => {
    expect(VALID_THREAD_IDS.size).toBe(57);
  });

  it('includes representatives from every domain group', () => {
    expect(VALID_THREAD_IDS.has('L1')).toBe(true);  // Literacy
    expect(VALID_THREAD_IDS.has('M9')).toBe(true);  // Maths
    expect(VALID_THREAD_IDS.has('S6')).toBe(true);  // Science
    expect(VALID_THREAD_IDS.has('H6')).toBe(true);  // Humanities
    expect(VALID_THREAD_IDS.has('P5')).toBe(true);  // Physical
    expect(VALID_THREAD_IDS.has('PS7')).toBe(true); // Personal/Social
    expect(VALID_THREAD_IDS.has('C7')).toBe(true);  // Creative
    expect(VALID_THREAD_IDS.has('EF8')).toBe(true); // Executive Function
  });
});

describe('normalizeThreadId', () => {
  it('strips capabilityThread. prefix and returns bare id for valid codes', () => {
    expect(normalizeThreadId('capabilityThread.L1')).toBe('L1');
    expect(normalizeThreadId('capabilityThread.EF8')).toBe('EF8');
    expect(normalizeThreadId('capabilityThread.PS7')).toBe('PS7');
  });

  it('passes through bare valid ids unchanged', () => {
    expect(normalizeThreadId('L1')).toBe('L1');
    expect(normalizeThreadId('M9')).toBe('M9');
    expect(normalizeThreadId('EF1')).toBe('EF1');
  });

  it('returns null for prefixed ids with unknown bare code', () => {
    expect(normalizeThreadId('capabilityThread.BOGUS')).toBeNull();
    expect(normalizeThreadId('capabilityThread.Z99')).toBeNull();
  });

  it('returns null for bare ids not in the canonical set', () => {
    expect(normalizeThreadId('BOGUS')).toBeNull();
    expect(normalizeThreadId('L0')).toBeNull();
    expect(normalizeThreadId('X1')).toBeNull();
    expect(normalizeThreadId('')).toBeNull();
  });
});

describe('entryThreadIds', () => {
  it('returns inferred threads from aiEnrichment.capability_threads', () => {
    const entry = {
      aiEnrichment: { capability_threads: [{ thread_id: 'L1' }, { thread_id: 'M1' }] },
      threadLinks: [],
    };
    const result = entryThreadIds(entry);
    expect(result).toHaveLength(2);
    expect(result.find((t) => t.threadId === 'L1')).toEqual({
      threadId: 'L1',
      inferred: true,
      declared: false,
    });
    expect(result.find((t) => t.threadId === 'M1')).toEqual({
      threadId: 'M1',
      inferred: true,
      declared: false,
    });
  });

  it('returns declared threads from threadLinks with Sanity _id format', () => {
    const entry = {
      aiEnrichment: null,
      threadLinks: [
        {
          threadId: 'capabilityThread.S1',
          stageBand: 'intermediate',
          tierAtTime: 'developing',
          confidence: 'confirmed',
          atomicLinks: [],
        },
      ],
    };
    const result = entryThreadIds(entry);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ threadId: 'S1', inferred: false, declared: true });
  });

  it('dedupes a thread present in both sources, setting both flags true', () => {
    const entry = {
      aiEnrichment: { capability_threads: [{ thread_id: 'M1' }] },
      threadLinks: [
        {
          threadId: 'capabilityThread.M1',
          stageBand: 'intermediate',
          tierAtTime: 'developing',
          confidence: 'confirmed',
          atomicLinks: [],
        },
      ],
    };
    const result = entryThreadIds(entry);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ threadId: 'M1', inferred: true, declared: true });
  });

  it('dedupes a thread with bare id in enrichment and prefixed id in threadLinks', () => {
    const entry = {
      aiEnrichment: { capability_threads: [{ thread_id: 'EF3' }] },
      threadLinks: [
        { threadId: 'capabilityThread.EF3', stageBand: 'intermediate', tierAtTime: 'developing', confidence: 'confirmed', atomicLinks: [] },
      ],
    };
    const result = entryThreadIds(entry);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ threadId: 'EF3', inferred: true, declared: true });
  });

  it('filters invalid thread ids from both sources', () => {
    const entry = {
      aiEnrichment: {
        capability_threads: [
          { thread_id: 'BOGUS' },
          { thread_id: 'L1' },
        ],
      },
      threadLinks: [
        { threadId: 'capabilityThread.INVALID', stageBand: 'intermediate', tierAtTime: 'developing', confidence: 'confirmed', atomicLinks: [] },
        { threadId: 'capabilityThread.H2', stageBand: 'intermediate', tierAtTime: 'developing', confidence: 'confirmed', atomicLinks: [] },
      ],
    };
    const result = entryThreadIds(entry);
    expect(result).toHaveLength(2);
    const ids = result.map((t) => t.threadId).sort();
    expect(ids).toEqual(['H2', 'L1']);
  });

  it('returns empty array for entry with no enrichment or links', () => {
    expect(entryThreadIds({})).toEqual([]);
    expect(entryThreadIds({ aiEnrichment: null, threadLinks: null })).toEqual([]);
    expect(entryThreadIds({ aiEnrichment: undefined, threadLinks: undefined })).toEqual([]);
  });

  it('returns empty array when enrichment has empty capability_threads', () => {
    expect(entryThreadIds({ aiEnrichment: { capability_threads: [] }, threadLinks: [] })).toEqual([]);
  });

  it('handles a declared-only thread (no enrichment) correctly', () => {
    const entry = {
      aiEnrichment: { capability_threads: [] },
      threadLinks: [
        { threadId: 'capabilityThread.C2', stageBand: 'beginner', tierAtTime: 'emerging', confidence: 'confirmed', atomicLinks: [] },
      ],
    };
    const result = entryThreadIds(entry);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ threadId: 'C2', inferred: false, declared: true });
  });
});
