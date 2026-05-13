import { defineType, defineField } from 'sanity';

export const bannedPhraseSet = defineType({
  name: 'bannedPhraseSet',
  title: 'Banned Phrase Set',
  type: 'document',
  description:
    'Singleton banned-phrase list shared across Pedagogy Lens Bundle, Methodology Overlay, Logger reflection prompts, and UC6 question overlays. Single source of truth. Phrases authored by content team — do not auto-generate.',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      initialValue: 'banned-phrase-set',
      readOnly: true,
    }),
    defineField({
      name: 'phrases',
      title: 'Banned Phrases',
      description: 'Case-insensitive substrings rejected during bundle/overlay validation.',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'phrase', type: 'string', validation: (r) => r.required() },
            { name: 'rationale', type: 'string' },
          ],
        },
      ],
    }),
  ],
});
