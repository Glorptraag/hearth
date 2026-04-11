import { defineType, defineField } from 'sanity';

export const pedagogyContraindication = defineType({
  name: 'pedagogyContraindication',
  title: 'PKB: Contraindication',
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
      name: 'warnedAgainst',
      title: 'Warned Against',
      type: 'string',
      description: 'The practice this tradition warns against.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'traditionReasoning',
      title: 'Tradition Reasoning',
      type: 'text',
      description: 'Why this tradition warns against it.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
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
    select: { title: 'warnedAgainst', subtitle: 'framework.title' },
  },
});
