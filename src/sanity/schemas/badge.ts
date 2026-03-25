import { defineType, defineField } from 'sanity';

export const badge = defineType({
  name: 'badge',
  title: 'Badge',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'emoji', title: 'Emoji', type: 'string' }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'criteriaSummary', title: 'Criteria Summary', type: 'text' }),
    defineField({
      name: 'capabilityThreads',
      title: 'Capability Threads',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'capabilityThread' }] }],
    }),
    defineField({
      name: 'observationThreshold',
      title: 'Observation Threshold',
      type: 'number',
      initialValue: 3,
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
          { title: 'Archived', value: 'archived' },
        ],
      },
    }),
  ],
});
