import { defineType, defineField } from 'sanity';

export const capabilityThread = defineType({
  name: 'capabilityThread',
  title: 'Capability Thread',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({
      name: 'domain',
      title: 'Domain',
      type: 'string',
      validation: (r) => r.required(),
      options: {
        list: [
          { title: 'English', value: 'english' },
          { title: 'Mathematics', value: 'mathematics' },
          { title: 'Science', value: 'science' },
          { title: 'HASS', value: 'hass' },
          { title: 'Arts', value: 'arts' },
          { title: 'Technologies', value: 'technologies' },
          { title: 'HPE', value: 'hpe' },
          { title: 'Languages', value: 'languages' },
        ],
      },
    }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({
      name: 'dlos',
      title: 'Developmental Learning Outcomes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', title: 'Title', type: 'string' },
            {
              name: 'tier',
              title: 'Tier',
              type: 'string',
              options: {
                list: [
                  { title: 'Emerging', value: 'emerging' },
                  { title: 'Developing', value: 'developing' },
                  { title: 'Demonstrating', value: 'demonstrating' },
                ],
              },
            },
            { name: 'description', title: 'Description', type: 'text' },
          ],
        },
      ],
    }),
    defineField({
      name: 'prerequisites',
      title: 'Prerequisites',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'capabilityThread' }] }],
    }),
    defineField({
      name: 'enables',
      title: 'Enables',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'capabilityThread' }] }],
    }),
    defineField({
      name: 'curriculumCodes',
      title: 'AC V9 Curriculum Codes',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
});
