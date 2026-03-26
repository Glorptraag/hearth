import { db } from '@/lib/db';
import { badgeDefinitions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { SEED_BADGES } from '@/lib/seed-badges';

/**
 * Resolves a badge ID to a real database UUID.
 * For seed badges (prefixed "badge-"), auto-creates a badge_definitions row
 * so FK constraints are satisfied.
 */
export async function resolveBadgeDefinitionId(
  badgeId: string,
  familyId: string
): Promise<string> {
  const seed = SEED_BADGES.find((b) => b.id === badgeId);
  if (!seed) return badgeId; // already a UUID

  // Check if we already created a DB record for this seed badge + family
  const existing = await db.query.badgeDefinitions.findFirst({
    where: eq(badgeDefinitions.criteriaSummary, `seed:${seed.id}`),
  });
  if (existing) return existing.id;

  // Create a real badge definition from seed data
  const [created] = await db
    .insert(badgeDefinitions)
    .values({
      familyId,
      title: seed.name,
      emoji: seed.emoji,
      description: `${seed.threadName} badge`,
      criteriaSummary: `seed:${seed.id}`,
      indicatorStatements: seed.assessmentQuestions.map((q) => q.question),
      capabilityThreadIds: [seed.threadId],
      observationThreshold: seed.requiredObservations,
    })
    .returning();

  return created.id;
}
