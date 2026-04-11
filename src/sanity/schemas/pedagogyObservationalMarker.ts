import { defineType, defineField } from 'sanity';

export const pedagogyObservationalMarker = defineType({
  name: 'pedagogyObservationalMarker',
  title: 'PKB: Observational Marker',
  type: 'document',
  fields: [
    defineField({
      name: 'framework',
      title: 'Framework',
      type: 'reference',
      to: [{ type: 'pedagogicalFramework' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'markerName',
      title: 'Marker Name',
      type: 'string',
      description: 'Short name for the observable signal (e.g. "Quality of narration").',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'whatItIndicates',
      title: 'What It Indicates',
      type: 'text',
      description: 'Why this tradition reads this signal as meaningful.',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'markersToLookFor',
      title: 'Markers to Look For',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Specific behavioural cues the parent should watch for.',
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'suggestedDraft',
      title: 'AI-Drafted Candidate',
      type: 'boolean',
      initialValue: true,
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
  preview: {
    select: { title: 'markerName', subtitle: 'framework.title' },
  },
});
