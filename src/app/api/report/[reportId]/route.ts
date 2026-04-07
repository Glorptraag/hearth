import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { complianceReports } from '@/lib/db/schema';
import { authenticatedFamily, parseBody, apiError } from '@/lib/api-helpers';
import { checkWritePermission } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';

type Params = { params: Promise<{ reportId: string }> };

const updateReportSchema = z.object({
  choiceArea: z.enum(['science', 'hass']).optional(),
  status: z.enum(['draft', 'complete', 'exported']).optional(),
});

// PATCH /api/report/[reportId] — update report metadata (choice area, status)
export async function PATCH(request: NextRequest, { params }: Params) {
  const result = await authenticatedFamily();
  if ('error' in result) return result.error;
  const { userId, family } = result;

  const writeCheck = await checkWritePermission(userId, family.id);
  if (!writeCheck.allowed) {
    return apiError('Insufficient permissions to update reports', writeCheck.statusCode);
  }

  const { reportId } = await params;

  const report = await db.query.complianceReports.findFirst({
    where: and(eq(complianceReports.id, reportId), eq(complianceReports.familyId, family.id)),
  });
  if (!report) return apiError('Report not found', 404);

  const body = await parseBody(request, updateReportSchema);
  if ('error' in body) return body.error;

  const [updated] = await db
    .update(complianceReports)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(complianceReports.id, reportId))
    .returning();

  return NextResponse.json(updated);
}
