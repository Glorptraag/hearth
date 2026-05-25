import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  complianceReports,
  workSamples,
  workSampleAnnotations,
  learningEntries,
  learners,
} from '@/lib/db/schema';
import { authenticatedFamily, apiError, routeHandler } from '@/lib/api-helpers';
import { checkWritePermission } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';
import { generateAnnotationDraft } from '@/lib/ai/annotation-draft';

type Params = { params: Promise<{ reportId: string; sampleId: string }> };

const SLOT_META: Record<string, { subjectArea: string; termHalf: 'early' | 'late' }> = {
  early_writing: { subjectArea: 'english', termHalf: 'early' },
  later_writing: { subjectArea: 'english', termHalf: 'late' },
  early_maths: { subjectArea: 'mathematics', termHalf: 'early' },
  later_maths: { subjectArea: 'mathematics', termHalf: 'late' },
  early_choice: { subjectArea: 'science', termHalf: 'early' },
  later_choice: { subjectArea: 'science', termHalf: 'late' },
};

type EnrichmentShape = { subjects_detected?: string[] } | null;

// POST /api/report/[reportId]/samples/[sampleId]/draft
// Generates a Haiku-drafted annotation for the selected entry. All four
// fields are saved with source='ai_draft' so the UI can mark them.
export const POST = routeHandler(async (_request: NextRequest, { params }: Params) => {
  const result = await authenticatedFamily();
  if ('error' in result) return result.error;
  const { userId, family } = result;

  const writeCheck = await checkWritePermission(userId, family.id);
  if (!writeCheck.allowed) {
    return apiError('Insufficient permissions to draft annotations', writeCheck.statusCode);
  }

  const { reportId, sampleId } = await params;

  const report = await db.query.complianceReports.findFirst({
    where: and(eq(complianceReports.id, reportId), eq(complianceReports.familyId, family.id)),
  });
  if (!report) return apiError('Report not found', 404);

  const sample = await db.query.workSamples.findFirst({
    where: and(eq(workSamples.id, sampleId), eq(workSamples.reportId, reportId)),
  });
  if (!sample) return apiError('Sample not found', 404);
  if (!sample.entryId) return apiError('Sample has no entry selected', 400);

  const meta = SLOT_META[sample.slot];
  if (!meta) return apiError(`Unknown slot ${sample.slot}`, 400);

  const [entry, learner] = await Promise.all([
    db.query.learningEntries.findFirst({
      where: and(eq(learningEntries.id, sample.entryId), eq(learningEntries.familyId, family.id)),
    }),
    db.query.learners.findFirst({
      where: and(eq(learners.id, report.learnerId), eq(learners.familyId, family.id)),
    }),
  ]);
  if (!entry || !learner) return apiError('Entry or learner missing', 404);

  // Refuse to overwrite parent-authored text without explicit override
  const existing = await db.query.workSampleAnnotations.findFirst({
    where: eq(workSampleAnnotations.workSampleId, sampleId),
  });
  if (existing) {
    const parentTouched = (
      [
        existing.observationsSource,
        existing.needsStrengthsSource,
        existing.adjustmentSource,
        existing.planningSource,
      ] as (string | null)[]
    ).some((s) => s === 'parent_edited' || s === 'parent_written');
    if (parentTouched) {
      return apiError('Refusing to overwrite parent-edited annotation', 409);
    }
  }

  // Gather subsequent entries in the same subject area for grounding
  // adjustment + planning fields.
  const familyEntries = await db.query.learningEntries.findMany({
    where: and(
      eq(learningEntries.familyId, family.id),
      eq(learningEntries.status, 'complete'),
    ),
  });

  const subjectKey = meta.subjectArea;
  const entryDate = new Date(entry.dateOccurred + 'T00:00:00');
  const followUps = familyEntries
    .filter((e) => {
      if (e.id === entry.id) return false;
      if (!e.learnerIds?.includes(report.learnerId)) return false;
      const enrichment = e.aiEnrichment as EnrichmentShape;
      const subjectSet = new Set([
        ...(e.subjects ?? []),
        ...(enrichment?.subjects_detected ?? []).map((s) => s.toLowerCase()),
      ]);
      if (!subjectSet.has(subjectKey)) return false;
      const d = new Date(e.dateOccurred + 'T00:00:00');
      return d.getTime() > entryDate.getTime();
    })
    .sort((a, b) => new Date(a.dateOccurred).getTime() - new Date(b.dateOccurred).getTime())
    .slice(0, 4)
    .map((e) => ({
      title: e.title ?? 'Untitled',
      dateISO: e.dateOccurred,
      description: e.description ?? null,
    }));

  const draft = await generateAnnotationDraft({
    learnerName: learner.name,
    entryTitle: entry.title ?? 'Untitled entry',
    entryDescription: entry.description ?? null,
    entryDateISO: entry.dateOccurred,
    subjects: entry.subjects ?? [],
    subjectArea: subjectKey,
    termHalf: meta.termHalf,
    subsequentEntries: followUps,
  });

  if (!draft) {
    return apiError('Draft generation failed', 502);
  }

  let annotation;
  if (existing) {
    [annotation] = await db
      .update(workSampleAnnotations)
      .set({
        observations: draft.observations,
        observationsSource: 'ai_draft',
        needsStrengths: draft.needsStrengths,
        needsStrengthsSource: 'ai_draft',
        adjustment: draft.adjustment,
        adjustmentSource: 'ai_draft',
        planning: draft.planning,
        planningSource: 'ai_draft',
        updatedAt: new Date(),
      })
      .where(eq(workSampleAnnotations.id, existing.id))
      .returning();
  } else {
    [annotation] = await db
      .insert(workSampleAnnotations)
      .values({
        workSampleId: sampleId,
        observations: draft.observations,
        observationsSource: 'ai_draft',
        needsStrengths: draft.needsStrengths,
        needsStrengthsSource: 'ai_draft',
        adjustment: draft.adjustment,
        adjustmentSource: 'ai_draft',
        planning: draft.planning,
        planningSource: 'ai_draft',
      })
      .returning();
  }

  await db
    .update(workSamples)
    .set({ status: 'annotated', updatedAt: new Date() })
    .where(eq(workSamples.id, sampleId));

  return NextResponse.json({ annotation });
}, { route: 'POST /api/report/[reportId]/samples/[sampleId]/draft' });
