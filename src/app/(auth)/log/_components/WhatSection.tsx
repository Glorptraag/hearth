import { Microphone, ChatCircleDots } from '@/components/icons';
import { SectionHeader } from './SectionHeader';
import { CHILD_COLORS } from './childColors';
import { ACTIVITY_TYPES, SUBJECTS } from './loggerConstants';
import type { LearnerRecord } from '@/hooks/use-learners-fetch';

interface WhatSectionProps {
  label: string;
  placeholder: string;
  done: boolean;
  description: string;
  onDescriptionChange: (value: string) => void;
  isRecording: boolean;
  onStartVoice: () => void;
  onStopVoice: () => void;
  learners: LearnerRecord[];
  selectedLearners: string[];
  discoveries: Record<string, string>;
  onDiscoveryChange: (id: string, value: string) => void;
  engagement: Record<string, number>;
  activityType: string | null;
  onActivityTypeChange: (key: string | null) => void;
  lessonSubjects: string[];
  onToggleLessonSubject: (key: string) => void;
}

const colorsFor = (colourToken: string | null | undefined) =>
  CHILD_COLORS[colourToken ?? 'rose'] ?? CHILD_COLORS.rose;

/**
 * Logger Section 2 — "What happened?". The description field + voice input,
 * the per-child discovery prompts (with engagement-aware hints), the
 * activity-type grid, and the lesson-subject picker (structured lessons only).
 * Extracted verbatim from log/page.tsx; pure presentational, state lifted to
 * the page.
 */
export function WhatSection({
  label,
  placeholder,
  done,
  description,
  onDescriptionChange,
  isRecording,
  onStartVoice,
  onStopVoice,
  learners,
  selectedLearners,
  discoveries,
  onDiscoveryChange,
  engagement,
  activityType,
  onActivityTypeChange,
  lessonSubjects,
  onToggleLessonSubject,
}: WhatSectionProps) {
  return (
    <section>
      <SectionHeader number={2} done={done} label={label} />

      {/* 2a: Description */}
      <div className="mb-lg">
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="w-full min-h-[100px] rounded-lg border border-border-subtle bg-surface-body p-md font-serif text-base text-text-primary leading-[1.7] placeholder:text-text-muted focus:border-ember focus:outline-none focus:shadow-focus transition-all duration-200 resize-y"
        />
        <div className="mt-sm flex items-center gap-xs">
          <button
            onClick={isRecording ? onStopVoice : onStartVoice}
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
                  value={discoveries[id] ?? ''}
                  onChange={(e) => onDiscoveryChange(id, e.target.value)}
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
                onClick={() => onActivityTypeChange(selected ? null : type.key)}
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
                  onClick={() => onToggleLessonSubject(s.key)}
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
  );
}
