import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invitations, adminAuditLog } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { routeHandler } from '@/lib/api-helpers';

export const GET = routeHandler(async (
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const { id } = await params;

  const [invitation] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, id))
    .limit(1);

  if (!invitation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const auditHistory = await db
    .select()
    .from(adminAuditLog)
    .where(
      and(
        eq(adminAuditLog.targetResource, 'invitation'),
        eq(adminAuditLog.targetId, id)
      )
    )
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(50);

  return NextResponse.json({ invitation, auditHistory });
}, { route: 'GET /api/admin/invitations/[id]' });
