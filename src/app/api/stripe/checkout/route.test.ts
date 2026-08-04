// Unit tests for the Stripe checkout-session creator.
//
// The contract under test is the App Store / Play compliance guard: a request
// from the Capacitor shell must never reach Stripe. Hiding the CTA in the UI
// is not enough — App Review probes past the visible interface, and the AU
// storefront has no external-purchase-link entitlement to fall back on. This
// is the guard that actually holds. See docs/hearth-native-app-plan-v1.md.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NATIVE_UA_MARKER } from '@/lib/platform/native';

const mocks = vi.hoisted(() => {
  const sessionsCreate = vi.fn().mockResolvedValue({ url: 'https://stripe.test/session', id: 'cs_1' });
  const auth = vi.fn().mockResolvedValue({ userId: 'user_1' });
  const getFamilyByClerkId = vi.fn().mockResolvedValue({ id: 'fam_1' });
  const sanityFetch = vi.fn().mockResolvedValue({
    _id: 'pack-1',
    title: 'Ocean Pack',
    availability: 'premium',
    stripePriceId: 'price_1',
  });
  const rateLimit = vi.fn(() => ({ success: true }));
  return { sessionsCreate, auth, getFamilyByClerkId, sanityFetch, rateLimit };
});

vi.mock('@clerk/nextjs/server', () => ({ auth: mocks.auth }));
vi.mock('@/lib/stripe/client', () => ({
  getStripe: () => ({ checkout: { sessions: { create: mocks.sessionsCreate } } }),
}));
vi.mock('@/lib/sanity/client', () => ({
  sanityClient: { fetch: mocks.sanityFetch },
  sanityServerClient: { fetch: mocks.sanityFetch },
}));
vi.mock('@/lib/auth/helpers', () => ({ getFamilyByClerkId: mocks.getFamilyByClerkId }));
vi.mock('@/lib/rate-limit', () => ({ rateLimit: mocks.rateLimit }));

import { POST } from './route';

function makeRequest(userAgent: string) {
  return {
    headers: new Headers({ 'user-agent': userAgent, 'content-type': 'application/json' }),
    json: async () => ({ packId: 'pack-1', packTitle: 'Ocean Pack' }),
    nextUrl: { origin: 'https://hearth.test' },
  } as unknown as Parameters<typeof POST>[0];
}

const NATIVE_UA = `Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) ${NATIVE_UA_MARKER}/1`;
const WEB_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ userId: 'user_1' });
  mocks.getFamilyByClerkId.mockResolvedValue({ id: 'fam_1' });
  mocks.rateLimit.mockReturnValue({ success: true });
  mocks.sanityFetch.mockResolvedValue({
    _id: 'pack-1',
    title: 'Ocean Pack',
    availability: 'premium',
    stripePriceId: 'price_1',
  });
});

describe('POST /api/stripe/checkout — native builds', () => {
  it('403s a request from the Capacitor shell', async () => {
    const res = await POST(makeRequest(NATIVE_UA));

    expect(res.status).toBe(403);
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });

  it('refuses before authenticating, so the guard cannot be reached around', async () => {
    // Ordering matters: the native check runs ahead of auth, family lookup and
    // rate limiting, so no signed-in state can get past it.
    await POST(makeRequest(NATIVE_UA));

    expect(mocks.auth).not.toHaveBeenCalled();
    expect(mocks.getFamilyByClerkId).not.toHaveBeenCalled();
    expect(mocks.sessionsCreate).not.toHaveBeenCalled();
  });
});

describe('POST /api/stripe/checkout — web', () => {
  it('still creates a checkout session for a browser', async () => {
    const res = await POST(makeRequest(WEB_UA));

    expect(res.status).toBe(200);
    expect(mocks.sessionsCreate).toHaveBeenCalledTimes(1);
    await expect(res.json()).resolves.toMatchObject({ url: 'https://stripe.test/session' });
  });

  it('passes the family and pack through to Stripe metadata', async () => {
    await POST(makeRequest(WEB_UA));

    const arg = mocks.sessionsCreate.mock.calls[0][0];
    expect(arg.metadata).toMatchObject({ familyId: 'fam_1', sanityPackId: 'pack-1' });
  });
});
