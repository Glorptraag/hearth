// Unit tests for the Stripe webhook handler.
// Mocks the Stripe SDK's signature verifier rather than reconstructing a real
// HMAC — the contract we care about is "if constructEvent throws, return 400;
// if it returns a checkout.session.completed, write an entitlement row".

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => {
  const constructEvent = vi.fn();
  const onConflictDoNothing = vi.fn().mockResolvedValue([{ id: 'ent_1' }]);
  const values = vi.fn(() => ({ onConflictDoNothing }));
  const insert = vi.fn(() => ({ values }));
  const trackServer = vi.fn().mockResolvedValue(undefined);
  return { constructEvent, insert, values, onConflictDoNothing, trackServer };
});

vi.mock('@/lib/stripe/client', () => ({
  getStripe: () => ({ webhooks: { constructEvent: mocks.constructEvent } }),
}));

vi.mock('@/lib/db', () => ({
  db: { insert: mocks.insert },
}));

vi.mock('@/lib/db/schema', () => ({
  entitlements: { _: 'entitlements-table' },
}));

vi.mock('@/lib/analytics/posthog-server', () => ({
  trackServer: mocks.trackServer,
}));

import { POST } from './route';

function makeRequest(body: string, sig: string | null) {
  const headers = new Map<string, string>();
  if (sig) headers.set('stripe-signature', sig);
  return {
    headers: { get: (k: string) => headers.get(k.toLowerCase()) ?? headers.get(k) ?? null },
    text: async () => body,
  } as unknown as Parameters<typeof POST>[0];
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.values.mockReturnValue({ onConflictDoNothing: mocks.onConflictDoNothing });
  mocks.insert.mockReturnValue({ values: mocks.values });
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
});

describe('POST /api/stripe/webhook', () => {
  it('returns 400 when signature header is missing', async () => {
    const res = await POST(makeRequest('{}', null));
    expect(res.status).toBe(400);
    expect(mocks.constructEvent).not.toHaveBeenCalled();
  });

  it('returns 400 when signature verification throws', async () => {
    mocks.constructEvent.mockImplementation(() => {
      throw new Error('bad sig');
    });
    const res = await POST(makeRequest('{}', 't=1,v1=deadbeef'));
    expect(res.status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('writes an entitlement row and fires pack_purchased on checkout.session.completed', async () => {
    mocks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          payment_status: 'paid',
          amount_total: 2900,
          currency: 'aud',
          customer: 'cus_abc',
          metadata: {
            familyId: 'fam_1',
            sanityPackId: 'pack_1',
            packTitle: 'Sky & Soil',
          },
        },
      },
    });

    const res = await POST(makeRequest('{}', 't=1,v1=valid'));
    expect(res.status).toBe(200);
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.values).toHaveBeenCalledWith(
      expect.objectContaining({
        familyId: 'fam_1',
        sanityPackId: 'pack_1',
        stripeSessionId: 'cs_test_123',
        stripeCustomerId: 'cus_abc',
        amountCents: 2900,
        currency: 'aud',
      }),
    );
    expect(mocks.trackServer).toHaveBeenCalledWith(
      'pack_purchased',
      'fam_1',
      expect.objectContaining({
        sanity_pack_id: 'pack_1',
        amount_cents: 2900,
        currency: 'aud',
        stripe_session_id: 'cs_test_123',
      }),
      { familyId: 'fam_1' },
    );
  });

  it('skips the write when metadata is missing (logs only)', async () => {
    mocks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_456', payment_status: 'paid', metadata: {} } },
    });

    const res = await POST(makeRequest('{}', 't=1,v1=valid'));
    expect(res.status).toBe(200);
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.trackServer).not.toHaveBeenCalled();
  });

  it('skips the write when session is not yet paid', async () => {
    mocks.constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_789',
          payment_status: 'unpaid',
          metadata: { familyId: 'fam_1', sanityPackId: 'pack_1' },
        },
      },
    });

    const res = await POST(makeRequest('{}', 't=1,v1=valid'));
    expect(res.status).toBe(200);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it('ignores event types other than checkout.session.completed', async () => {
    mocks.constructEvent.mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_test_1' } },
    });

    const res = await POST(makeRequest('{}', 't=1,v1=valid'));
    expect(res.status).toBe(200);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
