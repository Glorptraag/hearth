/**
 * INTEGRATION: GET/PATCH /api/family/photo-read (launch pivot W3.2; P4, D-LP-4).
 *
 * Real DB. Pins that the consent column round-trips, that only an owner or
 * editor can change it (a viewer gets 403 and nothing is written), that the
 * body is strictly validated, and that `readAvailable` follows the flag +
 * allowlist rather than the consent.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { asEditor, asSignedOut, asUser, asViewer } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { families, familyMembers } from '@/lib/db/schema';
import { createFamily } from '@/test/db-factories';
import { GET, PATCH } from './route';
import { TEST_FAMILY_ID, TEST_USER_ID } from '../../../../../vitest.setup';

function patch(body: unknown) {
  return PATCH(
    new NextRequest('http://x/api/family/photo-read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

function getConsent() {
  return GET();
}

async function storedOptIn() {
  const row = await db.query.families.findFirst({ where: eq(families.id, TEST_FAMILY_ID) });
  return row?.photoReadOptIn;
}

async function seedMember(role: 'viewer' | 'editor') {
  await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: 'user_owner_xyz' });
  await db.insert(familyMembers).values({
    familyId: TEST_FAMILY_ID,
    clerkUserId: TEST_USER_ID,
    email: `${role}@example.com`,
    role,
    status: 'active',
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('/api/family/photo-read — real DB', () => {
  it('401s when signed out', async () => {
    asSignedOut();
    expect((await getConsent()).status).toBe(401);
    expect((await patch({ optIn: true })).status).toBe(401);
  });

  it('starts unanswered (null), and Read is unavailable with the flag off', async () => {
    asUser({});
    vi.stubEnv('PHOTO_READ_ENABLED', '');
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    const res = await getConsent();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ optIn: null, readAvailable: false });
  });

  it('owner opts in and out; the column round-trips', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const on = await patch({ optIn: true });
    expect(on.status).toBe(200);
    expect(await on.json()).toMatchObject({ optIn: true });
    expect(await storedOptIn()).toBe(true);

    const off = await patch({ optIn: false });
    expect(await off.json()).toMatchObject({ optIn: false });
    expect(await storedOptIn()).toBe(false);
    expect(await (await getConsent()).json()).toMatchObject({ optIn: false });
  });

  it('an editor can answer for the family', async () => {
    await seedMember('editor');
    asEditor({});
    expect((await patch({ optIn: true })).status).toBe(200);
    expect(await storedOptIn()).toBe(true);
  });

  it('a viewer can read the setting but gets 403 on write, and nothing changes', async () => {
    await seedMember('viewer');
    asViewer({});
    expect((await getConsent()).status).toBe(200);
    const res = await patch({ optIn: true });
    expect(res.status).toBe(403);
    expect(await storedOptIn()).toBeNull();
  });

  it('rejects a malformed body with 400 and writes nothing', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    expect((await patch({ optIn: 'yes' })).status).toBe(400);
    expect((await patch({})).status).toBe(400);
    expect((await patch({ optIn: true, photoReadOptIn: true })).status).toBe(400);
    expect(await storedOptIn()).toBeNull();
  });

  it('readAvailable follows the flag and allowlist, not the consent', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
    vi.stubEnv('PHOTO_READ_ENABLED', 'true');
    vi.stubEnv('PHOTO_READ_FAMILY_ALLOWLIST', TEST_FAMILY_ID);
    expect(await (await getConsent()).json()).toEqual({ optIn: null, readAvailable: true });

    vi.stubEnv('PHOTO_READ_FAMILY_ALLOWLIST', 'demo-family-only');
    expect(await (await patch({ optIn: true })).json()).toEqual({ optIn: true, readAvailable: false });
  });
});
