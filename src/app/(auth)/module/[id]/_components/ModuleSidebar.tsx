'use client';

import type { Module, Mode } from './types';
import { MODALITY_ICON, FALLBACK_PIN_ICON } from './constants';
import { Check, ClipboardText, PencilSimple } from '@/components/icons';
import { PackIndicators } from '@/components/ui/PackIndicators';
import type { Indicators } from '@/lib/sanity/pack-indicators';

interface ModuleSidebarProps {
  module: Module;
  mode: Mode;
  selectedApproachIdx: number;
  currentActivityIdx: number;
  completedActivityIdxs: number[];
  onApproachSelect: (idx: number) => void;
  onModeChange: (mode: Mode) => void;
  onActivitySelect: (idx: number) => void;
  indicators?: Indicators;
  packState?: { printablesDownloaded: boolean; kitOwned: boolean };
}

export default function ModuleSidebar({
  module,
  mode,
  selectedApproachIdx,
  currentActivityIdx,
  completedActivityIdxs,
  onApproachSelect,
  onModeChange,
  onActivitySelect,
  indicators,
  packState,
}: ModuleSidebarProps) {
  const approach = module.approaches?.[selectedApproachIdx];
  const activities = approach?.activities ?? [];
  const breakAfterIdx =
    activities.length > 3
      ? Math.floor(activities.length * 0.6) - 1
      : -1;

  const isPrepDone = mode === 'facilitate' || mode === 'log';

  return (
    <aside className="hidden lg:flex flex-col bg-surface-panel border-r border-border-subtle sticky top-0 h-dvh overflow-y-auto">
      {/* Module title */}
      <div className="p-xl border-b border-border-subtle">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-xs">
          Module
        </p>
        <p className="font-serif text-base font-semibold text-text-primary truncate">
          {module.title}
        </p>
        <p className="font-serif text-sm italic text-text-secondary mt-xs truncate">
          {module.targetUnderstanding}
        </p>
        {indicators && (
          <PackIndicators
            context="card-compact"
            printables={indicators.printables}
            materials={indicators.materials}
            state={packState}
            className="mt-sm"
          />
        )}
      </div>

      {/* Approach nav */}
      {module.approaches && module.approaches.length > 1 && (
        <div className="py-md border-b border-border-subtle">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted px-xl mb-sm">
            Approaches
          </p>
          {module.approaches.map((appr, idx) => (
            <button
              key={appr._id}
              onClick={() => onApproachSelect(idx)}
              className={`flex items-center gap-md w-full px-xl py-md border-l-2 transition-all duration-200 ease-[var(--ease-default)] ${
                selectedApproachIdx === idx && mode !== 'approach-pick'
                  ? 'bg-ember-glow border-l-ember'
                  : 'border-l-transparent hover:bg-ember-glow'
              }`}
            >
              <span className="inline-flex text-text-secondary" aria-hidden="true">
                {(() => {
                  const Icon = MODALITY_ICON[appr.modality ?? ''] ?? FALLBACK_PIN_ICON;
                  return <Icon size={18} />;
                })()}
              </span>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-sans text-sm font-medium text-text-primary truncate">{appr.title}</p>
                {appr.modality && (
                  <p className="font-sans text-[11px] text-text-muted capitalize">{appr.modality}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Session flow nav — per-activity */}
      {mode !== 'approach-pick' && (
        <nav className="flex-1 py-md overflow-y-auto">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted px-xl mb-sm">
            Session Flow
          </p>

          {/* Prep item */}
          <button
            onClick={() => onModeChange('prep')}
            className={`flex items-center gap-md w-full px-xl py-md border-l-2 transition-all duration-200 ease-[var(--ease-default)] ${
              mode === 'prep'
                ? 'bg-ember-glow border-l-ember'
                : 'border-l-transparent hover:bg-ember-glow'
            }`}
          >
            <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-sage text-text-inverse" aria-hidden="true">
              {isPrepDone ? <Check size={14} /> : <ClipboardText size={14} />}
            </span>
            <span className={`font-sans text-sm font-medium ${
              mode === 'prep' ? 'text-ember' : 'text-text-primary'
            }`}>
              Prep
            </span>
          </button>

          {/* Activity items */}
          {activities.map((activity, idx) => {
            const isCompleted = completedActivityIdxs.includes(idx);
            const isActive = mode === 'facilitate' && currentActivityIdx === idx;

            return (
              <div key={activity._id}>
                <button
                  onClick={() => onActivitySelect(idx)}
                  className={`flex items-center gap-md w-full px-xl py-md border-l-2 transition-all duration-200 ease-[var(--ease-default)] ${
                    isActive
                      ? 'bg-ember-glow border-l-ember'
                      : 'border-l-transparent hover:bg-ember-glow'
                  }`}
                >
                  {/* Numbered circle */}
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-sans font-semibold shrink-0 ${
                      isCompleted
                        ? 'bg-sage text-text-inverse'
                        : isActive
                        ? 'bg-ember text-text-inverse'
                        : 'bg-surface-raised text-text-muted'
                    }`}
                  >
                    {isCompleted ? <Check size={14} aria-hidden="true" /> : idx + 1}
                  </span>
                  <div className="flex-1 min-w-0 text-left">
                    <p className={`font-sans text-sm font-medium truncate ${
                      isActive ? 'text-ember' : 'text-text-primary'
                    }`}>
                      {activity.title}
                    </p>
                    {activity.duration && (
                      <p className="font-sans text-[11px] text-text-muted">
                        {activity.duration.min}&ndash;{activity.duration.max} min
                      </p>
                    )}
                  </div>
                </button>

                {/* Break marker */}
                {idx === breakAfterIdx && (
                  <div className="flex items-center gap-sm px-xl py-xs">
                    <div className="flex-1 h-px bg-border-subtle" />
                    <span className="font-sans text-[11px] text-text-muted italic whitespace-nowrap">
                      Good stopping point
                    </span>
                    <div className="flex-1 h-px bg-border-subtle" />
                  </div>
                )}
              </div>
            );
          })}

          {/* End & Log item */}
          <button
            onClick={() => onModeChange('log')}
            className={`flex items-center gap-md w-full px-xl py-md border-l-2 transition-all duration-200 ease-[var(--ease-default)] ${
              mode === 'log'
                ? 'bg-ember-glow border-l-ember'
                : 'border-l-transparent hover:bg-ember-glow'
            }`}
          >
            <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-surface-raised text-text-muted" aria-hidden="true">
              <PencilSimple size={14} />
            </span>
            <span className={`font-sans text-sm font-medium ${
              mode === 'log' ? 'text-ember' : 'text-text-primary'
            }`}>
              End &amp; Log
            </span>
          </button>
        </nav>
      )}

      {/* Sidebar footer — End & Log button in facilitate mode */}
      {mode === 'facilitate' && (
        <div className="p-lg border-t border-border-subtle">
          <button
            onClick={() => onModeChange('log')}
            className="w-full rounded-md border border-border-subtle bg-transparent px-md py-sm font-sans text-[13px] text-text-secondary text-center transition-all duration-200 ease-[var(--ease-default)] hover:border-ember hover:text-text-primary"
          >
            End &amp; Log
          </button>
        </div>
      )}
    </aside>
  );
}
