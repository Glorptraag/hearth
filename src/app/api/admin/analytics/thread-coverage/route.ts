import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { routeHandler } from '@/lib/api-helpers';

const K_THRESHOLD = 5;

export const GET = routeHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const dateFrom = req.nextUrl.searchParams.get('dateFrom');
  const dateTo = req.nextUrl.searchParams.get('dateTo');

  // Extract capability thread IDs from ai_enrichment JSONB and aggregate
  const dateFilter = [];
  if (dateFrom) dateFilter.push(`date_occurred >= '${dateFrom}'::date`);
  if (dateTo) dateFilter.push(`date_occurred <= '${dateTo}'::date`);
  const whereClause =
    dateFilter.length > 0 ? `AND ${dateFilter.join(' AND ')}` : '';

  const rows = await db.execute(sql`
    SELECT
      t->>'thread_id'                   AS thread_id,
      COUNT(*)::int                     AS entry_count,
      COUNT(DISTINCT le.family_id)::int AS family_count
    FROM learning_entries le,
      jsonb_array_elements(le.ai_enrichment->'capability_threads') AS t
    WHERE le.ai_enrichment IS NOT NULL
      AND le.ai_enrichment ? 'capability_threads'
      ${sql.raw(whereClause)}
    GROUP BY t->>'thread_id'
    HAVING COUNT(DISTINCT le.family_id) >= ${K_THRESHOLD}
    ORDER BY entry_count DESC
    LIMIT 50
  `);

  const threads = (rows.rows as Array<{ thread_id: string; entry_count: number; family_count: number }>).map(
    (r) => ({
      threadId: r.thread_id,
      entryCount: r.entry_count,
      familyCount: r.family_count,
    })
  );

  return NextResponse.json({
    threads,
    kThreshold: K_THRESHOLD,
    dateFrom: dateFrom ?? null,
    dateTo: dateTo ?? null,
    totalThreadsWithData: threads.length,
  });
}, { route: 'GET /api/admin/analytics/thread-coverage' });
