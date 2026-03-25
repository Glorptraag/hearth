import { db } from '@/lib/db';
import { families } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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
  return db.query.families.findFirst({
    where: eq(families.clerkUserId, clerkUserId),
  });
}
