import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invitations, adminAuditLog } from '@/lib/db/schema';
import { eq, and, lt, isNotNull } from 'drizzle-orm';

function isAuthorized(req: NextRequest): boolean {
  const validToken = process.env.CRON_SECRET;
  if (!validToken) return false;
  const authHeader = req.headers.get('authorization');
  const cronSecret = req.headers.get('x-cron-secret');
  return cronSecret === validToken || authHeader === `Bearer ${validToken}`;
}

async function expireStaleInvitations() {
  const now = new Date();

  const expired = await db
    .update(invitations)
    .set({ status: 'expired' })
    .where(
      and(
        eq(invitations.status, 'pending'),
        isNotNull(invitations.expiresAt),
        lt(invitations.expiresAt, now)
      )
    )
    .returning({ id: invitations.id });

  const count = expired.length;

  if (count > 0) {
    await db.insert(adminAuditLog).values({
      adminUserId: 'system',
      adminEmail: 'cron@hearth.au',
      action: 'invitation.expiry_sweep',
      metadata: { count },
    });
  }

  return NextResponse.json({ expired: count });
}

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return expireStaleInvitations();
}
