/**
 * Unit tests for validateDlos — the input-sanitiser between Haiku's raw output
 * and observation_dlo_links inserts. Mocks the Sanity catalog so we can
 * exercise reject paths (unknown id, low confidence, bad tier, duplicates,
 * over-cap) without hitting the network.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('../dlo-cache', () => ({
  getValidDlos: vi.fn(async () => ({
    ids: new Set(['dlo.M1.emerging', 'dlo.M1.developing', 'dlo.M1.demonstrating', 'dlo.S1.emerging']),
    tierById: new Map<string, 'emerging' | 'developing' | 'demonstrating'>([
      ['dlo.M1.emerging', 'emerging'],
      ['dlo.M1.developing', 'developing'],
      ['dlo.M1.demonstrating', 'demonstrating'],
      ['dlo.S1.emerging', 'emerging'],
    ]),
  })),
}));

import { validateDlos } from '../dlo-persistence';

beforeEach(() => vi.clearAllMocks());

describe('validateDlos', () => {
  it('passes well-formed DLOs through unchanged', async () => {
    const out = await validateDlos([
      { dlo_id: 'dlo.M1.emerging', tier: 'emerging', confidence: 0.7, rationale: 'counted to 10' },
    ]);
    expect(out).toEqual([
      { dlo_id: 'dlo.M1.emerging', tier: 'emerging', confidence: 0.7, rationale: 'counted to 10', claimed_tier: null },
    ]);
  });

  it('rejects ids absent from the Sanity catalog (hallucinations)', async () => {
    const out = await validateDlos([
      { dlo_id: 'dlo.MADE_UP.emerging', tier: 'emerging', confidence: 0.9 },
    ]);
    expect(out).toEqual([]);
  });

  it('rejects below the 0.4 confidence floor', async () => {
    const out = await validateDlos([
      { dlo_id: 'dlo.M1.emerging', tier: 'emerging', confidence: 0.3 },
    ]);
    expect(out).toEqual([]);
  });

  it('rejects invalid tier values', async () => {
    const out = await validateDlos([
      // @ts-expect-error - deliberate invalid tier
      { dlo_id: 'dlo.M1.emerging', tier: 'mastery', confidence: 0.8 },
    ]);
    expect(out).toEqual([]);
  });

  it('dedupes by dlo_id and caps at 3 entries', async () => {
    const out = await validateDlos([
      { dlo_id: 'dlo.M1.emerging', tier: 'emerging', confidence: 0.9 },
      { dlo_id: 'dlo.M1.emerging', tier: 'developing', confidence: 0.95 }, // dup id, dropped
      { dlo_id: 'dlo.M1.developing', tier: 'developing', confidence: 0.8 },
      { dlo_id: 'dlo.M1.demonstrating', tier: 'demonstrating', confidence: 0.7 },
      { dlo_id: 'dlo.S1.emerging', tier: 'emerging', confidence: 0.6 }, // over cap
    ]);
    expect(out.map((d) => d.dlo_id)).toEqual([
      'dlo.M1.emerging',
      'dlo.M1.developing',
      'dlo.M1.demonstrating',
    ]);
  });

  it('returns [] for empty / non-array input', async () => {
    expect(await validateDlos(undefined)).toEqual([]);
    expect(await validateDlos([])).toEqual([]);
  });

  it('clamps tier to Sanity-authoritative and records claimed_tier on mismatch', async () => {
    const out = await validateDlos([
      { dlo_id: 'dlo.M1.emerging', tier: 'demonstrating', confidence: 0.9 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].tier).toBe('emerging');        // clamped to Sanity value
    expect(out[0].claimed_tier).toBe('demonstrating'); // original claim preserved
  });

  it('leaves claimed_tier null when tier matches the Sanity value', async () => {
    const out = await validateDlos([
      { dlo_id: 'dlo.M1.developing', tier: 'developing', confidence: 0.8 },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].tier).toBe('developing');
    expect(out[0].claimed_tier).toBeNull();
  });
});
