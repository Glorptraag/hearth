import { defineType, defineField } from 'sanity';

export const pedagogyOverlay = defineType({
  name: 'pedagogyOverlay',
  title: 'Pedagogy Overlay',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string' }),
    defineField({
      name: 'activity',
      title: 'Activity',
      type: 'reference',
      to: [{ type: 'activity' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'framework',
      title: 'Framework',
      type: 'string',
      validation: (r) => r.required(),
      options: {
        list: [
          { title: 'Charlotte Mason', value: 'charlotte_mason' },
          { title: 'Classical', value: 'classical' },
          { title: 'Montessori', value: 'montessori' },
          { title: 'Waldorf / Steiner', value: 'waldorf_steiner' },
          { title: 'Unschooling', value: 'unschooling' },
          { title: 'Reggio Emilia', value: 'reggio' },
          { title: 'Eclectic', value: 'eclectic' },
        ],
      },
    }),
    defineField({
      name: 'lens',
      title: 'Lens',
      type: 'object',
      fields: [
        { name: 'perspective', title: 'Perspective', type: 'text' },
        { name: 'facilitatorTips', title: 'Facilitator Tips', type: 'text' },
        { name: 'languageFrame', title: 'Language Frame', type: 'text' },
        { name: 'watchFor', title: 'Watch For', type: 'text' },
      ],
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
