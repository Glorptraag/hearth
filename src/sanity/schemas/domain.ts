import { defineType, defineField } from 'sanity';

// Capability Universe v2 — Domain (§3.2)
// 15 canonical domains organised under 6 super-domains. Append-only after publication (D12).

export const domain = defineType({
  name: 'capabilityDomain',
  title: 'Capability Domain',
  type: 'document',
  fields: [
    defineField({ name: 'domainId', title: 'Domain ID (slug)', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'numericId', title: 'Numeric ID (1–15)', type: 'number', validation: (r) => r.required().min(1) }),
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'shortName', title: 'Short name', type: 'string' }),
    defineField({
      name: 'superDomain',
      title: 'Super-domain',
      type: 'string',
      validation: (r) => r.required(),
      options: {
        list: [
          { title: 'Foundations', value: 'foundations' },
          { title: 'Cultural Inheritance', value: 'cultural-inheritance' },
          { title: 'Classical Disciplines', value: 'classical-disciplines' },
          { title: 'Aesthetic Expression', value: 'aesthetic-expression' },
          { title: 'Practical & Vocational', value: 'practical-vocational' },
          { title: 'Human Formation', value: 'human-formation' },
        ],
      },
    }),
    defineField({ name: 'introducedInVersion', title: 'Introduced in version', type: 'string', initialValue: '2.0.0' }),
    defineField({ name: 'authoredBy', title: 'Authored by', type: 'string' }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'active',
      options: { list: [{ title: 'Active', value: 'active' }, { title: 'Deprecated', value: 'deprecated' }] },
    }),
    defineField({ name: 'deprecationReplacement', title: 'Deprecation replacement (domain id)', type: 'string' }),
    defineField({ name: 'summary', title: 'Summary', type: 'text', rows: 3 }),
    defineField({ name: 'whatItIsNot', title: 'What it is NOT', type: 'text', rows: 3 }),
    defineField({ name: 'exampleObservations', title: 'Example observations', type: 'array', of: [{ type: 'string' }] }),
    defineField({ name: 'iconKey', title: 'Icon key', type: 'string' }),
    defineField({ name: 'colourToken', title: 'Colour token', type: 'string' }),
    defineField({
      name: 'constellationRegion',
      title: 'Constellation region (polar coords)',
      type: 'object',
      fields: [
        { name: 'angularStart', title: 'Angular start (deg)', type: 'number' },
        { name: 'angularEnd', title: 'Angular end (deg)', type: 'number' },
        { name: 'radialMin', title: 'Radial min (0–1)', type: 'number' },
        { name: 'radialMax', title: 'Radial max (0–1)', type: 'number' },
      ],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'superDomain', num: 'numericId' },
    prepare({ title, subtitle, num }) {
      return { title: `${num}. ${title}`, subtitle };
    },
  },
});
