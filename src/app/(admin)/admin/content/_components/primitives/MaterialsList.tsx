'use client';

import type { MaterialDraft } from '@/lib/content-studio/types';
import { Input } from './FormField';

interface MaterialsListProps {
  materials: MaterialDraft[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof MaterialDraft, value: unknown) => void;
}

export function MaterialsList({ materials, onAdd, onRemove, onUpdate }: MaterialsListProps) {
  return (
    <div>
      {materials.length === 0 && (
        <div className="py-3 text-center text-text-muted text-xs font-sans">No materials yet.</div>
      )}
      {materials.map((m, i) => (
        <div key={m._key} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 mb-2 items-center">
          <Input
            value={m.name}
            onChange={(v) => onUpdate(i, 'name', v)}
            placeholder="Item name"
          />
          <label className="flex items-center gap-1.5 text-xs text-text-secondary whitespace-nowrap px-2 font-sans">
            <input
              type="checkbox"
              checked={m.required}
              onChange={(e) => onUpdate(i, 'required', e.target.checked)}
              className="accent-ember"
            />
            required
          </label>
          <Input
            value={m.alternative ?? ''}
            onChange={(v) => onUpdate(i, 'alternative', v)}
            placeholder="Substitute (optional)"
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="text-text-muted hover:text-ember font-sans text-sm px-2"
          >
            &times;
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-[8px] text-xs text-text-secondary font-sans hover:border-border-medium transition-colors duration-150"
      >
        + Add Material
      </button>
    </div>
  );
}
