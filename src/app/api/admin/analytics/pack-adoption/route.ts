import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { familyLibrary, learningEntries } from '@/lib/db/schema';
import { sql, eq, and } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { routeHandler } from '@/lib/api-helpers';

const K_THRESHOLD = 5;

export const GET = routeHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const packId = req.nextUrl.searchParams.get('packId');
  if (!packId) {
    return NextResponse.json({ error: 'packId required' }, { status: 400 });
  }

  // Count families who added the pack
  const [addedRow] = await db
    .select({ count: sql<number>`count(distinct ${familyLibrary.familyId})::int` })
    .from(familyLibrary)
    .where(eq(familyLibrary.sanityPackId, packId));

  const added = addedRow.count;

  // Started: families who added the pack AND have ≥1 entry with a sourceModuleId
  const [startedRow] = await db
    .select({ count: sql<number>`count(distinct le.family_id)::int` })
    .from(learningEntries)
    .innerJoin(
      familyLibrary,
      and(
        eq(learningEntries.familyId, familyLibrary.familyId),
        eq(familyLibrary.sanityPackId, packId)
      )
    )
    .where(sql`${learningEntries.sourceModuleId} is not null`);

  const started = startedRow.count;

  // Engaged: families with ≥5 entries who added the pack
  const engagedRows = await db
    .select({
      familyId: learningEntries.familyId,
      entryCount: sql<number>`count(*)::int`,
    })
    .from(learningEntries)
    .innerJoin(
      familyLibrary,
      and(
        eq(learningEntries.familyId, familyLibrary.familyId),
        eq(familyLibrary.sanityPackId, packId)
      )
    )
    .where(sql`${learningEntries.sourceModuleId} is not null`)
    .groupBy(learningEntries.familyId)
    .having(sql`count(*) >= 5`);

  const engaged = engagedRows.length;

  // Apply k-anonymity suppression
  function suppress(n: number): number | null {
    return n >= K_THRESHOLD ? n : null;
  }

  return NextResponse.json({
    packId,
    funnel: [
      { stage: 'Added', count: suppress(added), raw: added },
      { stage: 'Started', count: suppress(started), raw: started },
      { stage: 'Engaged', count: suppress(engaged), raw: engaged },
      { stage: 'Completed', count: null, raw: null },
    ],
    suppressed: added < K_THRESHOLD,
    kThreshold: K_THRESHOLD,
    note: 'Started/Engaged are approximations — pack→module mapping requires Sanity cross-reference.',
  });
}, { route: 'GET /api/admin/analytics/pack-adoption' });
