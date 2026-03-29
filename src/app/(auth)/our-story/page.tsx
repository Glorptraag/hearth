import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import OurStoryHubClient from '@/components/our-story/OurStoryHubClient';

export default async function OurStoryPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const family = await getFamilyByClerkId(userId);
  if (!family || !family.onboardingComplete) redirect('/onboarding');

  return <OurStoryHubClient />;
}
