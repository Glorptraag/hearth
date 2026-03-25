'use client';

import { useState, useEffect, useMemo } from 'react';
import { format, differenceInDays, differenceInYears } from 'date-fns';
import { ChildSelector } from '@/components/ui/child-selector';

type Learner = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  shapeIcon: string | null;
  colourToken: string | null;
};

type Entry = {
  id: string;
  title: string;
  dateOccurred: string;
  subjects: string[] | null;
  learnerIds: string[] | null;
  evidenceUrls: string[] | null;
  status: string;
};

type Settings = {
  heuNextReportDate: string | null;
  heuRegistrationNumber: string | null;
  createdAt: string;
};

const SUBJECT_CONFIG: Record<string, { label: string; emoji: string }> = {
  english: { label: 'English', emoji: '📚' },
  mathematics: { label: 'Mathematics', emoji: '🔢' },
  science: { label: 'Science', emoji: '🔬' },
  hass: { label: 'HASS', emoji: '🌏' },
  arts: { label: 'Arts', emoji: '🎨' },
  technologies: { label: 'Technologies', emoji: '⚙️' },
  hpe: { label: 'HPE', emoji: '🏃' },
  languages: { label: 'Languages', emoji: '🗣️' },
};

const ALL_SUBJECTS = Object.keys(SUBJECT_CONFIG);

export default function ReportPage() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/learners').then((r) => r.json()),
      fetch('/api/settings').then((r) => r.json()),
    ]).then(([l, s]) => {
      if (Array.isArray(l) && l.length > 0) {
        setLearners(l);
        setSelectedLearnerId(l[0].id);
      }
      setSettings(s);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedLearnerId) return;
    fetch(`/api/entries?learnerId=${selectedLearnerId}`)
      .then((r) => r.json())
      .then((data) => setEntries(Array.isArray(data) ? data : []));
  }, [selectedLearnerId]);

  // Timeline
  const reportDueDate = settings?.heuNextReportDate ? new Date(settings.heuNextReportDate) : null;
  const registrationDate = settings?.createdAt ? new Date(settings.createdAt) : new Date();
  const today = new Date();
  const daysUntilDue = reportDueDate ? differenceInDays(reportDueDate, today) : null;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const timelineProgress = useMemo(() => {
    if (!reportDueDate) return 0;
    const totalDays = differenceInDays(reportDueDate, registrationDate);
    const elapsed = differenceInDays(today, registrationDate);
    if (totalDays <= 0) return 100;
    return Math.min(Math.max((elapsed / totalDays) * 100, 0), 100);
  }, [reportDueDate, registrationDate]);

  // Subject coverage
  const subjectCoverage = useMemo(() => {
    const counts: Record<string, number> = {};
    ALL_SUBJECTS.forEach((s) => (counts[s] = 0));
    entries.forEach((e) => {
      e.subjects?.forEach((s) => {
        if (s in counts) counts[s]++;
      });
    });
    const total = entries.length || 1;
    return ALL_SUBJECTS.map((key) => ({
      key,
      ...SUBJECT_CONFIG[key],
      count: counts[key],
      pct: Math.round((counts[key] / total) * 100),
    }));
  }, [entries]);

  const coveredSubjects = subjectCoverage.filter((s) => s.count > 0).length;

  // Posture
  const posture = useMemo(() => {
    if (coveredSubjects >= 6 && entries.length >= 5)
      return { label: 'On Track', color: 'bg-sage/15 text-sage border-sage/30' };
    if (coveredSubjects >= 4 || entries.length >= 3)
      return { label: 'Needs Attention', color: 'bg-ember-glow text-ember border-ember/30' };
    return { label: 'At Risk', color: 'bg-child-rose/15 text-child-rose border-child-rose/30' };
  }, [coveredSubjects, entries.length]);

  // Work samples
  const evidenceEntries = useMemo(() => {
    return entries.filter((e) => e.evidenceUrls && e.evidenceUrls.length > 0);
  }, [entries]);

  // Gap analysis
  const gaps = useMemo(() => {
    return subjectCoverage.filter((s) => s.count <= 1);
  }, [subjectCoverage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4xl">
        <p className="font-sans text-sm text-text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-md py-lg">
      <h1 className="font-serif text-2xl font-semibold text-text-primary mb-md">HEU Compliance Report</h1>

      <ChildSelector learners={learners} selectedId={selectedLearnerId} onChange={setSelectedLearnerId} />

      {/* Timeline Hero */}
      <div className="mt-lg rounded-lg border border-border-subtle bg-surface-raised p-xl shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between mb-md">
          <span className="font-sans text-xs text-text-muted">
            Registered {format(registrationDate, 'd MMM yyyy')}
          </span>
          {reportDueDate && (
            <span className="font-sans text-xs text-ember font-medium">
              Due {format(reportDueDate, 'd MMM yyyy')}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative h-[6px] rounded-full bg-surface-hover overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-ember transition-all duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ width: `${timelineProgress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-[14px] w-[14px] rounded-full bg-ember shadow-[var(--shadow-glow)] border-2 border-surface-raised transition-all duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{ left: `${timelineProgress}%`, marginLeft: '-7px' }}
          />
        </div>

        {/* Countdown */}
        {daysUntilDue !== null && (
          <div className={`text-center mt-lg ${daysUntilDue <= 30 ? 'animate-pulse' : ''}`}>
            <p className={`font-sans text-4xl font-semibold ${isOverdue ? 'text-child-rose' : 'text-text-primary'}`}>
              {Math.abs(daysUntilDue)}
            </p>
            <p className={`font-sans text-sm ${isOverdue ? 'text-child-rose' : 'text-text-secondary'}`}>
              {isOverdue ? 'days overdue' : 'days until report due'}
            </p>
          </div>
        )}
      </div>

      {/* Overall Posture */}
      <div className="mt-lg rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-md mb-md">
          <h2 className="font-serif text-lg font-semibold text-text-primary">Overall Posture</h2>
          <span className={`rounded-full border px-md py-xs font-sans text-xs font-semibold ${posture.color}`}>
            {posture.label}
          </span>
        </div>
        <p className="font-serif text-sm text-text-secondary leading-relaxed">
          {posture.label === 'On Track'
            ? `Good coverage across ${coveredSubjects} of 8 subject areas with ${entries.length} logged entries. Evidence is building well for the next HEU report.`
            : posture.label === 'Needs Attention'
              ? `You have ${entries.length} entries covering ${coveredSubjects} of 8 subject areas. Consider logging activities in underrepresented areas to strengthen your portfolio.`
              : `Limited evidence so far with ${entries.length} entries across ${coveredSubjects} subject areas. Regular logging will help build a strong portfolio for your HEU report.`}
        </p>
      </div>

      {/* Curriculum Coverage Grid */}
      <div className="mt-lg">
        <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">Curriculum Coverage</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm">
          {subjectCoverage.map((s) => {
            const avg = entries.length / ALL_SUBJECTS.length;
            const aboveAvg = s.count >= avg;
            return (
              <div
                key={s.key}
                className="rounded-lg border border-border-subtle bg-surface-panel p-md shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-center gap-sm mb-sm">
                  <span className="text-lg">{s.emoji}</span>
                  <span className="font-serif text-sm font-semibold text-text-primary">{s.label}</span>
                </div>
                <p className="font-sans text-xs text-text-muted mb-sm">
                  {s.count} {s.count === 1 ? 'entry' : 'entries'}
                </p>
                <div className="h-[4px] rounded-full bg-surface-hover overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-[600ms] ${aboveAvg ? 'bg-sage' : 'bg-text-muted'}`}
                    style={{ width: `${Math.min(s.pct, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Work Sample Status */}
      <div className="mt-lg rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-[var(--shadow-soft)]">
        <h2 className="font-serif text-lg font-semibold text-text-primary mb-sm">Work Samples</h2>
        <p className="font-sans text-sm text-text-secondary mb-md">
          <span className={evidenceEntries.length >= 6 ? 'text-sage font-semibold' : 'text-ember font-semibold'}>
            {evidenceEntries.length}
          </span>{' '}
          of 6 collected
        </p>

        {evidenceEntries.length > 0 ? (
          <div className="space-y-sm">
            {evidenceEntries.slice(0, 6).map((e) => (
              <div key={e.id} className="flex items-center gap-sm rounded-md border border-border-subtle bg-surface-raised p-sm">
                <span className="font-serif text-sm text-text-primary flex-1 truncate">{e.title}</span>
                <span className="font-sans text-[10px] text-text-muted">{format(new Date(e.dateOccurred), 'd MMM')}</span>
                {e.subjects?.slice(0, 2).map((s) => (
                  <span key={s} className="font-sans text-[10px] text-text-muted bg-surface-hover rounded px-xs py-[1px]">
                    {SUBJECT_CONFIG[s]?.label ?? s}
                  </span>
                ))}
              </div>
            ))}
          </div>
        ) : null}

        {evidenceEntries.length < 6 && (
          <div className="mt-sm rounded-md border border-dashed border-border-medium bg-surface-raised p-sm text-center">
            <p className="font-serif text-sm text-text-muted">
              {6 - evidenceEntries.length} more {evidenceEntries.length === 5 ? 'sample' : 'samples'} needed
            </p>
          </div>
        )}
      </div>

      {/* Gap Analysis */}
      {gaps.length > 0 && (
        <div className="mt-lg rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-[var(--shadow-soft)]">
          <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">Areas to Explore</h2>
          <div className="space-y-sm">
            {gaps.map((g) => (
              <div key={g.key} className="flex items-center gap-sm">
                <span className="text-lg">{g.emoji}</span>
                <span className="font-serif text-sm text-text-primary">{g.label}</span>
                <span className="font-sans text-xs text-text-muted">
                  {g.count === 0 ? 'No evidence logged yet' : `Only ${g.count} entry`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="mt-lg">
        <button
          disabled
          className="rounded-md bg-surface-raised px-lg py-sm font-sans text-sm font-semibold text-text-muted cursor-not-allowed opacity-50"
          title="Coming Soon"
        >
          Export Report (Coming Soon)
        </button>
      </div>
    </div>
  );
}
