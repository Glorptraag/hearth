/**
 * DB-aware factories for integration tests.
 *
 * Unlike factories.ts which returns plain objects, these actually INSERT
 * rows into the real DB and return the inserted row (including anything
 * the DB generated: timestamps, defaults, auto-IDs).
 *
 * Use ONLY in integration tests. Unit tests should use factories.ts.
 *
 * Pattern:
 *   const family = await createFamily(db);
 *   const learner = await createLearner(db, { familyId: family.id });
 *   const entry = await createEntry(db, {
 *     familyId: family.id,
 *     learnerIds: [learner.id],
 *   });
 */
import { db as realDb } from '@/lib/db';
import {
  families,
  learners,
  learningEntries,
  badgeDefinitions,
  plannerEntries,
  familyIntelligenceSnapshots,
} from '@/lib/db/schema';
import {
  buildFamily,
  buildLearner,
  buildEntry,
  buildBadgeDefinition,
  buildPlannerEntry,
  buildSnapshot,
  type Family,
  type Learner,
  type LearningEntry,
  type BadgeDefinition,
  type PlannerEntry,
  type FamilyIntelligenceSnapshot,
} from './factories';

// The repo exports a single concrete `db` from `@/lib/db`. Callers pass it in
// so tests can swap in a transaction-scoped handle later without rewrites.
type Db = typeof realDb;

/**
 * Insert a family. Returns the full inserted row.
 * In integration tests, this is usually your first call — other factories
 * need a familyId to satisfy FK constraints.
 */
export async function createFamily(db: Db, overrides: Partial<Family> = {}): Promise<Family> {
  const row = buildFamily(overrides);
  const result = await db.insert(families).values(row).returning();
  return result[0];
}

export async function createLearner(db: Db, overrides: Partial<Learner> = {}): Promise<Learner> {
  const row = buildLearner(overrides);
  const result = await db.insert(learners).values(row).returning();
  return result[0];
}

export async function createEntry(
  db: Db,
  overrides: Partial<LearningEntry> = {}
): Promise<LearningEntry> {
  const row = buildEntry(overrides);
  const result = await db.insert(learningEntries).values(row).returning();
  return result[0];
}

export async function createBadgeDefinition(
  db: Db,
  overrides: Partial<BadgeDefinition> = {}
): Promise<BadgeDefinition> {
  const row = buildBadgeDefinition(overrides);
  const result = await db.insert(badgeDefinitions).values(row).returning();
  return result[0];
}

export async function createPlannerEntry(
  db: Db,
  overrides: Partial<PlannerEntry> = {}
): Promise<PlannerEntry> {
  const row = buildPlannerEntry(overrides);
  const result = await db.insert(plannerEntries).values(row).returning();
  return result[0];
}

export async function createSnapshot(
  db: Db,
  overrides: Partial<FamilyIntelligenceSnapshot> = {}
): Promise<FamilyIntelligenceSnapshot> {
  const row = buildSnapshot(overrides);
  const result = await db.insert(familyIntelligenceSnapshots).values(row).returning();
  return result[0];
}

// ---------------------------------------------------------------------------
// Scenario seeders — complete test scenarios in one call.
// These are the "common case" shortcuts. A test that just wants "a family
// with two kids and ten entries" shouldn't have to know about FK order.
// ---------------------------------------------------------------------------

/**
 * Seed a baseline family: one family, two learners, ten entries spread across them.
 * Returns handles so the test can target specific rows.
 */
export async function seedBasicFamily(
  db: Db,
  overrides: {
    familyId?: string;
    clerkUserId?: string;
  } = {}
) {
  const family = await createFamily(db, {
    id: overrides.familyId,
    clerkUserId: overrides.clerkUserId,
  });

  const emma = await createLearner(db, {
    familyId: family.id,
    name: 'Emma',
    dateOfBirth: '2017-06-15',
  });
  const liam = await createLearner(db, {
    familyId: family.id,
    name: 'Liam',
    dateOfBirth: '2019-03-02',
  });

  const entries: LearningEntry[] = [];
  for (let i = 0; i < 10; i++) {
    const learnerId = i % 2 === 0 ? emma.id : liam.id;
    const iso = new Date(2026, 0, i + 1).toISOString().slice(0, 10);
    entries.push(
      await createEntry(db, {
        familyId: family.id,
        learnerIds: [learnerId],
        title: `Moment ${i + 1}`,
        dateOccurred: iso,
      })
    );
  }

  return { family, learners: { emma, liam }, entries };
}

/**
 * Seed a family with entries that should trigger a badge threshold check.
 * Useful for testing the badge pipeline end-to-end.
 *
 * NOTE: The current schema tracks badge progress via `observationThreshold`
 * + `capabilityThreadIds` on the definition, and entry→thread association
 * lives downstream in the intelligence snapshot (not on the entry row).
 * Adjust this seeder once the threshold-check pipeline lands.
 */
export async function seedBadgeThresholdScenario(db: Db) {
  const { family, learners } = await seedBasicFamily(db);

  const badge = await createBadgeDefinition(db, {
    capabilityThreadIds: ['scientific-thinking'],
    observationThreshold: 3,
  });

  for (let i = 0; i < 3; i++) {
    await createEntry(db, {
      familyId: family.id,
      learnerIds: [learners.emma.id],
      subjects: ['science'],
      title: `Threshold observation ${i + 1}`,
    });
  }

  return { family, learners, badge };
}
