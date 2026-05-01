'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { differenceInDays, parseISO } from 'date-fns';
import { ChildSelector } from '@/components/ui/child-selector';
import DomainChip, { DOMAIN_LABELS } from '@/components/ui/DomainChip';
import SectionHeader from '@/components/ui/SectionHeader';
import { mockLearners, mockPortfolioEntries, mockSettings, mockOurStoryLearners } from '../../mock-data';

const SUBJECTS = ['english', 'mathematics', 'science', 'hass', 'arts', 'technologies', 'hpe', 'languages'];
const WORK_SAMPLE_AREAS = [
  { name: 'English', domain: 'english' },
  { name: 'Mathematics', domain: 'mathematics' },
  { name: 'Science', domain: 'science' },
  { name: 'HASS', domain: 'hass' },
  { name: 'Arts', domain: 'arts' },
  { name: 'HPE', domain: 'hpe' },
];

export default function DemoComplianceReport() {
  const searchParams = useSearchParams();
  const initialSelectedId = searchParams.get('child') || 'learner-1';
  const [selectedId, setSelectedId] = useState(initialSelectedId);

  const childProfile = mockOurStoryLearners.find((l) => l.id === selectedId);
  const selected = mockLearners.find((l) => l.id === selectedId);

  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SUBJECTS.forEach((s) => {
      counts[s] = mockPortfolioEntries.filter(
        (e) => e.learnerIds.includes(selectedId) && e.subjects.includes(s)
      ).length;
    });
    return counts;
  }, [selectedId]);

  const weeksUntilDeadline = useMemo(() => {
    const today = new Date();
    const deadline = parseISO(mockSettings.nextReportDate);
    return Math.ceil(differenceInDays(deadline, today) / 7);
  }, []);

  const subjectsWithGaps = SUBJECTS.filter((s) => subjectCounts[s] < 3);

  const getStatusColor = (count: number): { bg: string; text: string } => {
    if (count >= 5) return { bg: 'bg-sage/20', text: 'text-sage' };
    if (count >= 3) return { bg: 'bg-amber-status/20', text: 'text-amber-status' };
    return { bg: 'bg-red-900/20', text: 'text-red-400' };
  };

  if (!selected || !childProfile) return null;

  return (
    <div className="mx-auto max-w-4xl px-md py-lg lg:py-2xl">
      {/* Child Selector */}
      <ChildSelector learners={mockLearners} selectedId={selectedId} onChange={setSelectedId} />

      <SectionHeader overline="COMPLIANCE REPORT" title="Quarterly Report" />

      {/* Registration Banner */}
      <div className="mt-xl mb-2xl rounded-lg border border-border-subtle bg-surface-raised p-lg">
        <p className="mb-sm font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
          Registration
        </p>
        <p className="mb-md font-sans text-sm font-medium text-text-primary">
          {mockSettings.registrationNumber}
        </p>
        <p className="font-sans text-xs text-text-secondary">
          Next report due: {mockSettings.nextReportDate} ({weeksUntilDeadline} weeks)
        </p>
      </div>

      {/* Overall Status */}
      <div className="mb-3xl">
        <div className="inline-flex items-center gap-md rounded-full bg-sage/20 px-md py-sm border border-sage/30">
          <span className="text-lg" aria-hidden="true">✓</span>
          <span className="font-sans font-semibold text-sage">On Track</span>
        </div>
      </div>

      {/* Subject Coverage Grid */}
      <div className="mb-3xl">
        <SectionHeader overline="SUBJECT COVERAGE" title="Learning Areas" />
        <div className="mt-lg grid gap-lg sm:grid-cols-2 lg:grid-cols-4">
          {SUBJECTS.map((subject) => {
            const count = subjectCounts[subject];
            const percent = Math.min(100, (count / 5) * 100);
            const colors = getStatusColor(count);
            return (
              <div key={subject} className="rounded-lg border border-border-subtle bg-surface-panel p-md">
                <div className="mb-sm flex items-center justify-between">
                  <DomainChip subject={subject} size="sm" showEmoji />
                  <span className="font-sans text-xs font-semibold text-text-muted">{count}/5</span>
                </div>
                <div
                  className="h-2 w-full rounded-full bg-surface-raised overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(percent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${subject} coverage: ${count} of 5 entries`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${colors.text}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Work Sample Readiness */}
      <div className="mb-3xl">
        <SectionHeader overline="WORK SAMPLES" title="Required Areas" />
        <div className="mt-lg grid gap-md sm:grid-cols-2">
          {WORK_SAMPLE_AREAS.map((area) => {
            const count = subjectCounts[area.domain];
            const isReady = count >= 2;
            const inProgress = count === 1;
            return (
              <div key={area.domain} className="rounded-lg border border-border-subtle bg-surface-panel p-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-serif font-semibold text-text-primary">{area.name}</p>
                    <p className="mt-xs font-sans text-xs text-text-muted">{count} sample{count !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="text-lg">
                    {isReady ? '✅' : inProgress ? '⏳' : '❌'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gap Analysis */}
      {subjectsWithGaps.length > 0 && (
        <div className="mb-3xl">
          <SectionHeader overline="GAP ANALYSIS" title="Coverage Opportunities" />
          <div className="mt-lg space-y-md">
            {subjectsWithGaps.map((subject) => {
              const count = subjectCounts[subject];
              const remaining = 3 - count;
              return (
                <div key={subject} className="rounded-lg border border-border-subtle bg-surface-raised p-lg">
                  <p className="font-sans text-sm text-text-secondary">
                    Consider logging more{' '}
                    <span className="font-semibold text-text-primary">{DOMAIN_LABELS[subject]}</span>{' '}
                    activities — you need <span className="font-semibold text-amber-status">{remaining} more</span>{' '}
                    entries for comfortable coverage.
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cross-links */}
      <div className="mt-3xl pt-lg border-t border-border-subtle">
        <p className="mb-lg font-sans text-xs font-semibold uppercase tracking-[0.1em] text-text-muted">
          Related views
        </p>
        <div className="space-y-sm">
          <Link
            href={`/demo/our-story/portfolio?child=${selectedId}`}
            className="block rounded-md border border-border-subtle bg-surface-raised px-md py-sm font-sans text-sm font-medium text-ember hover:bg-surface-panel hover:border-border-medium transition-all duration-200"
          >
            View all evidence →
          </Link>
          <Link
            href={`/demo/our-story/capabilities?child=${selectedId}`}
            className="block rounded-md border border-border-subtle bg-surface-raised px-md py-sm font-sans text-sm font-medium text-ember hover:bg-surface-panel hover:border-border-medium transition-all duration-200"
          >
            See capability growth →
          </Link>
        </div>
      </div>
    </div>
  );
}
