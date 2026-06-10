/**
 * Integration tests for triggerRecommendationsRefreshNotice.
 *
 * Uses real Postgres (transaction-rollback isolation from vitest.integration.setup.ts).
 * The snapshots/rebuild integration test stubs rebuildSnapshot and cannot host
 * these cases — trigger logic needs a real notifications table + familySettings JSONB.
 *
 * System time is frozen to a UTC mid-morning in the active window (after
 * rebalance, before sunset, outside quiet hours 20–7 UTC) so the
 * createNotification quiet-hours gate doesn't interfere.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db';
import { notifications, familySettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createFamily } from '@/test/db-factories';
import { TEST_FAMILY_ID, TEST_USER_ID } from '../../../vitest.setup';
import { triggerRecommendationsRefreshNotice } from './triggers';

// 2026-07-15 10:00 UTC — active window, hour=10 passes the 7–20 quiet-hours check.
const NOW_ISO = '2026-07-15T10:00:00.000Z';

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW_ISO));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('triggerRecommendationsRefreshNotice — real DB', () => {
  it('no-ops when hasSuggestedNext is false', async () => {
    await createFamily(db, {
      id: TEST_FAMILY_ID,
      clerkUserId: TEST_USER_ID,
      createdAt: new Date('2026-05-01T00:00:00.000Z'),
    });

    const result = await triggerRecommendationsRefreshNotice(TEST_FAMILY_ID, false);
    expect(result).toBe(false);
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.familyId, TEST_FAMILY_ID));
    expect(rows).toHaveLength(0);
  });

  it('no-ops for a family created after the rebalance date', async () => {
    // createdAt AFTER 2026-06-06 — this family never saw the old ordering
    await createFamily(db, {
      id: TEST_FAMILY_ID,
      clerkUserId: TEST_USER_ID,
      createdAt: new Date('2026-06-10T00:00:00.000Z'),
    });

    const result = await triggerRecommendationsRefreshNotice(TEST_FAMILY_ID, true);
    expect(result).toBe(false);
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.familyId, TEST_FAMILY_ID));
    expect(rows).toHaveLength(0);
  });

  it('creates notification and sets flag on first call for eligible family', async () => {
    await createFamily(db, {
      id: TEST_FAMILY_ID,
      clerkUserId: TEST_USER_ID,
      createdAt: new Date('2026-05-01T00:00:00.000Z'),
    });

    const result = await triggerRecommendationsRefreshNotice(TEST_FAMILY_ID, true);
    expect(result).toBe(true);

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.familyId, TEST_FAMILY_ID));
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe('recommendations_refreshed');
    expect(rows[0].title).toBe("We've gently tuned how suggestions are chosen");

    const settings = await db.query.familySettings.findFirst({
      where: eq(familySettings.familyId, TEST_FAMILY_ID),
    });
    const prefs = (settings?.notificationPrefs ?? {}) as Record<string, unknown>;
    expect(typeof prefs.recommendationsShiftNoticeAt).toBe('string');
  });

  it('second call no-ops because flag is already set', async () => {
    await createFamily(db, {
      id: TEST_FAMILY_ID,
      clerkUserId: TEST_USER_ID,
      createdAt: new Date('2026-05-01T00:00:00.000Z'),
    });

    await triggerRecommendationsRefreshNotice(TEST_FAMILY_ID, true);
    const result2 = await triggerRecommendationsRefreshNotice(TEST_FAMILY_ID, true);
    expect(result2).toBe(false);

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.familyId, TEST_FAMILY_ID));
    // Only one notification despite two calls.
    expect(rows).toHaveLength(1);
  });

  it('gating decline (daily cap) does NOT set flag — eligible for retry', async () => {
    await createFamily(db, {
      id: TEST_FAMILY_ID,
      clerkUserId: TEST_USER_ID,
      createdAt: new Date('2026-05-01T00:00:00.000Z'),
    });

    // Exhaust the daily cap by inserting 4 notifications already today.
    const capDate = new Date(NOW_ISO);
    for (let i = 0; i < 4; i++) {
      await db.insert(notifications).values({
        familyId: TEST_FAMILY_ID,
        type: 'streak_prompt',
        tier: 'chime',
        title: `Filler ${i}`,
        createdAt: capDate,
      });
    }

    const result = await triggerRecommendationsRefreshNotice(TEST_FAMILY_ID, true);
    // createNotification returns false due to daily cap.
    expect(result).toBe(false);

    // Flag must NOT be set — next rebuild should retry.
    const settings = await db.query.familySettings.findFirst({
      where: eq(familySettings.familyId, TEST_FAMILY_ID),
    });
    const prefs = (settings?.notificationPrefs ?? {}) as Record<string, unknown>;
    expect(prefs.recommendationsShiftNoticeAt).toBeUndefined();
  });
});
