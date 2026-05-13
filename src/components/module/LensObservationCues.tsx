'use client';

// Combined observation cue list for Module Experience Log mode.
// Pedagogy cues first, methodology cues appended with a `via {practice}` source pill.
// Total cap 5; methodology truncated first when over cap.
// Spec: docs/hearth-runtime-methodology-integration-brief-v1.md §2.3.

import type {
  MethodologyOverlay,
  PedagogyLensBundle,
} from '@/lib/pedagogy/lens-bundle-types';

const PRACTICE_LABEL: Record<string, string> = {
  narration: 'narration',
  'nature-journaling': 'nature journaling',
  'short-lessons': 'short lessons',
  'extended-projects': 'extended projects',
  'living-books': 'living books',
  'hands-on': 'hands-on',
  movement: 'movement',
  rhythm: 'rhythm',
  documentation: 'documentation',
  'free-play': 'free play',
  'memory-work': 'memory work',
  copywork: 'copywork',
};

const COMBINED_CAP = 5;
const PEDAGOGY_CAP = 3;

interface LensObservationCuesProps {
  pedagogyBundle: PedagogyLensBundle | null;
  activeOverlays: MethodologyOverlay[];
}

export function LensObservationCues({
  pedagogyBundle,
  activeOverlays,
}: LensObservationCuesProps) {
  const pedagogyCues = (pedagogyBundle?.observationCues ?? []).slice(0, PEDAGOGY_CAP);
  const methodologyCues = activeOverlays
    .filter((o) => o.observationCue && o.observationCue.trim())
    .map((o) => ({ practiceKey: o.practiceKey, cue: o.observationCue! }));

  const remainingSlots = Math.max(0, COMBINED_CAP - pedagogyCues.length);
  const trimmedMethodology = methodologyCues.slice(0, remainingSlots);

  if (pedagogyCues.length === 0 && trimmedMethodology.length === 0) return null;

  return (
    <div className="mb-xl rounded-lg border border-border-subtle bg-surface-panel p-lg">
      <h2 className="font-sans text-sm font-semibold text-text-secondary uppercase tracking-widest mb-md">
        What to notice
      </h2>
      <ul className="flex flex-col gap-sm">
        {pedagogyCues.map((cue, i) => (
          <li
            key={`p-${i}`}
            className="font-serif text-sm text-text-primary leading-snug"
          >
            {cue}
          </li>
        ))}
        {trimmedMethodology.map(({ practiceKey, cue }) => (
          <li
            key={`m-${practiceKey}`}
            className="flex items-start justify-between gap-sm"
          >
            <span className="font-serif text-sm text-text-primary leading-snug min-w-0">
              {cue}
            </span>
            <span className="shrink-0 rounded-full border border-border-subtle px-sm py-[2px] font-sans text-[0.6875rem] text-text-muted">
              via {PRACTICE_LABEL[practiceKey] ?? practiceKey}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
