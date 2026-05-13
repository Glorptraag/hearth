import { defineType, defineField } from 'sanity';

// Capability Universe v2 — Strand (§3.4)
// Organisational layer between a thread's stage-band and its atomic capabilities.

const STAGE_BANDS = [
  { title: 'Foundational', value: 'foundational' },
  { title: 'Intermediate', value: 'intermediate' },
  { title: 'Advanced', value: 'advanced' },
  { title: 'Tertiary', value: 'tertiary' },
];

export const strand = defineType({
  name: 'strand',
  title: 'Strand',
  type: 'document',
  fields: [
    defineField({ name: 'strandId', title: 'Strand ID (slug)', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'thread',
      title: 'Thread',
      type: 'reference',
      to: [{ type: 'capabilityThread' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'stageBand',
      title: 'Stage band',
      type: 'string',
      validation: (r) => r.required(),
      options: { list: STAGE_BANDS },
    }),
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'introducedInVersion', title: 'Introduced in version', type: 'string', initialValue: '2.0.0' }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'active',
      options: { list: [{ title: 'Active', value: 'active' }, { title: 'Deprecated', value: 'deprecated' }] },
    }),
    defineField({ name: 'publishedInVersion', title: 'Published in version (locks structure once set)', type: 'string' }),
    defineField({ name: 'summary', title: 'Summary', type: 'text', rows: 2 }),
    defineField({ name: 'whatItDevelops', title: 'What it develops', type: 'text', rows: 4 }),
    defineField({
      name: 'atomicCapabilities',
      title: 'Atomic capabilities',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'atomicCapability' }] }],
    }),
    defineField({
      name: 'ordering',
      title: 'Ordering',
      type: 'string',
      initialValue: 'flexible',
      options: {
        list: [
          { title: 'Sequential — atoms must be acquired in order', value: 'sequential' },
          { title: 'Parallel — atoms develop alongside each other', value: 'parallel' },
          { title: 'Flexible — soft sequencing', value: 'flexible' },
        ],
      },
    }),
  ],
  preview: {
    select: { title: 'name', stage: 'stageBand', thread: 'thread.title' },
    prepare({ title, stage, thread }) {
      return { title, subtitle: `${stage} · ${thread ?? '—'}` };
    },
  },
});
