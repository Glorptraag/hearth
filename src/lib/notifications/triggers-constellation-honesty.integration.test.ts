/**
 * Integration tests for triggerConstellationHonestyNotice (WS-4 shift notice).
 *
 * Real Postgres (transaction-rollback isolation). Mirrors the
 * recommendations_refreshed guard tests: one-time flag, sunset/ship-date gate,
 * tiersChanged gate, and the "gating decline must not burn the shot" rule.
 *
 * System time frozen to a UTC mid-morning inside the active window (after the
 * 2026-06-16 ship date, before the 2026-12-31 sunset, outside quiet hours).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db';
import { notifications, familySettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createFamily } from '@/test/db-factories';
import { TEST_FAMILY_ID, TEST_USER_ID } from '../../../vitest.setup';
import { triggerConstellationHonestyNotice } from './triggers';

// 2026-07-15 10:00 UTC — active window, hour=10 passes the 7–20 quiet-hours check.
const NOW_ISO = '2026-07-15T10:00:00.000Z';
// Eligible families existed before the 2026-06-16 ship date (and >7 days ago).
const PRE_SHIP = new Date('2026-05-01T00:00:00.000Z');

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW_ISO));
});

afterEach(() => {
  vi.useRealTimers();
});

async function notifRows() {
  return db.select().from(notifications).where(eq(notifications.familyId, TEST_FAMILY_ID));
}

describe('triggerConstellationHonestyNotice — real DB', () => {
  it('no-ops when no tier changed', async () => {
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID, createdAt: PRE_SHIP });

    const result = await triggerConstellationHonestyNotice(TEST_FAMILY_ID, false);
    expect(result).toBe(false);
    expect(await notifRows()).toHaveLength(0);
  });

  it('no-ops for a family created after the WS-4 ship date (never saw the old tiers)', async () => {
    await createFamily(db, {
      id: TEST_FAMILY_ID,
      clerkUserId: TEST_USER_ID,
      createdAt: new Date('2026-06-20T00:00:00.000Z'), // after 2026-06-16
    });

    const result = await triggerConstellationHonestyNotice(TEST_FAMILY_ID, true);
    expect(result).toBe(false);
    expect(await notifRows()).toHaveLength(0);
  });

  it('creates the notice and sets the flag on first call for an eligible, shifted family', async () => {
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID, createdAt: PRE_SHIP });

    const result = await triggerConstellationHonestyNotice(TEST_FAMILY_ID, true);
    expect(result).toBe(true);

    const rows = await notifRows();
    expect(rows).toHaveLength(1);
    expect(rows[0].type).toBe('constellation_honesty');
    expect(rows[0].title).toBe("We've made the constellation more honest");
    expect(rows[0].destinationRoute).toBe('/our-story/capabilities');

    const settings = await db.query.familySettings.findFirst({
      where: eq(familySettings.familyId, TEST_FAMILY_ID),
    });
    const prefs = (settings?.notificationPrefs ?? {}) as Record<string, unknown>;
    expect(typeof prefs.constellationHonestyNoticeAt).toBe('string');
  });

  it('second call no-ops because the one-time flag is set', async () => {
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID, createdAt: PRE_SHIP });

    await triggerConstellationHonestyNotice(TEST_FAMILY_ID, true);
    const second = await triggerConstellationHonestyNotice(TEST_FAMILY_ID, true);
    expect(second).toBe(false);
    expect(await notifRows()).toHaveLength(1);
  });

  it('gating decline (daily cap) does NOT set the flag — eligible for retry', async () => {
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID, createdAt: PRE_SHIP });

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

    const result = await triggerConstellationHonestyNotice(TEST_FAMILY_ID, true);
    expect(result).toBe(false);

    const settings = await db.query.familySettings.findFirst({
      where: eq(familySettings.familyId, TEST_FAMILY_ID),
    });
    const prefs = (settings?.notificationPrefs ?? {}) as Record<string, unknown>;
    expect(prefs.constellationHonestyNoticeAt).toBeUndefined();
  });
});
