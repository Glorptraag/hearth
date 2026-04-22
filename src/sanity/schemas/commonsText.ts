import { defineType, defineField } from 'sanity';

export const commonsText = defineType({
  name: 'commonsText',
  title: 'Commons Text',
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
          { title: 'Fable', value: 'fable' },
          { title: 'Fairy Tale', value: 'fairy_tale' },
          { title: 'Folk Tale', value: 'folk_tale' },
          { title: 'Scripture', value: 'scripture' },
          { title: 'Parable', value: 'parable' },
          { title: 'Psalm', value: 'psalm' },
          { title: 'Proverb', value: 'proverb' },
          { title: 'Poem', value: 'poem' },
          { title: 'Nursery Rhyme', value: 'nursery_rhyme' },
          { title: 'Myth', value: 'myth' },
          { title: 'Primary Source', value: 'primary_source' },
          { title: 'Story', value: 'story' },
        ],
      },
    }),
    defineField({ name: 'tradition', title: 'Tradition', type: 'string', validation: (r) => r.required(), description: 'e.g. aesop, grimm, bible_kjv, greek_myth' }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'The canonical text',
    }),
    defineField({
      name: 'shortBody',
      title: 'Short Body',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Optional condensed version for younger ages',
    }),
    defineField({
      name: 'readAloudVersion',
      title: 'Read Aloud Version',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Optimised for parent reading aloud — pacing notes, gloss for archaic words',
    }),
    defineField({ name: 'estimatedReadAloudMinutes', title: 'Estimated Read Aloud (minutes)', type: 'number' }),
    defineField({
      name: 'length',
      title: 'Length',
      type: 'string',
      options: {
        list: [
          { title: 'Micro', value: 'micro' },
          { title: 'Short', value: 'short' },
          { title: 'Medium', value: 'medium' },
          { title: 'Long', value: 'long' },
        ],
      },
    }),
    defineField({
      name: 'readingLevel',
      title: 'Reading Level',
      type: 'string',
      options: {
        list: [
          { title: '5–7', value: '5-7' },
          { title: '7–9', value: '7-9' },
          { title: '9–12', value: '9-12' },
          { title: '12–15', value: '12-15' },
        ],
      },
    }),
    defineField({
      name: 'themes',
      title: 'Themes',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({ name: 'moralOrLesson', title: 'Moral or Lesson', type: 'text' }),
    defineField({ name: 'source', title: 'Source', type: 'text', description: 'e.g. "Aesop, retold by Joseph Jacobs, 1894"' }),
    defineField({ name: 'sourceUrl', title: 'Source URL', type: 'url' }),
    defineField({
      name: 'license',
      title: 'License',
      type: 'string',
      validation: (r) => r.required(),
      options: {
        list: [
          { title: 'Public Domain', value: 'public_domain' },
          { title: 'CC BY', value: 'cc_by' },
          { title: 'CC BY-SA', value: 'cc_by_sa' },
        ],
      },
    }),
    defineField({
      name: 'relatedAssets',
      title: 'Related Assets',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'asset' }] }],
    }),
    defineField({
      name: 'relatedTexts',
      title: 'Related Texts',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'commonsText' }] }],
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
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
