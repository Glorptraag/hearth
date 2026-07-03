/**
 * Integration tests for the module_runs persistence loop — the routes that
 * turn the (previously ghost) module_runs table into the library status
 * board's data source:
 *
 *   POST /api/module-runs            open-or-create (idempotent resume)
 *   PATCH /api/module-runs/[id]      touch / finish
 *   POST /api/entries {moduleRunId}  stamps the entry + finishes the run
 *   GET /api/library/status          the payoff: an open run reads in_flight
 */
import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { asUser, asSignedOut } from '@/test/clerk-helpers';

// The library/status route resolves pack→module rollups through the
// server-only `sanityFetch`. Stub it so importing the route doesn't pull in
// `server-only` (hard-errors under the node test env); these tests seed a
// standalone module, never packs, so [] is the honest expansion.
vi.mock('@/lib/sanity/server-fetch', () => ({
  sanityFetch: vi.fn().mockResolvedValue([]),
  SANITY_CONTENT_TAG: 'sanity:content',
}));
import { db } from '@/lib/db';
import { createFamily, createModuleRun } from '@/test/db-factories';
import { familyLibrary, learningEntries, moduleRuns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { POST } from './route';
import { PATCH } from './[id]/route';
import { POST as postEntry } from '../entries/route';
import { GET as getLibraryStatus } from '../library/status/route';
import type { LibraryStatusResponse } from '../library/status/route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../vitest.setup';

function jsonReq(url: string, method: 'POST' | 'PATCH', body: unknown) {
  return new NextRequest(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const postRun = (body: unknown) => POST(jsonReq('http://x/api/module-runs', 'POST', body));
const patchRun = (id: string, body: unknown) =>
  PATCH(jsonReq(`http://x/api/module-runs/${id}`, 'PATCH', body), {
    params: Promise.resolve({ id }),
  });

describe('POST /api/module-runs — open-or-create', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await postRun({ sanityModuleId: 'mod-x' });
    expect(res.status).toBe(401);
  });

  it('creates an active sustained run on first entry into facilitate', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await postRun({ sanityModuleId: 'mod-run-1', approachId: 'approach-a' });
    expect(res.status).toBe(201);
    const run = await res.json();
    expect(run.created).toBe(true);
    expect(run.state).toBe('active');
    expect(run.sessionType).toBe('sustained');
    expect(run.approachId).toBe('approach-a');
    expect(run.familyId).toBe(TEST_FAMILY_ID);
  });

  it('returns the existing open run instead of forking a second one (resume)', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const first = await (await postRun({ sanityModuleId: 'mod-run-2' })).json();
    const res = await postRun({ sanityModuleId: 'mod-run-2' });
    expect(res.status).toBe(200);
    const second = await res.json();
    expect(second.created).toBe(false);
    expect(second.id).toBe(first.id);

    const rows = await db.select().from(moduleRuns).where(eq(moduleRuns.familyId, TEST_FAMILY_ID));
    expect(rows).toHaveLength(1);
  });

  it('creates a fresh run once the previous one is finished', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const first = await (await postRun({ sanityModuleId: 'mod-run-3' })).json();
    await patchRun(first.id, { action: 'finish' });

    const res = await postRun({ sanityModuleId: 'mod-run-3' });
    expect(res.status).toBe(201);
    const second = await res.json();
    expect(second.created).toBe(true);
    expect(second.id).not.toBe(first.id);
  });
});

describe('PATCH /api/module-runs/[id]', () => {
  it('touch bumps lastActiveAt', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const stale = new Date('2026-01-01T00:00:00Z');
    const run = await createModuleRun(db, {
      familyId: TEST_FAMILY_ID,
      sanityModuleId: 'mod-touch',
      state: 'active',
      lastActiveAt: stale,
    });

    const res = await patchRun(run.id, { action: 'touch' });
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(new Date(updated.lastActiveAt).getTime()).toBeGreaterThan(stale.getTime());
    expect(updated.state).toBe('active');
  });

  it('finish sets state + finishedAt', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const run = await createModuleRun(db, {
      familyId: TEST_FAMILY_ID,
      sanityModuleId: 'mod-finish',
      state: 'active',
    });

    const res = await patchRun(run.id, { action: 'finish' });
    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.state).toBe('finished');
    expect(updated.finishedAt).not.toBeNull();
  });

  it("404s another family's run and non-UUID ids", async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const other = await createFamily(db, { id: crypto.randomUUID(), clerkUserId: 'user-other' });
    const otherRun = await createModuleRun(db, { familyId: other.id, sanityModuleId: 'mod-theirs' });

    expect((await patchRun(otherRun.id, { action: 'finish' })).status).toBe(404);
    expect((await patchRun('not-a-uuid', { action: 'touch' })).status).toBe(404);

    const [untouched] = await db.select().from(moduleRuns).where(eq(moduleRuns.id, otherRun.id));
    expect(untouched.state).toBe('active');
  });
});

describe('POST /api/entries with moduleRunId — the completion writer', () => {
  it('stamps the entry and finishes a sustained run on a complete save', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const run = await createModuleRun(db, {
      familyId: TEST_FAMILY_ID,
      sanityModuleId: 'mod-log-1',
      state: 'active',
      sessionType: 'sustained',
    });

    const res = await postEntry(
      jsonReq('http://x/api/entries', 'POST', {
        title: 'Module: Weather Station',
        sourceModuleId: 'mod-log-1',
        moduleRunId: run.id,
        source: 'module_log',
        status: 'complete',
      }),
    );
    expect(res.status).toBe(201);
    const entry = await res.json();
    expect(entry.moduleRunId).toBe(run.id);

    const [finished] = await db.select().from(moduleRuns).where(eq(moduleRuns.id, run.id));
    expect(finished.state).toBe('finished');
    expect(finished.finishedAt).not.toBeNull();
  });

  it('does NOT finish an open_ended run on log save (long-lived sessions)', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const run = await createModuleRun(db, {
      familyId: TEST_FAMILY_ID,
      sanityModuleId: 'mod-log-2',
      state: 'active',
      sessionType: 'open_ended',
    });

    const res = await postEntry(
      jsonReq('http://x/api/entries', 'POST', {
        title: 'Nature journal session',
        moduleRunId: run.id,
        status: 'complete',
      }),
    );
    expect(res.status).toBe(201);

    const [still] = await db.select().from(moduleRuns).where(eq(moduleRuns.id, run.id));
    expect(still.state).toBe('active');
  });

  it("400s an entry claiming another family's run and writes nothing", async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const other = await createFamily(db, { id: crypto.randomUUID(), clerkUserId: 'user-other' });
    const otherRun = await createModuleRun(db, { familyId: other.id, sanityModuleId: 'mod-theirs-2' });

    const res = await postEntry(
      jsonReq('http://x/api/entries', 'POST', {
        title: 'Sneaky',
        moduleRunId: otherRun.id,
        status: 'complete',
      }),
    );
    expect(res.status).toBe(400);

    const rows = await db
      .select()
      .from(learningEntries)
      .where(eq(learningEntries.familyId, TEST_FAMILY_ID));
    expect(rows).toHaveLength(0);
  });
});

describe('the payoff: library status board reads real runs', () => {
  it('a run opened through the API surfaces the library row as in_flight', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    await db.insert(familyLibrary).values({
      familyId: TEST_FAMILY_ID,
      sanityPackId: null,
      sanityModuleId: 'mod-board-1',
    });

    const run = await (await postRun({ sanityModuleId: 'mod-board-1' })).json();

    const statusRes = await getLibraryStatus();
    expect(statusRes.status).toBe(200);
    const body = (await statusRes.json()) as LibraryStatusResponse;
    const item = body.items.find((i) => i.sanityModuleId === 'mod-board-1');
    expect(item?.status).toBe('in_flight');
    expect(item?.openRunId).toBe(run.id);

    // …and the entry save flips it off in_flight.
    await postEntry(
      jsonReq('http://x/api/entries', 'POST', {
        title: 'Module: done',
        sourceModuleId: 'mod-board-1',
        moduleRunId: run.id,
        status: 'complete',
      }),
    );
    const after = (await (await getLibraryStatus()).json()) as LibraryStatusResponse;
    const afterItem = after.items.find((i) => i.sanityModuleId === 'mod-board-1');
    expect(afterItem?.status).not.toBe('in_flight');
    expect(afterItem?.openRunId).toBeNull();
  });
});
