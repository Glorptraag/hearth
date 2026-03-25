import { defineType, defineField } from 'sanity';

export const projectStage = defineType({
  name: 'projectStage',
  title: 'Project Stage',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({
      name: 'project',
      title: 'Project',
      type: 'reference',
      to: [{ type: 'project' }],
    }),
    defineField({
      name: 'stageNumber',
      title: 'Stage Number',
      type: 'number',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'instructions',
      title: 'Instructions',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'materials',
      title: 'Materials',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', title: 'Name', type: 'string' },
            { name: 'alternative', title: 'Alternative', type: 'string' },
            { name: 'required', title: 'Required', type: 'boolean', initialValue: true },
          ],
        },
      ],
    }),
    defineField({ name: 'estimatedDuration', title: 'Estimated Duration', type: 'string' }),
    defineField({ name: 'artifactDescription', title: 'Artifact Description', type: 'text' }),
    defineField({ name: 'dependsOn', title: 'Depends On', type: 'text' }),
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
