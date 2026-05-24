// GET /api/entitlements — returns the set of Sanity pack IDs the signed-in
// family has purchased (one row per family×pack thanks to the UNIQUE index).
// Marketplace card uses this to swap "Get Pack" for an "Owned" state without
// round-tripping Stripe.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { entitlements } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const rows = await db
    .select({ sanityPackId: entitlements.sanityPackId })
    .from(entitlements)
    .where(eq(entitlements.familyId, family.id));

  return NextResponse.json(rows.map((r) => r.sanityPackId));
}
