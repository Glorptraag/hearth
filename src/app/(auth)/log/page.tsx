'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { format, subDays, differenceInYears } from 'date-fns';
import { matchKeywords, generateReflectionPrompts, type KeywordMatchResult, type ReflectionPrompt, type SnapshotSignals } from '@/lib/ai/keyword-matcher';
import { track } from '@/lib/analytics/posthog';
import { useDraftInsight } from '@/hooks/use-draft-insight';
import { usePedagogy } from '@/hooks/use-pedagogy';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { BatchLogForm } from '@/components/logger/BatchLogForm';
import { CsvImportForm } from '@/components/logger/CsvImportForm';
import ReflectionModal from '@/components/hearth/ReflectionModal';
import { AttachToModuleModal } from '@/components/log/AttachToModuleModal';
import { PedagogyAttribution, type PedagogyAttributionSource } from '@/components/logger/PedagogyAttribution';
import { WatchForTodayStrip } from '@/components/logger/WatchForTodayStrip';
import { GuidedModeToggle } from '@/components/logger/GuidedModeToggle';
import { PostSaveSurface } from '@/components/logger/PostSaveSurface';
import type { AiEnrichment } from '@/types/enrichment';
import { ObservationChipDetail, DETAIL_CHIPS, type ChipDetailValue } from '@/components/logger/ObservationChipDetail';
import type { CoachHint } from '@/lib/logger/coaching/types';
import type { SnapshotData } from '@/types/snapshot';
import { scoreCompleteness, canSaveEntry } from '@/lib/logger/completeness';
import {
  DRAFT_KEY,
  parseDraft,
  serializeDraft,
  shouldPersistDraft,
  isRestorableDraft,
  isStaleDraft,
} from '@/lib/logger/draft';
import {
  deriveSubjects,
  deriveEntryTitle,
  derivePhotoEvidenceUrlsLegacy,
  isThinEntry,
} from '@/lib/logger/entry-payload';
import { SkeletonLoader } from './_components/LoggerSkeleton';
import { SectionHeader, CompletenessRing } from './_components/SectionHeader';
import { EvidenceModal } from './_components/EvidenceModal';
import { InsightsContent } from './_components/InsightsContent';
import { frameworkLabel } from '@/lib/pedagogy/framework-labels';
import type { ComponentType } from 'react';
import {
  Leaf, CookingPot, BookOpen, Palette, SoccerBall, UsersThree, Note, Sparkle,
  BookOpenText, MathOperations, Atom, Globe, Cpu, PersonSimpleRun, ChatsCircle,
  HouseLine, Tree, Bank, Monitor,
  Check, WifiSlash, NotePencil, ClipboardText, Microphone, ChatCircleDots,
  Camera, ChatCircle, LinkSimple, X, Lightbulb,
  ChatCircleText,
} from '@/components/icons';

type LogIconC = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

type ScaffoldData = {
  session: { id: string; title: string; description: string | null; date: string; location: string | null; sharedRecord: string | null; hearthId: string; hearthName: string | null };
  evidence: Array<{ id: string; fileUrl: string; fileType: string | null; caption: string | null }>;
  observations: Array<{ id: string; observationText: string; targetLearnerId: string; evidenceIds: string[] }>;
  attendingLearnerIds: string[];
};

type Learner = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  shapeIcon: string | null;
  colourToken: string | null;
};

type EvidenceItem = {
  type: 'photo' | 'quote' | 'note' | 'link' | 'audio';
  content: string;
  caption?: string;
  url?: string;
  name?: string;
  metadata?: Record<string, unknown>;
};

const ACTIVITY_TYPES: ReadonlyArray<{ key: string; label: string; Icon: LogIconC }> = [
  { key: 'nature',     label: 'Nature Study',    Icon: Leaf },
  { key: 'cooking',    label: 'Kitchen Science', Icon: CookingPot },
  { key: 'reading',    label: 'Reading',         Icon: BookOpen },
  { key: 'art',        label: 'Creative Arts',   Icon: Palette },
  { key: 'physical',   label: 'Physical',        Icon: SoccerBall },
  { key: 'social',     label: 'Social',          Icon: UsersThree },
  { key: 'structured', label: 'Lesson',          Icon: Note },
  { key: 'freeplay',   label: 'Free Play',       Icon: Sparkle },
];


const SUBJECTS: ReadonlyArray<{ key: string; label: string; Icon: LogIconC }> = [
  { key: 'english',      label: 'English',      Icon: BookOpenText },
  { key: 'mathematics',  label: 'Maths',        Icon: MathOperations },
  { key: 'science',      label: 'Science',      Icon: Atom },
  { key: 'hass',         label: 'HASS',         Icon: Globe },
  { key: 'arts',         label: 'Arts',         Icon: Palette },
  { key: 'technologies', label: 'Technologies', Icon: Cpu },
  { key: 'hpe',          label: 'HPE',          Icon: PersonSimpleRun },
  { key: 'languages',    label: 'Languages',    Icon: ChatsCircle },
];

const ENGAGEMENT_LEVELS = [
  { value: 4, emoji: '😊', label: 'Loved it' },
  { value: 3, emoji: '🙂', label: 'Engaged' },
  { value: 2, emoji: '😐', label: 'Okay' },
  { value: 1, emoji: '😕', label: 'Struggled' },
];

const DURATION_OPTIONS = ['~5 min', '~15 min', '~30 min', '1 hr+'];
const WHERE_OPTIONS: ReadonlyArray<{ key: string; label: string; Icon: LogIconC }> = [
  { key: 'home',      label: 'Home',      Icon: HouseLine },
  { key: 'outdoors',  label: 'Outdoors',  Icon: Tree },
  { key: 'community', label: 'Community', Icon: Bank },
  { key: 'online',    label: 'Online',    Icon: Monitor },
];

const OBSERVATION_CATEGORIES = [
  {
    label: 'Engagement',
    color: 'child-sage',
    chips: ['Deeply focused', 'Curious', 'Enthusiastic', 'Reluctant at first', 'Easily distracted', 'Self-directed'],
  },
  {
    label: 'Social',
    color: 'child-blue',
    chips: ['Worked alone', 'Collaborated', 'Led others', 'Asked for help', 'Taught someone', 'Negotiated / compromised'],
  },
  {
    label: 'Thinking',
    color: 'child-violet',
    chips: ['Asked questions', 'Tried alternatives', 'Persisted through difficulty', 'Made connections', 'Self-corrected', 'Explained reasoning'],
  },
  {
    label: 'Emotional',
    color: 'child-rose',
    chips: ['Proud of work', 'Joyful', 'Calm & settled', 'Frustrated → resolved', 'Surprised / delighted', 'Confident'],
  },
];

const CHILD_COLORS: Record<string, { border: string; bg: string; text: string; ring: string }> = {
  rose: { border: 'border-child-rose', bg: 'bg-child-rose/10', text: 'text-child-rose', ring: 'focus-within:ring-child-rose/30' },
  blue: { border: 'border-child-blue', bg: 'bg-child-blue/10', text: 'text-child-blue', ring: 'focus-within:ring-child-blue/30' },
  sage: { border: 'border-child-sage', bg: 'bg-child-sage/10', text: 'text-child-sage', ring: 'focus-within:ring-child-sage/30' },
  amber: { border: 'border-amber-status', bg: 'bg-amber-status/10', text: 'text-amber-status', ring: 'focus-within:ring-amber-status/30' },
};

// ─── Skeleton Loader Component ───

const OBS_COLOR_CLASSES: Record<string, { dot: string; selectedBg: string; selectedBorder: string }> = {
  'child-sage': { dot: 'bg-child-sage', selectedBg: 'bg-child-sage/10', selectedBorder: 'border-child-sage/30' },
  'child-blue': { dot: 'bg-child-blue', selectedBg: 'bg-child-blue/10', selectedBorder: 'border-child-blue/30' },
  'child-violet': { dot: 'bg-child-violet', selectedBg: 'bg-child-violet/10', selectedBorder: 'border-child-violet/30' },
  'child-rose': { dot: 'bg-child-rose', selectedBg: 'bg-child-rose/10', selectedBorder: 'border-child-rose/30' },
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
  const [scaffoldData, setScaffoldData] = useState<ScaffoldData | null>(null);
  const [showReflection, setShowReflection] = useState(false);
  // Workstream F — after a non-scaffold Logger save, prompt the parent to
  // attach the entry to a module they have in their library. Suppressed
  // once per session if they pick "Skip".
  const [attachEntryId, setAttachEntryId] = useState<string | null>(null);

  // ─── Data ───
  const [learners, setLearners] = useState<Learner[]>([]);
  const [isLoadingLearners, setIsLoadingLearners] = useState(true);
  useEffect(() => {
    // Guarded: a 5xx from /api/learners must NOT crash Logger via JSON-parse
    // SyntaxError. See incident 2026-05-25 (missing migration 0016).
    fetch('/api/learners')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`learners ${r.status}`))))
      .then((data) => { if (Array.isArray(data)) setLearners(data); })
      .catch(() => { /* degrade to empty learners; learner picker shows empty state */ })
      .finally(() => setIsLoadingLearners(false));
  }, []);

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
  type LoggerMode = 'guided' | 'quick';
  const [loggerMode, setLoggerMode] = useState<LoggerMode>('quick');
  const [observationDetails, setObservationDetails] = useState<Record<string, ChipDetailValue>>({});
  const [coachHints, setCoachHints] = useState<CoachHint[]>([]);
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null);
  const [snapshotSignals, setSnapshotSignals] = useState<SnapshotSignals | null>(null);
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

  // (a) Resolve logger mode on mount: fetch family entry count + loggerDefaultMode.
  // Default to Guided if count < 20 and no manual override.
  useEffect(() => {
    (async () => {
      try {
        const [famRes, snapRes] = await Promise.all([
          fetch('/api/family'),
          fetch('/api/snapshot'),
        ]);
        if (famRes.ok) {
          const fam = await famRes.json() as {
            loggerDefaultMode?: string | null;
            entryCount?: number;
          };
          if (fam.loggerDefaultMode === 'guided' || fam.loggerDefaultMode === 'quick') {
            setLoggerMode(fam.loggerDefaultMode);
          } else {
            setLoggerMode((fam.entryCount ?? 0) < 20 ? 'guided' : 'quick');
          }
        }
        if (snapRes.ok) {
          const wrapper = await snapRes.json() as { snapshotData: SnapshotData | null } | null;
          const snap = wrapper?.snapshotData ?? null;
          setSnapshotData(snap);
          if (snap?.children) {
            const perChild: SnapshotSignals['perChild'] = {};
            for (const [id, child] of Object.entries(snap.children)) {
              const active = (child.active_threads ?? []).map((t) => t.thread_id);
              const quiet = child.gap_analysis?.suggested_focus_threads ?? [];
              perChild[id] = { active, quiet };
            }
            setSnapshotSignals({
              perChild,
              onboarding: (snap.family?.total_entries ?? 0) < 20,
            });
          }
        }
      } catch { /* non-critical — mode stays quick, no snapshot */ }
    })();
  }, []);

  // Fetch scaffold data when navigating from a hearth session
  useEffect(() => {
    if (!scaffoldSessionId) return;
    fetch(`/api/scaffolds/${scaffoldSessionId}`)
      .then(res => res.ok ? res.json() : null)
      .then((data: ScaffoldData | null) => {
        if (!data) return;
        setScaffoldData(data);
        setDescription(data.session.sharedRecord ?? data.session.description ?? '');
        if (data.session.location) setLocation(data.session.location);
        if (data.attendingLearnerIds.length > 0) setSelectedLearners(data.attendingLearnerIds);
      })
      .catch(() => {});
  }, [scaffoldSessionId]);

  // ─── Draft auto-save (10s to localStorage) ───
  const [draftRestored, setDraftRestored] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const online = useOnlineStatus();

  // Restore draft on mount
  useEffect(() => {
    const d = parseDraft(localStorage.getItem(DRAFT_KEY));
    if (!d) return;
    // Hydrating draft state from localStorage on mount; each setter is gated on field presence.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (isRestorableDraft(d)) setDraftRestored(true);

    // If draft is stale (>4 hours old), trigger a draft_resume notification
    if (isStaleDraft(d, Date.now())) {
      const draftTitle = d.description?.slice(0, 40) || undefined;
      fetch('/api/notifications/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'draft_resume', draftTitle }),
      }).catch(() => {});
    }
  }, []);

  // Save draft every 10s
  useEffect(() => {
    const timer = setInterval(() => {
      if (!shouldPersistDraft({ description, selectedLearners })) return;
      const now = Date.now();
      localStorage.setItem(DRAFT_KEY, serializeDraft({
        description, selectedLearners, discoveries, activityType,
        lessonSubjects, engagement, whenDate, duration, location,
        observations, evidence,
      }, now));
      setLastSavedAt(now);
    }, 10_000);
    return () => clearInterval(timer);
  }, [description, selectedLearners, discoveries, activityType, lessonSubjects, engagement, whenDate, duration, location, observations, evidence]);

  // Clear draft on successful save
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setLastSavedAt(null);
    setDraftRestored(false);
  }, []);

  // ─── AI Insights ───
  // Two tiers: instant keyword matcher for fast feedback, debounced Haiku
  // draft-insight for warmer reflective copy + better thread detection.
  // The Haiku call only fires when description length ≥ 50 chars; the hook
  // enforces a 20-call-per-session client cap (decision B — firm caps).
  const [keywordMatch, setKeywordMatch] = useState<KeywordMatchResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedChildNames = useMemo(
    () =>
      learners
        .filter((l) => selectedLearners.includes(l.id))
        .map((l) => l.name),
    [learners, selectedLearners]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (description.length < 10) {
      // Reset stale keyword match when input shrinks below threshold; cleanup-style state reset.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKeywordMatch(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setKeywordMatch(matchKeywords(description, selectedChildNames));
    }, 1500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [description, selectedChildNames]);

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
  const coachHintsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (coachHintsDebounceRef.current) clearTimeout(coachHintsDebounceRef.current);
    if (description.length < 20 || selectedLearners.length === 0) {
      // Reset stale coach hints when input shrinks below threshold; cleanup-style state reset.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCoachHints([]);
      return;
    }
    const controller = new AbortController();
    coachHintsDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/logger/coach-hints', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            learnerIds: selectedLearners,
            activityType,
            description,
            observations,
          }),
          signal: controller.signal,
        });
        if (!controller.signal.aborted && res.ok) {
          const hints = await res.json() as CoachHint[];
          if (!controller.signal.aborted) setCoachHints(hints);
        }
      } catch { /* aborted or non-critical */ }
    }, 1200);
    return () => {
      if (coachHintsDebounceRef.current) clearTimeout(coachHintsDebounceRef.current);
      controller.abort();
    };
  }, [description, activityType, selectedLearners, observations]);

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

  const completenessLabel = useMemo(() => {
    if (completeness >= 90) return 'Excellent';
    if (completeness >= 70) return 'Great';
    if (completeness >= 55) return 'Strong';
    if (completeness >= 40) return 'Good';
    if (completeness >= 20) return 'Basic';
    return 'Getting Started';
  }, [completeness]);

  const completenessHint = useMemo(() => {
    if (completeness >= 90) return 'Ready to save';
    if (completeness >= 70) return 'Add evidence for richer record';
    if (completeness >= 55) return 'Add observations';
    if (completeness >= 40) return 'Rate engagement for each child';
    if (completeness >= 20) return 'Describe what happened';
    return 'Select who was learning';
  }, [completeness]);

  const canSave = canSaveEntry(completeness, loggerMode);

  // Concrete checklist of what's still missing before the entry can be saved.
  // Surfaced prominently in the mobile save bar so the parent never has to
  // guess why Save is disabled.
  const missingItems = useMemo(() => {
    const items: string[] = [];
    if (selectedLearners.length === 0) items.push('Pick who was learning');
    if (description.trim().length <= 20) items.push('Describe what happened');
    if (loggerMode === 'guided' && !activityType) items.push('Choose an activity');
    if (selectedLearners.length > 0 && !selectedLearners.some((id) => engagement[id]))
      items.push('Rate engagement');
    if (observations.length === 0) items.push('Add an observation');
    return items;
  }, [selectedLearners, description, activityType, engagement, observations, loggerMode]);

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
    setObservations((prev) =>
      prev.includes(chip) ? prev.filter((o) => o !== chip) : [...prev, chip]
    );
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

    const subjects = deriveSubjects(activityType, lessonSubjects);

    const evidenceUrls = derivePhotoEvidenceUrlsLegacy(evidence);

    const title = deriveEntryTitle(description);

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          dateOccurred: getDateOccurred(),
          subjects,
          learnerIds: selectedLearners,
          engagementPerLearner: engagement,
          discoveriesPerLearner: discoveries,
          evidenceUrls,
          observationDetails: loggerMode === 'guided' ? observationDetails : undefined,
          mode: loggerMode,
          source: scaffoldData ? 'hearth_session' : projectContext.source,
          sourceSessionId: scaffoldData?.session.id,
          projectId: projectContext.projectId,
          stageNumber: projectContext.stageNumber,
          status: 'complete',
        }),
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
      setCoachHints([]);
      setProfileNudge(null);
      setPedagogySources([]);

      // Poll for enrichment to complete (server runs it async after save).
      // Snapshot-rebuild also enqueues `badge_ready` notifications, so if the
      // parent misses this toast the Notification Centre will still surface it.
      if (savedEntryId) activeEnrichmentEntryIdRef.current = savedEntryId;
      (async () => {
        if (savedEntryId) {
          const POLL_INTERVAL_MS = 1500;
          const POLL_TIMEOUT_MS = 30000;
          const start = Date.now();
          while (Date.now() - start < POLL_TIMEOUT_MS) {
            // First check after 1.5s; enrichment is rarely ready sooner.
            await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
            if (activeEnrichmentEntryIdRef.current !== savedEntryId) break;
            try {
              const enrichedRes = await fetch(`/api/entries/${savedEntryId}`);
              if (!enrichedRes.ok) continue;
              const enrichedEntry = await enrichedRes.json() as {
                aiEnrichment?: AiEnrichment | null;
              };
              const enrichment = enrichedEntry?.aiEnrichment;
              if (!enrichment) continue;
              // Re-check the guard — the parent may have started a new entry
              // while the fetch was in flight.
              if (activeEnrichmentEntryIdRef.current !== savedEntryId) break;

              // Drive the post-save surface state machine. Pending → keep
              // polling; enriched/failed → write final state and stop.
              const status = enrichment.status;
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
              // Keep polling while status is 'pending' (the row exists but
              // enrichment hasn't completed). Only break on a terminal state.
              if (status === 'pending') continue;
              activeEnrichmentEntryIdRef.current = null;
              break;
            } catch {
              // transient — keep polling
            }
          }
          if (activeEnrichmentEntryIdRef.current === savedEntryId) {
            activeEnrichmentEntryIdRef.current = null;
          }
          // Poll timed out without a terminal status. Spec: "never a spinner
          // that hangs." Resolve the surface to a failed view so the parent
          // can exit; the DB row may still finish enriching later, and the
          // Portfolio retry affordance covers that case.
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
        }

        try {
          const badgeResults = await Promise.all(
            learnersToCheck.map(async (learnerId) => {
              const r = await fetch('/api/badges/check-thresholds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ learnerId }),
              });
              if (!r.ok) return [];
              const d = await r.json();
              return ((d.badgeIds ?? []) as string[]).map((badgeId) => ({ badgeId, learnerId }));
            })
          );
          const ready = badgeResults.flat();
          if (ready.length > 0) {
            const learnerNameById = new Map(learners.map((l) => [l.id, l.name]));
            const first = ready[0];
            const rest = ready.slice(1);
            const firstName = learnerNameById.get(first.learnerId) ?? '';
            const queueParam =
              rest.length > 0
                ? `&queue=${rest.map((r) => `${r.badgeId}:${r.learnerId}`).join(',')}`
                : '';
            const positionParam = ready.length > 1 ? `&qn=1&qt=${ready.length}` : '';
            const href = `/badges/assess/${first.badgeId}?learner=${first.learnerId}&name=${encodeURIComponent(firstName)}${queueParam}${positionParam}`;
            setToast({
              type: 'badge',
              message:
                ready.length > 1
                  ? `Hearth noticed something new — ${ready.length} quick checks ready.`
                  : 'Hearth noticed something new. Quick check?',
              action: { label: ready.length > 1 ? `Start (${ready.length})` : 'Now (2 min)', href },
            });
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

  const getLearnerColors = (learnerId: string) => {
    const learner = learners.find((l) => l.id === learnerId);
    return CHILD_COLORS[learner?.colourToken ?? 'rose'] ?? CHILD_COLORS.rose;
  };

  const getLearnerAge = (l: Learner) =>
    l.dateOfBirth ? differenceInYears(new Date(), new Date(l.dateOfBirth)) : null;

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
            onClick={() => setDraftRestored(false)}
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
          <section>
            <SectionHeader number={1} done={sectionDone[1]} label="Who was learning?" />
            <div className="flex flex-wrap gap-sm">
              {learners.map((learner) => {
                const selected = selectedLearners.includes(learner.id);
                const colors = CHILD_COLORS[learner.colourToken ?? 'rose'] ?? CHILD_COLORS.rose;
                const age = getLearnerAge(learner);
                return (
                  <button
                    key={learner.id}
                    onClick={() => toggleLearner(learner.id)}
                    className={`flex items-center gap-sm rounded-full border-[1.5px] px-md py-sm font-sans text-[0.8125rem] font-medium transition-all duration-200 ease-[var(--ease-default)] select-none ${
                      selected
                        ? `${colors.border} bg-ember-glow text-text-primary`
                        : 'border-border-subtle text-text-secondary hover:border-border-medium hover:text-text-primary'
                    }`}
                  >
                    <span className="text-base">{learner.shapeIcon}</span>
                    <span>{learner.name}{age !== null ? `, ${age}` : ''}</span>
                  </button>
                );
              })}
            </div>
            {selectedLearners.length >= 2 && (
              <label className="mt-sm flex items-center gap-sm font-sans text-sm text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={togetherMode}
                  onChange={(e) => setTogetherMode(e.target.checked)}
                  className="accent-ember"
                />
                Learning together
              </label>
            )}
            {/* (b) WatchForTodayStrip — shown below children when selected */}
            {selectedLearners.length > 0 && (
              <div className="mt-md">
                <WatchForTodayStrip
                  learners={learners
                    .filter((l) => selectedLearners.includes(l.id))
                    .map((l) => ({ id: l.id, name: l.name, colourToken: l.colourToken }))}
                  snapshotData={snapshotData}
                />
              </div>
            )}
          </section>

          {/* Section 2: What Happened? */}
          <section>
            <SectionHeader number={2} done={sectionDone[2]} label={vocab.logWhatLabel} />

            {/* 2a: Description */}
            <div className="mb-lg">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={vocab.logWhatPlaceholder}
                rows={4}
                className="w-full min-h-[100px] rounded-lg border border-border-subtle bg-surface-body p-md font-serif text-base text-text-primary leading-[1.7] placeholder:text-text-muted focus:border-ember focus:outline-none focus:shadow-focus transition-all duration-200 resize-y"
              />
              <div className="mt-sm flex items-center gap-xs">
                <button
                  onClick={isRecording ? stopVoiceInput : startVoiceInput}
                  className={`flex items-center gap-xs rounded-sm px-sm py-xs font-sans text-[0.75rem] font-medium transition-all duration-200 ${
                    isRecording
                      ? 'bg-ember-glow border border-ember text-ember animate-pulse'
                      : 'bg-surface-raised border border-border-subtle text-text-muted hover:border-border-medium hover:text-text-secondary'
                  }`}
                >
                  <span className="inline-flex items-center gap-xs"><Microphone size={14} aria-hidden="true" /> {isRecording ? 'Recording…' : 'Voice'}</span>
                </button>
                <span className="ml-auto font-sans text-[0.6875rem] text-text-muted">
                  {description.length > 0 ? `${description.length}` : ''}
                </span>
              </div>
            </div>

            {/* 2b: Per-child discoveries */}
            <div className="mb-lg space-y-md">
              {selectedLearners.length === 0 ? (
                <p className="font-serif text-sm italic text-text-muted">
                  Select learners above...
                </p>
              ) : (
                <><div className="flex items-center gap-md my-xl">
                  <div className="flex-1 h-px bg-border-subtle" />
                  <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-text-muted">Individual Discoveries</span>
                  <div className="flex-1 h-px bg-border-subtle" />
                </div>
                {selectedLearners.map((id) => {
                  const learner = learners.find((l) => l.id === id);
                  if (!learner) return null;
                  const colors = getLearnerColors(id);
                  return (
                    <div
                      key={id}
                      className={`rounded-md border ${colors.border} p-md ${colors.ring} ring-1 ring-transparent transition-all duration-200`}
                    >
                      <label className={`flex items-center gap-sm font-sans text-[0.75rem] font-semibold ${colors.text} mb-sm`}>
                        <span className={`h-[10px] w-[10px] rounded-full ${colors.border.replace('border', 'bg')}`} />
                        What did {learner.name} notice or discover?
                      </label>
                      <textarea
                        value={discoveries[id] ?? ''}
                        onChange={(e) =>
                          setDiscoveries((prev) => ({ ...prev, [id]: e.target.value }))
                        }
                        placeholder="Something they said, wondered about, or figured out..."
                        rows={2}
                        className="w-full min-h-[70px] rounded-md border border-border-subtle bg-surface-body p-sm font-serif text-[0.9375rem] text-text-primary leading-[1.6] placeholder:text-text-muted focus:outline-none focus:border-ember focus:shadow-focus resize-y"
                      />
                      {(() => {
                        const engLevel = engagement[id];
                        const discLen = (discoveries[id] ?? '').length;
                        if (!engLevel || discLen > 20) return null;
                        const hints: Record<number, string> = {
                          4: `What specifically delighted ${learner.name}? Something they said or did?`,
                          3: `What stood out about how ${learner.name} engaged?`,
                          2: `Was anything unclear or uninteresting to ${learner.name}?`,
                          1: `What made this hard for ${learner.name}? Did they push through or step away?`,
                        };
                        return (
                          <p className="mt-xs inline-flex items-start gap-xs font-sans text-[11px] text-ember/60 italic">
                            <ChatCircleDots size={12} className="mt-[2px] shrink-0" aria-hidden="true" /> {hints[engLevel]}
                          </p>
                        );
                      })()}
                    </div>
                  );
                })}
                </>
              )}
            </div>

            {/* 2c: Activity type grid */}
            <div className="mt-lg">
              <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">
                Activity type
              </p>
              <div className="grid grid-cols-4 lg:grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-sm">
                {ACTIVITY_TYPES.map((type) => {
                  const selected = activityType === type.key;
                  return (
                    <button
                      key={type.key}
                      onClick={() => setActivityType(selected ? null : type.key)}
                      className={`flex flex-col items-center gap-xs rounded-md border-[1.5px] px-sm py-md font-sans text-[0.6875rem] font-semibold transition-all duration-200 ease-[var(--ease-default)] ${
                        selected
                          ? 'border-ember bg-ember-glow text-text-primary'
                          : 'border-border-subtle bg-surface-body text-text-secondary hover:border-border-medium hover:bg-surface-raised'
                      }`}
                    >
                      <span className="inline-flex" aria-hidden="true"><type.Icon size={22} /></span>
                      <span className="text-center leading-tight">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lesson subject picker */}
            {activityType === 'structured' && (
              <div className="mt-md">
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary mb-sm">
                  Which subjects?
                </p>
                <div className="flex flex-wrap gap-sm">
                  {SUBJECTS.map((s) => {
                    const sel = lessonSubjects.includes(s.key);
                    return (
                      <button
                        key={s.key}
                        onClick={() =>
                          setLessonSubjects((prev) =>
                            sel ? prev.filter((x) => x !== s.key) : [...prev, s.key]
                          )
                        }
                        className={`flex items-center gap-xs rounded-full px-sm py-xs font-sans text-xs transition-all duration-200 min-h-[32px] ${
                          sel
                            ? 'bg-ember-glow border border-ember text-text-primary'
                            : 'border border-border-subtle text-text-secondary hover:border-border-medium'
                        }`}
                      >
                        <span className="inline-flex items-center gap-xs"><s.Icon size={14} aria-hidden="true" /> {s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Section 3: How Engaged Were They? */}
          <section>
            <SectionHeader number={3} done={sectionDone[3]} label="How engaged were they?" optional="Rate each child" />
            {selectedLearners.length === 0 ? (
              <p className="font-serif text-sm italic text-text-muted">
                Select children first
              </p>
            ) : (
              <div className="space-y-sm">
                {selectedLearners.map((id) => {
                  const learner = learners.find((l) => l.id === id);
                  if (!learner) return null;
                  const colors = getLearnerColors(id);
                  return (
                    <div key={id} className={`flex items-center justify-between gap-md rounded-md border ${colors.border} ${colors.bg} px-md py-sm`}>
                      <div className="flex items-center gap-sm">
                        <span className={`h-[10px] w-[10px] rounded-full ${colors.border.replace('border', 'bg')} shrink-0`} />
                        <span className="font-sans text-[0.875rem] font-semibold text-text-primary">{learner.name}</span>
                      </div>
                      <div className="flex gap-xs">
                        {ENGAGEMENT_LEVELS.map((level) => {
                          const selected = engagement[id] === level.value;
                          return (
                            <button
                              key={level.value}
                              onClick={() =>
                                setEngagement((prev) => ({ ...prev, [id]: level.value }))
                              }
                              title={level.label}
                              className={`flex h-[36px] w-[36px] items-center justify-center rounded-sm border-[1.5px] text-[1.125rem] transition-all duration-200 ease-[var(--ease-default)] ${
                                selected
                                  ? `${colors.bg} ${colors.border} scale-110 opacity-100`
                                  : 'bg-surface-body border-border-subtle opacity-60 hover:opacity-100 hover:border-border-medium hover:scale-105'
                              }`}
                            >
                              {level.emoji}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Section 4: When & Where */}
          <section>
            <SectionHeader number={4} done={sectionDone[4]} label="When & Where" />
            <div className="flex flex-wrap gap-md">
              {/* When */}
              <div className="flex-1 min-w-[140px]">
                <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">When</p>
                <div className="flex flex-wrap gap-xs">
                  {(['today', 'yesterday', 'earlier'] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => setWhenDate(w)}
                      className={`rounded-sm px-sm py-xs font-sans text-[0.75rem] font-medium whitespace-nowrap transition-all duration-200 ${
                        whenDate === w
                          ? 'bg-ember-glow border border-ember text-text-primary'
                          : 'bg-surface-body border border-border-subtle text-text-muted hover:border-border-medium hover:text-text-secondary'
                      }`}
                    >
                      {w.charAt(0).toUpperCase() + w.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div className="flex-1 min-w-[140px]">
                <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">Duration</p>
                <div className="flex flex-wrap gap-xs">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(duration === d ? null : d)}
                      className={`rounded-sm px-sm py-xs font-sans text-[0.75rem] font-medium whitespace-nowrap transition-all duration-200 ${
                        duration === d
                          ? 'bg-ember-glow border border-ember text-text-primary'
                          : 'bg-surface-body border border-border-subtle text-text-muted hover:border-border-medium hover:text-text-secondary'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Where */}
              <div className="flex-1 min-w-[140px]">
                <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">Where</p>
                <div className="flex flex-wrap gap-xs">
                  {WHERE_OPTIONS.map((w) => (
                    <button
                      key={w.key}
                      onClick={() => setLocation(location === w.key ? null : w.key)}
                      className={`rounded-sm px-sm py-xs font-sans text-[0.75rem] font-medium whitespace-nowrap transition-all duration-200 ${
                        location === w.key
                          ? 'bg-ember-glow border border-ember text-text-primary'
                          : 'bg-surface-body border border-border-subtle text-text-muted hover:border-border-medium hover:text-text-secondary'
                      }`}
                    >
                      <span className="inline-flex items-center gap-xs"><w.Icon size={14} aria-hidden="true" /> {w.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: What Did You Observe? */}
          <section>
            <SectionHeader number={5} done={sectionDone[5]} label={vocab.logObserveLabel} />
            <div className="space-y-md">
              {OBSERVATION_CATEGORIES.map((cat) => {
                const colorClasses = OBS_COLOR_CLASSES[cat.color] ?? OBS_COLOR_CLASSES['child-sage'];
                return (
                  <div key={cat.label}>
                    <div className="flex items-center gap-sm mb-sm">
                      <div className={`h-[8px] w-[8px] rounded-full ${colorClasses.dot}`} />
                      <span className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary">
                        {cat.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-xs">
                      {cat.chips.map((chip) => {
                        const sel = observations.includes(chip);
                        return (
                          <div key={chip}>
                            <button
                              onClick={() => {
                                toggleObservation(chip);
                                if (sel) {
                                  setObservationDetails((prev) => {
                                    const next = { ...prev };
                                    delete next[chip];
                                    return next;
                                  });
                                }
                              }}
                              className={`rounded-full px-sm py-xs font-sans text-xs transition-all duration-200 min-h-[32px] ${
                                sel
                                  ? `${colorClasses.selectedBg} border ${colorClasses.selectedBorder} text-text-primary`
                                  : 'border border-border-subtle text-text-secondary hover:border-border-medium'
                              }`}
                            >
                              {chip}
                            </button>
                            {loggerMode === 'guided' && sel && DETAIL_CHIPS.has(chip) && (
                              <ObservationChipDetail
                                chip={chip}
                                value={observationDetails[chip] ?? { detail: '' }}
                                onChange={(val) =>
                                  setObservationDetails((prev) => ({ ...prev, [chip]: val }))
                                }
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 6: Evidence */}
          <section>
            <SectionHeader number={6} done={sectionDone[6]} label="Evidence" optional="Optional" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm mb-md">
              {([
                { key: 'photo', Icon: Camera,     label: 'Add Photo' },
                { key: 'audio', Icon: Microphone, label: 'Record Audio' },
                { key: 'quote', Icon: ChatCircle, label: "Child's Words" },
                { key: 'note',  Icon: Note,       label: 'Add Note' },
                { key: 'link',  Icon: LinkSimple, label: 'Link Resource' },
              ] as ReadonlyArray<{ key: string; Icon: LogIconC; label: string }>).map((tool) => {
                const hasItems = evidence.some((e) => e.type === tool.key);
                return (
                  <button
                    key={tool.key}
                    onClick={() => setEvidenceModal(tool.key)}
                    className={`flex flex-col items-center gap-xs rounded-md border-2 p-md font-sans text-sm transition-all duration-200 min-h-[44px] ${
                      hasItems
                        ? 'border-sage bg-sage/5 text-sage'
                        : 'border-dashed border-border-medium text-text-secondary hover:border-ember hover:text-text-primary'
                    }`}
                  >
                    <span className="inline-flex" aria-hidden="true"><tool.Icon size={22} /></span>
                    <span className="text-xs">{tool.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Evidence items */}
            {evidence.length > 0 && (
              <div className="space-y-sm">
                {evidence.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-sm rounded-md border border-border-subtle bg-surface-raised p-sm"
                  >
                    <span className="font-sans text-xs font-medium uppercase tracking-wider text-text-muted bg-surface-hover rounded px-xs py-[2px]">
                      {item.type}
                    </span>
                    <span className="flex-1 font-serif text-sm text-text-secondary truncate">
                      {item.type === 'photo'
                        ? item.caption || 'Photo'
                        : item.type === 'link'
                          ? item.name || item.url || 'Link'
                          : item.content.slice(0, 60)}
                    </span>
                    <button
                      onClick={() => setEvidence((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-text-muted hover:text-text-primary min-h-[32px] min-w-[32px] flex items-center justify-center"
                      aria-label="Remove evidence item"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
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
          className="w-full flex items-center justify-center gap-sm border-t border-border-subtle bg-surface-panel px-md py-sm"
        >
          <div className="h-[4px] w-[32px] rounded-full bg-border-medium" />
          <span className="font-sans text-xs font-medium text-text-secondary">
            {insightsExpanded ? 'Hide' : 'Show'} Insights
          </span>
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

