import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { and, eq, ne } from 'drizzle-orm';
import NotificationCentreClient from './NotificationCentreClient';

export default async function NotificationsPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const family = await getFamilyByClerkId(userId);
  if (!family) redirect('/onboarding');

  const allNotifications = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.familyId, family.id),
        ne(notifications.state, 'expired')
      )
    )
    .orderBy(notifications.createdAt);

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
