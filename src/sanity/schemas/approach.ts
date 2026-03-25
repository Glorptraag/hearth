import { defineType, defineField } from 'sanity';

export const approach = defineType({
  name: 'approach',
  title: 'Approach',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({
      name: 'module',
      title: 'Module',
      type: 'reference',
      to: [{ type: 'module' }],
      validation: (r) => r.required(),
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
          { title: 'Exploratory', value: 'exploratory' },
        ],
      },
    }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({
      name: 'activities',
      title: 'Activities',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'activity' }] }],
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
