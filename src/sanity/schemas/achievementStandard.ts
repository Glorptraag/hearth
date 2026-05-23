import { defineType, defineField } from 'sanity';

// Capability Universe v2 — Achievement Standard (§7)
// Holds the prose text of achievement standards from external regulatory frameworks
// (AC v9 and successors, Common Core, NGSS, state-specific frameworks).
//
// Atoms carry regulator codes inside `regulatoryMappings[].codes[]`. This document
// type is the resolver from those codes to displayable prose for the HEU Report and
// other regulator-facing surfaces.
//
// Append-only after publication (D3). Regulator wording is canon — never edit a
// published standard in place; deprecate and replace if the regulator updates.

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
];

const LEARNING_AREAS = [
  { title: 'English', value: 'english' },
  { title: 'Mathematics', value: 'mathematics' },
  { title: 'Science', value: 'science' },
  { title: 'HASS', value: 'hass' },
  { title: 'The Arts', value: 'arts' },
  { title: 'Technologies', value: 'technologies' },
  { title: 'Health & Physical Education', value: 'hpe' },
  { title: 'Languages', value: 'languages' },
];

const STAGE_BANDS = [
  { title: 'Foundational', value: 'foundational' },
  { title: 'Intermediate', value: 'intermediate' },
  { title: 'Advanced', value: 'advanced' },
  { title: 'Tertiary', value: 'tertiary' },
];

export const achievementStandard = defineType({
  name: 'achievementStandard',
  title: 'Achievement Standard',
  type: 'document',
  fields: [
    // ─── Identity ────────────────────────────────────────────────────────
    defineField({
      name: 'standardId',
      title: 'Standard ID (slug)',
      type: 'string',
      validation: (r) => r.required(),
      description:
        'Slug convention: {framework}-{area}-{subject?}-y{level}-as. Example: ac-v9-qld-eng-y2-as. ' +
        'For banded standards: ac-v9-qld-arts-drama-y1-2-as. The framework key prefix mirrors the atom ' +
        'regulatoryMapping enum so resolution is by string match.',
    }),

    // ─── Framework binding ───────────────────────────────────────────────
    defineField({
      name: 'frameworkKey',
      title: 'Regulatory framework',
      type: 'string',
      validation: (r) => r.required(),
      options: { list: REGULATORY_FRAMEWORKS },
    }),
    defineField({
      name: 'frameworkVersion',
      title: 'Framework version',
      type: 'string',
      initialValue: '9.0',
      description: 'Use the regulator\'s own version label (e.g. "9.0", "9.1"). When the regulator updates, the old standard is deprecated and a new document is authored — never edit in place.',
    }),

    // ─── Curriculum location ─────────────────────────────────────────────
    defineField({
      name: 'learningArea',
      title: 'Learning area',
      type: 'string',
      validation: (r) => r.required(),
      options: { list: LEARNING_AREAS },
    }),
    defineField({
      name: 'subject',
      title: 'Subject (if distinct from learning area)',
      type: 'string',
      description:
        'Examples: "History", "Geography", "Visual Arts", "Drama", "Digital Technologies", "French". ' +
        'Leave empty if the learning area has only one subject (English, Mathematics, Science, HPE).',
    }),
    defineField({
      name: 'yearLevel',
      title: 'Year level or band',
      type: 'string',
      validation: (r) => r.required(),
      description:
        'Use the framework\'s own labelling exactly. Examples: "F", "1", "2", "Years 1-2", ' +
        '"Years 3-4", "Years 7-8", "7", "10". The Arts and most Languages use bands; ' +
        'English, Mathematics, and Science use single years.',
    }),

    // ─── The prose itself ────────────────────────────────────────────────
    defineField({
      name: 'statementText',
      title: 'Achievement standard (full prose)',
      type: 'text',
      rows: 10,
      validation: (r) => r.required(),
      description:
        'The complete achievement standard text exactly as published by the regulator. ' +
        'Do not paraphrase, abridge, or reword. Attribution to ACARA (or equivalent) is handled ' +
        'in the report rendering layer, not stored per-document.',
    }),
    defineField({
      name: 'subStatements',
      title: 'Sub-statements (for structured standards)',
      type: 'array',
      description:
        'AC v9 English uses a three-paragraph structure (Speaking & Listening / Reading & Viewing / ' +
        'Writing & Creating). Use this field to capture the labelled breakdown when the standard has ' +
        'distinguishable sub-elements. Leave empty if the standard is a single prose block. The ' +
        'statementText field above always carries the full text regardless.',
      of: [
        {
          type: 'object',
          name: 'subStatement',
          fields: [
            {
              name: 'label',
              title: 'Label',
              type: 'string',
              description: 'e.g. "Speaking & Listening", "Reading & Viewing", "Writing & Creating".',
            },
            { name: 'text', title: 'Text', type: 'text', rows: 5 },
          ],
          preview: { select: { title: 'label', subtitle: 'text' } },
        },
      ],
    }),

    // ─── Hearth-internal stage-band association ──────────────────────────
    defineField({
      name: 'mapsToStageBand',
      title: 'Maps to Hearth stage band (soft hint)',
      type: 'string',
      options: { list: STAGE_BANDS },
      description:
        'Which Hearth stage band this regulator year level approximately corresponds to. ' +
        'Used for default recommendations and Constellation zone defaulting only — atoms make ' +
        'their own stage-band claims independently. Typical mapping: F–Year 2 → Foundational, ' +
        'Years 3–6 → Intermediate, Years 7–10 → Advanced, post-Y10 → Tertiary.',
    }),

    // ─── Source attribution ──────────────────────────────────────────────
    defineField({
      name: 'sourceUri',
      title: 'Source URI (ACARA MRAC or framework equivalent)',
      type: 'url',
      description:
        'Stable URI from the source framework. For AC v9, use the ACARA MRAC element URI ' +
        '(rdf.australiancurriculum.edu.au/elements/...). Enables auditability and re-fetch when ' +
        'the framework updates.',
    }),

    // ─── Version & status ────────────────────────────────────────────────
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
    }),
    defineField({
      name: 'deprecationReplacement',
      title: 'Deprecation replacement (standard ID)',
      type: 'string',
      description:
        'When the regulator updates a standard, the old document is marked deprecated and this ' +
        'field points to the standardId of its successor. Historical observations referencing the ' +
        'deprecated standard continue to resolve.',
    }),
    defineField({ name: 'deprecatedInVersion', title: 'Deprecated in library version', type: 'string' }),
  ],
  preview: {
    select: {
      area: 'learningArea',
      subject: 'subject',
      year: 'yearLevel',
      framework: 'frameworkKey',
      status: 'status',
    },
    prepare({ area, subject, year, framework, status }) {
      const subjectSuffix = subject ? ` · ${subject}` : '';
      const statusSuffix = status === 'deprecated' ? ' (deprecated)' : '';
      const yearLabel = year && /^\d+$/.test(year) ? `Year ${year}` : year;
      return {
        title: `${area}${subjectSuffix} — ${yearLabel}${statusSuffix}`,
        subtitle: framework ?? '—',
      };
    },
  },
});
