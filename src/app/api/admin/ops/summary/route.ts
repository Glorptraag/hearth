import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { families, learners, learningEntries, invitations } from '@/lib/db/schema';
import { sql, gte, eq, and, isNotNull, lte } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { routeHandler } from '@/lib/api-helpers';

function getMonday(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff));
  return monday;
}

export const GET = routeHandler(async () => {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const weekStart = getMonday();

  const [
    activeFamiliesResult,
    totalLearnersResult,
    entriesThisWeekResult,
    newFamiliesThisWeekResult,
    invitationStatusResult,
    expiringSoonResult,
    engagementResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(families),

    db.select({ count: sql<number>`count(*)::int` }).from(learners),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(learningEntries)
      .where(gte(learningEntries.createdAt, weekStart)),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(families)
      .where(gte(families.createdAt, weekStart)),

    db
      .select({
        status: invitations.status,
        count: sql<number>`count(*)::int`,
      })
      .from(invitations)
      .groupBy(invitations.status),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(invitations)
      .where(
        and(
          eq(invitations.status, 'pending'),
          isNotNull(invitations.expiresAt),
          lte(invitations.expiresAt, sql`NOW() + INTERVAL '14 days'`)
        )
      ),

    db.execute(sql`
      SELECT bucket, count::int FROM (
        SELECT
          CASE
            WHEN days_since <= 3  THEN '0-3'
            WHEN days_since <= 7  THEN '4-7'
            WHEN days_since <= 14 THEN '8-14'
            WHEN days_since <= 30 THEN '15-30'
            ELSE '30+'
          END AS bucket,
          COUNT(*) AS count
        FROM (
          SELECT
            f.id,
            COALESCE(
              EXTRACT(DAY FROM NOW() - MAX(le.created_at)),
              999
            )::int AS days_since
          FROM families f
          LEFT JOIN learning_entries le ON le.family_id = f.id
          GROUP BY f.id
        ) per_family
        GROUP BY bucket
      ) grouped
      ORDER BY
        CASE bucket
          WHEN '0-3'  THEN 1
          WHEN '4-7'  THEN 2
          WHEN '8-14' THEN 3
          WHEN '15-30' THEN 4
          WHEN '30+'  THEN 5
        END
    `),
  ]);

  const invStatusMap: Record<string, number> = {};
  for (const row of invitationStatusResult) {
    invStatusMap[row.status] = row.count;
  }

  const bucketOrder = ['0-3', '4-7', '8-14', '15-30', '30+'];
  const engagementMap: Record<string, number> = {};
  for (const row of engagementResult.rows as Array<{ bucket: string; count: number }>) {
    engagementMap[row.bucket] = row.count;
  }
  const engagementPulse = bucketOrder.map((bucket) => ({
    bucket,
    count: engagementMap[bucket] ?? 0,
  }));

  return NextResponse.json({
    topLine: {
      activeFamilies: activeFamiliesResult[0].count,
      totalLearners: totalLearnersResult[0].count,
      entriesThisWeek: entriesThisWeekResult[0].count,
      newFamiliesThisWeek: newFamiliesThisWeekResult[0].count,
    },
    invitations: {
      pending: invStatusMap['pending'] ?? 0,
      redeemed: invStatusMap['redeemed'] ?? 0,
      expiringSoon: expiringSoonResult[0].count,
    },
    engagementPulse,
    lastUpdated: new Date().toISOString(),
  });
}, { route: 'GET /api/admin/ops/summary' });
