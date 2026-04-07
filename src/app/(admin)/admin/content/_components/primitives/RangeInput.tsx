'use client';

import { Input } from './FormField';

interface RangeInputProps {
  min: number;
  max: number;
  onChangeMin: (value: number) => void;
  onChangeMax: (value: number) => void;
  minLabel?: string;
  maxLabel?: string;
}

export function RangeInput({
  min,
  max,
  onChangeMin,
  onChangeMax,
  minLabel = 'Min',
  maxLabel = 'Max',
}: RangeInputProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block font-sans text-[0.65rem] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1">
          {minLabel}
        </label>
        <Input type="number" value={min} onChange={(v) => onChangeMin(Number(v))} />
      </div>
      <div>
        <label className="block font-sans text-[0.65rem] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1">
          {maxLabel}
        </label>
        <Input type="number" value={max} onChange={(v) => onChangeMax(Number(v))} />
      </div>
    </div>
  );
}
