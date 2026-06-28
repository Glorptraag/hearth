'use client';

import { FlowerLotus, Books } from '@/components/icons';
import {
  SUBJECT_META,
  normalizeSubject,
  type Subject,
} from '@/components/screens/MarketplaceCard';

export interface SanityStandaloneModule {
  _id: string;
  title: string;
  subjects?: Subject[];
  targetUnderstanding?: string | null;
  ageRange?: { min: number; max: number };
  duration?: { min: number; max: number };
  approachCount?: number;
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

function formatAgeRange(ageRange?: { min: number; max: number }): string {
  if (!ageRange) return '';
  return `${ageRange.min}–${ageRange.max} yrs`;
}

function formatDuration(duration?: { min: number; max: number }): string {
  if (!duration) return '';
  return duration.min === duration.max
    ? `~${duration.min} min`
    : `~${duration.min}–${duration.max} min`;
}

interface MarketplaceModuleCardProps {
  module: SanityStandaloneModule;
  inLibrary: boolean;
  onAddToLibrary: (id: string) => void;
}

export function MarketplaceModuleCard({ module, inLibrary, onAddToLibrary }: MarketplaceModuleCardProps) {
  const subjects = (module.subjects ?? [])
    .map(normalizeSubject)
    .filter((s): s is Subject => s !== null);
  const primary = subjects[0];
  const primaryMeta = primary ? SUBJECT_META[primary] : null;
  const primaryHex = primaryMeta?.hex ?? '#D97B3A';
  const HeroIcon = primaryMeta?.Icon ?? Books;
  const rgb = hexToRgb(primaryHex);
  const heroGradient = `linear-gradient(135deg, rgba(${rgb},0.14) 0%, transparent 100%)`;
  const ageStr = formatAgeRange(module.ageRange);
  const durationStr = formatDuration(module.duration);
  const approachCount = module.approachCount ?? 0;
  const meta = [durationStr, ageStr, approachCount > 0 ? `${approachCount} approach${approachCount === 1 ? '' : 'es'}` : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <article
      role="article"
      aria-label={`${module.title} — single module${durationStr ? `, ${durationStr}` : ''}`}
      className={`group relative flex flex-col bg-surface-panel rounded-[16px] border border-border-subtle shadow-card overflow-hidden transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] hover:-translate-y-0.5 hover:border-border-medium hover:shadow-hover ${inLibrary ? 'opacity-65 hover:opacity-80' : ''}`}
    >
      {/* Ember top-line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ember to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--motion-gentle)] z-10" />

      {/* Hero */}
      <div
        className="h-[80px] flex items-center justify-center relative"
        style={{ background: heroGradient, color: primaryHex }}
      >
        <span className="absolute top-2 left-3 font-sans text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted select-none">
          Module
        </span>
        <span aria-hidden="true"><HeroIcon size={32} /></span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Subject chips */}
        <div className="flex flex-wrap gap-1.5">
          {subjects.map((s) => {
            const { label, hex } = SUBJECT_META[s];
            const r = hexToRgb(hex);
            return (
              <span
                key={s}
                className="font-sans text-[0.65rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                style={{
                  color: hex,
                  background: `rgba(${r},0.1)`,
                  borderColor: `rgba(${r},0.25)`,
                }}
              >
                {label}
              </span>
            );
          })}
        </div>

        {/* Creator */}
        <div className="flex items-center gap-1.5">
          <span className="inline-flex text-text-secondary" aria-hidden="true">
            <FlowerLotus size={14} />
          </span>
          <span className="font-sans text-xs text-text-muted">Hearth Team</span>
          <span className="font-sans text-[10px] text-text-muted bg-surface-raised rounded-full px-1.5 py-[1px] border border-border-subtle">
            Single Module
          </span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-[1.05rem] font-semibold text-text-primary leading-snug line-clamp-2">
          {module.title}
        </h3>

        {/* Description */}
        {module.targetUnderstanding && (
          <p className="font-serif text-[0.8rem] text-text-secondary leading-relaxed line-clamp-2">
            {module.targetUnderstanding}
          </p>
        )}

        {/* Meta */}
        {meta && (
          <p className="font-sans text-[0.72rem] text-text-muted">{meta}</p>
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-3 border-t border-border-subtle">
          <span className="font-sans text-[0.68rem] font-medium text-sage bg-sage/10 border border-sage/20 px-2.5 py-1 rounded-full whitespace-nowrap">
            Included with membership
          </span>

          {inLibrary ? (
            <button
              disabled
              aria-label={`${module.title} is in your library`}
              className="font-sans text-[0.75rem] font-semibold px-3 py-1.5 rounded-[6px] border border-sage/30 bg-sage/15 text-sage cursor-default select-none whitespace-nowrap"
            >
              In Library
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToLibrary(module._id);
              }}
              aria-label={`Add ${module.title} to your library`}
              className="font-sans text-[0.75rem] font-semibold px-3 py-1.5 rounded-[6px] border border-ember text-ember bg-transparent hover:bg-ember hover:text-text-inverse transition-all duration-200 ease-[var(--ease-default)] cursor-pointer whitespace-nowrap"
            >
              Add to Library
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
