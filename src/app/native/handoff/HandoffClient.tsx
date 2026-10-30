'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth, useSignIn } from '@clerk/nextjs';
import { redeemHandoff } from '@/lib/platform/handoff';

export function HandoffClient({ ticket, next }: { ticket: string | null; next: string }) {
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn } = useSignIn();
  const [failed, setFailed] = useState(false);
  // A ticket is single use; StrictMode's double effect must not spend it twice.
  const started = useRef(false);

  useEffect(() => {
    if (!isLoaded || started.current) return;
    started.current = true;
    redeemHandoff({
      ticket,
      next,
      isSignedIn: Boolean(isSignedIn),
      signIn,
      // A full load, so server components render with the new session cookie.
      navigate: (to) => window.location.replace(to),
    })
      .then((ok) => {
        if (!ok) setFailed(true);
      })
      .catch(() => setFailed(true));
  }, [isLoaded, isSignedIn, signIn, ticket, next]);

  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-lg">
      <div className="w-full max-w-[420px] rounded-lg border border-border-subtle bg-surface-panel p-xl text-center">
        {failed ? (
          <>
            <h1 className="heading mb-sm text-2xl text-text-primary">Sign in to continue</h1>
            <p className="body-serif mb-lg text-base leading-relaxed text-text-secondary">
              Hearth couldn&rsquo;t carry your sign-in over to this page. Signing in once here
              keeps it for next time.
            </p>
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(next)}`}
              className="hearth-press inline-flex rounded-md bg-ember px-md py-sm font-sans font-semibold text-text-inverse"
            >
              Sign in
            </Link>
          </>
        ) : (
          <p className="hearth-thinking body-serif text-base text-text-secondary" role="status">
            Signing you in&hellip;
          </p>
        )}
      </div>
    </main>
  );
}
