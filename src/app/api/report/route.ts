import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { heuReports, workSamples } from '@/lib/db/schema';
import { authenticatedFamily, parseBody, apiError } from '@/lib/api-helpers';
import { eq, and } from 'drizzle-orm';

const WORK_SAMPLE_SLOTS = [
  'early_writing',
  'later_writing',
  'early_maths',
  'later_maths',
  'early_choice',
  'later_choice',
] as const;

// GET /api/report?learnerId=...&year=...
export async function GET(request: NextRequest) {
  const result = await authenticatedFamily();
  if ('error' in result) return result.error;
  const { family } = result;

  const learnerId = request.nextUrl.searchParams.get('learnerId');
  const year = request.nextUrl.searchParams.get('year') ?? new Date().getFullYear().toString();

  if (!learnerId) return apiError('learnerId required', 400);

  const report = await db.query.heuReports.findFirst({
    where: and(
      eq(heuReports.familyId, family.id),
      eq(heuReports.learnerId, learnerId),
      eq(heuReports.reportYear, parseInt(year)),
    ),
  });

  if (!report) return NextResponse.json(null);

  const samples = await db.query.workSamples.findMany({
    where: eq(workSamples.reportId, report.id),
  });

  return NextResponse.json({ ...report, samples });
}

const createReportSchema = z.object({
  learnerId: z.string().uuid(),
  year: z.number().int().min(2020).max(2050).optional(),
});

// POST /api/report — create report + 6 empty work sample slots
export async function POST(request: NextRequest) {
  const result = await authenticatedFamily();
  if ('error' in result) return result.error;
  const { family } = result;

  const body = await parseBody(request, createReportSchema);
  if ('error' in body) return body.error;
  const { learnerId, year = new Date().getFullYear() } = body.data;

  // Check if report already exists
  const existing = await db.query.heuReports.findFirst({
    where: and(
      eq(heuReports.familyId, family.id),
      eq(heuReports.learnerId, learnerId),
      eq(heuReports.reportYear, year),
    ),
  });

  if (existing) {
    const samples = await db.query.workSamples.findMany({
      where: eq(workSamples.reportId, existing.id),
    });
    return NextResponse.json({ ...existing, samples });
  }

  // Create report
  const [report] = await db
    .insert(heuReports)
    .values({
      familyId: family.id,
      learnerId,
      reportYear: year,
    })
    .returning();

  // Create 6 empty work sample slots
  const sampleRows = WORK_SAMPLE_SLOTS.map((slot) => ({
    reportId: report.id,
    slot,
    status: 'empty' as const,
  }));

  const samples = await db.insert(workSamples).values(sampleRows).returning();

  return NextResponse.json({ ...report, samples }, { status: 201 });
}
