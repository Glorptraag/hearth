/**
 * Integration test for the family-scoped POST /api/snapshots/rebuild.
 *
 * The route is fired from Dashboard mount to refresh a stale monthly
 * narrative. We assert the auth gate and 24h debounce against a real
 * Neon test branch. rebuildSnapshot itself is stubbed — that path is
 * covered by its own enrichment tests, and the after() callback would
 * race the integration suite's between-tests truncate if left to do
 * real DB work.
 */
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createSnapshot } from '@/test/db-factories';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';
import { POST } from './route';

vi.mock('@/lib/ai/snapshot-rebuild', () => ({
  rebuildSnapshot: vi.fn().mockResolvedValue(undefined),
}));

function req() {
  return new NextRequest('http://x/api/snapshots/rebuild', { method: 'POST' });
}

describe('POST /api/snapshots/rebuild — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await POST(req());
    expect(res.status).toBe(401);
  });

  it('returns 404 when the caller has no family row', async () => {
    asUser({});
    const res = await POST(req());
    expect(res.status).toBe(404);
  });

  it('returns 202 when no snapshot exists yet', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const res = await POST(req());
    expect(res.status).toBe(202);
    const body = (await res.json()) as { queued: boolean };
    expect(body.queued).toBe(true);
  });

  it('returns 200 skipped=true when snapshot is fresh (<24h)', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    await createSnapshot(db, {
      familyId: TEST_FAMILY_ID,
      rebuiltAt: new Date(Date.now() - 60 * 60 * 1000),
    });
    const res = await POST(req());
    expect(res.status).toBe(200);
    const body = (await res.json()) as { skipped: boolean; reason: string };
    expect(body.skipped).toBe(true);
    expect(body.reason).toBe('fresh');
  });

  it('returns 202 when snapshot is stale (>24h)', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    await createSnapshot(db, {
      familyId: TEST_FAMILY_ID,
      rebuiltAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    });
    const res = await POST(req());
    expect(res.status).toBe(202);
  });
});
