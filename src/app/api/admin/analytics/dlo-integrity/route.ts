import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { routeHandler } from '@/lib/api-helpers';

/**
 * GET /api/admin/analytics/dlo-integrity?days=30
 *
 * DLO evidence integrity metrics for the admin analytics panel.
 * Answers two questions:
 *   1. Provenance distribution — what fraction of links are inferred vs
 *      declared vs asserted?
 *   2. Tier-mismatch rate — how often did the model's claimed tier differ
 *      from the Sanity-authoritative tier (claimed_tier IS NOT NULL)?
 *
 * Supports an optional ?days= window (1–180, default 30).
 */
export const GET = routeHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const rawDays = Number(req.nextUrl.searchParams.get('days') ?? '30');
  const days = Number.isNaN(rawDays) ? 30 : Math.min(180, Math.max(1, rawDays));

  const rows = await db.execute(sql`
    SELECT
      provenance,
      COUNT(*)::int                                                   AS total,
      COUNT(*) FILTER (WHERE claimed_tier IS NOT NULL)::int           AS mismatches
    FROM observation_dlo_links
    WHERE created_at >= now() - (${days}::int * interval '1 day')
    GROUP BY provenance
    ORDER BY provenance
  `);

  type Row = { provenance: string; total: number; mismatches: number };
  const byProvenance = (rows.rows as Row[]).map((r) => ({
    provenance: r.provenance,
    total: Number(r.total),
    mismatches: Number(r.mismatches),
  }));

  const grand = byProvenance.reduce(
    (acc, r) => ({ total: acc.total + r.total, mismatches: acc.mismatches + r.mismatches }),
    { total: 0, mismatches: 0 },
  );

  return NextResponse.json({
    days,
    byProvenance,
    total: grand.total,
    mismatches: grand.mismatches,
    mismatchRate: grand.total > 0 ? Number((grand.mismatches / grand.total).toFixed(4)) : 0,
    generatedAt: new Date().toISOString(),
  });
}, { route: 'GET /api/admin/analytics/dlo-integrity' });
