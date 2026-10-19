import { defineType, defineField } from 'sanity';

export const shelfResource = defineType({
  name: 'shelfResource',
  title: 'Shelf Resource',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'publisher', title: 'Publisher', type: 'string' }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      initialValue: 'curriculum',
      options: {
        list: [
          { title: 'Curriculum', value: 'curriculum' },
          { title: 'Universal', value: 'universal' },
        ],
      },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'aliases',
      title: 'Aliases',
      description: 'Strings likely printed on the pages (title variants, series names, ISBN-adjacent text).',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'lessonPattern',
      title: 'Lesson Pattern',
      description: 'Regex string capturing a lesson or chapter number in group 1 (e.g. "Lesson\\s+(\\d+)").',
      type: 'string',
    }),
    defineField({
      name: 'levels',
      title: 'Levels',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'shelfResourceLevel',
          fields: [
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'aliases',
              title: 'Aliases',
              type: 'array',
              of: [{ type: 'string' }],
            }),
          ],
          preview: { select: { title: 'name' } },
        },
      ],
    }),
    defineField({
      name: 'ageBand',
      title: 'Age Band',
      type: 'object',
      fields: [
        { name: 'min', title: 'Min Age', type: 'number' },
        { name: 'max', title: 'Max Age', type: 'number' },
      ],
    }),
    defineField({
      name: 'isUniversal',
      title: 'Is Universal',
      description: 'Applies to any family regardless of curriculum choice.',
      type: 'boolean',
      initialValue: false,
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
  preview: { select: { title: 'title', subtitle: 'publisher' } },
});
