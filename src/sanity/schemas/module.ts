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

export const module = defineType({
  name: 'module',
  title: 'Module',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({
      name: 'targetUnderstanding',
      title: 'Target Understanding',
      type: 'text',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'understandingIndicators',
      title: 'Understanding Indicators',
      type: 'object',
      fields: [
        { name: 'emerging', title: 'Emerging', type: 'text' },
        { name: 'developing', title: 'Developing', type: 'text' },
        { name: 'demonstrating', title: 'Demonstrating', type: 'text' },
      ],
    }),
    defineField({
      name: 'approaches',
      title: 'Approaches',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'approach' }] }],
    }),
    defineField({
      name: 'subjects',
      title: 'Subjects',
      type: 'array',
      of: [{ type: 'string' }],
      options: { list: subjectList },
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
      name: 'duration',
      title: 'Duration (minutes total)',
      type: 'object',
      fields: [
        { name: 'min', title: 'Min', type: 'number' },
        { name: 'max', title: 'Max', type: 'number' },
      ],
    }),
    defineField({
      name: 'badges',
      title: 'Badges',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'badge' }] }],
    }),
    defineField({
      name: 'capabilityThreads',
      title: 'Capability Threads',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'capabilityThread' }] }],
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
