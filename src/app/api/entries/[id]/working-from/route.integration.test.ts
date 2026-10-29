/**
 * INTEGRATION: /api/entries/[id]/working-from (launch pivot W3.3; W2.4, D-LP-6).
 *
 * Real DB, Shelf pinned to the wave-1 fixture. The suggestion is the
 * deterministic match on the stored Read's printed header; working_from is
 * written only on the parent's confirm; 'read' provenance must equal the
 * server's own match; write-checked; cross-family 404.
 */
import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { asSignedOut, asUser, asViewer } from '@/test/clerk-helpers';
import { SHELF_FIXTURE } from '@/lib/shelf/match.test-fixtures';

vi.mock('@/lib/shelf/query', () => ({
  getShelfResources: vi.fn(async () => SHELF_FIXTURE),
}));

import { db } from '@/lib/db';
import { familyMembers, learningEntries } from '@/lib/db/schema';
import { createEntry, createFamily } from '@/test/db-factories';
import { GET, PATCH } from './route';
import { TEST_FAMILY_ID, TEST_USER_ID } from '../../../../../../vitest.setup';

const READ = {
  seen: ['worksheet'],
  doing: 'A child is writing numbers on a worksheet.',
  artefact: 'worksheet',
  printedText: 'Math-U-See Alpha Lesson 12',
  peopleVisible: 1,
  confidence: 'high',
};

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function get(id: string) {
  return GET(new NextRequest(`http://x/api/entries/${id}/working-from`), ctx(id));
}

function patch(id: string, body: unknown) {
  return PATCH(
    new NextRequest(`http://x/api/entries/${id}/working-from`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    ctx(id),
  );
}

async function stored(id: string) {
  return (await db.query.learningEntries.findFirst({ where: eq(learningEntries.id, id) }))?.workingFrom;
}

async function ownerWithEntry(readOutput: unknown = READ) {
  asUser({});
  await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
  return createEntry(db, { familyId: TEST_FAMILY_ID, status: 'complete', readOutput: readOutput as never });
}

describe('/api/entries/[id]/working-from — real DB', () => {
  it('401s when signed out', async () => {
    asSignedOut();
    const id = crypto.randomUUID();
    expect((await get(id)).status).toBe(401);
    expect((await patch(id, { workingFrom: null })).status).toBe(401);
  });

  it('suggests the deterministic Shelf match and lists the Shelf, writing nothing', async () => {
    const entry = await ownerWithEntry();
    const res = await get(entry.id);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestion).toEqual({
      resourceId: 'shelfResource.math-u-see',
      title: 'Math-U-See',
      level: 'Alpha',
      lesson: '12',
    });
    expect(body.resources.map((r: { id: string }) => r.id)).toContain('shelfResource.my-own-plan');
    expect(body.current).toBeNull();
    expect(await stored(entry.id)).toBeNull();
  });

  it('suggests nothing when there is no Read or no recognisable header', async () => {
    const none = await ownerWithEntry(null);
    expect((await (await get(none.id)).json()).suggestion).toBeNull();
    const vague = await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      readOutput: { ...READ, printedText: 'Page 4' },
    });
    expect((await (await get(vague.id)).json()).suggestion).toBeNull();
  });

  it('writes working_from on confirm with read provenance', async () => {
    const entry = await ownerWithEntry();
    const res = await patch(entry.id, {
      workingFrom: { resourceId: 'shelfResource.math-u-see', level: 'Alpha', lesson: '12', source: 'read' },
    });
    expect(res.status).toBe(200);
    expect(await stored(entry.id)).toEqual({
      resourceId: 'shelfResource.math-u-see',
      level: 'Alpha',
      lesson: '12',
      source: 'read',
    });
    expect((await (await get(entry.id)).json()).current).toMatchObject({ source: 'read' });
  });

  it('records a parent change as parent provenance, and null clears it', async () => {
    const entry = await ownerWithEntry();
    await patch(entry.id, { workingFrom: { resourceId: 'shelfResource.my-own-plan', source: 'parent' } });
    expect(await stored(entry.id)).toEqual({ resourceId: 'shelfResource.my-own-plan', source: 'parent' });
    await patch(entry.id, { workingFrom: null });
    expect(await stored(entry.id)).toBeNull();
  });

  it('refuses read provenance for a resource the Read did not match', async () => {
    const entry = await ownerWithEntry();
    const res = await patch(entry.id, {
      workingFrom: { resourceId: 'shelfResource.all-about-reading', source: 'read' },
    });
    expect(res.status).toBe(400);
    expect(await stored(entry.id)).toBeNull();
  });

  it('400s on an unknown resource, unknown level or a malformed lesson', async () => {
    const entry = await ownerWithEntry();
    expect((await patch(entry.id, { workingFrom: { resourceId: 'shelfResource.nope', source: 'parent' } })).status).toBe(400);
    expect(
      (await patch(entry.id, { workingFrom: { resourceId: 'shelfResource.math-u-see', level: 'Omega', source: 'parent' } }))
        .status,
    ).toBe(400);
    expect(
      (await patch(entry.id, { workingFrom: { resourceId: 'shelfResource.math-u-see', lesson: 'twelve', source: 'parent' } }))
        .status,
    ).toBe(400);
    expect(await stored(entry.id)).toBeNull();
  });

  it('404s for another family’s entry', async () => {
    await ownerWithEntry();
    const other = await createFamily(db, { id: crypto.randomUUID(), clerkUserId: 'user-other' });
    const theirs = await createEntry(db, { familyId: other.id, readOutput: READ });
    expect((await get(theirs.id)).status).toBe(404);
    const res = await patch(theirs.id, { workingFrom: { resourceId: 'shelfResource.my-own-plan', source: 'parent' } });
    expect(res.status).toBe(404);
    expect(await stored(theirs.id)).toBeNull();
  });

  it('lets a viewer see the suggestion but not write it', async () => {
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: 'user_owner_xyz' });
    await db.insert(familyMembers).values({
      familyId: TEST_FAMILY_ID,
      clerkUserId: TEST_USER_ID,
      email: 'viewer@example.com',
      role: 'viewer',
      status: 'active',
    });
    asViewer({});
    const entry = await createEntry(db, { familyId: TEST_FAMILY_ID, readOutput: READ });
    expect((await get(entry.id)).status).toBe(200);
    const res = await patch(entry.id, { workingFrom: { resourceId: 'shelfResource.my-own-plan', source: 'parent' } });
    expect(res.status).toBe(403);
    expect(await stored(entry.id)).toBeNull();
  });
});
