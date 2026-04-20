'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { initAnalytics, identifyFamily, resetIdentity } from '@/lib/analytics/posthog';

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
    if (isSignedIn && user) {
      // We identify on Clerk user ID, not family ID, because family is looked
      // up server-side from the Clerk ID and we don't want two round-trips
      // here. The hashing in posthog.ts ensures the raw ID never transits.
      identifyFamily(user.id);
    } else {
      resetIdentity();
    }
  }, [isSignedIn, user, isLoaded]);

  return <>{children}</>;
}
