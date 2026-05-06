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
 * The five tabs of the parent-facing mobile bottom nav, in render order
 * (Home | Story | Log | Plan | Explore). Single source of truth for the IA.
 */
export const NAV_TABS: ReadonlyArray<NavTabConfig> = [
  { kind: 'direct', id: 'home', label: 'Home', href: '/dashboard', Icon: House },
  { kind: 'direct', id: 'story', label: 'Story', href: '/our-story', Icon: BookOpenText },
  { kind: 'log', id: 'log', label: 'Log', href: '/log', Icon: PencilSimpleLine },
  {
    kind: 'trayed',
    id: 'plan',
    label: 'Plan',
    Icon: CalendarBlank,
    destinations: [
      { href: '/heu', label: 'HEU Curation', Icon: ClipboardText },
      { href: '/badges', label: 'Badge Creator', Icon: Medal },
      { href: '/module', label: 'Module Builder', Icon: Stack },
      { href: '/planner', label: 'Weekly Planner', Icon: CalendarBlank },
    ],
  },
  {
    kind: 'trayed',
    id: 'explore',
    label: 'Explore',
    Icon: Compass,
    destinations: [
      { href: '/pedagogy', label: 'Pedagogy Engine', Icon: Plant },
      { href: '/our-story/capabilities', label: 'Capabilities', Icon: Sparkle },
      { href: '/explore/marketplace', label: 'Marketplace', Icon: Storefront },
      { href: '/explore/activities', label: 'Activity Discovery', Icon: Compass },
    ],
  },
];

/**
 * Active-state matchers for direct tabs. `Story` covers the entire `/our-story`
 * subtree because the Capabilities tray destination lives under it.
 */
export function isDirectTabActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  if (href === '/our-story') return pathname === '/our-story' || pathname.startsWith('/our-story/');
  if (href === '/log') return pathname === '/log';
  return pathname === href;
}
