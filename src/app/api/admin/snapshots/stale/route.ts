import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { routeHandler } from '@/lib/api-helpers';

export const GET = routeHandler(async () => {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const result = await db.execute(sql`
    SELECT
      f.id          AS "familyId",
      f.family_name AS "familyName",
      fis.rebuilt_at AS "rebuiltAt",
      MAX(le.created_at) AS "lastWrite"
    FROM families f
    JOIN family_intelligence_snapshots fis ON fis.family_id = f.id
    LEFT JOIN learning_entries le
      ON le.family_id = f.id
      AND le.created_at > fis.rebuilt_at
    WHERE fis.rebuilt_at < NOW() - INTERVAL '24 hours'
    GROUP BY f.id, f.family_name, fis.rebuilt_at
    HAVING MAX(le.created_at) > fis.rebuilt_at
    ORDER BY MAX(le.created_at) DESC
  `);

  return NextResponse.json({
    stale: result.rows as Array<{
      familyId: string;
      familyName: string;
      rebuiltAt: string;
      lastWrite: string;
    }>,
  });
}, { route: 'GET /api/admin/snapshots/stale' });
