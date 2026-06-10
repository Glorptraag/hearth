/**
 * Integration tests for POST /api/feedback — the in-app pilot feedback
 * capture (decisions log PR-1; research log R7 is why this exists).
 * Real Postgres: asserts the row actually lands, family-scoped, with the
 * category CHECK constraint honoured by validation before it ever hits SQL.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { asUser, asSignedOut } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { feedback } from '@/lib/db/schema';
import { createFamily } from '@/test/db-factories';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../vitest.setup';
import { POST } from './route';

function req(body: unknown) {
  return new NextRequest('http://x/api/feedback', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

const valid = {
  category: 'confusion',
  message: 'I could not find where my saved draft went after closing the app.',
  route: '/log',
};

describe('POST /api/feedback — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await POST(req(valid));
    expect(res.status).toBe(401);
  });

  it('persists a feedback row scoped to the caller family', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await POST(req(valid));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string; received: boolean };
    expect(body.received).toBe(true);

    const rows = await db.select().from(feedback).where(eq(feedback.familyId, TEST_FAMILY_ID));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      userId: TEST_USER_ID,
      category: 'confusion',
      message: valid.message,
      route: '/log',
    });
  });

  it('rejects an unknown category with 400 before touching the DB', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await POST(req({ ...valid, category: 'rant' }));
    expect(res.status).toBe(400);

    const rows = await db.select().from(feedback).where(eq(feedback.familyId, TEST_FAMILY_ID));
    expect(rows).toHaveLength(0);
  });

  it('rejects an empty message with 400', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await POST(req({ category: 'bug', message: '   ' }));
    expect(res.status).toBe(400);
  });

  it('accepts a submission without a route', async () => {
    asUser({});
    await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });

    const res = await POST(req({ category: 'praise', message: 'The report export saved my week.' }));
    expect(res.status).toBe(201);

    const rows = await db.select().from(feedback).where(eq(feedback.familyId, TEST_FAMILY_ID));
    expect(rows[0].route).toBeNull();
  });
});
