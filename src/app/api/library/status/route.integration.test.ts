/**
 * Integration test for /api/library/status — exercises the multi-source
 * status derivation against a real Neon test branch with seeded
 * library/run/planner/entry rows.
 *
 * Task 4.8.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner, createEntry, createModuleRun } from '@/test/db-factories';
import { familyLibrary, plannerEntries, moduleRuns } from '@/lib/db/schema';
import { GET } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

function getReq(url = 'http://x/api/library/status') {
  return new NextRequest(url);
}

describe('GET /api/library/status — status derivation', () => {
  it('returns untouched for a library row with no runs / planner / entries', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    await db.insert(familyLibrary).values({
      familyId: TEST_FAMILY_ID,
      sanityModuleId: 'mod-untouched',
    });

    const res = await (GET as () => Promise<Response>)();
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      items: Array<{ sanityModuleId: string | null; status: string }>;
      counts: Record<string, number>;
    };

    const item = body.items.find((i) => i.sanityModuleId === 'mod-untouched');
    expect(item?.status).toBe('untouched');
    expect(body.counts.untouched).toBe(1);
  });

  it('marks a module with an open active run as in_flight', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'Sam' });
    await db.insert(familyLibrary).values({
      familyId: TEST_FAMILY_ID,
      sanityModuleId: 'mod-active',
    });
    const run = await createModuleRun(db, {
      familyId: TEST_FAMILY_ID,
      sanityModuleId: 'mod-active',
      learnerIds: [learner.id],
      state: 'active',
      sessionType: 'sustained',
    });

    const res = await (GET as () => Promise<Response>)();
    const body = (await res.json()) as {
      items: Array<{ sanityModuleId: string | null; status: string; openRunId: string | null }>;
    };
    const item = body.items.find((i) => i.sanityModuleId === 'mod-active');
    expect(item?.status).toBe('in_flight');
    expect(item?.openRunId).toBe(run.id);
  });

  it('marks a planned-today module as planned', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    await db.insert(familyLibrary).values({
      familyId: TEST_FAMILY_ID,
      sanityModuleId: 'mod-planned',
    });
    const today = new Date().toISOString().slice(0, 10);
    await db.insert(plannerEntries).values({
      familyId: TEST_FAMILY_ID,
      date: today,
      moduleId: 'mod-planned',
      title: 'Today',
    });

    const res = await (GET as () => Promise<Response>)();
    const body = (await res.json()) as {
      items: Array<{ sanityModuleId: string | null; status: string; plannedDates: string[] }>;
    };
    const item = body.items.find((i) => i.sanityModuleId === 'mod-planned');
    expect(item?.status).toBe('planned');
    expect(item?.plannedDates).toContain(today);
  });

  it('marks a recently-used module (entry within 14d) as recently_used', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });
    await db.insert(familyLibrary).values({
      familyId: TEST_FAMILY_ID,
      sanityModuleId: 'mod-recent',
    });
    const today = new Date().toISOString().slice(0, 10);
    await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learner.id],
      sourceModuleId: 'mod-recent',
      dateOccurred: today,
      title: 'Recent session',
    });

    const res = await (GET as () => Promise<Response>)();
    const body = (await res.json()) as {
      items: Array<{ sanityModuleId: string | null; status: string }>;
    };
    expect(body.items.find((i) => i.sanityModuleId === 'mod-recent')?.status).toBe('recently_used');
  });

  it('marks an old open run as abandoned', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    await db.insert(familyLibrary).values({
      familyId: TEST_FAMILY_ID,
      sanityModuleId: 'mod-stale',
    });
    // Insert a run with lastActiveAt 30 days ago.
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    await db.insert(moduleRuns).values({
      familyId: TEST_FAMILY_ID,
      sanityModuleId: 'mod-stale',
      state: 'active',
      sessionType: 'sustained',
      startedAt: thirtyDaysAgo,
      lastActiveAt: thirtyDaysAgo,
    });

    const res = await (GET as () => Promise<Response>)();
    const body = (await res.json()) as {
      items: Array<{ sanityModuleId: string | null; status: string }>;
    };
    expect(body.items.find((i) => i.sanityModuleId === 'mod-stale')?.status).toBe('abandoned');
  });

  it('does not surface soft-deleted library rows', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    await db.insert(familyLibrary).values({
      familyId: TEST_FAMILY_ID,
      sanityModuleId: 'mod-removed',
      removedAt: new Date(),
    });
    await db.insert(familyLibrary).values({
      familyId: TEST_FAMILY_ID,
      sanityModuleId: 'mod-active',
    });

    const res = await (GET as () => Promise<Response>)();
    const body = (await res.json()) as {
      items: Array<{ sanityModuleId: string | null }>;
    };
    expect(body.items.find((i) => i.sanityModuleId === 'mod-removed')).toBeUndefined();
    expect(body.items.find((i) => i.sanityModuleId === 'mod-active')).toBeDefined();
  });
});
