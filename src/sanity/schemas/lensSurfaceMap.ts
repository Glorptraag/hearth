import { defineType, defineField } from 'sanity';

export const lensSurfaceMap = defineType({
  name: 'lensSurfaceMap',
  title: 'Lens Surface Map',
  type: 'document',
  description:
    'Singleton mapping pedagogy lens bundle + methodology overlay fields to Module Experience surfaces. Edited without redeploy. Spec: docs/hearth-pedagogy-lens-bundle-v1.md §6, docs/hearth-methodology-overlay-bundle-v1.md §8.',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      initialValue: 'lens-surface-map',
      readOnly: true,
    }),
    defineField({
      name: 'mappings',
      title: 'Mappings',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'source',
              type: 'string',
              options: {
                list: [
                  { title: 'Pedagogy', value: 'pedagogy' },
                  { title: 'Methodology', value: 'methodology' },
                ],
              },
            },
            { name: 'fieldKey', type: 'string' },
            { name: 'surface', type: 'string' },
            { name: 'renderBehaviour', type: 'text', rows: 3 },
            { name: 'fallback', type: 'string' },
          ],
        },
      ],
    }),
  ],
});
