import { NextResponse } from 'next/server';

// Stripe checkout — stubbed until payment processing is implemented.
export async function POST() {
  return NextResponse.json({ error: 'Payments not configured' }, { status: 503 });
}
