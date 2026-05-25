import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { learners } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq } from 'drizzle-orm';
import { differenceInYears } from 'date-fns';
import { safeLoad } from '@/lib/server/safe-load';
import EmptyState from '@/components/ui/EmptyState';
import { Lifebuoy } from '@/components/icons';
import LearnerProfileClient from './LearnerProfileClient';

function LearnerErrorState() {
  return (
    <div className="mx-auto max-w-2xl px-lg py-2xl">
      <EmptyState
        icon={Lifebuoy}
        heading="Couldn't load this learner"
        body="Something went wrong on our side. Try again in a moment."
        cta={{ label: 'Back to Our Story', href: '/our-story' }}
      />
    </div>
  );
}

type Params = { params: Promise<{ id: string }> };

export default async function LearnerProfilePage({ params }: Params) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const familyResult = await safeLoad('our-story/learner', () => getFamilyByClerkId(userId));
  if (!familyResult.ok) return <LearnerErrorState />;
  const family = familyResult.data;
  if (!family || !family.onboardingComplete) redirect('/onboarding');

  const { id } = await params;

  const result = await safeLoad('our-story/learner', () =>
    db.query.learners.findFirst({
      where: and(eq(learners.id, id), eq(learners.familyId, family.id)),
    }),
  );

  if (!result.ok) return <LearnerErrorState />;
  const learner = result.data;
  if (!learner) notFound();

  const age =
    learner.dateOfBirth
      ? differenceInYears(new Date(), new Date(learner.dateOfBirth))
      : null;

  return (
    <LearnerProfileClient
      learner={{
        id: learner.id,
        name: learner.name,
        colourToken: learner.colourToken ?? null,
        age,
        createdAt: learner.createdAt?.toISOString() ?? null,
        profileData: (learner.profileData as {
          about?: string;
          workingStyle?: string[];
          interests?: string[];
          strengths?: string[];
          notes?: string;
        }) ?? {},
      }}
      familyName={family.familyName}
    />
  );
}
