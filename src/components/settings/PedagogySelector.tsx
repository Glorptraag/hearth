'use client';

import type { ComponentType } from 'react';
import { Tree, Bank, PuzzlePiece, PaintBrushBroad, Plant, Shuffle, Check } from '@/components/icons';

type IconC = ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>;

// Per the icon system rules doc, pedagogy identity icons are interim Phosphor
// until illustrator-bespoke marks land. Each maps to the closest Phosphor.
const PEDAGOGIES: ReadonlyArray<{ value: string; label: string; Icon: IconC; tagline: string }> = [
  { value: 'charlotte_mason', label: 'Charlotte Mason',  Icon: Tree,            tagline: 'Living books, nature study, narration.' },
  { value: 'classical',       label: 'Classical',        Icon: Bank,            tagline: 'Trivium: grammar, logic, rhetoric.' },
  { value: 'montessori',      label: 'Montessori',       Icon: PuzzlePiece,     tagline: 'Hands-on, child-led, prepared environment.' },
  { value: 'waldorf_steiner', label: 'Waldorf / Steiner',Icon: PaintBrushBroad, tagline: 'Arts integration, seasonal rhythms.' },
  { value: 'unschooling',     label: 'Unschooling',      Icon: Plant,           tagline: 'Interest-led, life as the curriculum.' },
  { value: 'eclectic',        label: 'Eclectic',         Icon: Shuffle,         tagline: 'Mix and match what works for your family.' },
];

interface PedagogySelectorProps {
  selected: string;
  onChange: (value: string) => void;
}

export default function PedagogySelector({ selected, onChange }: PedagogySelectorProps) {
  return (
    <div className="grid gap-sm sm:grid-cols-2">
      {PEDAGOGIES.map((p) => {
        const isSelected = selected === p.value;
        return (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            className={`flex items-start gap-md rounded-[10px] border p-md text-left transition-all duration-[var(--motion-gentle)] ease-[var(--ease-default)] ${
              isSelected
                ? 'border-ember bg-ember-glow'
                : 'border-border-subtle bg-surface-panel hover:border-border-medium hover:bg-surface-raised'
            }`}
          >
            <span className={isSelected ? 'text-ember' : 'text-text-secondary'} aria-hidden="true">
              <p.Icon size={22} />
            </span>
            <div className="flex-1">
              <p
                className={`font-serif text-base font-semibold ${
                  isSelected ? 'text-ember' : 'text-text-primary'
                }`}
              >
                {p.label}
              </p>
              <p className="mt-xs font-sans text-xs text-text-muted">{p.tagline}</p>
            </div>
            {isSelected && (
              <span className="mt-[2px] text-ember" aria-hidden="true"><Check size={14} /></span>
            )}
          </button>
        );
      })}
    </div>
  );
}
