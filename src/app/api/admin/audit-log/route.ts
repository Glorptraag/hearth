import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminAuditLog } from '@/lib/db/schema';
import { eq, desc, sql, and, ilike, gte, lte } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const url = req.nextUrl;
  const action = url.searchParams.get('action');
  const resourceType = url.searchParams.get('resource_type');
  const adminUserId = url.searchParams.get('admin_user_id');
  const dateFrom = url.searchParams.get('date_from');
  const dateTo = url.searchParams.get('date_to');
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
  const offset = (page - 1) * 50;

  const conditions = [];
  if (action) {
    conditions.push(ilike(adminAuditLog.action, `%${action}%`));
  }
  if (resourceType) {
    conditions.push(eq(adminAuditLog.targetResource, resourceType));
  }
  if (adminUserId) {
    conditions.push(eq(adminAuditLog.adminUserId, adminUserId));
  }
  if (dateFrom) {
    conditions.push(gte(adminAuditLog.createdAt, new Date(dateFrom)));
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    conditions.push(lte(adminAuditLog.createdAt, to));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [entries, countResult] = await Promise.all([
    db
      .select()
      .from(adminAuditLog)
      .where(where)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(50)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(adminAuditLog)
      .where(where),
  ]);

  return NextResponse.json({
    entries,
    total: Number(countResult[0]?.count ?? 0),
    page,
  });
}
