'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { format, subDays } from 'date-fns';
import { generateReflectionPrompts, type ReflectionPrompt } from '@/lib/ai/keyword-matcher';
import { track } from '@/lib/analytics/posthog';
import { useDraftInsight } from '@/hooks/use-draft-insight';
import { useLoggerDraft } from '@/hooks/use-logger-draft';
import { useLearnersFetch } from '@/hooks/use-learners-fetch';
import { useScaffoldFetch, type ScaffoldData } from '@/hooks/use-scaffold-fetch';
import { useLoggerModeAndSnapshot } from '@/hooks/use-logger-mode-and-snapshot';
import { useKeywordMatch } from '@/hooks/use-keyword-match';
import { useCoachHints } from '@/hooks/use-coach-hints';
import { useCompletenessUi } from '@/hooks/use-completeness-ui';
import { usePedagogy } from '@/hooks/use-pedagogy';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { BatchLogForm } from '@/components/logger/BatchLogForm';
import { CsvImportForm } from '@/components/logger/CsvImportForm';
import ReflectionModal from '@/components/hearth/ReflectionModal';
import { AttachToModuleModal } from '@/components/log/AttachToModuleModal';
import { PedagogyAttribution, type PedagogyAttributionSource } from '@/components/logger/PedagogyAttribution';
import { GuidedModeToggle } from '@/components/logger/GuidedModeToggle';
import { PostSaveSurface } from '@/components/logger/PostSaveSurface';
import type { AiEnrichment } from '@/types/enrichment';
import type { ChipDetailValue } from '@/components/logger/ObservationChipDetail';
import { scoreCompleteness, canSaveEntry } from '@/lib/logger/completeness';
import type { LoggerDraftFields } from '@/lib/logger/draft';
import {
  buildEntrySavePayload,
  isThinEntry,
} from '@/lib/logger/entry-payload';
import { checkBadgeThresholds, buildBadgeReadyToast } from '@/lib/logger/badge-check';
import { pollEntryEnrichment } from '@/lib/logger/enrichment-poll';
import { SkeletonLoader } from './_components/LoggerSkeleton';
import { CompletenessRing } from './_components/SectionHeader';
import { WhoSection } from './_components/WhoSection';
import { EngagementSection } from './_components/EngagementSection';
import { WhenWhereSection } from './_components/WhenWhereSection';
import { ObserveSection } from './_components/ObserveSection';
import { EvidenceSection } from './_components/EvidenceSection';
import { EvidenceModal } from './_components/EvidenceModal';
import { InsightsContent } from './_components/InsightsContent';
import { frameworkLabel } from '@/lib/pedagogy/framework-labels';
import { WhatSection } from './_components/WhatSection';
import {
  Sparkle,
  Check, WifiSlash, NotePencil, ClipboardText,
  Lightbulb, CaretDown,
} from '@/components/icons';


type EvidenceItem = {
  type: 'photo' | 'quote' | 'note' | 'link';
  content: string;
  caption?: string;
  url?: string;
  name?: string;
};


export default function LogPage() {
  const { vocab, pedagogy } = usePedagogy();
  const searchParams = useSearchParams();
  const projectContext = {
    source: searchParams.get('source') ?? 'logger',
    projectId: searchParams.get('projectId') ?? undefined,
    stageNumber: searchParams.get('stageNumber') ?? undefined,
  };

  // ─── Scaffold (from Hearth session) ───
  const scaffoldSessionId = searchParams.get('scaffold');
  const [showReflection, setShowReflection] = useState(false);
  // Workstream F — after a non-scaffold Logger save, prompt the parent to
  // attach the entry to a module they have in their library. Suppressed
  // once per session if they pick "Skip".
  const [attachEntryId, setAttachEntryId] = useState<string | null>(null);

  // ─── Data ───
  // /api/learners is guarded inside useLearnersFetch — a 5xx must NOT crash
  // the Logger via a JSON-parse SyntaxError (incident 2026-05-25).
  const { learners, isLoading: isLoadingLearners } = useLearnersFetch();

  // ─── Form state ───
  const [showBatch, setShowBatch] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedLearners, setSelectedLearners] = useState<string[]>([]);
  const [togetherMode, setTogetherMode] = useState(false);
  const [description, setDescription] = useState('');
  const [discoveries, setDiscoveries] = useState<Record<string, string>>({});
  const [activityType, setActivityType] = useState<string | null>(null);
  const [lessonSubjects, setLessonSubjects] = useState<string[]>([]);
  const [engagement, setEngagement] = useState<Record<string, number>>({});
  const [whenDate, setWhenDate] = useState<'today' | 'yesterday' | 'earlier'>('today');
  const [duration, setDuration] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [observations, setObservations] = useState<string[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);

  // ─── Guided Mode state ───
  const [observationDetails, setObservationDetails] = useState<Record<string, ChipDetailValue>>({});
  const [profileNudge, setProfileNudge] = useState<{ text: string; thread_id: string } | null>(null);
  const [pedagogySources, setPedagogySources] = useState<PedagogyAttributionSource[]>([]);
  const [postSaveInsights, setPostSaveInsights] = useState<string[]>([]);

  // Post-save second-screen state. Non-null hides the form and renders
  // PostSaveSurface in its place. Thin entries skip this (toast-only).
  // See docs/hearth-logger-post-save-resolution-v1.md.
  const [postSave, setPostSave] = useState<{
    entryId: string;
    evidenceCount: number;
    enrichment: AiEnrichment | null;
  } | null>(null);

  // Guard so an in-flight enrichment poll can't write post-save UI state into
  // a new entry. Holds the entryId being polled; cleared when the parent
  // starts typing again (see the new-entry clearing effect below).
  const activeEnrichmentEntryIdRef = useRef<string | null>(null);

  const { loggerMode, setLoggerMode, snapshotData, snapshotSignals } =
    useLoggerModeAndSnapshot();

  // Scaffold data pre-fills description / location / attending learners when
  // the parent navigates from a hearth session. onLoad fires exactly once.
  const scaffoldData = useScaffoldFetch({
    scaffoldSessionId,
    onLoad: useCallback((data: ScaffoldData) => {
      setDescription(data.session.sharedRecord ?? data.session.description ?? '');
      if (data.session.location) setLocation(data.session.location);
      if (data.attendingLearnerIds.length > 0) setSelectedLearners(data.attendingLearnerIds);
    }, []),
  });

  // ─── Draft auto-save (10s to localStorage) ───
  // The autosave + restore + clear wiring lives in useLoggerDraft (the React
  // side of `lib/logger/draft.ts`). We memo the draft state so the hook's
  // autosave timer only restarts when a field actually changes — preserving
  // the original deps-driven `useEffect` cadence.
  const draftState = useMemo<LoggerDraftFields>(() => ({
    description,
    selectedLearners,
    discoveries,
    activityType,
    lessonSubjects,
    engagement,
    whenDate,
    duration,
    location,
    observations,
    evidence,
  }), [description, selectedLearners, discoveries, activityType, lessonSubjects, engagement, whenDate, duration, location, observations, evidence]);

  const { draftRestored, dismissDraftRestored, lastSavedAt, clearDraft } = useLoggerDraft({
    state: draftState,
    onRestore: useCallback((d) => {
      // Each setter is gated on the corresponding field's presence — same shape
      // as the original inline restore effect.
      if (d.description) setDescription(d.description);
      if (d.selectedLearners?.length) setSelectedLearners(d.selectedLearners);
      if (d.discoveries) setDiscoveries(d.discoveries);
      if (d.activityType) setActivityType(d.activityType);
      if (d.lessonSubjects?.length) setLessonSubjects(d.lessonSubjects);
      if (d.engagement) setEngagement(d.engagement);
      if (d.whenDate) setWhenDate(d.whenDate);
      if (d.duration) setDuration(d.duration);
      if (d.location) setLocation(d.location);
      if (d.observations?.length) setObservations(d.observations);
      if (d.evidence?.length) setEvidence(d.evidence);
    }, []),
  });

  const online = useOnlineStatus();

  // ─── AI Insights ───
  // Two tiers: instant keyword matcher for fast feedback, debounced Haiku
  // draft-insight for warmer reflective copy + better thread detection.
  // The Haiku call only fires when description length ≥ 50 chars; the hook
  // enforces a 20-call-per-session client cap (decision B — firm caps).
  const selectedChildNames = useMemo(
    () =>
      learners
        .filter((l) => selectedLearners.includes(l.id))
        .map((l) => l.name),
    [learners, selectedLearners]
  );

  const keywordMatch = useKeywordMatch(description, selectedChildNames);

  const { insight: aiInsight, loading: aiLoading } = useDraftInsight(
    description,
    selectedChildNames
  );

  // Clear post-save insights when parent starts a new entry. Also invalidates
  // any in-flight enrichment poll so its setState calls become no-ops.
  useEffect(() => {
    if (description.length > 0) {
      activeEnrichmentEntryIdRef.current = null;
      // Clears stale post-save insights when parent starts a new entry; gated on description.length.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPostSaveInsights([]);
      setProfileNudge(null);
      setPedagogySources([]);
    }
  }, [description]);

  // ─── Reflection prompts (Socratic coaching questions) ───
  const reflectionPrompts = useMemo((): ReflectionPrompt[] => {
    if (description.length < 10) return [];
    const engagementByName: Record<string, number> = {};
    const discoveryByName: Record<string, string> = {};
    const learnerNamesById: Record<string, string> = {};
    for (const id of selectedLearners) {
      const learner = learners.find((l) => l.id === id);
      if (!learner) continue;
      learnerNamesById[id] = learner.name;
      if (engagement[id]) engagementByName[learner.name] = engagement[id];
      if (discoveries[id]) discoveryByName[learner.name] = discoveries[id];
    }
    return generateReflectionPrompts({
      match: keywordMatch,
      descriptionLength: description.length,
      observations,
      activityType,
      engagementByName,
      discoveryByName,
      snapshotSignals,
      learnerNamesById,
    });
  }, [keywordMatch, description, selectedLearners, learners, engagement, discoveries, observations, activityType, snapshotSignals]);

  // ─── Coach hints (debounced fetch) ───
  const coachHints = useCoachHints({
    description,
    selectedLearners,
    activityType,
    observations,
  });

  // ─── UI state ───
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'badge'; message: string; action?: { label: string; href: string } } | null>(null);
  const [evidenceModal, setEvidenceModal] = useState<string | null>(null);
  const [insightsExpanded, setInsightsExpanded] = useState(false);

  const { isRecording, start: startVoiceInput, stop: stopVoiceInput } = useSpeechRecognition({
    onTranscript: (transcript) => setDescription((prev) => prev + (prev ? ' ' : '') + transcript),
  });

  // ─── Completeness ───
  const completeness = useMemo(() => scoreCompleteness({
    selectedLearners,
    description,
    activityType,
    engagement,
    discoveries,
    observations,
    observationDetails,
    duration,
    location,
    evidence,
    mode: loggerMode,
  }), [selectedLearners, description, discoveries, activityType, engagement, duration, location, observations, evidence, loggerMode, observationDetails]);

  const sectionDone = useMemo(
    () => ({
      1: selectedLearners.length > 0,
      2: description.length > 20 && activityType !== null,
      3: selectedLearners.length > 0 && selectedLearners.every((id) => engagement[id]),
      4: duration !== null || location !== null,
      5: observations.length > 0,
      6: evidence.length > 0,
    }),
    [selectedLearners, description, activityType, engagement, duration, location, observations, evidence]
  );

  const {
    label: completenessLabel,
    hint: completenessHint,
    missingItems,
  } = useCompletenessUi({
    completeness,
    loggerMode,
    selectedLearners,
    description,
    activityType,
    engagement,
    observations,
  });

  const canSave = canSaveEntry(completeness, loggerMode);

  // Fire `logger_completed_50pct` exactly once per Logger session, the
  // moment completeness first crosses the save threshold. Useful for
  // measuring funnel drop-off between started-typing and saved.
  const fired50Ref = useRef(false);
  useEffect(() => {
    if (!fired50Ref.current && completeness >= 50) {
      fired50Ref.current = true;
      track('logger_completed_50pct', {
        learner_count: selectedLearners.length,
        has_evidence: evidence.length > 0,
      });
    }
  }, [completeness, selectedLearners.length, evidence.length]);

  // ─── Handlers ───
  const toggleLearner = (id: string) => {
    setSelectedLearners((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const toggleObservation = (chip: string) => {
    const wasSelected = observations.includes(chip);
    setObservations((prev) =>
      prev.includes(chip) ? prev.filter((o) => o !== chip) : [...prev, chip]
    );
    // Deselecting a chip clears any Guided-mode detail captured for it.
    if (wasSelected) {
      setObservationDetails((prev) => {
        const next = { ...prev };
        delete next[chip];
        return next;
      });
    }
  };

  const getDateOccurred = useCallback(() => {
    const today = new Date();
    if (whenDate === 'yesterday') return format(subDays(today, 1), 'yyyy-MM-dd');
    if (whenDate === 'earlier') return format(subDays(today, 5), 'yyyy-MM-dd');
    return format(today, 'yyyy-MM-dd');
  }, [whenDate]);

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);

    const payload = buildEntrySavePayload(
      {
        description,
        dateOccurred: getDateOccurred(),
        activityType,
        lessonSubjects,
        selectedLearners,
        engagement,
        discoveries,
        evidence,
        loggerMode,
        observationDetails,
      },
      {
        scaffoldSessionId: scaffoldData?.session.id,
        projectSource: projectContext.source,
        projectId: projectContext.projectId,
        stageNumber: projectContext.stageNumber,
      },
    );
    const evidenceUrls = payload.evidenceUrls;

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');

      const savedEntry = await res.json().catch(() => ({})) as { id?: string };
      const savedEntryId = savedEntry?.id;

      track('entry_created', {
        source: scaffoldData ? 'hearth_session' : projectContext.source ?? 'retro',
        learner_count: selectedLearners.length,
        has_evidence: evidenceUrls.length > 0,
        activity_type: activityType ?? 'none',
      });

      clearDraft();

      // Thin entries skip the substantive second screen and keep the fast
      // "Saved" toast (see spec §2 Item 2 density table). See
      // lib/logger/entry-payload.ts → isThinEntry for the four-signal rule.
      const thinEntry = isThinEntry({
        description,
        observationDetails,
        evidenceUrlCount: evidenceUrls.length,
        completeness,
      });

      // Scaffold (hearth session) entries also surface the post-save second
      // screen — per the resolution doc, PostSaveSurface is where enrichment
      // is most crucial to surface. ReflectionModal layers on top for the
      // session-specific data capture.
      if (scaffoldData) {
        setShowReflection(true);
      } else if (savedEntryId) {
        // Workstream F — offer to attach the entry to a library module.
        // Suppressed for the rest of this session if the parent picked
        // "Skip" on a previous save. Scaffolded entries already carry
        // sourceSessionId; the attach flow is for free-text retrospectives.
        let skipped = false;
        try {
          skipped = sessionStorage.getItem('hearth_skip_attach') === '1';
        } catch {
          /* sessionStorage may be unavailable; default to showing once */
        }
        if (!skipped) setAttachEntryId(savedEntryId);
      }

      if (thinEntry || !savedEntryId) {
        if (!scaffoldData) setToast({ type: 'success', message: 'Learning entry saved!' });
      } else {
        // Substantive entry → render the inline post-save second screen.
        // Enrichment starts as null; the poll below populates it as the
        // server's after() job lands data.
        setPostSave({ entryId: savedEntryId, evidenceCount: evidenceUrls.length, enrichment: null });
      }
      const learnersToCheck = [...selectedLearners];
      setSelectedLearners([]);
      setTogetherMode(false);
      setDescription('');
      setDiscoveries({});
      setActivityType(null);
      setLessonSubjects([]);
      setEngagement({});
      setWhenDate('today');
      setDuration(null);
      setLocation(null);
      setObservations([]);
      setEvidence([]);
      setObservationDetails({});
      // coachHints clear automatically — the hook resets to [] when the
      // description shrinks below threshold (which the setDescription('')
      // above triggers).
      setProfileNudge(null);
      setPedagogySources([]);

      // Poll for enrichment to complete (server runs it async after save).
      // Snapshot-rebuild also enqueues `badge_ready` notifications, so if the
      // parent misses this toast the Notification Centre will still surface it.
      if (savedEntryId) activeEnrichmentEntryIdRef.current = savedEntryId;
      (async () => {
        if (savedEntryId) {
          // The poll's timing / in-flight guard / pending→terminal state
          // machine lives in lib/logger/enrichment-poll.ts; the React
          // state-mapping stays here behind onEnrichment.
          await pollEntryEnrichment(savedEntryId, {
            isCurrent: () => activeEnrichmentEntryIdRef.current === savedEntryId,
            clearCurrent: () => {
              activeEnrichmentEntryIdRef.current = null;
            },
            onEnrichment: (enrichment) => {
              setPostSave((prev) =>
                prev && prev.entryId === savedEntryId ? { ...prev, enrichment } : prev
              );

              const sources = enrichment.pedagogy_sources ?? [];
              if (sources.length > 0) {
                setPedagogySources(sources);
                setInsightsExpanded(true);
              }
              const suggestions = enrichment.insight_suggestions ?? [];
              if (suggestions.length > 0) {
                setPostSaveInsights(suggestions);
                setInsightsExpanded(true);
              }
              const nudge = enrichment.profile_nudge;
              if (nudge) {
                setProfileNudge(nudge);
                setInsightsExpanded(true);
              }
            },
            // Poll timed out without a terminal status. Spec: "never a spinner
            // that hangs." Resolve the surface to a failed view so the parent
            // can exit; the DB row may still finish enriching later, and the
            // Portfolio retry affordance covers that case.
            onTimeout: () => {
              setPostSave((prev) => {
                if (!prev || prev.entryId !== savedEntryId) return prev;
                if (prev.enrichment?.status === 'enriched' || prev.enrichment?.status === 'failed') {
                  return prev;
                }
                return {
                  ...prev,
                  enrichment: { status: 'failed' as const, failedAt: new Date().toISOString() },
                };
              });
            },
          });
        }

        try {
          const ready = await checkBadgeThresholds(learnersToCheck);
          const badgeToast = buildBadgeReadyToast(
            ready,
            new Map(learners.map((l) => [l.id, l.name])),
          );
          if (badgeToast) {
            setToast(badgeToast);
            setTimeout(() => setToast(null), 10000);
          }
        } catch {
          // badge check is non-critical — silently ignore
        }
      })();
    } catch {
      // Differentiate offline vs server-side failure. The 10s autosave
      // means the draft has already been written to localStorage, so the
      // entry is not lost — just unposted.
      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
      setToast({
        type: 'error',
        message: isOffline
          ? "You're offline. Your draft is saved locally — try again when you're back online."
          : 'Failed to save. Your draft is safe — please try again.',
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };



  // ─── Render ───
  if (isLoadingLearners) {
    return <SkeletonLoader />;
  }

  // Substantive entry just saved — show the deliberate second screen in
  // place of the form (spec §2 Item 2: inline morph, parent-controlled exit).
  // Badge-readiness toasts still render here so a quick-check prompt isn't
  // lost when an entry trips a badge threshold.
  if (postSave) {
    return (
      <div className="relative">
        <PostSaveSurface
          enrichment={postSave.enrichment}
          evidenceCount={postSave.evidenceCount}
          onLogAnother={() => setPostSave(null)}
        />
        {toast && (
          <div
            className={`fixed bottom-[80px] left-1/2 -translate-x-1/2 z-50 flex items-center gap-md rounded-md px-lg py-sm font-sans text-sm font-medium shadow-float transition-all duration-200 ${
              toast.type === 'badge'
                ? 'bg-ember/20 text-ember border border-ember/30'
                : toast.type === 'success'
                ? 'bg-sage/20 text-sage border border-sage/30'
                : 'bg-red-900/20 text-red-400 border border-red-900/30'
            }`}
          >
            <span>{toast.message}</span>
            {toast.action && (
              <a
                href={toast.action.href}
                className="ml-sm font-semibold underline underline-offset-2 hover:no-underline"
              >
                {toast.action.label}
              </a>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Offline banner — sits above the draft-restored banner so it's the
          first thing the parent sees if a network drop interrupts them.
          The 10s autosave keeps writing to localStorage regardless of
          connection state, so "your draft is safe locally" is literally
          true and worth surfacing. */}
      {!online && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-sm border-b border-border-subtle bg-surface-raised px-md py-xs"
        >
          <span className="text-text-muted" aria-hidden="true"><WifiSlash size={14} /></span>
          <p className="font-sans text-[11px] text-text-secondary">
            Offline — your draft is being saved locally. Save will resume when you&rsquo;re back online.
          </p>
        </div>
      )}

      {/* Draft restored banner */}
      {draftRestored && (
        <div className="flex items-center justify-between border-b border-border-subtle bg-ember-glow px-md py-xs">
          <p className="inline-flex items-center gap-xs font-sans text-[11px] text-text-secondary"><NotePencil size={14} aria-hidden="true" /> Draft restored from your last session</p>
          <button
            onClick={dismissDraftRestored}
            className="font-sans text-[11px] text-text-muted hover:text-text-secondary transition-colors duration-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Scaffold banner (from Hearth session) */}
      {scaffoldData && (
        <div className="flex items-center gap-md p-md px-lg bg-ember/[0.08] border border-ember/15 rounded-[10px] mx-md mt-md mb-sm">
          <span className="shrink-0 inline-flex text-ember" aria-hidden="true"><ClipboardText size={22} /></span>
          <div className="min-w-0">
            <div className="font-sans text-sm text-ember font-medium">
              Logging from: {scaffoldData.session.hearthName ?? 'Hearth'}
            </div>
            <div className="font-sans text-xs text-text-muted truncate">
              {scaffoldData.session.title} · {scaffoldData.session.date} · Pre-filled from shared record
            </div>
          </div>
        </div>
      )}

      {/* Header bar with completeness */}
      <div className="sticky top-0 z-10 flex items-center gap-md border-b border-border-subtle bg-surface-panel px-md py-sm lg:px-lg">
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-[1.1rem] font-semibold text-text-primary">Log a Learning Moment</h1>
          <p className="font-sans text-[0.75rem] text-text-muted hidden sm:block">
            {lastSavedAt
              ? `Draft saved · ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : vocab.logNudge}
          </p>
          <div className="mt-xs flex flex-wrap items-center gap-xs">
            <button
              type="button"
              onClick={() => setShowBatch(true)}
              className="inline-flex items-center gap-xs rounded-full border border-border-subtle bg-transparent px-sm py-[3px] font-sans text-[0.6875rem] font-medium text-text-secondary transition-colors duration-200 ease-[var(--ease-default)] hover:border-border-medium hover:text-text-primary"
            >
              <ClipboardText size={12} aria-hidden="true" /> Batch log
            </button>
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-xs rounded-full border border-border-subtle bg-transparent px-sm py-[3px] font-sans text-[0.6875rem] font-medium text-text-secondary transition-colors duration-200 ease-[var(--ease-default)] hover:border-border-medium hover:text-text-primary"
            >
              <ClipboardText size={12} aria-hidden="true" /> Import CSV
            </button>
          </div>
        </div>
        <GuidedModeToggle mode={loggerMode} onChange={setLoggerMode} />
        <div className="hidden lg:flex items-center gap-sm">
          <CompletenessRing score={completeness} />
          <div className="hidden sm:block text-left">
            <p className="font-sans text-[0.6875rem] font-semibold text-text-secondary leading-tight">{completenessLabel}</p>
            <p className="font-sans text-[0.6875rem] text-text-muted leading-tight">{completenessHint}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!canSave || isSaving}
          className={`hidden lg:flex items-center gap-sm rounded-md px-lg py-sm font-sans text-[0.8125rem] font-semibold transition-all duration-200 ease-[var(--ease-default)] ${
            canSave
              ? 'bg-ember border border-ember text-text-inverse cursor-pointer hover:bg-ember-hover hover:shadow-ember'
              : 'bg-surface-raised border border-border-subtle text-text-muted opacity-50 cursor-not-allowed'
          }`}
        >
          {isSaving
            ? 'Saving…'
            : canSave
              ? <span className="inline-flex items-center gap-xs"><Check size={14} aria-hidden="true" /> Save</span>
              : 'Save'}
        </button>
      </div>

      {showBatch && (
        <div className="flex-1 overflow-y-auto px-md py-lg lg:flex lg:justify-center">
          <div className="w-full max-w-[560px] xl:max-w-[600px]">
            <BatchLogForm
              learners={learners.map((l) => ({ id: l.id, name: l.name }))}
              onComplete={() => setShowBatch(false)}
              onCancel={() => setShowBatch(false)}
            />
          </div>
        </div>
      )}

      {showImport && (
        <div className="flex-1 overflow-y-auto px-md py-lg lg:flex lg:justify-center">
          <div className="w-full max-w-[560px] xl:max-w-[600px]">
            <CsvImportForm
              onComplete={() => setShowImport(false)}
              onCancel={() => setShowImport(false)}
            />
          </div>
        </div>
      )}

      {!showBatch && !showImport && <div className="flex-1 lg:flex">
        {/* ─── Left: Capture Form ─── */}
        <div className="flex-1 overflow-y-auto px-md pt-lg pb-[220px] lg:py-lg lg:flex lg:justify-center">
          <div className="w-full max-w-[560px] xl:max-w-[600px] space-y-xl">
          {/* Section 1: Who Was Learning? */}
          <WhoSection
            learners={learners}
            selectedLearners={selectedLearners}
            onToggleLearner={toggleLearner}
            togetherMode={togetherMode}
            onTogetherModeChange={setTogetherMode}
            snapshotData={snapshotData}
            done={sectionDone[1]}
          />

          {/* Section 2: What Happened? */}
          <WhatSection
            label={vocab.logWhatLabel}
            placeholder={vocab.logWhatPlaceholder}
            done={sectionDone[2]}
            description={description}
            onDescriptionChange={setDescription}
            isRecording={isRecording}
            onStartVoice={startVoiceInput}
            onStopVoice={stopVoiceInput}
            learners={learners}
            selectedLearners={selectedLearners}
            discoveries={discoveries}
            onDiscoveryChange={(id, value) =>
              setDiscoveries((prev) => ({ ...prev, [id]: value }))
            }
            engagement={engagement}
            activityType={activityType}
            onActivityTypeChange={setActivityType}
            lessonSubjects={lessonSubjects}
            onToggleLessonSubject={(key) =>
              setLessonSubjects((prev) =>
                prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
              )
            }
          />

          {/* Section 3: How Engaged Were They? */}
          <EngagementSection
            done={sectionDone[3]}
            learners={learners}
            selectedLearners={selectedLearners}
            engagement={engagement}
            onEngagementChange={(id, value) =>
              setEngagement((prev) => ({ ...prev, [id]: value }))
            }
          />

          {/* Section 4: When & Where */}
          <WhenWhereSection
            done={sectionDone[4]}
            whenDate={whenDate}
            onWhenDateChange={setWhenDate}
            duration={duration}
            onDurationChange={setDuration}
            location={location}
            onLocationChange={setLocation}
          />

          {/* Section 5: What Did You Observe? */}
          <ObserveSection
            done={sectionDone[5]}
            label={vocab.logObserveLabel}
            observations={observations}
            observationDetails={observationDetails}
            onToggleObservation={toggleObservation}
            onObservationDetailChange={(chip, value) =>
              setObservationDetails((prev) => ({ ...prev, [chip]: value }))
            }
            isGuided={loggerMode === 'guided'}
          />

          {/* Section 6: Evidence */}
          <EvidenceSection
            done={sectionDone[6]}
            evidence={evidence}
            onOpenTool={setEvidenceModal}
            onRemoveEvidence={(index) =>
              setEvidence((prev) => prev.filter((_, idx) => idx !== index))
            }
          />
          </div>
        </div>

        {/* ─── Right: AI Insights Panel (desktop) ─── */}
        <aside className="hidden lg:flex lg:w-[400px] xl:w-[440px] shrink-0 flex-col gap-lg border-l border-border-subtle bg-surface-panel p-lg overflow-y-auto">
          <div className="flex items-center gap-sm pb-md border-b border-border-subtle">
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-ember shadow-ember text-text-inverse">
              <Lightbulb size={16} aria-hidden="true" />
            </div>
            <h3 className="font-serif text-base font-semibold text-text-primary">Hearth Insights</h3>
          </div>
          <InsightsContent
            match={keywordMatch}
            aiInsight={aiInsight}
            aiLoading={aiLoading}
            reflectionPrompts={reflectionPrompts}
            coachHints={coachHints}
            profileNudge={profileNudge}
            postSaveInsights={postSaveInsights}
          />
          <PedagogyAttribution sources={pedagogySources} frameworkTitle={frameworkLabel(pedagogy)} />
        </aside>
      </div>}

      {/* ─── Mobile bottom stack: AI Insights drawer + Save bar ─── */}
      <div className="lg:hidden fixed bottom-[72px] left-0 right-0 z-50">
        {/* AI Insights drawer — expands upward, above the save bar */}
        {insightsExpanded && (
          <div className="max-h-[55vh] overflow-y-auto border-t border-border-subtle bg-surface-panel p-xl">
            <div className="flex items-center gap-sm mb-md">
              <span className="text-ember" aria-hidden="true"><Sparkle size={18} /></span>
              <h3 className="font-serif text-base font-semibold text-text-primary">Hearth Insights</h3>
            </div>
            <InsightsContent
              match={keywordMatch}
              aiInsight={aiInsight}
              aiLoading={aiLoading}
              reflectionPrompts={reflectionPrompts}
              coachHints={coachHints}
              profileNudge={profileNudge}
              postSaveInsights={postSaveInsights}
            />
            <PedagogyAttribution sources={pedagogySources} frameworkTitle={frameworkLabel(pedagogy)} />
          </div>
        )}
        <button
          onClick={() => setInsightsExpanded(!insightsExpanded)}
          aria-expanded={insightsExpanded}
          className="w-full flex items-center justify-center gap-xs border-t border-border-subtle bg-surface-panel px-md py-sm"
        >
          <span className="font-sans text-xs font-medium text-text-secondary">
            {insightsExpanded ? 'Hide' : 'Show'} Insights
          </span>
          <CaretDown
            size={14}
            aria-hidden="true"
            className={`text-text-secondary transition-transform duration-[var(--motion-quick)] ease-[var(--ease-default)] ${insightsExpanded ? '' : 'rotate-180'}`}
          />
        </button>

        {/* Save bar — primary action anchored at the bottom on mobile */}
        {!showBatch && !showImport && (
          <div className="border-t border-border-subtle bg-surface-panel px-md py-sm pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
            {!canSave && missingItems.length > 0 && (
              <div
                className="mb-sm flex flex-wrap items-center gap-xs"
                role="status"
                aria-live="polite"
              >
                <span className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-muted">
                  Before you save
                </span>
                {missingItems.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-xs rounded-full border border-border-subtle bg-surface-raised px-sm py-[2px] font-sans text-[0.6875rem] text-text-secondary"
                  >
                    <span className="h-[5px] w-[5px] rounded-full bg-ember" aria-hidden="true" />
                    {m}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-md">
              <CompletenessRing score={completeness} />
              <div className="min-w-0 flex-1">
                <p className="font-sans text-[0.75rem] font-semibold text-text-secondary leading-tight">
                  {completenessLabel}
                </p>
                <p className="font-sans text-[0.6875rem] text-text-muted leading-tight truncate">
                  {canSave
                    ? completenessHint
                    : `${missingItems.length} thing${missingItems.length === 1 ? '' : 's'} left`}
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={!canSave || isSaving}
                className={`flex shrink-0 items-center justify-center gap-sm rounded-md px-xl py-sm font-sans text-[0.875rem] font-semibold transition-all duration-200 ease-[var(--ease-default)] ${
                  canSave
                    ? 'bg-ember border border-ember text-text-inverse cursor-pointer hover:bg-ember-hover hover:shadow-ember'
                    : 'bg-surface-raised border border-border-subtle text-text-muted opacity-50 cursor-not-allowed'
                }`}
              >
                {isSaving
                  ? 'Saving…'
                  : canSave
                    ? <span className="inline-flex items-center gap-xs"><Check size={16} aria-hidden="true" /> Save</span>
                    : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Evidence Modal ─── */}
      {evidenceModal && (
        <EvidenceModal
          type={evidenceModal}
          onClose={() => setEvidenceModal(null)}
          onSave={(item) => {
            setEvidence((prev) => [...prev, item]);
            setEvidenceModal(null);
          }}
        />
      )}

      {/* ─── Toast ─── */}
      {toast && (
        <div
          className={`fixed bottom-[200px] lg:bottom-[80px] left-1/2 -translate-x-1/2 z-[60] flex items-center gap-md rounded-md px-lg py-sm font-sans text-sm font-medium shadow-float transition-all duration-200 ${
            toast.type === 'badge'
              ? 'bg-ember/20 text-ember border border-ember/30'
              : toast.type === 'success'
              ? 'bg-sage/20 text-sage border border-sage/30'
              : 'bg-red-900/20 text-red-400 border border-red-900/30'
          }`}
        >
          <span>{toast.message}</span>
          {toast.action && (
            <a
              href={toast.action.href}
              className="ml-sm font-semibold underline underline-offset-2 hover:no-underline"
            >
              {toast.action.label}
            </a>
          )}
        </div>
      )}

      {/* ─── Reflection Modal (hearth session scaffold) ─── */}
      {scaffoldData && (
        <ReflectionModal
          isOpen={showReflection}
          sessionId={scaffoldData.session.id}
          hearthId={scaffoldData.session.hearthId}
          hearthName={scaffoldData.session.hearthName ?? 'Hearth'}
          sessionTitle={scaffoldData.session.title}
          onClose={() => setShowReflection(false)}
          onShared={() => setShowReflection(false)}
          onSkipped={() => setShowReflection(false)}
        />
      )}

      {/* ─── Attach-to-module Modal (workstream F) ───
          Retro-attaches the just-saved entry to a library module. PATCHes
          sourceModuleId via /api/entries/[id]. Per-session skip flag. */}
      {attachEntryId && (
        <AttachToModuleModal
          entryId={attachEntryId}
          onClose={() => {
            try {
              sessionStorage.setItem('hearth_skip_attach', '1');
            } catch {
              /* ignore */
            }
            setAttachEntryId(null);
          }}
          onAttached={() => setAttachEntryId(null)}
        />
      )}
    </div>
  );
}

