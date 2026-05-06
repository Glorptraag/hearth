'use client';

import { useEffect, useRef } from 'react';
import { TrayRow } from './TrayRow';
import type { TrayDestination, TrayId } from './navConfig';

type NavTrayProps = {
  /** Stable id for aria-controls / aria-labelledby pairing. */
  id: string;
  /** The owning tab's id, used for the `aria-labelledby` attribute. */
  labelledBy: string;
  /** The currently active tray (used to anchor horizontally). */
  trayKind: TrayId;
  /** Top→bottom order; bottom row enters first. */
  destinations: ReadonlyArray<TrayDestination>;
  /** True while the close animation is playing (rows render with data-state="closing"). */
  closing: boolean;
  onSelect: (href: string) => void;
  /** Fires once the bottom-most row's exit animation finishes. */
  onClosed: () => void;
};

/**
 * Anchored vertical column of tray rows. The right edge sits so the icon
 * column lines up with the anchor tab below: Plan ≈ right 13%, Explore ≈ right 3%
 * on a 5-column grid (spec §7).
 */
export function NavTray({
  id,
  labelledBy,
  trayKind,
  destinations,
  closing,
  onSelect,
  onClosed,
}: NavTrayProps) {
  const firstFocusRef = useRef<HTMLAnchorElement | null>(null);
  const closedFiredRef = useRef(false);
  const rightOffset = trayKind === 'plan' ? '13%' : '3%';

  // Focus the bottom row (closest to thumb) when the tray mounts open.
  useEffect(() => {
    if (!closing && firstFocusRef.current) {
      firstFocusRef.current.focus();
    }
  }, [closing]);

  // Reset the "closed already fired" guard whenever we re-open.
  useEffect(() => {
    if (!closing) closedFiredRef.current = false;
  }, [closing]);

  const total = destinations.length;

  return (
    <div
      id={id}
      role="menu"
      aria-labelledby={labelledBy}
      style={{
        right: rightOffset,
        bottom: 'calc(96px + env(safe-area-inset-bottom, 0px))',
      }}
      className="fixed z-[110] flex max-w-[280px] flex-col gap-[10px] lg:hidden"
    >
      {destinations.map((dest, i) => {
        const indexFromBottom = total - 1 - i;
        const isBottom = indexFromBottom === 0;
        return (
          <TrayRow
            key={dest.href}
            ref={isBottom ? firstFocusRef : undefined}
            href={dest.href}
            label={dest.label}
            Icon={dest.Icon}
            indexFromBottom={indexFromBottom}
            closing={closing}
            onSelect={() => onSelect(dest.href)}
            onAnimationEnd={
              closing && isBottom
                ? () => {
                    if (!closedFiredRef.current) {
                      closedFiredRef.current = true;
                      onClosed();
                    }
                  }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
