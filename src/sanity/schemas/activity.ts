import { defineType, defineField } from 'sanity';

export const activity = defineType({
  name: 'activity',
  title: 'Activity',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'summary', title: 'Summary', type: 'text', description: '1-2 sentence overview shown on activity cards' }),
    defineField({
      name: 'approach',
      title: 'Approach',
      type: 'reference',
      to: [{ type: 'approach' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'instructions',
      title: 'Instructions',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Say Block', value: 'sayBlock' },
            { title: 'Pause Note', value: 'pauseNote' },
            { title: 'Watch Block', value: 'watchBlock' },
          ],
        },
      ],
    }),
    defineField({
      name: 'facilitatorGuidance',
      title: 'Facilitator Guidance',
      type: 'object',
      fields: [
        { name: 'before', title: 'Before', type: 'text' },
        { name: 'during', title: 'During', type: 'text' },
        { name: 'challenges', title: 'Challenges', type: 'text' },
      ],
    }),
    defineField({
      name: 'materials',
      title: 'Materials',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'alternative', title: 'Alternative', type: 'string' }),
            defineField({ name: 'required', title: 'Required', type: 'boolean', initialValue: true }),
          ],
        },
      ],
    }),
    defineField({
      name: 'assets',
      title: 'Assets (Hearth-supplied)',
      type: 'array',
      description: 'Printables, references, and media that Hearth provides for this activity',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'asset',
              title: 'Asset',
              type: 'reference',
              to: [{ type: 'asset' }],
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'role',
              title: 'Role',
              type: 'string',
              initialValue: 'core',
              options: {
                list: [
                  { title: 'Core', value: 'core' },
                  { title: 'Optional', value: 'optional' },
                  { title: 'Extension', value: 'extension' },
                ],
              },
            }),
            defineField({ name: 'notes', title: 'Usage Notes', type: 'string' }),
          ],
          preview: {
            select: { title: 'asset.title', subtitle: 'role' },
          },
        },
      ],
    }),
    defineField({
      name: 'commonsTexts',
      title: 'Commons Texts (Hearth-supplied)',
      type: 'array',
      description: 'Public-domain text content for reading, memorisation, or reference',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'text',
              title: 'Commons Text',
              type: 'reference',
              to: [{ type: 'commonsText' }],
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'role',
              title: 'Role',
              type: 'string',
              initialValue: 'core',
              options: {
                list: [
                  { title: 'Core', value: 'core' },
                  { title: 'Optional', value: 'optional' },
                  { title: 'Extension', value: 'extension' },
                ],
              },
            }),
            defineField({
              name: 'presentationMode',
              title: 'Presentation Mode',
              type: 'string',
              initialValue: 'read_aloud',
              options: {
                list: [
                  { title: 'Read Aloud', value: 'read_aloud' },
                  { title: 'Child Reads', value: 'child_reads' },
                  { title: 'Reference Only', value: 'reference_only' },
                  { title: 'Memorisation', value: 'memorisation' },
                ],
              },
            }),
            defineField({ name: 'notes', title: 'Usage Notes', type: 'string' }),
          ],
          preview: {
            select: { title: 'text.title', subtitle: 'role' },
          },
        },
      ],
    }),
    defineField({
      name: 'duration',
      title: 'Duration (minutes)',
      type: 'object',
      fields: [
        { name: 'min', title: 'Min', type: 'number' },
        { name: 'max', title: 'Max', type: 'number' },
      ],
    }),
    defineField({
      name: 'setting',
      title: 'Setting',
      type: 'string',
      options: {
        list: [
          { title: 'Indoor', value: 'indoor' },
          { title: 'Outdoor', value: 'outdoor' },
          { title: 'Either', value: 'either' },
        ],
      },
    }),
    defineField({
      name: 'energyLevel',
      title: 'Energy Level',
      type: 'string',
      options: {
        list: [
          { title: 'Calm', value: 'calm' },
          { title: 'Moderate', value: 'moderate' },
          { title: 'Active', value: 'active' },
        ],
      },
    }),
    defineField({
      name: 'modality',
      title: 'Modality',
      type: 'string',
      options: {
        list: [
          { title: 'Kinesthetic', value: 'kinesthetic' },
          { title: 'Visual', value: 'visual' },
          { title: 'Auditory', value: 'auditory' },
          { title: 'Narrative', value: 'narrative' },
          { title: 'Social', value: 'social' },
        ],
      },
    }),
    defineField({
      name: 'observationPrompts',
      title: 'Observation Prompts',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'reflectionPrompts',
      title: 'Reflection Prompts',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'capabilityThreads',
      title: 'Capability Threads',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'capabilityThread' }] }],
    }),
    defineField({
      name: 'enabledBadges',
      title: 'Enabled Badges',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'badge' }] }],
    }),
    defineField({
      name: 'workbench',
      title: 'Workbench (parent-off addendum)',
      type: 'object',
      description:
        "Optional. A parent-off addendum: child returns alone to material the parent has already introduced. See the kindling repo's `design/workbench-specification.md`.",
      fields: [
        defineField({
          name: 'handOffFraming',
          title: 'Hand-off Framing',
          type: 'array',
          description:
            "The parent's closing line at the tail of the facilitated activity. Conversational, not a script. ~80 words max.",
          of: [{ type: 'block', styles: [{ title: 'Normal', value: 'normal' }] }],
          validation: (r) => r.required(),
        }),
        defineField({
          name: 'parentOffGuidance',
          title: 'Parent-Off Guidance',
          type: 'array',
          description:
            'What the parent does and explicitly does NOT do once the bench is the child\'s. Must include explicit "do not" language. ~120 words max.',
          of: [{ type: 'block', styles: [{ title: 'Normal', value: 'normal' }] }],
          validation: (r) => r.required(),
        }),
        defineField({
          name: 'whatTheBenchInvites',
          title: 'What the Bench Invites',
          type: 'text',
          description:
            'Descriptive of affordance, not a task list. 1–3 sentences. No duration or completion language.',
          validation: (r) => r.required().max(400),
        }),
        defineField({
          name: 'evidenceTrail',
          title: 'Evidence Trail',
          type: 'text',
          description:
            'What naturally accumulates that the parent can later notice. For HEU and passive evidence collection. 1–2 sentences.',
          validation: (r) => r.required().max(300),
        }),
        defineField({
          name: 'materialAssets',
          title: 'Material Assets at the Bench',
          type: 'array',
          description: 'Hearth-supplied assets that live at the workbench.',
          of: [{ type: 'reference', to: [{ type: 'asset' }] }],
          validation: (r) => r.required().min(1).max(8),
        }),
        defineField({
          name: 'childFacingSetupNotes',
          title: 'Child-Facing Setup Notes',
          type: 'text',
          description:
            'Where the bench lives, how materials are laid out. The parent reads this once when setting up.',
          validation: (r) => r.max(300),
        }),
        defineField({
          name: 'workbenchId',
          title: 'Workbench ID',
          type: 'string',
          description:
            "Must match a workbenches[].id declared on the parent pack. E.g., 'wb_roots_discovery'.",
          validation: (r) => r.required(),
        }),
        defineField({
          name: 'capabilityThreadsSecondary',
          title: 'Capability Threads (Secondary)',
          type: 'array',
          description:
            'Threads the workbench layer reinforces. EF7 (Self-Regulation & Persistence) is canonical.',
          of: [{ type: 'reference', to: [{ type: 'capabilityThread' }] }],
          validation: (r) => r.max(4),
        }),
      ],
    }),
    defineField({
      name: 'deliveryChannel',
      title: 'Delivery Channel',
      type: 'string',
      hidden: true,
      options: {
        list: [
          { title: 'Screen', value: 'screen' },
          { title: 'Audio', value: 'audio' },
          { title: 'Physical', value: 'physical' },
          { title: 'Cast', value: 'cast' },
          { title: 'Print', value: 'print' },
          { title: 'Journal', value: 'journal' },
        ],
      },
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'draft',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Published', value: 'published' },
        ],
      },
    }),
  ],
});
