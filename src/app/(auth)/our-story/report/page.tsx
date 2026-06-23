'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { format, differenceInDays } from 'date-fns';
import { ChildSelector } from '@/components/ui/child-selector';
import { usePedagogy } from '@/hooks/use-pedagogy';
import EmptyState from '@/components/ui/EmptyState';
import {
  FileText,
  BookOpenText, MathOperations, Atom, Globe, Palette, Cpu, PersonSimpleRun, ChatsCircle,
  Check,
} from '@/components/icons';
import type { ComponentType } from 'react';

type ReportIconC = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;
import WorkSampleCuration from '@/components/report/WorkSampleCuration';
import ProgressionConnector from '@/components/report/ProgressionConnector';
import CoverageInContext from '@/components/report/CoverageInContext';
import { getJurisdiction } from '@/config/jurisdictions';
import { track } from '@/lib/analytics/posthog';
import { descriptorToSubject } from '@/lib/report/deterministic-coverage';
import { resolveScreenSlots } from '@/lib/report/export-slots';
import { reportEditedSinceExport } from '@/lib/report/staleness';
import { buildCoverageNarrative, derivePosture, POSTURE_LABEL, type CoverageResponse } from '@/lib/report/coverage-narrative';

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
  description: string | null;
  subjects: string[] | null;
  learnerIds: string[] | null;
  evidenceUrls: string[] | null;
  aiEnrichment: AiEnrichment;
  workSampleCandidate: boolean | null;
  workSampleQuality: number | null;
  status: string;
  source: string;
  updatedAt: string | null;
};

type ReportData = {
  id: string;
  learnerId: string;
  reportYear: number;
  status: string;
  lastExportedAt: string | null;
  choiceArea: string | null;
  samples: WorkSampleData[];
};

type WorkSampleData = {
  id: string;
  reportId: string;
  slot: string;
  entryId: string | null;
  status: string;
  updatedAt: string | null;
  annotation: {
    id: string;
    observations: string | null;
    observationsSource: string | null;
    needsStrengths: string | null;
    needsStrengthsSource: string | null;
    adjustment: string | null;
    adjustmentSource: string | null;
    planning: string | null;
    planningSource: string | null;
    progressionSummary: string | null;
    progressionSummaryEdited: boolean | null;
    confirmedAt: string | null;
    updatedAt: string | null;
  } | null;
};

type Settings = {
  nextReportDate: string | null;
  registrationNumber: string | null;
  state: string | null;
  createdAt: string;
};

const SUBJECT_CONFIG: Record<string, { label: string; Icon: ReportIconC }> = {
  english:      { label: 'English',      Icon: BookOpenText },
  mathematics:  { label: 'Mathematics',  Icon: MathOperations },
  science:      { label: 'Science',      Icon: Atom },
  hass:         { label: 'HASS',         Icon: Globe },
  arts:         { label: 'Arts',         Icon: Palette },
  technologies: { label: 'Technologies', Icon: Cpu },
  hpe:          { label: 'HPE',          Icon: PersonSimpleRun },
  languages:    { label: 'Languages',    Icon: ChatsCircle },
};

const ALL_SUBJECTS = Object.keys(SUBJECT_CONFIG);
const SUBJECT_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(SUBJECT_CONFIG).map(([key, { label }]) => [key, label]),
);

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
  slotKey: string;
  area: string;
  altArea?: string;
  areaLabel: string;
  label: string;
  timing: string;
  termHalf: 'early' | 'late';
};

const WORK_SAMPLE_SLOTS: WorkSampleSlot[] = [
  { id: 1, slotKey: 'early_writing', area: 'english',     areaLabel: 'English',        label: 'Early Writing', timing: 'Term 1–2 · Jan–Jun', termHalf: 'early' },
  { id: 2, slotKey: 'later_writing', area: 'english',     areaLabel: 'English',        label: 'Later Writing', timing: 'Term 3–4 · Jul–Dec', termHalf: 'late'  },
  { id: 3, slotKey: 'early_maths',   area: 'mathematics', areaLabel: 'Mathematics',    label: 'Early Maths',   timing: 'Term 1–2 · Jan–Jun', termHalf: 'early' },
  { id: 4, slotKey: 'later_maths',   area: 'mathematics', areaLabel: 'Mathematics',    label: 'Later Maths',   timing: 'Term 3–4 · Jul–Dec', termHalf: 'late'  },
  { id: 5, slotKey: 'early_choice',  area: 'science',     areaLabel: 'Science / HASS', label: 'Early Choice',  timing: 'Term 1–2 · Jan–Jun', termHalf: 'early', altArea: 'hass' },
  { id: 6, slotKey: 'later_choice',  area: 'science',     areaLabel: 'Science / HASS', label: 'Later Choice',  timing: 'Term 3–4 · Jul–Dec', termHalf: 'late',  altArea: 'hass' },
];

const SLOT_STATUS = {
  complete: { dot: 'bg-sage shadow-[0_0_6px_rgba(123,191,138,0.50)]',        badge: 'bg-sage/15 text-sage',            label: 'Complete', action: 'Review sample', href: '/our-story/portfolio' },
  partial:  { dot: 'bg-amber-status shadow-[0_0_6px_rgba(224,181,105,0.50)]',   badge: 'bg-amber-status/15 text-amber-status',  label: 'Partial',  action: 'Add evidence',   href: '/log' },
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

export default function ReportPage() {
  const { vocab } = usePedagogy();
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [curationSlot, setCurationSlot] = useState<WorkSampleSlot | null>(null);
  // Deterministic curriculum coverage (WS-5). `null` until fetched, or whenever
  // the framework has no authored mappings → render stays exactly as today.
  const [coverage, setCoverage] = useState<CoverageResponse | null>(null);

  const config = useMemo(() => getJurisdiction(settings?.state ?? null), [settings?.state]);
  const isCdLevel = config.reportTier === 'cd_level';

  // Ensure report exists for this learner + year
  const ensureReport = useCallback(async (learnerId: string) => {
    const year = new Date().getFullYear();
    const res = await fetch(`/api/report?learnerId=${learnerId}&year=${year}`);
    let data = await res.json();
    if (!data) {
      // Create report + 6 empty slots
      const createRes = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learnerId, year }),
      });
      data = await createRes.json();
    }
    // Fetch samples with annotations
    if (data?.id) {
      const samplesRes = await fetch(`/api/report/${data.id}/samples`);
      const samples = await samplesRes.json();
      data.samples = Array.isArray(samples) ? samples : [];
    }
    setReport(data);
  }, []);

  const refreshReport = useCallback(() => {
    if (selectedLearnerId) ensureReport(selectedLearnerId);
  }, [selectedLearnerId, ensureReport]);

  useEffect(() => {
    // Guarded: a 5xx from either endpoint must NOT crash the page via
    // JSON-parse SyntaxError. See incident 2026-05-25 (unrun migration 0016).
    Promise.all([
      fetch('/api/learners')
        .then((r) => (r.ok ? r.json() : Promise.resolve(null)))
        .catch(() => null),
      fetch('/api/settings')
        .then((r) => (r.ok ? r.json() : Promise.resolve(null)))
        .catch(() => null),
    ]).then(([l, s]) => {
      if (Array.isArray(l) && l.length > 0) {
        setLearners(l);
        setSelectedLearnerId(l[0].id);
      }
      if (s) setSettings(s);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedLearnerId) return;
    fetch(`/api/entries?learnerId=${selectedLearnerId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`entries ${r.status}`))))
      .then((data) => {
        setEntries(Array.isArray(data) ? data : []);
        ensureReport(selectedLearnerId);
      })
      .catch(() => {
        // Still try to render the report shell with no entries so the page
        // doesn't white-screen on a 5xx from /api/entries.
        setEntries([]);
        ensureReport(selectedLearnerId);
      });
  }, [selectedLearnerId, ensureReport]);

  // Deterministic coverage (WS-5). Only a deterministic response is retained;
  // a fallback response, a non-ok status, or any error leaves coverage null, so
  // the page renders exactly today's LLM-derived curriculum coverage.
  useEffect(() => {
    if (!selectedLearnerId) return;
    setCoverage(null);
    fetch(`/api/report/coverage?learnerId=${selectedLearnerId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: CoverageResponse | null) => {
        setCoverage(data && data.mode === 'deterministic' ? data : null);
      })
      .catch(() => setCoverage(null));
  }, [selectedLearnerId]);

  // Timeline
  const dueDateStr = settings?.nextReportDate ?? null;
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
    // When deterministic coverage is available, curriculum codes come from the
    // DLO→framework mapping; otherwise fall back to LLM-recalled descriptors.
    const deterministic = coverage?.mode === 'deterministic' ? coverage.coverage : null;
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
      if (!deterministic) {
        e.aiEnrichment?.curriculum_descriptors?.forEach((d) => {
          const subj = descriptorToSubject(d.code);
          if (subj && descriptorSets[subj]) {
            descriptorSets[subj].add(d.code);
          }
        });
      }
    });

    const total = entries.length || 1;
    return ALL_SUBJECTS.map((key) => ({
      key,
      ...SUBJECT_CONFIG[key],
      count: entryCounts[key],
      descriptors: deterministic
        ? (deterministic[key]?.codes.length ?? 0)
        : descriptorSets[key].size,
      pct: Math.round((entryCounts[key] / total) * 100),
    }));
  }, [entries, coverage]);

  const coveredSubjects = subjectCoverage.filter((s) => s.count > 0).length;

  // Posture — assume-good-faith wording (shared derivePosture/POSTURE_LABEL with
  // the export PDF). Colours stay here (UI only): no ember on a status badge, no
  // child-rose alarm at the highest-anxiety Stage-4 moment.
  const posture = useMemo(() => {
    const key = derivePosture(coveredSubjects, entries.length);
    const color =
      key === 'established' ? 'bg-sage/15 text-sage border-sage/30'
      : key === 'building' ? 'bg-amber-status/15 text-amber-status border-amber-status/30'
      : 'bg-surface-hover text-text-secondary border-border-subtle';
    return { key, label: POSTURE_LABEL[key], color };
  }, [coveredSubjects, entries.length]);

  // Report year for sample matching
  const reportYear = useMemo(() => {
    return dueDateStr ? new Date(dueDateStr).getFullYear() : new Date().getFullYear();
  }, [dueDateStr]);

  // Work sample slots — persisted-only (lib/report/export-slots → resolveScreenSlots):
  // a slot is filled solely from its selected DB entry, never a date/subject
  // auto-match, so the on-screen report matches the exported PDF — an unfilled
  // slot reads "Empty" in both. (The earlier auto-match fallback diverged from
  // the persisted-only export and could show an entry the parent never chose.)
  const workSampleSlots = useMemo(
    () => resolveScreenSlots(WORK_SAMPLE_SLOTS, report?.samples ?? [], entries),
    [entries, report?.samples],
  );

  // "Edited since export": stale when any content (samples, their annotations,
  // or the underlying entries) changed after the last export. Excludes the
  // report row's own updatedAt — the export PATCH bumps it alongside
  // lastExportedAt, which would otherwise read as permanently stale.
  const editedSinceExport = useMemo(() => {
    const samples = report?.samples ?? [];
    return reportEditedSinceExport(report?.lastExportedAt, [
      ...samples.map((s) => s.updatedAt),
      ...samples.map((s) => s.annotation?.updatedAt ?? null),
      ...entries.map((e) => e.updatedAt),
    ]);
  }, [report?.samples, report?.lastExportedAt, entries]);

  const completedSlots = workSampleSlots.filter((s) => s.status === 'complete').length;

  // Confirmed work samples — a real, earned signal for the coverage-in-context panel.
  const confirmedWorkSamples = useMemo(
    () => (report?.samples ?? []).filter((s) => s.annotation?.confirmedAt).length,
    [report?.samples],
  );

  // Humane coverage framing (B6): pairs the formal mapped figure with the real
  // activity behind it so a sparse-but-honest report never reads "you did
  // nothing" at the Stage-4 compliance event.
  const coverageNarrative = useMemo(
    () =>
      buildCoverageNarrative({
        entries,
        coverage,
        confirmedWorkSamples,
        subjectKeys: ALL_SUBJECTS,
      }),
    [entries, coverage, confirmedWorkSamples],
  );

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
      <h1 className="font-serif text-2xl font-semibold text-text-primary mb-md">{config.reportScreenTitle}</h1>

      <ChildSelector learners={learners} selectedId={selectedLearnerId} onChange={setSelectedLearnerId} />

      {entries.length === 0 && (
        <div className="mt-lg">
          <EmptyState
            icon={FileText}
            heading="Your report builds automatically"
            body="As you log learning moments, Hearth tracks subject coverage, maps curriculum descriptors, and assembles your report automatically. Start logging to see your report take shape."
          />
        </div>
      )}

      {/* Timeline Hero */}
      <div className="mt-lg rounded-lg border border-border-subtle bg-surface-raised p-xl shadow-card">
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

        <div
          className="relative h-[6px] rounded-full bg-surface-hover overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(timelineProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Report timeline progress"
        >
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-ember transition-all duration-[1200ms] ease-[var(--ease-default)]"
            style={{ width: `${timelineProgress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-[14px] w-[14px] rounded-full bg-ember shadow-ember border-2 border-surface-raised transition-all duration-[1200ms] ease-[var(--ease-default)]"
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
      <div className="mt-lg rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-card">
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
          {posture.key === 'established'
            ? `Good breadth across ${coveredSubjects} of 8 subject areas with ${entries.length} moment${entries.length === 1 ? '' : 's'} logged. Your evidence is building beautifully for your next ${config.reviewTerminology}.`
            : posture.key === 'building'
              ? `${entries.length} moment${entries.length === 1 ? '' : 's'} logged so far across ${coveredSubjects} of 8 subject areas. Keep capturing as you go — every entry adds to the picture for your next ${config.reviewTerminology}.`
              : `You're just getting started — ${entries.length} moment${entries.length === 1 ? '' : 's'} logged so far. There's no bar to clear here: each moment you capture builds your evidence, and sparse early weeks are completely normal.`}
        </p>
      </div>

      {/* Coverage in context — keeps a sparse formal count from reading as
          "you did nothing" at the Stage-4 compliance event. Renders for both
          report tiers; adapts its copy to the family's regulator + state. */}
      {entries.length > 0 && (
        <CoverageInContext
          narrative={coverageNarrative}
          regulatorShort={config.regulatoryBodyShort}
          curriculumFramework={config.curriculumFramework}
          reviewTerminology={config.reviewTerminology}
          coverageFrame={vocab.coverageFrame}
          subjectLabels={SUBJECT_LABELS}
          isCdLevel={isCdLevel}
        />
      )}

      {/* === CD-Level Tier (QLD/SA/NT): Work Samples + Curriculum Coverage + Gap Analysis === */}
      {isCdLevel && (
        <>
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
                const isConfirmed = slot.dbSample?.annotation?.confirmedAt;
                return (
                  <button
                    key={slot.id}
                    onClick={() => setCurationSlot(slot)}
                    className={`relative rounded-lg border-t-2 border border-border-subtle bg-surface-raised p-md text-left transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:translate-y-[-2px] hover:border-border-medium hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] cursor-pointer ${domain?.border ?? 'border-t-border-medium'}`}
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
                      {isConfirmed ? <span className="inline-flex items-center gap-xs"><Check size={12} aria-hidden="true" /> Confirmed</span> : statusStyle.label}
                    </span>

                    <p className="font-serif text-xs text-text-secondary mt-sm truncate">
                      {slot.matchedEntry ? slot.matchedEntry.title : 'Empty'}
                    </p>

                    <span className="mt-sm inline-block font-sans text-[11px] text-ember hover:text-ember-hover transition-colors duration-200">
                      {slot.status === 'empty' ? 'Select sample' : slot.dbSample?.entryId ? 'Edit annotation' : 'Choose entry'} →
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progression Summaries — one per subject pair */}
          {(() => {
            const pairs: Array<{ key: 'english' | 'maths' | 'choice'; label: string; earlySlot: string; lateSlot: string }> = [
              { key: 'english', label: 'English writing', earlySlot: 'early_writing', lateSlot: 'later_writing' },
              { key: 'maths', label: 'Mathematics', earlySlot: 'early_maths', lateSlot: 'later_maths' },
              { key: 'choice', label: 'Science / HASS', earlySlot: 'early_choice', lateSlot: 'later_choice' },
            ];
            const hasAnyConfirmed = pairs.some((p) => {
              const e = report?.samples?.find((s) => s.slot === p.earlySlot);
              const l = report?.samples?.find((s) => s.slot === p.lateSlot);
              return e?.annotation?.confirmedAt || l?.annotation?.confirmedAt;
            });
            if (!hasAnyConfirmed || !report) return null;
            return (
              <div className="mt-lg">
                <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">Growth</p>
                <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">Progression Summaries</h2>
                <div className="space-y-sm">
                  {pairs.map((p) => {
                    const early = report.samples?.find((s) => s.slot === p.earlySlot);
                    const late = report.samples?.find((s) => s.slot === p.lateSlot);
                    return (
                      <ProgressionConnector
                        key={p.key}
                        reportId={report.id}
                        pair={p.key}
                        pairLabel={p.label}
                        earlyConfirmed={Boolean(early?.annotation?.confirmedAt)}
                        lateConfirmed={Boolean(late?.annotation?.confirmedAt)}
                        lateSampleId={late?.id ?? null}
                        summary={late?.annotation?.progressionSummary ?? null}
                        edited={Boolean(late?.annotation?.progressionSummaryEdited)}
                        onChanged={refreshReport}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })()}

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
                      <span className="inline-flex text-text-secondary" aria-hidden="true"><s.Icon size={16} /></span>
                      <span className="font-serif text-sm font-semibold text-text-primary">{s.label}</span>
                    </div>
                    <div
                      className="flex-1 h-[6px] rounded-full bg-surface-hover overflow-hidden"
                      role="progressbar"
                      aria-valuenow={Math.round(Math.min(s.pct, 100))}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${s.label} coverage: ${s.count} entries`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-[var(--motion-slow)] ${domain?.bar ?? 'bg-text-muted'}`}
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

          {/* Areas to Explore (opportunities — gently framed, no "Critical") */}
          {gaps.length > 0 && (
            <div className="mt-lg rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-card">
              <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">{vocab.coverageFrame}</p>
              <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">Areas to Explore</h2>
              <div className="space-y-xs">
                {gaps.map((g) => {
                  const notYetLogged = g.count === 0;
                  return (
                    <div
                      key={g.key}
                      className={`flex items-center gap-md rounded-lg border px-md py-sm ${
                        notYetLogged
                          ? 'border-border-subtle bg-surface-raised'
                          : 'border-amber-status/20 bg-amber-status/5'
                      }`}
                    >
                      <span className={`font-sans text-[10px] font-semibold uppercase tracking-wide shrink-0 ${
                        notYetLogged ? 'text-text-muted' : 'text-amber-status'
                      }`}>
                        {notYetLogged ? 'Not yet logged' : 'Light so far'}
                      </span>
                      <span className="shrink-0 inline-flex text-text-secondary" aria-hidden="true"><g.Icon size={16} /></span>
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
                  const tagLabel = i === 0 ? 'Worth a look' : i === 1 ? 'Quick win' : 'Natural fit';
                  const tagColor = i === 1 ? 'bg-sage/15 text-sage' : 'bg-surface-hover text-text-secondary';
                  const domain = SUBJECT_DOMAIN_CLASSES[g.key];
                  return (
                    <div
                      key={g.key}
                      className="relative rounded-lg border border-border-subtle bg-surface-panel p-md overflow-hidden"
                    >
                      <div className={`absolute left-0 right-0 top-0 h-[2px] ${domain?.bar ?? 'bg-border-medium'}`} />
                      <span className={`inline-block rounded-full px-sm py-[2px] font-sans text-[10px] font-semibold mb-sm ${tagColor}`}>
                        {tagLabel}
                      </span>
                      <div className="flex items-center gap-sm mb-sm">
                        <span className="inline-flex text-text-secondary" aria-hidden="true"><g.Icon size={22} /></span>
                        <span className="font-serif text-sm font-semibold text-text-primary">{g.label}</span>
                      </div>
                      <p className="font-sans text-xs text-text-muted mb-md">
                        {g.count === 0 ? 'Not yet logged' : `${g.count} logged so far`}
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
        </>
      )}

      {/* === Learning Area Tier (NSW/VIC/WA/TAS/ACT): Area Cards + Exploration Suggestions === */}
      {!isCdLevel && (
        <>
          {/* Learning Area Cards */}
          <div className="mt-lg">
            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">Learning Areas</p>
            <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">Coverage by Area</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
              {subjectCoverage.map((s) => {
                const domain = SUBJECT_DOMAIN_CLASSES[s.key];
                const strandSummary = s.descriptors > 0
                  ? `${s.descriptors} curriculum strand${s.descriptors === 1 ? '' : 's'} touched`
                  : 'No curriculum strands mapped yet';
                return (
                  <div
                    key={s.key}
                    className={`relative rounded-lg border-t-2 border border-border-subtle bg-surface-panel p-md transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:translate-y-[-2px] hover:border-border-medium hover:shadow-hover ${domain?.border ?? 'border-t-border-medium'}`}
                  >
                    <div className="flex items-center justify-between mb-sm">
                      <span className="inline-flex text-text-secondary" aria-hidden="true"><s.Icon size={22} /></span>
                      <span className={`rounded-full px-sm py-[2px] font-sans text-[10px] font-semibold ${domain?.pill ?? 'bg-surface-hover text-text-muted'}`}>
                        {s.count} {s.count === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>
                    <p className="font-serif text-sm font-semibold text-text-primary">{s.label}</p>
                    <div
                      className="mt-sm h-[4px] rounded-full bg-surface-hover overflow-hidden"
                      role="progressbar"
                      aria-valuenow={Math.round(Math.min(s.pct, 100))}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${s.label} coverage: ${s.count} entries`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-[var(--motion-slow)] ${domain?.bar ?? 'bg-text-muted'}`}
                        style={{ width: `${Math.min(s.pct, 100)}%` }}
                      />
                    </div>
                    <p className="font-sans text-[10px] text-text-muted mt-sm">{strandSummary}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Areas to Explore */}
          {gaps.length > 0 && (
            <div className="mt-lg rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-card">
              <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">Opportunities</p>
              <h2 className="font-serif text-lg font-semibold text-text-primary mb-sm">Areas to Explore</h2>
              <p className="font-serif text-sm text-text-secondary mb-md leading-relaxed">
                These areas have fewer logged entries. Consider weaving them into upcoming activities to broaden your learning story.
              </p>
              <div className="space-y-xs">
                {gaps.map((g) => (
                  <div
                    key={g.key}
                    className="flex items-center gap-md rounded-lg border border-border-subtle bg-surface-raised px-md py-sm"
                  >
                    <span className="shrink-0 inline-flex text-text-secondary" aria-hidden="true"><g.Icon size={16} /></span>
                    <span className="font-serif text-sm font-semibold text-text-primary flex-1">{g.label}</span>
                    <span className="font-sans text-[10px] text-text-muted shrink-0">
                      {g.count === 0 ? 'No entries yet' : `${g.count} entr${g.count === 1 ? 'y' : 'ies'}`}
                    </span>
                    <Link
                      href={`/explore/activities?subject=${g.key}`}
                      className="font-sans text-[11px] text-ember hover:text-ember-hover transition-colors duration-200 shrink-0"
                    >
                      Explore →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Work Samples (flat list, no 6-slot structure) */}
          {entries.filter((e) => e.workSampleCandidate).length > 0 && (
            <div className="mt-lg">
              <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">Evidence</p>
              <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">Work Samples</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
                {entries.filter((e) => e.workSampleCandidate).map((entry) => {
                  const subjectKey = entry.subjects?.[0] ?? entry.aiEnrichment?.subjects_detected?.[0]?.toLowerCase() ?? null;
                  const domain = subjectKey ? SUBJECT_DOMAIN_CLASSES[subjectKey] : null;
                  const subjectLabel = subjectKey ? SUBJECT_CONFIG[subjectKey]?.label : null;
                  return (
                    <div
                      key={entry.id}
                      className={`rounded-lg border-t-2 border border-border-subtle bg-surface-raised p-md ${domain?.border ?? 'border-t-border-medium'}`}
                    >
                      <div className="flex items-center justify-between mb-sm">
                        {subjectLabel && (
                          <span className={`rounded-full px-sm py-[2px] font-sans text-[10px] font-semibold ${domain?.pill ?? 'bg-surface-hover text-text-muted'}`}>
                            {subjectLabel}
                          </span>
                        )}
                        <span className="font-sans text-[10px] text-text-muted">
                          {format(new Date(entry.dateOccurred), 'd MMM yyyy')}
                        </span>
                      </div>
                      <p className="font-serif text-sm font-semibold text-text-primary truncate">{entry.title}</p>
                      {entry.description && (
                        <p className="font-serif text-xs text-text-secondary mt-xs line-clamp-2">{entry.description}</p>
                      )}
                      {(entry.evidenceUrls?.length ?? 0) > 0 && (
                        <span className="inline-block mt-sm rounded-full bg-sage/15 text-sage px-sm py-[2px] font-sans text-[10px]">
                          {entry.evidenceUrls!.length} attachment{entry.evidenceUrls!.length === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Export Button */}
      <div className="mt-lg flex items-center gap-md">
        <button
          onClick={() => {
            if (!selectedLearnerId) return;
            const reportId = report?.id ?? '';
            window.open(`/api/report/export?learnerId=${selectedLearnerId}&reportId=${reportId}`, '_blank');
            track('report_exported', {
              format: isCdLevel ? 'pdf' : 'learning_report',
              entry_count: entries.length,
              has_existing_report: Boolean(reportId),
            });
            if (reportId) {
              fetch(`/api/report/${reportId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'exported' }),
              }).then(() => refreshReport());
            }
          }}
          disabled={!selectedLearnerId || entries.length === 0}
          className={`rounded-md px-lg py-sm font-sans text-sm font-semibold transition-all duration-200 ${
            selectedLearnerId && entries.length > 0
              ? 'bg-ember text-text-inverse hover:bg-ember-hover shadow-ember'
              : 'bg-surface-raised text-text-muted cursor-not-allowed opacity-50'
          }`}
        >
          {isCdLevel ? 'Export PDF' : 'Export Learning Report'}
        </button>
        {report?.lastExportedAt && (
          <span className="font-sans text-[10px] text-text-muted">
            Last exported {format(new Date(report.lastExportedAt), 'd MMM yyyy')}
          </span>
        )}
        {editedSinceExport && (
          <span
            className="inline-flex items-center rounded-full bg-amber-status/15 px-sm py-[2px] font-sans text-[10px] font-semibold text-amber-status"
            title="This report has changed since you last exported it"
          >
            Edited since export
          </span>
        )}
        {entries.length === 0 && (
          <p className="font-sans text-xs text-text-muted">Log some entries first to generate a report.</p>
        )}
      </div>

      {/* Work Sample Curation Modal */}
      {curationSlot && report && (
        <WorkSampleCuration
          reportId={report.id}
          slot={curationSlot}
          entries={entries}
          reportYear={reportYear}
          sample={report.samples?.find((s) => s.slot === curationSlot.slotKey) ?? null}
          learnerName={learners.find((l) => l.id === selectedLearnerId)?.name ?? ''}
          reportingBody={config.regulatoryBody}
          onSampleChanged={refreshReport}
          onClose={() => setCurationSlot(null)}
        />
      )}
    </div>
  );
}
