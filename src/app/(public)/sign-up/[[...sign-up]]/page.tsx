'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { useTheme } from '@/hooks/use-theme';
import { Wordmark } from '@/components/ui/Wordmark';
import { getClerkAppearance } from '../../../clerk-theme';

export default function SignUpPage() {
  const { theme } = useTheme();

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
            href="/sign-in"
            className="rounded-[10px] border border-border-subtle px-md py-sm font-sans text-xs font-medium text-text-secondary transition-all duration-200 hover:border-border-medium hover:text-text-primary"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-lg pt-[80px] pb-2xl">
        <SignUp
          appearance={getClerkAppearance(theme)}
          fallbackRedirectUrl="/welcome"
          signInFallbackRedirectUrl="/dashboard"
        />
      </div>
    </>
  );
}
