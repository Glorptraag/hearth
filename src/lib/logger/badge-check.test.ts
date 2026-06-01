import { describe, it, expect, vi } from 'vitest';
import { checkBadgeThresholds, buildBadgeReadyToast, type BadgeReady } from './badge-check';

function okJson(body: unknown): Response {
  return { ok: true, json: async () => body } as Response;
}
function notOk(): Response {
  return { ok: false, json: async () => ({}) } as Response;
}

describe('checkBadgeThresholds', () => {
  it('fans out one request per learner and flattens the ready badges', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(okJson({ badgeIds: ['b1', 'b2'] }))
      .mockResolvedValueOnce(okJson({ badgeIds: ['b3'] }));

    const ready = await checkBadgeThresholds(['L1', 'L2'], fetchImpl as unknown as typeof fetch);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(ready).toEqual([
      { badgeId: 'b1', learnerId: 'L1' },
      { badgeId: 'b2', learnerId: 'L1' },
      { badgeId: 'b3', learnerId: 'L2' },
    ]);
  });

  it('posts the learnerId to the thresholds endpoint', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okJson({ badgeIds: [] }));
    await checkBadgeThresholds(['L1'], fetchImpl as unknown as typeof fetch);
    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/badges/check-thresholds',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ learnerId: 'L1' }) }),
    );
  });

  it('treats a non-OK response as no badges for that learner', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(notOk())
      .mockResolvedValueOnce(okJson({ badgeIds: ['b1'] }));
    const ready = await checkBadgeThresholds(['L1', 'L2'], fetchImpl as unknown as typeof fetch);
    expect(ready).toEqual([{ badgeId: 'b1', learnerId: 'L2' }]);
  });

  it('treats a thrown fetch as no badges (non-critical, never rejects)', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(okJson({ badgeIds: ['b1'] }));
    const ready = await checkBadgeThresholds(['L1', 'L2'], fetchImpl as unknown as typeof fetch);
    expect(ready).toEqual([{ badgeId: 'b1', learnerId: 'L2' }]);
  });

  it('defaults missing badgeIds to an empty list', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okJson({}));
    const ready = await checkBadgeThresholds(['L1'], fetchImpl as unknown as typeof fetch);
    expect(ready).toEqual([]);
  });
});

describe('buildBadgeReadyToast', () => {
  const names = new Map([
    ['L1', 'Emma'],
    ['L2', 'Sam'],
  ]);

  it('returns null when nothing is ready', () => {
    expect(buildBadgeReadyToast([], names)).toBeNull();
  });

  it('builds a single-badge toast with a deep link and no queue/position params', () => {
    const ready: BadgeReady[] = [{ badgeId: 'b1', learnerId: 'L1' }];
    const toast = buildBadgeReadyToast(ready, names);
    expect(toast).toEqual({
      type: 'badge',
      message: 'Hearth noticed something new. Quick check?',
      action: { label: 'Now (2 min)', href: '/badges/assess/b1?learner=L1&name=Emma' },
    });
  });

  it('queues the remainder and adds position params for multiple badges', () => {
    const ready: BadgeReady[] = [
      { badgeId: 'b1', learnerId: 'L1' },
      { badgeId: 'b2', learnerId: 'L2' },
    ];
    const toast = buildBadgeReadyToast(ready, names);
    expect(toast?.message).toBe('Hearth noticed something new — 2 quick checks ready.');
    expect(toast?.action.label).toBe('Start (2)');
    expect(toast?.action.href).toBe(
      '/badges/assess/b1?learner=L1&name=Emma&queue=b2:L2&qn=1&qt=2',
    );
  });

  it('url-encodes the learner name', () => {
    const toast = buildBadgeReadyToast(
      [{ badgeId: 'b1', learnerId: 'L3' }],
      new Map([['L3', 'Mary Jane']]),
    );
    expect(toast?.action.href).toContain('name=Mary%20Jane');
  });

  it('falls back to an empty name when the learner is unknown', () => {
    const toast = buildBadgeReadyToast([{ badgeId: 'b1', learnerId: 'L9' }], names);
    expect(toast?.action.href).toBe('/badges/assess/b1?learner=L9&name=');
  });
});
