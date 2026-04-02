import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { heuReports, workSamples, workSampleAnnotations } from '@/lib/db/schema';
import { authenticatedFamily, parseBody, apiError } from '@/lib/api-helpers';
import { checkWritePermission } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';

type Params = { params: Promise<{ reportId: string; sampleId: string }> };

const SOURCE_VALUES = ['ai_draft', 'parent_edited', 'parent_written'] as const;

const annotationSchema = z.object({
  observations: z.string().nullable().optional(),
  observationsSource: z.enum(SOURCE_VALUES).optional(),
  needsStrengths: z.string().nullable().optional(),
  needsStrengthsSource: z.enum(SOURCE_VALUES).optional(),
  adjustment: z.string().nullable().optional(),
  adjustmentSource: z.enum(SOURCE_VALUES).optional(),
  planning: z.string().nullable().optional(),
  planningSource: z.enum(SOURCE_VALUES).optional(),
  progressionSummary: z.string().nullable().optional(),
  progressionSummaryEdited: z.boolean().optional(),
  confirmed: z.boolean().optional(),
});

// PATCH /api/report/[reportId]/samples/[sampleId] — upsert annotation
export async function PATCH(request: NextRequest, { params }: Params) {
  const result = await authenticatedFamily();
  if ('error' in result) return result.error;
  const { userId, family } = result;

  const writeCheck = await checkWritePermission(userId, family.id);
  if (!writeCheck.allowed) {
    return apiError('Insufficient permissions to update annotations', writeCheck.statusCode);
  }

  const { reportId, sampleId } = await params;

  // Verify ownership
  const report = await db.query.heuReports.findFirst({
    where: and(eq(heuReports.id, reportId), eq(heuReports.familyId, family.id)),
  });
  if (!report) return apiError('Report not found', 404);

  const sample = await db.query.workSamples.findFirst({
    where: and(eq(workSamples.id, sampleId), eq(workSamples.reportId, reportId)),
  });
  if (!sample) return apiError('Sample not found', 404);

  const body = await parseBody(request, annotationSchema);
  if ('error' in body) return body.error;
  const { confirmed, ...fields } = body.data;

  // Upsert annotation
  const existing = await db.query.workSampleAnnotations.findFirst({
    where: eq(workSampleAnnotations.workSampleId, sampleId),
  });

  let annotation;
  if (existing) {
    [annotation] = await db
      .update(workSampleAnnotations)
      .set({
        ...fields,
        ...(confirmed ? { confirmedAt: new Date() } : {}),
        updatedAt: new Date(),
      })
      .where(eq(workSampleAnnotations.id, existing.id))
      .returning();
  } else {
    [annotation] = await db
      .insert(workSampleAnnotations)
      .values({
        workSampleId: sampleId,
        ...fields,
        ...(confirmed ? { confirmedAt: new Date() } : {}),
      })
      .returning();
  }

  // Update sample status based on annotation completeness
  const hasAllFields =
    annotation.observations && annotation.needsStrengths && annotation.adjustment && annotation.planning;
  const newStatus = annotation.confirmedAt
    ? 'complete'
    : hasAllFields
      ? 'annotated'
      : 'selected';

  await db
    .update(workSamples)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(workSamples.id, sampleId));

  return NextResponse.json({ sample: { ...sample, status: newStatus }, annotation });
}
