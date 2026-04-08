'use client';

import type { BadgeDraft, CapabilityThreadOption } from '@/lib/content-studio/types';
import { Panel } from '../primitives/Panel';
import { FormField, Input, TextArea, Select } from '../primitives/FormField';
import { ThreadPicker } from '../primitives/ThreadPicker';
import { Medal, Compass } from '@/components/icons';

interface BadgeEditorProps {
  fieldPrefix: (string | number)[];
  setField: (path: (string | number)[], value: unknown) => void;
  toggleArrayItem: (path: (string | number)[], value: string) => void;
  doc: unknown;
  capabilityThreads: CapabilityThreadOption[];
}

export function BadgeEditor({ fieldPrefix, setField, toggleArrayItem, doc, capabilityThreads }: BadgeEditorProps) {
  const badge = doc as BadgeDraft;
  const f = (field: string) => [...fieldPrefix, field];

  return (
    <>
      <Panel title="Badge Identity" Icon={Medal}>
        <FormField label="Title" required>
          <Input value={badge.title} onChange={(v) => setField(f('title'), v)} placeholder="e.g., Keen Observer" />
        </FormField>
        <FormField label="Emoji" hint="Single emoji shown as badge icon">
          <Input value={badge.emoji} onChange={(v) => setField(f('emoji'), v)} placeholder="🔬" />
        </FormField>
        <FormField label="Description" required hint="What this badge represents and recognises">
          <TextArea value={badge.description} onChange={(v) => setField(f('description'), v)} rows={3} serif />
        </FormField>
        <FormField label="Criteria Summary" required hint="Single text summarising what the learner must demonstrate">
          <TextArea value={badge.criteriaSummary} onChange={(v) => setField(f('criteriaSummary'), v)} rows={3} />
        </FormField>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Observation Threshold" hint="Number of observations needed">
            <Input type="number" value={badge.observationThreshold} onChange={(v) => setField(f('observationThreshold'), v)} />
          </FormField>
          <FormField label="Status">
            <Select
              value={badge.status}
              onChange={(v) => setField(f('status'), v)}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
              ]}
            />
          </FormField>
        </div>
      </Panel>

      <Panel title="Capability Threads" Icon={Compass} defaultOpen={false} right={<span className="text-xs text-text-muted font-sans">{badge.capabilityThreadIds.length} selected</span>}>
        <ThreadPicker
          threads={capabilityThreads}
          selected={badge.capabilityThreadIds}
          onChange={(id) => toggleArrayItem(f('capabilityThreadIds'), id)}
        />
      </Panel>
    </>
  );
}
