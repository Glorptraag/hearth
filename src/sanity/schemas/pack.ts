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
      name: 'assetCounts',
      title: 'Asset Counts (denormalised)',
      type: 'object',
      readOnly: true,
      description: 'Computed at import time by walking activities → assets',
      fields: [
        { name: 'total', title: 'Total', type: 'number' },
        { name: 'template', title: 'Templates', type: 'number' },
        { name: 'worksheet', title: 'Worksheets', type: 'number' },
        { name: 'reference', title: 'References', type: 'number' },
        { name: 'card_set', title: 'Card Sets', type: 'number' },
        { name: 'handout', title: 'Handouts', type: 'number' },
        { name: 'audio', title: 'Audio', type: 'number' },
        { name: 'manipulative', title: 'Manipulatives', type: 'number' },
      ],
    }),
    defineField({ name: 'commonsTextCount', title: 'Commons Text Count (denormalised)', type: 'number', readOnly: true }),
    defineField({
      name: 'workbenches',
      title: 'Workbenches',
      type: 'array',
      description:
        'Optional. Pack-level controlled list of workbenches. Activities reference these by id via activity.workbench.workbenchId.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'id',
              title: 'ID',
              type: 'string',
              description: "Stable identifier. E.g., 'wb_roots_discovery'.",
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'name',
              title: 'Name',
              type: 'string',
              description: 'Human-readable name shown in admin views.',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'consolidatesPaths',
              title: 'Consolidates Paths',
              type: 'array',
              of: [{ type: 'string' }],
            }),
            defineField({
              name: 'physicalForm',
              title: 'Physical Form',
              type: 'text',
              description: 'Brief description for parent setup.',
            }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'id' },
          },
        },
      ],
    }),
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
    defineField({
      name: 'creatorType',
      title: 'Creator Type',
      type: 'string',
      options: {
        list: [
          { title: 'Content Team', value: 'content-team' },
          { title: 'Educator', value: 'educator' },
          { title: 'Parent', value: 'parent' },
        ],
      },
    }),
    defineField({ name: 'version', title: 'Version', type: 'string', initialValue: '1.0.0' }),
    defineField({
      name: 'printables',
      title: 'Printables',
      description:
        'Surfaces the "this pack includes printables" indicator on cards and detail views. Child modules inherit when their own printables field is unset.',
      type: 'object',
      fields: [
        defineField({
          name: 'available',
          title: 'Available',
          type: 'boolean',
          initialValue: false,
        }),
        defineField({
          name: 'count',
          title: 'Printable Count',
          description: 'Display hint only. Detail views show "N printable worksheets".',
          type: 'number',
        }),
      ],
    }),
    defineField({
      name: 'materials',
      title: 'Materials',
      description:
        'Surfaces the materials indicator. "ships-with" requires kitRef; "required" optionally takes a description listing what the family needs to source. Child modules inherit when their own materials field is unset or mode === "none".',
      type: 'object',
      fields: [
        defineField({
          name: 'mode',
          title: 'Mode',
          type: 'string',
          initialValue: 'none',
          options: {
            list: [
              { title: 'None — no special materials', value: 'none' },
              { title: 'Required — family sources themselves', value: 'required' },
              { title: 'Ships with kit', value: 'ships-with' },
            ],
          },
        }),
        defineField({
          name: 'description',
          title: 'Description',
          description: 'Plain-language list shown for required materials.',
          type: 'text',
          hidden: ({ parent }) => parent?.mode !== 'required',
        }),
        defineField({
          name: 'kitRef',
          title: 'Kit',
          type: 'reference',
          to: [{ type: 'kit' }],
          hidden: ({ parent }) => parent?.mode !== 'ships-with',
        }),
        defineField({
          name: 'kitPriceAUD',
          title: 'Kit Price (AUD, denormalised)',
          description: 'Optional override of kit.priceAUD for display.',
          type: 'number',
          hidden: ({ parent }) => parent?.mode !== 'ships-with',
        }),
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
          { title: 'Archived', value: 'archived' },
        ],
      },
    }),
  ],
});
