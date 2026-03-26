import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { learners } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq } from 'drizzle-orm';
import { differenceInYears } from 'date-fns';
import LearnerProfileClient from './LearnerProfileClient';

type Params = { params: Promise<{ id: string }> };

export default async function LearnerProfilePage({ params }: Params) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const family = await getFamilyByClerkId(userId);
  if (!family) redirect('/onboarding');

  const { id } = await params;

  const learner = await db.query.learners.findFirst({
    where: and(eq(learners.id, id), eq(learners.familyId, family.id)),
  });
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
