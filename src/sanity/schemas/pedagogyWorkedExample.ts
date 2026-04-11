import { defineType, defineField } from 'sanity';

export const pedagogyWorkedExample = defineType({
  name: 'pedagogyWorkedExample',
  title: 'PKB: Worked Example',
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
      name: 'scenario',
      title: 'Scenario',
      type: 'text',
      description: 'Composite Logger entry or learning situation (as the parent wrote it).',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'interpretationInTraditionVoice',
      title: 'Interpretation in Tradition Voice',
      type: 'text',
      description: 'How this tradition would read, enrich, or respond to that scenario.',
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
    select: { title: 'scenario', subtitle: 'framework.title' },
    prepare({ title, subtitle }: { title?: string; subtitle?: string }) {
      return { title: title?.slice(0, 80) ?? 'Untitled', subtitle };
    },
  },
});
