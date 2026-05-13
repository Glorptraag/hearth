'use client';

// "How you might do this" — methodology overlays' prepHint cards rendered in
// Module Experience Prep mode. Hidden entirely when no overlays carry prep
// guidance. Spec: docs/hearth-runtime-methodology-integration-brief-v1.md §2.2.

import type {
  MethodologyOverlay,
  PedagogyLensBundle,
} from '@/lib/pedagogy/lens-bundle-types';

const PRACTICE_LABEL: Record<string, string> = {
  narration: 'Narration',
  'nature-journaling': 'Nature journaling',
  'short-lessons': 'Short lessons',
  'extended-projects': 'Extended projects',
  'living-books': 'Living books',
  'hands-on': 'Hands-on materials',
  movement: 'Movement integration',
  rhythm: 'Rhythm',
  documentation: 'Documentation',
  'free-play': 'Free play',
  'memory-work': 'Memory work',
  copywork: 'Copywork',
};

const formatPractice = (key: string) => PRACTICE_LABEL[key] ?? key;

interface LensPrepHintsProps {
  pedagogyBundle: PedagogyLensBundle | null;
  activeOverlays: MethodologyOverlay[];
}

export function LensPrepHints({ pedagogyBundle, activeOverlays }: LensPrepHintsProps) {
  const facilitationNote = pedagogyBundle?.facilitationNote?.trim() || null;
  const prepCards = activeOverlays.filter((o) => o.prepHint && o.prepHint.trim());

  if (!facilitationNote && prepCards.length === 0) return null;

  return (
    <div className="mb-xl">
      {facilitationNote && (
        <div className="mb-md rounded-lg border border-border-subtle bg-surface-panel p-lg">
          <h2 className="font-sans text-sm font-semibold text-text-secondary uppercase tracking-widest mb-sm">
            Facilitation Note
          </h2>
          <p className="font-serif text-base text-text-primary leading-relaxed">
            {facilitationNote}
          </p>
        </div>
      )}
      {prepCards.length > 0 && (
        <>
          <h2 className="font-serif text-lg font-semibold text-text-primary mb-md">
            How you might do this
          </h2>
          <div className="flex flex-col gap-md">
            {prepCards.map((o) => (
              <div
                key={o.practiceKey}
                className="rounded-lg border border-border-subtle bg-surface-panel p-lg hearth-lift-card"
              >
                <p className="font-sans text-xs font-semibold uppercase tracking-widest text-text-muted mb-sm">
                  {formatPractice(o.practiceKey)}
                </p>
                <p className="font-serif text-base text-text-primary leading-relaxed">
                  {o.prepHint}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
