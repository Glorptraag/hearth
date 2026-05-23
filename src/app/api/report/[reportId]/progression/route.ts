import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  complianceReports,
  workSamples,
  workSampleAnnotations,
  learningEntries,
  learners,
} from '@/lib/db/schema';
import { authenticatedFamily, parseBody, apiError } from '@/lib/api-helpers';
import { checkWritePermission } from '@/lib/auth/helpers';
import { eq, and, inArray } from 'drizzle-orm';
import { generateProgressionSummary } from '@/lib/ai/annotation-draft';

type Params = { params: Promise<{ reportId: string }> };

const PAIR_SLOTS: Record<string, { early: string; late: string; label: string }> = {
  english: { early: 'early_writing', late: 'later_writing', label: 'English writing' },
  maths: { early: 'early_maths', late: 'later_maths', label: 'Mathematics' },
  choice: { early: 'early_choice', late: 'later_choice', label: 'Science / HASS' },
};

const bodySchema = z.object({
  pair: z.enum(['english', 'maths', 'choice']),
});

// POST /api/report/[reportId]/progression
// Generates the early→late progression summary for one subject pair. Stored
// on the late sample's annotation row. Refuses to overwrite if the parent
// has already edited the summary (progressionSummaryEdited === true).
export async function POST(request: NextRequest, { params }: Params) {
  const result = await authenticatedFamily();
  if ('error' in result) return result.error;
  const { userId, family } = result;

  const writeCheck = await checkWritePermission(userId, family.id);
  if (!writeCheck.allowed) {
    return apiError('Insufficient permissions to generate progression', writeCheck.statusCode);
  }

  const { reportId } = await params;
  const body = await parseBody(request, bodySchema);
  if ('error' in body) return body.error;
  const { pair } = body.data;
  const pairMeta = PAIR_SLOTS[pair];

  const report = await db.query.complianceReports.findFirst({
    where: and(eq(complianceReports.id, reportId), eq(complianceReports.familyId, family.id)),
  });
  if (!report) return apiError('Report not found', 404);

  const samples = await db.query.workSamples.findMany({
    where: and(
      eq(workSamples.reportId, reportId),
      inArray(workSamples.slot, [pairMeta.early, pairMeta.late]),
    ),
  });
  const earlySample = samples.find((s) => s.slot === pairMeta.early);
  const lateSample = samples.find((s) => s.slot === pairMeta.late);
  if (!earlySample || !lateSample) return apiError('Sample pair not found', 404);
  if (!earlySample.entryId || !lateSample.entryId) {
    return apiError('Both early and late samples must have entries selected', 400);
  }

  const annotations = await db.query.workSampleAnnotations.findMany({
    where: inArray(workSampleAnnotations.workSampleId, [earlySample.id, lateSample.id]),
  });
  const earlyAnn = annotations.find((a) => a.workSampleId === earlySample.id) ?? null;
  const lateAnn = annotations.find((a) => a.workSampleId === lateSample.id) ?? null;

  if (!earlyAnn?.confirmedAt || !lateAnn?.confirmedAt) {
    return apiError('Both samples must be confirmed before generating progression', 400);
  }
  if (lateAnn.progressionSummaryEdited) {
    return apiError('Refusing to overwrite parent-edited progression summary', 409);
  }

  const [earlyEntry, lateEntry, learner] = await Promise.all([
    db.query.learningEntries.findFirst({
      where: and(eq(learningEntries.id, earlySample.entryId), eq(learningEntries.familyId, family.id)),
    }),
    db.query.learningEntries.findFirst({
      where: and(eq(learningEntries.id, lateSample.entryId), eq(learningEntries.familyId, family.id)),
    }),
    db.query.learners.findFirst({
      where: and(eq(learners.id, report.learnerId), eq(learners.familyId, family.id)),
    }),
  ]);
  if (!earlyEntry || !lateEntry || !learner) return apiError('Entries or learner missing', 404);

  const summary = await generateProgressionSummary({
    learnerName: learner.name,
    subjectLabel: pairMeta.label,
    early: {
      title: earlyEntry.title ?? 'Untitled',
      dateISO: earlyEntry.dateOccurred,
      description: earlyEntry.description ?? null,
      observations: earlyAnn.observations,
    },
    late: {
      title: lateEntry.title ?? 'Untitled',
      dateISO: lateEntry.dateOccurred,
      description: lateEntry.description ?? null,
      observations: lateAnn.observations,
    },
  });

  if (!summary) return apiError('Progression generation failed', 502);

  const [updated] = await db
    .update(workSampleAnnotations)
    .set({
      progressionSummary: summary,
      progressionSummaryEdited: false,
      updatedAt: new Date(),
    })
    .where(eq(workSampleAnnotations.id, lateAnn.id))
    .returning();

  return NextResponse.json({ pair, summary, annotation: updated });
}
