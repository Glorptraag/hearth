'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from '@/components/icons';
import { ChildSelector } from '@/components/ui/child-selector';
import DomainChip from '@/components/ui/DomainChip';
import SectionHeader from '@/components/ui/SectionHeader';
import { mockLearners, mockCapabilities, mockOurStoryLearners } from '../../mock-data';

const DOMAIN_ORDER = ['english', 'mathematics', 'science', 'hass', 'arts', 'technologies', 'hpe', 'languages'];

export default function DemoCapabilities() {
  const searchParams = useSearchParams();
  const initialSelectedId = searchParams.get('child') || 'learner-1';
  const [selectedId, setSelectedId] = useState(initialSelectedId);

  const selected = mockLearners.find((l) => l.id === selectedId);
  const childProfile = mockOurStoryLearners.find((l) => l.id === selectedId);
  const groupedByDomain = useMemo(() => {
    const caps = mockCapabilities[selectedId as keyof typeof mockCapabilities] || [];
    const groups: Record<string, typeof caps> = {};
    caps.forEach((cap) => {
      if (!groups[cap.domain]) groups[cap.domain] = [];
      groups[cap.domain].push(cap);
    });
    return groups;
  }, [selectedId]);

  const getTierBadge = (tier: string) => {
    const tiers: Record<string, { bg: string; text: string }> = {
      emerging: { bg: 'bg-amber-status/20', text: 'text-amber-status' },
      developing: { bg: 'bg-blue-900/20', text: 'text-blue-400' },
      demonstrating: { bg: 'bg-sage/20', text: 'text-sage' },
    };
    return tiers[tier] || tiers.emerging;
  };

  const getTierLabel = (tier: string) => {
    return tier.charAt(0).toUpperCase() + tier.slice(1);
  };

  if (!selected || !childProfile) return null;

  return (
    <div className="mx-auto max-w-4xl px-md py-lg lg:py-2xl">
      {/* Child Selector */}
      <ChildSelector learners={mockLearners} selectedId={selectedId} onChange={setSelectedId} />

      <SectionHeader overline="CAPABILITIES" title="Growth Threads" />

      {/* Summary Stats */}
      <div className="mt-xl mb-3xl grid gap-lg sm:grid-cols-2">
        <div className="rounded-lg border border-border-subtle bg-surface-panel p-lg">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">
            Threads Active
          </p>
          <p className="font-serif text-3xl font-semibold text-text-primary">{childProfile.capabilityThreadsActive}</p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-panel p-lg">
          <p className="font-sans text-xs font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">
            Near Milestone
          </p>
          <p className="font-serif text-3xl font-semibold text-text-primary">{childProfile.capabilityNearMilestone}</p>
        </div>
      </div>

      {/* Domain Sections */}
      <div className="space-y-3xl">
        {DOMAIN_ORDER.map((domain) => {
          const threads = groupedByDomain[domain];
          if (!threads || threads.length === 0) return null;

          return (
            <div key={domain}>
              <div className="mb-lg flex items-center gap-md">
                <DomainChip subject={domain} size="sm" showEmoji />
                <span className="font-serif text-sm text-text-muted">{threads.length} thread{threads.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid gap-md sm:grid-cols-2">
                {threads.map((thread) => {
                  const tierColors = getTierBadge(thread.suggestedTier);
                  const observationPercent = Math.min(100, (thread.observationCount / 10) * 100);

                  return (
                    <div
                      key={thread.threadId}
                      className="rounded-lg border border-border-subtle bg-surface-panel p-lg shadow-card hover:translate-y-[-2px] hover:border-border-medium hover:shadow-hover transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)]"
                    >
                      <div className="mb-md flex items-start justify-between">
                        <h4 className="font-serif font-semibold text-text-primary flex-1">{thread.threadName}</h4>
                        {thread.recentGrowth && <span className="text-sage" aria-hidden="true">📈</span>}
                      </div>

                      {/* Tier Badge */}
                      <div className="mb-md">
                        <span className={`inline-flex items-center rounded-full px-sm py-xs font-sans text-xs font-semibold ${tierColors.bg} ${tierColors.text}`}>
                          {getTierLabel(thread.suggestedTier)}
                        </span>
                      </div>

                      {/* Observation Count */}
                      <div className="mb-md">
                        <div className="flex items-center justify-between mb-xs">
                          <span className="font-sans text-xs font-medium text-text-muted">
                            {thread.observationCount} observation{thread.observationCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div
                          className="h-1.5 w-full rounded-full bg-surface-raised overflow-hidden"
                          role="progressbar"
                          aria-valuenow={Math.round(observationPercent)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${thread.threadName} observations: ${thread.observationCount} of 10`}
                        >
                          <div
                            className="h-full rounded-full bg-sage transition-all duration-[var(--motion-base)]"
                            style={{ width: `${observationPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Recent Growth Indicator */}
                      {thread.recentGrowth && (
                        <p className="font-sans text-xs text-sage font-semibold">Growing</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Link */}
      <div className="mt-3xl pt-lg border-t border-border-subtle">
        <Link
          href={`/demo/our-story/portfolio?child=${selectedId}`}
          className="flex items-center justify-between rounded-md border border-border-subtle bg-surface-raised px-md py-sm font-sans text-sm font-medium text-ember hover:bg-surface-panel hover:border-border-medium transition-[background-color,border-color] duration-[var(--motion-quick)] ease-[var(--ease-default)]"
        >
          See evidence for these threads <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
