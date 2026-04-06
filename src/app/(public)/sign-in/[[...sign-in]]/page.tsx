import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { clerkAppearance } from '../../../clerk-theme';

export default function SignInPage() {
  return (
    <>
      {/* Atmospheric glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 10%, rgba(217,123,58,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 90%, rgba(217,123,58,0.04) 0%, transparent 50%)',
        }}
      />

      {/* Nav */}
      <nav
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-border-subtle px-lg py-md backdrop-blur-[12px]"
        style={{ background: 'rgba(15,13,11,0.85)' }}
      >
        <Link
          href="/"
          className="font-serif text-xl font-semibold tracking-[0.02em] text-text-primary"
        >
          Hearth
        </Link>
        <div className="flex items-center gap-sm">
          <Link
            href="/sign-up"
            className="rounded-[10px] bg-ember px-md py-sm font-sans text-xs font-semibold text-text-inverse transition-all duration-200 hover:bg-ember-hover hover:-translate-y-px"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-lg pt-[80px] pb-2xl">
        <SignIn appearance={clerkAppearance} />
      </div>
    </>
  );
}
