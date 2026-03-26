'use client';

import { useState } from 'react';
import Link from 'next/link';
import { differenceInYears } from 'date-fns';

type Learner = {
  id: string;
  name: string;
  dateOfBirth: string;
  shapeIcon: string;
  colourToken: string;
  learningSince: string;
  termSummary: string | null;
  portfolioTotal: number;
  portfolioThisTerm: number;
  heuSamplesReady: number;
  heuWeeksUntilDeadline: number;
  capabilityThreadsActive: number;
  capabilityNearMilestone: number;
  evidenceThumbs: string[];
};

const MOCK_LEARNERS: Learner[] = [
  {
    id: 'emma',
    name: 'Emma',
    dateOfBirth: '2016-06-15',
    shapeIcon: '⭐',
    colourToken: 'rose',
    learningSince: 'March 2025',
    termSummary:
      'Emma has demonstrated strong growth in Scientific Thinking and Mathematical Reasoning this term, with emerging confidence in Creative Expression. Her collaborative work with Liam shows developing leadership in peer teaching.',
    portfolioTotal: 47,
    portfolioThisTerm: 12,
    heuSamplesReady: 3,
    heuWeeksUntilDeadline: 8,
    capabilityThreadsActive: 14,
    capabilityNearMilestone: 2,
    evidenceThumbs: ['📷', '📷', '📄', '📷', '🎨', '📷'],
  },
  {
    id: 'liam',
    name: 'Liam',
    dateOfBirth: '2019-02-20',
    shapeIcon: '🔵',
    colourToken: 'blue',
    learningSince: 'January 2026',
    termSummary:
      'Liam is building a strong foundation in Number Sense and Physical Exploration this term. His curiosity and energy continue to drive meaningful learning moments.',
    portfolioTotal: 18,
    portfolioThisTerm: 4,
    heuSamplesReady: 1,
    heuWeeksUntilDeadline: 8,
    capabilityThreadsActive: 8,
    capabilityNearMilestone: 0,
    evidenceThumbs: ['📷', '📄', '🎨'],
  },
];

const HEU_ENABLED = true;

type ChildColorConfig = {
  text: string;
  activeBorder: string;
  avatarBg: string;
  avatarBorder: string;
};

const CHILD_COLORS: Record<string, ChildColorConfig> = {
  rose: {
    text: 'text-child-rose',
    activeBorder: 'border-[rgba(249,168,212,0.4)]',
    avatarBg: 'linear-gradient(135deg, rgba(249,168,212,0.15), rgba(249,168,212,0.08))',
    avatarBorder: 'rgba(249,168,212,0.3)',
  },
  blue: {
    text: 'text-child-blue',
    activeBorder: 'border-[rgba(96,165,250,0.4)]',
    avatarBg: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(96,165,250,0.08))',
    avatarBorder: 'rgba(96,165,250,0.3)',
  },
  sage: {
    text: 'text-child-sage',
    activeBorder: 'border-[rgba(74,222,128,0.4)]',
    avatarBg: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(74,222,128,0.08))',
    avatarBorder: 'rgba(74,222,128,0.3)',
  },
  amber: {
    text: 'text-amber-400',
    activeBorder: 'border-[rgba(251,191,36,0.4)]',
    avatarBg: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.08))',
    avatarBorder: 'rgba(251,191,36,0.3)',
  },
};

export default function OurStoryHubClient() {
  const [selectedId, setSelectedId] = useState(MOCK_LEARNERS[0].id);

  const learner = MOCK_LEARNERS.find((l) => l.id === selectedId)!;
  const colors = CHILD_COLORS[learner.colourToken] ?? CHILD_COLORS.rose;
  const age = differenceInYears(new Date(), new Date(learner.dateOfBirth));
  const showSelector = MOCK_LEARNERS.length > 1;

  return (
    <div className="mx-auto max-w-2xl px-md py-xl">
      {/* Child selector — grid, only shown when 2+ children */}
      {showSelector && (
        <div className="mb-xl grid grid-cols-2 gap-sm">
          {MOCK_LEARNERS.map((l) => {
            const c = CHILD_COLORS[l.colourToken] ?? CHILD_COLORS.rose;
            const active = l.id === selectedId;
            const lAge = differenceInYears(new Date(), new Date(l.dateOfBirth));
            return (
              <button
                key={l.id}
                onClick={() => setSelectedId(l.id)}
                className={`flex items-center gap-sm rounded-[10px] border p-md text-left transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  active
                    ? `bg-surface-raised shadow-[0_2px_8px_rgba(0,0,0,0.3)] ${c.activeBorder}`
                    : 'border-border-subtle bg-surface-panel hover:border-border-medium hover:bg-surface-raised'
                }`}
              >
                <span
                  className={`flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full text-lg ${c.text}`}
                  style={{ background: c.avatarBg, border: `2px solid ${c.avatarBorder}` }}
                >
                  {l.shapeIcon}
                </span>
                <div>
                  <p className={`font-serif text-base font-semibold ${active ? c.text : 'text-text-primary'}`}>
                    {l.name}
                  </p>
                  <p className="font-sans text-xs text-text-muted">{lAge} yrs old</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Child header */}
      <header className="mb-xl text-center">
        <div
          className="mx-auto mb-lg flex h-[96px] w-[96px] items-center justify-center rounded-full text-[2.5rem]"
          style={{
            background: colors.avatarBg,
            border: `2px solid ${colors.avatarBorder}`,
          }}
        >
          {learner.shapeIcon}
        </div>
        <h1 className="mb-xs font-serif text-2xl font-semibold text-text-primary">
          {learner.name}&rsquo;s Story
        </h1>
        <p className="font-sans text-sm text-text-secondary">
          Age {age} · Learning since {learner.learningSince}
        </p>
      </header>

      {/* Term summary */}
      <section className="relative mb-xl overflow-hidden rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,var(--ember),transparent)] opacity-60" />
        <p className="mb-md font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
          Term Summary
        </p>
        {learner.termSummary ? (
          <p className="font-serif text-sm italic leading-relaxed text-text-secondary">
            &ldquo;{learner.termSummary}&rdquo;
          </p>
        ) : (
          <p className="font-serif text-sm italic leading-relaxed text-text-muted">
            {learner.name}&rsquo;s learning story is just beginning. As more moments are logged,
            patterns and growth will become visible here.
          </p>
        )}
      </section>

      {/* Nav cards */}
      <div className="mb-xl grid grid-cols-2 gap-md">
        <NavCard
          href="/our-story/portfolio"
          icon="📁"
          title="Portfolio"
          stat1={`${learner.portfolioTotal} entries`}
          stat2={`${learner.portfolioThisTerm} this term`}
        />

        {HEU_ENABLED && (
          <NavCard
            href="/our-story/report"
            icon="📋"
            title="HEU Report"
            stat1={`${learner.heuSamplesReady} of 6 samples ready`}
            stat1Highlight
            stat2={`${learner.heuWeeksUntilDeadline} weeks until deadline`}
          />
        )}

        <NavCard
          href="/our-story/capabilities"
          icon="✦"
          title="Capabilities"
          stat1={`${learner.capabilityThreadsActive} threads active`}
          stat2={
            learner.capabilityNearMilestone > 0
              ? `${learner.capabilityNearMilestone} near milestone`
              : undefined
          }
          stat2Highlight={learner.capabilityNearMilestone > 0}
        />

        <NavCard
          href={`/our-story/learner/${learner.id}`}
          icon="👤"
          title="Learner Profile"
          stat1={`Who ${learner.name} is`}
        />
      </div>

      {/* Recent evidence strip */}
      <section>
        <div className="mb-md flex items-center justify-between">
          <h2 className="font-serif text-base font-semibold text-text-primary">Recent Evidence</h2>
          <Link
            href="/our-story/portfolio"
            className="font-sans text-xs font-medium text-ember transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:text-ember-hover"
          >
            See all →
          </Link>
        </div>
        {learner.evidenceThumbs.length === 0 ? (
          <p className="font-serif text-sm italic text-text-muted">
            No evidence captured yet. Photos and artifacts appear here as you log.
          </p>
        ) : (
          <div className="flex gap-md overflow-x-auto pb-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {learner.evidenceThumbs.map((emoji, i) => (
              <div
                key={i}
                className="flex h-[90px] w-[120px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-border-subtle bg-surface-raised text-2xl text-text-muted transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:border-border-medium"
              >
                {emoji}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function NavCard({
  href,
  icon,
  title,
  stat1,
  stat1Highlight = false,
  stat2,
  stat2Highlight = false,
}: {
  href: string;
  icon: string;
  title: string;
  stat1: string;
  stat1Highlight?: boolean;
  stat2?: string;
  stat2Highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[2px] hover:border-border-medium hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_60px_rgba(217,123,58,0.08)]"
    >
      <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,var(--ember),transparent)] opacity-0 transition-opacity duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:opacity-100" />
      <div className="mb-md text-[2rem] opacity-90">{icon}</div>
      <h2 className="mb-sm font-serif text-[1.05rem] font-semibold text-text-primary">{title}</h2>
      <p className={`font-sans text-sm ${stat1Highlight ? 'text-sage' : 'text-text-secondary'}`}>
        {stat1}
      </p>
      {stat2 && (
        <p className={`font-sans text-sm ${stat2Highlight ? 'text-sage' : 'text-text-secondary'}`}>
          {stat2}
        </p>
      )}
      <span className="mt-md flex items-center gap-xs font-sans text-xs font-medium text-ember">
        View →
      </span>
    </Link>
  );
}
