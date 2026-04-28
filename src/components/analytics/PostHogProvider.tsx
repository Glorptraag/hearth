'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  initAnalytics,
  identifyUser,
  identifyFamily,
  resetIdentity,
} from '@/lib/analytics/posthog';

/**
 * Wraps authenticated routes only. We never identify anonymous visitors or
 * capture events on public marketing pages.
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, user, isLoaded } = useUser();

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      resetIdentity();
      return;
    }
    // Identify on the (hashed) Clerk user ID first so client + server
    // events join. Then fetch the family ID and tag the person with
    // a `family` group — two co-facilitators on one household roll up
    // into one analytic unit for funnels and retention.
    identifyUser(user.id);
    let cancelled = false;
    fetch('/api/family', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { id?: string } | null) => {
        if (cancelled || !body?.id) return;
        identifyFamily(body.id);
      })
      .catch(() => {
        // Family identification is best-effort; analytics never blocks.
      });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, user, isLoaded]);

  return <>{children}</>;
}
