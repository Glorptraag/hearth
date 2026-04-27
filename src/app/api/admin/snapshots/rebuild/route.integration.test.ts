/**
 * Integration test for /api/admin/snapshots/rebuild — exercises the admin
 * guard, the audit-log write, and the snapshot row update against a real
 * Neon test branch. The admin guard is the load-bearing piece here:
 * mocking it would defeat the test.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createSnapshot } from '@/test/db-factories';
import { adminAuditLog, familyIntelligenceSnapshots } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { POST } from './route';
import { TEST_USER_ID } from '../../../../../../vitest.setup';

// Zod 4's `.uuid()` enforces RFC 4122 version+variant bits, which the
// shared TEST_FAMILY_ID (all zeros) fails. Use proper UUID-v4 strings
// for any value that goes through the request body's zod schema.
const TARGET_FAMILY_ID = '00000000-0000-4000-8000-00000000000a';
const ABSENT_FAMILY_ID = '00000000-0000-4000-8000-0000000000ff';

function jsonReq(body: unknown) {
  return new NextRequest('http://x/api/admin/snapshots/rebuild', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  // Default: caller is NOT an admin. Tests that need admin opt in.
  vi.stubEnv('ADMIN_CLERK_IDS', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/admin/snapshots/rebuild — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await POST(jsonReq({ familyId: TARGET_FAMILY_ID, reason: 'test' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when caller is not in ADMIN_CLERK_IDS', async () => {
    asUser({});
    const res = await POST(jsonReq({ familyId: TARGET_FAMILY_ID, reason: 'test' }));
    expect(res.status).toBe(403);
  });

  it('returns 400 when reason is missing', async () => {
    vi.stubEnv('ADMIN_CLERK_IDS', TEST_USER_ID);
    asUser({});
    const res = await POST(jsonReq({ familyId: TARGET_FAMILY_ID }));
    expect(res.status).toBe(400);
  });

  it('returns 404 when the target familyId does not exist', async () => {
    vi.stubEnv('ADMIN_CLERK_IDS', TEST_USER_ID);
    asUser({});
    const res = await POST(jsonReq({ familyId: ABSENT_FAMILY_ID, reason: 'test' }));
    expect(res.status).toBe(404);
  });

  it('admin happy path flips rebuildTrigger and writes an audit-log row', async () => {
    vi.stubEnv('ADMIN_CLERK_IDS', TEST_USER_ID);
    asUser({});

    await createFamily(db, { id: TARGET_FAMILY_ID, clerkUserId: 'user_target_owner' });
    await createSnapshot(db, {
      familyId: TARGET_FAMILY_ID,
      rebuildTrigger: 'entry_saved',
    });

    const res = await POST(
      jsonReq({ familyId: TARGET_FAMILY_ID, reason: 'manual smoke test' })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { queued: boolean; familyId: string };
    expect(body.queued).toBe(true);
    expect(body.familyId).toBe(TARGET_FAMILY_ID);

    const [snapshot] = await db
      .select()
      .from(familyIntelligenceSnapshots)
      .where(eq(familyIntelligenceSnapshots.familyId, TARGET_FAMILY_ID));
    expect(snapshot.rebuildTrigger).toBe('admin_manual');

    const audits = await db
      .select()
      .from(adminAuditLog)
      .where(eq(adminAuditLog.targetId, TARGET_FAMILY_ID));
    expect(audits).toHaveLength(1);
    expect(audits[0].action).toBe('snapshot.rebuild');
    expect(audits[0].adminUserId).toBe(TEST_USER_ID);
    expect(audits[0].reason).toBe('manual smoke test');
  });
});
