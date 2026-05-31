import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { families, familyLibrary } from '@/lib/db/schema';
import { getOrCreateFamily } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { sanityClient } from '@/lib/sanity/client';
import { routeHandler } from '@/lib/api-helpers';

export const POST = routeHandler(async () => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await currentUser();
  const familyName = user?.lastName?.trim()
    ? `${user.lastName.trim()} Family`
    : undefined;
  const family = await getOrCreateFamily(userId, familyName);

  // Mark onboarding complete
  await db
    .update(families)
    .set({ onboardingComplete: true, updatedAt: new Date() })
    .where(eq(families.id, family.id));

  // Add Starter Collection to library (find it in Sanity)
  try {
    const starterPack = await sanityClient.fetch<{ _id: string } | null>(
      // Sanity-gated: only seed a published starter pack.
      // See src/lib/sanity/queries.ts header for invariant.
      `*[_type == "pack" && status == "published" && title match "Starter*"][0]{ _id }`
    );

    if (starterPack) {
      await db
        .insert(familyLibrary)
        .values({ familyId: family.id, sanityPackId: starterPack._id })
        .onConflictDoNothing();
    }
  } catch {
    // Non-blocking — starter pack is nice-to-have
  }

  return NextResponse.json({ success: true });
}, { route: 'POST /api/onboarding/complete' });
