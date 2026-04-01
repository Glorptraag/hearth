import { db } from '@/lib/db';
import { families, familyMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function getOrCreateFamily(
  clerkUserId: string,
  familyName?: string
) {
  const existing = await db.query.families.findFirst({
    where: eq(families.clerkUserId, clerkUserId),
  });

  if (existing) return existing;

  const [created] = await db
    .insert(families)
    .values({
      clerkUserId,
      familyName: familyName ?? 'My Family',
    })
    .returning();

  return created;
}

export async function getFamilyByClerkId(clerkUserId: string) {
  // Check ownership first
  const owned = await db.query.families.findFirst({
    where: eq(families.clerkUserId, clerkUserId),
  });
  if (owned) return owned;

  // Check co-facilitator membership
  const membership = await db.query.familyMembers.findFirst({
    where: and(
      eq(familyMembers.clerkUserId, clerkUserId),
      eq(familyMembers.status, 'active')
    ),
  });
  if (!membership) return undefined;

  return db.query.families.findFirst({
    where: eq(families.id, membership.familyId),
  });
}

export async function getFamilyRole(
  clerkUserId: string,
  familyId: string
): Promise<'owner' | 'editor' | 'viewer' | null> {
  const family = await db.query.families.findFirst({
    where: eq(families.id, familyId),
  });
  if (family?.clerkUserId === clerkUserId) return 'owner';

  const membership = await db.query.familyMembers.findFirst({
    where: and(
      eq(familyMembers.familyId, familyId),
      eq(familyMembers.clerkUserId, clerkUserId),
      eq(familyMembers.status, 'active')
    ),
  });
  return (membership?.role as 'editor' | 'viewer') ?? null;
}
