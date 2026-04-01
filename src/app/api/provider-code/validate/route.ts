import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { providerCodes } from '@/lib/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, message: 'Invalid request' }, { status: 400 });
  }

  const code = body.code?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json({ valid: false, message: 'Please enter a provider code.' });
  }

  const providerCode = await db.query.providerCodes.findFirst({
    where: and(eq(providerCodes.code, code), isNull(providerCodes.redeemedAt)),
  });

  if (!providerCode) {
    return NextResponse.json({ valid: false, message: 'Code not recognised or already used.' });
  }

  return NextResponse.json({
    valid: true,
    message: 'Code accepted — pricing will be adjusted at checkout.',
  });
}
