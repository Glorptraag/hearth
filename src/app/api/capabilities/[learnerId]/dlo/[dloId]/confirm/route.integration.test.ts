/**
 * Integration test for POST /api/capabilities/[learnerId]/dlo/[dloId]/confirm —
 * proves the parent confirm/dispute path against a real DB: auth + family
 * isolation + the viewer write-gate, and that a confirm writes exactly one
 * `asserted` observation_dlo_links row (observation_id null) which a repeat
 * confirm leaves alone and a dispute removes.
 */
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut, asViewer } from '@/test/clerk-helpers';

// The route fires rebuildSnapshot(...) fire-and-forget (not awaited). Under the
// single-pinned-transaction integration harness that escaped async write runs
// AFTER the test's transaction rolls back, hits an FK violation (family gone),
// and aborts the shared connection — poisoning subsequent tests. Snapshot
// rebuild has its own coverage; stub it to a no-op here.
vi.mock('@/lib/ai/snapshot-rebuild', () => ({
  rebuildSnapshot: vi.fn(async () => {}),
}));

// Valid DLO ids come from Sanity via the in-memory dlo-cache; pin a tiny
// catalog so the test never depends on the Sanity seed (mirrors
// src/lib/ai/__tests__/dlo-persistence.integration.test.ts).
vi.mock('@/lib/ai/dlo-cache', () => ({
  getValidDlos: vi.fn(async () => ({
    ids: new Set(['dlo.M1.developing']),
    tierById: new Map<string, 'emerging' | 'developing' | 'demonstrating'>([
      ['dlo.M1.developing', 'developing'],
    ]),
    descriptorById: new Map<string, string>([
      ['dlo.M1.developing', 'Uses skip counting purposefully.'],
    ]),
  })),
}));

import { db } from '@/lib/db';
import { createFamily, createLearner } from '@/test/db-factories';
import { familyMembers, observationDloLinks } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { POST } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../../../../vitest.setup';

const DLO_ID = 'dlo.M1.developing';

function post(learnerId: string, dloId: string, action: 'confirm' | 'dispute') {
  const req = new NextRequest(
    `http://x/api/capabilities/${learnerId}/dlo/${encodeURIComponent(dloId)}/confirm`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    },
  );
  return POST(req, { params: Promise.resolve({ learnerId, dloId: encodeURIComponent(dloId) }) });
}

async function linksFor(learnerId: string) {
  return db
    .select()
    .from(observationDloLinks)
    .where(and(eq(observationDloLinks.learnerId, learnerId), eq(observationDloLinks.dloId, DLO_ID)));
}

describe('POST /api/capabilities/[learnerId]/dlo/[dloId]/confirm — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await post('some-learner', DLO_ID, 'confirm');
    expect(res.status).toBe(401);
  });

  it('returns 404 when the learner belongs to another family', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const other = await createFamily(db, { id: crypto.randomUUID(), clerkUserId: 'user-other' });
    const otherLearner = await createLearner(db, { familyId: other.id, name: 'X' });

    const res = await post(otherLearner.id, DLO_ID, 'confirm');
    expect(res.status).toBe(404);
    expect(await linksFor(otherLearner.id)).toHaveLength(0);
  });

  it('rejects a viewer with 403 and writes no row', async () => {
    // Owner is someone else; the test user is only a viewer member, so the
    // route's checkWritePermission should refuse the write.
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: 'user_owner_xyz' });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'Sage' });
    await db.insert(familyMembers).values({
      familyId: TEST_FAMILY_ID,
      clerkUserId: TEST_USER_ID,
      email: 'viewer@example.com',
      role: 'viewer',
      status: 'active',
    });
    asViewer({});

    const res = await post(learner.id, DLO_ID, 'confirm');
    expect(res.status).toBe(403);
    expect(await linksFor(learner.id)).toHaveLength(0);
  });

  it('owner confirm writes exactly one asserted row with no observation; repeat is idempotent; dispute clears it', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'Sage' });

    const first = await post(learner.id, DLO_ID, 'confirm');
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ success: true, dloId: DLO_ID, action: 'confirm' });

    const afterFirst = await linksFor(learner.id);
    expect(afterFirst).toHaveLength(1);
    expect(afterFirst[0].provenance).toBe('asserted');
    expect(afterFirst[0].observationId).toBeNull();
    expect(afterFirst[0].tier).toBe('developing');
    expect(afterFirst[0].evidenceState).toBe('observed');

    const second = await post(learner.id, DLO_ID, 'confirm');
    expect(second.status).toBe(200);
    expect(await linksFor(learner.id)).toHaveLength(1);

    const dispute = await post(learner.id, DLO_ID, 'dispute');
    expect(dispute.status).toBe(200);
    expect(await dispute.json()).toEqual({ success: true, dloId: DLO_ID, action: 'dispute' });
    expect(await linksFor(learner.id)).toHaveLength(0);
  });

  it('returns 400 for a malformed dloId', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'Sage' });

    const res = await post(learner.id, 'not-a-dlo', 'confirm');
    expect(res.status).toBe(400);
    expect(
      await db.select().from(observationDloLinks).where(eq(observationDloLinks.learnerId, learner.id)),
    ).toHaveLength(0);
  });
});
