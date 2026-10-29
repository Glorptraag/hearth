'use client';

import { useState } from 'react';
import { photoReadCopy } from '@/components/logger/photoReadCopy';
import { usePhotoReadConsent } from '@/hooks/use-photo-read-consent';

/**
 * Settings toggle for Photo Read consent (W3.2, D-LP-4). The same column the
 * first-photo disclosure writes (`families.photo_read_opt_in`). Saving is
 * optimistic; a failure (including a viewer's 403) reverts and says so.
 */
export function PhotoReadSetting() {
  const { optIn, readAvailable, loaded, setOptIn, saving } = usePhotoReadConsent();
  const [error, setError] = useState<string | null>(null);
  const c = photoReadCopy.setting;
  const enabled = optIn === true;

  async function toggle() {
    setError(null);
    const ok = await setOptIn(!enabled);
    if (!ok) setError(c.saveFailed);
  }

  return (
    <div className="flex flex-col gap-xs">
      <div className="flex items-center gap-md rounded-[10px] border border-border-subtle bg-surface-panel p-md hover:border-border-medium">
        <div className="min-w-0 flex-1">
          <p id="photo-read-setting-label" className="font-sans text-sm font-semibold text-text-primary">
            {c.label}
          </p>
          <p id="photo-read-setting-desc" className="mt-xs font-sans text-xs text-text-muted">
            {c.description}
          </p>
          {loaded && optIn === null && <p className="mt-xs font-sans text-xs text-text-muted">{c.unanswered}</p>}
          {loaded && !readAvailable && <p className="mt-xs font-sans text-xs text-text-muted">{c.notYetAvailable}</p>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="photo-read-setting-label"
          aria-describedby="photo-read-setting-desc"
          disabled={!loaded || saving}
          onClick={() => void toggle()}
          className={`hit-target relative h-6 w-11 flex-shrink-0 rounded-full transition-colors disabled:opacity-60 ${
            enabled ? 'bg-ember' : 'border border-border-medium bg-surface-hover'
          }`}
        >
          <span
            className={`hearth-switch-knob absolute top-[2px] h-5 w-5 rounded-full bg-white shadow ${
              enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'
            }`}
          />
        </button>
      </div>
      {error && (
        <p role="alert" className="font-sans text-xs text-text-secondary">
          {error}
        </p>
      )}
    </div>
  );
}
