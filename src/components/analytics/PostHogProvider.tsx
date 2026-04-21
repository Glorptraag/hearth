'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { initAnalytics, identifyUser, resetIdentity } from '@/lib/analytics/posthog';

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
      // Passing Clerk user ID; it is hashed inside posthog.ts before transit.
      // Co-facilitators on a shared family will appear as distinct PostHog
      // identities until we wire server-side family-level aggregation.
      identifyUser(user.id);
    } else {
      resetIdentity();
    }
  }, [isSignedIn, user, isLoaded]);

  return <>{children}</>;
}
