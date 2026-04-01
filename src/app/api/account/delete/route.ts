import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import {
  families,
  learners,
  familySettings,
  learningEntries,
  familyIntelligenceSnapshots,
  aiPipelineLogs,
  plannerEntries,
  notifications,
  familyLibrary,
  moduleDrafts,
  familyMembers,
  facilitatorNotes,
  badgeAwards,
  badgeAssessmentLogs,
} from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, inArray } from 'drizzle-orm';

const deleteSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT'),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = rateLimit(`account-delete:${userId}`, { limit: 3, windowMs: 3600_000 });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  // Only the owner can delete
  if (family.clerkUserId !== userId) {
    return NextResponse.json({ error: 'Only the family owner can delete the account' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Type "DELETE MY ACCOUNT" to confirm' }, { status: 400 });
  }

  const familyId = family.id;

  // Get learner IDs for child-table cleanup
  const familyLearners = await db
    .select({ id: learners.id })
    .from(learners)
    .where(eq(learners.familyId, familyId));
  const learnerIds = familyLearners.map((l) => l.id);

  // Delete in dependency order (children before parents)
  // 1. Tables that reference learners (and learningEntries via sourceEntryId)
  if (learnerIds.length > 0) {
    await db.delete(badgeAssessmentLogs).where(inArray(badgeAssessmentLogs.learnerId, learnerIds));
    await db.delete(badgeAwards).where(inArray(badgeAwards.learnerId, learnerIds));
    await db.delete(facilitatorNotes).where(eq(facilitatorNotes.familyId, familyId));
  }

  // 2. Tables that reference families directly (entries after observations due to FK)
  await db.delete(learningEntries).where(eq(learningEntries.familyId, familyId));
  await db.delete(plannerEntries).where(eq(plannerEntries.familyId, familyId));
  await db.delete(notifications).where(eq(notifications.familyId, familyId));
  await db.delete(familyLibrary).where(eq(familyLibrary.familyId, familyId));
  await db.delete(moduleDrafts).where(eq(moduleDrafts.familyId, familyId));
  await db.delete(familyMembers).where(eq(familyMembers.familyId, familyId));
  await db.delete(aiPipelineLogs).where(eq(aiPipelineLogs.familyId, familyId));
  await db.delete(familyIntelligenceSnapshots).where(eq(familyIntelligenceSnapshots.familyId, familyId));
  await db.delete(familySettings).where(eq(familySettings.familyId, familyId));

  // 3. Learners
  await db.delete(learners).where(eq(learners.familyId, familyId));

  // 4. Family itself
  await db.delete(families).where(eq(families.id, familyId));

  // Note: Clerk user deletion should be handled separately by the client
  // using Clerk's deleteUser API or by the user through Clerk's UI

  return NextResponse.json({ deleted: true });
}
