'use client';

const PEDAGOGIES = [
  {
    value: 'charlotte_mason',
    label: 'Charlotte Mason',
    emoji: '🌿',
    tagline: 'Living books, nature study, narration.',
  },
  {
    value: 'classical',
    label: 'Classical',
    emoji: '🏛️',
    tagline: 'Trivium: grammar, logic, rhetoric.',
  },
  {
    value: 'montessori',
    label: 'Montessori',
    emoji: '🧩',
    tagline: 'Hands-on, child-led, prepared environment.',
  },
  {
    value: 'waldorf_steiner',
    label: 'Waldorf / Steiner',
    emoji: '🎨',
    tagline: 'Arts integration, seasonal rhythms.',
  },
  {
    value: 'unschooling',
    label: 'Unschooling',
    emoji: '🌱',
    tagline: 'Interest-led, life as the curriculum.',
  },
  {
    value: 'reggio',
    label: 'Reggio Emilia',
    emoji: '🏡',
    tagline: 'Environment as third teacher, project-based inquiry.',
  },
  {
    value: 'eclectic',
    label: 'Eclectic',
    emoji: '🔀',
    tagline: 'Mix and match what works for your family.',
  },
] as const;

type PedagogyValue = (typeof PEDAGOGIES)[number]['value'];

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
            className={`flex items-start gap-md rounded-[10px] border p-md text-left transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isSelected
                ? 'border-ember bg-ember-glow'
                : 'border-border-subtle bg-surface-panel hover:border-border-medium hover:bg-surface-raised'
            }`}
          >
            <span className="text-2xl">{p.emoji}</span>
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
              <span className="mt-[2px] text-ember">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
