import { defineType, defineField } from 'sanity';

export const pedagogyPracticePattern = defineType({
  name: 'pedagogyPracticePattern',
  title: 'PKB: Practice Pattern',
  type: 'document',
  fields: [
    defineField({
      name: 'framework',
      title: 'Framework',
      type: 'reference',
      to: [{ type: 'pedagogicalFramework' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'triggerTitle',
      title: 'Trigger Title',
      type: 'string',
      description: 'Short label for the situation (e.g. "Child resists lesson").',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'triggerContext',
      title: 'Trigger Context',
      type: 'text',
      description: '1–3 sentence description of the triggering situation.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'traditionResponse',
      title: 'Tradition Response',
      type: 'text',
      description: 'How this tradition characteristically responds (200–400 words).',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'antiPattern',
      title: 'Anti-Pattern',
      type: 'text',
      description: 'What the tradition would NOT do in this situation.',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'ageRange',
      title: 'Age Range',
      type: 'object',
      description: 'Optional. Age band this entry is most relevant to (inclusive). Retrieval rerank boost.',
      fields: [
        { name: 'min', title: 'Min Age', type: 'number', validation: (r) => r.min(0).max(18) },
        { name: 'max', title: 'Max Age', type: 'number', validation: (r) => r.min(0).max(18) },
      ],
    }),
    defineField({
      name: 'capabilityThreads',
      title: 'Capability Threads',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'Optional. Canonical capability thread codes (L1…C7) this entry maps to. Retrieval rerank boost.',
    }),
    defineField({
      name: 'suggestedDraft',
      title: 'AI-Drafted Candidate',
      type: 'boolean',
      initialValue: true,
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
  preview: {
    select: { title: 'triggerTitle', subtitle: 'framework.title' },
  },
});
