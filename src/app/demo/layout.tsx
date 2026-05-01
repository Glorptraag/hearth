"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBadge from "@/components/notifications/NotificationBadge";
import { useTheme } from "@/hooks/use-theme";

const NAV_SECTIONS = [
  {
    label: "Home",
    items: [
      { href: "/demo/dashboard", label: "Your Hearth", emoji: "🏠" },
      { href: "/demo/planner", label: "This Week", emoji: "📅" },
    ],
  },
  {
    label: "Learning",
    items: [
      { href: "/demo/log", label: "Log", emoji: "✏️" },
      { href: "/demo/our-story", label: "Our Story", emoji: "📖" },
      { href: "/demo/our-story/capabilities", label: "Capabilities", emoji: "🌟" },
      { href: "/demo/our-story/portfolio", label: "Portfolios", emoji: "📄" },
    ],
  },
  {
    label: "Discover",
    items: [
      { href: "/demo/explore/activities", label: "Explore", emoji: "🔍" },
      { href: "/demo/explore/marketplace", label: "Marketplace", emoji: "📚" },
    ],
  },
];

const BOTTOM_NAV_ITEMS = [
  { href: "/demo/dashboard", label: "Home", emoji: "🏠" },
  { href: "/demo/our-story", label: "Story", emoji: "📖" },
  { href: "/demo/log", label: "Log", emoji: "✏️", primary: true },
  { href: "/demo/planner", label: "Plan", emoji: "📅" },
  { href: "/demo/explore/activities", label: "Explore", emoji: "🔍" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/demo/dashboard") return pathname === "/demo/dashboard";
  if (href === "/demo/our-story") return pathname === "/demo/our-story";
  if (href === "/demo/our-story/capabilities") return pathname.startsWith("/demo/our-story/capabilities");
  if (href === "/demo/our-story/portfolio") return pathname.startsWith("/demo/our-story/portfolio");
  if (href === "/demo/log") return pathname === "/demo/log";
  if (href === "/demo/planner") return pathname.startsWith("/demo/planner");
  if (href === "/demo/explore/activities") return pathname === "/demo/explore/activities";
  if (href === "/demo/explore/marketplace") return pathname.startsWith("/demo/explore/marketplace");
  if (href === "/demo/settings") return pathname === "/demo/settings";
  if (href === "/demo/notifications") return pathname === "/demo/notifications";
  return false;
}

function isActiveBottom(pathname: string, href: string): boolean {
  if (href === "/demo/dashboard") return pathname === "/demo/dashboard";
  if (href === "/demo/our-story") return pathname.startsWith("/demo/our-story");
  if (href === "/demo/log") return pathname === "/demo/log";
  if (href === "/demo/planner") return pathname.startsWith("/demo/planner");
  if (href === "/demo/explore/activities") return pathname.startsWith("/demo/explore");
  return false;
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme, isAutoMode, resetToAuto } = useTheme();
  const gathering = theme === 'gathering';
  const firstName = "Sarah";
  const familyName = "Douglas Family";
  const initials = "SD";
  const unreadCount = 4;

  return (
    <div className="flex min-h-dvh bg-surface-body">
      {/* Demo banner — fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-md bg-surface-panel/95 backdrop-blur-sm border-b border-border-subtle px-md py-xs">
        <span className="font-sans text-xs text-text-secondary">
          You&apos;re exploring a demo
        </span>
        <a
          href="/onboarding"
          className="font-sans text-xs font-semibold text-ember hover:text-ember-hover transition-colors duration-200"
        >
          Start your family&apos;s Hearth →
        </a>
      </div>

      {/* Desktop sidebar — hidden below lg */}
      <nav className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[240px] flex-col border-r border-border-subtle bg-surface-panel p-xl pt-[80px]">
        {/* Brand */}
        <div className="mb-3xl flex items-center gap-md">
          <div className="flex h-[40px] w-[40px] items-center justify-center rounded-md bg-ember shadow-ember">
            <span className="text-lg" aria-hidden="true">🔥</span>
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
                  className={`mb-xs flex items-center gap-md rounded-md px-md py-md font-sans text-[0.9rem] font-medium transition-all duration-200 ease-[var(--ease-default)] border ${
                    active
                      ? "border-border-medium bg-surface-raised text-ember shadow-card shadow-inset-highlight"
                      : "border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary"
                  }`}
                >
                  <span className="text-lg" aria-hidden="true">{item.emoji}</span>
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
          <button
            onClick={toggleTheme}
            className={`mb-xs flex w-full items-center gap-md rounded-md px-md py-md font-sans text-[0.9rem] font-medium transition-all duration-200 ease-[var(--ease-default)] border ${
              gathering
                ? 'border-border-medium bg-surface-raised text-ember shadow-card'
                : 'border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary'
            }`}
            aria-label={gathering ? 'Switch to dark mode' : 'Switch to gathering mode'}
          >
            <span className="text-lg" aria-hidden="true">{gathering ? '🌙' : '☀️'}</span>
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
            href="/demo/notifications"
            className={`mb-xs flex items-center gap-md rounded-md px-md py-md font-sans text-[0.9rem] font-medium transition-all duration-200 ease-[var(--ease-default)] border ${
              isActive(pathname, "/demo/notifications")
                ? "border-border-medium bg-surface-raised text-ember shadow-card shadow-inset-highlight"
                : "border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary"
            }`}
          >
            <span className="relative text-lg" aria-hidden="true">
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
            href="/demo/settings"
            className={`mb-xs flex items-center gap-md rounded-md px-md py-md font-sans text-[0.9rem] font-medium transition-all duration-200 ease-[var(--ease-default)] border ${
              isActive(pathname, "/demo/settings")
                ? "border-border-medium bg-surface-raised text-ember shadow-card shadow-inset-highlight"
                : "border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary"
            }`}
          >
            <span className="text-lg" aria-hidden="true">⚙️</span>
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
        <header className="flex items-center justify-between border-b border-border-subtle bg-surface-panel px-md py-sm lg:hidden mt-[32px]">
          <span className="font-serif text-lg font-semibold text-text-primary tracking-[-0.02em]">
            Hearth
          </span>
          <div className="flex items-center gap-md">
            <span className="font-sans text-sm text-text-secondary">
              {familyName}
            </span>
            <Link
              href="/demo/notifications"
              className="relative flex h-[36px] w-[36px] items-center justify-center rounded-md text-text-muted transition-all duration-200 ease-[var(--ease-default)] hover:bg-ember-glow hover:text-text-primary"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <span className="text-lg" aria-hidden="true">🔔</span>
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
              className={`flex flex-col items-center gap-xs font-sans text-[11px] font-semibold uppercase tracking-[0.08em] transition-all duration-200 ease-[var(--ease-default)] ${
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
                    ? "flex h-[44px] w-[44px] items-center justify-center rounded-full bg-ember text-lg shadow-ember"
                    : ""
                }`}
                aria-hidden="true"
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
