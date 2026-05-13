import { defineType, defineField } from 'sanity';

// Capability Universe v2 — Atomic capability (§3.5)
// Smallest grain of capability the Universe registers. Append-only after publication (D3).
// Indicators can be added but never removed.

const STAGE_BANDS = [
  { title: 'Foundational', value: 'foundational' },
  { title: 'Intermediate', value: 'intermediate' },
  { title: 'Advanced', value: 'advanced' },
  { title: 'Tertiary', value: 'tertiary' },
];

const TIERS = [
  { title: 'Emerging', value: 'emerging' },
  { title: 'Developing', value: 'developing' },
  { title: 'Demonstrating', value: 'demonstrating' },
];

const REGULATORY_FRAMEWORKS = [
  { title: 'AC v9 — QLD', value: 'ac-v9-qld' },
  { title: 'AC v9 — NSW', value: 'ac-v9-nsw' },
  { title: 'AC v9 — VIC', value: 'ac-v9-vic' },
  { title: 'AC v9 — WA', value: 'ac-v9-wa' },
  { title: 'AC v9 — SA', value: 'ac-v9-sa' },
  { title: 'AC v9 — TAS', value: 'ac-v9-tas' },
  { title: 'AC v9 — ACT', value: 'ac-v9-act' },
  { title: 'AC v9 — NT', value: 'ac-v9-nt' },
  { title: 'US Common Core', value: 'us-common-core' },
  { title: 'US NGSS', value: 'us-ngss' },
  { title: 'US TX Homeschool', value: 'us-tx-homeschool' },
  { title: 'US PA Homeschool Portfolio', value: 'us-pa-homeschool-portfolio' },
  { title: 'US CA Homeschool', value: 'us-ca-homeschool' },
  { title: 'None', value: 'none' },
];

export const atomicCapability = defineType({
  name: 'atomicCapability',
  title: 'Atomic Capability',
  type: 'document',
  fields: [
    defineField({ name: 'atomicId', title: 'Atomic ID (slug)', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'shortName', title: 'Short name', type: 'string' }),

    // Denormalised links (§3.5)
    defineField({ name: 'thread', title: 'Thread', type: 'reference', to: [{ type: 'capabilityThread' }] }),
    defineField({ name: 'strand', title: 'Strand', type: 'reference', to: [{ type: 'strand' }] }),
    defineField({ name: 'domain', title: 'Domain', type: 'reference', to: [{ type: 'capabilityDomain' }] }),
    defineField({
      name: 'stageBand',
      title: 'Stage band',
      type: 'string',
      options: { list: STAGE_BANDS },
    }),

    // Authoring metadata
    defineField({ name: 'introducedInVersion', title: 'Introduced in version', type: 'string', initialValue: '2.0.0' }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'active',
      options: { list: [{ title: 'Active', value: 'active' }, { title: 'Deprecated', value: 'deprecated' }] },
    }),
    defineField({ name: 'publishedInVersion', title: 'Published in version (locks structure once set)', type: 'string' }),

    // Editorial
    defineField({ name: 'description', title: 'Description (1–2 sentences plain language)', type: 'text', rows: 3 }),
    defineField({ name: 'whyItMatters', title: 'Why it matters', type: 'text', rows: 4 }),
    defineField({ name: 'observableInContext', title: 'Observable in context (sample utterance)', type: 'text', rows: 2 }),

    // Indicators
    defineField({
      name: 'indicators',
      title: 'Indicators',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'atomicIndicator',
          fields: [
            { name: 'indicatorId', title: 'Indicator ID', type: 'string' },
            { name: 'tier', title: 'Tier', type: 'string', options: { list: TIERS } },
            { name: 'text', title: 'Text', type: 'text', rows: 2 },
            { name: 'observabilityNotes', title: 'Observability notes', type: 'text', rows: 2 },
            { name: 'introducedInVersion', title: 'Introduced in version', type: 'string', initialValue: '2.0.0' },
            {
              name: 'status',
              title: 'Status',
              type: 'string',
              initialValue: 'active',
              options: { list: [{ title: 'Active', value: 'active' }, { title: 'Deprecated', value: 'deprecated' }] },
            },
          ],
          preview: { select: { title: 'text', subtitle: 'tier' } },
        },
      ],
    }),

    // Prerequisite edges (atomic-to-atomic, D6)
    defineField({
      name: 'prerequisiteEdges',
      title: 'Prerequisite edges (atomic-to-atomic)',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'prerequisiteEdge' }] }],
    }),

    // Regulatory mappings (§3.7) — atom is the rollup source
    defineField({
      name: 'regulatoryMappings',
      title: 'Regulatory mappings',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'regulatoryMapping',
          fields: [
            { name: 'frameworkKey', title: 'Framework', type: 'string', options: { list: REGULATORY_FRAMEWORKS } },
            { name: 'frameworkVersion', title: 'Framework version', type: 'string' },
            { name: 'codes', title: 'Codes', type: 'array', of: [{ type: 'string' }] },
            {
              name: 'reportTier',
              title: 'Report tier',
              type: 'string',
              options: {
                list: [
                  { title: 'CD level', value: 'cd_level' },
                  { title: 'Learning area', value: 'learning_area' },
                  { title: 'Standard', value: 'standard' },
                  { title: 'Outcome', value: 'outcome' },
                ],
              },
            },
            {
              name: 'contribution',
              title: 'Contribution',
              type: 'string',
              options: {
                list: [
                  { title: 'Primary', value: 'primary' },
                  { title: 'Partial', value: 'partial' },
                  { title: 'Incidental', value: 'incidental' },
                ],
              },
            },
            { name: 'evidenceWeight', title: 'Evidence weight (0.0–1.0)', type: 'number' },
          ],
          preview: { select: { title: 'frameworkKey', subtitle: 'contribution' } },
        },
      ],
    }),

    defineField({
      name: 'facilitationHints',
      title: 'Facilitation hints (for module authors)',
      type: 'array',
      of: [{ type: 'string' }],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'stageBand' },
  },
});
