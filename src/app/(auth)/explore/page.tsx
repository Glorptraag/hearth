'use client';

/**
 * /explore — snapshot-driven insight surface (Phase 5.2).
 *
 * Five cards:
 *   1. What's emerging   — /api/snapshot/momentum
 *   2. What's working    — engagement-positive entries (last 14d)
 *   3. Worth doing next  — /api/snapshot/next (pedagogy-aware)
 *   4. Quiet corners     — /api/snapshot/freshness
 *   5. Zero state opener — /api/snapshot/zero-state (only when total_entries === 0)
 *
 * Every heading + reason text passes through getPedagogyVocabulary so a
 * Charlotte Mason family and a Montessori family see materially different
 * copy on the same underlying data. Per Q10, pedagogy is a translation
 * lens, never a filter.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePedagogy } from '@/hooks/use-pedagogy';
import { getPedagogyVocabulary } from '@/lib/pedagogy/adapter';
import {
  Sparkle,
  Play,
  Compass,
  Books,
  CalendarBlank,
  Lightbulb,
} from '@/components/icons';
import type { SnapshotData } from '@/types/snapshot';
import type { MomentumResponse } from '@/app/api/snapshot/momentum/route';
import type { FreshnessResponse } from '@/app/api/snapshot/freshness/route';
import type { NextResponseBody as NextRecsResponse } from '@/app/api/snapshot/next/route';
import type { ZeroStateResponse } from '@/app/api/snapshot/zero-state/route';

interface RecentEntry {
  id: string;
  title: string;
  dateOccurred: string;
  engagementPerLearner?: Record<string, number>;
  sourceModuleId?: string | null;
}

export default function ExplorePage() {
  const { pedagogy, loading: pedagogyLoading } = usePedagogy();
  const [snapshot, setSnapshot] = useState<SnapshotData | null>(null);
  const [momentum, setMomentum] = useState<MomentumResponse | null>(null);
  const [working, setWorking] = useState<RecentEntry[] | null>(null);
  const [recommendations, setRecommendations] = useState<NextRecsResponse | null>(null);
  const [freshness, setFreshness] = useState<FreshnessResponse | null>(null);
  const [zeroState, setZeroState] = useState<ZeroStateResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        // Fetch base snapshot first so we know whether to load zero-state vs the
        // four standard cards.
        const snapRes = await fetch('/api/snapshot');
        const snapJson = snapRes.ok ? await snapRes.json() : null;
        const data = snapJson?.snapshotData as SnapshotData | undefined;
        if (cancelled) return;
        setSnapshot(data ?? null);

        const totalEntries = data?.family?.total_entries ?? 0;

        if (totalEntries === 0) {
          // Zero-state path — single hero card.
          const zsRes = await fetch('/api/snapshot/zero-state?limit=5');
          const zsJson = zsRes.ok ? await zsRes.json() : null;
          if (!cancelled) setZeroState(zsJson);
        } else {
          // Standard path — load all four insight cards in parallel.
          const [momRes, workRes, nextRes, freshRes] = await Promise.all([
            fetch('/api/snapshot/momentum').then((r) => (r.ok ? r.json() : null)),
            fetch('/api/entries?limit=30').then((r) => (r.ok ? r.json() : [])),
            fetch('/api/snapshot/next?limit=3').then((r) => (r.ok ? r.json() : null)),
            fetch('/api/snapshot/freshness?staleDays=21').then((r) => (r.ok ? r.json() : null)),
          ]);
          if (cancelled) return;
          setMomentum(momRes);
          setRecommendations(nextRes);
          setFreshness(freshRes);

          // Filter entries to engagement-positive (loved=4 or engaged=3) in
          // the last 14 days, dedupe by sourceModuleId where present.
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - 14);
          const cutoffIso = cutoff.toISOString().slice(0, 10);
          const engagementPositive = (workRes as RecentEntry[]).filter((e) => {
            if (e.dateOccurred < cutoffIso) return false;
            const eng = e.engagementPerLearner ?? {};
            return Object.values(eng).some((v) => v >= 3);
          });
          const dedup: RecentEntry[] = [];
          const seen = new Set<string>();
          for (const e of engagementPositive) {
            const key = e.sourceModuleId ?? e.id;
            if (seen.has(key)) continue;
            seen.add(key);
            dedup.push(e);
            if (dedup.length >= 4) break;
          }
          setWorking(dedup);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const vocab = getPedagogyVocabulary(pedagogy);

  const isZeroState = (snapshot?.family?.total_entries ?? 0) === 0;

  if (loading || pedagogyLoading) {
    return (
      <div className="min-h-screen bg-surface-body">
        <div className="max-w-[960px] mx-auto px-md py-xl lg:px-lg">
          <p className="font-sans text-sm text-text-muted animate-pulse">Reading the room…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-body">
      <div className="max-w-[960px] mx-auto px-md py-xl lg:px-lg space-y-xl">
        <header>
          <h1 className="font-serif text-2xl font-semibold text-text-primary leading-tight mb-xs">
            Explore
          </h1>
          <p className="font-serif text-sm text-text-secondary italic">
            What&rsquo;s emerging, what&rsquo;s working, and what&rsquo;s worth doing next.
          </p>
        </header>

        {isZeroState ? (
          <ZeroStateCard data={zeroState} pedagogy={pedagogy} sessionNoun={vocab.sessionNoun} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
            <EmergingCard
              data={momentum}
              sessionNoun={vocab.sessionNoun}
            />
            <WorkingCard
              entries={working}
              celebrationFrame={vocab.celebrationFrame}
            />
            <NextCard
              data={recommendations}
              pedagogy={pedagogy}
              activityVerb={vocab.activityVerb}
            />
            <QuietCornersCard
              data={freshness}
              growthNoun={vocab.growthNoun}
            />
          </div>
        )}

        <p className="font-sans text-xs text-text-muted text-center pt-lg">
          Insights rebuild every time you log. Quiet days are fine — the picture
          adjusts.
        </p>
      </div>
    </div>
  );
}

// ─── Cards ──────────────────────────────────────────────────────────────────

function InsightCard({
  Icon,
  eyebrow,
  title,
  empty,
  children,
}: {
  Icon: typeof Sparkle;
  eyebrow: string;
  title: string;
  empty?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-surface-panel rounded-lg border border-border-subtle p-lg shadow-card">
      <div className="flex items-center gap-sm mb-md">
        <span className="inline-flex text-ember" aria-hidden="true">
          <Icon size={18} />
        </span>
        <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-widest text-ember">
          {eyebrow}
        </p>
      </div>
      <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">
        {title}
      </h2>
      {children ?? (
        <p className="font-serif text-sm text-text-secondary italic">{empty}</p>
      )}
    </section>
  );
}

function EmergingCard({ data, sessionNoun }: { data: MomentumResponse | null; sessionNoun: string }) {
  const threads = data?.threads ?? [];
  return (
    <InsightCard
      Icon={Sparkle}
      eyebrow="What's emerging"
      title={`Threads with momentum`}
      empty={`No threads have crossed the threshold in the last ${data?.window_days ?? 14} days. Capture a couple more ${sessionNoun}s to see the shape.`}
    >
      {threads.length > 0 && (
        <ul className="space-y-sm">
          {threads.slice(0, 3).map((t) => (
            <li key={t.thread_id} className="flex items-baseline justify-between gap-sm">
              <span className="font-serif text-sm text-text-primary">{t.thread_id}</span>
              <span className="font-sans text-xs text-text-muted shrink-0">
                {t.count} touches · last {new Date(t.last_observed).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </InsightCard>
  );
}

function WorkingCard({ entries, celebrationFrame }: { entries: RecentEntry[] | null; celebrationFrame: string }) {
  return (
    <InsightCard
      Icon={Lightbulb}
      eyebrow="What's working"
      title={celebrationFrame === 'gratitude' ? 'Worth noticing' : 'Lit them up'}
      empty="Nothing engagement-positive in the last 14 days. That can mean settled or distracted — your call."
    >
      {entries && entries.length > 0 && (
        <ul className="space-y-sm">
          {entries.map((e) => (
            <li key={e.id} className="flex items-baseline justify-between gap-sm">
              <span className="font-serif text-sm text-text-primary truncate">
                {e.title}
              </span>
              <span className="font-sans text-xs text-text-muted shrink-0">
                {new Date(e.dateOccurred).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </InsightCard>
  );
}

function NextCard({
  data,
  pedagogy,
  activityVerb,
}: {
  data: NextRecsResponse | null;
  pedagogy: string;
  activityVerb: string;
}) {
  const recs = data?.recommendations ?? [];
  return (
    <InsightCard
      Icon={Play}
      eyebrow="Worth doing next"
      title={`Ready to ${activityVerb}`}
      empty={`No standout recommendations right now. Browse the library for a fresh ${activityVerb}.`}
    >
      {recs.length > 0 && (
        <ul className="space-y-sm">
          {recs.slice(0, 3).map((r) => (
            <li key={r.module_id} className="space-y-xs">
              <Link
                href={`/module/${r.module_id}`}
                className="block font-serif text-sm text-text-primary hover:text-ember transition-colors"
              >
                {r.module_title}
              </Link>
              <div className="flex items-center gap-xs">
                {r.primary_reason === 'pedagogy_match' && pedagogy !== 'eclectic' && (
                  <span className="inline-flex items-center gap-xs font-sans text-[0.65rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-ember/15 text-ember border border-ember/30">
                    Aligned
                  </span>
                )}
                <span className="font-sans text-xs text-text-muted italic">
                  {r.reason_text}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </InsightCard>
  );
}

function QuietCornersCard({ data, growthNoun }: { data: FreshnessResponse | null; growthNoun: string }) {
  const learners = data?.learners ?? [];
  return (
    <InsightCard
      Icon={Compass}
      eyebrow="Quiet corners"
      title={`Threads waiting on ${growthNoun}`}
      empty="Everything's been touched recently. Nice cadence."
    >
      {learners.length > 0 && (
        <ul className="space-y-sm">
          {learners.slice(0, 3).map((l) => (
            <li key={l.learner_id} className="space-y-xs">
              <p className="font-serif text-sm text-text-primary">{l.learner_name}</p>
              <ul className="space-y-[2px] ml-md">
                {l.stale_threads.slice(0, 2).map((t) => (
                  <li
                    key={t.thread_id}
                    className="flex items-baseline justify-between gap-sm font-sans text-xs text-text-muted"
                  >
                    <span>{t.thread_name}</span>
                    <span>{t.days_since}d ago</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </InsightCard>
  );
}

function ZeroStateCard({
  data,
  pedagogy,
  sessionNoun,
}: {
  data: ZeroStateResponse | null;
  pedagogy: string;
  sessionNoun: string;
}) {
  const recs = data?.recommendations ?? [];
  const pedagogyLabel = pedagogy && pedagogy !== 'eclectic' ? pedagogyLabelOf(pedagogy) : null;
  return (
    <section className="bg-surface-panel rounded-lg border border-border-subtle p-xl shadow-card relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-ember" aria-hidden="true" />
      <div className="flex items-center gap-sm mb-md">
        <span className="inline-flex text-ember" aria-hidden="true">
          <Sparkle size={20} />
        </span>
        <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-widest text-ember">
          A place to start
        </p>
      </div>
      <h2 className="font-serif text-xl font-semibold text-text-primary mb-sm">
        {pedagogyLabel
          ? `Most ${pedagogyLabel} families start with…`
          : `A handful of ${sessionNoun}s to begin with`}
      </h2>
      <p className="font-serif text-sm text-text-secondary italic mb-lg">
        Built from the pedagogy you set during onboarding plus whatever interests
        you logged for each child. You can ignore any of these — they&rsquo;re a
        nudge, not a plan.
      </p>
      {recs.length === 0 ? (
        <Link
          href="/library?tab=browse"
          className="inline-flex items-center gap-sm bg-ember text-text-inverse font-sans text-sm font-semibold rounded-md px-md py-sm hover:bg-ember/90 transition-all duration-200"
        >
          <Books size={14} aria-hidden="true" /> Browse the library
        </Link>
      ) : (
        <ul className="space-y-md">
          {recs.slice(0, 5).map((r) => (
            <li
              key={r.module_id}
              className="flex items-start justify-between gap-md pb-md border-b border-border-subtle last:border-b-0 last:pb-0"
            >
              <div className="flex-1 min-w-0">
                <Link
                  href={`/module/${r.module_id}`}
                  className="block font-serif text-base font-semibold text-text-primary hover:text-ember transition-colors mb-xs"
                >
                  {r.module_title}
                </Link>
                <p className="font-sans text-xs text-text-muted italic">
                  {r.reason_text}
                </p>
              </div>
              <Link
                href={`/module/${r.module_id}`}
                className="shrink-0 inline-flex items-center gap-xs bg-ember text-text-inverse font-sans text-xs font-semibold rounded-md px-sm py-xs hover:bg-ember/90 transition-all duration-200"
              >
                <Play size={12} aria-hidden="true" /> Start
              </Link>
            </li>
          ))}
        </ul>
      )}
      {data?.has_signal === false && (
        <p className="font-sans text-xs text-text-muted mt-lg">
          Tip: add interests on each child&rsquo;s profile to sharpen this opener.
        </p>
      )}
      {/* CalendarBlank only exists for tree-shaking warnings; the +Planner
          surface lives on /library?tab=browse cards. */}
      <span className="hidden">
        <CalendarBlank size={1} aria-hidden="true" />
      </span>
    </section>
  );
}

function pedagogyLabelOf(key: string): string {
  switch (key) {
    case 'charlotte_mason':
      return 'Charlotte Mason';
    case 'classical':
      return 'classical';
    case 'montessori':
      return 'Montessori';
    case 'waldorf_steiner':
      return 'Waldorf';
    case 'unschooling':
      return 'unschooling';
    default:
      return 'eclectic';
  }
}
