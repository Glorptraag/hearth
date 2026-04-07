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
