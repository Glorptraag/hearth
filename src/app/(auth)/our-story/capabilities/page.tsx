'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChildSelector } from '@/components/ui/child-selector';
import { getThreadName, THREAD_NAMES, THREAD_DOMAINS, getThreadDomain, type ThreadDomain } from '@/lib/capability-threads';

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

const TIER_CONFIG: Record<string, { label: string; badge: string; bar: string; glow: string; radius: number; opacity: number }> = {
  emerging:      { label: 'Emerging',      badge: 'bg-amber-400/15 text-amber-400',               bar: 'bg-amber-400',       glow: 'rgba(251,191,36,0.6)',  radius: 3,  opacity: 0.5 },
  developing:    { label: 'Developing',    badge: 'bg-domain-science/15 text-domain-science',     bar: 'bg-domain-science',   glow: 'rgba(107,142,107,0.7)', radius: 5,  opacity: 0.75 },
  demonstrating: { label: 'Demonstrating', badge: 'bg-sage/15 text-sage',                         bar: 'bg-sage',             glow: 'rgba(74,222,128,0.8)',  radius: 7,  opacity: 1.0 },
  unobserved:    { label: 'Not observed',  badge: 'bg-surface-hover text-text-muted',             bar: 'bg-surface-hover',    glow: 'rgba(128,128,128,0.15)', radius: 2, opacity: 0.2 },
};

const DOMAIN_COLORS: Record<string, string> = {
  literacy: '#6B8E9B',
  mathematics: '#9B7B6B',
  science: '#7B9B6B',
  humanities: '#9B8B6B',
  personal: '#9B6B7B',
  psychosocial: '#8B7B9B',
  creative: '#8B6B9B',
  executiveFunction: '#6B7B9B',
};

// Position domains in a circle around center
function getDomainPositions(cx: number, cy: number, radius: number): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};
  THREAD_DOMAINS.forEach((domain, i) => {
    const angle = (i / THREAD_DOMAINS.length) * Math.PI * 2 - Math.PI / 2;
    positions[domain.key] = {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  });
  return positions;
}

// Position threads within a domain cluster
function getThreadPositions(
  domain: ThreadDomain,
  cx: number,
  cy: number,
  clusterRadius: number,
  threadData: Map<string, ActiveThread>
): Array<{ id: string; x: number; y: number; tier: string; obsCount: number; name: string }> {
  const allIds = Object.keys(THREAD_NAMES).filter(
    (id) => getThreadDomain(id)?.key === domain.key
  );

  return allIds.map((id, i) => {
    const angle = (i / allIds.length) * Math.PI * 2 - Math.PI / 2;
    const r = clusterRadius * (0.4 + (i % 2) * 0.6);
    const active = threadData.get(id);
    return {
      id,
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      tier: active?.suggested_tier ?? 'unobserved',
      obsCount: active?.observation_count ?? 0,
      name: getThreadName(id),
    };
  });
}

// ─── Thread Detail Panel ──────────────────────────────────────────────────

function ThreadDetailPanel({
  thread,
  learnerId,
  onClose,
  onTierOverride,
}: {
  thread: { id: string; tier: string; obsCount: number; name: string; lastDate?: string };
  learnerId: string | null;
  onClose: () => void;
  onTierOverride?: (threadId: string, tier: string | null) => void;
}) {
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const tierCfg = TIER_CONFIG[thread.tier] ?? TIER_CONFIG.unobserved;
  const progressWidth = thread.tier === 'emerging' ? '25%' : thread.tier === 'developing' ? '60%' : thread.tier === 'demonstrating' ? '90%' : '0%';

  const lowerTiers = (['emerging', 'developing', 'demonstrating'] as const).filter(
    (t) => {
      const rank = { emerging: 0, developing: 1, demonstrating: 2 };
      return rank[t] < rank[thread.tier as keyof typeof rank];
    }
  );

  const handleOverride = async (tier: string | null) => {
    if (!learnerId || !onTierOverride) return;
    setAdjusting(true);
    try {
      await fetch(`/api/capabilities/${learnerId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: thread.id, tier }),
      });
      onTierOverride(thread.id, tier);
      setShowAdjust(false);
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="rounded-lg border border-border-subtle bg-surface-panel p-lg shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center justify-between mb-sm">
        <h3 className="font-serif text-base font-semibold text-text-primary">{thread.name}</h3>
        <button onClick={onClose} className="font-sans text-xs text-text-muted hover:text-text-secondary">Close</button>
      </div>
      <div className="flex items-center gap-sm mb-md">
        <span className={`rounded-full px-sm py-[2px] font-sans text-[10px] font-semibold ${tierCfg.badge}`}>
          {tierCfg.label}
        </span>
        <span className="font-sans text-xs text-text-muted">{thread.obsCount} observation{thread.obsCount !== 1 ? 's' : ''}</span>
        {thread.lastDate && (
          <span className="font-sans text-xs text-text-muted">Last: {thread.lastDate}</span>
        )}
      </div>
      <div className="h-[6px] w-full rounded-full bg-surface-hover overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-[400ms] ${tierCfg.bar}`}
          style={{ width: progressWidth }}
        />
      </div>
      <p className="font-sans text-[11px] text-text-muted mt-sm">
        {thread.tier === 'unobserved'
          ? 'Log activities in this area to start tracking progress.'
          : thread.tier === 'emerging'
            ? 'Early observations recorded. Keep logging to build evidence.'
            : thread.tier === 'developing'
              ? 'Solid evidence building. A few more observations to reach demonstrating.'
              : 'Strong evidence of capability. Well documented.'}
      </p>

      {thread.tier !== 'unobserved' && learnerId && (
        <div className="mt-md pt-md border-t border-border-subtle">
          {!showAdjust ? (
            <button
              onClick={() => setShowAdjust(true)}
              className="font-sans text-[11px] text-text-muted hover:text-text-secondary transition-colors"
            >
              Adjust tier
            </button>
          ) : (
            <div className="space-y-sm">
              <p className="font-sans text-[11px] text-text-muted">
                Override the auto-detected tier if it doesn&apos;t match your observations.
              </p>
              <div className="flex flex-wrap gap-xs">
                {lowerTiers.map((t) => {
                  const cfg = TIER_CONFIG[t];
                  return (
                    <button
                      key={t}
                      disabled={adjusting}
                      onClick={() => handleOverride(t)}
                      className={`rounded-md px-sm py-[3px] font-sans text-[11px] font-medium border border-border-subtle hover:border-border-medium transition-all duration-200 ${cfg.badge} disabled:opacity-50`}
                    >
                      {cfg.label}
                    </button>
                  );
                })}
                <button
                  disabled={adjusting}
                  onClick={() => handleOverride(null)}
                  className="rounded-md px-sm py-[3px] font-sans text-[11px] text-text-muted border border-border-subtle hover:border-border-medium transition-all duration-200 disabled:opacity-50"
                >
                  Reset to auto
                </button>
              </div>
              <button
                onClick={() => setShowAdjust(false)}
                className="font-sans text-[10px] text-text-muted hover:text-text-secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Constellation View ───────────────────────────────────────────────────

function ConstellationView({
  activeThreads,
  focusDomain,
  onFocusDomain,
  onSelectThread,
}: {
  activeThreads: ActiveThread[];
  focusDomain: string | null;
  onFocusDomain: (key: string | null) => void;
  onSelectThread: (id: string) => void;
}) {
  const W = 600;
  const H = 500;
  const CX = W / 2;
  const CY = H / 2;

  const threadDataMap = useMemo(() => {
    const map = new Map<string, ActiveThread>();
    activeThreads.forEach((t) => map.set(t.thread_id, t));
    return map;
  }, [activeThreads]);

  const domainPositions = useMemo(() => getDomainPositions(CX, CY, 160), []);

  // When a domain is focused, show it zoomed in at center
  const focusedThreads = useMemo(() => {
    if (!focusDomain) return null;
    const domain = THREAD_DOMAINS.find((d) => d.key === focusDomain);
    if (!domain) return null;
    return getThreadPositions(domain, CX, CY, 140, threadDataMap);
  }, [focusDomain, threadDataMap]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full max-w-[600px] mx-auto"
      style={{ background: 'transparent' }}
    >
      <defs>
        {Object.entries(DOMAIN_COLORS).map(([key, color]) => (
          <radialGradient key={key} id={`glow-${key}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>

      {/* Background stars (decorative) */}
      {Array.from({ length: 40 }, (_, i) => (
        <circle
          key={`bg-${i}`}
          cx={((i * 37 + 13) % W)}
          cy={((i * 53 + 7) % H)}
          r={0.5 + (i % 3) * 0.3}
          fill="rgba(255,255,255,0.08)"
        />
      ))}

      {!focusDomain ? (
        // Galaxy overview — domain clusters
        <>
          {/* Connection lines between domains */}
          {THREAD_DOMAINS.map((d, i) => {
            const next = THREAD_DOMAINS[(i + 1) % THREAD_DOMAINS.length];
            const p1 = domainPositions[d.key];
            const p2 = domainPositions[next.key];
            return (
              <line
                key={`conn-${i}`}
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="rgba(217,123,58,0.06)"
                strokeWidth="1"
              />
            );
          })}

          {THREAD_DOMAINS.map((domain) => {
            const pos = domainPositions[domain.key];
            const domainThreads = activeThreads.filter(
              (t) => getThreadDomain(t.thread_id)?.key === domain.key
            );
            const totalObs = domainThreads.reduce((s, t) => s + t.observation_count, 0);
            const glowR = 30 + Math.min(totalObs * 2, 30);
            const color = DOMAIN_COLORS[domain.key] ?? '#888';

            return (
              <g
                key={domain.key}
                className="cursor-pointer"
                onClick={() => onFocusDomain(domain.key)}
              >
                {/* Ambient glow */}
                <circle cx={pos.x} cy={pos.y} r={glowR} fill={`url(#glow-${domain.key})`} />

                {/* Thread stars within cluster (small preview) */}
                {getThreadPositions(domain, pos.x, pos.y, 25, threadDataMap).map((t) => {
                  const cfg = TIER_CONFIG[t.tier];
                  return (
                    <circle
                      key={t.id}
                      cx={t.x} cy={t.y}
                      r={cfg.radius * 0.6}
                      fill={color}
                      opacity={cfg.opacity}
                    />
                  );
                })}

                {/* Domain label */}
                <text
                  x={pos.x} y={pos.y + glowR + 14}
                  textAnchor="middle"
                  className="font-sans"
                  style={{ fontSize: '10px', fill: color, fontWeight: 600 }}
                >
                  {domain.emoji} {domain.label}
                </text>

                {/* Count badge */}
                <text
                  x={pos.x} y={pos.y + glowR + 25}
                  textAnchor="middle"
                  className="font-sans"
                  style={{ fontSize: '8px', fill: 'rgba(255,255,255,0.35)' }}
                >
                  {domainThreads.length}/{domain.threadCount} threads
                </text>
              </g>
            );
          })}
        </>
      ) : (
        // Zoomed domain view
        <>
          {/* Back button */}
          <g className="cursor-pointer" onClick={() => onFocusDomain(null)}>
            <text x={20} y={30} className="font-sans" style={{ fontSize: '12px', fill: 'var(--color-ember)' }}>
              ← All domains
            </text>
          </g>

          {/* Domain title */}
          <text x={CX} y={40} textAnchor="middle" className="font-serif" style={{ fontSize: '16px', fill: 'var(--color-text-primary)', fontWeight: 600 }}>
            {THREAD_DOMAINS.find((d) => d.key === focusDomain)?.emoji}{' '}
            {THREAD_DOMAINS.find((d) => d.key === focusDomain)?.label}
          </text>

          {/* Thread stars */}
          {focusedThreads?.map((t) => {
            const cfg = TIER_CONFIG[t.tier];
            const color = DOMAIN_COLORS[focusDomain] ?? '#888';
            return (
              <g key={t.id} className="cursor-pointer" onClick={() => onSelectThread(t.id)}>
                {/* Glow */}
                <circle cx={t.x} cy={t.y} r={cfg.radius * 3} fill={cfg.glow} opacity={0.15} />
                {/* Star */}
                <circle cx={t.x} cy={t.y} r={cfg.radius} fill={color} opacity={cfg.opacity}>
                  <animate attributeName="opacity" values={`${cfg.opacity};${cfg.opacity * 0.7};${cfg.opacity}`} dur={`${3 + (t.id.charCodeAt(1) % 3)}s`} repeatCount="indefinite" />
                </circle>
                {/* Label */}
                <text
                  x={t.x} y={t.y + cfg.radius + 12}
                  textAnchor="middle"
                  className="font-sans"
                  style={{ fontSize: '9px', fill: `rgba(255,255,255,${cfg.opacity * 0.7})` }}
                >
                  {t.name}
                </text>
                {/* Observation count */}
                {t.obsCount > 0 && (
                  <text
                    x={t.x} y={t.y + cfg.radius + 22}
                    textAnchor="middle"
                    className="font-sans"
                    style={{ fontSize: '8px', fill: 'rgba(255,255,255,0.3)' }}
                  >
                    {t.obsCount} obs
                  </text>
                )}
              </g>
            );
          })}
        </>
      )}
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function CapabilitiesPage() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [activeThreads, setActiveThreads] = useState<ActiveThread[]>([]);
  const [focusDomain, setFocusDomain] = useState<string | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'constellation' | 'list'>(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 'list' : 'constellation'
  );
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
        setFocusDomain(null);
        setSelectedThreadId(null);
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

  const selectedThread = useMemo(() => {
    if (!selectedThreadId) return null;
    const active = activeThreads.find((t) => t.thread_id === selectedThreadId);
    return {
      id: selectedThreadId,
      name: getThreadName(selectedThreadId),
      tier: active?.suggested_tier ?? 'unobserved',
      obsCount: active?.observation_count ?? 0,
      lastDate: active?.last_evidence_date,
    };
  }, [selectedThreadId, activeThreads]);

  const handleFocusDomain = useCallback((key: string | null) => {
    setFocusDomain(key);
    setSelectedThreadId(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4xl">
        <p className="font-sans text-sm text-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-md py-xl lg:px-lg lg:py-2xl">
      <div className="flex items-center justify-between mb-md">
        <h1 className="font-serif text-2xl font-semibold text-text-primary">Capabilities</h1>
        <div className="flex gap-xs">
          <button
            onClick={() => setViewMode('constellation')}
            className={`font-sans text-xs rounded-full px-sm py-[3px] border transition-all duration-200 ${
              viewMode === 'constellation'
                ? 'bg-ember text-text-inverse border-ember'
                : 'bg-transparent border-border-subtle text-text-secondary hover:border-border-medium'
            }`}
          >
            Constellation
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`font-sans text-xs rounded-full px-sm py-[3px] border transition-all duration-200 ${
              viewMode === 'list'
                ? 'bg-ember text-text-inverse border-ember'
                : 'bg-transparent border-border-subtle text-text-secondary hover:border-border-medium'
            }`}
          >
            List
          </button>
        </div>
      </div>

      <ChildSelector learners={learners} selectedId={selectedLearnerId} onChange={setSelectedLearnerId} />

      {/* Stats row */}
      <div className="mt-lg flex gap-md">
        <div className="rounded-[16px] border border-border-subtle bg-surface-panel px-xl py-md shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          <p className="font-sans text-2xl font-semibold text-ember">{totalObservations}</p>
          <p className="font-sans text-xs text-text-muted">Observations</p>
        </div>
        <div className="rounded-[16px] border border-border-subtle bg-surface-panel px-xl py-md shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          <p className="font-sans text-2xl font-semibold text-text-primary">{totalThreads}</p>
          <p className="font-sans text-xs text-text-muted">Threads</p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-md flex flex-wrap gap-md">
        {Object.entries(TIER_CONFIG).filter(([k]) => k !== 'unobserved').map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-xs">
            <div className={`w-2 h-2 rounded-full ${cfg.bar}`} />
            <span className="font-sans text-xs text-text-secondary">{cfg.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-xs">
          <div className="w-2 h-2 rounded-full bg-surface-hover" />
          <span className="font-sans text-xs text-text-secondary">Not yet observed</span>
        </div>
      </div>

      {/* First-use empty state */}
      {totalObservations === 0 && (
        <div className="mt-xl rounded-[16px] border border-border-subtle bg-surface-panel p-xl text-center shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
          <span className="text-3xl block mb-md">✦</span>
          <h2 className="font-serif text-lg font-semibold text-text-primary mb-sm">
            Capabilities emerge from logging
          </h2>
          <p className="font-serif text-sm text-text-secondary leading-relaxed max-w-md mx-auto mb-lg">
            As you log learning moments, Hearth maps them to capability threads automatically.
            Each thread grows from emerging to demonstrating as evidence builds.
          </p>
          <a
            href="/log"
            className="inline-block rounded-md bg-ember px-md py-sm font-sans text-sm font-semibold text-text-inverse transition-all duration-200 hover:bg-ember-hover"
          >
            Log your first moment
          </a>
        </div>
      )}

      {viewMode === 'constellation' ? (
        <>
          {/* Constellation visualization */}
          <div className="mt-lg rounded-[16px] border border-border-subtle bg-surface-body overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
            <ConstellationView
              activeThreads={activeThreads}
              focusDomain={focusDomain}
              onFocusDomain={handleFocusDomain}
              onSelectThread={setSelectedThreadId}
            />
          </div>

          {/* Thread detail panel */}
          {selectedThread && (
            <div className="mt-md">
              <ThreadDetailPanel
                thread={selectedThread}
                learnerId={selectedLearnerId || null}
                onClose={() => setSelectedThreadId(null)}
                onTierOverride={(threadId, tier) => {
                  setActiveThreads((prev) =>
                    prev.map((t) =>
                      t.thread_id === threadId
                        ? { ...t, suggested_tier: tier ?? (t.observation_count >= 8 ? 'demonstrating' : t.observation_count >= 4 ? 'developing' : 'emerging') }
                        : t
                    )
                  );
                  setSelectedThreadId(null);
                }}
              />
            </div>
          )}
        </>
      ) : (
        <>
          {/* Domain Overview Grid */}
          <div className="mt-lg grid grid-cols-2 lg:grid-cols-4 gap-md">
            {domainSummaries.map((domain) => (
              <button
                key={domain.key}
                onClick={() => handleFocusDomain(focusDomain === domain.key ? null : domain.key)}
                className="group relative overflow-hidden rounded-[16px] border border-border-subtle bg-surface-panel p-lg shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:border-border-medium hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_60px_rgba(217,123,58,0.08)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] text-left w-full"
              >
                <div className="absolute left-0 right-0 top-0 h-[2px] bg-[linear-gradient(90deg,var(--color-ember),transparent)] opacity-0 transition-opacity duration-[400ms] group-hover:opacity-100" />
                <span className="text-2xl">{domain.emoji}</span>
                <h3 className="font-serif text-sm font-semibold text-text-primary mt-sm">{domain.label}</h3>
                <div className="flex gap-md mt-sm">
                  <span className="font-sans text-xs text-text-muted">
                    {domain.observedCount}/{domain.threadCount} threads
                  </span>
                  <span className="font-sans text-xs text-text-muted">{domain.totalObservations} obs</span>
                </div>
              </button>
            ))}
          </div>

          {/* Thread List by Domain (expanded) */}
          {focusDomain && (
            <div className="mt-lg">
              {(() => {
                const domain = domainSummaries.find((d) => d.key === focusDomain);
                if (!domain) return null;
                const threads = threadsByDomain[domain.key] ?? [];
                return (
                  <section>
                    <div className="flex items-center gap-sm mb-md">
                      <span className="text-lg">{domain.emoji}</span>
                      <h2 className="font-serif text-lg font-semibold text-text-primary">{domain.label}</h2>
                      <button
                        onClick={() => handleFocusDomain(null)}
                        className="ml-auto font-sans text-xs text-text-muted hover:text-text-secondary"
                      >
                        Close
                      </button>
                    </div>

                    <div className="space-y-sm">
                      {threads.length > 0 ? (
                        threads.map((thread) => {
                          const tierCfg = TIER_CONFIG[thread.suggested_tier] ?? TIER_CONFIG.emerging;
                          const progressWidth = thread.suggested_tier === 'emerging' ? '25%' : thread.suggested_tier === 'developing' ? '60%' : '90%';
                          return (
                            <div
                              key={thread.thread_id}
                              className="rounded-[10px] border border-border-subtle bg-surface-panel p-md shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:border-border-medium hover:translate-y-[-1px] transition-all duration-200"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-sm">
                                  <h3 className="font-serif text-sm font-semibold text-text-primary">
                                    {getThreadName(thread.thread_id)}
                                  </h3>
                                  <span className={`rounded-full px-sm py-[2px] font-sans text-[10px] font-semibold ${tierCfg.badge}`}>
                                    {tierCfg.label}
                                  </span>
                                </div>
                                <span className="font-sans text-[10px] font-semibold text-text-muted">{thread.observation_count} obs</span>
                              </div>
                              {thread.last_evidence_date && (
                                <p className="font-sans text-[10px] text-text-muted mt-xs">Last: {thread.last_evidence_date}</p>
                              )}
                              <div className="mt-sm h-1 w-full rounded-full bg-surface-hover overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-[400ms] ${tierCfg.bar}`} style={{ width: progressWidth }} />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-[10px] border border-dashed border-border-medium bg-surface-panel p-md text-center">
                          <p className="font-serif text-sm text-text-muted italic">No observations yet in this domain</p>
                        </div>
                      )}
                    </div>
                  </section>
                );
              })()}
            </div>
          )}
        </>
      )}
    </div>
  );
}
