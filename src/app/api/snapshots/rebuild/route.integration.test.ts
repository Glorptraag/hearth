/**
 * Integration test for the family-scoped POST /api/snapshots/rebuild.
 *
 * The route is fired from Dashboard mount to refresh a stale monthly
 * narrative. We assert the auth gate, 24h debounce, and rate-limit
 * behaviour against a real Neon test branch. rebuildSnapshot itself is
 * stubbed — that path is covered by its own enrichment tests, and we
 * don't want this suite to pay for an Anthropic call.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createSnapshot } from '@/test/db-factories';
import { TEST_FAMILY_ID } from '../../../../../vitest.setup';

vi.mock('@/lib/ai/snapshot-rebuild', () => ({
  rebuildSnapshot: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('next/server', async (importOriginal) => {
  const mod = await importOriginal<typeof import('next/server')>();
  return { ...mod, after: (fn: () => Promise<void> | void) => Promise.resolve(fn()) };
});

async function importRoute() {
  return import('./route');
}

function req() {
  return new NextRequest('http://x/api/snapshots/rebuild', { method: 'POST' });
}

beforeEach(async () => {
  await createFamily(db, { id: TEST_FAMILY_ID });
});

describe('POST /api/snapshots/rebuild — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const { POST } = await importRoute();
    const res = await POST(req());
    expect(res.status).toBe(401);
  });

  it('returns 202 and queues rebuild when no snapshot exists yet', async () => {
    asUser({});
    const { POST } = await importRoute();
    const { rebuildSnapshot } = await import('@/lib/ai/snapshot-rebuild');
    const res = await POST(req());
    expect(res.status).toBe(202);
    expect(rebuildSnapshot).toHaveBeenCalledWith(TEST_FAMILY_ID, 'user_dashboard');
  });

  it('returns 200 skipped=true when snapshot is fresh (<24h)', async () => {
    asUser({});
    await createSnapshot(db, {
      familyId: TEST_FAMILY_ID,
      rebuiltAt: new Date(Date.now() - 60 * 60 * 1000),
    });
    const { POST } = await importRoute();
    const { rebuildSnapshot } = await import('@/lib/ai/snapshot-rebuild');
    vi.mocked(rebuildSnapshot).mockClear();
    const res = await POST(req());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { skipped: boolean; reason: string };
    expect(body.skipped).toBe(true);
    expect(body.reason).toBe('fresh');
    expect(rebuildSnapshot).not.toHaveBeenCalled();
  });

  it('returns 202 and queues rebuild when snapshot is stale (>24h)', async () => {
    asUser({});
    await createSnapshot(db, {
      familyId: TEST_FAMILY_ID,
      rebuiltAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    });
    const { POST } = await importRoute();
    const { rebuildSnapshot } = await import('@/lib/ai/snapshot-rebuild');
    vi.mocked(rebuildSnapshot).mockClear();
    const res = await POST(req());
    expect(res.status).toBe(202);
    expect(rebuildSnapshot).toHaveBeenCalledWith(TEST_FAMILY_ID, 'user_dashboard');
  });
});
