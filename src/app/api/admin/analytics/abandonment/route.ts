import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { learningEntries } from '@/lib/db/schema';
import { sql, eq, and, isNotNull } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { routeHandler } from '@/lib/api-helpers';

const K_THRESHOLD = 5;

export const GET = routeHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const moduleId = req.nextUrl.searchParams.get('moduleId');
  if (!moduleId) {
    return NextResponse.json({ error: 'moduleId required' }, { status: 400 });
  }

  // For each stage, count how many distinct families reached it
  const rows = await db
    .select({
      stageNumber: learningEntries.sourceStageNumber,
      familyCount: sql<number>`count(distinct ${learningEntries.familyId})::int`,
    })
    .from(learningEntries)
    .where(
      and(
        eq(learningEntries.sourceModuleId, moduleId),
        isNotNull(learningEntries.sourceStageNumber)
      )
    )
    .groupBy(learningEntries.sourceStageNumber)
    .orderBy(learningEntries.sourceStageNumber);

  // Apply k-anonymity
  const stages = rows.map((r, i) => {
    const suppressed = r.familyCount < K_THRESHOLD;
    return {
      stageNumber: r.stageNumber,
      familyCount: suppressed ? null : r.familyCount,
      dropOff:
        i > 0 && !suppressed && rows[i - 1].familyCount >= K_THRESHOLD
          ? rows[i - 1].familyCount - r.familyCount
          : null,
      suppressed,
    };
  });

  return NextResponse.json({
    moduleId,
    stages,
    kThreshold: K_THRESHOLD,
  });
}, { route: 'GET /api/admin/analytics/abandonment' });
