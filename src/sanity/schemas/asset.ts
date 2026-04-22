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
        ],
      },
    }),
    defineField({ name: 'file', title: 'File', type: 'file' }),
    defineField({ name: 'thumbnail', title: 'Thumbnail', type: 'image' }),
    defineField({ name: 'pageCount', title: 'Page Count', type: 'number' }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
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
          { title: 'All', value: 'all' },
        ],
      },
    }),
    defineField({
      name: 'license',
      title: 'License',
      type: 'string',
      validation: (r) => r.required(),
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
  ],
});
