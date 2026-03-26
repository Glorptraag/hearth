'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { format, subDays, differenceInYears } from 'date-fns';
import { matchKeywords, type KeywordMatchResult } from '@/lib/ai/keyword-matcher';

type Learner = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  shapeIcon: string | null;
  colourToken: string | null;
};

type EvidenceItem = {
  type: 'photo' | 'quote' | 'note' | 'link';
  content: string;
  caption?: string;
  url?: string;
  name?: string;
};

const ACTIVITY_TYPES = [
  { key: 'nature', label: 'Nature Study', emoji: '🌿' },
  { key: 'cooking', label: 'Kitchen Science', emoji: '🍳' },
  { key: 'reading', label: 'Reading', emoji: '📖' },
  { key: 'art', label: 'Creative Arts', emoji: '🎨' },
  { key: 'physical', label: 'Physical', emoji: '⚽' },
  { key: 'social', label: 'Social', emoji: '🤝' },
  { key: 'structured', label: 'Lesson', emoji: '📝' },
  { key: 'freeplay', label: 'Free Play', emoji: '✨' },
] as const;

const ACTIVITY_SUBJECT_MAP: Record<string, string[]> = {
  nature: ['science'],
  cooking: ['mathematics', 'science'],
  reading: ['english'],
  art: ['arts'],
  physical: ['hpe'],
  social: ['hass'],
  structured: [],
  freeplay: [],
};

const SUBJECTS = [
  { key: 'english', label: 'English', emoji: '📚' },
  { key: 'mathematics', label: 'Maths', emoji: '🔢' },
  { key: 'science', label: 'Science', emoji: '🔬' },
  { key: 'hass', label: 'HASS', emoji: '🌏' },
  { key: 'arts', label: 'Arts', emoji: '🎨' },
  { key: 'technologies', label: 'Technologies', emoji: '⚙️' },
  { key: 'hpe', label: 'HPE', emoji: '🏃' },
  { key: 'languages', label: 'Languages', emoji: '🗣️' },
];

const ENGAGEMENT_LEVELS = [
  { value: 4, emoji: '😊', label: 'Loved it' },
  { value: 3, emoji: '🙂', label: 'Engaged' },
  { value: 2, emoji: '😐', label: 'Okay' },
  { value: 1, emoji: '😕', label: 'Struggled' },
];

const DURATION_OPTIONS = ['~5 min', '~15 min', '~30 min', '1 hr+'];
const WHERE_OPTIONS = [
  { key: 'home', label: 'Home', emoji: '🏠' },
  { key: 'outdoors', label: 'Outdoors', emoji: '🌳' },
  { key: 'community', label: 'Community', emoji: '🏛' },
  { key: 'online', label: 'Online', emoji: '💻' },
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
  amber: { border: 'border-amber-400', bg: 'bg-amber-400/10', text: 'text-amber-400', ring: 'focus-within:ring-amber-400/30' },
};

const OBS_COLOR_CLASSES: Record<string, { dot: string; selectedBg: string; selectedBorder: string }> = {
  'child-sage': { dot: 'bg-child-sage', selectedBg: 'bg-child-sage/10', selectedBorder: 'border-child-sage/30' },
  'child-blue': { dot: 'bg-child-blue', selectedBg: 'bg-child-blue/10', selectedBorder: 'border-child-blue/30' },
  'child-violet': { dot: 'bg-child-violet', selectedBg: 'bg-child-violet/10', selectedBorder: 'border-child-violet/30' },
  'child-rose': { dot: 'bg-child-rose', selectedBg: 'bg-child-rose/10', selectedBorder: 'border-child-rose/30' },
};

function SectionIndicator({ number, done }: { number: number; done: boolean }) {
  return (
    <div
      className={`flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full border-2 font-sans text-xs font-semibold transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        done ? 'bg-ember border-ember text-text-inverse' : 'border-border-medium text-text-muted'
      }`}
    >
      {done ? '✓' : number}
    </div>
  );
}

function CompletenessRing({ score }: { score: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 90 ? 'var(--color-sage)' : 'var(--color-ember)';

  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-border-subtle)" strokeWidth="3" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
        className="transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
      />
      <text
        x="20"
        y="20"
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--color-text-primary)"
        fontSize="10"
        fontFamily="var(--font-sans)"
        fontWeight="600"
      >
        {score}
      </text>
    </svg>
  );
}

export default function LogPage() {
  // ─── Data ───
  const [learners, setLearners] = useState<Learner[]>([]);
  useEffect(() => {
    fetch('/api/learners')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setLearners(data); });
  }, []);

  // ─── Form state ───
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

  // ─── AI Insights (keyword matcher) ───
  const [keywordMatch, setKeywordMatch] = useState<KeywordMatchResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (description.length < 10) {
      setKeywordMatch(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      const childNames = learners
        .filter((l) => selectedLearners.includes(l.id))
        .map((l) => l.name);
      setKeywordMatch(matchKeywords(description, childNames));
    }, 1500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [description, selectedLearners, learners]);

  // ─── UI state ───
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [evidenceModal, setEvidenceModal] = useState<string | null>(null);
  const [insightsExpanded, setInsightsExpanded] = useState(false);
  const recognitionRef = useRef<any>(null);

  // ─── Completeness ───
  const completeness = useMemo(() => {
    let score = 0;
    if (selectedLearners.length > 0) score += 20;
    if (description.length > 20) score += 15;
    else if (description.length > 0) score += 5;
    if (selectedLearners.length > 0) {
      const withDisc = selectedLearners.filter((id) => (discoveries[id] || '').length > 10).length;
      score += Math.round((withDisc / selectedLearners.length) * 10);
    }
    if (activityType) score += 5;
    if (selectedLearners.length > 0) {
      const rated = selectedLearners.filter((id) => engagement[id]).length;
      score += Math.round((rated / selectedLearners.length) * 15);
    }
    score += 3; // when always pre-selected
    if (duration) score += 3;
    if (location) score += 4;
    if (observations.length >= 3) score += 15;
    else score += Math.min(observations.length * 5, 15);
    if (evidence.length >= 2) score += 10;
    else if (evidence.length === 1) score += 5;
    return Math.min(score, 100);
  }, [selectedLearners, description, discoveries, activityType, engagement, duration, location, observations, evidence]);

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

  const canSave = completeness >= 50;

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

  const startVoiceInput = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('Voice input is not supported in your browser. Try Chrome or Edge.');
      return;
    }
    const recognition = new SR();
    recognition.lang = 'en-AU';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognitionRef.current = recognition;
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setDescription((prev) => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    setIsRecording(true);
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const handleSave = async () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);

    const subjects =
      activityType === 'structured'
        ? lessonSubjects
        : ACTIVITY_SUBJECT_MAP[activityType ?? ''] ?? [];

    const evidenceUrls = evidence
      .filter((e) => e.type === 'photo')
      .map((e) => e.content);

    const title = description.slice(0, 60).trim() + (description.length > 60 ? '...' : '');

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
          source: 'logger',
          status: 'complete',
        }),
      });

      if (!res.ok) throw new Error('Save failed');

      setToast({ type: 'success', message: 'Learning entry saved!' });
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
    } catch {
      setToast({ type: 'error', message: 'Failed to save. Please try again.' });
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
  return (
    <div className="relative">
      {/* Header bar with completeness */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-surface-panel px-md py-sm">
        <h1 className="font-serif text-xl font-semibold text-text-primary">Log Learning</h1>
        <div className="flex items-center gap-sm">
          <div className="text-right">
            <p className="font-sans text-xs font-semibold text-text-secondary">{completenessLabel}</p>
            <p className="font-sans text-[10px] text-text-muted">{completenessHint}</p>
          </div>
          <CompletenessRing score={completeness} />
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className={`rounded-md px-md py-sm font-sans text-sm font-semibold transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              canSave
                ? 'bg-ember text-text-inverse cursor-pointer hover:bg-ember-hover'
                : 'bg-surface-raised text-text-muted opacity-50 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="lg:flex lg:gap-xl">
        {/* ─── Left: Capture Form ─── */}
        <div className="flex-1 space-y-lg px-md py-lg max-w-3xl">
          {/* Section 1: Who Was Learning? */}
          <section className="rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-sm mb-lg">
              <SectionIndicator number={1} done={sectionDone[1]} />
              <h2 className="font-serif text-lg font-semibold text-text-primary">Who Was Learning?</h2>
            </div>
            <div className="flex flex-wrap gap-sm">
              {learners.map((learner) => {
                const selected = selectedLearners.includes(learner.id);
                const colors = CHILD_COLORS[learner.colourToken ?? 'rose'] ?? CHILD_COLORS.rose;
                const age = getLearnerAge(learner);
                return (
                  <button
                    key={learner.id}
                    onClick={() => toggleLearner(learner.id)}
                    className={`flex items-center gap-sm rounded-lg border-2 px-md py-sm font-sans text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-[44px] ${
                      selected
                        ? `${colors.border} bg-ember-glow`
                        : 'border-border-subtle hover:border-border-medium'
                    }`}
                  >
                    <span className="text-lg">{learner.shapeIcon}</span>
                    <span className="text-text-primary">{learner.name}</span>
                    {age !== null && <span className="text-text-muted text-xs">({age})</span>}
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
          </section>

          {/* Section 2: What Happened? */}
          <section className="rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-sm mb-lg">
              <SectionIndicator number={2} done={sectionDone[2]} />
              <h2 className="font-serif text-lg font-semibold text-text-primary">What Happened?</h2>
            </div>

            {/* 2a: Description */}
            <div className="mb-lg">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the activity or moment... What were they doing? Where did it happen?"
                rows={4}
                className="w-full rounded-md border border-border-subtle bg-surface-raised p-md font-serif text-base text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none focus:ring-1 focus:ring-ember/30 transition-all duration-200 resize-y"
              />
              <div className="mt-xs flex items-center justify-between">
                <button
                  onClick={isRecording ? stopVoiceInput : startVoiceInput}
                  className={`flex items-center gap-xs rounded-md px-sm py-xs font-sans text-xs transition-all duration-200 min-h-[36px] ${
                    isRecording
                      ? 'bg-ember text-text-inverse animate-pulse'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  🎤 {isRecording ? 'Recording...' : 'Voice input'}
                </button>
                {description.length > 0 && (
                  <span className="font-sans text-xs text-text-muted">{description.length} chars</span>
                )}
              </div>
            </div>

            {/* 2b: Per-child discoveries */}
            <div className="mb-lg space-y-sm">
              {selectedLearners.length === 0 ? (
                <p className="font-serif text-sm italic text-text-muted">
                  Select children above to add discoveries
                </p>
              ) : (
                selectedLearners.map((id) => {
                  const learner = learners.find((l) => l.id === id);
                  if (!learner) return null;
                  const colors = getLearnerColors(id);
                  return (
                    <div
                      key={id}
                      className={`rounded-md border ${colors.border} p-sm ${colors.ring} ring-1 ring-transparent transition-all duration-200`}
                    >
                      <label className={`font-sans text-xs font-medium ${colors.text} mb-xs block`}>
                        What did {learner.name} notice or discover?
                      </label>
                      <textarea
                        value={discoveries[id] ?? ''}
                        onChange={(e) =>
                          setDiscoveries((prev) => ({ ...prev, [id]: e.target.value }))
                        }
                        placeholder="Something they said, wondered about, or figured out..."
                        rows={2}
                        className="w-full rounded-sm border-none bg-transparent font-serif text-sm text-text-primary placeholder:text-text-muted focus:outline-none resize-none"
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* 2c: Activity type grid */}
            <div>
              <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary mb-sm">
                Activity Type
              </p>
              <div className="grid grid-cols-4 gap-sm">
                {ACTIVITY_TYPES.map((type) => {
                  const selected = activityType === type.key;
                  return (
                    <button
                      key={type.key}
                      onClick={() => setActivityType(selected ? null : type.key)}
                      className={`flex flex-col items-center gap-xs rounded-md border p-sm font-sans text-xs transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] min-h-[44px] ${
                        selected
                          ? 'border-ember bg-ember-glow text-text-primary'
                          : 'border-border-subtle text-text-secondary hover:border-border-medium'
                      }`}
                    >
                      <span className="text-lg">{type.emoji}</span>
                      <span>{type.label}</span>
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
                        {s.emoji} {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          {/* Section 3: How Engaged Were They? */}
          <section className="rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-sm mb-lg">
              <SectionIndicator number={3} done={sectionDone[3]} />
              <h2 className="font-serif text-lg font-semibold text-text-primary">How Engaged Were They?</h2>
            </div>
            {selectedLearners.length === 0 ? (
              <p className="font-serif text-sm italic text-text-muted">
                Select children first
              </p>
            ) : (
              <div className="space-y-md">
                {selectedLearners.map((id) => {
                  const learner = learners.find((l) => l.id === id);
                  if (!learner) return null;
                  const colors = getLearnerColors(id);
                  return (
                    <div key={id} className="flex items-center gap-md">
                      <div className="flex items-center gap-sm min-w-[80px]">
                        <div className={`h-[8px] w-[8px] rounded-full ${colors.border.replace('border', 'bg')}`} />
                        <span className="font-sans text-sm text-text-primary">{learner.name}</span>
                      </div>
                      <div className="flex gap-sm">
                        {ENGAGEMENT_LEVELS.map((level) => {
                          const selected = engagement[id] === level.value;
                          return (
                            <button
                              key={level.value}
                              onClick={() =>
                                setEngagement((prev) => ({ ...prev, [id]: level.value }))
                              }
                              title={level.label}
                              className={`flex h-[44px] w-[44px] items-center justify-center rounded-md border text-xl transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                                selected
                                  ? `${colors.bg} ${colors.border} scale-110`
                                  : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
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
          <section className="rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-sm mb-lg">
              <SectionIndicator number={4} done={sectionDone[4]} />
              <h2 className="font-serif text-lg font-semibold text-text-primary">When & Where</h2>
            </div>
            <div className="flex flex-wrap gap-lg">
              {/* When */}
              <div>
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary mb-sm">When</p>
                <div className="flex gap-sm">
                  {(['today', 'yesterday', 'earlier'] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => setWhenDate(w)}
                      className={`rounded-full px-md py-xs font-sans text-xs font-medium transition-all duration-200 min-h-[32px] ${
                        whenDate === w
                          ? 'bg-ember text-text-inverse'
                          : 'border border-border-subtle text-text-secondary hover:border-border-medium'
                      }`}
                    >
                      {w.charAt(0).toUpperCase() + w.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary mb-sm">Duration</p>
                <div className="flex gap-sm">
                  {DURATION_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(duration === d ? null : d)}
                      className={`rounded-full px-md py-xs font-sans text-xs font-medium transition-all duration-200 min-h-[32px] ${
                        duration === d
                          ? 'bg-ember text-text-inverse'
                          : 'border border-border-subtle text-text-secondary hover:border-border-medium'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Where */}
              <div>
                <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary mb-sm">Where</p>
                <div className="flex gap-sm">
                  {WHERE_OPTIONS.map((w) => (
                    <button
                      key={w.key}
                      onClick={() => setLocation(location === w.key ? null : w.key)}
                      className={`flex items-center gap-xs rounded-full px-md py-xs font-sans text-xs font-medium transition-all duration-200 min-h-[32px] ${
                        location === w.key
                          ? 'bg-ember text-text-inverse'
                          : 'border border-border-subtle text-text-secondary hover:border-border-medium'
                      }`}
                    >
                      {w.emoji} {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: What Did You Observe? */}
          <section className="rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-sm mb-lg">
              <SectionIndicator number={5} done={sectionDone[5]} />
              <h2 className="font-serif text-lg font-semibold text-text-primary">What Did You Observe?</h2>
            </div>
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
                          <button
                            key={chip}
                            onClick={() => toggleObservation(chip)}
                            className={`rounded-full px-sm py-xs font-sans text-xs transition-all duration-200 min-h-[32px] ${
                              sel
                                ? `${colorClasses.selectedBg} border ${colorClasses.selectedBorder} text-text-primary`
                                : 'border border-border-subtle text-text-secondary hover:border-border-medium'
                            }`}
                          >
                            {chip}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 6: Evidence */}
          <section className="rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-sm mb-xs">
              <SectionIndicator number={6} done={sectionDone[6]} />
              <h2 className="font-serif text-lg font-semibold text-text-primary">Evidence</h2>
            </div>
            <p className="font-sans text-xs text-text-muted mb-md ml-[36px]">
              Optional but strengthens the record.
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-sm mb-md">
              {[
                { key: 'photo', emoji: '📷', label: 'Add Photo' },
                { key: 'quote', emoji: '💬', label: "Child's Words" },
                { key: 'note', emoji: '📝', label: 'Add Note' },
                { key: 'link', emoji: '🔗', label: 'Link Resource' },
              ].map((tool) => {
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
                    <span className="text-xl">{tool.emoji}</span>
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
                      className="text-text-muted hover:text-text-primary text-sm min-h-[32px] min-w-[32px] flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* ─── Right: AI Insights Panel (desktop) ─── */}
        <aside className="hidden lg:block lg:w-[400px] lg:shrink-0">
          <div className="sticky top-[57px] p-lg">
            <div className="rounded-lg border border-border-subtle bg-surface-panel p-xl shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-sm mb-lg">
                <span className="text-ember text-lg">✨</span>
                <h3 className="font-serif text-base font-semibold text-text-primary">Hearth Insights</h3>
              </div>
              <InsightsContent match={keywordMatch} />
            </div>
          </div>
        </aside>
      </div>

      {/* ─── Mobile AI Insights Drawer ─── */}
      <div className="lg:hidden fixed bottom-[72px] left-0 right-0 z-40">
        <button
          onClick={() => setInsightsExpanded(!insightsExpanded)}
          className="w-full flex items-center justify-center gap-sm border-t border-border-subtle bg-surface-panel px-md py-sm"
        >
          <div className="h-[4px] w-[32px] rounded-full bg-border-medium" />
          <span className="font-sans text-xs font-medium text-text-secondary">
            {insightsExpanded ? 'Hide' : 'Show'} Insights
          </span>
        </button>
        {insightsExpanded && (
          <div className="max-h-[60vh] overflow-y-auto border-t border-border-subtle bg-surface-panel p-xl">
            <div className="flex items-center gap-sm mb-md">
              <span className="text-ember text-lg">✨</span>
              <h3 className="font-serif text-base font-semibold text-text-primary">Hearth Insights</h3>
            </div>
            <InsightsContent match={keywordMatch} />
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
          className={`fixed bottom-[80px] left-1/2 -translate-x-1/2 z-50 rounded-md px-lg py-sm font-sans text-sm font-medium shadow-[var(--shadow-medium)] transition-all duration-200 ${
            toast.type === 'success'
              ? 'bg-sage/20 text-sage border border-sage/30'
              : 'bg-red-900/20 text-red-400 border border-red-900/30'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

// ─── Insights Content Component ───

const THREAD_LABELS: Record<string, string> = {
  L1: 'Oral Communication', L2: 'Phonological Awareness', L3: 'Reading Comprehension',
  L4: 'Vocabulary', L5: 'Written Expression', L6: 'Spelling & Grammar',
  L7: 'Narrative', L8: 'Persuasion', L9: 'Literary Appreciation',
  M1: 'Number Sense', M2: 'Operations', M3: 'Fractional Thinking',
  M4: 'Algebraic Thinking', M5: 'Measurement', M6: 'Spatial Reasoning',
  M7: 'Data & Statistics', M8: 'Probability', M9: 'Mathematical Modelling',
  S1: 'Scientific Inquiry', S2: 'Biological Sciences', S3: 'Chemical Sciences',
  S4: 'Physical Sciences', S5: 'Scientific Observation', S6: 'Earth & Space',
  H1: 'Historical Understanding', H2: 'Source Analysis', H3: 'Geographical Understanding',
  H4: 'Civics & Citizenship', H5: 'Economics & Business', H6: 'Cultural Understanding',
  P1: 'Gross Motor', P2: 'Fine Motor', P3: 'Body Awareness', P4: 'Team & Sport', P5: 'Aquatics',
  PS1: 'Empathy', PS2: 'Social Skills', PS3: 'Self-Regulation', PS4: 'Identity',
  PS5: 'Responsibility', PS6: 'Resilience', PS7: 'Safety',
  C1: 'Visual Art', C2: 'Music', C3: 'Drama', C4: 'Dance', C5: 'Media Arts',
  C6: 'Design & Construction', C7: 'Arts Appreciation',
  EF1: 'Sustained Attention', EF2: 'Working Memory', EF3: 'Cognitive Flexibility',
  EF4: 'Planning', EF5: 'Critical Thinking', EF6: 'Collaboration',
  EF7: 'Metacognition', EF8: 'Transfer',
};

function InsightsContent({ match }: { match: KeywordMatchResult | null }) {
  if (!match) {
    return (
      <div className="flex flex-col items-center justify-center py-xl text-center">
        <span className="text-4xl mb-md opacity-30">🙂</span>
        <p className="font-serif text-sm text-text-muted italic leading-relaxed">
          Start describing the activity and I&apos;ll begin finding the learning within it.
        </p>
      </div>
    );
  }

  const hasResults = match.subjects.length > 0 || match.threads.length > 0 || match.engagement || match.mentionedChildren.length > 0;

  if (!hasResults) {
    return (
      <div className="flex flex-col items-center justify-center py-xl text-center">
        <span className="text-4xl mb-md opacity-30">🔍</span>
        <p className="font-serif text-sm text-text-muted italic leading-relaxed">
          Keep writing — I&apos;m looking for learning signals...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-md">
      <p className="font-sans text-[10px] uppercase tracking-[0.1em] text-text-muted">
        Preliminary — confirmed after save
      </p>

      {match.subjects.length > 0 && (
        <div>
          <p className="font-sans text-xs font-semibold text-text-secondary mb-xs">Subjects detected</p>
          <div className="flex flex-wrap gap-xs">
            {match.subjects.map((s) => (
              <span key={s} className="rounded-full bg-ember-glow border border-ember/20 px-sm py-xs font-sans text-xs text-text-primary">
                📐 Looks like {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {match.threads.length > 0 && (
        <div>
          <p className="font-sans text-xs font-semibold text-text-secondary mb-xs">Capability threads</p>
          <div className="flex flex-wrap gap-xs">
            {match.threads.slice(0, 6).map((t) => (
              <span key={t} className="rounded-full bg-sage/10 border border-sage/20 px-sm py-xs font-sans text-xs text-text-primary">
                🌱 Possible: {THREAD_LABELS[t] ?? t}
              </span>
            ))}
            {match.threads.length > 6 && (
              <span className="font-sans text-xs text-text-muted">+{match.threads.length - 6} more</span>
            )}
          </div>
        </div>
      )}

      {match.engagement && (
        <div>
          <p className="font-sans text-xs font-semibold text-text-secondary mb-xs">Engagement</p>
          <span className={`rounded-full px-sm py-xs font-sans text-xs ${
            match.engagement === 'positive'
              ? 'bg-sage/10 border border-sage/20 text-sage'
              : match.engagement === 'challenging'
                ? 'bg-red-900/10 border border-red-900/20 text-red-400'
                : 'bg-surface-raised border border-border-subtle text-text-secondary'
          }`}>
            {match.engagement === 'positive' ? '✨ Sounds like deep engagement' :
             match.engagement === 'challenging' ? '💪 Sounds like a growth moment' :
             '📝 Neutral engagement noted'}
          </span>
        </div>
      )}

      {match.mentionedChildren.length > 0 && (
        <div>
          <p className="font-sans text-xs font-semibold text-text-secondary mb-xs">Children mentioned</p>
          <div className="flex flex-wrap gap-xs">
            {match.mentionedChildren.map((name) => (
              <span key={name} className="rounded-full bg-surface-raised border border-border-subtle px-sm py-xs font-sans text-xs text-text-primary">
                👦 {name} mentioned
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Evidence Modal Component ───

function EvidenceModal({
  type,
  onClose,
  onSave,
}: {
  type: string;
  onClose: () => void;
  onSave: (item: EvidenceItem) => void;
}) {
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setContent(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (type === 'photo' && content) {
      onSave({ type: 'photo', content, caption });
    } else if (type === 'quote' && content.trim()) {
      onSave({ type: 'quote', content: content.trim() });
    } else if (type === 'note' && content.trim()) {
      onSave({ type: 'note', content: content.trim() });
    } else if (type === 'link' && (linkName.trim() || linkUrl.trim())) {
      onSave({ type: 'link', content: linkName.trim(), name: linkName.trim(), url: linkUrl.trim() });
    }
  };

  const titles: Record<string, string> = {
    photo: 'Add Photo',
    quote: "Child's Words",
    note: 'Add Note',
    link: 'Link Resource',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-xl lg:rounded-xl border border-border-subtle bg-surface-panel p-xl shadow-[var(--shadow-warm)]">
        <div className="flex items-center justify-between mb-lg">
          <h3 className="font-serif text-lg font-semibold text-text-primary">{titles[type]}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg min-h-[44px] min-w-[44px] flex items-center justify-center">
            ✕
          </button>
        </div>

        {type === 'photo' && (
          <div className="space-y-md">
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-md border-2 border-dashed border-border-medium p-xl text-center font-sans text-sm text-text-secondary hover:border-ember transition-all duration-200"
            >
              {content ? '📷 Photo selected — tap to change' : '📷 Tap to select photo'}
            </button>
            {content && (
              <img src={content} alt="Preview" className="w-full max-h-[200px] object-cover rounded-md" />
            )}
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption..."
              className="w-full rounded-md border border-border-subtle bg-surface-raised p-sm font-serif text-sm text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none"
            />
          </div>
        )}

        {(type === 'quote' || type === 'note') && (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={type === 'quote' ? "What did they say?" : "Your observation or note..."}
            rows={4}
            className="w-full rounded-md border border-border-subtle bg-surface-raised p-md font-serif text-sm text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none resize-y"
            autoFocus
          />
        )}

        {type === 'link' && (
          <div className="space-y-md">
            <input
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              placeholder="Resource name..."
              className="w-full rounded-md border border-border-subtle bg-surface-raised p-sm font-serif text-sm text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none"
              autoFocus
            />
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https:// (optional)"
              className="w-full rounded-md border border-border-subtle bg-surface-raised p-sm font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-ember focus:outline-none"
            />
          </div>
        )}

        <button
          onClick={handleSave}
          className="mt-lg w-full rounded-md bg-ember py-sm font-sans text-sm font-semibold text-text-inverse hover:bg-ember-hover transition-all duration-200 min-h-[44px]"
        >
          Add Evidence
        </button>
      </div>
    </div>
  );
}
