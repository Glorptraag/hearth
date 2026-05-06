'use client';

import { forwardRef } from 'react';
import type { NavIcon, TrayId } from './navConfig';

type TrayedTabProps = {
  id: TrayId;
  label: string;
  Icon: NavIcon;
  isOpen: boolean;
  trayId: string;
  onToggle: () => void;
};

/**
 * Trayed bottom-nav tab (Plan, Explore). Wears a circle ring at rest as a
 * shape signal that "this opens into something" (spec §4 shape vocabulary).
 */
export const TrayedTab = forwardRef<HTMLButtonElement, TrayedTabProps>(
  function TrayedTab({ label, Icon, isOpen, trayId, onToggle }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={trayId}
        aria-label={`${label} menu`}
        className={`flex min-h-[44px] flex-col items-center justify-end gap-xs px-xs py-sm font-sans text-[0.65rem] font-semibold uppercase tracking-[0.08em] transition-colors duration-[var(--motion-quick)] ease-[var(--ease-default)] ${
          isOpen ? 'text-ember' : 'text-text-muted'
        }`}
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] transition-[background-color,border-color] duration-[var(--motion-gentle)] ease-[var(--ease-default)] ${
            isOpen
              ? 'border-ember bg-ember-glow'
              : 'border-border-medium bg-transparent'
          }`}
          aria-hidden="true"
        >
          <Icon size={18} />
        </span>
        <span>{label}</span>
      </button>
    );
  },
);
