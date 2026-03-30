"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import NotificationBadge from "@/components/notifications/NotificationBadge";

const NAV_SECTIONS = [
  {
    label: "Home",
    items: [
      { href: "/dashboard", label: "Your Hearth", emoji: "🏠" },
      { href: "/planner", label: "This Week", emoji: "📅" },
    ],
  },
  {
    label: "Learning",
    items: [
      { href: "/log", label: "Log", emoji: "✏️" },
      { href: "/our-story", label: "Our Story", emoji: "📖" },
      { href: "/our-story/capabilities", label: "Capabilities", emoji: "🌟" },
      { href: "/our-story/portfolio", label: "Portfolios", emoji: "📄" },
    ],
  },
  {
    label: "Discover",
    items: [
      { href: "/explore/activities", label: "Explore", emoji: "🔍" },
      { href: "/explore/marketplace", label: "Marketplace", emoji: "📚" },
    ],
  },
];

const BOTTOM_NAV_ITEMS = [
  { href: "/dashboard", label: "Home", emoji: "🏠" },
  { href: "/our-story", label: "Story", emoji: "📖" },
  { href: "/log", label: "Log", emoji: "✏️", primary: true },
  { href: "/planner", label: "Plan", emoji: "📅" },
  { href: "/explore/activities", label: "Explore", emoji: "🔍" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/our-story") return pathname === "/our-story";
  if (href === "/our-story/capabilities") return pathname.startsWith("/our-story/capabilities");
  if (href === "/our-story/portfolio") return pathname.startsWith("/our-story/portfolio");
  if (href === "/log") return pathname === "/log";
  if (href === "/planner") return pathname.startsWith("/planner");
  if (href === "/explore/activities") return pathname === "/explore/activities";
  if (href === "/explore/marketplace") return pathname.startsWith("/explore/marketplace");
  if (href === "/settings") return pathname === "/settings";
  if (href === "/notifications") return pathname === "/notifications";
  return false;
}

function isActiveBottom(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/our-story") return pathname.startsWith("/our-story");
  if (href === "/log") return pathname === "/log";
  if (href === "/planner") return pathname.startsWith("/planner");
  if (href === "/explore/activities") return pathname.startsWith("/explore");
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

  const firstName = user?.firstName ?? "there";
  const initials = `${(user?.firstName ?? "H")[0]}${(user?.lastName ?? "")[0] ?? ""}`;

  return (
    <div className="flex min-h-dvh bg-surface-body">
      {/* Desktop sidebar — hidden below lg */}
      <nav className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[240px] flex-col border-r border-border-subtle bg-surface-panel p-xl">
        {/* Brand */}
        <div className="mb-3xl flex items-center gap-md">
          <div className="flex h-[40px] w-[40px] items-center justify-center rounded-md bg-ember shadow-[0_2px_12px_rgba(217,123,58,0.3),var(--shadow-glow)]">
            <span className="text-lg">🔥</span>
          </div>
          <span className="font-serif text-2xl font-bold text-text-primary tracking-[-0.02em]">
            Hearth
          </span>
        </div>

        {/* Nav sections */}
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-xl">
            <div className="mb-md font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
              {section.label}
            </div>
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mb-xs flex items-center gap-md rounded-md px-md py-md font-sans text-[0.9rem] font-medium transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] border ${
                    active
                      ? "border-border-medium bg-surface-raised text-ember shadow-[var(--shadow-soft),inset_0_1px_0_rgba(255,255,255,0.03)]"
                      : "border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary"
                  }`}
                >
                  <span className="text-lg">{item.emoji}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}

        {/* Bottom section: settings, notifications */}
        <div className="mb-xl">
          <div className="mb-md font-sans text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
            System
          </div>
          <Link
            href="/notifications"
            className={`mb-xs flex items-center gap-md rounded-md px-md py-md font-sans text-[0.9rem] font-medium transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] border ${
              isActive(pathname, "/notifications")
                ? "border-border-medium bg-surface-raised text-ember shadow-[var(--shadow-soft),inset_0_1px_0_rgba(255,255,255,0.03)]"
                : "border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary"
            }`}
          >
            <span className="relative text-lg">
              🔔
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
            className={`mb-xs flex items-center gap-md rounded-md px-md py-md font-sans text-[0.9rem] font-medium transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] border ${
              isActive(pathname, "/settings")
                ? "border-border-medium bg-surface-raised text-ember shadow-[var(--shadow-soft),inset_0_1px_0_rgba(255,255,255,0.03)]"
                : "border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary"
            }`}
          >
            <span className="text-lg">⚙️</span>
            Settings
          </Link>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User badge */}
        <div className="flex items-center gap-md rounded-md border border-border-subtle bg-surface-raised p-md shadow-[var(--shadow-soft)]">
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
          <span className="font-serif text-lg font-semibold text-text-primary tracking-[-0.02em]">
            Hearth
          </span>
          <div className="flex items-center gap-md">
            <span className="font-sans text-sm text-text-secondary">
              {familyName}
            </span>
            <Link
              href="/notifications"
              className="relative flex h-[36px] w-[36px] items-center justify-center rounded-md text-text-muted transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-ember-glow hover:text-text-primary"
            >
              <span className="text-lg">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute right-[2px] top-[2px]">
                  <NotificationBadge count={unreadCount} />
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto pb-[72px] lg:pb-0">{children}</main>
      </div>

      {/* Mobile bottom nav — hidden at lg */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border-subtle bg-surface-panel px-xs py-sm lg:hidden">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = isActiveBottom(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-xs font-sans text-[11px] font-semibold uppercase tracking-[0.08em] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                item.primary
                  ? active
                    ? "text-ember"
                    : "text-ember/80"
                  : active
                    ? "text-ember"
                    : "text-text-muted"
              }`}
            >
              <span
                className={`text-xl ${
                  item.primary
                    ? "flex h-[44px] w-[44px] items-center justify-center rounded-full bg-ember text-lg shadow-[0_4px_16px_rgba(217,123,58,0.3),var(--shadow-glow)]"
                    : ""
                }`}
              >
                {item.emoji}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
