'use client';

import { useEffect } from 'react';

/**
 * Root-level error boundary.
 *
 * Next.js installs this for any throw that escapes a route segment without
 * a more specific `error.tsx`. The (auth) group has its own boundary; this
 * one covers (public), (admin), demo, dev-preview, and studio.
 *
 * Before 2026-05-25 there was NO root boundary, so an unhandled throw on
 * the public landing or in onboarding rendered Next's default "Application
 * error" white screen — exactly the symptom the user reported alongside
 * /our-story/portfolio.
 *
 * Plain Tailwind / no Hearth design tokens: this component must be safe to
 * render even if `globals.css` or the theme system also failed to load.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      `[app/error.tsx] digest=${error.digest ?? 'n/a'} name=${error.name}`,
      error
    );
    void (async () => {
      try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureException(error, {
          tags: {
            pipeline: 'root-error-boundary',
            digest: error.digest ?? 'none',
          },
        });
      } catch {
        // ignore
      }
    })();
  }, [error]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ maxWidth: '420px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
          Something went wrong
        </h1>
        <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
          An unexpected error occurred. You can try again, or reload the page.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: '8px',
            border: '1px solid currentColor',
            background: 'transparent',
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
