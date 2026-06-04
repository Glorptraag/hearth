'use client';

import Link from 'next/link';
import { useId, useRef, useState } from 'react';
import { CaretRight, UsersThree } from '@/components/icons';
import { stripBasePath } from './navConfig';
import {
  DESKTOP_NAV_ROW_BASE,
  DESKTOP_NAV_ROW_IDLE,
  DESKTOP_TRAY_BASE,
  DESKTOP_TRAY_ITEM_BASE,
} from './desktopNavConfig';

/**
 * Community ("hearths") expandable row of the desktop sidebar (≥lg). `basePath`
 * prefixes every hearth href and is stripped off the pathname before active-state
 * comparison.
 */
export function DesktopCommunityRow({
  hearths,
  pathname,
  hasUnread,
  basePath = '',
}: {
  hearths: Array<{ id: string; name: string; pendingCount: number }>;
  pathname: string;
  hasUnread: boolean;
  basePath?: string;
}) {
  const [open, setOpen] = useState(false);
  const trayId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const localPath = stripBasePath(pathname, basePath);
  const trayActive = hearths.some((h) => localPath.startsWith(`/hearths/${h.id}`));
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
            const active = localPath.startsWith(`/hearths/${h.id}`);
            return (
              <Link
                key={h.id}
                href={`${basePath}/hearths/${h.id}`}
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
