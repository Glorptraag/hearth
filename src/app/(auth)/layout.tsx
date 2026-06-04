"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useId, useRef, useState, type ComponentType } from "react";
import NotificationBadge from "@/components/notifications/NotificationBadge";
import { ToastProvider } from "@/components/ui/Toast";
import { Wordmark } from "@/components/ui/Wordmark";
import PostHogProvider from "@/components/analytics/PostHogProvider";
import { MobileBottomNav } from "@/components/nav/MobileBottomNav";
import {
  CalendarBlank,
  PencilSimpleLine,
  BookOpenText,
  Sparkle,
  FileText,
  Books,
  Compass,
  Storefront,
  Bell,
  Gear,
  CaretRight,
  UsersThree,
} from "@/components/icons";

type NavIcon = ComponentType<{ size?: number; weight?: "regular" | "fill" }>;

type NavTrayItem = { href: string; label: string; Icon?: NavIcon };
type NavRowConfig = {
  label: string;
  Icon: NavIcon;
  href?: string;
  tray?: ReadonlyArray<NavTrayItem>;
};

const PRIMARY_NAV: ReadonlyArray<NavRowConfig> = [
  { label: "This Week", Icon: CalendarBlank, href: "/planner" },
  { label: "Log", Icon: PencilSimpleLine, href: "/log" },
  {
    label: "Our Story",
    Icon: BookOpenText,
    href: "/our-story",
    tray: [
      { href: "/our-story/capabilities", label: "Capabilities", Icon: Sparkle },
      { href: "/our-story/portfolio", label: "Portfolios", Icon: FileText },
    ],
  },
  {
    label: "Discover",
    Icon: Compass,
    tray: [
      { href: "/library", label: "Library", Icon: Books },
      // Browse moved into Library tab in Phase 4.6; nav now points at the
      // canonical home. Old /explore/activities 308s here per Task 5.1.
      { href: "/library?tab=browse", label: "Browse", Icon: Compass },
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
  if (href === "/library?tab=browse") return pathname === "/library";
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
              isActive(pathname, '/notifications')
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
              isActive(pathname, '/settings')
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

const DESKTOP_NAV_ROW_BASE =
  'mb-xs flex w-full items-center gap-md rounded-md border px-md py-md text-left font-sans text-[0.9rem] font-medium transition-all duration-200 ease-[var(--ease-default)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ember)]';
const DESKTOP_NAV_ROW_ACTIVE =
  'border-border-medium bg-surface-raised text-ember shadow-card shadow-inset-highlight';
const DESKTOP_NAV_ROW_IDLE =
  'border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary';
const DESKTOP_TRAY_BASE =
  'mb-xs ml-xl flex flex-col gap-px border-l border-border-subtle pl-sm';
const DESKTOP_TRAY_ITEM_BASE =
  'flex w-full items-center gap-sm rounded-md border px-sm py-xs text-left font-sans text-[0.85rem] font-medium transition-colors duration-150 ease-[var(--ease-default)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ember)]';

function DesktopNavRow({
  row,
  pathname,
}: {
  row: NavRowConfig;
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const trayId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isExpandable = !!row.tray && row.tray.length > 0;
  const ownActive = row.href ? isActive(pathname, row.href) : false;
  const trayActive = row.tray?.some((t) => isActive(pathname, t.href)) ?? false;
  // Parent stays idle when only a sub-page is current — the sub-item carries the highlight.
  const active = ownActive;
  // Tray stays open whenever a sub-page is current, regardless of hover/focus.
  const effectiveOpen = open || trayActive;
  const { Icon } = row;

  const rowClass = `${DESKTOP_NAV_ROW_BASE} ${active ? DESKTOP_NAV_ROW_ACTIVE : DESKTOP_NAV_ROW_IDLE}`;

  if (!isExpandable && row.href) {
    return (
      <Link href={row.href} className={rowClass}>
        <Icon size={18} aria-hidden="true" />
        <span>{row.label}</span>
      </Link>
    );
  }

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!wrapperRef.current?.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
    }
  };

  const trigger = row.href ? (
    <Link
      href={row.href}
      className={rowClass}
      aria-haspopup="menu"
      aria-expanded={effectiveOpen}
      aria-controls={trayId}
    >
      <Icon size={18} aria-hidden="true" />
      <span className="flex-1">{row.label}</span>
      <CaretRight
        size={14}
        aria-hidden="true"
        className={`text-text-muted transition-transform duration-200 ease-[var(--ease-default)] ${effectiveOpen ? 'rotate-90' : ''}`}
      />
    </Link>
  ) : (
    <button
      type="button"
      className={rowClass}
      aria-haspopup="menu"
      aria-expanded={effectiveOpen}
      aria-controls={trayId}
      onClick={() => setOpen((v) => !v)}
    >
      <Icon size={18} aria-hidden="true" />
      <span className="flex-1">{row.label}</span>
      <CaretRight
        size={14}
        aria-hidden="true"
        className={`text-text-muted transition-transform duration-200 ease-[var(--ease-default)] ${effectiveOpen ? 'rotate-90' : ''}`}
      />
    </button>
  );

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={handleBlur}
    >
      {trigger}
      {effectiveOpen && row.tray && (
        <div
          id={trayId}
          role="menu"
          aria-label={`${row.label} submenu`}
          className={DESKTOP_TRAY_BASE}
        >
          {row.tray.map((item) => {
            const itemActive = isActive(pathname, item.href);
            const ItemIcon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`${DESKTOP_TRAY_ITEM_BASE} ${itemActive ? 'border-border-medium bg-surface-raised text-ember' : 'border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary'}`}
              >
                {ItemIcon && <ItemIcon size={16} aria-hidden="true" />}
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DesktopCommunityRow({
  hearths,
  pathname,
  hasUnread,
}: {
  hearths: Array<{ id: string; name: string; pendingCount: number }>;
  pathname: string;
  hasUnread: boolean;
}) {
  const [open, setOpen] = useState(false);
  const trayId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trayActive = hearths.some((h) => pathname.startsWith(`/hearths/${h.id}`));
  // Parent stays idle; the active hearth carries the highlight inside the tray.
  // Tray stays open whenever a hearth page is current.
  const effectiveOpen = open || trayActive;

  const rowClass = `${DESKTOP_NAV_ROW_BASE} ${DESKTOP_NAV_ROW_IDLE}`;

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!wrapperRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        type="button"
        className={rowClass}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={trayId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="relative inline-flex" aria-hidden="true">
          <UsersThree size={18} />
          {hasUnread && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-ember ring-2 ring-surface-panel" />
          )}
        </span>
        <span className="flex-1">Community</span>
        <CaretRight
          size={14}
          aria-hidden="true"
          className={`text-text-muted transition-transform duration-200 ease-[var(--ease-default)] ${effectiveOpen ? 'rotate-90' : ''}`}
        />
      </button>
      {effectiveOpen && (
        <div
          id={trayId}
          role="menu"
          aria-label="Community submenu"
          className={DESKTOP_TRAY_BASE}
        >
          {hearths.map((h) => {
            const active = pathname.startsWith(`/hearths/${h.id}`);
            return (
              <Link
                key={h.id}
                href={`/hearths/${h.id}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`${DESKTOP_TRAY_ITEM_BASE} ${active ? 'border-border-medium bg-surface-raised text-ember' : 'border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary'}`}
              >
                <span className={`h-2 w-2 flex-shrink-0 rounded-full ${h.pendingCount > 0 ? 'bg-ember' : 'bg-sage'}`} />
                <span className="flex-1 truncate">{h.name}</span>
                {h.pendingCount > 0 && (
                  <span className="flex-shrink-0 rounded-[6px] bg-ember px-1.5 py-px font-sans text-[0.65rem] font-semibold text-text-inverse">
                    {h.pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
