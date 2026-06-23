'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/**
 * Prompts the parent to set their state/territory when it's unset.
 *
 * getJurisdiction(null) silently falls back to Queensland (HEU) framing — so a
 * family that never set a state gets QLD reporting rules + dates with no signal
 * that an assumption was made. New families set state during onboarding (and the
 * onboarding/complete route now enforces it), so this only surfaces for legacy
 * families with a null state. Self-fetches /api/settings so it drops into any
 * (auth) screen with no prop threading; renders nothing once state is set.
 */
export function JurisdictionBanner() {
  const [needsState, setNeedsState] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (cancelled || !s) return;
        const v = typeof s.state === 'string' ? s.state.trim() : '';
        if (!v) setNeedsState(true);
      })
      .catch(() => { /* degrade silently — never block the screen on this */ });
    return () => { cancelled = true; };
  }, []);

  if (!needsState) return null;

  return (
    <div
      role="status"
      className="mb-lg flex flex-wrap items-center justify-between gap-sm rounded-[10px] border border-border-active bg-ember-glow px-md py-sm"
    >
      <p className="font-sans text-sm text-text-secondary">
        Hearth is assuming{' '}
        <strong className="font-semibold text-text-primary">Queensland (HEU)</strong> reporting.
        Set your state or territory so reports use the right rules and dates.
      </p>
      <Link
        href="/settings"
        className="shrink-0 rounded-md bg-ember px-md py-xs font-sans text-sm font-semibold text-text-inverse transition-colors duration-[var(--motion-quick)] hover:bg-ember-hover"
      >
        Set your state →
      </Link>
    </div>
  );
}
