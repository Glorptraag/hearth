/**
 * Integration test for /api/account/delete — exercises auth → confirmation
 * phrase → delete against real Postgres. Exhaustive FK coverage lives in
 * orphan-tables.integration.test.ts; ownership transfer (D1) in
 * transfer.integration.test.ts.
 *
 * Note on rate limiting: the route's `rateLimit()` keeps an in-memory
 * bucket per userId. With `isolate: false`, that map persists across test
 * files in the same worker. Each test uses a fresh randomUUID-based
 * userId so we never bump the 3/hour ceiling.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { randomUUID } from 'node:crypto';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createEntry } from '@/test/db-factories';
import {
  families,
  learners,
  learningEntries,
  familyMembers,
  familySettings,
  familyIntelligenceSnapshots,
  badgeAwards,
  badgeAssessmentLogs,
  facilitatorNotes,
  plannerEntries,
  notifications,
  familyLibrary,
  moduleDrafts,
  aiPipelineLogs,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { POST } from './route';
import { deleteUser, installAccountDeletionDoubles } from './test-support';

installAccountDeletionDoubles();

function jsonReq(body: unknown) {
  return new NextRequest('http://x/api/account/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/account/delete — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await POST(jsonReq({ confirmation: 'DELETE MY ACCOUNT' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when confirmation phrase is missing', async () => {
    const userId = `user_${randomUUID()}`;
    asUser({ userId });
    await createFamily(db, { clerkUserId: userId });

    const res = await POST(jsonReq({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 when confirmation phrase is wrong', async () => {
    const userId = `user_${randomUUID()}`;
    asUser({ userId });
    await createFamily(db, { clerkUserId: userId });

    const res = await POST(jsonReq({ confirmation: 'delete me' }));
    expect(res.status).toBe(400);
  });

  it('removes only the caller when they are a co-facilitator, not the owner', async () => {
    // Owner is one user; the editor calling delete is another. Since D1 the
    // editor may delete their own account — but never the family.
    const ownerId = `user_${randomUUID()}`;
    const editorId = `user_${randomUUID()}`;
    const family = await createFamily(db, { clerkUserId: ownerId });
    await db.insert(familyMembers).values({
      familyId: family.id,
      clerkUserId: editorId,
      email: 'editor@example.com',
      role: 'editor',
      status: 'active',
    });

    asUser({ userId: editorId });
    const res = await POST(jsonReq({ confirmation: 'DELETE MY ACCOUNT' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ deleted: true, outcome: 'member_removed' });

    const stillThere = await db.select().from(families).where(eq(families.id, family.id));
    expect(stillThere).toHaveLength(1);
    expect(stillThere[0].clerkUserId).toBe(ownerId);
    expect(await db.select().from(familyMembers).where(eq(familyMembers.familyId, family.id))).toHaveLength(0);
    expect(deleteUser).toHaveBeenCalledWith(editorId);
  });

  it('returns 404 when the caller has no family', async () => {
    asUser({ userId: `user_${randomUUID()}` });
    const res = await POST(jsonReq({ confirmation: 'DELETE MY ACCOUNT' }));
    expect(res.status).toBe(404);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('cascade-deletes every family-scoped row on the happy path', async () => {
    const userId = `user_${randomUUID()}`;
    asUser({ userId });
    const family = await createFamily(db, { clerkUserId: userId });
    const learner = await createLearner(db, { familyId: family.id });
    await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });

    const res = await POST(jsonReq({ confirmation: 'DELETE MY ACCOUNT' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: boolean; outcome: string };
    expect(body).toEqual({ deleted: true, outcome: 'family_deleted' });

    // Every table the route deletes from must be empty for this familyId
    // (or learnerId). Loop them so a missed table surfaces immediately.
    const familyId = family.id;
    const learnerId = learner.id;

    expect(await db.select().from(families).where(eq(families.id, familyId))).toHaveLength(0);
    expect(await db.select().from(learners).where(eq(learners.familyId, familyId))).toHaveLength(0);
    expect(await db.select().from(learningEntries).where(eq(learningEntries.familyId, familyId))).toHaveLength(0);
    expect(await db.select().from(familySettings).where(eq(familySettings.familyId, familyId))).toHaveLength(0);
    expect(await db.select().from(familyIntelligenceSnapshots).where(eq(familyIntelligenceSnapshots.familyId, familyId))).toHaveLength(0);
    expect(await db.select().from(plannerEntries).where(eq(plannerEntries.familyId, familyId))).toHaveLength(0);
    expect(await db.select().from(notifications).where(eq(notifications.familyId, familyId))).toHaveLength(0);
    expect(await db.select().from(familyLibrary).where(eq(familyLibrary.familyId, familyId))).toHaveLength(0);
    expect(await db.select().from(moduleDrafts).where(eq(moduleDrafts.familyId, familyId))).toHaveLength(0);
    expect(await db.select().from(familyMembers).where(eq(familyMembers.familyId, familyId))).toHaveLength(0);
    expect(await db.select().from(facilitatorNotes).where(eq(facilitatorNotes.familyId, familyId))).toHaveLength(0);
    expect(await db.select().from(aiPipelineLogs).where(eq(aiPipelineLogs.familyId, familyId))).toHaveLength(0);
    expect(await db.select().from(badgeAwards).where(eq(badgeAwards.learnerId, learnerId))).toHaveLength(0);
    expect(await db.select().from(badgeAssessmentLogs).where(eq(badgeAssessmentLogs.learnerId, learnerId))).toHaveLength(0);
    expect(deleteUser).toHaveBeenCalledWith(userId);
  });
});
