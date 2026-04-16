'use client';

import { useState } from 'react';
import { LEARNER_COLOUR_MAP } from '@/components/ui/LearnerAvatar';
import type { ChildSnapshot, SnapshotData } from '@/types/snapshot';

// Thread label map — same taxonomy as enrich.ts, display names only.
const THREAD_LABELS: Record<string, string> = {
  L1: 'Oral Communication', L2: 'Phonological Awareness', L3: 'Reading Comprehension',
  L4: 'Vocabulary', L5: 'Written Expression', L6: 'Spelling & Grammar',
  L7: 'Narration & Retelling', L8: 'Persuasion', L9: 'Literary Appreciation',
  M1: 'Number Sense', M2: 'Operations', M3: 'Fractions & Parts',
  M4: 'Algebraic Thinking', M5: 'Measurement', M6: 'Spatial Reasoning',
  M7: 'Data & Statistics', M8: 'Probability', M9: 'Problem Solving',
  S1: 'Scientific Inquiry', S2: 'Biological Sciences', S3: 'Chemical Sciences',
  S4: 'Physical Sciences', S5: 'Scientific Observation', S6: 'Earth & Space', S7: 'Systems Thinking',
  H1: 'Historical Understanding', H2: 'Source Analysis', H3: 'Geographical Understanding',
  H4: 'Civics & Citizenship', H5: 'Economics & Business', H6: 'Cultural Understanding',
  P1: 'Gross Motor', P2: 'Fine Motor', P3: 'Body Awareness', P4: 'Team & Sport', P5: 'Aquatics',
  PS1: 'Empathy', PS2: 'Social Skills', PS3: 'Self-Regulation', PS4: 'Identity',
  PS5: 'Responsibility', PS6: 'Resilience', PS7: 'Safety',
  C1: 'Visual Art', C2: 'Music', C3: 'Drama', C4: 'Dance', C5: 'Media Arts',
  C6: 'Design & Construction', C7: 'Arts Appreciation',
  EF1: 'Sustained Attention', EF2: 'Working Memory', EF3: 'Cognitive Flexibility',
  EF4: 'Planning & Organisation', EF5: 'Critical Thinking', EF6: 'Collaboration',
  EF7: 'Metacognition', EF8: 'Transfer',
};

type LearnerSignal = {
  learnerId: string;
  learnerName: string;
  colourToken: string | null;
  sparkThread: { id: string; label: string } | null;
  quietThread: { id: string; label: string } | null;
};

interface WatchForTodayStripProps {
  learners: Array<{ id: string; name: string; colourToken: string | null }>;
  snapshotData: SnapshotData | null;
}

export function WatchForTodayStrip({ learners, snapshotData }: WatchForTodayStripProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !snapshotData || learners.length === 0) return null;

  const signals: LearnerSignal[] = learners.map((learner) => {
    const child: ChildSnapshot | undefined = snapshotData.children?.[learner.id];
    if (!child) return { learnerId: learner.id, learnerName: learner.name, colourToken: learner.colourToken, sparkThread: null, quietThread: null };

    // Spark = most recent active thread (first by observation count desc)
    const sortedActive = [...(child.active_threads ?? [])].sort(
      (a, b) => b.observation_count - a.observation_count
    );
    const sparkId = sortedActive[0]?.thread_id ?? null;

    // Quiet = first suggested focus thread that has a label
    const quietId = (child.gap_analysis?.suggested_focus_threads ?? []).find((t) => THREAD_LABELS[t]) ?? null;

    return {
      learnerId: learner.id,
      learnerName: learner.name,
      colourToken: learner.colourToken,
      sparkThread: sparkId ? { id: sparkId, label: THREAD_LABELS[sparkId] ?? sparkId } : null,
      quietThread: quietId ? { id: quietId, label: THREAD_LABELS[quietId] ?? quietId } : null,
    };
  });

  // Only render if at least one learner has signal
  const hasAnySignal = signals.some((s) => s.sparkThread || s.quietThread);
  if (!hasAnySignal) return null;

  return (
    <div className="mx-0 mb-md rounded-lg border border-border-subtle bg-surface-raised px-md py-sm">
      <div className="flex items-start justify-between gap-sm">
        <div className="flex-1 min-w-0">
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-text-muted mb-sm">
            Watch for today
          </p>
          <div className="flex flex-col gap-sm">
            {signals.map((sig) => {
              if (!sig.sparkThread && !sig.quietThread) return null;
              const colour = LEARNER_COLOUR_MAP[sig.colourToken ?? ''] ?? LEARNER_COLOUR_MAP.rose;
              return (
                <div key={sig.learnerId} className="flex flex-wrap items-center gap-xs">
                  <span className={`font-sans text-xs font-semibold px-xs py-[2px] rounded-full border ${colour.pill}`}>
                    {sig.learnerName}
                  </span>
                  {sig.sparkThread && (
                    <span className="flex items-center gap-xs font-sans text-xs text-text-secondary">
                      <span className="text-ember" aria-hidden>✦</span>
                      <span className="text-text-secondary">spark:</span>
                      <span className="text-text-primary">{sig.sparkThread.label}</span>
                    </span>
                  )}
                  {sig.sparkThread && sig.quietThread && (
                    <span className="text-border-subtle font-sans text-xs" aria-hidden>·</span>
                  )}
                  {sig.quietThread && (
                    <span className="flex items-center gap-xs font-sans text-xs text-text-secondary">
                      <span className="text-text-muted" aria-hidden>◌</span>
                      <span className="text-text-secondary">gap:</span>
                      <span className="text-text-primary">{sig.quietThread.label}</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss watch-for-today strip"
          className="shrink-0 mt-[1px] text-text-muted hover:text-text-secondary transition-colors duration-200 font-sans text-sm leading-none"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
