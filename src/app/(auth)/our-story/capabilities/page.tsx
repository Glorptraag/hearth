'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ChildSelector } from '@/components/ui/child-selector';

type Learner = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  shapeIcon: string | null;
  colourToken: string | null;
};

type Observation = {
  id: string;
  threadId: string;
  dloId: string | null;
  status: string;
  sourceEntryId: string | null;
  observedAt: string;
  confirmed: boolean;
  createdAt: string;
};

type Entry = {
  id: string;
  title: string;
};

type ThreadGroup = Record<string, Observation[]>;

const DOMAIN_CONFIG: Record<string, { label: string; emoji: string; threads: string[] }> = {
  english: {
    label: 'English',
    emoji: '📚',
    threads: ['english-writing', 'english-speaking', 'english-reading', 'english-listening'],
  },
  mathematics: {
    label: 'Mathematics',
    emoji: '🔢',
    threads: ['mathematics-number', 'mathematics-measurement', 'mathematics-geometry', 'mathematics-statistics'],
  },
  science: {
    label: 'Science',
    emoji: '🔬',
    threads: ['science-inquiry', 'science-biological', 'science-physical', 'science-earth'],
  },
  hass: {
    label: 'HASS',
    emoji: '🌏',
    threads: ['hass-history', 'hass-geography', 'hass-civics', 'hass-economics'],
  },
  arts: {
    label: 'Arts',
    emoji: '🎨',
    threads: ['arts-visual', 'arts-music', 'arts-drama', 'arts-dance'],
  },
  technologies: {
    label: 'Technologies',
    emoji: '⚙️',
    threads: ['technologies-digital', 'technologies-design'],
  },
  hpe: {
    label: 'HPE',
    emoji: '🏃',
    threads: ['hpe-movement', 'hpe-health', 'hpe-wellbeing'],
  },
  languages: {
    label: 'Languages',
    emoji: '🗣️',
    threads: ['languages-communication', 'languages-understanding'],
  },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  demonstrating: { label: 'Demonstrating', color: 'bg-sage/15 text-sage', icon: '●' },
  developing: { label: 'Developing', color: 'bg-child-blue/15 text-child-blue', icon: '◐' },
  emerging: { label: 'Emerging', color: 'bg-amber-400/15 text-amber-400', icon: '○' },
};

export default function CapabilitiesPage() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [threadGroups, setThreadGroups] = useState<ThreadGroup>({});
  const [entryTitles, setEntryTitles] = useState<Record<string, string>>({});
  const [expandedThread, setExpandedThread] = useState<string | null>(null);
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
        if (typeof data === 'object' && !Array.isArray(data)) {
          setThreadGroups(data);
          // Fetch entry titles for source entries
          const entryIds = new Set<string>();
          Object.values(data as ThreadGroup).forEach((obs) =>
            obs.forEach((o) => {
              if (o.sourceEntryId) entryIds.add(o.sourceEntryId);
            })
          );
          entryIds.forEach((id) => {
            fetch(`/api/entries/${id}`)
              .then((r) => r.json())
              .then((entry) => {
                if (entry?.title) {
                  setEntryTitles((prev) => ({ ...prev, [id]: entry.title }));
                }
              })
              .catch(() => {});
          });
        }
      });
  }, [selectedLearnerId]);

  // Build domain summaries
  const domainSummaries = useMemo(() => {
    return Object.entries(DOMAIN_CONFIG).map(([key, config]) => {
      const observedThreads = config.threads.filter((t) => threadGroups[t]?.length > 0);
      const totalObs = config.threads.reduce((sum, t) => sum + (threadGroups[t]?.length ?? 0), 0);
      return {
        key,
        ...config,
        observedCount: observedThreads.length,
        totalObservations: totalObs,
      };
    });
  }, [threadGroups]);

  // Total stats
  const totalObservations = Object.values(threadGroups).reduce((sum, obs) => sum + obs.length, 0);
  const totalThreads = Object.keys(threadGroups).length;

  const getHighestStatus = (observations: Observation[]): string => {
    if (observations.some((o) => o.status === 'demonstrating')) return 'demonstrating';
    if (observations.some((o) => o.status === 'developing')) return 'developing';
    return 'emerging';
  };

  const getUnobservedThreads = (domainKey: string): string[] => {
    const config = DOMAIN_CONFIG[domainKey];
    if (!config) return [];
    return config.threads.filter((t) => !threadGroups[t]?.length);
  };

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
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
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
                {domain.observedCount}/{domain.threads.length} threads
              </span>
              <span className="font-sans text-xs text-text-muted">{domain.totalObservations} obs</span>
            </div>
          </a>
        ))}
      </div>

      {/* Thread List by Domain */}
      <div className="mt-xl space-y-xl">
        {domainSummaries.map((domain) => (
          <section key={domain.key} id={`domain-${domain.key}`}>
            <div className="flex items-center gap-sm mb-md">
              <span className="text-lg">{domain.emoji}</span>
              <h2 className="font-serif text-lg font-semibold text-text-primary">{domain.label}</h2>
            </div>

            <div className="space-y-sm">
              {domain.threads.map((threadId) => {
                const observations = threadGroups[threadId] ?? [];
                const hasObs = observations.length > 0;
                const expanded = expandedThread === threadId;
                const highestStatus = hasObs ? getHighestStatus(observations) : null;
                const statusCfg = highestStatus ? STATUS_CONFIG[highestStatus] : null;
                const prettyName = threadId
                  .replace(/^[^-]+-/, '')
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase());

                return (
                  <div key={threadId}>
                    <button
                      onClick={() => setExpandedThread(expanded ? null : threadId)}
                      className="w-full text-left rounded-lg border border-border-subtle bg-surface-panel p-md shadow-[var(--shadow-soft)] hover:border-border-medium transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-sm">
                          <h3 className="font-serif text-sm font-semibold text-text-primary">{prettyName}</h3>
                          {hasObs && (
                            <span className="font-sans text-xs text-text-muted bg-surface-hover rounded-full px-sm py-[1px]">
                              {observations.length}
                            </span>
                          )}
                        </div>
                        {statusCfg ? (
                          <span className={`rounded-full px-sm py-[2px] font-sans text-[10px] font-medium ${statusCfg.color}`}>
                            {statusCfg.icon} {statusCfg.label}
                          </span>
                        ) : (
                          <span className="font-sans text-[10px] text-text-muted italic">Not yet observed</span>
                        )}
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {expanded && (
                      <div className="mt-xs ml-md border-l-2 border-border-subtle pl-md py-sm space-y-sm">
                        {hasObs ? (
                          observations.map((obs) => {
                            const obsCfg = STATUS_CONFIG[obs.status] ?? STATUS_CONFIG.emerging;
                            return (
                              <div
                                key={obs.id}
                                className="rounded-md border border-border-subtle bg-surface-raised p-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`rounded-full px-sm py-[1px] font-sans text-[10px] font-medium ${obsCfg.color}`}>
                                    {obsCfg.icon} {obsCfg.label}
                                  </span>
                                  <span className="font-sans text-[10px] text-text-muted">
                                    {format(new Date(obs.observedAt ?? obs.createdAt), 'd MMM yyyy')}
                                  </span>
                                </div>
                                {obs.sourceEntryId && entryTitles[obs.sourceEntryId] && (
                                  <p className="font-serif text-xs text-text-secondary mt-xs truncate">
                                    From: {entryTitles[obs.sourceEntryId]}
                                  </p>
                                )}
                                {obs.confirmed && (
                                  <span className="inline-block mt-xs rounded-full bg-sage/10 text-sage px-sm py-[1px] font-sans text-[10px] font-medium">
                                    ✓ Confirmed
                                  </span>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <p className="font-serif text-xs text-text-muted italic">
                            No observations recorded yet
                          </p>
                        )}

                        {/* Opening Up: related unobserved threads */}
                        {(() => {
                          const unobserved = getUnobservedThreads(domain.key).filter((t) => t !== threadId);
                          if (unobserved.length === 0) return null;
                          return (
                            <div className="mt-sm pt-sm border-t border-border-subtle">
                              <p className="font-sans text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-xs">
                                Threads to explore
                              </p>
                              <div className="flex flex-wrap gap-xs">
                                {unobserved.slice(0, 2).map((t) => (
                                  <span
                                    key={t}
                                    className="rounded-full border border-dashed border-border-medium px-sm py-xs font-sans text-xs text-text-muted"
                                  >
                                    {t
                                      .replace(/^[^-]+-/, '')
                                      .replace(/-/g, ' ')
                                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
