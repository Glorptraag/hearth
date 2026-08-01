'use client';

import Link from 'next/link';
import type { NavIcon } from './navConfig';

type NavTabProps = {
  href: string;
  label: string;
  Icon: NavIcon;
  active: boolean;
  onNavigate?: () => void;
};

/**
 * Direct (non-trayed) bottom-nav tab. Used for Home and Story.
 * Flat icon — no ring container, no fill.
 */
export function NavTab({ href, label, Icon, active, onNavigate }: NavTabProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`hearth-press flex min-h-[44px] flex-col items-center justify-end gap-xs px-xs py-sm font-sans text-[0.65rem] font-semibold uppercase tracking-[0.08em] transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
        active ? 'text-ember' : 'text-text-muted'
      }`}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center" aria-hidden="true">
        <Icon size={22} />
      </span>
      <span>{label}</span>
    </Link>
  );
}
