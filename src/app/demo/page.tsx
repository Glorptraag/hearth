'use client';

import Link from 'next/link';
import type { ComponentType } from 'react';
import {
  HearthBrandMark,
  House,
  PencilSimpleLine,
  BookOpenText,
  Compass,
  CalendarBlank,
  FileText,
} from '@/components/icons';

type NavCardIcon = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

type NavCard = { href: string; Icon: NavCardIcon; title: string; desc: string };

const NAV_CARDS: ReadonlyArray<NavCard> = [
  { href: '/demo/dashboard', Icon: House, title: 'Dashboard', desc: 'Your family hub' },
  { href: '/demo/log', Icon: PencilSimpleLine, title: 'Logger', desc: 'Capture learning moments' },
  { href: '/demo/our-story', Icon: BookOpenText, title: 'Our Story', desc: 'Portfolios & growth' },
  { href: '/demo/explore/activities', Icon: Compass, title: 'Explore', desc: 'Discover modules' },
  { href: '/demo/planner', Icon: CalendarBlank, title: 'Planner', desc: 'Plan your week' },
  { href: '/demo/our-story/report', Icon: FileText, title: 'Learning Report', desc: 'Compliance at a glance' },
];

export default function DemoLanding() {
  return (
    <div className="mx-auto max-w-2xl px-md py-3xl">
      {/* Welcome */}
      <div className="mb-3xl text-center">
        <div className="mb-lg flex justify-center">
          <div className="flex h-[64px] w-[64px] items-center justify-center rounded-lg bg-ember text-text-inverse shadow-ember-strong">
            <HearthBrandMark size={32} weight="fill" />
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
          className="inline-flex items-center gap-sm rounded-md bg-ember px-xl py-md font-sans text-base font-semibold text-text-inverse shadow-ember transition-all duration-[var(--motion-quick)] ease-[var(--ease-default)] hover:bg-ember-hover hover:shadow-ember-strong hover:translate-y-[-2px]"
        >
          Start exploring
        </Link>
      </div>

      {/* Quick nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
        {NAV_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex flex-col items-center gap-sm rounded-lg bg-surface-panel p-lg border border-border-subtle shadow-card transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:translate-y-[-2px] hover:border-border-medium hover:shadow-hover"
          >
            <span className="flex h-[40px] w-[40px] items-center justify-center rounded-md bg-surface-raised text-ember">
              <card.Icon size={22} weight="regular" />
            </span>
            <span className="font-serif text-sm font-semibold text-text-primary">{card.title}</span>
            <span className="font-sans text-xs text-text-muted text-center">{card.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
