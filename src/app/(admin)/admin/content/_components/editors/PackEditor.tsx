'use client';

import type { StudioState, Selection, StudioAction } from '@/lib/content-studio/types';
import { getSelectedDoc } from '@/lib/content-studio/reducer';
import { PACK_STATUSES, WORLDVIEWS, AVAILABILITIES } from '@/lib/content-studio/types';
import { createEmptyFurtherReading } from '@/lib/content-studio/factories';
import { SUBJECTS } from '@/types';
import { Panel } from '../primitives/Panel';
import { FormField, Input, TextArea, Select } from '../primitives/FormField';
import { RangeInput } from '../primitives/RangeInput';
import { TagInput } from '../primitives/TagInput';
import { Package, BookOpen, Books, Medal } from '@/components/icons';

const SUBJECT_OPTIONS = SUBJECTS.map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

interface PackEditorProps {
  state: StudioState;
  sel: Selection;
  fieldPrefix: (string | number)[];
  setField: (path: (string | number)[], value: unknown) => void;
  toggleArrayItem: (path: (string | number)[], value: string) => void;
  dispatch: (action: StudioAction) => void;
  showPrompt: (title: string) => Promise<string | null>;
  setSel: (sel: Selection) => void;
}

export function PackEditor({ state, sel, fieldPrefix, setField, dispatch, showPrompt, setSel }: PackEditorProps) {
  const doc = getSelectedDoc(state, sel);
  if (!doc || sel.type !== 'pack') return null;
  const pack = doc as {
    title: string;
    description: string;
    intro: { title: string; body: string; keyPoints: string[]; furtherReading: Array<{ _key: string; title: string; url: string }> };
    subjects: string[];
    ageRange: { min: number; max: number };
    termWeeks: number;
    worldview: string;
    availability: string;
    stripePriceId: string;
    creator: string;
    version: string;
    modules: Array<{ _key: string; title: string; approaches: Array<{ activities: unknown[] }>; status: string }>;
    badges: Array<{ _key: string; title: string; status: string }>;
    status: string;
  };
  const f = (field: string) => [...fieldPrefix, field];
  const ff = (...fields: string[]) => [...fieldPrefix, ...fields];

  const totalActs = pack.modules.reduce(
    (s, m) => s + m.approaches.reduce((s2, a) => s2 + a.activities.length, 0),
    0,
  );

  async function addModule() {
    const t = await showPrompt('Module title');
    if (t && sel.type === 'pack') dispatch({ type: 'ADD_MODULE', pi: sel.pi, title: t });
  }

  async function addBadge() {
    const t = await showPrompt('Badge title');
    if (t && sel.type === 'pack') dispatch({ type: 'ADD_BADGE', pi: sel.pi, title: t });
  }

  return (
    <>
      <Panel title="Pack Identity" Icon={Package}>
        <FormField label="Title" required>
          <Input value={pack.title} onChange={(v) => setField(f('title'), v)} placeholder="e.g., Starter Collection" />
        </FormField>
        <FormField label="Description" required hint="2-3 sentence sell copy shown on Marketplace cards">
          <TextArea value={pack.description} onChange={(v) => setField(f('description'), v)} rows={3} serif />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Availability">
            <Select
              value={pack.availability}
              onChange={(v) => setField(f('availability'), v)}
              options={AVAILABILITIES.map((a) => ({
                value: a,
                label: a === 'included' ? 'Included (membership)' : 'Premium (paid)',
              }))}
            />
          </FormField>
          <FormField label="Status">
            <Select
              value={pack.status}
              onChange={(v) => setField(f('status'), v)}
              options={PACK_STATUSES.map((s) => ({
                value: s,
                label: s.charAt(0).toUpperCase() + s.slice(1),
              }))}
            />
          </FormField>
        </div>
        {pack.availability === 'premium' && (
          <FormField label="Stripe Price ID" hint="Required for premium packs">
            <Input value={pack.stripePriceId} onChange={(v) => setField(f('stripePriceId'), v)} placeholder="price_..." />
          </FormField>
        )}
        <FormField label="Age Range">
          <RangeInput
            min={pack.ageRange.min}
            max={pack.ageRange.max}
            onChangeMin={(v) => setField(ff('ageRange', 'min'), v)}
            onChangeMax={(v) => setField(ff('ageRange', 'max'), v)}
            minLabel="Min Age"
            maxLabel="Max Age"
          />
        </FormField>
        <div className="grid grid-cols-3 gap-3">
          <FormField label="Term Weeks">
            <Input type="number" value={pack.termWeeks} onChange={(v) => setField(f('termWeeks'), v)} />
          </FormField>
          <FormField label="Worldview">
            <Select
              value={pack.worldview}
              onChange={(v) => setField(f('worldview'), v)}
              options={WORLDVIEWS.map((w) => ({
                value: w,
                label: w.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
              }))}
            />
          </FormField>
          <FormField label="Creator">
            <Input value={pack.creator} onChange={(v) => setField(f('creator'), v)} />
          </FormField>
        </div>
        <FormField label="Version">
          <Input value={pack.version} onChange={(v) => setField(f('version'), v)} placeholder="1.0.0" />
        </FormField>
        <FormField label="Subjects">
          <TagInput
            values={pack.subjects}
            onChange={(v) => setField(f('subjects'), v)}
            allowedValues={SUBJECT_OPTIONS}
          />
        </FormField>
      </Panel>

      <Panel title="Pack Intro" Icon={Books} defaultOpen={false}>
        <FormField label="Intro Title">
          <Input value={pack.intro.title} onChange={(v) => setField(ff('intro', 'title'), v)} placeholder="Welcome to..." />
        </FormField>
        <FormField label="Intro Body" hint="400-600 words. Gentle friend tone. Becomes Portable Text on export.">
          <TextArea value={pack.intro.body} onChange={(v) => setField(ff('intro', 'body'), v)} rows={8} serif />
        </FormField>
        <FormField label="Key Points" hint="Short bullet points highlighting what the pack covers">
          <TagInput
            values={pack.intro.keyPoints}
            onChange={(v) => setField(ff('intro', 'keyPoints'), v)}
            placeholder="Type a key point and press Enter"
          />
        </FormField>
        <FormField label="Further Reading">
          {pack.intro.furtherReading.map((item, i) => (
            <div key={item._key} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2 items-center">
              <Input
                value={item.title}
                onChange={(v) => setField(ff('intro', 'furtherReading', String(i), 'title'), v)}
                placeholder="Link title"
              />
              <Input
                value={item.url}
                onChange={(v) => setField(ff('intro', 'furtherReading', String(i), 'url'), v)}
                placeholder="https://..."
                type="url"
              />
              <button
                type="button"
                onClick={() =>
                  setField(
                    ff('intro', 'furtherReading'),
                    pack.intro.furtherReading.filter((_, idx) => idx !== i),
                  )
                }
                className="text-text-muted hover:text-ember font-sans text-sm px-2"
              >
                &times;
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setField(ff('intro', 'furtherReading'), [...pack.intro.furtherReading, createEmptyFurtherReading()])
            }
            className="px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-[8px] text-xs text-text-secondary font-sans hover:border-border-medium transition-colors"
          >
            + Add Link
          </button>
        </FormField>
      </Panel>

      <Panel
        title="Modules"
        Icon={BookOpen}
        right={
          <span className="text-xs text-text-muted font-sans">
            {pack.modules.length} modules · {totalActs} activities
          </span>
        }
      >
        {pack.modules.length === 0 && (
          <div className="py-5 text-center text-text-muted text-sm font-sans">
            No modules yet. Add the first one below.
          </div>
        )}
        {pack.modules.map((m, i) => (
          <div
            key={m._key}
            onClick={() => setSel({ scope: 'pack', pi: sel.pi, mi: i, type: 'module' })}
            className="flex items-center gap-3 px-3.5 py-3 bg-surface-body border border-border-subtle rounded-[8px] mb-2 cursor-pointer hover:border-border-medium transition-colors duration-150"
          >
            <span className="inline-flex text-text-secondary" aria-hidden="true"><BookOpen size={18} /></span>
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary font-serif">{m.title}</div>
              <div className="text-[0.7rem] text-text-muted mt-0.5 font-sans">
                {m.approaches.length} approaches · {m.approaches.reduce((s, a) => s + a.activities.length, 0)} activities
              </div>
            </div>
            <span className={`w-2 h-2 rounded-full shrink-0 ${m.status === 'published' ? 'bg-sage' : 'bg-text-muted'}`} />
          </div>
        ))}
        <button
          type="button"
          onClick={addModule}
          className="mt-2 px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-[8px] text-xs text-text-secondary font-sans hover:border-border-medium transition-colors"
        >
          + Add Module
        </button>
      </Panel>

      <Panel
        title="Badges"
        Icon={Medal}
        right={<span className="text-xs text-text-muted font-sans">{pack.badges.length} badges</span>}
      >
        {pack.badges.length === 0 && (
          <div className="py-5 text-center text-text-muted text-sm font-sans">No badges yet.</div>
        )}
        {pack.badges.map((b, i) => (
          <div
            key={b._key}
            onClick={() => setSel({ scope: 'pack', pi: sel.pi, bi: i, type: 'badge' })}
            className="flex items-center gap-3 px-3.5 py-3 bg-surface-body border border-border-subtle rounded-[8px] mb-2 cursor-pointer hover:border-border-medium transition-colors duration-150"
          >
            <span className="inline-flex text-text-secondary" aria-hidden="true"><Medal size={18} /></span>
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary font-sans">{b.title}</div>
            </div>
            <span className={`w-2 h-2 rounded-full shrink-0 ${b.status === 'published' ? 'bg-sage' : 'bg-text-muted'}`} />
          </div>
        ))}
        <button
          type="button"
          onClick={addBadge}
          className="mt-2 px-3 py-1.5 bg-surface-raised border border-border-subtle rounded-[8px] text-xs text-text-secondary font-sans hover:border-border-medium transition-colors"
        >
          + Add Badge
        </button>
      </Panel>
    </>
  );
}
