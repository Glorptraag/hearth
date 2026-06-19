import { defineType, defineField } from 'sanity';

export const asset = defineType({
  name: 'asset',
  title: 'Asset',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      validation: (r) => r.required(),
      options: {
        list: [
          { title: 'Template', value: 'template' },
          { title: 'Worksheet', value: 'worksheet' },
          { title: 'Reference', value: 'reference' },
          { title: 'Card Set', value: 'card_set' },
          { title: 'Handout', value: 'handout' },
          { title: 'Audio', value: 'audio' },
          { title: 'Manipulative', value: 'manipulative' },
          { title: 'Generated (image)', value: 'generated' },
        ],
      },
    }),
    // File is required for the file-based kinds. Generated-image assets (gen2
    // pipeline) carry an `image` instead, so file is not required when kind === 'generated'.
    defineField({
      name: 'file',
      title: 'File',
      type: 'file',
      hidden: ({ document }) => document?.kind === 'generated',
      validation: (r) =>
        r.custom((value, context) => {
          const doc = context.document as { kind?: string } | undefined;
          if (doc?.kind === 'generated') return true;
          return value ? true : 'File is required.';
        }),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Primary raster for image/generated assets (gen2 pipeline).',
      hidden: ({ document }) => document?.kind !== 'generated',
    }),
    defineField({ name: 'thumbnail', title: 'Thumbnail', type: 'image' }),
    defineField({ name: 'pageCount', title: 'Page Count', type: 'number', description: 'For PDFs — helps parents budget paper' }),
    defineField({ name: 'description', title: 'Description', type: 'text', description: 'What it is, when to print it' }),
    defineField({ name: 'printGuidance', title: 'Print Guidance', type: 'text', description: 'e.g. "Print A4 portrait, B&W friendly"' }),
    defineField({
      name: 'ageBand',
      title: 'Age Band',
      type: 'string',
      options: {
        list: [
          { title: '5–7', value: '5-7' },
          { title: '7–9', value: '7-9' },
          { title: '9–12', value: '9-12' },
          { title: '12–15', value: '12-15' },
          { title: 'All ages', value: 'all' },
        ],
      },
    }),
    defineField({
      name: 'license',
      title: 'License',
      type: 'string',
      options: {
        list: [
          { title: 'Hearth Proprietary', value: 'hearth_proprietary' },
          { title: 'CC BY', value: 'cc_by' },
          { title: 'CC BY-SA', value: 'cc_by_sa' },
          { title: 'Public Domain', value: 'public_domain' },
          { title: 'Commissioned', value: 'commissioned' },
          { title: 'Fair Use Reference', value: 'fair_use_reference' },
        ],
      },
    }),
    defineField({ name: 'source', title: 'Source', type: 'text', description: 'Attribution string if applicable' }),
    defineField({ name: 'sourceUrl', title: 'Source URL', type: 'url' }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'relatedCommonsTexts',
      title: 'Related Commons Texts',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'commonsText' }] }],
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
    defineField({ name: 'version', title: 'Version', type: 'number', initialValue: 1 }),
    // ── Generated-image fields (gen2 worksheet pipeline; kind === 'generated') ──
    // All optional — only populated for generated assets. License for generated
    // assets is 'hearth_proprietary' (Hearth-owned original work). _id convention:
    // asset.generated.{packId}.{slot}. See Kindler Advance/worksheets gen2 pipeline.
    defineField({
      name: 'register',
      title: 'Register',
      type: 'string',
      options: { list: ['painted', 'paper', 'line'] },
      hidden: ({ document }) => document?.kind !== 'generated',
    }),
    defineField({
      name: 'skin',
      title: 'Skin',
      type: 'string',
      options: { list: ['playground', 'meadow', 'blocks'] },
      hidden: ({ document }) => document?.kind !== 'generated',
    }),
    defineField({ name: 'packId', title: 'Pack Id', type: 'string', hidden: ({ document }) => document?.kind !== 'generated' }),
    defineField({ name: 'slot', title: 'Slot', type: 'string', hidden: ({ document }) => document?.kind !== 'generated' }),
    defineField({
      name: 'provenance',
      title: 'Provenance',
      type: 'object',
      description: 'Reproducible + auditable generation record (gen2 §7).',
      hidden: ({ document }) => document?.kind !== 'generated',
      fields: [
        defineField({ name: 'model', title: 'Model', type: 'string' }),
        defineField({ name: 'seed', title: 'Seed', type: 'string' }),
        defineField({ name: 'northStar', title: 'North-star ref', type: 'string' }),
        defineField({ name: 'creamHex', title: 'Cream hex', type: 'string' }),
        defineField({ name: 'generatedAt', title: 'Generated at', type: 'string' }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'kind' },
  },
});
