import NotificationCentreClient from '@/app/(auth)/notifications/NotificationCentreClient';
import { mockNotifications } from '../mock-data';

export default function DevPreviewNotifications() {
  return (
    <NotificationCentreClient
      initialNotifications={mockNotifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        bodyData: Object.fromEntries(
          Object.entries(n.bodyData).filter((e): e is [string, string] => typeof e[1] === 'string')
        ),
        tier: n.tier,
        state: n.state,
        destinationRoute: n.destinationRoute,
        createdAt: n.createdAt,
      }))}
    />
  );
}
