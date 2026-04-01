'use client';

export type Subject =
  | 'english'
  | 'mathematics'
  | 'science'
  | 'hass'
  | 'arts'
  | 'technologies'
  | 'hpe'
  | 'languages';

export type CreatorType = 'content-team' | 'educator' | 'parent' | string;

export interface SanityPack {
  _id: string;
  title: string;
  creator?: string;
  creatorType?: CreatorType;
  subjects?: Subject[];
  ageRange?: { min: number; max: number };
  moduleCount?: number;
  totalActivities?: number;
  availability?: 'included' | 'premium';
  stripePriceId?: string;
  description?: string;
}

function getCreatorEmoji(type?: CreatorType): string {
  switch (type) {
    case 'content-team': return '🌿';
    case 'educator':     return '🎓';
    case 'parent':       return '💛';
    default:             return '✨';
  }
}

function getCreatorLabel(type?: CreatorType): string {
  switch (type) {
    case 'content-team': return 'Hearth Team';
    case 'educator':     return 'Educator';
    case 'parent':       return 'Parent Creator';
    default:             return 'Creator';
  }
}

const SUBJECT_META: Record<Subject, { label: string; hex: string; emoji: string }> = {
  english:      { label: 'English',      hex: '#6B8E9B', emoji: '📖' },
  mathematics:  { label: 'Mathematics',  hex: '#9B7B6B', emoji: '🔢' },
  science:      { label: 'Science',      hex: '#7B9B6B', emoji: '🔬' },
  hass:         { label: 'HASS',         hex: '#9B8B6B', emoji: '🌍' },
  arts:         { label: 'Arts',         hex: '#8B6B9B', emoji: '🎨' },
  technologies: { label: 'Technologies', hex: '#6B7B9B', emoji: '💻' },
  hpe:          { label: 'HPE',          hex: '#9B6B7B', emoji: '🏃' },
  languages:    { label: 'Languages',    hex: '#6B9B8B', emoji: '🗣️' },
};

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

interface MarketplaceCardProps {
  pack: SanityPack;
  inLibrary: boolean;
  onAddToLibrary: (id: string) => void;
}

export function MarketplaceCard({ pack, inLibrary, onAddToLibrary }: MarketplaceCardProps) {
  const subjects = pack.subjects ?? [];
  const primary = subjects[0];
  const primaryMeta = primary ? SUBJECT_META[primary] : null;
  const primaryHex = primaryMeta?.hex ?? '#D97B3A';
  const emoji = primaryMeta?.emoji ?? '📚';
  const rgb = hexToRgb(primaryHex);
  const heroGradient = `linear-gradient(135deg, rgba(${rgb},0.14) 0%, transparent 100%)`;
  const isMembership = pack.availability !== 'premium';
  const ageStr = formatAgeRange(pack.ageRange);
  const moduleCount = pack.moduleCount ?? 0;

  return (
    <article
      role="article"
      aria-label={`${pack.title} — ${moduleCount} modules${ageStr ? `, ${ageStr}` : ''}`}
      className={`group relative flex flex-col bg-surface-panel rounded-[16px] border border-border-subtle shadow-[0_2px_8px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 hover:border-border-medium hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_60px_rgba(217,123,58,0.08)] ${inLibrary ? 'opacity-65 hover:opacity-80' : ''}`}
    >
      {/* Ember top-line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-ember to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-[400ms] z-10" />

      {/* Hero */}
      <div
        className="h-[80px] flex items-center justify-center text-3xl relative"
        style={{ background: heroGradient }}
      >
        <span className="absolute top-2 left-3 font-sans text-[0.65rem] font-semibold uppercase tracking-wider text-text-muted select-none">
          Pack
        </span>
        <span role="img" aria-hidden="true">{emoji}</span>
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
          <span className="text-xs" aria-hidden="true">
            {getCreatorEmoji(pack.creatorType)}
          </span>
          <span className="font-sans text-xs text-text-muted">
            {pack.creator ?? 'Hearth Team'}
          </span>
          <span className="font-sans text-[10px] text-text-muted bg-surface-raised rounded-full px-1.5 py-[1px] border border-border-subtle">
            {getCreatorLabel(pack.creatorType)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-[1.05rem] font-semibold text-text-primary leading-snug">
          {pack.title}
        </h3>

        {/* Description */}
        {pack.description && (
          <p className="font-serif text-[0.8rem] text-text-secondary leading-relaxed line-clamp-2">
            {pack.description}
          </p>
        )}

        {/* Meta */}
        <p className="font-sans text-[0.72rem] text-text-muted">
          {moduleCount} modules{ageStr ? ` · ${ageStr}` : ''}{moduleCount > 0 ? ` · ~${moduleCount * 3} weeks` : ''}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-border-subtle">
          {isMembership ? (
            <span className="font-sans text-[0.68rem] font-medium text-sage bg-sage/10 border border-sage/20 px-2.5 py-1 rounded-full whitespace-nowrap">
              Included with membership
            </span>
          ) : (
            <span className="font-sans text-[0.82rem] font-semibold text-text-primary">
              Premium
            </span>
          )}

          {inLibrary ? (
            <button
              disabled
              aria-label={`${pack.title} is in your library`}
              className="font-sans text-[0.75rem] font-semibold px-3 py-1.5 rounded-[6px] border border-sage/30 bg-sage/15 text-sage cursor-default select-none whitespace-nowrap"
            >
              In Library
            </button>
          ) : isMembership ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToLibrary(pack._id);
              }}
              aria-label={`Add ${pack.title} to your library`}
              className="font-sans text-[0.75rem] font-semibold px-3 py-1.5 rounded-[6px] border border-ember text-ember bg-transparent hover:bg-ember hover:text-text-inverse transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer whitespace-nowrap"
            >
              Add to Library
            </button>
          ) : (
            <button
              disabled
              aria-label={`${pack.title} — coming soon`}
              className="font-sans text-[0.75rem] font-semibold px-3 py-1.5 rounded-[6px] bg-ember/40 text-text-inverse/50 cursor-not-allowed whitespace-nowrap"
            >
              Coming soon
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
