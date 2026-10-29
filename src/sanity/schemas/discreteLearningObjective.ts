import { defineType, defineField } from 'sanity';

// Framework list mirrors atomicCapability.ts — the DLO carries the SAME
// regulatoryMappings shape so migrating the mappings down to atomic
// capabilities later (WS-5 scope note) is mechanical, not a redesign.
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

export const discreteLearningObjective = defineType({
  name: 'discreteLearningObjective',
  title: 'Discrete Learning Objective',
  type: 'document',
  fields: [
    defineField({
      name: 'thread',
      title: 'Capability Thread',
      type: 'reference',
      to: [{ type: 'capabilityThread' }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'tier',
      title: 'Tier',
      type: 'string',
      validation: (r) => r.required(),
      options: {
        list: [
          { title: 'Emerging', value: 'emerging' },
          { title: 'Developing', value: 'developing' },
          { title: 'Demonstrating', value: 'demonstrating' },
        ],
      },
    }),
    defineField({
      name: 'descriptor',
      title: 'Descriptor',
      type: 'text',
      validation: (r) => r.required(),
    }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'descriptor' } }),
    defineField({
      name: 'parentVersion',
      title: 'Parent Version',
      type: 'string',
      description: 'Optional reference (id) of the previous DLO version this revises.',
    }),
    defineField({
      name: 'badgeLevel',
      title: 'Badge Level',
      type: 'string',
      description: 'Tier at which this DLO contributes to badge eligibility.',
      options: {
        list: [
          { title: 'Starter', value: 'starter' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' },
        ],
      },
    }),
    // Regulatory mappings (§3.7) — VERBATIM shape from atomicCapability.ts so
    // the deterministic transposer (WS-5) reads one shape today and migration
    // to the atomic rollup source later is mechanical.
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
      name: 'watchForNext',
      title: 'Watch for next',
      type: 'object',
      description:
        'What a parent might notice next as this DLO develops. The sign is philosophy-neutral; the family\'s tradition supplies the "how to watch" line from pedagogicalFramework.watchHow (D-HC-5, WF §3.4). No per-DLO tradition variants (PL D39).',
      fields: [
        defineField({
          name: 'neutral',
          title: 'Neutral text',
          description: 'One observable sentence: the sign that this DLO is showing.',
          type: 'text',
          rows: 3,
          validation: (r) => r.required(),
        }),
        defineField({
          name: 'notYet',
          title: 'Not-yet signs',
          description:
            'Optional. What "not yet" tends to look like, in parent words, each with an optional practice to respond with (WF §3, §8.1).',
          type: 'array',
          of: [
            {
              type: 'object',
              name: 'notYetSign',
              fields: [
                defineField({
                  name: 'id',
                  title: 'ID',
                  type: 'string',
                  description: 'Slug-like, unique within this DLO (e.g. "skips-some").',
                  validation: (r) =>
                    r.required().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { name: 'slug-like id' }),
                }),
                defineField({
                  name: 'label',
                  title: 'Label',
                  type: 'string',
                  description: 'Parent words, 8 words or fewer.',
                  validation: (r) =>
                    r.required().custom((value) =>
                      typeof value === 'string' && value.trim().split(/\s+/).filter(Boolean).length > 8
                        ? 'Keep the label to 8 words or fewer'
                        : true,
                    ),
                }),
                defineField({
                  name: 'respond',
                  title: 'Respond with (practice ID)',
                  type: 'string',
                  description: 'Optional practice note ID to offer in response, e.g. "cm.narration" (PL §5.7).',
                }),
              ],
              preview: { select: { title: 'label', subtitle: 'id' } },
            },
          ],
        }),
      ],
    }),
    defineField({
      name: 'evidenceKind',
      title: 'Evidence kind',
      type: 'string',
      description: 'How learning on this DLO shows (hearth-watch-for-v1.md §3.4)',
      options: {
        list: [
          { title: 'Does', value: 'does' },
          { title: 'Says', value: 'says' },
          { title: 'Makes', value: 'makes' },
          { title: 'Chooses', value: 'chooses' },
        ],
      },
    }),
    defineField({
      name: 'watchForConfirmedAt',
      title: 'Watch-for confirmed at',
      type: 'datetime',
      description: 'When a human confirmed the watch-for text.',
    }),
    defineField({
      name: 'watchForConfirmedBy',
      title: 'Watch-for confirmed by',
      type: 'string',
      description: 'Who confirmed the watch-for text.',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      initialValue: 'published',
      options: {
        list: [
          { title: 'Draft', value: 'draft' },
          { title: 'Published', value: 'published' },
          { title: 'Archived', value: 'archived' },
        ],
      },
    }),
  ],
  preview: {
    select: { tier: 'tier', descriptor: 'descriptor', thread: 'thread.title' },
    prepare({ tier, descriptor, thread }) {
      return {
        title: descriptor ?? '(no descriptor)',
        subtitle: thread ? `${thread} · ${tier}` : tier,
      };
    },
  },
});
