'use client';

import type { StudioState, Selection, StudioAction, CapabilityThreadOption } from '@/lib/content-studio/types';
import { getSelectedDoc } from '@/lib/content-studio/reducer';
import { CONTENT_STATUSES } from '@/lib/content-studio/types';
import { SUBJECTS } from '@/types';
import { Panel } from '../primitives/Panel';
import { FormField, Input, TextArea, Select } from '../primitives/FormField';
import { RangeInput } from '../primitives/RangeInput';
import { TagInput } from '../primitives/TagInput';
import { ThreadPicker } from '../primitives/ThreadPicker';

const SUBJECT_OPTIONS = SUBJECTS.map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

interface ModuleEditorProps {
  state: StudioState;
  sel: Selection;
  fieldPrefix: (string | number)[];
  setField: (path: (string | number)[], value: unknown) => void;
  toggleArrayItem: (path: (string | number)[], value: string) => void;
  dispatch: (action: StudioAction) => void;
  showPrompt: (title: string) => Promise<string | null>;
  setSel: (sel: Selection) => void;
  capabilityThreads: CapabilityThreadOption[];
}

export function ModuleEditor({
  state,
  sel,
  fieldPrefix,
  setField,
  toggleArrayItem,
  dispatch,
  showPrompt,
  setSel,
  capabilityThreads,
}: ModuleEditorProps) {
  const doc = getSelectedDoc(state, sel);
  if (!doc || sel.type !== 'module') return null;
  const mod = doc as {
    title: string;
    targetUnderstanding: string;
    understandingIndicators: { emerging: string; developing: string; demonstrating: string };
    subjects: string[];
    ageRange: { min: number; max: number };
    duration: { min: number; max: number };
    capabilityThreadIds: string[];
    approaches: Array<{ _key: string; title: string; activities: unknown[]; status: string }>;
    status: string;
  };
  const f = (field: string) => [...fieldPrefix, field];
  const ff = (...fields: string[]) => [...fieldPrefix, ...fields];

  async function addApproach() {
    const t = await showPrompt('Approach title');
    if (!t) return;
    if (sel.scope === 'pack' && sel.type === 'module') {
      dispatch({ type: 'ADD_APPROACH', scope: 'pack', pi: sel.pi, mi: sel.mi, title: t });
    } else if (sel.scope === 'standalone-module' && sel.type === 'module') {
      dispatch({ type: 'ADD_APPROACH', scope: 'standalone-module', mi: sel.mi, title: t });
    }
  }

  const totalActivities = mod.approaches.reduce((s, a) => s + a.activities.length, 0);

  return (
    <>
      <Panel title="Module Identity" emoji="📖">
        <FormField label="Title" required>
          <Input value={mod.title} onChange={(v) => setField(f('title'), v)} placeholder="e.g., What Lives Outside" />
        </FormField>
        <FormField label="Target Understanding" required hint="Philosophy-neutral. 1-2 sentences.">
          <TextArea
            value={mod.targetUnderstanding}
            onChange={(v) => setField(f('targetUnderstanding'), v)}
            rows={3}
            serif
            placeholder="Children observe and describe features of their natural environment..."
          />
        </FormField>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Status">
            <Select
              value={mod.status}
              onChange={(v) => setField(f('status'), v)}
              options={CONTENT_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            />
          </FormField>
          <FormField label="Age Range">
            <RangeInput
              min={mod.ageRange.min}
              max={mod.ageRange.max}
              onChangeMin={(v) => setField(ff('ageRange', 'min'), v)}
              onChangeMax={(v) => setField(ff('ageRange', 'max'), v)}
            />
          </FormField>
          <FormField label="Duration (mins)">
            <RangeInput
              min={mod.duration.min}
              max={mod.duration.max}
              onChangeMin={(v) => setField(ff('duration', 'min'), v)}
              onChangeMax={(v) => setField(ff('duration', 'max'), v)}
            />
          </FormField>
        </div>
        <FormField label="Subjects">
          <TagInput
            values={mod.subjects}
            onChange={(v) => setField(f('subjects'), v)}
            allowedValues={SUBJECT_OPTIONS}
          />
        </FormField>
      </Panel>

      <Panel title="Understanding Indicators" emoji="📏">
        <div className="text-xs text-text-secondary italic mb-md font-sans">
          Observable behaviours at each tier. Required for badge assessment and Constellation.
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(['emerging', 'developing', 'demonstrating'] as const).map((tier) => {
            const tierColor =
              tier === 'emerging'
                ? 'text-text-muted'
                : tier === 'developing'
                  ? 'text-blue-400'
                  : 'text-sage';
            return (
              <div key={tier} className="bg-surface-body border border-border-subtle rounded-[8px] p-3.5">
                <h4 className={`text-[0.65rem] font-bold uppercase tracking-[0.05em] ${tierColor} mb-2.5 font-sans`}>
                  {tier}
                </h4>
                <TextArea
                  value={mod.understandingIndicators[tier]}
                  onChange={(v) => setField(ff('understandingIndicators', tier), v)}
                  rows={4}
                  className="text-xs"
                />
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel
        title="Capability Threads"
        emoji="🧭"
        right={<span className="text-xs text-text-muted font-sans">{mod.capabilityThreadIds.length} selected</span>}
      >
        <ThreadPicker
          threads={capabilityThreads}
          selected={mod.capabilityThreadIds}
          onChange={(id) => toggleArrayItem(f('capabilityThreadIds'), id)}
        />
      </Panel>

      <Panel
        title="Approaches"
        emoji="🔀"
        right={<span className="text-xs text-text-muted font-sans">{mod.approaches.length} approaches · {totalActivities} activities</span>}
      >
        {mod.approaches.length === 0 && (
          <div className="py-5 text-center text-text-muted text-sm font-sans">
            No approaches yet. Add the first angle into this understanding.
          </div>
        )}
        {mod.approaches.map((a, i) => (
          <div
            key={a._key}
            onClick={() => {
              if (sel.scope === 'pack')
                setSel({ scope: 'pack', pi: sel.pi, mi: sel.mi, ai: i, type: 'approach' });
              else
                setSel({ scope: 'standalone-module', mi: sel.mi, ai: i, type: 'approach' });
            }}
            className="flex items-center gap-3 px-3.5 py-3 bg-surface-body border border-border-subtle rounded-[8px] mb-2 cursor-pointer hover:border-border-medium transition-colors duration-150"
          >
            <span className="text-lg">🔀</span>
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary font-serif">{a.title}</div>
              <div className="text-[0.7rem] text-text-muted mt-0.5 font-sans">
                {a.activities.length} activities
              </div>
            </div>
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${a.status === 'published' ? 'bg-sage' : 'bg-text-muted'}`}
            />
          </div>
        ))}
        <button
          type="button"
          onClick={addApproach}
          className="mt-2 px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-[8px] text-xs text-text-secondary font-sans hover:border-border-medium transition-colors duration-150"
        >
          + Add Approach
        </button>
      </Panel>
    </>
  );
}
