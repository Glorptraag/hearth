'use client';

import Link from 'next/link';

export default function DemoLanding() {
  return (
    <div className="mx-auto max-w-2xl px-md py-3xl">
      {/* Welcome */}
      <div className="mb-3xl text-center">
        <div className="mb-lg flex justify-center">
          <div className="flex h-[64px] w-[64px] items-center justify-center rounded-lg bg-ember shadow-ember-strong">
            <span className="text-3xl" aria-hidden="true">🔥</span>
          </div>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-text-primary tracking-[-0.02em] mb-md">
          Welcome to Hearth
        </h1>
        <p className="font-serif text-lg text-text-secondary leading-relaxed">
          See how the Douglas family captures, connects, and celebrates their learning journey — all in under five minutes a day.
        </p>
      </div>

      {/* Start CTA */}
      <div className="mb-3xl flex justify-center">
        <Link
          href="/demo/dashboard"
          className="inline-flex items-center gap-sm rounded-md bg-ember px-xl py-md font-sans text-base font-semibold text-text-inverse shadow-ember transition duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:bg-ember-hover hover:shadow-ember-strong hover:translate-y-[-2px]"
        >
          Start exploring
        </Link>
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        {[
          { href: '/demo/dashboard', emoji: '🏠', title: 'Dashboard', desc: 'Your family hub' },
          { href: '/demo/log', emoji: '✏️', title: 'Logger', desc: 'Capture learning moments' },
          { href: '/demo/our-story', emoji: '📖', title: 'Our Story', desc: 'Portfolios & growth' },
          { href: '/demo/explore/activities', emoji: '🔍', title: 'Explore', desc: 'Discover modules' },
          { href: '/demo/planner', emoji: '📅', title: 'Planner', desc: 'Plan your week' },
          { href: '/demo/our-story/report', emoji: '📄', title: 'Learning Report', desc: 'Compliance at a glance' },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex flex-col items-center gap-sm rounded-lg bg-surface-panel p-lg border border-border-subtle shadow-card transition duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:translate-y-[-2px] hover:border-border-medium hover:shadow-hover"
          >
            <span className="text-2xl">{card.emoji}</span>
            <span className="font-serif text-sm font-semibold text-text-primary">{card.title}</span>
            <span className="font-sans text-xs text-text-muted text-center">{card.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
