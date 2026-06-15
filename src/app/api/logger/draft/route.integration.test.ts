/**
 * Integration test for /api/logger/draft — the cross-device draft mirror.
 * Exercises the auth → DB → response chain against real Postgres. The two
 * classes of bug unit tests cannot catch and this surface must never ship:
 * cross-user leakage (one parent seeing another's in-progress log) and the
 * 7-day read-time expiry. Per-user keying is the whole point, so isolation is
 * the headline test.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut, asOtherFamily } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLoggerDraft } from '@/test/db-factories';
import { loggerDrafts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { GET, PUT, DELETE } from './route';
import { DRAFT_EXPIRY_MS, type LoggerDraft } from '@/lib/logger/draft';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

// `asOtherFamily()` signs in as this Clerk user; the family row id must be a
// real UUID (the Clerk-mock's familyId metadata is not used to resolve here —
// getFamilyByClerkId looks up by clerkUserId).
const OTHER_USER_ID = 'user_other_1';
const OTHER_FAMILY_ID = '00000000-0000-4000-8000-0000000000ff';

function draft(overrides: Partial<LoggerDraft> = {}): LoggerDraft {
  return {
    description: 'Emma measured flour for pancakes',
    selectedLearners: ['l1'],
    discoveries: {},
    activityType: 'kitchen',
    lessonSubjects: [],
    engagement: { l1: 4 },
    whenDate: 'today',
    duration: null,
    location: null,
    observations: [],
    evidence: [],
    observationDetails: {},
    savedAt: 1_700_000_000_000,
    ...overrides,
  };
}

function putReq(body: unknown) {
  return new NextRequest('http://x/api/logger/draft', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/logger/draft — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    expect((await GET()).status).toBe(401);
    expect((await PUT(putReq({ draft: draft() }))).status).toBe(401);
    expect((await DELETE()).status).toBe(401);
  });

  it('returns 404 when the caller has no family row', async () => {
    asUser({});
    expect((await PUT(putReq({ draft: draft() }))).status).toBe(404);
  });

  it('GET returns null when no draft exists', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).draft).toBeNull();
  });

  it('PUT upserts and GET round-trips the draft for the same user', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const putRes = await PUT(putReq({ draft: draft({ description: 'Worm digging' }) }));
    expect(putRes.status).toBe(200);

    const getRes = await GET();
    expect((await getRes.json()).draft.description).toBe('Worm digging');

    // Second PUT overwrites (upsert on the unique clerkUserId), not duplicates.
    await PUT(putReq({ draft: draft({ description: 'Worm digging, take two', savedAt: 1_700_000_001_000 }) }));
    const rows = await db.select().from(loggerDrafts).where(eq(loggerDrafts.clerkUserId, TEST_USER_ID));
    expect(rows).toHaveLength(1);
    expect((rows[0].draftData as LoggerDraft).description).toBe('Worm digging, take two');
  });

  it('rejects a malformed draft body with 400', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await PUT(putReq({ draft: { description: 'missing required fields' } }));
    expect(res.status).toBe(400);
  });

  it('DELETE removes the caller’s draft', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    await createLoggerDraft(db, { clerkUserId: TEST_USER_ID, familyId: TEST_FAMILY_ID });

    expect((await DELETE()).status).toBe(200);
    const getRes = await GET();
    expect((await getRes.json()).draft).toBeNull();
  });

  it('treats a draft older than 7 days as absent (read-time expiry)', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    await createLoggerDraft(db, {
      clerkUserId: TEST_USER_ID,
      familyId: TEST_FAMILY_ID,
      updatedAt: new Date(Date.now() - DRAFT_EXPIRY_MS - 60_000),
    });

    const res = await GET();
    expect((await res.json()).draft).toBeNull();
  });

  it('does NOT leak one user’s draft to another user (per-user isolation)', async () => {
    // User A banks a draft.
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    await PUT(putReq({ draft: draft({ description: "A's private draft" }) }));

    // User B (different Clerk user + family) must see nothing of A's.
    await createFamily(db, { id: OTHER_FAMILY_ID, clerkUserId: OTHER_USER_ID });
    asOtherFamily();
    const bGet = await GET();
    expect((await bGet.json()).draft).toBeNull();

    // B writing their own draft must not touch A's row.
    await PUT(putReq({ draft: draft({ description: "B's draft" }) }));
    const aRows = await db.select().from(loggerDrafts).where(eq(loggerDrafts.clerkUserId, TEST_USER_ID));
    expect((aRows[0].draftData as LoggerDraft).description).toBe("A's private draft");

    // And B's DELETE must not remove A's row.
    await DELETE();
    const aStill = await db.select().from(loggerDrafts).where(eq(loggerDrafts.clerkUserId, TEST_USER_ID));
    expect(aStill).toHaveLength(1);
  });
});
