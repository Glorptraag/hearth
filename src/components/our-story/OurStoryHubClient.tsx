'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { differenceInYears, format, startOfMonth } from 'date-fns';
import { getJurisdiction } from '@/config/jurisdictions';

// ─── Types ───────────────────────────────────────────────────────────────────

type Learner = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  shapeIcon: string | null;
  colourToken: string | null;
  createdAt: string | null;
};

type Entry = {
  id: string;
  dateOccurred: string;
  evidenceUrls: string[] | null;
};

type Thread = {
  thread_id: string;
  observation_count: number;
  suggested_tier: string;
};

type LearnerStats = {
  portfolioTotal: number;
  portfolioThisTerm: number;
  capabilityThreadsActive: number;
  capabilityNearMilestone: number;
  recentEvidence: string[];
};

// ─── Colour config ────────────────────────────────────────────────────────────

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

const DEFAULT_COLORS = CHILD_COLORS.rose;

// ─── Component ────────────────────────────────────────────────────────────────

export default function OurStoryHubClient() {
  const pathname = usePathname();
  const router = useRouter();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [stats, setStats] = useState<LearnerStats | null>(null);
  const [statsLearnerId, setStatsLearnerId] = useState<string>('');
  const [loadingLearners, setLoadingLearners] = useState(true);
  const [familyState, setFamilyState] = useState<string | null>(null);

  const handleChildSelect = (id: string) => {
    setSelectedId(id);
    router.replace(`${pathname}?child=${id}`, { scroll: false });
  };

  // Fetch family settings once (for jurisdiction config)
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data?.state) setFamilyState(data.state);
      })
      .catch(() => {});
  }, []);

  // Fetch learner list once
  useEffect(() => {
    fetch('/api/learners')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLearners(data);
          setSelectedId(data[0].id);
        }
        setLoadingLearners(false);
      })
      .catch(() => setLoadingLearners(false));
  }, []);

  // Fetch per-learner stats when selection changes
  useEffect(() => {
    if (!selectedId) return;
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');

    Promise.all([
      fetch(`/api/entries?learnerId=${selectedId}`).then((r) => r.json()),
      fetch(`/api/capabilities/${selectedId}`).then((r) => r.json()),
    ])
      .then(([entries, threads]) => {
        const entryList: Entry[] = Array.isArray(entries) ? entries : [];
        const threadList: Thread[] = Array.isArray(threads) ? threads : [];

        const portfolioTotal = entryList.length;
        const portfolioThisTerm = entryList.filter(
          (e) => e.dateOccurred >= monthStart
        ).length;
        const capabilityThreadsActive = threadList.length;
        const capabilityNearMilestone = threadList.filter(
          (t) => t.suggested_tier === 'developing'
        ).length;
        const recentEvidence = entryList
          .flatMap((e) => e.evidenceUrls ?? [])
          .slice(0, 6);

        setStats({
          portfolioTotal,
          portfolioThisTerm,
          capabilityThreadsActive,
          capabilityNearMilestone,
          recentEvidence,
        });
        setStatsLearnerId(selectedId);
      })
      .catch(() => {
        setStats(null);
        setStatsLearnerId(selectedId);
      });
  }, [selectedId]);

  if (loadingLearners) {
    return (
      <div className="flex items-center justify-center py-4xl">
        <p className="font-sans text-sm text-text-muted">Loading...</p>
      </div>
    );
  }

  if (learners.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-md py-xl text-center">
        <span className="text-4xl block mb-md" aria-hidden="true">📖</span>
        <h2 className="font-serif text-xl font-semibold text-text-primary mb-sm">
          Your story starts here
        </h2>
        <p className="font-sans text-sm text-text-secondary">
          Add learners in Settings to begin building your family&apos;s learning story.
        </p>
      </div>
    );
  }

  const learner = learners.find((l) => l.id === selectedId) ?? learners[0];
  const colors = CHILD_COLORS[learner.colourToken ?? ''] ?? DEFAULT_COLORS;
  const age = learner.dateOfBirth
    ? differenceInYears(new Date(), new Date(learner.dateOfBirth))
    : null;
  const learningSince = learner.createdAt
    ? format(new Date(learner.createdAt), 'MMMM yyyy')
    : null;
  const showSelector = learners.length > 1;

  return (
    <div className="mx-auto max-w-[900px] px-md py-xl lg:px-2xl lg:py-2xl">
      {/* Child selector — grid, only shown when 2+ children */}
      {showSelector && (
        <div className="mb-xl grid grid-cols-2 gap-sm">
          {learners.map((l) => {
            const c = CHILD_COLORS[l.colourToken ?? ''] ?? DEFAULT_COLORS;
            const active = l.id === selectedId;
            const lAge = l.dateOfBirth
              ? differenceInYears(new Date(), new Date(l.dateOfBirth))
              : null;
            return (
              <button
                key={l.id}
                onClick={() => handleChildSelect(l.id)}
                className={`flex items-center gap-sm rounded-[10px] border p-md text-left transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  active
                    ? `bg-surface-raised shadow-soft ${c.activeBorder}`
                    : 'border-border-subtle bg-surface-panel hover:border-border-medium hover:bg-surface-raised'
                }`}
              >
                <span
                  className={`flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full text-lg ${c.text}`}
                  style={{ background: c.avatarBg, border: `2px solid ${c.avatarBorder}` }}
                >
                  {l.shapeIcon ?? '🌟'}
                </span>
                <div>
                  <p className={`font-serif text-base font-semibold ${active ? c.text : 'text-text-primary'}`}>
                    {l.name}
                  </p>
                  {lAge !== null && (
                    <p className="font-sans text-xs text-text-muted">{lAge} yrs old</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Child header */}
      <header className="mb-2xl text-center">
        <div
          className="mx-auto mb-lg flex h-[96px] w-[96px] items-center justify-center rounded-full text-[2.5rem]"
          style={{
            background: colors.avatarBg,
            border: `2px solid ${colors.avatarBorder}`,
          }}
        >
          {learner.shapeIcon ?? '🌟'}
        </div>
        <h1 className="mb-xs font-serif text-2xl font-semibold text-text-primary">
          {learner.name}&rsquo;s Story
        </h1>
        <p className="font-sans text-sm text-text-secondary">
          {age !== null ? `Age ${age}` : null}
          {age !== null && learningSince ? ' · ' : null}
          {learningSince ? `Learning since ${learningSince}` : null}
        </p>
      </header>

      {/* Term summary — empty state for new learners */}
      <section className="relative mb-2xl overflow-hidden rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,transparent,var(--color-ember),transparent)] opacity-60" />
        <h2 className="mb-md font-serif text-base font-semibold text-text-primary">
          {learner.name}&rsquo;s Learning Story
        </h2>
        <p className="mb-md font-serif text-xs italic text-text-muted">
          A record of what {learner.name} has been learning and how they&rsquo;ve grown.
        </p>
        {stats && stats.portfolioTotal > 0 ? (
          <p className="font-serif text-sm italic leading-relaxed text-text-secondary">
            Evidence of learning: {stats.portfolioTotal} learning moment{stats.portfolioTotal !== 1 ? 's' : ''} recorded
            {stats.portfolioThisTerm > 0
              ? `, with ${stats.portfolioThisTerm} this month`
              : ''}
            {stats.capabilityThreadsActive > 0
              ? `. ${stats.capabilityThreadsActive} capability thread${stats.capabilityThreadsActive !== 1 ? 's' : ''} active.`
              : '.'}
          </p>
        ) : (
          <p className="font-serif text-sm italic leading-relaxed text-text-muted">
            {learner.name}&rsquo;s learning story is just beginning. As more moments are
            logged, patterns and growth will become visible here.
          </p>
        )}
        {stats && stats.portfolioTotal === 0 && stats.capabilityThreadsActive === 0 && (
          <div className="mt-lg flex flex-col items-center gap-sm rounded-[16px] border border-border-subtle bg-surface-panel px-lg py-lg text-center shadow-soft">
            <span className="text-3xl" aria-hidden="true">✨</span>
            <p className="font-serif text-sm text-text-secondary leading-relaxed">
              Log your first learning moment and watch {learner.name}&rsquo;s story come to life.
            </p>
            <a
              href="/log"
              className="rounded-[6px] bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-ember-hover"
            >
              Log a moment
            </a>
          </div>
        )}
      </section>

      {/* Nav cards */}
      <div className="mb-2xl grid grid-cols-2 gap-lg">
        <NavCard
          href="/our-story/portfolio"
          icon="📁"
          title="Portfolio"
          stat1={statsLearnerId !== selectedId ? '—' : `${stats?.portfolioTotal ?? 0} entries`}
          stat2={
            statsLearnerId === selectedId && stats && stats.portfolioThisTerm > 0
              ? `${stats.portfolioThisTerm} this month`
              : undefined
          }
        />

        <NavCard
          href="/our-story/report"
          icon="📋"
          title={getJurisdiction(familyState).reportScreenTitle}
          stat1={getJurisdiction(familyState).reportTier === 'cd_level' ? 'Compliance view' : 'Learning summary'}
        />

        <NavCard
          href="/our-story/capabilities"
          icon="✦"
          title="Capabilities"
          stat1={statsLearnerId !== selectedId ? '—' : `${stats?.capabilityThreadsActive ?? 0} threads active`}
          stat2={
            statsLearnerId === selectedId && stats && stats.capabilityNearMilestone > 0
              ? `${stats.capabilityNearMilestone} near milestone`
              : undefined
          }
          stat2Highlight={
            statsLearnerId === selectedId && (stats?.capabilityNearMilestone ?? 0) > 0
          }
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
        {statsLearnerId === selectedId && (!stats || stats.recentEvidence.length === 0) ? (
          <p className="font-serif text-sm italic text-text-muted">
            No evidence captured yet. Photos and artifacts appear here as you log.
          </p>
        ) : statsLearnerId !== selectedId ? null : (
          <div className="flex gap-md overflow-x-auto pb-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {stats!.recentEvidence.map((url, i) => (
              <div
                key={i}
                className="flex h-[90px] w-[120px] shrink-0 overflow-hidden rounded-[10px] border border-border-subtle bg-surface-raised transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:border-border-medium"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── NavCard ─────────────────────────────────────────────────────────────────

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
      className="group relative overflow-hidden rounded-[16px] border border-border-subtle bg-surface-panel p-xl shadow-soft transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[2px] hover:border-border-medium hover:shadow-warm"
    >
      <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,var(--color-ember),transparent)] opacity-0 transition-opacity duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:opacity-100" />
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
