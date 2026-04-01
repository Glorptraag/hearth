'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';
import { ChildSelector } from '@/components/ui/child-selector';
import { usePedagogy } from '@/hooks/use-pedagogy';

type Learner = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  shapeIcon: string | null;
  colourToken: string | null;
};

type AiEnrichment = {
  capability_threads?: { thread_id: string; confidence: number }[];
  curriculum_descriptors?: { code: string; confidence: number }[];
  subjects_detected?: string[];
  confidence?: number;
} | null;

type Entry = {
  id: string;
  title: string;
  dateOccurred: string;
  subjects: string[] | null;
  learnerIds: string[] | null;
  evidenceUrls: string[] | null;
  aiEnrichment: AiEnrichment;
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

// Map AC9 curriculum descriptor code prefixes to subject keys
const AC9_SUBJECT_MAP: Record<string, string> = {
  AC9E: 'english',
  AC9M: 'mathematics',
  AC9S: 'science',
  AC9HAS: 'hass',
  AC9HI: 'hass',
  AC9GE: 'hass',
  AC9CI: 'hass',
  AC9EB: 'hass',
  AC9AR: 'arts',
  AC9MU: 'arts',
  AC9DR: 'arts',
  AC9DA: 'arts',
  AC9MA: 'arts',
  AC9TD: 'technologies',
  AC9TDI: 'technologies',
  AC9HP: 'hpe',
  AC9LA: 'languages',
};

const SUBJECT_DOMAIN_CLASSES: Record<string, { bar: string; pill: string; border: string }> = {
  english:      { bar: 'bg-domain-english',      pill: 'bg-domain-english/15 text-domain-english',           border: 'border-t-domain-english' },
  mathematics:  { bar: 'bg-domain-mathematics',  pill: 'bg-domain-mathematics/15 text-domain-mathematics',   border: 'border-t-domain-mathematics' },
  science:      { bar: 'bg-domain-science',       pill: 'bg-domain-science/15 text-domain-science',           border: 'border-t-domain-science' },
  hass:         { bar: 'bg-domain-hass',          pill: 'bg-domain-hass/15 text-domain-hass',                 border: 'border-t-domain-hass' },
  arts:         { bar: 'bg-domain-arts',          pill: 'bg-domain-arts/15 text-domain-arts',                 border: 'border-t-domain-arts' },
  technologies: { bar: 'bg-domain-technologies',  pill: 'bg-domain-technologies/15 text-domain-technologies', border: 'border-t-domain-technologies' },
  hpe:          { bar: 'bg-domain-hpe',           pill: 'bg-domain-hpe/15 text-domain-hpe',                   border: 'border-t-domain-hpe' },
  languages:    { bar: 'bg-domain-languages',     pill: 'bg-domain-languages/15 text-domain-languages',       border: 'border-t-domain-languages' },
};

type WorkSampleSlot = {
  id: number;
  area: string;
  altArea?: string;
  areaLabel: string;
  label: string;
  timing: string;
  termHalf: 'early' | 'late';
};

const WORK_SAMPLE_SLOTS: WorkSampleSlot[] = [
  { id: 1, area: 'english',     areaLabel: 'English',        label: 'Early Writing', timing: 'Term 1–2 · Jan–Jun', termHalf: 'early' },
  { id: 2, area: 'english',     areaLabel: 'English',        label: 'Later Writing', timing: 'Term 3–4 · Jul–Dec', termHalf: 'late'  },
  { id: 3, area: 'mathematics', areaLabel: 'Mathematics',    label: 'Early Maths',   timing: 'Term 1–2 · Jan–Jun', termHalf: 'early' },
  { id: 4, area: 'mathematics', areaLabel: 'Mathematics',    label: 'Later Maths',   timing: 'Term 3–4 · Jul–Dec', termHalf: 'late'  },
  { id: 5, area: 'science',     areaLabel: 'Science / HASS', label: 'Early Choice',  timing: 'Term 1–2 · Jan–Jun', termHalf: 'early', altArea: 'hass' },
  { id: 6, area: 'science',     areaLabel: 'Science / HASS', label: 'Later Choice',  timing: 'Term 3–4 · Jul–Dec', termHalf: 'late',  altArea: 'hass' },
];

const SLOT_STATUS = {
  complete: { dot: 'bg-sage shadow-[0_0_6px_rgba(74,222,128,0.5)]',        badge: 'bg-sage/15 text-sage',            label: 'Complete', action: 'Review sample', href: '/our-story/portfolio' },
  partial:  { dot: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]',   badge: 'bg-amber-400/15 text-amber-400',  label: 'Partial',  action: 'Add evidence',   href: '/log' },
  empty:    { dot: 'bg-surface-hover',                                       badge: 'bg-surface-hover text-text-muted', label: 'Empty',    action: 'Find activity',  href: '' },
};

const GAP_ACTIONS: Record<string, string> = {
  english:      'Log a reading, writing, or language activity',
  mathematics:  'Record a counting, measuring, or pattern activity',
  science:      'Capture a nature study or experiment',
  hass:         'Document a history, geography, or civics moment',
  arts:         'Log a drawing, craft, music, or performance activity',
  technologies: 'Note a building, coding, or design activity',
  hpe:          'Record a sport, movement, or health discussion',
  languages:    'Log any second-language exposure or practice',
};

function descriptorToSubject(code: string): string | null {
  for (const [prefix, subject] of Object.entries(AC9_SUBJECT_MAP)) {
    if (code.startsWith(prefix)) return subject;
  }
  return null;
}

export default function ReportPage() {
  const { vocab } = usePedagogy();
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
  const dueDateStr = settings?.heuNextReportDate ?? null;
  const registeredStr = settings?.createdAt ?? null;
  const today = new Date();
  const registrationDate = registeredStr ? new Date(registeredStr) : today;
  const reportDueDate = dueDateStr ? new Date(dueDateStr) : null;
  const daysUntilDue = reportDueDate ? differenceInDays(reportDueDate, today) : null;
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const timelineProgress = useMemo(() => {
    if (!dueDateStr) return 0;
    const due = new Date(dueDateStr);
    const registered = registeredStr ? new Date(registeredStr) : new Date();
    const now = new Date();
    const totalDays = differenceInDays(due, registered);
    const elapsed = differenceInDays(now, registered);
    if (totalDays <= 0) return 100;
    return Math.min(Math.max((elapsed / totalDays) * 100, 0), 100);
  }, [dueDateStr, registeredStr]);

  // Subject coverage
  const subjectCoverage = useMemo(() => {
    const entryCounts: Record<string, number> = {};
    const descriptorSets: Record<string, Set<string>> = {};
    ALL_SUBJECTS.forEach((s) => {
      entryCounts[s] = 0;
      descriptorSets[s] = new Set();
    });

    entries.forEach((e) => {
      const subjects = new Set([
        ...(e.subjects ?? []),
        ...(e.aiEnrichment?.subjects_detected ?? []).map((s) => s.toLowerCase()),
      ]);
      subjects.forEach((s) => {
        if (s in entryCounts) entryCounts[s]++;
      });
      e.aiEnrichment?.curriculum_descriptors?.forEach((d) => {
        const subj = descriptorToSubject(d.code);
        if (subj && descriptorSets[subj]) {
          descriptorSets[subj].add(d.code);
        }
      });
    });

    const total = entries.length || 1;
    return ALL_SUBJECTS.map((key) => ({
      key,
      ...SUBJECT_CONFIG[key],
      count: entryCounts[key],
      descriptors: descriptorSets[key].size,
      pct: Math.round((entryCounts[key] / total) * 100),
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

  // Work sample slots — match entries to 6 QHE slots
  const workSampleSlots = useMemo(() => {
    const reportYear = reportDueDate?.getFullYear() ?? today.getFullYear();

    return WORK_SAMPLE_SLOTS.map((slot) => {
      const candidates = entries.filter((e) => {
        const d = new Date(e.dateOccurred + 'T00:00:00');
        if (d.getFullYear() !== reportYear) return false;
        const month = d.getMonth() + 1;
        const inHalf = slot.termHalf === 'early' ? month <= 6 : month >= 7;
        if (!inHalf) return false;
        const subjectSet = new Set([
          ...(e.subjects ?? []),
          ...(e.aiEnrichment?.subjects_detected ?? []).map((s) => s.toLowerCase()),
        ]);
        return subjectSet.has(slot.area) || (slot.altArea ? subjectSet.has(slot.altArea) : false);
      });

      candidates.sort((a, b) => {
        const aHasEvidence = (a.evidenceUrls?.length ?? 0) > 0;
        const bHasEvidence = (b.evidenceUrls?.length ?? 0) > 0;
        if (aHasEvidence !== bHasEvidence) return aHasEvidence ? -1 : 1;
        return new Date(b.dateOccurred).getTime() - new Date(a.dateOccurred).getTime();
      });

      const match = candidates[0] ?? null;
      const status: 'complete' | 'partial' | 'empty' = match
        ? (match.evidenceUrls?.length ?? 0) > 0 ? 'complete' : 'partial'
        : 'empty';

      return { ...slot, matchedEntry: match, status };
    });
  }, [entries, reportDueDate]);

  const completedSlots = workSampleSlots.filter((s) => s.status === 'complete').length;

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

      {entries.length === 0 && (
        <div className="mt-lg rounded-lg border border-border-subtle bg-surface-panel p-xl text-center">
          <span className="text-3xl block mb-sm">📋</span>
          <h2 className="font-serif text-base font-semibold text-text-primary mb-xs">Your report builds automatically</h2>
          <p className="font-serif text-sm text-text-secondary leading-relaxed max-w-md mx-auto">
            As you log learning moments, Hearth tracks subject coverage, maps curriculum descriptors,
            and assembles your HEU compliance evidence. Start logging to see your report take shape.
          </p>
        </div>
      )}

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
          <div>
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">Compliance Status</p>
            <h2 className="font-serif text-lg font-semibold text-text-primary">Overall Posture</h2>
          </div>
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

      {/* Required Work Samples Grid */}
      <div className="mt-lg">
        <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">Evidence</p>
        <div className="flex items-center justify-between mb-md">
          <h2 className="font-serif text-lg font-semibold text-text-primary">Required Work Samples</h2>
          <span className="font-sans text-sm text-text-secondary">
            <span className={completedSlots >= 6 ? 'text-sage font-semibold' : 'text-ember font-semibold'}>
              {completedSlots}
            </span>
            {' '}of 6 complete
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
          {workSampleSlots.map((slot) => {
            const statusStyle = SLOT_STATUS[slot.status];
            const domain = SUBJECT_DOMAIN_CLASSES[slot.area];
            const actionHref = slot.status === 'empty'
              ? `/explore/activities?subject=${slot.area}`
              : statusStyle.href;
            return (
              <div
                key={slot.id}
                className={`relative rounded-lg border-t-2 border border-border-subtle bg-surface-raised p-md ${domain?.border ?? 'border-t-border-medium'}`}
              >
                <div className="flex items-center justify-between mb-sm">
                  <span className={`rounded-full px-sm py-[2px] font-sans text-[10px] font-semibold ${domain?.pill ?? 'bg-surface-hover text-text-muted'}`}>
                    {slot.areaLabel}
                  </span>
                  <span className={`h-[8px] w-[8px] rounded-full ${statusStyle.dot}`} />
                </div>

                <p className="font-serif text-sm font-semibold text-text-primary">{slot.label}</p>
                <p className="font-sans text-[10px] text-text-muted mt-[2px]">{slot.timing}</p>

                <span className={`inline-block mt-sm rounded-full px-sm py-[2px] font-sans text-[10px] ${statusStyle.badge}`}>
                  {statusStyle.label}
                </span>

                <p className="font-serif text-xs text-text-secondary mt-sm truncate">
                  {slot.matchedEntry ? slot.matchedEntry.title : 'No matching entry yet'}
                </p>

                <Link
                  href={actionHref}
                  className="mt-sm inline-block font-sans text-[11px] text-ember hover:text-ember-hover transition-colors duration-200"
                >
                  {statusStyle.action} →
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Curriculum Coverage */}
      <div className="mt-lg">
        <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">Subject Areas</p>
        <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">Curriculum Coverage</h2>
        <div className="rounded-lg border border-border-subtle bg-surface-panel overflow-hidden divide-y divide-border-subtle">
          {subjectCoverage.map((s) => {
            const domain = SUBJECT_DOMAIN_CLASSES[s.key];
            return (
              <div key={s.key} className="flex items-center gap-md px-md py-sm">
                <div className="flex items-center gap-sm w-[140px] shrink-0">
                  <span className="text-base">{s.emoji}</span>
                  <span className="font-serif text-sm font-semibold text-text-primary">{s.label}</span>
                </div>
                <div className="flex-1 h-[6px] rounded-full bg-surface-hover overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-[600ms] ${domain?.bar ?? 'bg-text-muted'}`}
                    style={{ width: `${Math.min(s.pct, 100)}%` }}
                  />
                </div>
                <div className="text-right w-[80px] shrink-0">
                  <span className="font-sans text-xs text-text-primary font-semibold">{s.count}</span>
                  <span className="font-sans text-[10px] text-text-muted"> entries</span>
                  {s.descriptors > 0 && (
                    <p className="font-sans text-[10px] text-text-muted">{s.descriptors} CDs</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gap Analysis */}
      {gaps.length > 0 && (
        <div className="mt-lg rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-[var(--shadow-soft)]">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">{vocab.coverageFrame}</p>
          <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">Areas to Explore</h2>
          <div className="space-y-xs">
            {gaps.map((g) => {
              const isCritical = g.count === 0;
              return (
                <div
                  key={g.key}
                  className={`flex items-center gap-md rounded-lg border px-md py-sm ${
                    isCritical
                      ? 'border-child-rose/30 bg-child-rose/5'
                      : 'border-amber-400/20 bg-amber-400/5'
                  }`}
                >
                  <span className={`font-sans text-[10px] font-semibold uppercase tracking-wide shrink-0 ${
                    isCritical ? 'text-child-rose' : 'text-amber-400'
                  }`}>
                    {isCritical ? 'Critical' : 'Moderate'}
                  </span>
                  <span className="text-base shrink-0">{g.emoji}</span>
                  <span className="font-serif text-sm font-semibold text-text-primary flex-1">{g.label}</span>
                  <p className="font-sans text-xs text-text-muted hidden sm:block max-w-[200px] text-right">
                    {GAP_ACTIONS[g.key] ?? 'Log an activity in this area'}
                  </p>
                  <Link
                    href={`/explore/activities?subject=${g.key}`}
                    className="font-sans text-[11px] text-ember hover:text-ember-hover transition-colors duration-200 shrink-0"
                  >
                    Explore →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommended Modules */}
      {gaps.length > 0 && (
        <div className="mt-lg">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">Suggested Next Steps</p>
          <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">Recommended Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
            {gaps.slice(0, 3).map((g, i) => {
              const tagLabel = i === 0 ? 'Fills biggest gap' : i === 1 ? 'Quick win' : 'Natural fit';
              const tagColor = i === 0 ? 'bg-child-rose/15 text-child-rose' : i === 1 ? 'bg-sage/15 text-sage' : 'bg-ember-glow text-ember';
              return (
                <div
                  key={g.key}
                  className="relative rounded-lg border border-border-subtle bg-surface-panel p-md overflow-hidden"
                >
                  <div className="absolute left-0 right-0 top-0 h-[2px] bg-ember opacity-60" />
                  <span className={`inline-block rounded-full px-sm py-[2px] font-sans text-[10px] font-semibold mb-sm ${tagColor}`}>
                    {tagLabel}
                  </span>
                  <div className="flex items-center gap-sm mb-sm">
                    <span className="text-xl">{g.emoji}</span>
                    <span className="font-serif text-sm font-semibold text-text-primary">{g.label}</span>
                  </div>
                  <p className="font-sans text-xs text-text-muted mb-md">
                    {g.count === 0 ? 'No entries yet' : `Only ${g.count} entr${g.count === 1 ? 'y' : 'ies'} logged`}
                  </p>
                  <Link
                    href={`/explore/activities?subject=${g.key}`}
                    className="font-sans text-xs font-semibold text-ember hover:text-ember-hover transition-colors duration-200"
                  >
                    Browse Activities →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="mt-lg">
        <button
          onClick={() => {
            if (!selectedLearnerId) return;
            window.open(`/api/report/export?learnerId=${selectedLearnerId}`, '_blank');
          }}
          disabled={!selectedLearnerId || entries.length === 0}
          className={`rounded-md px-lg py-sm font-sans text-sm font-semibold transition-all duration-200 ${
            selectedLearnerId && entries.length > 0
              ? 'bg-ember text-text-inverse hover:bg-ember-hover shadow-[0_4px_16px_rgba(217,123,58,0.3)]'
              : 'bg-surface-raised text-text-muted cursor-not-allowed opacity-50'
          }`}
        >
          Export PDF for HEU
        </button>
        {entries.length === 0 && (
          <p className="font-sans text-xs text-text-muted mt-xs">Log some entries first to generate a report.</p>
        )}
      </div>
    </div>
  );
}
