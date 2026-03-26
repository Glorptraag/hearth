'use client';

import { useState } from 'react';
import NotificationRow from '@/components/notifications/NotificationRow';

interface Notification {
  id: string;
  title: string;
  body: string | null;
  tier: string;
  state: string;
  destinationRoute: string | null;
  createdAt: Date | null;
}

interface NotificationCentreClientProps {
  initialNotifications: Notification[];
}

// Tier display order and labels
const TIER_ORDER = ['whisper', 'nudge', 'chime', 'flare'];
const TIER_LABELS: Record<string, string> = {
  whisper: 'Resume',
  nudge: 'Respond',
  chime: 'Reconnect',
  flare: 'Priority',
};

export default function NotificationCentreClient({
  initialNotifications,
}: NotificationCentreClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>(
    initialNotifications
  );

  const visible = notifications.filter(
    (n) => n.state !== 'dismissed' && n.state !== 'expired'
  );
  const unreadCount = visible.filter((n) => n.state === 'visible').length;

  async function handleDismiss(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, state: 'dismissed' } : n))
    );
    await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'dismissed' }),
    });
  }

  async function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, state: 'actioned' } : n))
    );
    await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'actioned' }),
    });
  }

  async function handleMarkAllRead() {
    setNotifications((prev) =>
      prev.map((n) => (n.state === 'visible' ? { ...n, state: 'actioned' } : n))
    );
    await fetch('/api/notifications/mark-all-read', { method: 'PATCH' });
  }

  // Group by tier, ordered
  const tiers = TIER_ORDER.filter((tier) =>
    visible.some((n) => n.tier === tier)
  );

  return (
    <div className="mx-auto max-w-2xl px-md py-xl">
      {/* Header */}
      <div className="mb-xl flex items-center justify-between">
        <div className="flex items-center gap-sm">
          <h1 className="font-serif text-2xl font-semibold text-text-primary">
            Notifications
          </h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-ember px-sm py-[2px] font-sans text-xs font-semibold text-text-inverse">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="font-sans text-xs font-semibold text-ember transition-colors hover:text-ember-hover"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <div className="flex flex-col items-center gap-md py-2xl text-center">
          <span className="text-4xl">🌿</span>
          <p className="font-serif text-xl font-semibold text-text-primary">
            All caught up
          </p>
          <p className="font-sans text-sm text-text-secondary">
            No notifications right now. Hearth will nudge you gently when something needs attention.
          </p>
        </div>
      )}

      {/* Tier sections */}
      {tiers.map((tier) => {
        const tierNotifs = visible
          .filter((n) => n.tier === tier)
          .sort(
            (a, b) =>
              new Date(b.createdAt ?? 0).getTime() -
              new Date(a.createdAt ?? 0).getTime()
          );

        return (
          <section key={tier} className="mb-xl">
            <div className="mb-sm flex items-center gap-sm">
              <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
                {TIER_LABELS[tier] ?? tier}
              </h2>
              <span className="font-sans text-[11px] text-text-muted">
                {tierNotifs.length}
              </span>
            </div>
            <div className="flex flex-col gap-xs">
              {tierNotifs.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onDismiss={handleDismiss}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
