import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

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
        <SignIn
          appearance={{
            elements: {
              rootBox: 'w-full max-w-[420px]',
              card: 'bg-surface-panel border border-border-subtle rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_60px_rgba(217,123,58,0.08)] !p-2xl',
              headerTitle: 'font-serif text-text-primary text-lg font-semibold',
              headerSubtitle: 'font-serif text-text-secondary text-sm',
              socialButtonsBlockButton:
                'bg-surface-raised border border-border-subtle text-text-secondary font-sans text-sm rounded-[10px] hover:bg-surface-hover hover:border-border-medium hover:translate-y-[-1px] transition-all duration-200',
              socialButtonsBlockButtonText: 'font-sans text-sm font-medium',
              dividerLine: 'bg-border-subtle',
              dividerText: 'font-sans text-xs text-text-muted',
              formFieldLabel: 'font-sans text-xs font-medium text-text-secondary',
              formFieldInput:
                'bg-surface-body border border-border-subtle text-text-primary font-sans text-sm rounded-[10px] focus:border-[rgba(217,123,58,0.25)] focus:ring-0 placeholder:text-text-muted',
              formButtonPrimary:
                'bg-ember hover:bg-ember-hover text-text-inverse font-sans font-semibold text-sm rounded-[10px] shadow-[0_4px_16px_rgba(217,123,58,0.3),0_0_20px_rgba(217,123,58,0.15)] hover:translate-y-[-2px] hover:shadow-[0_6px_24px_rgba(217,123,58,0.4),0_0_32px_rgba(217,123,58,0.2)] transition-all duration-200',
              footerActionLink:
                'text-ember hover:text-ember-hover font-sans text-sm font-medium transition-colors duration-200',
              footerActionText: 'font-sans text-sm text-text-muted',
              identityPreviewEditButton: 'text-ember hover:text-ember-hover',
              formFieldAction: 'text-ember hover:text-ember-hover font-sans text-xs',
              alert: 'bg-red-900/20 border border-red-900/30 text-red-400 rounded-[10px]',
              alertText: 'font-sans text-sm',
              otpCodeFieldInput:
                'bg-surface-body border border-border-subtle text-text-primary rounded-[6px]',
              formResendCodeLink: 'text-ember hover:text-ember-hover font-sans text-xs',
              userButtonPopoverCard: 'bg-surface-panel border border-border-subtle',
              badge: 'bg-ember/15 text-ember font-sans text-xs',
            },
            variables: {
              colorPrimary: '#D97B3A',
              colorBackground: '#1A1612',
              colorText: '#E8DFD4',
              colorTextSecondary: '#9B8B7E',
              colorInputBackground: '#0F0D0B',
              colorInputText: '#E8DFD4',
              borderRadius: '10px',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
              fontFamilyButtons:
                "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            },
          }}
        />
      </div>
    </>
  );
}
