import { defineType, defineField } from 'sanity';

// Capability Universe v2 — Thread (§3.3)
// v2-migrated. Threads belong to exactly one domain (reference, was a flat
// string enum in v1). Each thread carries the four required stage-bands per
// D4 (foundational/intermediate/advanced/tertiary), all present from v2
// forward even when unpopulated.
//
// Legacy v1 fields (description, dlos, prerequisites, enables,
// curriculumCodes) are retained as OPTIONAL/deprecated during the v1→v2
// transition so existing readers (snapshot-rebuild inline-dlos path, the
// constellation topology) keep functioning until the data-pipeline workstream
// collapses DLO content onto standalone discreteLearningObjective documents.
// Per D3/D6, regulatory mappings and atomic structure do NOT live on the
// thread — they attach at stage-band/strand/atomic level.

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

export const capabilityThread = defineType({
  name: 'capabilityThread',
  title: 'Capability Thread',
  type: 'document',
  fields: [
    // ─── Identity ────────────────────────────────────────────────────────
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'shortName', title: 'Short name (for tight UI)', type: 'string' }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({
      name: 'legacyV1Id',
      title: 'Legacy v1 id (migration mapping, e.g. "M1", "PS4", "EF6")',
      type: 'string',
      description:
        'Preserves the v1 thread id so observations re-tag automatically on migration (spec §11.4).',
    }),
    defineField({
      name: 'domain',
      title: 'Domain',
      type: 'reference',
      to: [{ type: 'capabilityDomain' }],
      validation: (r) => r.required(),
      description: 'v2: reference to a capabilityDomain document (was a flat string enum in v1).',
    }),

    // ─── Authoring metadata ──────────────────────────────────────────────
    defineField({
      name: 'introducedInVersion',
      title: 'Introduced in library version',
      type: 'string',
      initialValue: '2.0.0',
    }),
    defineField({
      name: 'canonStatus',
      title: 'Canon status',
      type: 'string',
      initialValue: 'active',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Deprecated', value: 'deprecated' },
        ],
      },
      description:
        'Spec §3.3 names this `status`; v2 substrate uses `canonStatus` to avoid collision with ' +
        'document workflow status. Deprecated threads remain (D3) with a deprecationReplacement.',
    }),
    defineField({
      name: 'deprecationReplacement',
      title: 'Deprecation replacement (thread id)',
      type: 'string',
      description: 'Successor thread id when this thread is deprecated.',
    }),

    // ─── Editorial content ───────────────────────────────────────────────
    defineField({ name: 'summary', title: 'Summary (1 paragraph)', type: 'text', rows: 3 }),
    defineField({ name: 'longDescription', title: 'Long description (multi-paragraph)', type: 'text', rows: 6 }),
    defineField({
      name: 'whatItLooksLike',
      title: 'What it looks like (5–8 concrete examples across stage-bands)',
      type: 'array',
      of: [{ type: 'string' }],
    }),

    // ─── Structural: four required stage-bands (D4) ──────────────────────
    defineField({
      name: 'stageBands',
      title: 'Stage bands (exactly four: foundational/intermediate/advanced/tertiary)',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'threadStageBand',
          fields: [
            { name: 'key', title: 'Stage band', type: 'string', options: { list: STAGE_BANDS } },
            {
              name: 'isPopulatedInThisVersion',
              title: 'Populated in this version',
              type: 'boolean',
              initialValue: false,
              description: 'v1-migrated threads ship with all bands unpopulated; v2-native authoring fills them.',
            },
            {
              name: 'approximateAgeBand',
              title: 'Approximate age band (soft hint, not enforced)',
              type: 'object',
              fields: [
                { name: 'min', title: 'Min', type: 'number' },
                { name: 'max', title: 'Max', type: 'number' },
              ],
            },
            { name: 'summary', title: 'Stage-band summary (1–2 sentences)', type: 'text', rows: 2 },
            {
              name: 'badges',
              title: 'Badges (stage-tier scoped, D8)',
              type: 'array',
              of: [{ type: 'reference', to: [{ type: 'badge' }] }],
            },
            {
              name: 'prerequisiteEdges',
              title: 'Stage-band-to-stage-band prerequisite edges (D6)',
              type: 'array',
              of: [{ type: 'reference', to: [{ type: 'prerequisiteEdge' }] }],
            },
          ],
          preview: {
            select: { key: 'key', populated: 'isPopulatedInThisVersion' },
            prepare({ key, populated }) {
              return { title: key ?? '—', subtitle: populated ? 'populated' : 'unpopulated' };
            },
          },
        },
      ],
    }),

    // ─── Pedagogy affinity (read-time lens overlay, thread level) ────────
    defineField({
      name: 'pedagogyAffinities',
      title: 'Pedagogy affinities',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'pedagogyAffinity',
          fields: [
            { name: 'pedagogyKey', title: 'Pedagogy key', type: 'string' },
            {
              name: 'weight',
              title: 'Weight',
              type: 'string',
              options: {
                list: [
                  { title: 'High', value: 'high' },
                  { title: 'Moderate', value: 'moderate' },
                  { title: 'Low', value: 'low' },
                  { title: 'Neutral', value: 'neutral' },
                ],
              },
            },
            { name: 'rationale', title: 'Rationale (editorial note for lens overlay)', type: 'text', rows: 2 },
          ],
          preview: { select: { title: 'pedagogyKey', subtitle: 'weight' } },
        },
      ],
    }),

    // ─── Visual ──────────────────────────────────────────────────────────
    defineField({ name: 'iconKey', title: 'Icon key', type: 'string' }),
    defineField({ name: 'colourToken', title: 'Colour token (design system token)', type: 'string' }),

    // ─── Legacy v1 fields (deprecated; retained for transition only) ─────
    defineField({
      name: 'description',
      title: '[legacy v1] Description',
      type: 'text',
      description: 'Deprecated. Superseded by `summary` / `longDescription`. Retained for transition.',
    }),
    defineField({
      name: 'dlos',
      title: '[legacy v1] Inline Developmental Learning Outcomes',
      type: 'array',
      description:
        'Deprecated. DLO content is collapsing onto standalone discreteLearningObjective ' +
        'documents (single source of truth). Retained until the data-pipeline workstream lands.',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', title: 'Title', type: 'string' },
            { name: 'tier', title: 'Tier', type: 'string', options: { list: TIERS } },
            { name: 'description', title: 'Description', type: 'text' },
          ],
        },
      ],
    }),
    defineField({
      name: 'prerequisites',
      title: '[legacy v1] Prerequisites (thread-level)',
      type: 'array',
      description: 'Deprecated. v2 prerequisites are typed PrerequisiteEdge documents at stage-band/atomic level (D6).',
      of: [{ type: 'reference', to: [{ type: 'capabilityThread' }] }],
    }),
    defineField({
      name: 'enables',
      title: '[legacy v1] Enables (thread-level)',
      type: 'array',
      description: 'Deprecated. See PrerequisiteEdge (D6).',
      of: [{ type: 'reference', to: [{ type: 'capabilityThread' }] }],
    }),
    defineField({
      name: 'curriculumCodes',
      title: '[legacy v1] AC v9 Curriculum Codes (thread-level)',
      type: 'array',
      description: 'Deprecated. Regulatory mappings attach at atomic level in v2 (§7.1).',
      of: [{ type: 'string' }],
    }),
  ],
  preview: {
    select: { title: 'title', legacy: 'legacyV1Id', status: 'canonStatus' },
    prepare({ title, legacy, status }) {
      const suffix = status === 'deprecated' ? ' (deprecated)' : '';
      return { title: `${title}${suffix}`, subtitle: legacy ? `v1: ${legacy}` : undefined };
    },
  },
});
