'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { List, House, UsersThree, Compass, ShieldCheck, Bell, ChatCircleText } from '@/components/icons';
import { FeedbackModal } from '@/components/feedback/FeedbackModal';
import styles from './settings-menu.module.css';

/**
 * Mobile header Settings menu. A hamburger button that, when tapped, wears the
 * active ember-glow circle and drops a vertical tray of Settings sections
 * downward (mirror of the bottom-nav trayed tabs, which open upward). Each row
 * deep-links into /settings on the matching tab. Mobile only (lg:hidden) — the
 * desktop sidebar already exposes Settings.
 */

const SETTINGS_LINKS = [
  { tab: 'profile', label: 'Family Profile', Icon: House },
  { tab: 'children', label: 'Our Learners', Icon: UsersThree },
  { tab: 'pedagogy', label: 'Learning Approach', Icon: Compass },
  { tab: 'reporting', label: 'Reporting', Icon: ShieldCheck },
  { tab: 'notifications', label: 'Notifications', Icon: Bell },
] as const;

type Phase = 'closed' | 'open' | 'closing';

export function SettingsMenu() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('closed');
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const isOpen = phase === 'open';
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = 'mobile-settings-tray';

  const close = useCallback(() => {
    setPhase((p) => (p === 'open' ? 'closing' : p));
  }, []);

  const toggle = useCallback(() => {
    setPhase((p) => (p === 'closed' ? 'open' : p === 'open' ? 'closing' : p));
  }, []);

  // Unmount the tray once its exit animation finishes (~quick + stagger budget).
  useEffect(() => {
    if (phase !== 'closing') return;
    const t = setTimeout(() => setPhase('closed'), 240);
    return () => clearTimeout(t);
  }, [phase]);

  // Close immediately on route change so we never return to an open tray.
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      setPhase('closed');
    }
  }, [pathname]);

  // Escape closes and returns focus to the hamburger.
  useEffect(() => {
    if (phase !== 'open') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        requestAnimationFrame(() => buttonRef.current?.focus());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, close]);

  return (
    <>
      {/* Transparent backdrop captures outside-taps; page stays visible. */}
      {phase === 'open' && (
        <button
          type="button"
          aria-label="Close settings menu"
          tabIndex={-1}
          onClick={close}
          className="fixed inset-0 z-[90] cursor-default bg-transparent lg:hidden"
        />
      )}

      <div className="relative lg:hidden">
        <button
          ref={buttonRef}
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={menuId}
          aria-label="Settings menu"
          className={`hit-target hearth-press flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] transition-[background-color,border-color,color] duration-[var(--motion-gentle)] ease-[var(--ease-default)] ${
            isOpen
              ? 'border-ember bg-ember-glow text-ember'
              : 'border-border-medium text-text-muted hover:text-text-primary'
          }`}
        >
          <List size={18} aria-hidden="true" />
        </button>

        {phase !== 'closed' && (
          <div
            id={menuId}
            role="menu"
            aria-label="Settings"
            className="absolute right-0 top-[calc(100%+8px)] z-[110] flex w-[230px] flex-col gap-[8px]"
          >
            {SETTINGS_LINKS.map((item, i) => (
              <Link
                key={item.tab}
                href={`/settings?tab=${item.tab}`}
                role="menuitem"
                data-state={phase === 'closing' ? 'closing' : 'open'}
                style={{ '--row-index-from-top': i } as CSSProperties}
                className={`${styles['settings-row']} hearth-press flex min-h-[44px] items-center justify-end gap-sm`}
              >
                <span className="rounded-full border border-border-subtle bg-surface-panel px-md py-xs font-sans text-[0.85rem] font-medium text-text-primary shadow-inset-highlight">
                  {item.label}
                </span>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-surface-panel text-text-primary shadow-inset-highlight"
                  aria-hidden="true"
                >
                  <item.Icon size={18} />
                </span>
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              data-state={phase === 'closing' ? 'closing' : 'open'}
              style={{ '--row-index-from-top': SETTINGS_LINKS.length } as CSSProperties}
              onClick={() => {
                close();
                setFeedbackOpen(true);
              }}
              className={`${styles['settings-row']} hearth-press flex min-h-[44px] items-center justify-end gap-sm`}
            >
              <span className="rounded-full border border-border-subtle bg-surface-panel px-md py-xs font-sans text-[0.85rem] font-medium text-text-primary shadow-inset-highlight">
                Send Feedback
              </span>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border-subtle bg-surface-panel text-text-primary shadow-inset-highlight"
                aria-hidden="true"
              >
                <ChatCircleText size={18} />
              </span>
            </button>
          </div>
        )}
      </div>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  );
}
