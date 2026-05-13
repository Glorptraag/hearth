import { defineType, defineField } from 'sanity';

// Capability Universe v2 — Prerequisite edge (§3.6)
// Edges attach at exactly one of: stage-band-to-stage-band OR atomic-to-atomic (D6).
// Thread-to-thread edges are computed unions and not stored here.
// Four edge types: foundational | concurrent | alternative | enrichment (D7).

const STAGE_BANDS = [
  { title: 'Foundational', value: 'foundational' },
  { title: 'Intermediate', value: 'intermediate' },
  { title: 'Advanced', value: 'advanced' },
  { title: 'Tertiary', value: 'tertiary' },
];

export const prerequisiteEdge = defineType({
  name: 'prerequisiteEdge',
  title: 'Prerequisite Edge',
  type: 'document',
  fields: [
    defineField({ name: 'edgeId', title: 'Edge ID (slug)', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'edgeType',
      title: 'Edge type',
      type: 'string',
      validation: (r) => r.required(),
      options: {
        list: [
          { title: 'Foundational (hard prerequisite)', value: 'foundational' },
          { title: 'Concurrent (develops alongside)', value: 'concurrent' },
          { title: 'Alternative (one of several entry points)', value: 'alternative' },
          { title: 'Enrichment (deepens without unlocking)', value: 'enrichment' },
        ],
      },
    }),

    // Stage-band-to-stage-band variant
    defineField({ name: 'fromThread', title: 'From thread', type: 'reference', to: [{ type: 'capabilityThread' }] }),
    defineField({ name: 'fromStageBand', title: 'From stage band', type: 'string', options: { list: STAGE_BANDS } }),
    defineField({ name: 'toThread', title: 'To thread', type: 'reference', to: [{ type: 'capabilityThread' }] }),
    defineField({ name: 'toStageBand', title: 'To stage band', type: 'string', options: { list: STAGE_BANDS } }),

    // Atomic-to-atomic variant
    defineField({ name: 'fromAtomic', title: 'From atomic', type: 'reference', to: [{ type: 'atomicCapability' }] }),
    defineField({ name: 'toAtomic', title: 'To atomic', type: 'reference', to: [{ type: 'atomicCapability' }] }),

    defineField({ name: 'rationale', title: 'Rationale (required — no silent edges)', type: 'text', rows: 3, validation: (r) => r.required() }),
    defineField({
      name: 'strength',
      title: 'Strength',
      type: 'string',
      initialValue: 'soft',
      options: {
        list: [
          { title: 'Hard (locks until source meets threshold)', value: 'hard' },
          { title: 'Soft (surfaces as ghost; does not lock)', value: 'soft' },
        ],
      },
    }),
    defineField({ name: 'introducedInVersion', title: 'Introduced in version', type: 'string', initialValue: '2.0.0' }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'active',
      options: { list: [{ title: 'Active', value: 'active' }, { title: 'Deprecated', value: 'deprecated' }] },
    }),
  ],
  preview: {
    select: { type: 'edgeType', strength: 'strength', rationale: 'rationale' },
    prepare({ type, strength, rationale }) {
      return { title: `${type} (${strength})`, subtitle: rationale };
    },
  },
});
