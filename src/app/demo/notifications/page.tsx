import NotificationCentreClient from '@/app/(auth)/notifications/NotificationCentreClient';
import { mockNotifications } from '../mock-data';

export default function DemoNotifications() {
  // Cast to satisfy Notification type — bodyData shape variance is harmless at runtime
  const notifications = mockNotifications as Array<{
    id: string;
    type: string;
    title: string;
    body: string | null;
    bodyData: Record<string, string>;
    tier: string;
    state: string;
    destinationRoute: string | null;
    createdAt: Date;
  }>;

  return (
    <NotificationCentreClient
      initialNotifications={notifications}
      basePath="/demo"
    />
  );
}
