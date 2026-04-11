import { defineType, defineField } from 'sanity';

export const pedagogyFacilitationVocabulary = defineType({
  name: 'pedagogyFacilitationVocabulary',
  title: 'PKB: Facilitation Vocabulary',
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
      name: 'verbs',
      title: 'Verbs',
      type: 'array',
      description: 'Characteristic pedagogical verbs with meanings.',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'verb', title: 'Verb', type: 'string' },
            { name: 'meaning', title: 'Meaning', type: 'string' },
          ],
          preview: { select: { title: 'verb', subtitle: 'meaning' } },
        },
      ],
    }),
    defineField({
      name: 'characteristicRestraints',
      title: 'Characteristic Restraints',
      type: 'array',
      description: 'Things this tradition deliberately avoids doing.',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'microScripts',
      title: 'Micro-Scripts',
      type: 'array',
      description: 'Situation → what-to-say pairs.',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'situation', title: 'Situation', type: 'string' },
            { name: 'script', title: 'Script', type: 'text' },
          ],
          preview: { select: { title: 'situation', subtitle: 'script' } },
        },
      ],
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
    select: { title: 'framework.title' },
    prepare({ title }: { title?: string }) {
      return { title: `Facilitation Vocabulary — ${title ?? 'Unknown'}` };
    },
  },
});
