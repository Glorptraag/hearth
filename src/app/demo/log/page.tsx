'use client';

/**
 * Demo Logger — self-contained.
 *
 * Anchored ONLY on Logger surfaces the in-flight refactor/int-t1-spine fix
 * keeps after it consolidates the live Logger back into a single page.tsx:
 *
 *   - SectionHeader / CompletenessRing  →  src/app/(auth)/log/_components/SectionHeader
 *   - scoreCompleteness                 →  src/lib/logger/completeness
 *   - ChipDetailValue                   →  src/components/logger/ObservationChipDetail
 *   - DraftEvidenceItem                 →  src/lib/logger/draft
 *   - Phosphor icons                    →  src/components/icons
 *   - useToast                          →  src/hooks/use-toast
 *
 * Every other section component (Who/What/Engagement/WhenWhere/Observe/
 * Evidence), the `use-logger-*` hooks, and the `loggerConstants` /
 * `childColors` modules are deleted by int-t1; the section markup is
 * therefore inlined here against the same tokens + Phosphor glyphs the
 * live Logger uses so visual parity holds whichever way the merge
 * resolves.
 *
 * Trade-off vs the live Logger: AI Insights aside is a placeholder,
 * voice/evidence are no-op toasts, save is a fake 450ms in-memory
 * simulate. Everything that actually fires a /api/* or touches Clerk
 * stays out — the demo is unauthenticated.
 */

import { useMemo, useState, type ComponentType } from 'react';
import { differenceInYears } from 'date-fns';
import {
  Check, Lightbulb, Microphone, ChatCircleDots, Camera, Note, LinkSimple,
  Leaf, CookingPot, BookOpen, Palette, SoccerBall, UsersThree, Sparkle,
  BookOpenText, MathOperations, Atom, Globe, Cpu, PersonSimpleRun,
  ChatsCircle, HouseLine, Tree, Bank, Monitor,
} from '@/components/icons';
import { CompletenessRing, SectionHeader } from '@/app/(auth)/log/_components/SectionHeader';
import { scoreCompleteness } from '@/lib/logger/completeness';
import type { ChipDetailValue } from '@/components/logger/ObservationChipDetail';
import type { DraftEvidenceItem } from '@/lib/logger/draft';
import { useToast } from '@/hooks/use-toast';
import { mockLearners } from '../mock-data';

// ─── Local types (no dependence on use-learners-fetch / LearnerRecord) ──

type DemoLearner = {
  id: string;
  name: string;
  dateOfBirth: string | null;
  shapeIcon: string | null;
  colourToken: string | null;
};

type WhenValue = 'today' | 'yesterday' | 'earlier';

type LogIconC = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

// ─── Canonical option catalogs — inlined from the now-deleted
//     _components/loggerConstants.ts so the demo doesn't depend on it. ──

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
  { key: 'technologies', label: 'Tech',         Icon: Cpu },
  { key: 'hpe',          label: 'HPE',          Icon: PersonSimpleRun },
  { key: 'languages',    label: 'Languages',    Icon: ChatsCircle },
];

const DURATION_OPTIONS = ['~5 min', '~15 min', '~30 min', '1 hr+'];

const WHERE_OPTIONS: ReadonlyArray<{ key: string; label: string; Icon: LogIconC }> = [
  { key: 'home',      label: 'Home',      Icon: HouseLine },
  { key: 'outdoors',  label: 'Outdoors',  Icon: Tree },
  { key: 'community', label: 'Community', Icon: Bank },
  { key: 'online',    label: 'Online',    Icon: Monitor },
];

const ENGAGEMENT_LEVELS = [
  { value: 4, emoji: '😊', label: 'Loved it' },
  { value: 3, emoji: '🙂', label: 'Engaged' },
  { value: 2, emoji: '😐', label: 'Okay' },
  { value: 1, emoji: '😕', label: 'Struggled' },
];

const OBSERVATION_CATEGORIES = [
  {
    label: 'Engagement',
    color: 'child-sage' as const,
    chips: ['Deeply focused', 'Curious', 'Enthusiastic', 'Reluctant at first', 'Easily distracted', 'Self-directed'],
  },
  {
    label: 'Social',
    color: 'child-blue' as const,
    chips: ['Worked alone', 'Collaborated', 'Led others', 'Asked for help', 'Taught someone', 'Negotiated / compromised'],
  },
  {
    label: 'Thinking',
    color: 'child-violet' as const,
    chips: ['Asked questions', 'Tried alternatives', 'Persisted through difficulty', 'Made connections', 'Self-corrected', 'Explained reasoning'],
  },
  {
    label: 'Emotional',
    color: 'child-rose' as const,
    chips: ['Proud of work', 'Joyful', 'Calm & settled', 'Frustrated → resolved', 'Surprised / delighted', 'Confident'],
  },
];

const OBS_COLOR_CLASSES: Record<string, { dot: string; selectedBg: string; selectedBorder: string }> = {
  'child-sage':   { dot: 'bg-child-sage',   selectedBg: 'bg-child-sage/10',   selectedBorder: 'border-child-sage/30' },
  'child-blue':   { dot: 'bg-child-blue',   selectedBg: 'bg-child-blue/10',   selectedBorder: 'border-child-blue/30' },
  'child-violet': { dot: 'bg-child-violet', selectedBg: 'bg-child-violet/10', selectedBorder: 'border-child-violet/30' },
  'child-rose':   { dot: 'bg-child-rose',   selectedBg: 'bg-child-rose/10',   selectedBorder: 'border-child-rose/30' },
};

const EVIDENCE_TOOLS: ReadonlyArray<{ key: string; Icon: LogIconC; label: string }> = [
  { key: 'photo', Icon: Camera,     label: 'Add Photo' },
  { key: 'audio', Icon: Microphone, label: 'Record Audio' },
  { key: 'note',  Icon: Note,       label: 'Add Note' },
  { key: 'link',  Icon: LinkSimple, label: 'Attach Link' },
];

// Per-child colour palette — inlined from the now-deleted
// _components/childColors.ts.
const CHILD_COLORS: Record<string, { border: string; text: string; bg: string; ring: string }> = {
  rose:   { border: 'border-child-rose',   text: 'text-child-rose',   bg: 'bg-child-rose/5',   ring: 'ring-child-rose/30' },
  blue:   { border: 'border-child-blue',   text: 'text-child-blue',   bg: 'bg-child-blue/5',   ring: 'ring-child-blue/30' },
  sage:   { border: 'border-child-sage',   text: 'text-child-sage',   bg: 'bg-child-sage/5',   ring: 'ring-child-sage/30' },
  amber:  { border: 'border-child-amber',  text: 'text-amber-status', bg: 'bg-child-amber/5',  ring: 'ring-child-amber/30' },
  violet: { border: 'border-child-violet', text: 'text-child-violet', bg: 'bg-child-violet/5', ring: 'ring-child-violet/30' },
};

const colorsFor = (token: string | null | undefined) =>
  CHILD_COLORS[token ?? 'rose'] ?? CHILD_COLORS.rose;

const learnerAge = (l: DemoLearner) =>
  l.dateOfBirth ? differenceInYears(new Date(), new Date(l.dateOfBirth)) : null;

const DEMO_LEARNERS: DemoLearner[] = mockLearners.map((l) => ({
  id: l.id,
  name: l.name,
  dateOfBirth: l.dateOfBirth,
  shapeIcon: l.shapeIcon,
  colourToken: l.colourToken,
}));

const EMPTY_STATE = {
  selectedLearners: [] as string[],
  togetherMode: false,
  description: '',
  discoveries: {} as Record<string, string>,
  activityType: null as string | null,
  lessonSubjects: [] as string[],
  engagement: {} as Record<string, number>,
  whenDate: 'today' as WhenValue,
  duration: null as string | null,
  location: null as string | null,
  observations: [] as string[],
  observationDetails: {} as Record<string, ChipDetailValue>,
  evidence: [] as DraftEvidenceItem[],
};

export default function DemoLog() {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY_STATE);
  const [isSaving, setIsSaving] = useState(false);

  const set = <K extends keyof typeof EMPTY_STATE>(
    key: K, value: (typeof EMPTY_STATE)[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleLearner = (id: string) =>
    setForm((prev) => ({
      ...prev,
      selectedLearners: prev.selectedLearners.includes(id)
        ? prev.selectedLearners.filter((x) => x !== id)
        : [...prev.selectedLearners, id],
    }));

  const toggleObservation = (chip: string) =>
    setForm((prev) => ({
      ...prev,
      observations: prev.observations.includes(chip)
        ? prev.observations.filter((x) => x !== chip)
        : [...prev.observations, chip],
    }));

  const completeness = useMemo(
    () =>
      scoreCompleteness({
        selectedLearners: form.selectedLearners,
        description: form.description,
        activityType: form.activityType,
        engagement: form.engagement,
        discoveries: form.discoveries,
        observations: form.observations,
        observationDetails: Object.fromEntries(
          Object.entries(form.observationDetails).map(([k, v]) => [
            k, { detail: v.detail, durationMin: v.durationMin },
          ])
        ),
        duration: form.duration,
        location: form.location,
        evidence: form.evidence,
        mode: 'quick',
      }),
    [form]
  );

  const sectionDone = {
    1: form.selectedLearners.length > 0,
    2: form.description.length > 20 && form.activityType !== null,
    3: form.selectedLearners.length > 0 &&
       form.selectedLearners.every((id) => form.engagement[id]),
    4: form.duration !== null || form.location !== null,
    5: form.observations.length > 0,
    6: form.evidence.length > 0,
  } as const;

  const canSave =
    form.selectedLearners.length > 0 && form.description.trim().length > 0;

  function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    setTimeout(() => {
      setForm(EMPTY_STATE);
      setIsSaving(false);
      toast('Demo mode — entry would now save and enrich.', 'info');
    }, 450);
  }

  return (
    <div className="relative">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center gap-md border-b border-border-subtle bg-surface-panel px-md py-sm lg:px-lg">
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-[1.1rem] font-semibold text-text-primary">
            Log a Learning Moment
          </h1>
          <p className="font-sans text-[0.75rem] text-text-muted hidden sm:block">
            Demo · changes stay in this browser tab
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-sm">
          <CompletenessRing score={completeness} />
          <div className="hidden sm:block text-left">
            <p className="font-sans text-[0.6875rem] font-semibold text-text-secondary leading-tight">
              {completeness >= 80 ? 'Rich entry' : completeness >= 40 ? 'Coming along' : 'Get started'}
            </p>
            <p className="font-sans text-[0.6875rem] text-text-muted leading-tight">
              {completeness}% complete
            </p>
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
          {isSaving ? 'Saving…' :
            canSave ? <span className="inline-flex items-center gap-xs"><Check size={14} aria-hidden="true" /> Save</span>
                    : 'Save'}
        </button>
      </div>

      <div className="flex-1 lg:flex">
        {/* Capture form */}
        <div className="flex-1 overflow-y-auto px-md pt-lg pb-[220px] lg:py-lg lg:flex lg:justify-center">
          <div className="w-full max-w-[560px] xl:max-w-[600px] space-y-xl">

            {/* Section 1 — Who */}
            <section>
              <SectionHeader number={1} done={sectionDone[1]} label="Who was learning?" />
              <div className="flex flex-wrap gap-sm">
                {DEMO_LEARNERS.map((learner) => {
                  const selected = form.selectedLearners.includes(learner.id);
                  const colors = colorsFor(learner.colourToken);
                  const age = learnerAge(learner);
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
              {form.selectedLearners.length >= 2 && (
                <label className="mt-sm flex items-center gap-sm font-sans text-sm text-text-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.togetherMode}
                    onChange={(e) => set('togetherMode', e.target.checked)}
                    className="accent-ember"
                  />
                  Learning together
                </label>
              )}
            </section>

            {/* Section 2 — What */}
            <section>
              <SectionHeader number={2} done={sectionDone[2]} label="What happened?" />
              <div className="mb-lg">
                <textarea
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="Describe the moment in a sentence or two…"
                  rows={4}
                  className="w-full min-h-[100px] rounded-lg border border-border-subtle bg-surface-body p-md font-serif text-base text-text-primary leading-[1.7] placeholder:text-text-muted focus:border-ember focus:outline-none focus:shadow-focus transition-all duration-200 resize-y"
                />
                <div className="mt-sm flex items-center gap-xs">
                  <button
                    onClick={() => toast('Voice input is disabled in the demo.', 'info')}
                    className="flex items-center gap-xs rounded-sm px-sm py-xs font-sans text-[0.75rem] font-medium bg-surface-raised border border-border-subtle text-text-muted hover:border-border-medium hover:text-text-secondary transition-all duration-200"
                  >
                    <span className="inline-flex items-center gap-xs"><Microphone size={14} aria-hidden="true" /> Voice</span>
                  </button>
                  <span className="ml-auto font-sans text-[0.6875rem] text-text-muted">
                    {form.description.length > 0 ? `${form.description.length}` : ''}
                  </span>
                </div>
              </div>

              {/* Per-child discoveries */}
              {form.selectedLearners.length > 0 && (
                <div className="mb-lg space-y-md">
                  <div className="flex items-center gap-md my-xl">
                    <div className="flex-1 h-px bg-border-subtle" />
                    <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-text-muted">Individual Discoveries</span>
                    <div className="flex-1 h-px bg-border-subtle" />
                  </div>
                  {form.selectedLearners.map((id) => {
                    const learner = DEMO_LEARNERS.find((l) => l.id === id);
                    if (!learner) return null;
                    const colors = colorsFor(learner.colourToken);
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
                          value={form.discoveries[id] ?? ''}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              discoveries: { ...prev.discoveries, [id]: e.target.value },
                            }))
                          }
                          placeholder="Something they said, wondered about, or figured out…"
                          rows={2}
                          className="w-full min-h-[70px] rounded-md border border-border-subtle bg-surface-body p-sm font-serif text-[0.9375rem] text-text-primary leading-[1.6] placeholder:text-text-muted focus:outline-none focus:border-ember focus:shadow-focus resize-y"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Activity type grid */}
              <div className="mt-lg">
                <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">
                  Activity type
                </p>
                <div className="grid grid-cols-4 lg:grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-sm">
                  {ACTIVITY_TYPES.map((type) => {
                    const selected = form.activityType === type.key;
                    return (
                      <button
                        key={type.key}
                        onClick={() => set('activityType', selected ? null : type.key)}
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
              {form.activityType === 'structured' && (
                <div className="mt-md">
                  <p className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-text-secondary mb-sm">
                    Which subjects?
                  </p>
                  <div className="flex flex-wrap gap-sm">
                    {SUBJECTS.map((s) => {
                      const sel = form.lessonSubjects.includes(s.key);
                      return (
                        <button
                          key={s.key}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              lessonSubjects: prev.lessonSubjects.includes(s.key)
                                ? prev.lessonSubjects.filter((x) => x !== s.key)
                                : [...prev.lessonSubjects, s.key],
                            }))
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

            {/* Section 3 — Engagement */}
            <section>
              <SectionHeader number={3} done={sectionDone[3]} label="How engaged were they?" optional="Rate each child" />
              {form.selectedLearners.length === 0 ? (
                <p className="font-serif text-sm italic text-text-muted">
                  Select children first
                </p>
              ) : (
                <div className="space-y-sm">
                  {form.selectedLearners.map((id) => {
                    const learner = DEMO_LEARNERS.find((l) => l.id === id);
                    if (!learner) return null;
                    const colors = colorsFor(learner.colourToken);
                    const current = form.engagement[id];
                    return (
                      <div key={id} className={`flex items-center justify-between gap-md rounded-md border ${colors.border} ${colors.bg} px-md py-sm`}>
                        <div className="flex items-center gap-sm">
                          <span className={`h-[10px] w-[10px] rounded-full ${colors.border.replace('border', 'bg')} shrink-0`} />
                          <span className={`font-sans text-sm font-medium ${colors.text}`}>{learner.name}</span>
                        </div>
                        <div className="flex items-center gap-xs">
                          {ENGAGEMENT_LEVELS.map((lvl) => (
                            <button
                              key={lvl.value}
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  engagement: { ...prev.engagement, [id]: lvl.value },
                                }))
                              }
                              title={lvl.label}
                              className={`flex h-[36px] w-[36px] items-center justify-center rounded-full border text-base transition-all duration-200 ${
                                current === lvl.value
                                  ? 'border-ember bg-ember-glow'
                                  : 'border-border-subtle bg-surface-body hover:border-border-medium'
                              }`}
                            >
                              <span aria-hidden="true">{lvl.emoji}</span>
                              <span className="sr-only">{lvl.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Section 4 — When & Where */}
            <section>
              <SectionHeader number={4} done={sectionDone[4]} label="When & Where" />
              <div className="flex flex-wrap gap-md">
                <div className="flex-1 min-w-[140px]">
                  <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">When</p>
                  <div className="flex flex-wrap gap-xs">
                    {(['today', 'yesterday', 'earlier'] as const).map((w) => (
                      <button
                        key={w}
                        onClick={() => set('whenDate', w)}
                        className={`rounded-sm px-sm py-xs font-sans text-[0.75rem] font-medium whitespace-nowrap transition-all duration-200 ${
                          form.whenDate === w
                            ? 'bg-ember-glow border border-ember text-text-primary'
                            : 'border border-border-subtle text-text-secondary hover:border-border-medium'
                        }`}
                      >
                        {w === 'today' ? 'Today' : w === 'yesterday' ? 'Yesterday' : 'Earlier'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">Duration</p>
                  <div className="flex flex-wrap gap-xs">
                    {DURATION_OPTIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => set('duration', form.duration === d ? null : d)}
                        className={`rounded-sm px-sm py-xs font-sans text-[0.75rem] font-medium whitespace-nowrap transition-all duration-200 ${
                          form.duration === d
                            ? 'bg-ember-glow border border-ember text-text-primary'
                            : 'border border-border-subtle text-text-secondary hover:border-border-medium'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <p className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">Where</p>
                  <div className="flex flex-wrap gap-xs">
                    {WHERE_OPTIONS.map((w) => (
                      <button
                        key={w.key}
                        onClick={() => set('location', form.location === w.key ? null : w.key)}
                        className={`flex items-center gap-xs rounded-sm px-sm py-xs font-sans text-[0.75rem] font-medium whitespace-nowrap transition-all duration-200 ${
                          form.location === w.key
                            ? 'bg-ember-glow border border-ember text-text-primary'
                            : 'border border-border-subtle text-text-secondary hover:border-border-medium'
                        }`}
                      >
                        <span className="inline-flex" aria-hidden="true"><w.Icon size={12} /></span>
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5 — Observe */}
            <section>
              <SectionHeader number={5} done={sectionDone[5]} label="What did you observe?" />
              <div className="space-y-md">
                {OBSERVATION_CATEGORIES.map((cat) => {
                  const cc = OBS_COLOR_CLASSES[cat.color];
                  return (
                    <div key={cat.label}>
                      <div className="mb-xs flex items-center gap-sm">
                        <span className={`h-[8px] w-[8px] rounded-full ${cc.dot}`} />
                        <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-text-muted">
                          {cat.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-xs">
                        {cat.chips.map((chip) => {
                          const sel = form.observations.includes(chip);
                          return (
                            <button
                              key={chip}
                              onClick={() => toggleObservation(chip)}
                              className={`rounded-full border px-sm py-xs font-sans text-[0.75rem] font-medium transition-all duration-200 ${
                                sel
                                  ? `${cc.selectedBorder} ${cc.selectedBg} text-text-primary`
                                  : 'border-border-subtle bg-surface-body text-text-secondary hover:border-border-medium'
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

            {/* Section 6 — Evidence */}
            <section>
              <SectionHeader number={6} done={sectionDone[6]} label="Evidence" optional="Optional" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-sm">
                {EVIDENCE_TOOLS.map((tool) => {
                  const lit = form.evidence.some((e) => e.type === tool.key);
                  return (
                    <button
                      key={tool.key}
                      onClick={() => toast('Evidence capture is disabled in the demo.', 'info')}
                      className={`flex flex-col items-center justify-center gap-xs rounded-md border px-sm py-md font-sans text-[0.75rem] font-medium transition-all duration-200 min-h-[88px] ${
                        lit
                          ? 'border-sage/40 bg-sage/10 text-sage'
                          : 'border-border-subtle bg-surface-body text-text-secondary hover:border-border-medium hover:bg-surface-raised'
                      }`}
                    >
                      <span className="inline-flex" aria-hidden="true"><tool.Icon size={22} /></span>
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </div>

        {/* Insights aside — placeholder card; live mode renders InsightsContent here. */}
        <aside className="hidden lg:flex lg:w-[400px] xl:w-[440px] shrink-0 flex-col gap-lg border-l border-border-subtle bg-surface-panel p-lg overflow-y-auto">
          <div className="flex items-center gap-sm pb-md border-b border-border-subtle">
            <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-ember shadow-ember text-text-inverse">
              <Lightbulb size={16} aria-hidden="true" />
            </div>
            <h3 className="font-serif text-base font-semibold text-text-primary">
              Hearth Insights
            </h3>
          </div>
          <div className="rounded-md border border-border-subtle bg-surface-raised p-lg">
            <p className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-text-muted mb-sm inline-flex items-center gap-xs">
              <ChatCircleDots size={12} aria-hidden="true" /> In the live app
            </p>
            <p className="font-serif text-sm text-text-secondary leading-relaxed">
              As you describe what happened, Hearth surfaces gentle reflection
              prompts, surfaces capabilities the moment touches, and (after you
              save) routes the entry through the AI enrichment pipeline.
            </p>
            <p className="mt-sm font-sans text-[0.75rem] text-text-muted">
              Disabled in the demo — sign up to see real insights.
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile sticky save bar */}
      <div className="lg:hidden fixed bottom-[calc(72px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-40 border-t border-border-subtle bg-surface-panel/95 backdrop-blur px-md py-sm">
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-sm">
            <CompletenessRing score={completeness} />
            <div className="text-left">
              <p className="font-sans text-[0.6875rem] font-semibold text-text-secondary leading-tight">
                {completeness >= 80 ? 'Rich entry' : completeness >= 40 ? 'Coming along' : 'Get started'}
              </p>
              <p className="font-sans text-[0.6875rem] text-text-muted leading-tight">
                {completeness}% complete
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className={`ml-auto flex items-center gap-sm rounded-md px-lg py-sm font-sans text-[0.8125rem] font-semibold transition-all duration-200 ease-[var(--ease-default)] ${
              canSave
                ? 'bg-ember border border-ember text-text-inverse cursor-pointer hover:bg-ember-hover hover:shadow-ember'
                : 'bg-surface-raised border border-border-subtle text-text-muted opacity-50 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving…' :
              canSave ? <span className="inline-flex items-center gap-xs"><Check size={14} aria-hidden="true" /> Save</span>
                      : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
