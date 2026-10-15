import { defineType, defineField, defineArrayMember } from 'sanity';

/**
 * Site Copy — non-generative web copy, one document per SURFACE.
 *
 * Keys are owned by code (`src/lib/copy/defaults.ts`); values are owned here.
 * Editors swap wording in Studio and publish — no deploy. The app merges
 * published values over the code defaults, so a missing or empty entry can
 * never blank a screen: it simply falls back to the default.
 *
 * Document ids are deterministic (`siteCopy-<surface>`, HYPHEN not dot — a dot
 * in a Sanity _id makes the doc private to tokenless readers, and the server
 * copy fetch is tokenless). Seed/refresh with `npm run seed:copy`; detect drift
 * with `npm run copy:check`. Spec: docs/hearth-site-copy-system-v1.md.
 */
export const siteCopy = defineType({
  name: 'siteCopy',
  title: 'Site Copy',
  type: 'document',
  description:
    'Static web copy for one app surface. Keys come from code; edit the values and publish to swap wording without a deploy.',
  fields: [
    defineField({
      name: 'surface',
      title: 'Surface',
      type: 'string',
      readOnly: true,
      validation: (r) => r.required(),
      description: 'Code-owned namespace id (e.g. "landing"). Do not edit.',
    }),
    defineField({ name: 'title', title: 'Title', type: 'string', readOnly: true }),
    defineField({
      name: 'description',
      title: 'Where this copy appears',
      type: 'text',
      rows: 2,
      readOnly: true,
    }),
    defineField({
      name: 'entries',
      title: 'Entries',
      type: 'array',
      options: { sortable: false },
      of: [
        defineArrayMember({
          type: 'object',
          name: 'siteCopyEntry',
          title: 'Copy entry',
          fields: [
            defineField({
              name: 'key',
              title: 'Key',
              type: 'string',
              readOnly: true,
              validation: (r) =>
                r
                  .required()
                  .regex(/^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*$/, {
                    name: 'dotted key',
                    invert: false,
                  }),
            }),
            defineField({
              name: 'value',
              title: 'Value',
              type: 'text',
              rows: 3,
              validation: (r) => r.required(),
              description:
                'The wording shown to parents. Keep any {placeholders} exactly as they appear — the app fills them in.',
            }),
            defineField({
              name: 'note',
              title: 'Editor note',
              type: 'string',
              readOnly: true,
              description: 'Where this string shows and which placeholders it supports.',
            }),
          ],
          preview: {
            select: { title: 'key', subtitle: 'value' },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'surface' },
  },
});
