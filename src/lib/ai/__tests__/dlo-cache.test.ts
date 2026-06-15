/**
 * Regression test for the prod DLO-blindness bug (outcomes-spine Track A / A3).
 *
 * `discreteLearningObjective` docs are not visible to the tokenless public read
 * role, so the public `sanityClient` returns 0 rows in production. getValidDlos()
 * must therefore read through the authed `sanityServerClient` — otherwise the
 * WS-3 descriptor block is empty and every mapped DLO is stripped at validation,
 * silently writing zero observation_dlo_links.
 *
 * These tests pin the read to the authed client: the tokenless mock returns []
 * (prod behaviour), the authed mock returns rows; getValidDlos must surface the
 * rows and never touch the tokenless client.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted so the mock factory (also hoisted) can reference these.
const { tokenlessFetch, authedFetch } = vi.hoisted(() => ({
  tokenlessFetch: vi.fn(async () => [] as unknown[]), // public read role: sees no DLOs
  authedFetch: vi.fn(async () => [
    { _id: 'dlo.M1.emerging', tier: 'emerging', descriptor: 'Counts objects with one-to-one correspondence.' },
    { _id: 'dlo.M1.developing', tier: 'developing', descriptor: 'Uses skip counting purposefully.' },
  ]),
}));

vi.mock('@/lib/sanity/client', () => ({
  sanityClient: { fetch: tokenlessFetch },
  sanityServerClient: { fetch: authedFetch },
  sanityWriteClient: { fetch: vi.fn(async () => []) },
}));

import { getValidDlos, bustDloCache } from '../dlo-cache';

describe('dlo-cache · getValidDlos', () => {
  beforeEach(() => {
    bustDloCache();
    tokenlessFetch.mockClear();
    authedFetch.mockClear();
  });

  it('reads DLOs through the authed server client, never the tokenless read client', async () => {
    const { ids, tierById, descriptorById } = await getValidDlos();

    expect(authedFetch).toHaveBeenCalledTimes(1);
    expect(tokenlessFetch).not.toHaveBeenCalled();

    expect(ids.has('dlo.M1.emerging')).toBe(true);
    expect(ids.size).toBe(2);
    expect(tierById.get('dlo.M1.developing')).toBe('developing');
    expect(descriptorById.get('dlo.M1.emerging')).toBe('Counts objects with one-to-one correspondence.');
  });

  it('surfaces a non-empty descriptor set even though the tokenless client would see nothing (prod regression)', async () => {
    const { descriptorById } = await getValidDlos();
    // If getValidDlos regressed to the tokenless `sanityClient`, this would be 0
    // (its mock returns []), reproducing the silent prod DLO blindness.
    expect(descriptorById.size).toBeGreaterThan(0);
  });
});
