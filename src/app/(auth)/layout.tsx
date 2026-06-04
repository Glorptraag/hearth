"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import NotificationBadge from "@/components/notifications/NotificationBadge";
import { ToastProvider } from "@/components/ui/Toast";
import { Wordmark } from "@/components/ui/Wordmark";
import PostHogProvider from "@/components/analytics/PostHogProvider";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";
import { DesktopNavRow } from "@/components/nav/DesktopNavRow";
import { DesktopCommunityRow } from "@/components/nav/DesktopCommunityRow";
import { PRIMARY_NAV, isDesktopNavActive } from "@/components/nav/desktopNavConfig";
import { Bell, Gear } from "@/components/icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useUser();
  const familyName = user?.lastName ? `${user.lastName} Family` : "My Family";
  const [unreadCount, setUnreadCount] = useState(0);
  const [hearths, setHearths] = useState<Array<{ id: string; name: string; pendingCount: number }>>([]);

  async function fetchUnreadCount() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data: Array<{ state: string }> = await res.json();
        setUnreadCount(data.filter((n) => n.state === "visible").length);
      }
    } catch {
      // silent fail
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount + refetch on window focus
    fetchUnreadCount();
    const onFocus = () => fetchUnreadCount();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    async function fetchHearths() {
      try {
        const res = await fetch('/api/hearths');
        if (res.ok) {
          const data = await res.json();
          setHearths((data.hearths ?? []).map((h: { id: string; name: string; pendingScaffoldCount: number }) => ({
            id: h.id,
            name: h.name,
            pendingCount: h.pendingScaffoldCount ?? 0,
          })));
        }
      } catch { /* silent */ }
    }
    fetchHearths();
  }, []);

  const firstName = user?.firstName ?? "there";
  const initials = `${(user?.firstName ?? "H")[0]}${(user?.lastName ?? "")[0] ?? ""}`;
  const hasUnreadHearth = hearths.some((h) => h.pendingCount > 0);

  return (
    <PostHogProvider>
    <div className="flex min-h-dvh bg-surface-body">
      {/* Desktop sidebar — hidden below lg */}
      <nav className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[240px] flex-col border-r border-border-subtle bg-surface-panel">
        {/* Top corner: home + notifications */}
        <div className="flex shrink-0 items-center gap-sm px-xl pt-xl pb-2xl">
          <Link
            href="/dashboard"
            className="relative inline-flex items-center transition-opacity duration-200 ease-[var(--ease-default)] hover:opacity-80 focus:outline-none focus-visible:opacity-80"
            aria-label={`Hearth — home${unreadCount > 0 ? ` (${unreadCount} unread notifications)` : ''}`}
          >
            <Wordmark
              iconHeight={40}
              textClassName="font-serif text-2xl font-bold text-text-primary tracking-[-0.02em]"
              className="inline-flex items-center gap-md"
            />
            {unreadCount > 0 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-[24px] top-[-2px] h-2.5 w-2.5 rounded-full bg-ember ring-2 ring-surface-panel"
              />
            )}
          </Link>
          <Link
            href="/notifications"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            className={`relative ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-200 ease-[var(--ease-default)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ember)] ${
              isDesktopNavActive(pathname, '/notifications')
                ? 'bg-surface-raised text-ember'
                : 'text-text-muted hover:bg-ember-glow hover:text-text-primary'
            }`}
          >
            <Bell size={18} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1">
                <NotificationBadge count={unreadCount} />
              </span>
            )}
          </Link>
        </div>

        {/* Scrollable middle: primary nav + community */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-xl">
          {PRIMARY_NAV.map((row) => (
            <DesktopNavRow key={row.label} row={row} pathname={pathname} />
          ))}
          {hearths.length > 0 && (
            <DesktopCommunityRow hearths={hearths} pathname={pathname} hasUnread={hasUnreadHearth} />
          )}
        </div>

        {/* Pinned bottom: user badge → settings */}
        <div className="shrink-0 border-t border-border-subtle px-xl py-xl">
          <Link
            href="/settings"
            aria-label={`Settings — ${firstName}`}
            className={`flex items-center gap-md rounded-md border p-md text-left transition-colors duration-200 ease-[var(--ease-default)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ember)] ${
              isDesktopNavActive(pathname, '/settings')
                ? 'border-border-medium bg-surface-raised shadow-card'
                : 'border-border-subtle bg-surface-raised hover:border-border-medium'
            }`}
          >
            <div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-gradient-to-br from-ember to-ember-hover font-serif text-[0.9rem] font-semibold text-surface-body shadow-[0_2px_8px_rgba(217,123,58,0.3)]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-sans text-[0.85rem] font-semibold text-text-primary">
                {firstName}
              </div>
              <div className="font-sans text-[0.75rem] text-text-muted">
                Facilitator
              </div>
            </div>
            <Gear size={16} aria-hidden="true" className="text-text-muted" />
          </Link>
        </div>
      </nav>

      {/* Mobile top header — hidden at lg */}
      <div className="flex flex-1 flex-col min-w-0 lg:ml-[240px]">
        <header className="flex items-center justify-between border-b border-border-subtle bg-surface-panel px-md py-sm lg:hidden">
          <Link href="/dashboard" className="inline-flex items-center" aria-label="Hearth — home">
            <Wordmark
              iconHeight={24}
              textClassName="font-serif text-lg font-semibold text-text-primary tracking-[-0.02em]"
            />
          </Link>
          <div className="flex items-center gap-md">
            <span className="font-sans text-sm text-text-secondary">
              {familyName}
            </span>
            <Link
              href="/notifications"
              className="relative flex h-[36px] w-[36px] items-center justify-center rounded-md text-text-muted transition-all duration-200 ease-[var(--ease-default)] hover:bg-ember-glow hover:text-text-primary"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <Bell size={18} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute right-[2px] top-[2px]">
                  <NotificationBadge count={unreadCount} />
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Main content. Bottom padding clears the mobile nav (~72px) plus the
            iOS home-indicator safe area on notched devices. lg: drops it. */}
        <main className="flex-1 min-w-0 overflow-y-auto pb-[calc(72px+env(safe-area-inset-bottom,0px))] lg:pb-0">
          <ToastProvider>{children}</ToastProvider>
        </main>
      </div>

      {/* Mobile bottom nav — hidden at lg */}
      <MobileBottomNav />
    </div>
    </PostHogProvider>
  );
}
