import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { db } from '@/lib/db';
import { familyLibrary } from '@/lib/db/schema';
import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });
  }

  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook signature failed: ${message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { familyId, packId } = session.metadata ?? {};

    if (familyId && packId) {
      // Grant access: upsert pack into family library
      await db
        .insert(familyLibrary)
        .values({
          familyId,
          sanityPackId: packId,
          addedAt: new Date(),
        })
        .onConflictDoNothing();
    }
  }

  return NextResponse.json({ received: true });
}
