import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq, ne, lte } from 'drizzle-orm';
import { safeLoad } from '@/lib/server/safe-load';
import EmptyState from '@/components/ui/EmptyState';
import { Lifebuoy } from '@/components/icons';
import NotificationCentreClient from './NotificationCentreClient';

function NotificationsErrorState() {
  return (
    <div className="mx-auto max-w-2xl px-lg py-2xl">
      <EmptyState
        icon={Lifebuoy}
        heading="Couldn't load notifications"
        body="Something went wrong on our side. Try again in a moment."
        cta={{ label: 'Refresh', href: '/notifications' }}
      />
    </div>
  );
}

export default async function NotificationsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const familyResult = await safeLoad('notifications', () => getFamilyByClerkId(userId));
  if (!familyResult.ok) return <NotificationsErrorState />;
  const family = familyResult.data;
  if (!family || !family.onboardingComplete) redirect('/onboarding');

  const result = await safeLoad('notifications', async () => {
    // Re-queue snoozed notifications whose snooze period has expired
    await db
      .update(notifications)
      .set({ state: 'visible', snoozedUntil: null })
      .where(
        and(
          eq(notifications.familyId, family.id),
          eq(notifications.state, 'snoozed'),
          lte(notifications.snoozedUntil, new Date())
        )
      );

    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.familyId, family.id),
          ne(notifications.state, 'expired')
        )
      )
      .orderBy(notifications.createdAt);
  });

  if (!result.ok) return <NotificationsErrorState />;
  const allNotifications = result.data;

  return (
    <NotificationCentreClient
      initialNotifications={allNotifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body ?? null,
        bodyData: (n.bodyData ?? {}) as Record<string, string>,
        tier: n.tier,
        state: n.state,
        destinationRoute: n.destinationRoute ?? null,
        createdAt: n.createdAt,
      }))}
    />
  );
}
