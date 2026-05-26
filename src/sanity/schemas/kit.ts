import { defineType, defineField } from 'sanity';

export const kit = defineType({
  name: 'kit',
  title: 'Kit',
  type: 'document',
  description:
    'Physical kit a pack/module can ship with. Referenced from pack.materials.kitRef and module.materials.kitRef when materials.mode === "ships-with".',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({
      name: 'contents',
      title: 'Contents',
      description: 'What ships inside the kit. Shown in detail views as the materials description.',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'priceAUD',
      title: 'Price (AUD)',
      type: 'number',
      description: 'Display price. Stripe is the source of truth for the actual charge.',
    }),
    defineField({
      name: 'stripePriceId',
      title: 'Stripe Price ID',
      type: 'string',
      description: 'Wires future purchase flow; not used at runtime in v1.',
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
