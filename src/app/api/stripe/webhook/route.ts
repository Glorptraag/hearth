// Stripe webhook handler.
//
// Verifies the signature with STRIPE_WEBHOOK_SECRET, then handles
// `checkout.session.completed` by writing an entitlement row and firing
// the `pack_purchased` analytics event.
//
// Idempotent: the entitlements table has UNIQUE(family_id, sanity_pack_id)
// AND UNIQUE(stripe_session_id), so a replay of the same event won't
// duplicate. Stripe retries failed webhooks, so this matters.
//
// Local dev: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { db } from '@/lib/db';
import { entitlements } from '@/lib/db/schema';
import { trackServer } from '@/lib/analytics/posthog-server';
import type Stripe from 'stripe';
import { routeHandler } from '@/lib/api-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const POST = routeHandler(async (request: NextRequest) => {
  const sig = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  // Stripe requires the raw body bytes for signature verification — do not
  // use request.json() here; it normalises and breaks the HMAC.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.warn('[stripe-webhook] signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } else {
      console.info('[stripe-webhook] ignored event type:', event.type);
    }
  } catch (err) {
    console.error('[stripe-webhook] handler failed:', err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}, { route: 'POST /api/stripe/webhook' });

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const familyId = session.metadata?.familyId;
  const sanityPackId = session.metadata?.sanityPackId;

  if (!familyId || !sanityPackId) {
    console.warn('[stripe-webhook] checkout.session.completed missing metadata', { sessionId: session.id });
    return;
  }

  if (session.payment_status !== 'paid') {
    console.info('[stripe-webhook] session not yet paid, skipping', { sessionId: session.id, status: session.payment_status });
    return;
  }

  const amountCents = session.amount_total ?? 0;
  const currency = session.currency ?? 'aud';
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;

  // ON CONFLICT DO NOTHING handles the replay case at the DB layer rather
  // than relying on a check-then-insert race window.
  await db
    .insert(entitlements)
    .values({
      familyId,
      sanityPackId,
      stripeSessionId: session.id,
      stripeCustomerId: customerId,
      amountCents,
      currency,
    })
    .onConflictDoNothing();

  try {
    await trackServer(
      'pack_purchased',
      familyId,
      {
        sanity_pack_id: sanityPackId,
        amount_cents: amountCents,
        currency,
        stripe_session_id: session.id,
      },
      { familyId },
    );
  } catch (err) {
    console.warn('[stripe-webhook] analytics dispatch failed (non-fatal):', err);
  }
}
