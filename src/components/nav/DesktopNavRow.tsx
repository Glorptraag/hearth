'use client';

import Link from 'next/link';
import { useId, useRef, useState } from 'react';
import { CaretRight } from '@/components/icons';
import { stripBasePath } from './navConfig';
import {
  type NavRowConfig,
  isDesktopNavActive,
  DESKTOP_NAV_ROW_BASE,
  DESKTOP_NAV_ROW_ACTIVE,
  DESKTOP_NAV_ROW_IDLE,
  DESKTOP_TRAY_BASE,
  DESKTOP_TRAY_ITEM_BASE,
} from './desktopNavConfig';

/**
 * One row of the desktop sidebar (≥lg). Renders either a direct link or an
 * expandable tray. `basePath` prefixes every href and is stripped off the
 * pathname before active-state comparison so the same row drives the live app
 * (`''`) and the demo (`'/demo'`).
 */
export function DesktopNavRow({
  row,
  pathname,
  basePath = '',
}: {
  row: NavRowConfig;
  pathname: string;
  basePath?: string;
}) {
  const [open, setOpen] = useState(false);
  const trayId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const localPath = stripBasePath(pathname, basePath);
  const href = (h: string) => `${basePath}${h}`;
  const isExpandable = !!row.tray && row.tray.length > 0;
  const ownActive = row.href ? isDesktopNavActive(localPath, row.href) : false;
  const trayActive = row.tray?.some((t) => isDesktopNavActive(localPath, t.href)) ?? false;
  // Parent stays idle when only a sub-page is current — the sub-item carries the highlight.
  const active = ownActive;
  // Tray stays open whenever a sub-page is current, regardless of hover/focus.
  const effectiveOpen = open || trayActive;
  const { Icon } = row;

  const rowClass = `${DESKTOP_NAV_ROW_BASE} ${active ? DESKTOP_NAV_ROW_ACTIVE : DESKTOP_NAV_ROW_IDLE}`;

  if (!isExpandable && row.href) {
    return (
      <Link href={href(row.href)} className={rowClass}>
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
      href={href(row.href)}
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
            const itemActive = isDesktopNavActive(localPath, item.href);
            const ItemIcon = item.Icon;
            return (
              <Link
                key={item.href}
                href={href(item.href)}
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
