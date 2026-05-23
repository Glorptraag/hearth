// Single Stripe SDK instance, lazily constructed so module imports don't
// fail in unit tests where STRIPE_SECRET_KEY is unset (mocks replace the
// client there). API version is pinned — Stripe rolls breaking changes in
// minor versions, so the pin protects against silent webhook payload drift.

import Stripe from 'stripe';

let _client: Stripe | null = null;

export function getStripe(): Stripe {
  if (_client) return _client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  _client = new Stripe(key, { apiVersion: '2026-04-22.dahlia' });
  return _client;
}
