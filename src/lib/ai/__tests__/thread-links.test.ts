/**
 * UNIT: buildThreadLinksFromActivityDocs — the pure collapse of activity docs
 * into ThreadObservationLink[]. Verifies WS-6 capabilityTargets carry the
 * author-declared tier and take precedence over legacy bare capabilityThreads.
 */
import { describe, it, expect } from 'vitest';
import { buildThreadLinksFromActivityDocs } from '../thread-links';

describe('buildThreadLinksFromActivityDocs', () => {
  it('returns [] for empty / nullish input', () => {
    expect(buildThreadLinksFromActivityDocs([])).toEqual([]);
    expect(buildThreadLinksFromActivityDocs(null)).toEqual([]);
    expect(buildThreadLinksFromActivityDocs(undefined)).toEqual([]);
  });

  it('uses the author-declared tier from capabilityTargets', () => {
    const links = buildThreadLinksFromActivityDocs([
      {
        _id: 'a1',
        capabilityTargets: [{ tier: 'demonstrating', thread: { _id: 'capabilityThread.M1' } }],
      },
    ]);
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({
      threadId: 'M1',
      tierAtTime: 'demonstrating',
      confidence: 'confirmed',
      stageBand: 'intermediate',
      atomicLinks: [],
    });
  });

  it('falls back to the default tier for legacy bare capabilityThreads', () => {
    const links = buildThreadLinksFromActivityDocs([
      { _id: 'a1', capabilityThreads: [{ _id: 'capabilityThread.L3' }] },
    ]);
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ threadId: 'L3', tierAtTime: 'developing' });
  });

  it('a target takes precedence over a bare thread for the same thread', () => {
    const links = buildThreadLinksFromActivityDocs([
      {
        _id: 'a1',
        capabilityThreads: [{ _id: 'capabilityThread.M1' }],
        capabilityTargets: [{ tier: 'emerging', thread: { _id: 'capabilityThread.M1' } }],
      },
    ]);
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ threadId: 'M1', tierAtTime: 'emerging' });
  });

  it('the highest declared tier wins across activities targeting the same thread', () => {
    const links = buildThreadLinksFromActivityDocs([
      { _id: 'a1', capabilityTargets: [{ tier: 'emerging', thread: { _id: 'capabilityThread.S1' } }] },
      { _id: 'a2', capabilityTargets: [{ tier: 'developing', thread: { _id: 'capabilityThread.S1' } }] },
    ]);
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ threadId: 'S1', tierAtTime: 'developing' });
  });

  it('drops stray / UUID thread refs not in the canonical set', () => {
    const links = buildThreadLinksFromActivityDocs([
      {
        _id: 'a1',
        capabilityThreads: [{ _id: 'capabilityThread.a1b2c3d4-uuid' }],
        capabilityTargets: [{ tier: 'developing', thread: { _id: 'capabilityThread.not-a-code' } }],
      },
    ]);
    expect(links).toEqual([]);
  });

  it('falls back to the default tier when a target tier is missing or invalid', () => {
    const links = buildThreadLinksFromActivityDocs([
      {
        _id: 'a1',
        capabilityTargets: [
          { tier: 'nonsense', thread: { _id: 'capabilityThread.EF1' } },
          { tier: null, thread: { _id: 'capabilityThread.EF2' } },
        ],
      },
    ]);
    const byThread = Object.fromEntries(links.map((l) => [l.threadId, l.tierAtTime]));
    expect(byThread).toEqual({ EF1: 'developing', EF2: 'developing' });
  });

  it('accepts bare thread codes (no capabilityThread. prefix) too', () => {
    const links = buildThreadLinksFromActivityDocs([
      { _id: 'a1', capabilityTargets: [{ tier: 'developing', thread: { _id: 'PS3' } }] },
    ]);
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ threadId: 'PS3', tierAtTime: 'developing' });
  });
});
