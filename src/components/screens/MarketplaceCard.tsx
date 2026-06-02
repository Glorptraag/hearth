'use client';

import { createElement, type ComponentType } from 'react';
import {
  FlowerLotus,
  GraduationCap,
  Heart,
  Sparkle,
  BookOpenText,
  MathOperations,
  Atom,
  Globe,
  Palette,
  Cpu,
  PersonSimpleRun,
  ChatsCircle,
  Books,
} from '@/components/icons';
import { PackIndicators } from '@/components/ui/PackIndicators';
import type { Printables, Materials } from '@/lib/sanity/pack-indicators';

type IconC = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

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

export interface AssetCounts {
  total?: number;
  template?: number;
  worksheet?: number;
  reference?: number;
  card_set?: number;
  handout?: number;
  audio?: number;
  manipulative?: number;
}

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
  assetCounts?: AssetCounts;
  commonsTextCount?: number;
  printables?: Printables;
  materials?: Materials;
}

function getCreatorIcon(type?: CreatorType): IconC {
  switch (type) {
    case 'content-team': return FlowerLotus;
    case 'educator':     return GraduationCap;
    case 'parent':       return Heart;
    default:             return Sparkle;
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

const SUBJECT_META: Record<Subject, { label: string; hex: string; Icon: IconC }> = {
  english:      { label: 'English',      hex: '#6B8E9B', Icon: BookOpenText },
  mathematics:  { label: 'Mathematics',  hex: '#9B7B6B', Icon: MathOperations },
  science:      { label: 'Science',      hex: '#7B9B6B', Icon: Atom },
  hass:         { label: 'HASS',         hex: '#9B8B6B', Icon: Globe },
  arts:         { label: 'Arts',         hex: '#8B6B9B', Icon: Palette },
  technologies: { label: 'Technologies', hex: '#6B7B9B', Icon: Cpu },
  hpe:          { label: 'HPE',          hex: '#9B6B7B', Icon: PersonSimpleRun },
  languages:    { label: 'Languages',    hex: '#6B9B8B', Icon: ChatsCircle },
};

// Reconcile drifted subject values from authored content to the canonical enum.
// e.g. the kindling pipeline emits "health-pe" where the app uses "hpe".
const SUBJECT_ALIASES: Record<string, Subject> = {
  'health-pe': 'hpe',
};

// Map a raw Sanity subject value to a known canonical Subject, or null if unrecognised.
// Returning null (rather than throwing) keeps an unknown value from blanking the grid.
export function normalizeSubject(raw: string): Subject | null {
  const canonical = SUBJECT_ALIASES[raw] ?? raw;
  return canonical in SUBJECT_META ? (canonical as Subject) : null;
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

interface MarketplaceCardProps {
  pack: SanityPack;
  inLibrary: boolean;
  owned?: boolean;
  onAddToLibrary: (id: string) => void;
  onPurchase?: (id: string) => void;
}

export function MarketplaceCard({ pack, inLibrary, owned = false, onAddToLibrary, onPurchase }: MarketplaceCardProps) {
  const subjects = (pack.subjects ?? [])
    .map(normalizeSubject)
    .filter((s): s is Subject => s !== null);
  const primary = subjects[0];
  const primaryMeta = primary ? SUBJECT_META[primary] : null;
  const primaryHex = primaryMeta?.hex ?? '#D97B3A';
  const HeroIcon: IconC = primaryMeta?.Icon ?? Books;
  const rgb = hexToRgb(primaryHex);
  const heroGradient = `linear-gradient(135deg, rgba(${rgb},0.14) 0%, transparent 100%)`;
  const isMembership = pack.availability !== 'premium';
  const ageStr = formatAgeRange(pack.ageRange);
  const moduleCount = pack.moduleCount ?? 0;

  return (
    <article
      role="article"
      aria-label={`${pack.title} — ${moduleCount} modules${ageStr ? `, ${ageStr}` : ''}`}
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
          Pack
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
            {createElement(getCreatorIcon(pack.creatorType), { size: 14 })}
          </span>
          <span className="font-sans text-xs text-text-muted">
            {pack.creator ?? 'Hearth Team'}
          </span>
          <span className="font-sans text-[10px] text-text-muted bg-surface-raised rounded-full px-1.5 py-[1px] border border-border-subtle">
            {getCreatorLabel(pack.creatorType)}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-serif text-[1.05rem] font-semibold text-text-primary leading-snug line-clamp-2">
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

        {/* Pack indicators (printables / materials).
            Horizontal padding comes from the card body's p-4; CardRow only
            adds its own pt-sm/pb-md vertical spacing + the top divider. */}
        <PackIndicators
          context="card"
          printables={pack.printables}
          materials={pack.materials}
          assetCounts={pack.assetCounts}
          withDivider
        />

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-3 border-t border-border-subtle">
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
              className="font-sans text-[0.75rem] font-semibold px-3 py-1.5 rounded-[6px] border border-ember text-ember bg-transparent hover:bg-ember hover:text-text-inverse transition-all duration-200 ease-[var(--ease-default)] cursor-pointer whitespace-nowrap"
            >
              Add to Library
            </button>
          ) : owned ? (
            <button
              disabled
              aria-label={`${pack.title} — owned`}
              className="font-sans text-[0.75rem] font-semibold px-3 py-1.5 rounded-[6px] border border-sage/30 bg-sage/15 text-sage cursor-default select-none whitespace-nowrap"
            >
              Owned
            </button>
          ) : pack.stripePriceId ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPurchase?.(pack._id);
              }}
              aria-label={`Purchase ${pack.title}`}
              className="font-sans text-[0.75rem] font-semibold px-3 py-1.5 rounded-[6px] bg-ember text-text-inverse hover:bg-ember-hover transition-all duration-200 cursor-pointer whitespace-nowrap shadow-ember"
            >
              Get Pack
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
