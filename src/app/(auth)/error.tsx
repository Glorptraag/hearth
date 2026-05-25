'use client';

import { useEffect } from 'react';
import EmptyState from '@/components/ui/EmptyState';
import { Lifebuoy } from '@/components/icons';

/**
 * (auth)/error.tsx — Next.js error boundary for every authenticated route.
 *
 * Catches throws from server components, suspense boundaries, and client
 * components nested under (auth). Before 2026-05-25 it silently swallowed
 * the `error.digest` field, which is the only handle on a server-side throw
 * once Next.js has obfuscated the real stack in production.
 *
 * Now we:
 *   - console.error with the digest + name + message so dev console + Vercel
 *     logs carry enough to grep,
 *   - report to Sentry with the digest as a tag, so production crashes
 *     surface in the dashboard instead of vanishing into a generic
 *     "Application error" UI.
 */
export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      `[auth/error.tsx] digest=${error.digest ?? 'n/a'} name=${error.name}`,
      error
    );
    // Sentry is optional — never let observability crash the error UI itself.
    void (async () => {
      try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureException(error, {
          tags: {
            pipeline: 'auth-error-boundary',
            digest: error.digest ?? 'none',
          },
        });
      } catch {
        // ignore
      }
    })();
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-lg">
      <EmptyState
        icon={Lifebuoy}
        heading="Something went wrong"
        body="An unexpected error occurred. Your learning data is safe."
        cta={{ label: 'Try again', onClick: reset }}
      />
    </div>
  );
}
