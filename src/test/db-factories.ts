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
  moduleRuns,
  learningEntryEvidence,
  familyLibrary,
  facilitatorNotes,
} from '@/lib/db/schema';
import { encryptField } from '@/lib/crypto/field-encryption';
import {
  buildFamily,
  buildLearner,
  buildEntry,
  buildBadgeDefinition,
  buildPlannerEntry,
  buildSnapshot,
  buildModuleRun,
  buildEvidence,
  buildFacilitatorNote,
  type Family,
  type Learner,
  type LearningEntry,
  type BadgeDefinition,
  type PlannerEntry,
  type FamilyIntelligenceSnapshot,
  type ModuleRun,
  type LearningEntryEvidence,
  type FacilitatorNote,
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

/**
 * Insert a module_runs row. Defaults to a sustained active run.
 * For the open-ended drop-and-pickup variant, pass `{ sessionType: 'open_ended' }`.
 */
export async function createModuleRun(
  db: Db,
  overrides: Partial<ModuleRun> = {}
): Promise<ModuleRun> {
  const row = buildModuleRun(overrides);
  const result = await db.insert(moduleRuns).values(row).returning();
  return result[0];
}

/**
 * Insert a learning_entry_evidence row. `entryId` is required via overrides
 * (the FK has no sensible default that won't violate the FK constraint).
 */
export async function createEvidence(
  db: Db,
  overrides: Partial<LearningEntryEvidence> & { entryId: string }
): Promise<LearningEntryEvidence> {
  const row = buildEvidence(overrides);
  const result = await db.insert(learningEntryEvidence).values(row).returning();
  return result[0];
}

/**
 * Insert a facilitator_notes row. `learnerId` is required via overrides (the FK
 * has no default that resolves). The note is encrypted at rest — `noteText`
 * goes in through `encryptField`, matching how a real write path must store it.
 */
export async function createFacilitatorNote(
  db: Db,
  overrides: Partial<FacilitatorNote> & { learnerId: string }
): Promise<FacilitatorNote> {
  const row = buildFacilitatorNote(overrides);
  const result = await db
    .insert(facilitatorNotes)
    .values({ ...row, noteText: encryptField(row.noteText) })
    .returning();
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

  // Batch the two learners into a single INSERT (one round-trip, not two).
  // .returning() preserves values() order, so the destructure stays stable.
  const [emma, liam] = await db
    .insert(learners)
    .values([
      buildLearner({ familyId: family.id, name: 'Emma', dateOfBirth: '2017-06-15' }),
      buildLearner({ familyId: family.id, name: 'Liam', dateOfBirth: '2019-03-02' }),
    ])
    .returning();

  // Build all ten entry rows up front, then insert them in one round-trip
  // instead of ten sequential awaits.
  const entryRows = Array.from({ length: 10 }, (_, i) =>
    buildEntry({
      familyId: family.id,
      learnerIds: [i % 2 === 0 ? emma.id : liam.id],
      title: `Moment ${i + 1}`,
      dateOccurred: new Date(2026, 0, i + 1).toISOString().slice(0, 10),
    })
  );
  const entries = await db.insert(learningEntries).values(entryRows).returning();

  return { family, learners: { emma, liam }, entries };
}

/**
 * Seed a family with one learner, an in-library module, an active module run,
 * and one quick-capture evidence row attached to a draft entry. Useful for
 * tests that need a "in-flight session" state without setting it up by hand.
 */
export async function seedActiveModuleRun(
  db: Db,
  overrides: { familyId?: string; clerkUserId?: string; sanityModuleId?: string } = {}
) {
  const family = await createFamily(db, {
    id: overrides.familyId,
    clerkUserId: overrides.clerkUserId,
  });
  const learner = await createLearner(db, { familyId: family.id, name: 'Test Child' });

  const sanityModuleId = overrides.sanityModuleId ?? 'mod-test-active-run';

  // family_library row for the module so the run reflects "in your library"
  await db.insert(familyLibrary).values({
    familyId: family.id,
    sanityPackId: null,
    sanityModuleId,
  });

  const run = await createModuleRun(db, {
    familyId: family.id,
    sanityModuleId,
    learnerIds: [learner.id],
    state: 'active',
    sessionType: 'sustained',
  });

  const entry = await createEntry(db, {
    familyId: family.id,
    learnerIds: [learner.id],
    moduleRunId: run.id,
    sourceModuleId: sanityModuleId,
    status: 'draft',
    title: 'Mid-session capture',
  });

  const evidence = await createEvidence(db, {
    entryId: entry.id,
    kind: 'note',
    content: 'Child noticed two magnets repelling.',
  });

  return { family, learner, run, entry, evidence };
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

  // Batch the three threshold entries into one INSERT.
  const thresholdRows = Array.from({ length: 3 }, (_, i) =>
    buildEntry({
      familyId: family.id,
      learnerIds: [learners.emma.id],
      subjects: ['science'],
      title: `Threshold observation ${i + 1}`,
    })
  );
  await db.insert(learningEntries).values(thresholdRows).returning();

  return { family, learners, badge };
}
