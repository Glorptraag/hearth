import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity/client';
import type { SkeletonRecord } from '@/lib/sanity/queries';
import { routeHandler } from '@/lib/api-helpers';

export const GET = routeHandler(async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const threadId = searchParams.get('threadId');
  const domain = searchParams.get('domain') ?? 'mathematical';
  const tier = searchParams.get('tier') ?? 'developing';
  const pref = searchParams.get('pref') ?? 'any';

  try {
    let skeletons: SkeletonRecord[] = [];

    // Try thread-specific first
    if (threadId) {
      skeletons = await sanityClient.fetch<SkeletonRecord[]>(
        `*[_type == "moduleSkeleton" && threadId == $threadId && targetTier == $targetTier && (activityPreference == $pref || activityPreference == "any")] | order(confidence asc) [0...3]`,
        { threadId, targetTier: tier, pref },
      );
    }

    // Fallback to domain-generic
    if (skeletons.length === 0) {
      skeletons = await sanityClient.fetch<SkeletonRecord[]>(
        `*[_type == "moduleSkeleton" && (!defined(threadId) || threadId == null) && domain == $domain && targetTier == $targetTier && (activityPreference == $pref || activityPreference == "any")] | order(confidence asc) [0...3]`,
        { domain, targetTier: tier, pref },
      );
    }

    return NextResponse.json(skeletons);
  } catch {
    return NextResponse.json([]);
  }
}, { route: 'GET /api/skeletons' });
