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

/**
 * Check if a user has write permission for a family.
 * Only 'owner' and 'editor' roles can write. 'viewer' is read-only.
 * Returns { allowed: true } or { allowed: false, statusCode: 403 }
 */
export async function checkWritePermission(
  clerkUserId: string,
  familyId: string
): Promise<{ allowed: true } | { allowed: false; statusCode: 403 }> {
  const role = await getFamilyRole(clerkUserId, familyId);
  if (role === 'owner' || role === 'editor') {
    return { allowed: true };
  }
  return { allowed: false, statusCode: 403 };
}

/**
 * Check if a user is the owner of a family.
 * Only owners can manage family members, settings, and account.
 * Returns { allowed: true } or { allowed: false, statusCode: 403 }
 */
export async function checkOwnerPermission(
  clerkUserId: string,
  familyId: string
): Promise<{ allowed: true } | { allowed: false; statusCode: 403 }> {
  const role = await getFamilyRole(clerkUserId, familyId);
  if (role === 'owner') {
    return { allowed: true };
  }
  return { allowed: false, statusCode: 403 };
}
