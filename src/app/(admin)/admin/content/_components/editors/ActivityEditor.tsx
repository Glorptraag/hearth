'use client';

import type { ActivityDraft, CapabilityThreadOption } from '@/lib/content-studio/types';
import { createEmptyMaterial } from '@/lib/content-studio/factories';
import { SETTINGS, ENERGY_LEVELS, ACTIVITY_MODALITIES, CONTENT_STATUSES, DELIVERY_CHANNELS } from '@/lib/content-studio/types';
import { Panel } from '../primitives/Panel';
import { FormField, Input, TextArea, Select } from '../primitives/FormField';
import { RangeInput } from '../primitives/RangeInput';
import { MaterialsList } from '../primitives/MaterialsList';
import { ThreadPicker } from '../primitives/ThreadPicker';
import { Note, Timer, Toolbox, GraduationCap, Eye, Compass } from '@/components/icons';
import { TagInput } from '../primitives/TagInput';

interface ActivityEditorProps {
  fieldPrefix: (string | number)[];
  setField: (path: (string | number)[], value: unknown) => void;
  toggleArrayItem: (path: (string | number)[], value: string) => void;
  doc: unknown;
  capabilityThreads: CapabilityThreadOption[];
}

export function ActivityEditor({ fieldPrefix, setField, toggleArrayItem, doc, capabilityThreads }: ActivityEditorProps) {
  const act = doc as ActivityDraft;
  const f = (field: string) => [...fieldPrefix, field];
  const ff = (...fields: string[]) => [...fieldPrefix, ...fields];

  return (
    <>
      <Panel title="Activity Content" Icon={Note}>
        <FormField label="Title" required>
          <Input value={act.title} onChange={(v) => setField(f('title'), v)} placeholder="e.g., Find and Watch" />
        </FormField>
        <FormField label="Summary" hint="1-2 sentences shown on activity cards">
          <TextArea value={act.summary} onChange={(v) => setField(f('summary'), v)} rows={2} serif />
        </FormField>
        {/* TODO: Rich instruction block picker (sayBlock, pauseNote, watchBlock)
           Sanity activity.instructions supports styled blocks beyond "normal":
           - sayBlock: "Say to your child" callout
           - pauseNote: "Pause and notice" prompt
           - watchBlock: "Watch for" observation cue
           Currently only plain paragraphs are produced (via blockText()).
           Future: inline block-type toolbar to insert styled blocks, and update
           sanity-transform.ts + helpers.ts blockText() to emit them. */}
        <FormField label="Instructions" required hint="Plain paragraphs. Double newline separates Portable Text blocks.">
          <TextArea
            value={act.instructionsText}
            onChange={(v) => setField(f('instructionsText'), v)}
            rows={10}
            serif
            placeholder="Step 1: Go outside and find a living creature...&#10;&#10;Step 2: Sit or crouch nearby..."
          />
        </FormField>
      </Panel>

      <Panel title="Session Parameters" Icon={Timer}>
        <div className="grid grid-cols-3 gap-3 mb-lg">
          <FormField label="Duration (mins)">
            <RangeInput
              min={act.duration.min}
              max={act.duration.max}
              onChangeMin={(v) => setField(ff('duration', 'min'), v)}
              onChangeMax={(v) => setField(ff('duration', 'max'), v)}
            />
          </FormField>
          <FormField label="Modality">
            <Select
              value={act.modality}
              onChange={(v) => setField(f('modality'), v)}
              options={ACTIVITY_MODALITIES.map((m) => ({ value: m, label: m }))}
            />
          </FormField>
          <FormField label="Delivery Channel">
            <Select
              value={act.deliveryChannel}
              onChange={(v) => setField(f('deliveryChannel'), v)}
              options={DELIVERY_CHANNELS.map((c) => ({ value: c, label: c }))}
            />
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-lg">
          <FormField label="Setting">
            <Select
              value={act.setting}
              onChange={(v) => setField(f('setting'), v)}
              options={SETTINGS.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            />
          </FormField>
          <FormField label="Energy Level">
            <Select
              value={act.energyLevel}
              onChange={(v) => setField(f('energyLevel'), v)}
              options={ENERGY_LEVELS.map((e) => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1) }))}
            />
          </FormField>
          <FormField label="Status">
            <Select
              value={act.status}
              onChange={(v) => setField(f('status'), v)}
              options={CONTENT_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
            />
          </FormField>
        </div>
        <FormField label="Age Range">
          <RangeInput
            min={act.ageRange.min}
            max={act.ageRange.max}
            onChangeMin={(v) => setField(ff('ageRange', 'min'), v)}
            onChangeMax={(v) => setField(ff('ageRange', 'max'), v)}
            minLabel="Min Age"
            maxLabel="Max Age"
          />
        </FormField>
      </Panel>

      <Panel title="Materials" Icon={Toolbox} right={<span className="text-xs text-text-muted font-sans">{act.materials.length} items</span>}>
        <MaterialsList
          materials={act.materials}
          onAdd={() => setField(f('materials'), [...act.materials, createEmptyMaterial()])}
          onRemove={(i) => setField(f('materials'), act.materials.filter((_, idx) => idx !== i))}
          onUpdate={(i, field, value) => {
            const updated = act.materials.map((m, idx) =>
              idx === i ? { ...m, [field]: value } : m,
            );
            setField(f('materials'), updated);
          }}
        />
      </Panel>

      <Panel title="Facilitator Guidance" Icon={GraduationCap}>
        <FormField label="Before the Activity" hint="What to prepare, mindset to set">
          <TextArea value={act.facilitatorGuidance.before ?? ''} onChange={(v) => setField(ff('facilitatorGuidance', 'before'), v)} rows={3} />
        </FormField>
        <FormField label="During the Activity" hint="What to watch for, when to step back">
          <TextArea value={act.facilitatorGuidance.during ?? ''} onChange={(v) => setField(ff('facilitatorGuidance', 'during'), v)} rows={3} />
        </FormField>
        <FormField label="Common Challenges" hint="What might go wrong and how to handle it">
          <TextArea value={act.facilitatorGuidance.challenges ?? ''} onChange={(v) => setField(ff('facilitatorGuidance', 'challenges'), v)} rows={3} />
        </FormField>
      </Panel>

      <Panel title="Observation & Reflection" Icon={Eye} defaultOpen={false}>
        <FormField label="Observation Prompts" hint="What to watch for. Press Enter to add.">
          <TagInput
            values={act.observationPrompts}
            onChange={(v) => setField(f('observationPrompts'), v)}
            placeholder="Type a prompt and press Enter"
          />
        </FormField>
        <FormField label="Reflection Prompts" hint="Post-activity questions for family discussion.">
          <TagInput
            values={act.reflectionPrompts}
            onChange={(v) => setField(f('reflectionPrompts'), v)}
            placeholder="Type a prompt and press Enter"
          />
        </FormField>
      </Panel>

      <Panel title="Capability Threads" Icon={Compass} defaultOpen={false} right={<span className="text-xs text-text-muted font-sans">{act.capabilityThreadIds.length} selected</span>}>
        <ThreadPicker
          threads={capabilityThreads}
          selected={act.capabilityThreadIds}
          onChange={(id) => toggleArrayItem(f('capabilityThreadIds'), id)}
        />
      </Panel>
    </>
  );
}
