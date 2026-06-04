import type { ComponentType } from 'react';
import {
  CalendarBlank,
  PencilSimpleLine,
  BookOpenText,
  Sparkle,
  FileText,
  Books,
  Compass,
  Storefront,
} from '@/components/icons';

export type NavIcon = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

export type NavTrayItem = { href: string; label: string; Icon?: NavIcon };
export type NavRowConfig = {
  label: string;
  Icon: NavIcon;
  href?: string;
  tray?: ReadonlyArray<NavTrayItem>;
};

/**
 * Desktop sidebar information architecture (≥lg). Distinct from the mobile
 * five-tab nav in `navConfig.ts`. Hrefs are canonical (no basePath) — the row
 * components prefix them with `basePath` and the demo passes `'/demo'`.
 */
export const PRIMARY_NAV: ReadonlyArray<NavRowConfig> = [
  { label: 'This Week', Icon: CalendarBlank, href: '/planner' },
  { label: 'Log', Icon: PencilSimpleLine, href: '/log' },
  {
    label: 'Our Story',
    Icon: BookOpenText,
    href: '/our-story',
    tray: [
      { href: '/our-story/capabilities', label: 'Capabilities', Icon: Sparkle },
      { href: '/our-story/portfolio', label: 'Portfolios', Icon: FileText },
    ],
  },
  {
    label: 'Discover',
    Icon: Compass,
    tray: [
      { href: '/library', label: 'Library', Icon: Books },
      // Browse moved into Library tab in Phase 4.6; nav now points at the
      // canonical home. Old /explore/activities 308s here per Task 5.1.
      { href: '/library?tab=browse', label: 'Browse', Icon: Compass },
      { href: '/explore/marketplace', label: 'Marketplace', Icon: Storefront },
    ],
  },
];

/**
 * Active-state matcher for the desktop sidebar. Operates on the unprefixed path —
 * strip `basePath` (via `stripBasePath` from `navConfig.ts`) before calling in
 * demo mode.
 */
export function isDesktopNavActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  if (href === '/our-story') return pathname === '/our-story';
  if (href === '/our-story/capabilities') return pathname.startsWith('/our-story/capabilities');
  if (href === '/our-story/portfolio') return pathname.startsWith('/our-story/portfolio');
  if (href === '/log') return pathname === '/log';
  if (href === '/planner') return pathname.startsWith('/planner');
  if (href === '/library') return pathname.startsWith('/library');
  if (href === '/library?tab=browse') return pathname === '/library';
  if (href === '/explore/marketplace') return pathname.startsWith('/explore/marketplace');
  if (href === '/settings') return pathname === '/settings';
  if (href === '/notifications') return pathname === '/notifications';
  if (href.startsWith('/hearths/')) return pathname.startsWith(href);
  return false;
}

export const DESKTOP_NAV_ROW_BASE =
  'mb-xs flex w-full items-center gap-md rounded-md border px-md py-md text-left font-sans text-[0.9rem] font-medium transition-all duration-200 ease-[var(--ease-default)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ember)]';
export const DESKTOP_NAV_ROW_ACTIVE =
  'border-border-medium bg-surface-raised text-ember shadow-card shadow-inset-highlight';
export const DESKTOP_NAV_ROW_IDLE =
  'border-transparent text-text-secondary hover:border-border-subtle hover:bg-ember-glow hover:text-text-primary';
export const DESKTOP_TRAY_BASE =
  'mb-xs ml-xl flex flex-col gap-px border-l border-border-subtle pl-sm';
export const DESKTOP_TRAY_ITEM_BASE =
  'flex w-full items-center gap-sm rounded-md border px-sm py-xs text-left font-sans text-[0.85rem] font-medium transition-colors duration-150 ease-[var(--ease-default)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ember)]';
