'use client';

import { useState } from 'react';
import { getPedagogyVocabulary } from '@/lib/pedagogy/adapter';
import type { Pedagogy } from '@/types';

interface ActivityOverlay {
  perspective?: string;
  facilitatorTips?: string;
  languageFrame?: string;
  watchFor?: string;
}

interface ActivityCardProps {
  activity: {
    title: string;
    summary: string;
    instructions: string;
    facilitatorGuidance?: { before?: string; during?: string; challenges?: string };
    materials?: Array<{ name: string; required?: boolean; alternative?: string }>;
    duration?: { min: number; max: number };
    setting?: 'indoor' | 'outdoor' | 'either';
    energyLevel?: 'calm' | 'moderate' | 'active';
    modality?: string;
    observationPrompts?: string[];
  };
  pedagogy: Pedagogy | string;
  overlay?: ActivityOverlay | null;
  onStart?: () => void;
}

const SETTING_EMOJI: Record<string, string> = { indoor: '🏠', outdoor: '🌳', either: '🔄' };
const ENERGY_EMOJI: Record<string, string> = { calm: '🧘', moderate: '⚡', active: '🔥' };
const MODALITY_EMOJI: Record<string, string> = {
  kinesthetic: '🤲', visual: '👁', auditory: '👂', narrative: '📖', social: '👥', reading: '📚', exploratory: '🔍',
};

export function ActivityCard({ activity, pedagogy, overlay, onStart }: ActivityCardProps) {
  const [expanded, setExpanded] = useState(false);
  const vocab = getPedagogyVocabulary(pedagogy);

  const hasOverlay = overlay && (overlay.perspective || overlay.facilitatorTips || overlay.watchFor);

  return (
    <div className="group relative bg-surface-panel rounded-[16px] border border-border-subtle p-xl shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:translate-y-[-2px] hover:border-border-medium hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]">
      {/* Ember top-line */}
      <div className="absolute left-0 right-0 top-0 h-[2px] rounded-t-[16px] bg-[linear-gradient(90deg,var(--color-ember),transparent)] opacity-0 transition-opacity duration-[400ms] group-hover:opacity-100" />

      {/* Header */}
      <div className="flex items-start justify-between gap-md mb-md">
        <div className="flex-1">
          <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">
            {vocab.sessionNoun}
          </p>
          <h3 className="font-serif text-lg font-semibold text-text-primary leading-snug">
            {activity.title}
          </h3>
        </div>
        {activity.modality && (
          <span className="text-xl flex-shrink-0" title={activity.modality}>
            {MODALITY_EMOJI[activity.modality] ?? '📝'}
          </span>
        )}
      </div>

      {/* Summary */}
      <p className="font-serif text-sm text-text-secondary leading-relaxed mb-md">
        {activity.summary}
      </p>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-xs mb-md">
        {activity.duration && (
          <span className="font-sans text-[11px] text-text-muted bg-surface-raised rounded-md px-sm py-[2px]">
            {activity.duration.min}–{activity.duration.max} min
          </span>
        )}
        {activity.setting && (
          <span className="font-sans text-[11px] text-text-muted bg-surface-raised rounded-md px-sm py-[2px]">
            {SETTING_EMOJI[activity.setting]} {activity.setting}
          </span>
        )}
        {activity.energyLevel && (
          <span className="font-sans text-[11px] text-text-muted bg-surface-raised rounded-md px-sm py-[2px]">
            {ENERGY_EMOJI[activity.energyLevel]} {activity.energyLevel}
          </span>
        )}
      </div>

      {/* Philosophy lens (overlay) */}
      {hasOverlay && (
        <div className="rounded-[10px] border border-ember/15 bg-ember-glow/10 p-md mb-md">
          <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-ember mb-sm">
            {pedagogy === 'eclectic' ? 'Learning lens' : `${String(pedagogy).replace('_', ' ')} lens`}
          </p>
          {overlay!.perspective && (
            <p className="font-serif text-sm text-text-secondary leading-relaxed italic">
              {overlay!.perspective}
            </p>
          )}
          {overlay!.watchFor && (
            <p className="font-serif text-xs text-text-muted mt-sm">
              Watch for: {overlay!.watchFor}
            </p>
          )}
        </div>
      )}

      {/* Expandable details */}
      {expanded && (
        <div className="border-t border-border-subtle pt-md mt-md space-y-md animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Materials */}
          {activity.materials && activity.materials.length > 0 && (
            <div>
              <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-sm">
                Materials
              </p>
              <ul className="space-y-xs">
                {activity.materials.map((m, i) => (
                  <li key={i} className="flex items-start gap-xs">
                    <span className="font-sans text-xs text-text-muted mt-[2px]">
                      {m.required ? '●' : '○'}
                    </span>
                    <span className="font-serif text-sm text-text-secondary">
                      {m.name}
                      {m.alternative && (
                        <span className="text-text-muted"> (or {m.alternative})</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Facilitator guidance — adapted to philosophy */}
          {activity.facilitatorGuidance && (
            <div>
              <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-sm">
                {vocab.facilitatorNoun} notes
              </p>
              {activity.facilitatorGuidance.before && (
                <p className="font-serif text-sm text-text-secondary mb-xs">
                  <span className="font-semibold text-text-primary">Before: </span>
                  {activity.facilitatorGuidance.before}
                </p>
              )}
              {activity.facilitatorGuidance.during && (
                <p className="font-serif text-sm text-text-secondary mb-xs">
                  <span className="font-semibold text-text-primary">During: </span>
                  {activity.facilitatorGuidance.during}
                </p>
              )}
              {activity.facilitatorGuidance.challenges && (
                <p className="font-serif text-sm text-text-secondary">
                  <span className="font-semibold text-text-primary">If stuck: </span>
                  {activity.facilitatorGuidance.challenges}
                </p>
              )}
              {/* Overlay facilitator tips */}
              {overlay?.facilitatorTips && (
                <p className="font-serif text-sm text-ember/80 mt-sm italic">
                  {overlay.facilitatorTips}
                </p>
              )}
            </div>
          )}

          {/* Observation prompts — reframed with overlay language */}
          {activity.observationPrompts && activity.observationPrompts.length > 0 && (
            <div>
              <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-sm">
                What to notice
              </p>
              <ul className="space-y-xs">
                {activity.observationPrompts.map((prompt, i) => (
                  <li key={i} className="font-serif text-sm text-text-secondary flex items-start gap-xs">
                    <span className="text-ember mt-[2px]">✦</span>
                    {overlay?.languageFrame
                      ? prompt.replace(/child|student|learner/gi, vocab.learnerNoun)
                      : prompt}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-sm mt-md">
        <button
          onClick={() => setExpanded(!expanded)}
          className="font-sans text-xs text-text-muted hover:text-text-secondary transition-colors duration-200"
        >
          {expanded ? 'Show less' : 'Show details'}
        </button>
        {onStart && (
          <button
            onClick={onStart}
            className="ml-auto bg-ember text-text-inverse font-sans text-sm font-semibold rounded-md px-md py-sm hover:bg-ember-hover transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
          >
            Start {vocab.sessionNoun}
          </button>
        )}
      </div>
    </div>
  );
}
