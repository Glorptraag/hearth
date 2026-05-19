import { defineType, defineField } from 'sanity';

// Capability Universe v2 — Domain (§2, §3.2)
// The addressable unit of capability identity. Threads belong to exactly one
// domain; atomic capabilities inherit their domain from their thread.
//
// Append-only after publication (D12): domains cannot be removed, merged,
// split, or renamed in later library versions. New domains can be admitted;
// existing ones are deprecated in place, never deleted.
//
// Authored from spec §3.2 Domain interface. Field shape is the conformance
// contract for scripts/seed-capability-domains.ts — keep in sync.
//
// Supersedes the earlier domain.ts (which used a required `domainId` string
// and lacked `optIn`). Identity is `slug` + deterministic _id
// `capabilityDomain.{camelCaseKey}` per the seed. Spec §3.2 also lists
// `authoredBy`; intentionally omitted here per the blessed schema artifact.

const SUPER_DOMAINS = [
  { title: 'Foundations', value: 'foundations' },
  { title: 'Cultural Inheritance', value: 'cultural-inheritance' },
  { title: 'Classical Disciplines', value: 'classical-disciplines' },
  { title: 'Aesthetic Expression', value: 'aesthetic-expression' },
  { title: 'Practical & Vocational', value: 'practical-vocational' },
  { title: 'Human Formation', value: 'human-formation' },
];

export const capabilityDomain = defineType({
  name: 'capabilityDomain',
  title: 'Capability Domain',
  type: 'document',
  fields: [
    // ─── Identity ────────────────────────────────────────────────────────
    defineField({
      name: 'numericId',
      title: 'Numeric ID (1–15 in v2, append-only allocated thereafter)',
      type: 'number',
      validation: (r) => r.required().integer().positive(),
    }),
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'shortName',
      title: 'Short name (for tight UI)',
      type: 'string',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (stable id, e.g. "language-literacy")',
      type: 'slug',
      options: { source: 'name' },
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'superDomain',
      title: 'Super-domain',
      type: 'string',
      options: { list: SUPER_DOMAINS },
      validation: (r) => r.required(),
    }),

    // ─── Authoring metadata ──────────────────────────────────────────────
    defineField({
      name: 'introducedInVersion',
      title: 'Introduced in library version',
      type: 'string',
      initialValue: '2.0.0',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'active',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Deprecated', value: 'deprecated' },
        ],
      },
      description: 'Domains are never deleted (D12). Deprecated domains remain in the data model.',
    }),
    defineField({
      name: 'deprecationReplacement',
      title: 'Deprecation replacement (domain id)',
      type: 'string',
      description: 'Domain id this is replaced by, if deprecated. Domains are rarely deprecated.',
    }),

    // ─── Editorial content ───────────────────────────────────────────────
    defineField({
      name: 'summary',
      title: 'Summary (2–3 sentence plain-language description)',
      type: 'text',
      rows: 3,
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'whatItIsNot',
      title: 'What it is not (explicit boundary statements)',
      type: 'text',
      rows: 3,
      description: 'Where adjacent capability lives instead. Prevents domain bleed during authoring.',
    }),
    defineField({
      name: 'exampleObservations',
      title: 'Example observations (3–5 concrete examples)',
      type: 'array',
      of: [{ type: 'string' }],
    }),

    // ─── Family-level opt-in ─────────────────────────────────────────────
    defineField({
      name: 'optIn',
      title: 'Opt-in at family level',
      type: 'boolean',
      initialValue: false,
      description:
        'True for Domain 9 (Theology & Scriptural Literacy) per §2.2. Opt-in domains ' +
        'render in the Constellation as available but unlit for families that have not ' +
        'selected the relevant worldview; packs touching them can be filtered out.',
    }),

    // ─── Visual ──────────────────────────────────────────────────────────
    defineField({
      name: 'iconKey',
      title: 'Icon key (emoji placeholder until icon system finalised)',
      type: 'string',
    }),
    defineField({
      name: 'colourToken',
      title: 'Colour token (design system token — no hardcoded values)',
      type: 'string',
    }),
    defineField({
      name: 'constellationRegion',
      title: 'Constellation region (polar-coordinate placement)',
      type: 'object',
      description:
        'Stable spatial placement so v3+ domains can be admitted without reshuffling ' +
        'existing layouts (§3.2 ConstellationRegion). Optional in v2 — the renderer can ' +
        'use organic layout within a domain region; this constrains the region itself.',
      fields: [
        { name: 'angularStart', title: 'Angular start (degrees)', type: 'number' },
        { name: 'angularEnd', title: 'Angular end (degrees)', type: 'number' },
        { name: 'radialMin', title: 'Radial min (0–1 normalised)', type: 'number' },
        { name: 'radialMax', title: 'Radial max (0–1 normalised)', type: 'number' },
      ],
    }),
  ],
  preview: {
    select: {
      numericId: 'numericId',
      name: 'name',
      superDomain: 'superDomain',
      status: 'status',
    },
    prepare({ numericId, name, superDomain, status }) {
      const statusSuffix = status === 'deprecated' ? ' (deprecated)' : '';
      return {
        title: `${numericId}. ${name}${statusSuffix}`,
        subtitle: superDomain ?? '—',
      };
    },
  },
});
