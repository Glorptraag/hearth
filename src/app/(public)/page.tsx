import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { Wordmark } from '@/components/ui/Wordmark';
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
            className="rounded-[6px] px-md py-sm font-sans text-xs font-medium text-text-secondary transition-colors duration-200 hover:text-text-primary"
          >
            Try Demo
          </Link>
          <Link
            href="/sign-in"
            className="rounded-[10px] border border-border-subtle px-md py-sm font-sans text-xs font-medium text-text-secondary transition-all duration-200 hover:border-border-medium hover:text-text-primary"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-[10px] bg-ember px-md py-sm font-sans text-xs font-semibold text-text-inverse transition-all duration-200 hover:bg-ember-hover hover:-translate-y-px"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <div className="relative z-10">
        {/* Hero */}
        <section className="mx-auto max-w-[960px] px-lg pb-4xl pt-[156px] text-center">
          <h1 className="mx-auto mb-lg max-w-[700px] font-serif text-[clamp(2rem,5vw,3.2rem)] font-semibold leading-[1.2] text-text-primary">
            You&apos;re doing more than you think. Now you can see it.
          </h1>
          <p className="mx-auto mb-2xl max-w-[560px] font-serif text-[clamp(1rem,2.5vw,1.25rem)] leading-relaxed text-text-secondary">
            Hearth gives homeschool families the tools that teachers train for years to use &mdash; so you can teach with confidence, track what matters, and handle compliance without the stress.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-md">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-sm rounded-[10px] bg-ember px-xl py-md font-sans text-[0.95rem] font-semibold text-text-inverse shadow-ember transition-all duration-200 ease-[var(--ease-default)] hover:bg-ember-hover hover:-translate-y-[2px] hover:shadow-ember-strong"
            >
              Get Started
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-sm rounded-[10px] border border-border-subtle px-xl py-md font-sans text-sm font-medium text-text-secondary transition-all duration-200 ease-[var(--ease-default)] hover:border-border-medium hover:text-text-primary hover:-translate-y-px"
            >
              See How It Works
            </a>
          </div>
        </section>

        {/* Social proof */}
        <div className="px-lg py-2xl text-center">
          <p className="font-sans text-xs uppercase tracking-[0.05em] text-text-muted">
            Built for Australian homeschool families · All Australian states supported
          </p>
        </div>

        <Divider />

        {/* Value pillars */}
        <section className="mx-auto max-w-[960px] px-lg py-4xl">
          <div className="grid grid-cols-1 gap-lg md:grid-cols-3">
            <PillarCard
              emoji="📝"
              title="Capture what's already happening"
              body="Log learning after it happens — describe your morning, and Hearth's AI maps the literacy, numeracy, and science evidence for you. Under two minutes."
            />
            <PillarCard
              emoji="📚"
              title="Content shaped by your approach"
              body="Structured packs designed by educators, filtered through your family's philosophy. Charlotte Mason, Classical, Montessori — same content, your lens."
            />
            <PillarCard
              emoji="📋"
              title="Compliance without the stress"
              body="Home education documentation that builds itself. Capability tracking, portfolio evidence, work sample curation. Export when you need it."
            />
          </div>
        </section>

        <Divider />

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-[960px] px-lg py-4xl">
          <h2 className="mb-sm text-center font-serif text-2xl font-semibold text-text-primary">
            Three steps. That&apos;s it.
          </h2>
          <p className="mb-2xl text-center font-serif text-base text-text-secondary">
            Every interaction takes under five minutes.
          </p>
          <div className="grid grid-cols-1 gap-xl md:grid-cols-3 md:gap-2xl">
            <Step number={1} title="Log" body="Describe what happened today. Hearth spots the learning and maps it to capability threads across eight domains." />
            <Step number={2} title="Grow" body="Watch your child's Capabilities Constellation come alive — a visual map of growth that reveals connections you didn't plan for." />
            <Step number={3} title="Report" body="Export portfolio documentation with one tap. Evidence, curriculum coverage, and work samples — sorted for your state's requirements." />
          </div>
        </section>

        <Divider />

        {/* Who is this for */}
        <section className="mx-auto max-w-[960px] px-lg py-4xl">
          <h2 className="mb-sm text-center font-serif text-2xl font-semibold text-text-primary">
            Wherever you are in your journey
          </h2>
          <p className="mb-2xl text-center font-serif text-base text-text-secondary">
            Hearth meets you where you are and grows with you.
          </p>
          <div className="grid grid-cols-1 gap-lg md:grid-cols-2">
            <div className="rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-card">
              <div className="mb-md text-2xl" aria-hidden="true">🌱</div>
              <h3 className="mb-sm font-serif text-lg font-semibold text-text-primary">
                New to homeschooling?
              </h3>
              <p className="font-serif text-[0.95rem] leading-relaxed text-text-secondary">
                You don&apos;t need a teaching degree. Hearth puts real pedagogical frameworks in your hands and walks you through them. Start by logging what you&apos;re already doing &mdash; you&apos;ll be surprised how much learning is already happening.
              </p>
            </div>
            <div className="rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-card">
              <div className="mb-md text-2xl" aria-hidden="true">🔥</div>
              <h3 className="mb-sm font-serif text-lg font-semibold text-text-primary">
                Already homeschooling?
              </h3>
              <p className="font-serif text-[0.95rem] leading-relaxed text-text-secondary">
                Bring your experience. Hearth adds the professional lens, the capability tracking, and the compliance documentation that turns your good work into legible evidence. Build your own modules or explore curated packs.
              </p>
            </div>
          </div>
        </section>

        <Divider />

        {/* Pricing */}
        <section className="mx-auto max-w-[960px] px-lg py-4xl text-center">
          <h2 className="mb-sm font-serif text-2xl font-semibold text-text-primary">
            Simple pricing. Everything included.
          </h2>
          <p className="mb-2xl font-serif text-base text-text-secondary">
            No feature tiers. No content gates. Full access from day one.
          </p>
          <div className="relative mx-auto max-w-[480px] overflow-hidden rounded-[24px] border border-border-medium bg-surface-panel p-2xl shadow-float">
            {/* Ember top-line */}
            <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, var(--color-ember), transparent)' }} />

            <div className="mb-md font-serif text-lg font-semibold text-text-primary">
              Hearth Membership
            </div>
            <div className="leading-none">
              <span className="align-super font-sans text-base font-medium text-text-muted">$</span>
              <span className="font-serif text-[2.5rem] font-semibold text-text-primary">8</span>
              <span className="ml-xs font-sans text-sm text-text-muted">/month AUD</span>
            </div>
            <p className="my-lg font-serif text-[0.95rem] leading-[1.8] text-text-secondary">
              All content packs · All features · All compliance tools<br />
              Unlimited learners · AI-powered insights · Learning report export
            </p>
            <Link
              href="/sign-up"
              className="inline-flex w-full items-center justify-center rounded-[10px] bg-ember px-xl py-md font-sans text-[0.95rem] font-semibold text-text-inverse shadow-ember transition-all duration-200 ease-[var(--ease-default)] hover:bg-ember-hover hover:-translate-y-[2px] hover:shadow-ember-strong"
            >
              Get Started
            </Link>
            <ProviderCodeInput />
          </div>
        </section>

        <Divider />

        {/* Demo */}
        <section id="demo" className="mx-auto max-w-[960px] px-lg py-4xl text-center">
          <div className="mx-auto max-w-[560px] rounded-[16px] border border-border-subtle bg-surface-raised p-2xl">
            <div className="mb-md text-[2rem]" aria-hidden="true">🏠</div>
            <h3 className="mb-sm font-serif text-lg font-semibold text-text-primary">
              Want to explore first?
            </h3>
            <p className="mb-lg font-serif text-[0.95rem] text-text-secondary">
              Take a self-guided tour through Hearth with sample data. See the Logger, the Constellation, the compliance tools &mdash; no sign-up required.
            </p>
            <Link
              href="/demo"
              className="inline-flex items-center gap-sm rounded-[10px] border border-border-subtle px-xl py-md font-sans text-sm font-medium text-text-secondary transition-all duration-200 ease-[var(--ease-default)] hover:border-border-medium hover:text-text-primary hover:-translate-y-px"
            >
              Try the Interactive Demo
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
              Built in Australia · Hosted in Australia
            </span>
          </div>
          <div className="flex gap-lg">
            <Link href="/terms" className="font-sans text-xs text-text-muted transition-colors duration-200 hover:text-text-secondary">Terms</Link>
            <Link href="/privacy" className="font-sans text-xs text-text-muted transition-colors duration-200 hover:text-text-secondary">Privacy</Link>
            <a href="mailto:hello@hearthlearning.au" className="font-sans text-xs text-text-muted transition-colors duration-200 hover:text-text-secondary">Contact</a>
          </div>
          <div className="font-sans text-xs text-text-muted">© 2026 Hearth Learning Pty Ltd</div>
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

function PillarCard({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <div className="group relative overflow-hidden rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-card transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:-translate-y-[2px] hover:border-border-medium hover:shadow-hover">
      <div className="absolute inset-x-0 top-0 h-[2px] opacity-0 transition-opacity duration-[var(--motion-gentle)] group-hover:opacity-100" style={{ background: 'linear-gradient(90deg, var(--color-ember), transparent)' }} />
      <div className="mb-md text-[2rem]">{emoji}</div>
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
