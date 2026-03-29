import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { families, familyLibrary } from '@/lib/db/schema';
import { getOrCreateFamily } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { sanityClient } from '@/lib/sanity/client';

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getOrCreateFamily(userId);

  // Mark onboarding complete
  await db
    .update(families)
    .set({ onboardingComplete: true, updatedAt: new Date() })
    .where(eq(families.id, family.id));

  // Add Starter Collection to library (find it in Sanity)
  try {
    const starterPack = await sanityClient.fetch<{ _id: string } | null>(
      `*[_type == "pack" && title match "Starter*"][0]{ _id }`
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
}
