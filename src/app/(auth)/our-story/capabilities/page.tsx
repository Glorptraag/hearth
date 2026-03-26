'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChildSelector } from '@/components/ui/child-selector';
import { getThreadName, THREAD_DOMAINS, getThreadDomain } from '@/lib/capability-threads';

type Learner = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  shapeIcon: string | null;
  colourToken: string | null;
};

type ActiveThread = {
  thread_id: string;
  observation_count: number;
  suggested_tier: string;
  last_evidence_date: string;
};

const TIER_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  demonstrating: { label: 'Demonstrating', color: 'bg-sage/15 text-sage', icon: '●' },
  developing: { label: 'Developing', color: 'bg-child-blue/15 text-child-blue', icon: '◐' },
  emerging: { label: 'Emerging', color: 'bg-amber-400/15 text-amber-400', icon: '○' },
};

function getHighestTier(threads: ActiveThread[]): string {
  if (threads.some((t) => t.suggested_tier === 'demonstrating')) return 'demonstrating';
  if (threads.some((t) => t.suggested_tier === 'developing')) return 'developing';
  return 'emerging';
}

export default function CapabilitiesPage() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [activeThreads, setActiveThreads] = useState<ActiveThread[]>([]);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/learners')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setLearners(data);
          setSelectedLearnerId(data[0].id);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedLearnerId) return;
    fetch(`/api/capabilities/${selectedLearnerId}`)
      .then((r) => r.json())
      .then((data) => {
        setActiveThreads(Array.isArray(data) ? data : []);
      });
  }, [selectedLearnerId]);

  const threadsByDomain = useMemo(() => {
    const grouped: Record<string, ActiveThread[]> = {};
    for (const domain of THREAD_DOMAINS) {
      grouped[domain.key] = [];
    }
    for (const thread of activeThreads) {
      const domain = getThreadDomain(thread.thread_id);
      if (domain) grouped[domain.key].push(thread);
    }
    return grouped;
  }, [activeThreads]);

  const domainSummaries = useMemo(() => {
    return THREAD_DOMAINS.map((domain) => {
      const threads = threadsByDomain[domain.key] ?? [];
      const totalObs = threads.reduce((sum, t) => sum + t.observation_count, 0);
      return {
        ...domain,
        observedCount: threads.length,
        totalObservations: totalObs,
      };
    });
  }, [threadsByDomain]);

  const totalObservations = activeThreads.reduce((sum, t) => sum + t.observation_count, 0);
  const totalThreads = activeThreads.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4xl">
        <p className="font-sans text-sm text-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-md py-lg">
      <h1 className="font-serif text-2xl font-semibold text-text-primary mb-md">Capabilities</h1>

      <ChildSelector learners={learners} selectedId={selectedLearnerId} onChange={setSelectedLearnerId} />

      {/* Stats row */}
      <div className="mt-lg flex gap-lg">
        <div className="rounded-lg border border-border-subtle bg-surface-panel px-lg py-md shadow-[var(--shadow-soft)]">
          <p className="font-sans text-2xl font-semibold text-ember">{totalObservations}</p>
          <p className="font-sans text-xs text-text-muted">Observations</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-panel px-lg py-md shadow-[var(--shadow-soft)]">
          <p className="font-sans text-2xl font-semibold text-text-primary">{totalThreads}</p>
          <p className="font-sans text-xs text-text-muted">Threads</p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-md flex flex-wrap gap-md">
        {Object.entries(TIER_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-xs">
            <span className={`font-sans text-sm ${cfg.color.split(' ')[1]}`}>{cfg.icon}</span>
            <span className="font-sans text-xs text-text-secondary">{cfg.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-xs">
          <span className="font-sans text-sm text-text-muted opacity-40">◌</span>
          <span className="font-sans text-xs text-text-secondary">Not yet observed</span>
        </div>
      </div>

      {/* Domain Overview Grid */}
      <div className="mt-lg grid grid-cols-2 lg:grid-cols-4 gap-sm">
        {domainSummaries.map((domain) => (
          <a
            key={domain.key}
            href={`#domain-${domain.key}`}
            className="rounded-lg border border-border-subtle bg-surface-panel p-md shadow-[var(--shadow-soft)] hover:border-border-medium hover:translate-y-[-2px] hover:shadow-[var(--shadow-warm)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
          >
            <span className="text-2xl">{domain.emoji}</span>
            <h3 className="font-serif text-sm font-semibold text-text-primary mt-sm">{domain.label}</h3>
            <div className="flex gap-md mt-sm">
              <span className="font-sans text-xs text-text-muted">
                {domain.observedCount}/{domain.threadCount} threads
              </span>
              <span className="font-sans text-xs text-text-muted">{domain.totalObservations} obs</span>
            </div>
          </a>
        ))}
      </div>

      {/* Thread List by Domain */}
      <div className="mt-xl space-y-xl">
        {domainSummaries.map((domain) => {
          const threads = threadsByDomain[domain.key] ?? [];
          const expanded = expandedDomain === domain.key;
          const highestTier = threads.length > 0 ? getHighestTier(threads) : null;

          return (
            <section key={domain.key} id={`domain-${domain.key}`}>
              <button
                onClick={() => setExpandedDomain(expanded ? null : domain.key)}
                className="w-full text-left"
              >
                <div className="flex items-center gap-sm mb-md">
                  <span className="text-lg">{domain.emoji}</span>
                  <h2 className="font-serif text-lg font-semibold text-text-primary">{domain.label}</h2>
                  {highestTier && (
                    <span className={`rounded-full px-sm py-[2px] font-sans text-[10px] font-medium ${TIER_CONFIG[highestTier].color}`}>
                      {TIER_CONFIG[highestTier].icon} {TIER_CONFIG[highestTier].label}
                    </span>
                  )}
                </div>
              </button>

              <div className="space-y-sm">
                {threads.length > 0 ? (
                  threads.map((thread) => {
                    const tierCfg = TIER_CONFIG[thread.suggested_tier] ?? TIER_CONFIG.emerging;
                    return (
                      <div
                        key={thread.thread_id}
                        className="rounded-lg border border-border-subtle bg-surface-panel p-md shadow-[var(--shadow-soft)] hover:border-border-medium transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-sm">
                            <h3 className="font-serif text-sm font-semibold text-text-primary">
                              {getThreadName(thread.thread_id)}
                            </h3>
                            <span className="font-sans text-xs text-text-muted bg-surface-hover rounded-full px-sm py-[1px]">
                              {thread.observation_count}
                            </span>
                          </div>
                          <span className={`rounded-full px-sm py-[2px] font-sans text-[10px] font-medium ${tierCfg.color}`}>
                            {tierCfg.icon} {tierCfg.label}
                          </span>
                        </div>
                        {thread.last_evidence_date && (
                          <p className="font-sans text-[10px] text-text-muted mt-xs">
                            Last observed: {thread.last_evidence_date}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-lg border border-dashed border-border-medium bg-surface-panel p-md text-center">
                    <p className="font-serif text-sm text-text-muted italic">No observations yet</p>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
