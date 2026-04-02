import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { stripe } from '@/lib/stripe/client';
import { db } from '@/lib/db';
import { families } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { parseBody } from '@/lib/api-helpers';

const checkoutSchema = z.object({
  priceId: z.string().min(1),
  packId: z.string().min(1),
  packTitle: z.string().min(1),
});

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const result = await parseBody(request, checkoutSchema);
  if ('error' in result) return result.error;

  const { priceId, packId, packTitle } = result.data;

  const origin = request.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/explore/marketplace?purchased=${packId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/explore/marketplace`,
      metadata: {
        familyId: family.id,
        packId,
        packTitle,
      },
      // Customer details
      customer_email: userId, // Clerk userId as fallback — webhook creates customer
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create checkout session', detail: message }, { status: 500 });
  }
}
