'use client';

import Link from 'next/link';
import type { BadgeReadyToast } from '@/lib/logger/badge-check';
import { confirmCopy } from './confirmCopy';

export type BadgeReadyRowProps = {
  badge: BadgeReadyToast;
};

/** Persistent (never auto-dismissed) badge-ready prompt. */
export function BadgeReadyRow({ badge }: BadgeReadyRowProps) {
  return (
    <div className="flex flex-col gap-sm rounded-md border border-border-subtle bg-surface-raised p-md sm:flex-row sm:items-center sm:justify-between">
      <p className="font-sans text-[13px] text-text-primary">{badge.message}</p>
      <Link
        href={badge.action.href}
        className="hearth-press inline-flex min-h-[44px] items-center font-sans text-[13px] font-semibold text-ember hover:text-ember-hover"
      >
        {confirmCopy.badgeAction}
      </Link>
    </div>
  );
}
