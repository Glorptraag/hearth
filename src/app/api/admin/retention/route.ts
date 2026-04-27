import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { adminAuditLog, notifications, moduleDrafts } from '@/lib/db/schema';
import { lt, and, eq, ne, sql } from 'drizzle-orm';

// Token budget per family per 24h that triggers a noisy-family alert.
// Calibration: typical pilot family runs ~3-10k tokens/day at Haiku rates,
// so 200k is ~20x normal — clearly anomalous and worth admin attention,
// but not so high that a legit power user in their first weekend trips it.
// Tweak via the env var; CI / preview envs default to a high number so
// integration tests don't accidentally trigger the alert.
const NOISY_FAMILY_TOKEN_THRESHOLD = Number(
  process.env.NOISY_FAMILY_TOKEN_THRESHOLD ?? 200_000,
);

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

  // 4. Noisy-family detection. Flag any family whose 24h token spend is
  //    above the threshold; write an admin_audit_log row so the next admin
  //    pageview shows it, and console.error so Sentry catches a warning
  //    breadcrumb. Per-route rateLimit() tightening is still manual — this
  //    just makes detection automatic. See tracker #28 + #30.
  const noisyFamilies = await detectNoisyFamilies();

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    actions: {
      expiredNotificationsDismissed: 'done',
      staleSnoozedDismissed: 'done',
      staleDraftsDeleted: 'done',
      noisyFamiliesFlagged: noisyFamilies.length,
    },
    noisyFamilies,
  });
}

interface NoisyFamilyAlert {
  familyId: string;
  tokens: number;
  calls: number;
}

async function detectNoisyFamilies(): Promise<NoisyFamilyAlert[]> {
  const rows = await db.execute(sql`
    SELECT
      family_id::text                         AS family_id,
      SUM(input_tokens + output_tokens)::bigint AS tokens,
      COUNT(*)::int                            AS calls
    FROM ai_pipeline_logs
    WHERE created_at > now() - interval '24 hours'
    GROUP BY 1
    HAVING SUM(input_tokens + output_tokens) > ${NOISY_FAMILY_TOKEN_THRESHOLD}
    ORDER BY tokens DESC
  `);

  const alerts: NoisyFamilyAlert[] = (rows.rows as Array<{
    family_id: string;
    tokens: string | number;
    calls: number;
  }>).map((r) => ({
    familyId: r.family_id,
    tokens: Number(r.tokens),
    calls: r.calls,
  }));

  if (alerts.length === 0) return alerts;

  // Persist one audit-log row per alert so /admin can list recent flags.
  // Run as a single insert so it's one round-trip.
  await db.insert(adminAuditLog).values(
    alerts.map((a) => ({
      adminUserId: 'system:cron',
      adminEmail: 'system@hearth',
      action: 'noisy_family_alert',
      targetResource: 'family',
      targetId: a.familyId,
      reason: `${a.tokens.toLocaleString()} tokens / ${a.calls} calls in last 24h (threshold ${NOISY_FAMILY_TOKEN_THRESHOLD.toLocaleString()})`,
      metadata: {
        tokens: a.tokens,
        calls: a.calls,
        threshold: NOISY_FAMILY_TOKEN_THRESHOLD,
      },
    })),
  );

  // Sentry breadcrumb — server logs route to it via console.error.
  for (const a of alerts) {
    console.error(
      `[noisy-family-alert] family=${a.familyId} tokens=${a.tokens} calls=${a.calls} threshold=${NOISY_FAMILY_TOKEN_THRESHOLD}`,
    );
  }

  return alerts;
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
