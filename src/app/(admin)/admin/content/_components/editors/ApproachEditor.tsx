'use client';

import type { StudioState, Selection, StudioAction } from '@/lib/content-studio/types';
import { getSelectedDoc } from '@/lib/content-studio/reducer';
import { MODALITIES, CONTENT_STATUSES } from '@/lib/content-studio/types';
import { Panel } from '../primitives/Panel';
import { FormField, Input, TextArea, Select } from '../primitives/FormField';
import { Shuffle, ClipboardText, Note, Timer } from '@/components/icons';

interface ApproachEditorProps {
  state: StudioState;
  sel: Selection;
  fieldPrefix: (string | number)[];
  setField: (path: (string | number)[], value: unknown) => void;
  dispatch: (action: StudioAction) => void;
  showPrompt: (title: string) => Promise<string | null>;
  setSel: (sel: Selection) => void;
}

export function ApproachEditor({ state, sel, fieldPrefix, setField, dispatch, showPrompt, setSel }: ApproachEditorProps) {
  const doc = getSelectedDoc(state, sel);
  if (!doc || sel.type !== 'approach') return null;
  const approach = doc as { title: string; modality: string; description: string; activities: Array<{ _key: string; title: string; duration: { min: number; max: number }; setting: string; energyLevel: string; status: string }>; status: string };
  const f = (field: string) => [...fieldPrefix, field];

  async function addActivity() {
    const t = await showPrompt('Activity title');
    if (!t) return;
    if (sel.scope === 'pack' && sel.type === 'approach') {
      dispatch({ type: 'ADD_ACTIVITY', scope: 'pack', pi: sel.pi, mi: sel.mi, ai: sel.ai, title: t });
    } else if (sel.scope === 'standalone-module' && sel.type === 'approach') {
      dispatch({ type: 'ADD_ACTIVITY', scope: 'standalone-module', mi: sel.mi, ai: sel.ai, title: t });
    }
  }

  return (
    <>
      <Panel title="Approach Identity" Icon={Shuffle}>
        <FormField label="Title" required>
          <Input value={approach.title} onChange={(v) => setField(f('title'), v)} placeholder="e.g., Creature Watch" />
        </FormField>
        <FormField label="Description" required hint="How this approach enters the module's understanding">
          <TextArea value={approach.description} onChange={(v) => setField(f('description'), v)} rows={3} serif placeholder="Observing living creatures in their natural environment..." />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Modality">
            <Select
              value={approach.modality}
              onChange={(v) => setField(f('modality'), v)}
              options={[{ value: '', label: '— Select —' }, ...MODALITIES.map((m) => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))]}
            />
          </FormField>
          <FormField label="Status">
            <Select
              value={approach.status}
              onChange={(v) => setField(f('status'), v)}
              options={CONTENT_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            />
          </FormField>
        </div>
      </Panel>

      <Panel title="Activities" Icon={ClipboardText} right={<span className="text-xs text-text-muted font-sans">{approach.activities.length} activities</span>}>
        {approach.activities.length === 0 && (
          <div className="py-5 text-center text-text-muted text-sm font-sans">
            No activities yet. Add the first one.
          </div>
        )}
        {approach.activities.map((act, i) => (
          <div
            key={act._key}
            onClick={() => {
              if (sel.scope === 'pack')
                setSel({ scope: 'pack', pi: sel.pi, mi: sel.mi, ai: sel.ai, acti: i, type: 'activity' });
              else if (sel.scope === 'standalone-module')
                setSel({ scope: 'standalone-module', mi: sel.mi, ai: sel.ai, acti: i, type: 'activity' });
            }}
            className="flex items-center gap-3 px-3.5 py-3 bg-surface-body border border-border-subtle rounded-[8px] mb-2 cursor-pointer hover:border-border-medium transition-colors duration-150"
          >
            <span className="inline-flex text-text-secondary" aria-hidden="true"><Note size={18} /></span>
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary font-serif">{act.title}</div>
              <div className="text-[0.7rem] text-text-muted mt-0.5 font-sans inline-flex items-center gap-xs">
                <Timer size={12} aria-hidden="true" /> {act.duration.min}–{act.duration.max} min · {act.setting} · {act.energyLevel}
              </div>
            </div>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${act.status === 'published' ? 'bg-sage' : 'bg-text-muted'}`}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addActivity}
          className="mt-2 px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-[8px] text-xs text-text-secondary font-sans hover:border-border-medium transition-colors duration-150"
        >
          + Add Activity
        </button>
      </Panel>
    </>
  );
}
