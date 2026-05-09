import { defineType, defineField } from 'sanity';
import { PRACTICE_KEYS } from './methodologyOverlay';

export const practice = defineType({
  name: 'practice',
  title: 'Practice',
  type: 'document',
  description:
    'One of the twelve methodology practices. User-facing copy says "practice"; architecture-internal references say "methodology". Spec: docs/hearth-methodology-overlay-bundle-v1.md.',
  fields: [
    defineField({
      name: 'key',
      title: 'Practice Key',
      type: 'string',
      validation: (r) => r.required(),
      options: { list: [...PRACTICE_KEYS] },
    }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'practiceVocabulary',
      title: 'Practice Vocabulary',
      description:
        'Natural-language terms a practitioner of this practice uses. E.g. for narration: ["tell back", "in their own words", "after the reading"].',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'anchorPedagogies',
      title: 'Anchor Pedagogies',
      description: 'Pedagogies historically anchoring this practice. Used to filter corpus retrieval.',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'pedagogicalFramework' }] }],
    }),
    defineField({
      name: 'themeKeywords',
      title: 'Theme Keywords',
      description:
        'Keywords matched against pedagogy_knowledge_chunks.metadata.themes for practice-relevance retrieval filtering.',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'key' } },
});
