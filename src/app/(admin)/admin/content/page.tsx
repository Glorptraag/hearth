import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth/admin';
import { sanityClient } from '@/lib/sanity/client';
import { CAPABILITY_THREADS_QUERY, ASSETS_QUERY, COMMONS_TEXTS_QUERY } from '@/lib/sanity/queries';
import { db } from '@/lib/db';
import { contentStudioDrafts } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { CapabilityThreadOption } from '@/lib/content-studio/types';
import ContentStudioClient from './ContentStudioClient';
import type { SanityAssetOption, SanityCommonsTextOption } from './ContentStudioClient';

export default async function ContentStudioPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');
  if (!isAdmin(userId)) redirect('/dashboard');

  const [threads, drafts, assets, commonsTexts] = await Promise.all([
    sanityClient.fetch<CapabilityThreadOption[]>(CAPABILITY_THREADS_QUERY),
    db
      .select({
        id: contentStudioDrafts.id,
        title: contentStudioDrafts.title,
        draftType: contentStudioDrafts.draftType,
        status: contentStudioDrafts.status,
        updatedAt: contentStudioDrafts.updatedAt,
      })
      .from(contentStudioDrafts)
      .where(eq(contentStudioDrafts.clerkUserId, userId))
      .orderBy(desc(contentStudioDrafts.updatedAt))
      .limit(50),
    sanityClient.fetch<SanityAssetOption[]>(ASSETS_QUERY),
    sanityClient.fetch<SanityCommonsTextOption[]>(COMMONS_TEXTS_QUERY),
  ]);

  return (
    <ContentStudioClient
      capabilityThreads={threads ?? []}
      existingDrafts={drafts}
      sanityAssets={assets ?? []}
      sanityCommonsTexts={commonsTexts ?? []}
    />
  );
}
