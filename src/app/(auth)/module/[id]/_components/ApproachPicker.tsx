'use client';

import type { Module } from './types';
import { MODALITY_ICON, FALLBACK_PIN_ICON } from './constants';

export default function ApproachPickMode({
  module,
  onSelect,
}: {
  module: Module;
  onSelect: (idx: number) => void;
}) {
  const approaches = module.approaches ?? [];

  return (
    <div className="px-md py-xl max-w-2xl mx-auto">
      <div className="mb-xl">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-ember mb-sm">
          Choose an approach
        </p>
        <h1 className="font-serif text-2xl font-semibold text-text-primary leading-snug mb-sm">
          {module.title}
        </h1>
        <p className="font-serif text-base italic text-text-secondary leading-relaxed">
          {module.targetUnderstanding}
        </p>
      </div>

      {approaches.length === 0 ? (
        <p className="font-serif text-sm text-text-muted">No approaches available for this module.</p>
      ) : (
        <div className="space-y-sm">
          {approaches.map((approach, idx) => {
            const actCount = approach.activities?.length ?? 0;
            return (
              <button
                key={approach._id}
                onClick={() => onSelect(idx)}
                className="flex w-full items-start gap-md rounded-lg border border-border-subtle bg-surface-panel p-lg text-left shadow-card transition-all duration-200 hover:border-border-medium hover:bg-surface-raised hover:-translate-y-[2px]"
              >
                <span className="mt-[2px] inline-flex text-text-secondary" aria-hidden="true">
                  {(() => {
                    const Icon = MODALITY_ICON[approach.modality ?? ''] ?? FALLBACK_PIN_ICON;
                    return <Icon size={22} />;
                  })()}
                </span>
                <div className="flex-1">
                  <p className="font-serif text-base font-semibold text-text-primary">
                    {approach.title}
                  </p>
                  {approach.modality && (
                    <p className="mt-xs font-sans text-xs capitalize text-text-muted">
                      {approach.modality} · {actCount} {actCount === 1 ? 'activity' : 'activities'}
                    </p>
                  )}
                </div>
                <span className="mt-[3px] font-sans text-xs text-ember">→</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
