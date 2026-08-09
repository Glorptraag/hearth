/**
 * Integration tests for POST/DELETE /api/device-tokens — the native push
 * registration endpoint (App Store / Play pivot, Phase 3).
 *
 * Real Postgres via transaction-rollback isolation. The load-bearing case is
 * the token-move upsert: a push token names a physical device, so a device
 * re-registering under a different family must transfer the row, never
 * duplicate it — a duplicate pushes family A's notification to a device now
 * signed into family B.
 */
import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { deviceTokens } from '@/lib/db/schema';
import { createFamily } from '@/test/db-factories';
import { asUser, asSignedOut, asOtherFamily } from '@/test/clerk-helpers';
import { TEST_FAMILY_ID, TEST_USER_ID } from '../../../../vitest.setup';
import { POST, DELETE } from './route';

const APNS_TOKEN = 'a'.repeat(64);

function jsonReq(method: 'POST' | 'DELETE', body: unknown) {
  return new NextRequest('http://x/api/device-tokens', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function seedOwnFamily() {
  await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
  asUser({});
}

describe('POST /api/device-tokens', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await POST(jsonReq('POST', { token: APNS_TOKEN, platform: 'ios' }));
    expect(res.status).toBe(401);
  });

  it('rejects an unknown platform', async () => {
    await seedOwnFamily();
    const res = await POST(jsonReq('POST', { token: APNS_TOKEN, platform: 'windows' }));
    expect(res.status).toBe(400);
  });

  it('registers a device token for the signed-in family', async () => {
    await seedOwnFamily();
    const res = await POST(jsonReq('POST', { token: APNS_TOKEN, platform: 'ios' }));
    expect(res.status).toBe(200);

    const rows = await db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.token, APNS_TOKEN));
    expect(rows).toHaveLength(1);
    expect(rows[0].familyId).toBe(TEST_FAMILY_ID);
    expect(rows[0].clerkUserId).toBe(TEST_USER_ID);
    expect(rows[0].platform).toBe('ios');
  });

  it('is idempotent for the same device re-registering', async () => {
    await seedOwnFamily();
    await POST(jsonReq('POST', { token: APNS_TOKEN, platform: 'ios' }));
    const res = await POST(jsonReq('POST', { token: APNS_TOKEN, platform: 'ios' }));
    expect(res.status).toBe(200);

    const rows = await db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.token, APNS_TOKEN));
    expect(rows).toHaveLength(1);
  });

  it('moves the token when the device re-registers under another family', async () => {
    await seedOwnFamily();
    await POST(jsonReq('POST', { token: APNS_TOKEN, platform: 'ios' }));

    const otherFamily = await createFamily(db, { clerkUserId: 'user_other_1' });
    asOtherFamily();
    const res = await POST(jsonReq('POST', { token: APNS_TOKEN, platform: 'ios' }));
    expect(res.status).toBe(200);

    const rows = await db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.token, APNS_TOKEN));
    expect(rows).toHaveLength(1);
    expect(rows[0].familyId).toBe(otherFamily.id);
    expect(rows[0].clerkUserId).toBe('user_other_1');
  });
});

describe('DELETE /api/device-tokens', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await DELETE(jsonReq('DELETE', { token: APNS_TOKEN }));
    expect(res.status).toBe(401);
  });

  it('unregisters the caller family token and is idempotent', async () => {
    await seedOwnFamily();
    await POST(jsonReq('POST', { token: APNS_TOKEN, platform: 'android' }));

    const res = await DELETE(jsonReq('DELETE', { token: APNS_TOKEN }));
    expect(res.status).toBe(200);
    const again = await DELETE(jsonReq('DELETE', { token: APNS_TOKEN }));
    expect(again.status).toBe(200);

    const rows = await db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.token, APNS_TOKEN));
    expect(rows).toHaveLength(0);
  });

  it('cannot unregister another family device', async () => {
    await seedOwnFamily();
    await POST(jsonReq('POST', { token: APNS_TOKEN, platform: 'ios' }));

    await createFamily(db, { clerkUserId: 'user_other_1' });
    asOtherFamily();
    const res = await DELETE(jsonReq('DELETE', { token: APNS_TOKEN }));
    expect(res.status).toBe(200);

    const rows = await db
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.token, APNS_TOKEN));
    expect(rows).toHaveLength(1);
  });
});
