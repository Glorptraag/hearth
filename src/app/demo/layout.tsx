"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBadge from "@/components/notifications/NotificationBadge";
import { useTheme } from "@/hooks/use-theme";
import { Wordmark } from "@/components/ui/Wordmark";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";
import { DesktopNavRow } from "@/components/nav/DesktopNavRow";
import { DesktopCommunityRow } from "@/components/nav/DesktopCommunityRow";
import { PRIMARY_NAV, isDesktopNavActive } from "@/components/nav/desktopNavConfig";
import { stripBasePath } from "@/components/nav/navConfig";
import { Bell, Gear, Moon, Sun } from "@/components/icons";

const BASE_PATH = "/demo";

// Demo identity (no Clerk in the unauthenticated demo surface).
const DEMO_FIRST_NAME = "Sarah";
const DEMO_FAMILY_NAME = "Douglas Family";
const DEMO_INITIALS = "SD";
const DEMO_UNREAD = 4;

// Phase 4 will move this into mock-data.ts (mockHearths). Inlined for the
// Community sidebar row until then.
const DEMO_HEARTHS: Array<{ id: string; name: string; pendingCount: number }> = [
  { id: "brisbane-nature", name: "Brisbane Nature Co-op", pendingCount: 2 },
  { id: "westside-makers", name: "Westside Makers", pendingCount: 0 },
];

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const localPath = stripBasePath(pathname, BASE_PATH);
  const { theme, toggleTheme, isAutoMode, resetToAuto } = useTheme();
  const gathering = theme === "gathering";
  const hasUnreadHearth = DEMO_HEARTHS.some((h) => h.pendingCount > 0);

  return (
    <div className="flex min-h-dvh bg-surface-body">
      {/* Demo banner — fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-md bg-surface-panel/95 backdrop-blur-sm border-b border-border-subtle px-md py-xs">
        <span className="font-sans text-xs text-text-secondary">
          You&apos;re exploring a demo
        </span>
        <a
          href="/onboarding"
          className="font-sans text-xs font-semibold text-ember hover:text-ember-hover transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)]"
        >
          Start your family&apos;s Hearth →
        </a>
      </div>

      {/* Desktop sidebar — hidden below lg. pt clears the fixed demo banner. */}
      <nav className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[240px] flex-col border-r border-border-subtle bg-surface-panel pt-[32px]">
        {/* Top corner: home + notifications */}
        <div className="flex shrink-0 items-center gap-sm px-xl pt-xl pb-2xl">
          <Link
            href={`${BASE_PATH}/dashboard`}
            className="relative inline-flex items-center transition-opacity duration-200 ease-[var(--ease-default)] hover:opacity-80 focus:outline-none focus-visible:opacity-80"
            aria-label="Hearth — home"
          >
            <Wordmark
              iconHeight={40}
              textClassName="font-serif text-2xl font-bold text-text-primary tracking-[-0.02em]"
              className="inline-flex items-center gap-md"
            />
          </Link>
          <Link
            href={`${BASE_PATH}/notifications`}
            aria-label={`Notifications${DEMO_UNREAD > 0 ? ` (${DEMO_UNREAD} unread)` : ""}`}
            className={`relative ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-200 ease-[var(--ease-default)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ember)] ${
              isDesktopNavActive(localPath, "/notifications")
                ? "bg-surface-raised text-ember"
                : "text-text-muted hover:bg-ember-glow hover:text-text-primary"
            }`}
          >
            <Bell size={18} aria-hidden="true" />
            {DEMO_UNREAD > 0 && (
              <span className="absolute right-1 top-1">
                <NotificationBadge count={DEMO_UNREAD} />
              </span>
            )}
          </Link>
        </div>

        {/* Scrollable middle: primary nav + community */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-xl">
          {PRIMARY_NAV.map((row) => (
            <DesktopNavRow key={row.label} row={row} pathname={pathname} basePath={BASE_PATH} />
          ))}
          {DEMO_HEARTHS.length > 0 && (
            <DesktopCommunityRow
              hearths={DEMO_HEARTHS}
              pathname={pathname}
              hasUnread={hasUnreadHearth}
              basePath={BASE_PATH}
            />
          )}
        </div>

        {/* Pinned bottom: theme toggle + user badge → settings */}
        <div className="shrink-0 border-t border-border-subtle px-xl py-xl">
          <button
            onClick={toggleTheme}
            className={`mb-md flex w-full items-center gap-md rounded-md border px-md py-md text-left font-sans text-[0.9rem] font-medium transition-all duration-200 ease-[var(--ease-default)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ember)] ${
              gathering
                ? "border-border-medium bg-surface-raised text-ember shadow-card"
                : "border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary"
            }`}
            aria-label={gathering ? "Switch to dark mode" : "Switch to gathering mode"}
          >
            {gathering ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
            <span className="flex-1">{gathering ? "Dark Mode" : "Gathering Mode"}</span>
            {!isAutoMode && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  resetToAuto();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    resetToAuto();
                  }
                }}
                className="font-sans text-[0.7rem] font-medium text-text-muted hover:text-text-secondary"
              >
                Auto
              </span>
            )}
          </button>
          <Link
            href={`${BASE_PATH}/settings`}
            aria-label={`Settings — ${DEMO_FIRST_NAME}`}
            className={`flex items-center gap-md rounded-md border p-md text-left transition-colors duration-200 ease-[var(--ease-default)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ember)] ${
              isDesktopNavActive(localPath, "/settings")
                ? "border-border-medium bg-surface-raised shadow-card"
                : "border-border-subtle bg-surface-raised hover:border-border-medium"
            }`}
          >
            <div className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-gradient-to-br from-ember to-ember-hover font-serif text-[0.9rem] font-semibold text-surface-body shadow-[0_2px_8px_rgba(217,123,58,0.3)]">
              {DEMO_INITIALS}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-sans text-[0.85rem] font-semibold text-text-primary">
                {DEMO_FIRST_NAME}
              </div>
              <div className="font-sans text-[0.75rem] text-text-muted">
                Facilitator
              </div>
            </div>
            <Gear size={16} aria-hidden="true" className="text-text-muted" />
          </Link>
        </div>
      </nav>

      {/* Content column. pt clears the fixed demo banner; min-w-0 lets horizontal
          scrollers inside children stay contained. */}
      <div className="flex flex-1 flex-col min-w-0 pt-[32px] lg:ml-[240px]">
        {/* Mobile top header — hidden at lg */}
        <header className="flex items-center justify-between border-b border-border-subtle bg-surface-panel px-md py-sm lg:hidden">
          <Link href={`${BASE_PATH}/dashboard`} className="inline-flex items-center" aria-label="Hearth — home">
            <Wordmark
              iconHeight={24}
              textClassName="font-serif text-lg font-semibold text-text-primary tracking-[-0.02em]"
            />
          </Link>
          <div className="flex items-center gap-md">
            <span className="font-sans text-sm text-text-secondary">
              {DEMO_FAMILY_NAME}
            </span>
            <Link
              href={`${BASE_PATH}/notifications`}
              className="relative flex h-[36px] w-[36px] items-center justify-center rounded-md text-text-muted transition-all duration-200 ease-[var(--ease-default)] hover:bg-ember-glow hover:text-text-primary"
              aria-label={`Notifications${DEMO_UNREAD > 0 ? ` (${DEMO_UNREAD} unread)` : ""}`}
            >
              <Bell size={18} aria-hidden="true" />
              {DEMO_UNREAD > 0 && (
                <span className="absolute right-[2px] top-[2px]">
                  <NotificationBadge count={DEMO_UNREAD} />
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Main content. Bottom padding clears the mobile nav (~72px) plus the
            iOS home-indicator safe area on notched devices. lg: drops it. */}
        <main className="flex-1 min-w-0 overflow-y-auto pb-[calc(72px+env(safe-area-inset-bottom,0px))] lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — hidden at lg */}
      <MobileBottomNav basePath={BASE_PATH} />
    </div>
  );
}
