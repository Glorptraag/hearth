'use client';

import Link from 'next/link';
import { forwardRef } from 'react';
import type { CSSProperties } from 'react';
import type { NavIcon } from './navConfig';
import styles from './nav.module.css';

type TrayRowProps = {
  href: string;
  label: string;
  Icon: NavIcon;
  /** 0 = bottom row (closest to thumb / first to enter). Drives the stagger delay. */
  indexFromBottom: number;
  closing: boolean;
  onSelect: () => void;
  onAnimationEnd?: () => void;
};

/**
 * Single row inside an open NavTray. Layout is `[label chip ← icon circle]`
 * so the icon column right-aligns with the trayed-tab icon below.
 */
export const TrayRow = forwardRef<HTMLAnchorElement, TrayRowProps>(
  function TrayRow(
    { href, label, Icon, indexFromBottom, closing, onSelect, onAnimationEnd },
    ref,
  ) {
    const style = { '--row-index-from-bottom': indexFromBottom } as CSSProperties;
    return (
      <Link
        ref={ref}
        href={href}
        role="menuitem"
        onClick={onSelect}
        onAnimationEnd={onAnimationEnd}
        data-state={closing ? 'closing' : 'open'}
        style={style}
        className={`${styles['tray-row']} hearth-press flex min-h-[44px] items-center justify-end gap-sm`}
      >
        <span className="rounded-full border border-border-subtle bg-surface-panel px-md py-xs font-sans text-[0.85rem] font-medium text-text-primary shadow-inset-highlight">
          {label}
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-surface-panel text-text-primary shadow-inset-highlight"
          aria-hidden="true"
        >
          <Icon size={18} />
        </span>
      </Link>
    );
  },
);
