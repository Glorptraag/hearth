import type { ComponentType } from 'react';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { Wordmark } from '@/components/ui/Wordmark';
import { NotePencil, Stack, ShieldCheck, Plant, Flame, MonitorPlay } from '@/components/icons';
import { getCopy } from '@/lib/copy/server';
import ProviderCodeInput from './provider-code-input';

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    const family = await getFamilyByClerkId(userId);
    if (!family) redirect('/welcome');
    if (!family.welcomeCompletedAt) redirect('/welcome');
    if (!family.onboardingComplete) redirect('/onboarding');
    redirect('/dashboard');
  }

  // All wording on this page is Sanity-swappable (Studio → Site Copy →
  // "Landing page"); the keys and fallbacks live in src/lib/copy/defaults.ts.
  const c = await getCopy('landing');

  return (
    <>
      {/* Nav */}
      <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-border-subtle px-lg py-md backdrop-blur-[12px]" style={{ background: 'var(--color-surface-nav-blur)' }}>
        <Link href="/" className="inline-flex items-center" aria-label="Hearth — home">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-sm">
          <Link
            href="/demo"
            className="rounded-[6px] px-md py-sm font-sans text-xs font-medium text-text-secondary transition-colors duration-[var(--motion-quick)] hover:text-text-primary"
          >
            {c['nav.tryDemo']}
          </Link>
          <Link
            href="/sign-in"
            className="rounded-[10px] border border-border-subtle px-md py-sm font-sans text-xs font-medium text-text-secondary transition-all duration-[var(--motion-quick)] hover:border-border-medium hover:text-text-primary"
          >
            {c['nav.signIn']}
          </Link>
          <Link
            href="/sign-up"
            className="rounded-[10px] bg-ember px-md py-sm font-sans text-xs font-semibold text-text-inverse transition-all duration-[var(--motion-quick)] hover:bg-ember-hover hover:-translate-y-px"
          >
            {c['nav.getStarted']}
          </Link>
        </div>
      </nav>

      <div className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-[960px] px-lg pb-4xl pt-[156px] text-center">
          <h1 className="mx-auto mb-lg max-w-[700px] font-serif text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-[1.2] text-text-primary">
            {c['hero.title']}
          </h1>
          <p className="mx-auto mb-2xl max-w-[560px] font-serif text-[clamp(1rem,2.5vw,1.25rem)] leading-relaxed text-text-secondary">
            {c['hero.body']}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-md">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-sm rounded-[10px] bg-ember px-xl py-md font-sans text-[0.95rem] font-semibold text-text-inverse shadow-ember transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:bg-ember-hover hover:-translate-y-[2px] hover:shadow-ember-strong"
            >
              {c['hero.cta']}
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-sm rounded-[10px] border border-border-subtle px-xl py-md font-sans text-sm font-medium text-text-secondary transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:border-border-medium hover:text-text-primary hover:-translate-y-px"
            >
              {c['hero.secondaryCta']}
            </a>
          </div>
        </section>

        {/* Social proof */}
        <div className="px-lg py-2xl text-center">
          <p className="font-sans text-xs uppercase tracking-[0.05em] text-text-muted">
            {c['proof.line']}
          </p>
        </div>

        <Divider />

        {/* Value pillars */}
        <section className="mx-auto max-w-[960px] px-lg py-4xl">
          <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
            <PillarCard Icon={NotePencil} title={c['pillars.capture.title']} body={c['pillars.capture.body']} />
            <PillarCard Icon={Stack} title={c['pillars.content.title']} body={c['pillars.content.body']} />
            <PillarCard Icon={ShieldCheck} title={c['pillars.compliance.title']} body={c['pillars.compliance.body']} />
          </div>
        </section>

        <Divider />

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-[960px] px-lg py-4xl">
          <h2 className="mb-sm text-center font-serif text-2xl font-semibold text-text-primary">
            {c['how.title']}
          </h2>
          <p className="mb-2xl text-center font-serif text-base text-text-secondary">
            {c['how.subtitle']}
          </p>
          <div className="grid grid-cols-1 gap-xl md:grid-cols-3 md:gap-2xl">
            <Step number={1} title={c['how.step1.title']} body={c['how.step1.body']} />
            <Step number={2} title={c['how.step2.title']} body={c['how.step2.body']} />
            <Step number={3} title={c['how.step3.title']} body={c['how.step3.body']} />
          </div>
        </section>

        <Divider />

        {/* Who is this for */}
        <section className="mx-auto max-w-[960px] px-lg py-4xl">
          <h2 className="mb-sm text-center font-serif text-2xl font-semibold text-text-primary">
            {c['audience.title']}
          </h2>
          <p className="mb-2xl text-center font-serif text-base text-text-secondary">
            {c['audience.subtitle']}
          </p>
          <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
            <div className="rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-card">
              <div className="mb-md inline-flex text-text-secondary" aria-hidden="true"><Plant size={32} /></div>
              <h3 className="mb-sm font-serif text-lg font-semibold text-text-primary">
                {c['audience.new.title']}
              </h3>
              <p className="font-serif text-[0.95rem] leading-relaxed text-text-secondary">
                {c['audience.new.body']}
              </p>
            </div>
            <div className="rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-card">
              <div className="mb-md inline-flex text-ember" aria-hidden="true"><Flame size={32} /></div>
              <h3 className="mb-sm font-serif text-lg font-semibold text-text-primary">
                {c['audience.experienced.title']}
              </h3>
              <p className="font-serif text-[0.95rem] leading-relaxed text-text-secondary">
                {c['audience.experienced.body']}
              </p>
            </div>
          </div>
        </section>

        <Divider />

        {/* Pricing */}
        <section className="mx-auto max-w-[960px] px-lg py-4xl text-center">
          <h2 className="mb-sm font-serif text-2xl font-semibold text-text-primary">
            {c['pricing.title']}
          </h2>
          <p className="mb-2xl font-serif text-base text-text-secondary">
            {c['pricing.subtitle']}
          </p>
          <div className="relative mx-auto max-w-[480px] overflow-hidden rounded-[24px] border border-border-medium bg-surface-panel p-2xl shadow-float">
            {/* Ember top-line */}
            <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--color-ember), transparent)' }} />

            <div className="mb-md font-serif text-lg font-semibold text-text-primary">
              {c['pricing.planName']}
            </div>
            <div className="leading-none">
              <span className="align-super font-sans text-base font-medium text-text-muted">$</span>
              <span className="font-serif text-[2.5rem] font-semibold text-text-primary">{c['pricing.amount']}</span>
              <span className="ml-xs font-sans text-sm text-text-muted">{c['pricing.amountSuffix']}</span>
            </div>
            <p className="my-lg font-serif text-[0.95rem] leading-[1.8] text-text-secondary">
              {c['pricing.includesLine1']}<br />
              {c['pricing.includesLine2']}
            </p>
            <Link
              href="/sign-up"
              className="inline-flex w-full items-center justify-center rounded-[10px] bg-ember px-xl py-md font-sans text-[0.95rem] font-semibold text-text-inverse shadow-ember transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:bg-ember-hover hover:-translate-y-[2px] hover:shadow-ember-strong"
            >
              {c['pricing.cta']}
            </Link>
            <ProviderCodeInput />
          </div>
        </section>

        <Divider />

        {/* Demo */}
        <section id="demo" className="mx-auto max-w-[960px] px-lg py-4xl text-center">
          <div className="mx-auto max-w-[560px] rounded-[16px] border border-border-subtle bg-surface-raised p-2xl">
            <div className="mb-md inline-flex text-text-secondary" aria-hidden="true"><MonitorPlay size={32} /></div>
            <h3 className="mb-sm font-serif text-lg font-semibold text-text-primary">
              {c['demo.title']}
            </h3>
            <p className="mb-lg font-serif text-[0.95rem] text-text-secondary">
              {c['demo.body']}
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-sm rounded-[10px] border border-border-subtle px-xl py-md font-sans text-sm font-medium text-text-secondary transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:border-border-medium hover:text-text-primary hover:-translate-y-px"
            >
              {c['demo.cta']}
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="mx-auto flex max-w-[960px] flex-col items-center gap-md border-t border-border-subtle px-lg py-2xl md:flex-row md:justify-between">
          <div className="flex items-center gap-md">
            <Wordmark
              iconHeight={22}
              textClassName="font-serif text-base font-semibold text-text-primary"
            />
            <span className="font-sans text-xs text-text-muted">
              {c['footer.tagline']}
            </span>
          </div>
          <div className="flex gap-lg">
            <Link href="/terms" className="font-sans text-xs text-text-muted transition-colors duration-[var(--motion-quick)] hover:text-text-secondary">{c['footer.terms']}</Link>
            <Link href="/privacy" className="font-sans text-xs text-text-muted transition-colors duration-[var(--motion-quick)] hover:text-text-secondary">{c['footer.privacy']}</Link>
            <a href="mailto:hello@hearthlearning.au" className="font-sans text-xs text-text-muted transition-colors duration-[var(--motion-quick)] hover:text-text-secondary">{c['footer.contact']}</a>
          </div>
          <div className="font-sans text-xs text-text-muted">{c['footer.copyright']}</div>
        </footer>
      </div>
    </>
  );
}

/* ── Sub-components ── */

function Divider() {
  return (
    <div className="mx-auto max-w-[960px] px-lg">
      <hr className="border-t border-border-subtle" />
    </div>
  );
}

function PillarCard({ Icon, title, body }: { Icon: ComponentType<{ size?: number }>; title: string; body: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-card transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:-translate-y-[2px] hover:border-border-medium hover:shadow-hover">
      <div className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-[var(--motion-gentle)] group-hover:opacity-100" style={{ background: 'linear-gradient(90deg, var(--color-ember), transparent)' }} />
      <div className="mb-md inline-flex text-text-secondary" aria-hidden="true"><Icon size={32} /></div>
      <h3 className="mb-sm font-serif text-lg font-semibold text-text-primary">{title}</h3>
      <p className="font-serif text-[0.95rem] leading-relaxed text-text-secondary">{body}</p>
    </div>
  );
}

function Step({ number, title, body }: { number: number; title: string; body: string }) {
  return (
    <div className="flex items-start gap-lg md:flex-col md:items-center md:text-center">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] font-serif text-[2rem] font-semibold text-ember" style={{ background: 'var(--color-ember-glow)' }}>
        {number}
      </div>
      <div className="flex-1">
        <h3 className="mb-xs font-serif text-lg font-semibold text-text-primary">{title}</h3>
        <p className="font-serif text-[0.95rem] text-text-secondary">{body}</p>
      </div>
    </div>
  );
}
