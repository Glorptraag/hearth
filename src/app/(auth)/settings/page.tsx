import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { learners, familySettings } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq } from 'drizzle-orm';
import { safeLoad } from '@/lib/server/safe-load';
import EmptyState from '@/components/ui/EmptyState';
import { Lifebuoy } from '@/components/icons';
import SettingsClient from './SettingsClient';

function SettingsErrorState() {
  return (
    <div className="mx-auto max-w-2xl px-lg py-2xl">
      <EmptyState
        icon={Lifebuoy}
        heading="Couldn't load your settings"
        body="Something went wrong on our side. Try again in a moment."
        cta={{ label: 'Refresh', href: '/settings' }}
      />
    </div>
  );
}

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const familyResult = await safeLoad('settings', () => getFamilyByClerkId(userId));
  if (!familyResult.ok) return <SettingsErrorState />;
  const family = familyResult.data;
  if (!family || !family.onboardingComplete) redirect('/onboarding');

  const result = await safeLoad('settings', async () => {
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
    return { familyLearners, settings };
  });

  if (!result.ok) return <SettingsErrorState />;
  const { familyLearners, settings } = result.data;

  const notifPrefs = (settings?.notificationPrefs ?? {}) as Record<string, unknown>;

  return (
    <SettingsClient
      initialSettings={{
        familyName: family.familyName,
        pedagogyPreference: settings?.pedagogyPreference ?? 'eclectic',
        values: (settings?.pedagogyValues ?? []) as string[],
        practices: (settings?.pedagogyPractices ?? []) as string[],
        registrationNumber: settings?.registrationNumber ?? '',
        nextReportDate: settings?.nextReportDate ?? '',
        state: settings?.state ?? null,
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
