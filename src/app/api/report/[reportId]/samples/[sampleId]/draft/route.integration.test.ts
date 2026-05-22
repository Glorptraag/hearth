/**
 * Integration test for POST /api/report/[reportId]/samples/[sampleId]/draft.
 *
 * Verifies the Haiku-drafted annotation persists with all four
 * `*Source='ai_draft'` markers and that re-drafting refuses to overwrite a
 * parent-edited annotation.
 *
 * The Anthropic mock is overridden in the success path so the test gets
 * a deterministic shape.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createEntry } from '@/test/db-factories';
import { complianceReports, workSamples, workSampleAnnotations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { POST } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../../../../vitest.setup';

// Override the global Anthropic mock for this file
vi.mock('@anthropic-ai/sdk', () => {
  const MockAnthropic = vi.fn(() => ({
    messages: {
      create: vi.fn(async () => ({
        id: 'msg_test_draft',
        type: 'message',
        role: 'assistant',
        content: [{
          type: 'text',
          text: JSON.stringify({
            observations: 'I noticed Sam working through magnet pairings with focused attention. They paused often to test attractions.',
            needsStrengths: 'Sam was visibly engaged. They asked thoughtful follow-up questions about why some objects did not respond.',
            adjustment: 'I followed their lead and pulled out a few more household items to extend the test rather than steering back to the worksheet.',
            planning: 'Next week we might build a simple compass to extend the conversation from attraction to direction.',
          }),
        }],
        model: 'claude-haiku-4-5-20251001',
        stop_reason: 'end_turn',
        usage: { input_tokens: 100, output_tokens: 200 },
      })),
    },
  }));
  return { default: MockAnthropic, Anthropic: MockAnthropic };
});

async function seedReportWithSample() {
  await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
  const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'Sam' });
  const entry = await createEntry(db, {
    familyId: TEST_FAMILY_ID,
    learnerIds: [learner.id],
    title: 'Magnets on the fridge',
    description: 'Sam tested twelve objects with the magnet.',
    subjects: ['science'],
    status: 'complete',
    dateOccurred: '2026-03-15',
  });
  const [report] = await db.insert(complianceReports).values({
    familyId: TEST_FAMILY_ID,
    learnerId: learner.id,
    reportYear: 2026,
  }).returning();
  const [sample] = await db.insert(workSamples).values({
    reportId: report.id,
    slot: 'early_choice',
    entryId: entry.id,
    status: 'selected',
  }).returning();
  return { report, sample, learner, entry };
}

function getReq() {
  return new NextRequest('http://x/draft', { method: 'POST' });
}

describe('POST /api/report/[reportId]/samples/[sampleId]/draft', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await POST(getReq(), {
      params: Promise.resolve({ reportId: 'r', sampleId: 's' }),
    });
    expect(res!.status).toBe(401);
  });

  it('writes a draft annotation with all four ai_draft markers', async () => {
    asUser({});
    const { report, sample } = await seedReportWithSample();

    const res = await POST(getReq(), {
      params: Promise.resolve({ reportId: report.id, sampleId: sample.id }),
    });
    expect(res!.status).toBe(200);

    const ann = await db.query.workSampleAnnotations.findFirst({
      where: eq(workSampleAnnotations.workSampleId, sample.id),
    });
    expect(ann).toBeTruthy();
    expect(ann?.observationsSource).toBe('ai_draft');
    expect(ann?.needsStrengthsSource).toBe('ai_draft');
    expect(ann?.adjustmentSource).toBe('ai_draft');
    expect(ann?.planningSource).toBe('ai_draft');
    expect(ann?.observations).toContain('Sam');

    const updatedSample = await db.query.workSamples.findFirst({
      where: eq(workSamples.id, sample.id),
    });
    expect(updatedSample?.status).toBe('annotated');
  });

  it('refuses to overwrite a parent-edited annotation', async () => {
    asUser({});
    const { report, sample } = await seedReportWithSample();

    await db.insert(workSampleAnnotations).values({
      workSampleId: sample.id,
      observations: 'My own words.',
      observationsSource: 'parent_written',
    });

    const res = await POST(getReq(), {
      params: Promise.resolve({ reportId: report.id, sampleId: sample.id }),
    });
    expect(res!.status).toBe(409);
  });

  it('returns 400 when sample has no entry selected', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });
    const [report] = await db.insert(complianceReports).values({
      familyId: TEST_FAMILY_ID,
      learnerId: learner.id,
      reportYear: 2026,
    }).returning();
    const [sample] = await db.insert(workSamples).values({
      reportId: report.id,
      slot: 'early_writing',
      status: 'empty',
    }).returning();

    const res = await POST(getReq(), {
      params: Promise.resolve({ reportId: report.id, sampleId: sample.id }),
    });
    expect(res!.status).toBe(400);
  });
});
