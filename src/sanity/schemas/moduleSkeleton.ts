import { defineField, defineType } from 'sanity';

export const moduleSkeleton = defineType({
  name: 'moduleSkeleton',
  title: 'Module Skeleton',
  type: 'document',
  fields: [
    defineField({
      name: 'skeletonId',
      title: 'Skeleton ID',
      type: 'string',
      description: 'e.g. M5-developing-cooking',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'threadId',
      title: 'Capability Thread ID',
      type: 'string',
      description: 'e.g. M5 (null for domain-generic skeletons)',
    }),
    defineField({
      name: 'domain',
      title: 'Domain',
      type: 'string',
      options: {
        list: [
          { title: 'Mathematical', value: 'mathematical' },
          { title: 'Language', value: 'language' },
          { title: 'Scientific', value: 'scientific' },
          { title: 'Creative', value: 'creative' },
          { title: 'Executive Function', value: 'executive_function' },
          { title: 'Physical', value: 'physical' },
          { title: 'Social-Emotional', value: 'social_emotional' },
          { title: 'Digital', value: 'digital' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'targetTier',
      title: 'Target Tier',
      type: 'string',
      options: {
        list: [
          { title: 'Emerging', value: 'emerging' },
          { title: 'Developing', value: 'developing' },
          { title: 'Demonstrating', value: 'demonstrating' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'activityPreference',
      title: 'Activity Preference',
      type: 'string',
      options: {
        list: [
          { title: 'Outdoors / Nature', value: 'outdoors' },
          { title: 'Art / Craft', value: 'art' },
          { title: 'Books / Reading', value: 'books' },
          { title: 'Games / Puzzles', value: 'games' },
          { title: 'Cooking / Baking', value: 'cooking' },
          { title: 'Experiments / Science', value: 'experiments' },
          { title: 'Active / Physical', value: 'active' },
          { title: 'Discussion / Storytelling', value: 'discussion' },
          { title: 'Any', value: 'any' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'confidence',
      title: 'Confidence Level',
      type: 'string',
      options: {
        list: [
          { title: 'Curated (expert-authored)', value: 'curated' },
          { title: 'Domain-generic', value: 'domain-generic' },
          { title: 'AI-generated', value: 'generated' },
        ],
      },
      initialValue: 'curated',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'suggestedUnderstanding',
      title: 'Suggested Understanding',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'suggestedSteps',
      title: 'Suggested Steps',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', type: 'string', title: 'Step Title' },
            { name: 'instructions', type: 'text', title: 'Instructions' },
            { name: 'observationHint', type: 'string', title: 'Observation Hint' },
          ],
        },
      ],
    }),
    defineField({
      name: 'suggestedMaterials',
      title: 'Suggested Materials',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', type: 'string', title: 'Material Name' },
            { name: 'isCore', type: 'boolean', title: 'Required?', initialValue: true },
          ],
        },
      ],
    }),
    defineField({
      name: 'indicatorsFocused',
      title: 'Capability Indicators Focused',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'estimatedDuration',
      title: 'Estimated Duration (minutes)',
      type: 'number',
    }),
    defineField({
      name: 'setting',
      title: 'Setting',
      type: 'string',
      options: {
        list: [
          { title: 'Indoor', value: 'indoor' },
          { title: 'Outdoor', value: 'outdoor' },
          { title: 'Either', value: 'either' },
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'skeletonId',
    },
  },
});
