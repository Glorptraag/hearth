import { defineType, defineField } from 'sanity';

export const discreteLearningObjective = defineType({
  name: 'discreteLearningObjective',
  title: 'Discrete Learning Objective',
  type: 'document',
  fields: [
    defineField({
      name: 'thread',
      title: 'Capability Thread',
      type: 'reference',
      to: [{ type: 'capabilityThread' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'tier',
      title: 'Tier',
      type: 'string',
      validation: (r) => r.required(),
      options: {
        list: [
          { title: 'Emerging', value: 'emerging' },
          { title: 'Developing', value: 'developing' },
          { title: 'Demonstrating', value: 'demonstrating' },
        ],
      },
    }),
    defineField({
      name: 'descriptor',
      title: 'Descriptor',
      type: 'text',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'descriptor' } }),
    defineField({
      name: 'parentVersion',
      title: 'Parent Version',
      type: 'string',
      description: 'Optional reference (id) of the previous DLO version this revises.',
    }),
    defineField({
      name: 'badgeLevel',
      title: 'Badge Level',
      type: 'string',
      description: 'Tier at which this DLO contributes to badge eligibility.',
      options: {
        list: [
          { title: 'Starter', value: 'starter' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' },
        ],
      },
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'published',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Published', value: 'published' },
          { title: 'Archived', value: 'archived' },
        ],
      },
    }),
  ],
  preview: {
    select: { tier: 'tier', descriptor: 'descriptor', thread: 'thread.title' },
    prepare({ tier, descriptor, thread }) {
      return {
        title: descriptor ?? '(no descriptor)',
        subtitle: thread ? `${thread} · ${tier}` : tier,
      };
    },
  },
});
