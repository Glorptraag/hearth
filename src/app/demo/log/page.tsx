'use client';

/**
 * Demo Logger.
 *
 * Mounts the same six section components the live Logger renders
 * (WhoSection / WhatSection / EngagementSection / WhenWhereSection /
 * ObserveSection / EvidenceSection) so icons, spacing, and the
 * CompletenessRing in the sticky header match (auth)/log byte-for-byte —
 * but with purely local state and no /api/* fetches, no Clerk, no Anthropic.
 *
 * The trade-off vs the live Logger: the demo omits the AI insights aside,
 * the guided-mode chip details, the post-save surface, batch/CSV import,
 * voice input (button is rendered but disabled), and the evidence capture
 * modal — those rely on browser APIs, LLM round-trips, or media uploads
 * the unauthenticated viewer can't exercise. Everything else is the real
 * UI exercised against the real components.
 */

import { useMemo, useState } from 'react';
import { Check, Lightbulb } from '@/components/icons';
import { CompletenessRing, SectionHeader } from '@/app/(auth)/log/_components/SectionHeader';
import { WhoSection } from '@/app/(auth)/log/_components/WhoSection';
import { WhatSection } from '@/app/(auth)/log/_components/WhatSection';
import { EngagementSection } from '@/app/(auth)/log/_components/EngagementSection';
import { WhenWhereSection } from '@/app/(auth)/log/_components/WhenWhereSection';
import { ObserveSection } from '@/app/(auth)/log/_components/ObserveSection';
import { EvidenceSection } from '@/app/(auth)/log/_components/EvidenceSection';
import type { LearnerRecord } from '@/hooks/use-learners-fetch';
import type { DraftEvidenceItem } from '@/lib/logger/draft';
import type { ChipDetailValue } from '@/components/logger/ObservationChipDetail';
import { scoreCompleteness } from '@/lib/logger/completeness';
import { useToast } from '@/hooks/use-toast';
import { mockLearners } from '../mock-data';

// Map mock learners onto the LearnerRecord shape the section components want.
// shapeIcon is rendered as a leading glyph inside the section components; we
// pass the existing emoji until the Phase 4 mock-data revisit swaps to a
// proper Phosphor-backed identity mark.
const DEMO_LEARNERS: LearnerRecord[] = mockLearners.map((l) => ({
  id: l.id,
  name: l.name,
  dateOfBirth: l.dateOfBirth,
  shapeIcon: l.shapeIcon,
  colourToken: l.colourToken,
}));

type WhenValue = 'today' | 'yesterday' | 'earlier';

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

  // One state blob keeps the reset path cheap (a single setForm call).
  const [form, setForm] = useState(EMPTY_STATE);
  const [isSaving, setIsSaving] = useState(false);

  const set = <K extends keyof typeof EMPTY_STATE>(key: K, value: (typeof EMPTY_STATE)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

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
      // Drop any per-chip detail when the chip itself is deselected — mirrors
      // the real Logger's behaviour so the resulting state stays consistent.
      observationDetails: prev.observations.includes(chip)
        ? Object.fromEntries(
            Object.entries(prev.observationDetails).filter(([k]) => k !== chip)
          )
        : prev.observationDetails,
    }));

  // Same scorer the live Logger drives the ring with — keeps the bar
  // identical (guided-only signals just stay at zero in quick mode).
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
            k,
            { detail: v.detail, durationMin: v.durationMin },
          ])
        ),
        duration: form.duration,
        location: form.location,
        evidence: form.evidence,
        mode: 'quick',
      }),
    [form]
  );

  // Per-section completion flags drive the SectionHeader tick + number-pill
  // colour. Thresholds mirror (auth)/log/page.tsx's sectionDone map.
  const sectionDone = {
    1: form.selectedLearners.length > 0,
    2: form.description.length > 20 && form.activityType !== null,
    3:
      form.selectedLearners.length > 0 &&
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
    // No fetch — fake a tiny save window so the button transition reads.
    setTimeout(() => {
      setForm(EMPTY_STATE);
      setIsSaving(false);
      toast('Demo mode — entry would now save and enrich.', 'info');
    }, 450);
  }

  return (
    <div className="relative">
      {/* Header bar — mirrors (auth)/log/page.tsx down to the typography. */}
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
          {isSaving ? (
            'Saving…'
          ) : canSave ? (
            <span className="inline-flex items-center gap-xs">
              <Check size={14} aria-hidden="true" /> Save
            </span>
          ) : (
            'Save'
          )}
        </button>
      </div>

      <div className="flex-1 lg:flex">
        {/* ─── Capture form ─── */}
        <div className="flex-1 overflow-y-auto px-md pt-lg pb-[220px] lg:py-lg lg:flex lg:justify-center">
          <div className="w-full max-w-[560px] xl:max-w-[600px] space-y-xl">
            <WhoSection
              learners={DEMO_LEARNERS}
              selectedLearners={form.selectedLearners}
              onToggleLearner={toggleLearner}
              togetherMode={form.togetherMode}
              onTogetherModeChange={(v) => set('togetherMode', v)}
              snapshotData={null}
              done={sectionDone[1]}
            />

            <WhatSection
              label="What happened?"
              placeholder="Describe the moment in a sentence or two…"
              done={sectionDone[2]}
              description={form.description}
              onDescriptionChange={(v) => set('description', v)}
              isRecording={false}
              onStartVoice={() =>
                toast('Voice input is disabled in the demo.', 'info')
              }
              onStopVoice={() => {}}
              learners={DEMO_LEARNERS}
              selectedLearners={form.selectedLearners}
              discoveries={form.discoveries}
              onDiscoveryChange={(id, value) =>
                setForm((prev) => ({
                  ...prev,
                  discoveries: { ...prev.discoveries, [id]: value },
                }))
              }
              engagement={form.engagement}
              activityType={form.activityType}
              onActivityTypeChange={(key) => set('activityType', key)}
              lessonSubjects={form.lessonSubjects}
              onToggleLessonSubject={(key) =>
                setForm((prev) => ({
                  ...prev,
                  lessonSubjects: prev.lessonSubjects.includes(key)
                    ? prev.lessonSubjects.filter((x) => x !== key)
                    : [...prev.lessonSubjects, key],
                }))
              }
            />

            <EngagementSection
              done={sectionDone[3]}
              learners={DEMO_LEARNERS}
              selectedLearners={form.selectedLearners}
              engagement={form.engagement}
              onEngagementChange={(id, value) =>
                setForm((prev) => ({
                  ...prev,
                  engagement: { ...prev.engagement, [id]: value },
                }))
              }
            />

            <WhenWhereSection
              done={sectionDone[4]}
              whenDate={form.whenDate}
              onWhenDateChange={(v) => set('whenDate', v)}
              duration={form.duration}
              onDurationChange={(v) => set('duration', v)}
              location={form.location}
              onLocationChange={(v) => set('location', v)}
            />

            <ObserveSection
              done={sectionDone[5]}
              label="What did you observe?"
              observations={form.observations}
              observationDetails={form.observationDetails}
              onToggleObservation={toggleObservation}
              onObservationDetailChange={(chip, value) =>
                setForm((prev) => ({
                  ...prev,
                  observationDetails: { ...prev.observationDetails, [chip]: value },
                }))
              }
              isGuided={false}
            />

            <EvidenceSection
              done={sectionDone[6]}
              evidence={form.evidence}
              onOpenTool={() =>
                toast('Evidence capture is disabled in the demo.', 'info')
              }
              onRemoveEvidence={(index) =>
                setForm((prev) => ({
                  ...prev,
                  evidence: prev.evidence.filter((_, idx) => idx !== index),
                }))
              }
            />
          </div>
        </div>

        {/* ─── Insights aside (desktop) ─── */}
        {/* Live mode renders InsightsContent here — AI-driven and not
            exercisable in the demo. We surface a placeholder card so the
            two-column desktop layout stays balanced and the parent gets a
            sense of where insights would land. */}
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
            <SectionHeader number={0} done={false} label="In the live app" />
            <p className="mt-sm font-serif text-sm text-text-secondary leading-relaxed">
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

      {/* ─── Mobile sticky save bar ─── */}
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
            {isSaving ? (
              'Saving…'
            ) : canSave ? (
              <span className="inline-flex items-center gap-xs">
                <Check size={14} aria-hidden="true" /> Save
              </span>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
