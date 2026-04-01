import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import WelcomeWizard from './welcome-wizard';

export default async function WelcomePage() {
  const { userId } = await auth();

  if (!userId) redirect('/sign-up');

  const family = await getFamilyByClerkId(userId);

  if (family?.welcomeCompletedAt) {
    if (!family.onboardingComplete) {
      redirect('/onboarding');
    }
    redirect('/dashboard');
  }

  return <WelcomeWizard />;
}
