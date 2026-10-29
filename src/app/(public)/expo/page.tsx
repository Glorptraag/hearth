import type { ComponentType } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Wordmark } from '@/components/ui/Wordmark';
import { Camera, CheckCircle, FileText } from '@/components/icons';
import { expoCopy } from './expoCopy';

export const metadata: Metadata = {
  title: 'Hearth | Any curriculum. Or none.',
  description: expoCopy.intro,
};

const VERB_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  Snap: Camera,
  Confirm: CheckCircle,
  Report: FileText,
};

const ctaClass =
  'inline-flex items-center justify-center rounded-[10px] bg-ember px-xl py-md font-sans text-[0.95rem] font-semibold text-text-inverse shadow-ember transition duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:bg-ember-hover hover:-translate-y-[2px] hover:shadow-ember-strong';

export default function ExpoPage() {
  const { nav, banner, intro, verbs, points, pricing, footer } = expoCopy;

  return (
    <>
      <nav
        className="fixed inset-x-0 top-0 z-50 flex items-center justify-between border-b border-border-subtle px-lg py-md backdrop-blur-[12px]"
        style={{ background: 'var(--color-surface-nav-blur)' }}
      >
        <Link href="/" className="inline-flex items-center" aria-label="Hearth home">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-sm">
          <Link
            href="/sign-in"
            className="rounded-[10px] border border-border-subtle px-md py-sm font-sans text-xs font-medium text-text-secondary transition duration-[var(--motion-quick)] hover:border-border-medium hover:text-text-primary"
          >
            {nav.signIn}
          </Link>
          <Link
            href="/sign-up"
            className="rounded-[10px] bg-ember px-md py-sm font-sans text-xs font-semibold text-text-inverse transition duration-[var(--motion-quick)] hover:bg-ember-hover hover:-translate-y-px"
          >
            {nav.cta}
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="mx-auto max-w-[960px] px-lg pb-4xl pt-[120px] text-center md:pt-[156px]">
          <h1 className="mx-auto mb-lg max-w-[700px] font-serif text-[clamp(2rem,6vw,3.2rem)] font-semibold leading-[1.2] text-text-primary">
            {banner}
          </h1>
          <p className="mx-auto mb-2xl max-w-[560px] font-serif text-[clamp(1rem,2.5vw,1.25rem)] leading-relaxed text-text-secondary">
            {intro}
          </p>
          <Link href="/sign-up" className={ctaClass}>
            {pricing.cta}
          </Link>
        </section>

        <Divider />

        <section className="mx-auto max-w-[960px] px-lg py-4xl">
          <h2 className="mb-2xl text-center font-serif text-2xl font-semibold text-text-primary">
            {verbs.heading}
          </h2>
          <ol className="grid grid-cols-1 gap-lg md:grid-cols-3">
            {verbs.items.map(({ verb, body }) => {
              const Icon = VERB_ICONS[verb];
              return (
                <li
                  key={verb}
                  className="rounded-[16px] border border-border-subtle bg-surface-panel p-xl"
                >
                  <div className="mb-md inline-flex text-text-secondary" aria-hidden="true">
                    <Icon size={32} />
                  </div>
                  <h3 className="mb-sm font-serif text-lg font-semibold text-text-primary">
                    {verb}
                  </h3>
                  <p className="font-serif text-[0.95rem] leading-relaxed text-text-secondary">
                    {body}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>

        <Divider />

        <section className="mx-auto max-w-[960px] px-lg py-4xl">
          <h2 className="mb-2xl text-center font-serif text-2xl font-semibold text-text-primary">
            {points.heading}
          </h2>
          <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
            {points.items.map(({ title, body }) => (
              <div
                key={title}
                className="hearth-lift-card rounded-[16px] border border-border-subtle bg-surface-panel p-xl"
              >
                <h3 className="mb-sm font-serif text-lg font-semibold text-text-primary">
                  {title}
                </h3>
                <p className="font-serif text-[0.95rem] leading-relaxed text-text-secondary">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>

        <Divider />

        <section className="mx-auto max-w-[960px] px-lg py-4xl text-center">
          <h2 className="mb-2xl font-serif text-2xl font-semibold text-text-primary">
            {pricing.heading}
          </h2>
          <div className="relative mx-auto max-w-[480px] overflow-hidden rounded-[24px] border border-border-medium bg-surface-panel p-2xl shadow-float">
            <div
              className="absolute inset-x-0 top-0 h-[2px]"
              style={{ background: 'linear-gradient(90deg, transparent, var(--color-ember), transparent)' }}
            />
            <div className="mb-md font-serif text-lg font-semibold text-text-primary">
              {pricing.label}
            </div>
            <div className="leading-none">
              <span className="font-serif text-[2.5rem] font-semibold text-text-primary">
                {pricing.price}
              </span>
              <span className="ml-xs font-sans text-sm text-text-muted">{pricing.period}</span>
            </div>
            <p className="mt-md font-sans text-sm font-medium text-text-secondary">
              {pricing.trial}
            </p>
            <p className="my-lg font-serif text-[0.95rem] leading-[1.8] text-text-secondary">
              {pricing.note}
            </p>
            <Link href="/sign-up" className={`${ctaClass} w-full`}>
              {pricing.cta}
            </Link>
            <p className="mt-md font-sans text-xs text-text-muted">{pricing.fineprint}</p>
          </div>
        </section>

        <footer className="mx-auto flex max-w-[960px] flex-col items-center gap-md border-t border-border-subtle px-lg py-2xl md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-sm md:flex-row md:gap-md">
            <Wordmark
              iconHeight={22}
              textClassName="font-serif text-base font-semibold text-text-primary"
            />
            <span className="font-sans text-xs text-text-muted">{footer.built}</span>
          </div>
          <div className="flex gap-lg">
            <Link href="/terms" className="font-sans text-xs text-text-muted transition-colors duration-[var(--motion-quick)] hover:text-text-secondary">{footer.terms}</Link>
            <Link href="/privacy" className="font-sans text-xs text-text-muted transition-colors duration-[var(--motion-quick)] hover:text-text-secondary">{footer.privacy}</Link>
            <a href="mailto:hello@hearthlearning.au" className="font-sans text-xs text-text-muted transition-colors duration-[var(--motion-quick)] hover:text-text-secondary">{footer.contact}</a>
          </div>
          <div className="font-sans text-xs text-text-muted">{footer.copyright}</div>
        </footer>
      </main>
    </>
  );
}

function Divider() {
  return (
    <div className="mx-auto max-w-[960px] px-lg">
      <hr className="border-t border-border-subtle" />
    </div>
  );
}
