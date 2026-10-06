'use client';

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { useTheme } from '@/hooks/use-theme';
import { Wordmark } from '@/components/ui/Wordmark';
import { getClerkAppearance } from '../../../clerk-theme';
import { useCopy } from '@/lib/copy';

export default function SignInPage() {
  const { theme } = useTheme();
  const copy = useCopy('auth');

  return (
    <>
      {/* Nav */}
      <nav
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-border-subtle px-lg py-md backdrop-blur-[12px]"
        style={{ background: 'var(--color-surface-nav-blur)' }}
      >
        <Link href="/" className="inline-flex items-center" aria-label="Hearth — home">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-sm">
          <Link
            href="/sign-up"
            className="rounded-[10px] bg-ember px-md py-sm font-sans text-xs font-semibold text-text-inverse transition-all duration-[var(--motion-quick)] hover:bg-ember-hover hover:-translate-y-px"
          >
            {copy['nav.getStarted']}
          </Link>
        </div>
      </nav>

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-lg pt-[80px] pb-2xl">
        <SignIn
          appearance={getClerkAppearance(theme)}
          fallbackRedirectUrl="/dashboard"
          signUpFallbackRedirectUrl="/welcome"
        />
      </div>
    </>
  );
}
