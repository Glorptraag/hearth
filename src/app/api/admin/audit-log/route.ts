import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminAuditLog } from '@/lib/db/schema';
import { desc, like } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100);
  const offset = Number(searchParams.get('offset') ?? 0);
  const actionPrefix = searchParams.get('action') ?? '';

  const conditions = actionPrefix
    ? [like(adminAuditLog.action, `${actionPrefix}%`)]
    : [];

  const entries = await db
    .select()
    .from(adminAuditLog)
    .where(conditions.length > 0 ? conditions[0] : undefined)
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ entries });
}
