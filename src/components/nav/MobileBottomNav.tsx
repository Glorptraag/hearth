'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { NAV_TABS, isDirectTabActive, type TrayId } from './navConfig';
import { NavTab } from './NavTab';
import { LogButton } from './LogButton';
import { TrayedTab } from './TrayedTab';
import { NavTray } from './NavTray';

type TrayState =
  /** No tray rendered. */
  | { phase: 'closed' }
  /** Tray mounted, rows entering / idle. */
  | { phase: 'open'; trayId: TrayId }
  /** Tray running its exit animation; unmounts on `onClosed`. */
  | { phase: 'closing'; trayId: TrayId };

/**
 * Parent-facing mobile bottom nav. Hidden at lg:.
 *
 * Owns one piece of state — the tray phase machine. Route changes auto-clear
 * the tray (immediate, no animation) so the user never returns to a screen
 * with a tray still visually open.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [tray, setTray] = useState<TrayState>({ phase: 'closed' });
  const trayedTabRefs = useRef<Partial<Record<TrayId, HTMLButtonElement | null>>>({});

  const close = useCallback(() => {
    setTray((prev) => (prev.phase === 'open' ? { phase: 'closing', trayId: prev.trayId } : prev));
  }, []);

  const closeImmediate = useCallback(() => {
    setTray({ phase: 'closed' });
  }, []);

  // Close immediately on route change. Don't run a close animation — the new
  // page is already mounting and the tray would visually overlap.
  const lastPathRef = useRef(pathname);
  useEffect(() => {
    if (lastPathRef.current !== pathname) {
      lastPathRef.current = pathname;
      closeImmediate();
    }
  }, [pathname, closeImmediate]);

  // Escape closes the open tray and returns focus to its anchor tab.
  useEffect(() => {
    if (tray.phase !== 'open') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const anchorId = tray.trayId;
        close();
        // Restore focus on the next frame, after the close starts.
        requestAnimationFrame(() => {
          trayedTabRefs.current[anchorId]?.focus();
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tray, close]);

  const toggleTray = useCallback(
    (id: TrayId) => {
      setTray((prev) => {
        if (prev.phase === 'open' && prev.trayId === id) {
          return { phase: 'closing', trayId: id };
        }
        if (prev.phase === 'closing') {
          // Mid-swap; ignore rapid re-taps until the exit completes.
          return prev;
        }
        return { phase: 'open', trayId: id };
      });
    },
    [],
  );

  const onTrayRowSelect = useCallback(
    (href: string) => {
      // Close immediately + navigate. The pathname effect would also clear it,
      // but doing both means a row tap mid-route-change still feels instant.
      closeImmediate();
      router.push(href);
    },
    [closeImmediate, router],
  );

  const activeTrayId =
    tray.phase === 'open' || tray.phase === 'closing' ? tray.trayId : null;

  return (
    <>
      {/* Backdrop captures outside-taps and dims the page so the tray reads as a
          distinct layer — not tangled with floating runner buttons beneath it. */}
      {tray.phase === 'open' && (
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={close}
          className="fixed inset-0 z-[90] cursor-default backdrop-modal hearth-fade-in lg:hidden"
        />
      )}

      {/* The tray itself. Stays mounted through 'closing' so exit animation can play. */}
      {activeTrayId && (() => {
        const trayConfig = NAV_TABS.find(
          (t): t is Extract<(typeof NAV_TABS)[number], { kind: 'trayed' }> =>
            t.kind === 'trayed' && t.id === activeTrayId,
        );
        if (!trayConfig) return null;
        return (
          <NavTray
            key={activeTrayId}
            id={`mobile-nav-tray-${activeTrayId}`}
            labelledBy={`mobile-nav-tab-${activeTrayId}`}
            trayKind={activeTrayId}
            destinations={trayConfig.destinations}
            closing={tray.phase === 'closing'}
            onSelect={onTrayRowSelect}
            onClosed={closeImmediate}
          />
        );
      })()}

      <nav
        aria-label="Primary"
        className="relative z-[100] shrink-0 grid grid-cols-5 items-end bg-surface-body px-xs pt-sm lg:hidden"
        style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))' }}
      >
        {NAV_TABS.map((tab) => {
          if (tab.kind === 'direct') {
            return (
              <NavTab
                key={tab.id}
                href={tab.href}
                label={tab.label}
                Icon={tab.Icon}
                active={isDirectTabActive(pathname, tab.href)}
                onNavigate={closeImmediate}
              />
            );
          }
          if (tab.kind === 'log') {
            return (
              <LogButton
                key={tab.id}
                href={tab.href}
                Icon={tab.Icon}
                onNavigate={closeImmediate}
              />
            );
          }
          return (
            <TrayedTab
              key={tab.id}
              ref={(el) => {
                trayedTabRefs.current[tab.id] = el;
              }}
              id={tab.id}
              label={tab.label}
              Icon={tab.Icon}
              isOpen={activeTrayId === tab.id && tray.phase === 'open'}
              trayId={`mobile-nav-tray-${tab.id}`}
              onToggle={() => toggleTray(tab.id)}
            />
          );
        })}
      </nav>
    </>
  );
}
