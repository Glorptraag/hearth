'use client';

import Link from 'next/link';
import type { NavIcon } from './navConfig';

type LogButtonProps = {
  href: string;
  Icon: NavIcon;
  onNavigate?: () => void;
};

/**
 * Elevated centre tab. Always renders the same way (no active state) per
 * spec §6 — tapping always goes to the Logger workspace.
 */
export function LogButton({ href, Icon, onNavigate }: LogButtonProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-label="Log a moment"
      className="hearth-press flex min-h-[44px] flex-col items-center justify-end gap-xs px-xs py-sm font-sans text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-ember"
    >
      <span
        className="-mt-[16px] flex h-12 w-12 items-center justify-center rounded-full bg-ember text-text-inverse shadow-ember"
        aria-hidden="true"
      >
        <Icon size={22} />
      </span>
      <span>Log</span>
    </Link>
  );
}
