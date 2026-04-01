import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications, moduleDrafts } from '@/lib/db/schema';
import { lt, and, eq, ne } from 'drizzle-orm';

// Called by Vercel Cron (or manual trigger). Protected by CRON_SECRET.
// Vercel sends: Authorization: Bearer <CRON_SECRET>
// Manual/external callers may send: x-cron-secret: <CRON_SECRET>
function isAuthorized(req: NextRequest): boolean {
  const validToken = process.env.CRON_SECRET;
  if (!validToken) return false;
  const authHeader = req.headers.get('authorization');
  const cronSecret = req.headers.get('x-cron-secret');
  return cronSecret === validToken || authHeader === `Bearer ${validToken}`;
}

async function runCleanup() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // 1. Dismiss expired notifications
  await db
    .update(notifications)
    .set({ state: 'dismissed' })
    .where(
      and(
        lt(notifications.expiresAt, now),
        ne(notifications.state, 'dismissed')
      )
    );

  // 2. Dismiss stale snoozed notifications (snoozedUntil more than 7 days ago)
  await db
    .update(notifications)
    .set({ state: 'dismissed' })
    .where(
      and(
        lt(notifications.snoozedUntil, sevenDaysAgo),
        eq(notifications.state, 'snoozed')
      )
    );

  // 3. Delete stale module drafts (draft status, not updated in 90+ days)
  await db
    .delete(moduleDrafts)
    .where(
      and(
        eq(moduleDrafts.status, 'draft'),
        lt(moduleDrafts.updatedAt, ninetyDaysAgo)
      )
    );

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    actions: {
      expiredNotificationsDismissed: 'done',
      staleSnoozedDismissed: 'done',
      staleDraftsDeleted: 'done',
    },
  });
}

// Vercel Cron invokes GET — this is the primary entry point
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runCleanup();
}

// POST kept for manual/external triggers
export async function POST(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return runCleanup();
}
