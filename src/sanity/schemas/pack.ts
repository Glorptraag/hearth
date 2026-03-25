import { defineType, defineField } from 'sanity';

const subjectList = [
  { title: 'English', value: 'english' },
  { title: 'Mathematics', value: 'mathematics' },
  { title: 'Science', value: 'science' },
  { title: 'HASS', value: 'hass' },
  { title: 'Arts', value: 'arts' },
  { title: 'Technologies', value: 'technologies' },
  { title: 'HPE', value: 'hpe' },
  { title: 'Languages', value: 'languages' },
];

export const pack = defineType({
  name: 'pack',
  title: 'Pack',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({
      name: 'intro',
      title: 'Introduction',
      type: 'object',
      fields: [
        { name: 'title', title: 'Intro Title', type: 'string' },
        {
          name: 'body',
          title: 'Body',
          type: 'array',
          of: [{ type: 'block' }],
        },
        {
          name: 'keyPoints',
          title: 'Key Points',
          type: 'array',
          of: [{ type: 'string' }],
        },
        {
          name: 'furtherReading',
          title: 'Further Reading',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                { name: 'title', title: 'Title', type: 'string' },
                { name: 'url', title: 'URL', type: 'url' },
              ],
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'modules',
      title: 'Modules',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'module' }] }],
    }),
    defineField({
      name: 'badges',
      title: 'Badges',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'badge' }] }],
    }),
    defineField({
      name: 'projects',
      title: 'Projects',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'project' }] }],
    }),
    defineField({
      name: 'ageRange',
      title: 'Age Range',
      type: 'object',
      fields: [
        { name: 'min', title: 'Min Age', type: 'number' },
        { name: 'max', title: 'Max Age', type: 'number' },
      ],
    }),
    defineField({
      name: 'subjects',
      title: 'Subjects',
      type: 'array',
      of: [{ type: 'string' }],
      options: { list: subjectList },
    }),
    defineField({ name: 'termWeeks', title: 'Term Weeks', type: 'number' }),
    defineField({ name: 'moduleCount', title: 'Module Count (denormalised)', type: 'number', readOnly: true }),
    defineField({ name: 'totalActivities', title: 'Total Activities (denormalised)', type: 'number', readOnly: true }),
    defineField({
      name: 'worldview',
      title: 'Worldview',
      type: 'string',
      options: {
        list: [
          { title: 'Christian Classical', value: 'christian-classical' },
          { title: 'Secular', value: 'secular' },
          { title: 'Neutral', value: 'neutral' },
        ],
      },
    }),
    defineField({
      name: 'availability',
      title: 'Availability',
      type: 'string',
      options: {
        list: [
          { title: 'Included', value: 'included' },
          { title: 'Premium', value: 'premium' },
        ],
      },
    }),
    defineField({
      name: 'stripePriceId',
      title: 'Stripe Price ID',
      type: 'string',
      hidden: ({ document }) => document?.availability !== 'premium',
    }),
    defineField({ name: 'creator', title: 'Creator', type: 'string' }),
    defineField({ name: 'version', title: 'Version', type: 'string', initialValue: '1.0.0' }),
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
