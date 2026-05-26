import { defineType, defineField } from 'sanity';
import { PRACTICE_KEYS } from './methodologyOverlay';

const bundleStatusList = [
  { title: 'Pending', value: 'pending' },
  { title: 'Ready', value: 'ready' },
  { title: 'Partial — needs review', value: 'partial_needs_review' },
];

const subjectList = [
  { title: 'English', value: 'english' },
  { title: 'Mathematics', value: 'mathematics' },
  { title: 'Science', value: 'science' },
  { title: 'HASS', value: 'hass' },
  { title: 'Arts', value: 'arts' },
  { title: 'Technologies', value: 'technologies' },
  { title: 'HPE', value: 'hpe' },
  { title: 'Languages', value: 'languages' },
];

export const moduleSchema = defineType({
  name: 'module',
  title: 'Module',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } }),
    defineField({
      name: 'targetUnderstanding',
      title: 'Target Understanding',
      type: 'text',
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'understandingIndicators',
      title: 'Understanding Indicators',
      type: 'object',
      fields: [
        { name: 'emerging', title: 'Emerging', type: 'text' },
        { name: 'developing', title: 'Developing', type: 'text' },
        { name: 'demonstrating', title: 'Demonstrating', type: 'text' },
      ],
    }),
    defineField({
      name: 'approaches',
      title: 'Approaches',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'approach' }] }],
    }),
    defineField({
      name: 'subjects',
      title: 'Subjects',
      type: 'array',
      of: [{ type: 'string' }],
      options: { list: subjectList },
    }),
    defineField({
      name: 'ageRange',
      title: 'Age Range',
      type: 'object',
      fields: [
        { name: 'min', title: 'Min Age', type: 'number' },
        { name: 'max', title: 'Max Age', type: 'number' },
      ],
    }),
    defineField({
      name: 'duration',
      title: 'Duration (minutes total)',
      type: 'object',
      fields: [
        { name: 'min', title: 'Min', type: 'number' },
        { name: 'max', title: 'Max', type: 'number' },
      ],
    }),
    defineField({
      name: 'badges',
      title: 'Badges',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'badge' }] }],
    }),
    defineField({
      name: 'capabilityThreads',
      title: 'Capability Threads',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'capabilityThread' }] }],
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'draft',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Published', value: 'published' },
        ],
      },
    }),
    defineField({
      name: 'printables',
      title: 'Printables',
      description:
        'Module-level override. Leave unset to inherit the parent pack (which itself derives from assetCounts when not authored). Set "available" explicitly only when a module differs from its pack.',
      type: 'object',
      fields: [
        defineField({
          name: 'available',
          title: 'Available',
          description: 'Explicit override. Leave blank to inherit from parent pack.',
          type: 'boolean',
        }),
        defineField({
          name: 'count',
          title: 'Printable Count',
          type: 'number',
        }),
      ],
    }),
    defineField({
      name: 'materials',
      title: 'Materials',
      description:
        'Module-level override. Leave unset (or mode "none") to inherit the parent pack.',
      type: 'object',
      fields: [
        defineField({
          name: 'mode',
          title: 'Mode',
          type: 'string',
          initialValue: 'none',
          options: {
            list: [
              { title: 'None — no special materials', value: 'none' },
              { title: 'Required — family sources themselves', value: 'required' },
              { title: 'Ships with kit', value: 'ships-with' },
            ],
          },
        }),
        defineField({
          name: 'description',
          title: 'Description',
          type: 'text',
          hidden: ({ parent }) => parent?.mode !== 'required',
        }),
        defineField({
          name: 'kitRef',
          title: 'Kit',
          type: 'reference',
          to: [{ type: 'kit' }],
          hidden: ({ parent }) => parent?.mode !== 'ships-with',
        }),
        defineField({
          name: 'kitPriceAUD',
          title: 'Kit Price (AUD, denormalised)',
          type: 'number',
          hidden: ({ parent }) => parent?.mode !== 'ships-with',
        }),
      ],
    }),
    defineField({
      name: 'authorFamilyId',
      title: 'Author Family Id',
      description: 'Postgres family id when this module was built by a parent; null for Hearth editorial content.',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'createdVia',
      title: 'Created Via',
      description: 'Builder pathway used to create this module, or "editorial" for Hearth-authored content.',
      type: 'string',
      readOnly: true,
      hidden: true,
      options: {
        list: [
          { title: 'Material-Anchored', value: 'material' },
          { title: 'Process-Anchored', value: 'process' },
          { title: 'Inquiry-Anchored', value: 'inquiry' },
          { title: 'Retrospective Lift', value: 'retrospective' },
          { title: 'Goal-Forward', value: 'understanding' },
          { title: 'Editorial', value: 'editorial' },
        ],
      },
    }),
    // Pedagogy Lens Bundle — content-time-baked, per-pedagogy.
    // Spec: docs/hearth-pedagogy-lens-bundle-v1.md.
    defineField({
      name: 'pedagogyLensBundles',
      title: 'Pedagogy Lens Bundles',
      description:
        'Per-pedagogy bundles generated by the Kindler. One entry per pedagogyKey. Read-only — do not edit by hand.',
      type: 'array',
      of: [{ type: 'pedagogyLensBundle' }],
      readOnly: true,
    }),
    defineField({
      name: 'lensStatus',
      title: 'Lens Status',
      type: 'string',
      initialValue: 'pending',
      options: { list: bundleStatusList },
    }),
    // Methodology Overlay Bundle — content-time-baked, per-practice, affordance-filtered.
    // Spec: docs/hearth-methodology-overlay-bundle-v1.md.
    defineField({
      name: 'methodologyAffordances',
      title: 'Methodology Affordances',
      description:
        'Practice keys this module naturally supports. Inferred at save time for parent-built modules; explicitly authored for curated packs. Capped at 6.',
      type: 'array',
      of: [{ type: 'string' }],
      options: { list: [...PRACTICE_KEYS] },
      validation: (r) => r.max(6),
    }),
    defineField({
      name: 'methodologyOverlays',
      title: 'Methodology Overlays',
      description: 'Per-practice overlay artefacts generated by the Kindler. Read-only.',
      type: 'array',
      of: [{ type: 'methodologyOverlay' }],
      readOnly: true,
    }),
    defineField({
      name: 'methodologyStatus',
      title: 'Methodology Status',
      type: 'string',
      initialValue: 'pending',
      options: { list: bundleStatusList },
    }),
    // Method Affinity — Layer 6 supply-side tags. Drives the tag-match recommender at
    // Discovery / Planner / Marketplace by overlapping with the family's
    // `lensAccumulatedSignals` (Layer 5 on the FIS, written at Logger save time).
    // v1 granularity: Option 2 — pedagogy keys + Interpretive Pattern IDs only.
    // Spec: docs/hearth-pedagogy-system-architecture-v1.md §9 (decision C-PA5).
    defineField({
      name: 'methodAffinity',
      title: 'Method Affinity',
      description:
        'Supply-side tags. Which pedagogies and Interpretive Patterns this module satisfies. Universal (not family-specific). Recommendation scores computed at read-time, not stored.',
      type: 'object',
      fields: [
        defineField({
          name: 'pedagogies',
          title: 'Pedagogies',
          description: 'Which pedagogies read this module favourably.',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            list: [
              { title: 'Charlotte Mason', value: 'charlotte_mason' },
              { title: 'Classical', value: 'classical' },
              { title: 'Montessori', value: 'montessori' },
              { title: 'Waldorf / Steiner', value: 'waldorf_steiner' },
              { title: 'Unschooling', value: 'unschooling' },
              { title: 'Eclectic', value: 'eclectic' },
            ],
          },
        }),
        defineField({
          name: 'interpretivePatterns',
          title: 'Interpretive Pattern IDs',
          description:
            'IDs from the PKB Interpretive Patterns layer (e.g. IP-CM-001). These also double as classifier IDs in the family lens accumulated signals.',
          type: 'array',
          of: [{ type: 'string' }],
        }),
      ],
    }),
  ],
});
