// Stripe checkout-session creator for one-time pack purchases.
// Auth via Clerk → resolve family → re-fetch the pack from Sanity (never
// trust a client-supplied priceId) → create a session with metadata for the
// webhook → return URL. The webhook (POST /api/stripe/webhook) reads the
// metadata fields back out to write the entitlement row.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { sanityClient } from '@/lib/sanity/client';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { getStripe } from '@/lib/stripe/client';
import { rateLimit } from '@/lib/rate-limit';
import { parseBody } from '@/lib/api-helpers';

const bodySchema = z.object({
  packId: z.string().min(1),
  priceId: z.string().optional(),
  packTitle: z.string().optional(),
  returnUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = rateLimit(`stripe-checkout:${userId}`, { limit: 10, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const parsed = await parseBody(request, bodySchema);
  if ('error' in parsed) return parsed.error;
  const { packId, priceId: clientPriceId, returnUrl } = parsed.data;

  const pack = await sanityClient.fetch<{
    _id: string;
    title: string;
    availability?: 'included' | 'premium';
    stripePriceId?: string;
  } | null>(
    `*[_type == "pack" && _id == $packId][0]{ _id, title, availability, stripePriceId }`,
    { packId },
  );

  if (!pack) return NextResponse.json({ error: 'Pack not found' }, { status: 404 });
  if (pack.availability !== 'premium') {
    return NextResponse.json({ error: 'Pack is not premium' }, { status: 400 });
  }
  if (!pack.stripePriceId) {
    return NextResponse.json({ error: 'Pack is missing a Stripe price' }, { status: 500 });
  }

  if (clientPriceId && clientPriceId !== pack.stripePriceId) {
    console.warn('[stripe-checkout] client priceId mismatch', {
      packId,
      clientPriceId,
      serverPriceId: pack.stripePriceId,
    });
  }

  const origin = request.headers.get('origin') ?? request.nextUrl.origin;
  const successUrl = returnUrl ?? `${origin}/explore/marketplace?purchased=${encodeURIComponent(packId)}`;
  const cancelUrl = `${origin}/explore/marketplace?canceled=1`;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: pack.stripePriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Metadata is the contract with the webhook. Keep keys in sync with
      // src/app/api/stripe/webhook/route.ts.
      metadata: {
        familyId: family.id,
        sanityPackId: pack._id,
        packTitle: pack.title,
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[stripe-checkout] session create failed:', err);
    return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 });
  }
}
