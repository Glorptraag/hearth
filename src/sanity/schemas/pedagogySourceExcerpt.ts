import { defineType, defineField } from 'sanity';

export const pedagogySourceExcerpt = defineType({
  name: 'pedagogySourceExcerpt',
  title: 'PKB: Source Excerpt',
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
      name: 'text',
      title: 'Text',
      type: 'text',
      description: 'Verbatim quotation or close paraphrase. This field alone is embedded.',
      validation: (r) => r.required().min(20),
    }),
    defineField({
      name: 'isParaphrase',
      title: 'Is Paraphrase?',
      type: 'boolean',
      initialValue: false,
      description: 'True = paraphrase. False = direct quotation.',
    }),
    defineField({
      name: 'sourceAttribution',
      title: 'Source Attribution',
      type: 'object',
      validation: (r) => r.required(),
      fields: [
        { name: 'author', title: 'Author', type: 'string' },
        { name: 'title', title: 'Work Title', type: 'string' },
        { name: 'year', title: 'Year', type: 'string' },
        { name: 'pageOrChapter', title: 'Page / Chapter', type: 'string' },
      ],
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
      name: 'suggestedDraft',
      title: 'AI-Drafted Candidate',
      type: 'boolean',
      initialValue: true,
      description: 'True = awaiting human review. False = confirmed. Only confirmed docs are embedded.',
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
    select: { title: 'text', subtitle: 'framework.title' },
    prepare({ title, subtitle }: { title?: string; subtitle?: string }) {
      return { title: title?.slice(0, 80) ?? 'Untitled', subtitle };
    },
  },
});
