'use client';

import { useState } from 'react';
import NotificationRow from '@/components/notifications/NotificationRow';
import EmptyState from '@/components/ui/EmptyState';
import { Leaf, Moon } from '@/components/icons';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  bodyData: Record<string, string>;
  tier: string;
  state: string;
  destinationRoute: string | null;
  createdAt: Date | null;
}

interface NotificationCentreClientProps {
  initialNotifications: Notification[];
  basePath?: string;
}

// Tier priority order (lowest index = highest priority)
const TIER_ORDER = ['whisper', 'nudge', 'chime'] as const;

const TIER_LABELS: Record<string, string> = {
  whisper: 'Resume',
  nudge: 'Respond',
  chime: 'Reconnect',
};

type FilterTab = 'all' | 'whisper' | 'nudge' | 'chime';

export default function NotificationCentreClient({
  initialNotifications,
  basePath = '',
}: NotificationCentreClientProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [quietDay, setQuietDay] = useState(false);

  const visible = notifications.filter(
    (n) => n.state !== 'dismissed' && n.state !== 'expired' && n.state !== 'snoozed'
  );
  const unreadCount = visible.filter((n) => n.state === 'visible').length;

  // Count per tier for tab badges
  const countByTier = TIER_ORDER.reduce<Record<string, number>>((acc, tier) => {
    acc[tier] = visible.filter((n) => n.tier === tier).length;
    return acc;
  }, {});

  const filtered = activeTab === 'all' ? visible : visible.filter((n) => n.tier === activeTab);

  // Group filtered by tier (in priority order)
  const tiersInView = TIER_ORDER.filter((tier) =>
    filtered.some((n) => n.tier === tier)
  );

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

  async function handleSnooze(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, state: 'snoozed' } : n))
    );
    await fetch(`/api/notifications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'snoozed', snoozeHours: 4 }),
    });
  }

  async function handleMarkAllRead() {
    setNotifications((prev) =>
      prev.map((n) => (n.state === 'visible' ? { ...n, state: 'actioned' } : n))
    );
    await fetch('/api/notifications/mark-all-read', { method: 'PATCH' });
  }

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: visible.length },
    { key: 'whisper', label: 'Resume', count: countByTier.whisper },
    { key: 'nudge', label: 'Respond', count: countByTier.nudge },
    { key: 'chime', label: 'Reconnect', count: countByTier.chime },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-border-subtle bg-surface-body/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-md py-md">
          <div className="flex items-center gap-sm">
            <h1 className="font-serif text-xl font-semibold text-text-primary">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-ember px-sm py-[2px] font-sans text-[11px] font-semibold text-text-inverse">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-sm">
            <button
              onClick={() => setQuietDay((v) => !v)}
              className={`flex items-center gap-xs rounded-full border px-[12px] py-[5px] font-sans text-[12px] font-medium transition-all duration-200 ease-[var(--ease-default)] ${
                quietDay
                  ? 'border-sage/60 bg-sage/10 text-sage'
                  : 'border-border-subtle bg-transparent text-text-secondary hover:border-border-medium hover:text-text-primary'
              }`}
            >
              <span className="inline-flex items-center gap-xs"><Moon size={14} aria-hidden="true" /> Quiet Day {quietDay ? 'On' : 'Off'}</span>
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="font-sans text-xs font-semibold text-ember transition-colors duration-200 hover:text-ember-hover"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-xs overflow-x-auto px-md pb-sm scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex shrink-0 items-center gap-xs rounded-full border px-[14px] py-[6px] font-sans text-[13px] font-medium transition-all duration-200 ease-[var(--ease-default)] ${
                  isActive
                    ? 'border-ember bg-ember text-text-inverse'
                    : 'border-border-subtle bg-transparent text-text-secondary hover:border-border-medium hover:text-text-primary'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`rounded-full px-[5px] py-[1px] font-sans text-[11px] ${
                      isActive ? 'backdrop-modal' : 'bg-surface-raised text-text-muted'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-md py-md">
        {/* Empty state */}
        {filtered.length === 0 && (
          <EmptyState
            icon={Leaf}
            heading="Nothing here right now"
            body="That's a good thing."
            variant="inline"
          />
        )}

        {/* Grouped notification list */}
        {tiersInView.map((tier, tierIdx) => {
          const tierNotifs = filtered
            .filter((n) => n.tier === tier)
            .sort(
              (a, b) =>
                new Date(b.createdAt ?? 0).getTime() -
                new Date(a.createdAt ?? 0).getTime()
            );

          return (
            <section key={tier} className={tierIdx > 0 ? 'mt-xl' : ''}>
              {/* Tier divider — only shown in "All" tab */}
              {activeTab === 'all' && (
                <div className="mb-sm flex items-center gap-md">
                  <div className="h-px flex-1 bg-border-subtle" />
                  <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                    {TIER_LABELS[tier] ?? tier}
                  </span>
                  <div className="h-px flex-1 bg-border-subtle" />
                </div>
              )}
              <div className="flex flex-col gap-xs">
                {tierNotifs.map((n) => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    onDismiss={handleDismiss}
                    onMarkRead={handleMarkRead}
                    onSnooze={handleSnooze}
                    basePath={basePath}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
