/**
 * INTEGRATION: `learning_entries.subjects` is filled from enrichment.
 *
 * The Logger no longer asks the parent to pick a subject, so an entry saved
 * with `subjects: []` relies on enrichEntry() to fill the column from Haiku's
 * `subjects_detected` (display text normalised onto the lowercase SUBJECTS
 * enum by `subjectsFill`). A writer-set value (module runner, batch log, CSV
 * import, Portfolio edit) must never be overwritten. This test drives the real
 * enrichEntry against a real Postgres and reads the column back.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { learningEntries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createFamily, createLearner, createEntry } from '@/test/db-factories';
import { enrichEntry } from '../enrich';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../vitest.setup';

// ─── Fixtures (vi.hoisted so vi.mock factories below can reference them —
// vi.mock calls are hoisted above regular top-level statements). The mock
// reads `mockState.subjectsDetected` at call time so each test can set what
// the model "detects". ───
const { mockState, buildEnrichment } = vi.hoisted(() => {
  const mockState: { subjectsDetected: string[] } = { subjectsDetected: [] };
  const buildEnrichment = () => ({
    subjects_detected: mockState.subjectsDetected,
    capability_threads: [{ thread_id: 'S1', confidence: 0.8 }],
    curriculum_descriptors: [],
    per_child_signals: {
      TestChild: { engagement_score: 0.8, complexity_level: 'developing', notable: null },
    },
    insight_suggestions: ['Counted the paperclips before and after the magnet passed.'],
    confidence: 0.85,
    quality_indicators: {
      description_richness: 'adequate',
      evidence_present: false,
      multi_subject: false,
    },
    journey_observation: null,
    discrete_learning_objectives: [],
    work_sample: { flag: false, quality: 0.4, rationale: 'Clear but thin observation.' },
  });
  return { mockState, buildEnrichment };
});

// An in-file mock supersedes the setup-level canned Anthropic response
// (vitest.setup.ts), which is not a complete EnrichmentResult shape and
// would fail validateEnrichment's implicit expectations for this pipeline.
//
// enrich.ts does `new Anthropic()` — the mock constructor must be a real
// `class`/`function`, not `vi.fn(() => ({...}))` (an arrow-function
// implementation), which Vitest 4 cannot invoke with `new`.
vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = {
      create: vi.fn(async () => ({
        id: 'msg_test_subjects_fill',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: JSON.stringify(buildEnrichment()) }],
        model: 'claude-haiku-4-5-20251001',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 50 },
      })),
    };
  }
  return { default: MockAnthropic, Anthropic: MockAnthropic };
});

beforeEach(() => {
  vi.clearAllMocks();
  mockState.subjectsDetected = [];
});

describe('INTEGRATION: enrichment fills learning_entries.subjects', () => {
  it('fills an empty subjects column from subjects_detected, normalised onto the enum', async () => {
    mockState.subjectsDetected = ['Mathematics', 'The Arts', 'Underwater basket weaving'];

    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'TestChild' });
    const entry = await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learner.id],
      subjects: [],
      title: 'Paperclip magnets',
      description: 'Counted paperclips the magnet could lift, then painted the pattern they made.',
    });

    // ─── Act: run the real enrichment pipeline against the real DB ───
    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });

    // ─── Assert PERSIST: the column was filled, unknown display text dropped ───
    const row = await db.query.learningEntries.findFirst({
      where: eq(learningEntries.id, entry.id),
    });
    expect(row?.subjects).toEqual(['mathematics', 'arts']);
    expect((row?.aiEnrichment as { status?: string } | null)?.status).toBe('enriched');
  });

  it('never overwrites a writer-set subjects value', async () => {
    mockState.subjectsDetected = ['Mathematics'];

    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'TestChild' });
    const entry = await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learner.id],
      subjects: ['science'],
      title: 'Paperclip magnets',
      description: 'Counted paperclips the magnet could lift and recorded the tally.',
    });

    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });

    const row = await db.query.learningEntries.findFirst({
      where: eq(learningEntries.id, entry.id),
    });
    expect(row?.subjects).toEqual(['science']);
    expect((row?.aiEnrichment as { subjects_detected?: string[] } | null)?.subjects_detected).toEqual([
      'Mathematics',
    ]);
  });
});
