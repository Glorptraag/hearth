'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type PhotoReadConsent = {
  /** null = never answered (the first-photo sheet should show). */
  optIn: boolean | null;
  /** Read could run for this family right now (flag + allowlist). */
  readAvailable: boolean;
};

export type UsePhotoReadConsentReturn = PhotoReadConsent & {
  /** The first GET has settled (either way). */
  loaded: boolean;
  /** The GET failed — treat consent as unknown and never block capture on it. */
  failed: boolean;
  /** PATCH the answer. Optimistic; reverts and resolves false on failure. */
  setOptIn: (optIn: boolean) => Promise<boolean>;
  saving: boolean;
};

/**
 * Photo Read consent for the signed-in family (`/api/family/photo-read`).
 * Shared by the first-photo disclosure on /log and the Settings toggle.
 */
export function usePhotoReadConsent({ enabled = true }: { enabled?: boolean } = {}): UsePhotoReadConsentReturn {
  const [consent, setConsent] = useState<PhotoReadConsent>({ optIn: null, readAvailable: false });
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/family/photo-read');
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as Partial<PhotoReadConsent>;
        if (cancelled) return;
        setConsent({
          optIn: typeof body.optIn === 'boolean' ? body.optIn : null,
          readAvailable: body.readAvailable === true,
        });
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const setOptIn = useCallback(async (optIn: boolean) => {
    let previous: PhotoReadConsent | null = null;
    setConsent((c) => {
      previous = c;
      return { ...c, optIn };
    });
    setSaving(true);
    try {
      const res = await fetch('/api/family/photo-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optIn }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as Partial<PhotoReadConsent>;
      if (mounted.current) {
        setConsent({
          optIn: typeof body.optIn === 'boolean' ? body.optIn : optIn,
          readAvailable: body.readAvailable === true,
        });
      }
      return true;
    } catch {
      if (mounted.current && previous) setConsent(previous);
      return false;
    } finally {
      if (mounted.current) setSaving(false);
    }
  }, []);

  return { ...consent, loaded, failed, setOptIn, saving };
}
