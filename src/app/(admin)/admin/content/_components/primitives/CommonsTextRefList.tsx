'use client';

import type { ActivityCommonsTextRefDraft } from '@/lib/content-studio/types';
import { ASSET_ROLES, PRESENTATION_MODES } from '@/lib/content-studio/types';

const modeLabels: Record<string, string> = {
  read_aloud: 'Read Aloud',
  child_reads: 'Child Reads',
  reference_only: 'Reference Only',
  memorisation: 'Memorisation',
};

interface TextOption {
  _id: string;
  title: string;
  kind: string;
  tradition: string;
}

interface Props {
  refs: ActivityCommonsTextRefDraft[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof ActivityCommonsTextRefDraft, value: string) => void;
  availableTexts: TextOption[];
}

export function CommonsTextRefList({ refs, onAdd, onRemove, onUpdate, availableTexts }: Props) {
  return (
    <div className="space-y-2">
      {refs.map((ref, i) => (
        <div key={ref._key} className="space-y-1.5">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-start">
            <select
              value={ref.commonsTextId}
              onChange={(e) => onUpdate(i, 'commonsTextId', e.target.value)}
              className="px-3 py-2 bg-surface-raised border border-border-subtle rounded-[8px] text-text-primary font-sans text-xs outline-none focus:border-ember"
            >
              <option value="">Select text...</option>
              {availableTexts.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title} ({t.tradition})
                </option>
              ))}
            </select>
            <select
              value={ref.role}
              onChange={(e) => onUpdate(i, 'role', e.target.value)}
              className="px-2 py-2 bg-surface-raised border border-border-subtle rounded-[8px] text-text-primary font-sans text-xs outline-none focus:border-ember"
            >
              {ASSET_ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
            <select
              value={ref.presentationMode}
              onChange={(e) => onUpdate(i, 'presentationMode', e.target.value)}
              className="px-2 py-2 bg-surface-raised border border-border-subtle rounded-[8px] text-text-primary font-sans text-xs outline-none focus:border-ember"
            >
              {PRESENTATION_MODES.map((m) => (
                <option key={m} value={m}>{modeLabels[m]}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="px-2 py-2 text-red-400 hover:text-red-300 text-xs transition-colors"
            >
              ✕
            </button>
          </div>
          <input
            type="text"
            value={ref.notes}
            onChange={(e) => onUpdate(i, 'notes', e.target.value)}
            placeholder="Activity-specific notes..."
            className="w-full px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-[6px] text-text-primary font-sans text-[0.7rem] outline-none focus:border-ember placeholder:text-text-muted/60"
          />
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="px-3 py-1.5 text-xs font-sans text-ember hover:text-ember-hover transition-colors"
      >
        + Add Text
      </button>
    </div>
  );
}
