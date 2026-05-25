import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invitations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { logAdminAction } from '@/lib/admin/audit';
import { routeHandler } from '@/lib/api-helpers';
import { z } from 'zod';

const revokeSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

export const POST = routeHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const { id } = await params;

  let body: z.infer<typeof revokeSchema>;
  try {
    body = revokeSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (existing.status !== 'pending') {
    return NextResponse.json(
      { error: `Cannot revoke invitation with status '${existing.status}'` },
      { status: 409 }
    );
  }

  const [updated] = await db
    .update(invitations)
    .set({
      status: 'revoked',
      revokedAt: new Date(),
      revokedReason: body.reason,
    })
    .where(eq(invitations.id, id))
    .returning();

  await logAdminAction({
    adminUserId: admin.userId,
    adminEmail: admin.email,
    action: 'invitation.revoke',
    targetResource: 'invitation',
    targetId: id,
    reason: body.reason,
  });

  return NextResponse.json({ invitation: updated });
}, { route: 'POST /api/admin/invitations/[id]/revoke' });
