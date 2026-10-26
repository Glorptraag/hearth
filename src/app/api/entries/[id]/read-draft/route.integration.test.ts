/**
 * INTEGRATION: PATCH /api/entries/[id]/read-draft (launch pivot W3.3; A1, D-LP-2).
 *
 * Real DB. Accepting the Photo Read draft is the ONLY way Read text becomes
 * entry text: it writes description + `drafted_by = 'read'`, is write-checked
 * (viewer 403, nothing written), never touches another family's entry (404),
 * never overwrites the parent's own words (409), needs a valid Read (409), and
 * makes no model call.
 */
import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import Anthropic from '@anthropic-ai/sdk';
import { asSignedOut, asUser, asViewer } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { familyMembers, learningEntries } from '@/lib/db/schema';
import { createEntry, createFamily } from '@/test/db-factories';
import { PATCH } from './route';
import { TEST_FAMILY_ID, TEST_USER_ID } from '../../../../../../vitest.setup';

const READ = {
  seen: ['worksheet', 'pencil'],
  doing: 'A child is writing numbers on a worksheet at a table.',
  artefact: 'worksheet',
  printedText: 'Math-U-See Alpha Lesson 12',
  peopleVisible: 1,
  confidence: 'high',
  promptVersion: 'read-v1',
};

function patch(id: string, body: unknown) {
  return PATCH(
    new NextRequest(`http://x/api/entries/${id}/read-draft`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );
}

async function row(id: string) {
  return db.query.learningEntries.findFirst({ where: eq(learningEntries.id, id) });
}

async function photoEntry(overrides: Parameters<typeof createEntry>[1] = {}) {
  return createEntry(db, {
    familyId: TEST_FAMILY_ID,
    status: 'complete',
    title: 'Photo on 6 Oct',
    description: '',
    readOutput: READ,
    aiEnrichment: { status: 'enriched' },
    ...overrides,
  });
}

describe('PATCH /api/entries/[id]/read-draft — real DB', () => {
  it('401s when signed out', async () => {
    asSignedOut();
    expect((await patch(crypto.randomUUID(), { text: 'x' })).status).toBe(401);
  });

  it('owner accepts the draft: text + drafted_by read + a real title, no model call', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const entry = await photoEntry();
    vi.mocked(Anthropic).mockClear();

    const res = await patch(entry.id, { text: `  ${READ.doing}  ` });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ description: READ.doing, draftedBy: 'read' });

    const saved = await row(entry.id);
    expect(saved?.description).toBe(READ.doing);
    expect(saved?.draftedBy).toBe('read');
    expect(saved?.title).toBe('A child is writing numbers on a worksheet at a table.');
    expect(saved?.aiEnrichment).toEqual({ status: 'enriched' }); // not re-enriched
    expect(Anthropic).not.toHaveBeenCalled();
  });

  it('accepts an edited draft, and lets an accepted draft be edited again', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const entry = await photoEntry();

    expect((await patch(entry.id, { text: 'Sam did Lesson 12 of his maths.' })).status).toBe(200);
    expect((await patch(entry.id, { text: 'Sam did Lesson 12, all of it.' })).status).toBe(200);
    expect((await row(entry.id))?.description).toBe('Sam did Lesson 12, all of it.');
  });

  it('never replaces words the parent wrote (409)', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const entry = await photoEntry({ description: 'We did maths at the kitchen table.' });
    expect((await patch(entry.id, { text: READ.doing })).status).toBe(409);
    const saved = await row(entry.id);
    expect(saved?.description).toBe('We did maths at the kitchen table.');
    expect(saved?.draftedBy).toBe('parent');
  });

  it('409s when the entry has no valid Read', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const none = await photoEntry({ readOutput: null });
    const invalid = await photoEntry({ readOutput: { doing: 'x' } });
    expect((await patch(none.id, { text: 'Anything' })).status).toBe(409);
    expect((await patch(invalid.id, { text: 'Anything' })).status).toBe(409);
    expect((await row(none.id))?.draftedBy).toBe('parent');
  });

  it('400s on empty or malformed text', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const entry = await photoEntry();
    expect((await patch(entry.id, { text: '   ' })).status).toBe(400);
    expect((await patch(entry.id, {})).status).toBe(400);
    expect((await patch(entry.id, { text: 'ok', draftedBy: 'read' })).status).toBe(400);
    expect((await row(entry.id))?.description).toBe('');
  });

  it('404s for another family’s entry and writes nothing', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const other = await createFamily(db, { id: crypto.randomUUID(), clerkUserId: 'user-other' });
    const theirs = await photoEntry({ familyId: other.id });
    expect((await patch(theirs.id, { text: READ.doing })).status).toBe(404);
    expect((await patch('not-a-uuid', { text: READ.doing })).status).toBe(404);
    expect((await row(theirs.id))?.draftedBy).toBe('parent');
  });

  it('rejects a viewer with 403 and writes nothing', async () => {
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: 'user_owner_xyz' });
    await db.insert(familyMembers).values({
      familyId: TEST_FAMILY_ID,
      clerkUserId: TEST_USER_ID,
      email: 'viewer@example.com',
      role: 'viewer',
      status: 'active',
    });
    asViewer({});
    const entry = await photoEntry();
    expect((await patch(entry.id, { text: READ.doing })).status).toBe(403);
    expect((await row(entry.id))?.description).toBe('');
  });
});
