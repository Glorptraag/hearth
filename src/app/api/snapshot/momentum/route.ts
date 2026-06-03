import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { learningEntries } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, sql } from 'drizzle-orm';
import { routeHandler } from '@/lib/api-helpers';

/**
 * GET /api/snapshot/momentum
 *
 * Pure-SQL projection — capability threads with ≥2 learning entries in the
 * last 14 days, ranked by recent count. Unpacks aiEnrichment.capability_threads
 * JSONB at read time so the result reflects the absolute newest entries
 * (not whatever last snapshot rebuild captured).
 *
 * Output is sized for the Explore "What's emerging" card.
 *
 * Task 3.7.
 */
export interface MomentumThread {
  thread_id: string;
  count: number;
  /** Most recent date_occurred among the matching entries. */
  last_observed: string;
  /** Up to three sample entry IDs for the surface to link into. */
  sample_entry_ids: string[];
}

export interface MomentumResponse {
  window_days: number;
  threads: MomentumThread[];
}

const WINDOW_DAYS = 14;
const MIN_COUNT = 2;
const MAX_RESULTS = 8;
const SAMPLE_PER_THREAD = 3;

export const GET = routeHandler(async () => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  // jsonb_array_elements unpacks the capability_threads array on each
  // enriched entry so we can group + count by thread_id at the DB layer.
  const since = new Date();
  since.setDate(since.getDate() - WINDOW_DAYS);
  const sinceIso = since.toISOString().slice(0, 10);

  const rows = await db.execute(sql`
    WITH thread_hits AS (
      SELECT
        le.id AS entry_id,
        le.date_occurred,
        (t.value->>'thread_id') AS thread_id
      FROM ${learningEntries} le
      CROSS JOIN LATERAL jsonb_array_elements(
        COALESCE(le.ai_enrichment->'capability_threads', '[]'::jsonb)
      ) AS t
      WHERE le.family_id = ${family.id}
        AND le.status = 'complete'
        AND le.date_occurred >= ${sinceIso}::date
    )
    SELECT
      thread_id,
      COUNT(*)::int AS count,
      MAX(date_occurred)::text AS last_observed,
      (ARRAY_AGG(entry_id ORDER BY date_occurred DESC))[1:${SAMPLE_PER_THREAD}] AS sample_entry_ids
    FROM thread_hits
    WHERE thread_id IS NOT NULL
    GROUP BY thread_id
    HAVING COUNT(*) >= ${MIN_COUNT}
    ORDER BY count DESC, last_observed DESC
    LIMIT ${MAX_RESULTS}
  `);

  const rowList = Array.isArray(rows) ? rows : ((rows as { rows?: unknown[] }).rows ?? []);
  const threads: MomentumThread[] = (rowList as Array<{
    thread_id: string;
    count: number;
    last_observed: string;
    sample_entry_ids: string[];
  }>).map((r) => ({
    thread_id: r.thread_id,
    count: Number(r.count),
    last_observed: r.last_observed,
    sample_entry_ids: r.sample_entry_ids ?? [],
  }));

  return NextResponse.json<MomentumResponse>({
    window_days: WINDOW_DAYS,
    threads,
  });
}, { route: 'GET /api/snapshot/momentum' });

// Also referencing `eq` so importing it isn't an unused-import lint warning
// — we keep the import for symmetry with sibling routes; remove if lint
// surfaces it later.
void eq;
