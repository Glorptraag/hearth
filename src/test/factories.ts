/**
 * Pure object factories.
 *
 * Every factory returns a plain object matching a Drizzle schema row shape,
 * with defaults chosen to be valid. Overrides via the argument let tests
 * tweak exactly the field under test and leave the rest alone.
 *
 * Use these for UNIT tests — feed the object to a function, assert output.
 *
 * For INTEGRATION tests, use src/test/db-factories.ts instead, which
 * actually inserts rows and returns what the DB produced (including
 * DB-generated defaults like timestamps and UUIDs).
 *
 * Design notes:
 *   - IDs are deterministic counters by default, not random. This makes
 *     test failures reproducible — same run, same IDs.
 *   - Timestamps default to a fixed epoch date, also for reproducibility.
 *   - Factories compose: buildEntry({ learnerIds: [buildLearner().id] }).
 *   - Types come from Drizzle via `InferSelectModel` — if the schema changes,
 *     TypeScript surfaces the drift at compile time.
 */
import type { InferSelectModel } from 'drizzle-orm';
import {
  families,
  learners,
  learningEntries,
  badgeDefinitions,
  plannerEntries,
  familyIntelligenceSnapshots,
} from '@/lib/db/schema';
import { TEST_FAMILY_ID, TEST_USER_ID } from '../../vitest.setup';

export type Family = InferSelectModel<typeof families>;
export type Learner = InferSelectModel<typeof learners>;
export type LearningEntry = InferSelectModel<typeof learningEntries>;
export type BadgeDefinition = InferSelectModel<typeof badgeDefinitions>;
export type PlannerEntry = InferSelectModel<typeof plannerEntries>;
export type FamilyIntelligenceSnapshot = InferSelectModel<typeof familyIntelligenceSnapshots>;

// ---------------------------------------------------------------------------
// ID generation — deterministic per-test, reset by the module reset below
// ---------------------------------------------------------------------------
const counters = new Map<string, number>();

function nextId(prefix: string): string {
  const current = counters.get(prefix) ?? 0;
  const next = current + 1;
  counters.set(prefix, next);
  return `${prefix}_test_${next.toString().padStart(4, '0')}`;
}

/**
 * Call in `beforeEach` if you want strictly deterministic IDs across tests.
 * Without this, IDs accumulate across the whole test file (which is often
 * fine — they're still unique).
 */
export function resetFactoryCounters() {
  counters.clear();
}

const EPOCH = new Date('2026-01-01T00:00:00Z');
const EPOCH_DATE = '2026-01-01'; // PostgreSQL `date` columns round-trip as ISO strings

// ---------------------------------------------------------------------------
// Domain-specific factories. Shapes come from src/lib/db/schema.ts via
// InferSelectModel — field drift is caught at compile time.
// ---------------------------------------------------------------------------

export function buildFamily(overrides: Partial<Family> = {}): Family {
  return {
    id: overrides.id ?? TEST_FAMILY_ID,
    clerkUserId: TEST_USER_ID,
    familyName: 'Test Family',
    onboardingComplete: true,
    welcomeCompletedAt: EPOCH,
    loggerDefaultMode: null,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    ...overrides,
  };
}

export function buildLearner(overrides: Partial<Learner> = {}): Learner {
  return {
    id: overrides.id ?? nextId('learner'),
    familyId: TEST_FAMILY_ID,
    name: 'Emma',
    dateOfBirth: '2017-06-15', // ~age 8
    shapeIcon: 'circle',
    colourToken: 'spiral-ember',
    displayOrder: 0,
    profileData: {
      about: '',
      workingStyle: [],
      interests: [],
      strengths: [],
      notes: '',
      tagline: null,
      facilitatorNotes: null,
      sparks: [],
      attentionWindowStart: null,
      attentionWindowEnd: null,
      preferredTimes: null,
      stylePreferences: null,
      tierOverrides: null,
    },
    createdAt: EPOCH,
    updatedAt: EPOCH,
    ...overrides,
  };
}

export function buildEntry(overrides: Partial<LearningEntry> = {}): LearningEntry {
  return {
    id: overrides.id ?? nextId('entry'),
    familyId: TEST_FAMILY_ID,
    title: 'A magnetic moment',
    description: 'Built a simple circuit with a magnet and some paperclips.',
    dateOccurred: EPOCH_DATE,
    subjects: ['science'],
    learnerIds: [],
    engagementPerLearner: {},
    discoveriesPerLearner: {},
    evidenceUrls: [],
    source: 'logger',
    sourceModuleId: null,
    sourceProjectId: null,
    sourceStageNumber: null,
    sourceSessionId: null,
    status: 'draft',
    observationDetails: {},
    aiEnrichment: null,
    workSampleCandidate: false,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    ...overrides,
  };
}

export function buildBadgeDefinition(overrides: Partial<BadgeDefinition> = {}): BadgeDefinition {
  return {
    id: overrides.id ?? nextId('badge'),
    familyId: null, // null = system badge; set to a family id for custom badges
    title: 'First Discovery',
    description: 'For making the first curious observation.',
    emoji: '🔭',
    criteriaSummary: 'Record 5 observations that show curious inquiry.',
    indicatorStatements: ['Asks a question about something they notice'],
    capabilityThreadIds: ['scientific-thinking'],
    observationThreshold: 5,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    ...overrides,
  };
}

export function buildPlannerEntry(overrides: Partial<PlannerEntry> = {}): PlannerEntry {
  return {
    id: overrides.id ?? nextId('plan'),
    familyId: TEST_FAMILY_ID,
    date: EPOCH_DATE,
    title: 'Morning session',
    moduleId: null,
    activityId: null,
    learnerIds: [],
    status: 'planned',
    session: 'morning',
    subjects: [],
    notes: null,
    displayOrder: 0,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    ...overrides,
  };
}

export function buildSnapshot(
  overrides: Partial<FamilyIntelligenceSnapshot> = {}
): FamilyIntelligenceSnapshot {
  return {
    id: overrides.id ?? nextId('snap'),
    familyId: TEST_FAMILY_ID,
    snapshotData: {},
    rebuiltAt: null,
    rebuildTrigger: null,
    snapshotVersion: 1,
    createdAt: EPOCH,
    updatedAt: EPOCH,
    ...overrides,
  };
}
