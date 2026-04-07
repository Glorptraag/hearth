import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { learningEntries } from '@/lib/db/schema';
import { sql, eq, and, isNotNull } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';

const K_THRESHOLD = 5;

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const moduleId = req.nextUrl.searchParams.get('moduleId');
  if (!moduleId) {
    return NextResponse.json({ error: 'moduleId required' }, { status: 400 });
  }

  // Count log events per stage within a module (stage_number is proxy for activity)
  const rows = await db
    .select({
      stageNumber: learningEntries.sourceStageNumber,
      logCount: sql<number>`count(*)::int`,
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

  // Apply k-anonymity: suppress cells where familyCount < threshold
  const cells = rows.map((r) => ({
    stageNumber: r.stageNumber,
    logCount: r.familyCount >= K_THRESHOLD ? r.logCount : null,
    familyCount: r.familyCount >= K_THRESHOLD ? r.familyCount : null,
    suppressed: r.familyCount < K_THRESHOLD,
  }));

  return NextResponse.json({
    moduleId,
    cells,
    kThreshold: K_THRESHOLD,
    note: 'stageNumber is used as a proxy for activity position within the module.',
  });
}
