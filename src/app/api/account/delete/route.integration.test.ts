/**
 * Integration test for /api/account/delete — exercises auth → owner-only
 * guard → confirmation phrase → cascade delete against a real Neon test
 * branch. The cascade is the load-bearing piece: every family-scoped table
 * must end up empty after a successful delete.
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

  it('returns 403 when caller is a member but not the owner', async () => {
    // Owner is one user; the editor calling delete is another.
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
    expect(res.status).toBe(403);

    // Family must still exist after the rejected delete.
    const stillThere = await db.select().from(families).where(eq(families.id, family.id));
    expect(stillThere).toHaveLength(1);
  });

  it('cascade-deletes every family-scoped row on the happy path', async () => {
    const userId = `user_${randomUUID()}`;
    asUser({ userId });
    const family = await createFamily(db, { clerkUserId: userId });
    const learner = await createLearner(db, { familyId: family.id });
    await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });

    const res = await POST(jsonReq({ confirmation: 'DELETE MY ACCOUNT' }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { deleted: boolean };
    expect(body.deleted).toBe(true);

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
  });
});
