/**
 * Integration test for POST /api/planner — module provenance persistence.
 *
 * A planner entry created from a Suggested / Browse-Library pick must keep its
 * moduleId (and activityId, subjects) so ModuleCard can link to the runner and
 * the dashboard can show today's subjects (G27/G28, R41).
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { asUser } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { createFamily, createLearner } from '@/test/db-factories';
import { plannerEntries } from '@/lib/db/schema';
import { POST } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../vitest.setup';

function postReq(body: unknown) {
  return new NextRequest('http://x/api/planner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/planner — module provenance', () => {
  it('persists moduleId, activityId and subjects from a module pick', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID });

    const res = await POST(
      postReq({
        date: '2026-10-22',
        title: 'Weather Station',
        learnerIds: [learner.id],
        session: 'afternoon',
        moduleId: 'module-weather',
        activityId: 'activity-rain-gauge',
        subjects: ['science', 'mathematics'],
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.moduleId).toBe('module-weather');

    const [row] = await db.select().from(plannerEntries).where(eq(plannerEntries.id, body.id));
    expect(row.familyId).toBe(TEST_FAMILY_ID);
    expect(row.moduleId).toBe('module-weather');
    expect(row.activityId).toBe('activity-rain-gauge');
    expect(row.subjects).toEqual(['science', 'mathematics']);
    expect(row.session).toBe('afternoon');
    expect(row.learnerIds).toEqual([learner.id]);
  });

  it('leaves module columns null for a title-only custom entry', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await POST(postReq({ date: '2026-10-22', title: 'Library visit', learnerIds: [], session: 'morning' }));
    expect(res.status).toBe(201);
    const body = await res.json();

    const [row] = await db.select().from(plannerEntries).where(eq(plannerEntries.id, body.id));
    expect(row.title).toBe('Library visit');
    expect(row.moduleId).toBeNull();
    expect(row.activityId).toBeNull();
    expect(row.subjects).toBeNull();
  });
});
