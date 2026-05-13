'use client';

// Three-layer content composition strip for the Logger description area.
// Renders nothing if the entry has no linked module, no active pedagogy bundle,
// or no overlays match family practices. Spec: docs/hearth-runtime-methodology-integration-brief-v1.md §2.1.

import {
  getActiveOverlays,
  getActivePedagogyBundle,
} from '@/lib/pedagogy/get-active-bundle-and-overlays';
import type {
  FamilyPedagogicalProfile,
  ModuleWithBundles,
} from '@/lib/pedagogy/lens-bundle-types';

const PRACTICE_LABEL: Record<string, string> = {
  narration: 'Narration',
  'nature-journaling': 'Nature journaling',
  'short-lessons': 'Short lessons',
  'extended-projects': 'Extended projects',
  'living-books': 'Living books',
  'hands-on': 'Hands-on',
  movement: 'Movement',
  rhythm: 'Rhythm',
  documentation: 'Documentation',
  'free-play': 'Free play',
  'memory-work': 'Memory work',
  copywork: 'Copywork',
};

const formatPractice = (key: string) => PRACTICE_LABEL[key] ?? key;

interface ModuleLensHintsProps {
  module: ModuleWithBundles | null | undefined;
  profile: FamilyPedagogicalProfile | null | undefined;
}

export function ModuleLensHints({ module, profile }: ModuleLensHintsProps) {
  if (!module || !profile) return null;

  const bundle = getActivePedagogyBundle(module, profile);
  const overlays = getActiveOverlays(module, profile);

  const pedagogyCues = (bundle?.observationCues ?? []).slice(0, 3);
  const methodologyHints = overlays
    .filter((o) => o.loggerPromptHint && o.loggerPromptHint.trim())
    .slice(0, 3);

  if (pedagogyCues.length === 0 && methodologyHints.length === 0) return null;

  return (
    <div className="mt-md rounded-lg border border-border-subtle bg-surface-panel px-md py-sm">
      {pedagogyCues.length > 0 && (
        <ul className="flex flex-col gap-xs">
          {pedagogyCues.map((cue, i) => (
            <li
              key={`p-${i}`}
              className="font-serif text-sm text-text-primary leading-snug"
            >
              {cue}
            </li>
          ))}
        </ul>
      )}
      {methodologyHints.length > 0 && (
        <ul
          className={`flex flex-col gap-xs ${pedagogyCues.length > 0 ? 'mt-sm border-t border-border-subtle pt-sm' : ''}`}
        >
          {methodologyHints.map((o) => (
            <li
              key={o.practiceKey}
              className="flex items-center gap-sm font-sans text-sm text-text-secondary"
            >
              <span className="shrink-0 rounded-full border border-border-subtle px-sm py-[2px] text-[0.6875rem] font-medium uppercase tracking-wide text-text-muted">
                {formatPractice(o.practiceKey)}
              </span>
              <span className="min-w-0 truncate">{o.loggerPromptHint}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
