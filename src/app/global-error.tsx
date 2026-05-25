'use client';

import { useEffect } from 'react';

/**
 * Last-line-of-defence error boundary. Renders only when the root layout
 * itself throws (eg. ClerkProvider crashes, ThemeProvider crashes, font
 * loader fails). Must provide its own <html>/<body> because the layout that
 * normally supplies them is the thing that broke.
 *
 * Without this, a root-layout throw falls all the way through to Next.js's
 * built-in error UI — the same unbranded white screen the 2026-05-25
 * incident produced. With it, the user sees a recognisable apology and a
 * working reload control.
 *
 * No external imports beyond React: this file evaluates even when nothing
 * else works.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      `[global-error.tsx] digest=${error.digest ?? 'n/a'} name=${error.name}`,
      error
    );
    void (async () => {
      try {
        const Sentry = await import('@sentry/nextjs');
        Sentry.captureException(error, {
          tags: {
            pipeline: 'global-error-boundary',
            digest: error.digest ?? 'none',
          },
        });
      } catch {
        // ignore
      }
    })();
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          background: '#0F0D0B',
          color: '#FDF6F0',
        }}
      >
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <div style={{ maxWidth: '420px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>
              Hearth is having trouble loading
            </h1>
            <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
              Sorry — something at the very base of the app failed. Your
              learning data is safe. Try reloading; if it persists, we&apos;ll
              get a notification.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                border: '1px solid #FDF6F0',
                background: 'transparent',
                color: '#FDF6F0',
                cursor: 'pointer',
                font: 'inherit',
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
