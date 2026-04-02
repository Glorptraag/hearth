import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { heuReports, workSamples, workSampleAnnotations, learningEntries } from '@/lib/db/schema';
import { authenticatedFamily, parseBody, apiError } from '@/lib/api-helpers';
import { checkWritePermission } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';

type Params = { params: Promise<{ reportId: string }> };

// GET /api/report/[reportId]/samples — all samples with annotations
export async function GET(request: NextRequest, { params }: Params) {
  const result = await authenticatedFamily();
  if ('error' in result) return result.error;
  const { family } = result;

  const { reportId } = await params;

  const report = await db.query.heuReports.findFirst({
    where: and(eq(heuReports.id, reportId), eq(heuReports.familyId, family.id)),
  });
  if (!report) return apiError('Report not found', 404);

  const samples = await db.query.workSamples.findMany({
    where: eq(workSamples.reportId, reportId),
  });

  // Fetch annotations for each sample that has one
  const sampleIds = samples.map((s) => s.id);
  const annotations = sampleIds.length
    ? await db.query.workSampleAnnotations.findMany({
        where: (a, { inArray }) => inArray(a.workSampleId, sampleIds),
      })
    : [];

  const annotationMap = new Map(annotations.map((a) => [a.workSampleId, a]));

  const enriched = samples.map((s) => ({
    ...s,
    annotation: annotationMap.get(s.id) ?? null,
  }));

  return NextResponse.json(enriched);
}

const assignSampleSchema = z.object({
  slot: z.string(),
  entryId: z.string().uuid().nullable(),
});

// PATCH /api/report/[reportId]/samples — assign or clear an entry on a slot
export async function PATCH(request: NextRequest, { params }: Params) {
  const result = await authenticatedFamily();
  if ('error' in result) return result.error;
  const { userId, family } = result;

  const writeCheck = await checkWritePermission(userId, family.id);
  if (!writeCheck.allowed) {
    return apiError('Insufficient permissions to assign samples', writeCheck.statusCode);
  }

  const { reportId } = await params;

  const report = await db.query.heuReports.findFirst({
    where: and(eq(heuReports.id, reportId), eq(heuReports.familyId, family.id)),
  });
  if (!report) return apiError('Report not found', 404);

  const body = await parseBody(request, assignSampleSchema);
  if ('error' in body) return body.error;
  const { slot, entryId } = body.data;

  // Verify entryId belongs to this family
  if (entryId) {
    const entry = await db.query.learningEntries.findFirst({
      where: and(eq(learningEntries.id, entryId), eq(learningEntries.familyId, family.id)),
    });
    if (!entry) return apiError('Entry not found', 404);
  }

  // Check for cross-slot conflict (same entry assigned to another slot)
  if (entryId) {
    const conflict = await db.query.workSamples.findFirst({
      where: and(
        eq(workSamples.reportId, reportId),
        eq(workSamples.entryId, entryId),
      ),
    });
    if (conflict && conflict.slot !== slot) {
      return apiError(
        `This entry is already assigned to the "${conflict.slot}" slot. Remove it there first.`,
        409,
      );
    }
  }

  const sample = await db.query.workSamples.findFirst({
    where: and(eq(workSamples.reportId, reportId), eq(workSamples.slot, slot)),
  });
  if (!sample) return apiError('Slot not found', 404);

  const newStatus = entryId ? 'selected' : 'empty';

  const [updated] = await db
    .update(workSamples)
    .set({ entryId, status: newStatus, updatedAt: new Date() })
    .where(eq(workSamples.id, sample.id))
    .returning();

  return NextResponse.json(updated);
}
