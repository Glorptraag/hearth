'use client';

import type { ActivityAssetRefDraft, AssetRole } from '@/lib/content-studio/types';
import { ASSET_ROLES } from '@/lib/content-studio/types';

interface AssetOption {
  _id: string;
  title: string;
  kind: string;
}

interface Props {
  refs: ActivityAssetRefDraft[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: keyof ActivityAssetRefDraft, value: string) => void;
  availableAssets: AssetOption[];
}

export function AssetRefList({ refs, onAdd, onRemove, onUpdate, availableAssets }: Props) {
  return (
    <div className="space-y-2">
      {refs.map((ref, i) => (
        <div key={ref._key} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-start">
          <select
            value={ref.assetId}
            onChange={(e) => onUpdate(i, 'assetId', e.target.value)}
            className="px-3 py-2 bg-surface-raised border border-border-subtle rounded-[8px] text-text-primary font-sans text-xs outline-none focus:border-ember"
          >
            <option value="">Select asset...</option>
            {availableAssets.map((a) => (
              <option key={a._id} value={a._id}>
                {a.title} ({a.kind})
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
          <input
            type="text"
            value={ref.notes}
            onChange={(e) => onUpdate(i, 'notes', e.target.value)}
            placeholder="Notes..."
            className="px-3 py-2 bg-surface-raised border border-border-subtle rounded-[8px] text-text-primary font-sans text-xs outline-none focus:border-ember placeholder:text-text-muted/60"
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="px-2 py-2 text-red-400 hover:text-red-300 text-xs transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="px-3 py-1.5 text-xs font-sans text-ember hover:text-ember-hover transition-colors"
      >
        + Add Asset
      </button>
    </div>
  );
}
