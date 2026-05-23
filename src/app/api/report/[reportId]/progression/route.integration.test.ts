/**
 * Integration test for POST /api/report/[reportId]/progression.
 *
 * Verifies that progression generation requires BOTH samples in a pair to
 * be confirmed, stores the summary on the late sample's annotation row,
 * and refuses to overwrite when the parent has edited the summary.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createEntry } from '@/test/db-factories';
import { complianceReports, workSamples, workSampleAnnotations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { POST } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../../vitest.setup';

function mockProgressionResponse() {
  // Must be a regular function (not arrow) so the route's `new Anthropic()` works.
  vi.mocked(Anthropic).mockImplementation(function () {
    return {
      messages: {
        create: vi.fn(async () => ({
          id: 'msg_progression',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'From early counting in March to multi-step word problems in October — Sam now sustains attention across three-step calculations without needing to restart.' }],
          model: 'claude-haiku-4-5-20251001',
          stop_reason: 'end_turn',
          usage: { input_tokens: 100, output_tokens: 40 },
        })),
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  });
}

async function seedConfirmedPair() {
  await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
  const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'Sam' });
  const earlyEntry = await createEntry(db, {
    familyId: TEST_FAMILY_ID,
    learnerIds: [learner.id],
    title: 'Counting jellybeans',
    subjects: ['mathematics'],
    status: 'complete',
    dateOccurred: '2026-03-10',
  });
  const lateEntry = await createEntry(db, {
    familyId: TEST_FAMILY_ID,
    learnerIds: [learner.id],
    title: 'Word problems with milk and biscuits',
    subjects: ['mathematics'],
    status: 'complete',
    dateOccurred: '2026-10-04',
  });
  const [report] = await db.insert(complianceReports).values({
    familyId: TEST_FAMILY_ID,
    learnerId: learner.id,
    reportYear: 2026,
  }).returning();
  const [early] = await db.insert(workSamples).values({
    reportId: report.id, slot: 'early_maths', entryId: earlyEntry.id, status: 'complete',
  }).returning();
  const [late] = await db.insert(workSamples).values({
    reportId: report.id, slot: 'later_maths', entryId: lateEntry.id, status: 'complete',
  }).returning();
  await db.insert(workSampleAnnotations).values([
    { workSampleId: early.id, observations: 'Counted 1-20.', confirmedAt: new Date() },
    { workSampleId: late.id, observations: 'Multi-step.', confirmedAt: new Date() },
  ]);
  return { report, early, late };
}

function req(pair: string) {
  return new NextRequest('http://x/progression', {
    method: 'POST',
    body: JSON.stringify({ pair }),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/report/[reportId]/progression', () => {
  beforeEach(() => {
    mockProgressionResponse();
  });

  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await POST(req('maths'), { params: Promise.resolve({ reportId: 'r' }) });
    expect(res!.status).toBe(401);
  });

  it('stores summary on the late sample annotation', async () => {
    asUser({});
    const { report, late } = await seedConfirmedPair();

    const res = await POST(req('maths'), { params: Promise.resolve({ reportId: report.id }) });
    expect(res!.status).toBe(200);

    const ann = await db.query.workSampleAnnotations.findFirst({
      where: eq(workSampleAnnotations.workSampleId, late.id),
    });
    expect(ann?.progressionSummary).toContain('Sam');
    expect(ann?.progressionSummaryEdited).toBe(false);
  });

  it('refuses to overwrite a parent-edited summary', async () => {
    asUser({});
    const { report, late } = await seedConfirmedPair();
    await db.update(workSampleAnnotations)
      .set({ progressionSummary: 'parent prose', progressionSummaryEdited: true })
      .where(eq(workSampleAnnotations.workSampleId, late.id));

    const res = await POST(req('maths'), { params: Promise.resolve({ reportId: report.id }) });
    expect(res!.status).toBe(409);
  });

  it('refuses when both samples are not confirmed', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });
    const earlyEntry = await createEntry(db, { familyId: TEST_FAMILY_ID, learnerIds: [learner.id], status: 'complete', subjects: ['mathematics'] });
    const lateEntry = await createEntry(db, { familyId: TEST_FAMILY_ID, learnerIds: [learner.id], status: 'complete', subjects: ['mathematics'] });
    const [report] = await db.insert(complianceReports).values({ familyId: TEST_FAMILY_ID, learnerId: learner.id, reportYear: 2026 }).returning();
    await db.insert(workSamples).values([
      { reportId: report.id, slot: 'early_maths', entryId: earlyEntry.id, status: 'selected' },
      { reportId: report.id, slot: 'later_maths', entryId: lateEntry.id, status: 'selected' },
    ]);

    const res = await POST(req('maths'), { params: Promise.resolve({ reportId: report.id }) });
    expect(res!.status).toBe(400);
  });
});
