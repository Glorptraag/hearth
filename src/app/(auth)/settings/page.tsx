import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { learners, familySettings } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const family = await getFamilyByClerkId(userId);
  if (!family || !family.onboardingComplete) redirect('/onboarding');

  const [familyLearners, settings] = await Promise.all([
    db
      .select()
      .from(learners)
      .where(eq(learners.familyId, family.id))
      .orderBy(learners.displayOrder),
    db.query.familySettings.findFirst({
      where: eq(familySettings.familyId, family.id),
    }),
  ]);

  const notifPrefs = (settings?.notificationPrefs ?? {}) as Record<string, unknown>;

  return (
    <SettingsClient
      initialSettings={{
        familyName: family.familyName,
        pedagogyPreference: settings?.pedagogyPreference ?? 'eclectic',
        heuRegistrationNumber: settings?.heuRegistrationNumber ?? '',
        heuNextReportDate: settings?.heuNextReportDate ?? '',
        state: settings?.state ?? 'QLD',
        notificationPrefs: notifPrefs,
      }}
      initialChildren={familyLearners.map((l) => ({
        id: l.id,
        name: l.name,
        colourToken: l.colourToken ?? null,
        dateOfBirth: l.dateOfBirth ?? null,
      }))}
    />
  );
}
