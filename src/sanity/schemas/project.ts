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

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({
      name: 'stages',
      title: 'Stages',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'projectStage' }] }],
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
    defineField({ name: 'duration', title: 'Duration (e.g. "3-6 weeks")', type: 'string' }),
    defineField({
      name: 'capabilityThreads',
      title: 'Capability Threads',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'capabilityThread' }] }],
    }),
    defineField({
      name: 'badges',
      title: 'Badges',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'badge' }] }],
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
