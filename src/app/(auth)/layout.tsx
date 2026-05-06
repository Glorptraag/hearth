"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState, type ComponentType } from "react";
import NotificationBadge from "@/components/notifications/NotificationBadge";
import { ToastProvider } from "@/components/ui/Toast";
import { Wordmark } from "@/components/ui/Wordmark";
import { useTheme } from "@/hooks/use-theme";
import PostHogProvider from "@/components/analytics/PostHogProvider";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";
import {
  House,
  CalendarBlank,
  PencilSimpleLine,
  BookOpenText,
  Sparkle,
  FileText,
  Books,
  Compass,
  Storefront,
  Moon,
  Sun,
  Bell,
  Gear,
} from "@/components/icons";

type NavIcon = ComponentType<{ size?: number; weight?: "regular" | "fill" }>;

const NAV_SECTIONS: ReadonlyArray<{
  label: string;
  items: ReadonlyArray<{ href: string; label: string; Icon: NavIcon }>;
}> = [
  {
    label: "Home",
    items: [
      { href: "/dashboard", label: "Your Hearth", Icon: House },
      { href: "/planner", label: "This Week", Icon: CalendarBlank },
    ],
  },
  {
    label: "Learning",
    items: [
      { href: "/log", label: "Log", Icon: PencilSimpleLine },
      { href: "/our-story", label: "Our Story", Icon: BookOpenText },
      { href: "/our-story/capabilities", label: "Capabilities", Icon: Sparkle },
      { href: "/our-story/portfolio", label: "Portfolios", Icon: FileText },
    ],
  },
  {
    label: "Discover",
    items: [
      { href: "/library", label: "Library", Icon: Books },
      { href: "/explore/activities", label: "Explore", Icon: Compass },
      { href: "/explore/marketplace", label: "Marketplace", Icon: Storefront },
    ],
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/our-story") return pathname === "/our-story";
  if (href === "/our-story/capabilities") return pathname.startsWith("/our-story/capabilities");
  if (href === "/our-story/portfolio") return pathname.startsWith("/our-story/portfolio");
  if (href === "/log") return pathname === "/log";
  if (href === "/planner") return pathname.startsWith("/planner");
  if (href === "/library") return pathname.startsWith("/library");
  if (href === "/explore/activities") return pathname === "/explore/activities";
  if (href === "/explore/marketplace") return pathname.startsWith("/explore/marketplace");
  if (href === "/settings") return pathname === "/settings";
  if (href === "/notifications") return pathname === "/notifications";
  if (href.startsWith("/hearths/")) return pathname.startsWith(href);
  return false;
}

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

  const { theme, toggleTheme, isAutoMode, resetToAuto } = useTheme();
  const gathering = theme === 'gathering';

  const firstName = user?.firstName ?? "there";
  const initials = `${(user?.firstName ?? "H")[0]}${(user?.lastName ?? "")[0] ?? ""}`;

  return (
    <PostHogProvider>
    <div className="flex min-h-dvh bg-surface-body">
      {/* Desktop sidebar — hidden below lg */}
      <nav className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[240px] flex-col border-r border-border-subtle bg-surface-panel p-xl">
        {/* Brand */}
        <Link href="/dashboard" className="mb-3xl inline-flex items-center" aria-label="Hearth — home">
          <Wordmark
            iconHeight={40}
            textClassName="font-serif text-2xl font-bold text-text-primary tracking-[-0.02em]"
            className="inline-flex items-center gap-md"
          />
        </Link>

        {/* Nav sections */}
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-xl">
            <div className="mb-md font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
              {section.label}
            </div>
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              const { Icon } = item;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mb-xs flex items-center gap-md rounded-md px-md py-md font-sans text-[0.9rem] font-medium transition-all duration-200 ease-[var(--ease-default)] border ${
                    active
                      ? "border-border-medium bg-surface-raised text-ember shadow-card shadow-inset-highlight"
                      : "border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary"
                  }`}
                >
                  <Icon size={18} aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Community hearths */}
        {hearths.length > 0 && (
          <div className="mb-xl">
            <div className="mb-md font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
              Community
            </div>
            {hearths.map((h) => {
              const active = pathname.startsWith(`/hearths/${h.id}`);
              return (
                <Link
                  key={h.id}
                  href={`/hearths/${h.id}`}
                  className={`mb-xs flex items-center gap-sm rounded-md px-md py-[10px] font-sans text-[0.85rem] font-medium transition-all duration-200 ease-[var(--ease-default)] border ${
                    active
                      ? 'border-border-medium bg-surface-raised text-ember'
                      : 'border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${h.pendingCount > 0 ? 'bg-ember' : 'bg-sage'}`} />
                  <span className="truncate">{h.name}</span>
                  {h.pendingCount > 0 && (
                    <span className="ml-auto flex-shrink-0 rounded-[6px] bg-ember px-1.5 py-px font-sans text-[0.65rem] font-semibold text-text-inverse">
                      {h.pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Bottom section: settings, notifications */}
        <div className="mb-xl">
          <div className="mb-md font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
            System
          </div>
          {/* Gathering mode toggle */}
          <button
            onClick={toggleTheme}
            className={`mb-xs flex w-full items-center gap-md rounded-md px-md py-md font-sans text-[0.9rem] font-medium transition-all duration-200 ease-[var(--ease-default)] border ${
              gathering
                ? 'border-border-medium bg-surface-raised text-ember shadow-card'
                : 'border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary'
            }`}
            aria-label={gathering ? 'Switch to dark mode' : 'Switch to gathering mode'}
          >
            {gathering
              ? <Moon size={18} aria-hidden="true" />
              : <Sun size={18} aria-hidden="true" />}
            {gathering ? 'Dark Mode' : 'Gathering Mode'}
          </button>
          {!isAutoMode && (
            <button
              onClick={resetToAuto}
              className="mb-xs flex w-full items-center gap-md rounded-md px-md py-sm font-sans text-[0.75rem] font-medium text-text-muted transition-all duration-200 hover:text-text-secondary"
              aria-label="Reset to automatic theme switching"
            >
              Reset to auto
            </button>
          )}
          <Link
            href="/notifications"
            className={`mb-xs flex items-center gap-md rounded-md px-md py-md font-sans text-[0.9rem] font-medium transition-all duration-200 ease-[var(--ease-default)] border ${
              isActive(pathname, "/notifications")
                ? "border-border-medium bg-surface-raised text-ember shadow-card shadow-inset-highlight"
                : "border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary"
            }`}
          >
            <span className="relative inline-flex" aria-hidden="true">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1">
                  <NotificationBadge count={unreadCount} />
                </span>
              )}
            </span>
            Notifications
          </Link>
          <Link
            href="/settings"
            className={`mb-xs flex items-center gap-md rounded-md px-md py-md font-sans text-[0.9rem] font-medium transition-all duration-200 ease-[var(--ease-default)] border ${
              isActive(pathname, "/settings")
                ? "border-border-medium bg-surface-raised text-ember shadow-card shadow-inset-highlight"
                : "border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary"
            }`}
          >
            <Gear size={18} aria-hidden="true" />
            Settings
          </Link>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User badge */}
        <div className="flex items-center gap-md rounded-md border border-border-subtle bg-surface-raised p-md shadow-card">
          <div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-gradient-to-br from-ember to-ember-hover font-serif text-[0.9rem] font-semibold text-surface-body shadow-[0_2px_8px_rgba(217,123,58,0.3)]">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="truncate font-sans text-[0.85rem] font-semibold text-text-primary">
              {firstName}
            </div>
            <div className="font-sans text-[0.75rem] text-text-muted">
              Facilitator
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile top header — hidden at lg */}
      <div className="flex flex-1 flex-col lg:ml-[240px]">
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
        <main className="flex-1 overflow-y-auto pb-[calc(72px+env(safe-area-inset-bottom,0px))] lg:pb-0">
          <ToastProvider>{children}</ToastProvider>
        </main>
      </div>

      {/* Mobile bottom nav — hidden at lg */}
      <MobileBottomNav />
    </div>
    </PostHogProvider>
  );
}
