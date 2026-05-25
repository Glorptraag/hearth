import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { routeHandler } from '@/lib/api-helpers';

const BUCKETS = ['lt5m', 'to60m', 'to24h', 'to7d', 'beyond'] as const;

export const GET = routeHandler(async () => {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const result = await db.execute(sql`
    SELECT bucket, count::int FROM (
      SELECT
        CASE
          WHEN rebuilt_at IS NULL THEN 'beyond'
          WHEN EXTRACT(EPOCH FROM NOW() - rebuilt_at) < 300    THEN 'lt5m'
          WHEN EXTRACT(EPOCH FROM NOW() - rebuilt_at) < 3600   THEN 'to60m'
          WHEN EXTRACT(EPOCH FROM NOW() - rebuilt_at) < 86400  THEN 'to24h'
          WHEN EXTRACT(EPOCH FROM NOW() - rebuilt_at) < 604800 THEN 'to7d'
          ELSE 'beyond'
        END AS bucket,
        COUNT(*) AS count
      FROM family_intelligence_snapshots
      GROUP BY bucket
    ) grouped
  `);

  const map: Record<string, number> = {};
  for (const row of result.rows as Array<{ bucket: string; count: number }>) {
    map[row.bucket] = row.count;
  }

  const total = BUCKETS.reduce((sum, k) => sum + (map[k] ?? 0), 0);

  return NextResponse.json({
    buckets: [
      { key: 'lt5m',  label: '< 5 min',   count: map['lt5m']  ?? 0 },
      { key: 'to60m', label: '5–60 min',  count: map['to60m'] ?? 0 },
      { key: 'to24h', label: '1–24 h',    count: map['to24h'] ?? 0 },
      { key: 'to7d',  label: '1–7 days',  count: map['to7d']  ?? 0 },
      { key: 'beyond', label: '7+ days',  count: map['beyond'] ?? 0 },
    ],
    total,
  });
}, { route: 'GET /api/admin/snapshots/health' });
