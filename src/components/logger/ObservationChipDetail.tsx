'use client';

import { useId } from 'react';

export type ChipDetailValue = {
  detail: string;
  durationMin?: number;
};

// Per-chip configuration: what detail field(s) to show when the chip is active in Guided Mode.
type ChipConfig = {
  placeholder: string;
  label: string;
  showDuration: boolean;
};

const CHIP_CONFIGS: Record<string, ChipConfig> = {
  'Deeply focused': {
    label: 'What specifically were they doing, and for how long?',
    placeholder: 'e.g. "Building with Lego, kept trying to make an arch that would stand up"',
    showDuration: true,
  },
  'Asked questions': {
    label: "What was the best question they asked? Write it in their own words.",
    placeholder: 'e.g. "Why do leaves fall off but pine trees don\'t?"',
    showDuration: false,
  },
  'Made connections': {
    label: 'What did they connect this to? What earlier experience did they draw on?',
    placeholder: 'e.g. "Said it was like the gravity experiment we did last month"',
    showDuration: false,
  },
  'Explained reasoning': {
    label: "Write out what they said — even roughly. Their reasoning in their own words matters.",
    placeholder: 'e.g. "Said \'if you divide it into three, one part is a third\'"',
    showDuration: false,
  },
};

interface ObservationChipDetailProps {
  chip: string;
  value: ChipDetailValue;
  onChange: (value: ChipDetailValue) => void;
}

export function ObservationChipDetail({ chip, value, onChange }: ObservationChipDetailProps) {
  const config = CHIP_CONFIGS[chip];
  const inputId = useId();
  const durationId = useId();

  // Only render for chips that have a detail config
  if (!config) return null;

  return (
    <div className="hearth-reveal mt-sm ml-sm pl-sm border-l-2 border-border-subtle space-y-sm">
      <div>
        <label
          htmlFor={inputId}
          className="block font-sans text-xs text-text-secondary mb-xs"
        >
          {config.label}
        </label>
        <textarea
          id={inputId}
          value={value.detail}
          onChange={(e) => onChange({ ...value, detail: e.target.value })}
          placeholder={config.placeholder}
          rows={2}
          className="w-full resize-none rounded-md border border-border-subtle bg-surface-body px-sm py-xs font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-ember/40 focus:outline-none focus:ring-2 focus:ring-ember/20 transition-colors duration-[var(--motion-quick)]"
        />
      </div>

      {config.showDuration && (
        <div className="flex items-center gap-sm">
          <label
            htmlFor={durationId}
            className="font-sans text-xs text-text-secondary shrink-0"
          >
            How long? (minutes)
          </label>
          <input
            id={durationId}
            type="number"
            min={1}
            max={480}
            value={value.durationMin ?? ''}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10);
              onChange({ ...value, durationMin: isNaN(parsed) ? undefined : parsed });
            }}
            placeholder="e.g. 45"
            className="w-20 rounded-md border border-border-subtle bg-surface-body px-sm py-xs font-sans text-sm text-text-primary placeholder:text-text-muted focus:border-ember/40 focus:outline-none focus:ring-2 focus:ring-ember/20 transition-colors duration-[var(--motion-quick)]"
          />
        </div>
      )}
    </div>
  );
}

// Chips that have a detail unfold in Guided Mode.
export const DETAIL_CHIPS = new Set(Object.keys(CHIP_CONFIGS));
