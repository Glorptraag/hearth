import type { ComponentType } from 'react';
import {
  House,
  BookOpenText,
  PencilSimpleLine,
  CalendarBlank,
  Compass,
  Stack,
  Medal,
  ClipboardText,
  Storefront,
  Sparkle,
  Plant,
} from '@/components/icons';

export type NavIcon = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

export type DirectTab = {
  kind: 'direct';
  id: 'home' | 'story';
  label: string;
  href: string;
  Icon: NavIcon;
};

export type LogTab = {
  kind: 'log';
  id: 'log';
  label: string;
  href: string;
  Icon: NavIcon;
};

export type TrayId = 'plan' | 'explore';

export type TrayDestination = {
  href: string;
  label: string;
  Icon: NavIcon;
};

export type TrayedTabConfig = {
  kind: 'trayed';
  id: TrayId;
  label: string;
  Icon: NavIcon;
  /** Ordered top→bottom in the tray. Bottom row (last item) is closest to the thumb. */
  destinations: ReadonlyArray<TrayDestination>;
};

export type NavTabConfig = DirectTab | LogTab | TrayedTabConfig;

/**
 * Builds the five tabs of the parent-facing mobile bottom nav, in render order
 * (Home | Story | Log | Plan | Explore). Single source of truth for the IA.
 *
 * `basePath` prefixes every `href` and `destinations[].href` so the same nav can
 * drive the live app (`''`) and the unauthenticated demo (`'/demo'`). Active-state
 * comparison runs on the *unprefixed* path — strip `basePath` from `usePathname()`
 * via {@link stripBasePath} before calling {@link isDirectTabActive}.
 */
export function buildNav(basePath = ''): ReadonlyArray<NavTabConfig> {
  const p = (href: string) => `${basePath}${href}`;
  return [
    { kind: 'direct', id: 'home', label: 'Home', href: p('/dashboard'), Icon: House },
    { kind: 'direct', id: 'story', label: 'Story', href: p('/our-story'), Icon: BookOpenText },
    { kind: 'log', id: 'log', label: 'Log', href: p('/log'), Icon: PencilSimpleLine },
    {
      kind: 'trayed',
      id: 'plan',
      label: 'Plan',
      Icon: CalendarBlank,
      destinations: [
        { href: p('/heu'), label: 'HEU Curation', Icon: ClipboardText },
        { href: p('/badges'), label: 'Badge Creator', Icon: Medal },
        { href: p('/module'), label: 'Module Builder', Icon: Stack },
        { href: p('/planner'), label: 'Weekly Planner', Icon: CalendarBlank },
      ],
    },
    {
      kind: 'trayed',
      id: 'explore',
      label: 'Explore',
      Icon: Compass,
      destinations: [
        { href: p('/pedagogy'), label: 'Pedagogy Engine', Icon: Plant },
        { href: p('/our-story/capabilities'), label: 'Capabilities', Icon: Sparkle },
        { href: p('/explore/marketplace'), label: 'Marketplace', Icon: Storefront },
        { href: p('/explore/activities'), label: 'Activity Discovery', Icon: Compass },
      ],
    },
  ];
}

/** Canonical live nav (no basePath prefix). */
export const NAV_TABS: ReadonlyArray<NavTabConfig> = buildNav('');

/**
 * Strips a route-group `basePath` off a pathname so the nav's active-state
 * matchers (which know only canonical `/dashboard`, `/our-story`, … paths) work
 * identically under `/demo`. `'/demo/log'` → `'/log'`; `'/demo'` → `'/'`.
 */
export function stripBasePath(pathname: string, basePath = ''): string {
  if (!basePath) return pathname;
  if (pathname === basePath) return '/';
  if (pathname.startsWith(`${basePath}/`)) return pathname.slice(basePath.length);
  return pathname;
}

/**
 * Active-state matchers for direct tabs. `Story` covers the entire `/our-story`
 * subtree because the Capabilities tray destination lives under it. Operates on
 * the unprefixed path — pass a {@link stripBasePath} result in demo mode.
 */
export function isDirectTabActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  if (href === '/our-story') return pathname === '/our-story' || pathname.startsWith('/our-story/');
  if (href === '/log') return pathname === '/log';
  return pathname === href;
}
