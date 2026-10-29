import { defineType, defineField } from 'sanity';

/** WF §3.4 evidence kinds. Same values as discreteLearningObjective.evidenceKind. */
const WATCH_KIND_OPTIONS = [
  { title: 'Does', value: 'does' },
  { title: 'Says', value: 'says' },
  { title: 'Makes', value: 'makes' },
  { title: 'Chooses', value: 'chooses' },
];

function watchKindTextFields() {
  return WATCH_KIND_OPTIONS.map(({ title, value }) =>
    defineField({ name: value, title, type: 'text', rows: 2 }),
  );
}

export const pedagogicalFramework = defineType({
  name: 'pedagogicalFramework',
  title: 'Pedagogical Framework',
  type: 'document',
  fields: [
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'string',
      validation: (r) => r.required(),
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
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'greetingTone',
      title: 'Greeting Tone',
      type: 'string',
      validation: (r) => r.required(),
      options: {
        list: [
          { title: 'Warm', value: 'warm' },
          { title: 'Structured', value: 'structured' },
          { title: 'Playful', value: 'playful' },
          { title: 'Poetic', value: 'poetic' },
        ],
      },
    }),
    defineField({
      name: 'vocabulary',
      title: 'Vocabulary',
      type: 'object',
      fields: [
        { name: 'sessionNoun', title: 'Session Noun', type: 'string' },
        { name: 'facilitatorNoun', title: 'Facilitator Noun', type: 'string' },
        { name: 'learnerNoun', title: 'Learner Noun', type: 'string' },
        { name: 'activityVerb', title: 'Activity Verb', type: 'string' },
        { name: 'growthNoun', title: 'Growth Noun', type: 'string' },
      ],
    }),
    defineField({
      name: 'uiCopy',
      title: 'UI Copy',
      type: 'object',
      fields: [
        { name: 'logNudge', title: 'Log Nudge', type: 'string' },
        { name: 'logWhatLabel', title: 'Log What Label', type: 'string' },
        { name: 'logWhatPlaceholder', title: 'Log What Placeholder', type: 'text' },
        { name: 'logObserveLabel', title: 'Log Observe Label', type: 'string' },
        { name: 'coverageFrame', title: 'Coverage Frame', type: 'string' },
        { name: 'gapFrame', title: 'Gap Frame', type: 'string' },
        { name: 'celebrationFrame', title: 'Celebration Frame', type: 'string' },
        { name: 'plannerFrame', title: 'Planner Frame', type: 'string' },
      ],
    }),

    // ─── Watch-for "how" lines (WF §3.4, §8.1; build plan HC-1a, D-HC-5) ─────
    // A watch-for's "how" line = this tradition's line for the DLO's evidenceKind.
    // Composed by lookup, never generated (WF §3.1, D57). Draft source of truth:
    // content/traditions/watch-how.yaml.
    defineField({
      name: 'watchHow',
      title: 'Watch how',
      type: 'object',
      description:
        'How this tradition watches, one line per evidence kind (WF §3.4, §8.1). Transcribed verbatim from WF §3.4. Lines may use the {child} token. Eclectic leaves this empty and uses the rule below.',
      options: { collapsible: true, collapsed: false },
      fields: watchKindTextFields(),
    }),
    defineField({
      name: 'watchHowStageOverrides',
      title: 'Watch how: stage overrides',
      type: 'array',
      description:
        'Replaces one evidence kind\'s line at one of this tradition\'s existing stage keys, e.g. Waldorf `first` (under 7) · says (WF §3.4, §8.1).',
      of: [
        {
          type: 'object',
          name: 'watchHowStageOverride',
          fields: [
            defineField({
              name: 'stage',
              title: 'Stage key',
              type: 'string',
              description: 'A stage key this tradition already has (PL §5), e.g. "first".',
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'kind',
              title: 'Evidence kind',
              type: 'string',
              options: { list: WATCH_KIND_OPTIONS },
              validation: (r) => r.required(),
            }),
            defineField({
              name: 'text',
              title: 'Text',
              type: 'text',
              rows: 2,
              validation: (r) => r.required(),
            }),
          ],
          preview: {
            select: { stage: 'stage', kind: 'kind', text: 'text' },
            prepare({ stage, kind, text }) {
              return { title: text ?? '(no text)', subtitle: `${stage ?? '?'} · ${kind ?? '?'}` };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'watchHowRule',
      title: 'Watch how: rule (Eclectic)',
      type: 'text',
      rows: 3,
      description:
        'Eclectic only. The strongest-weighted-tradition rule, verbatim from WF §3.4: borrow that tradition\'s line for the DLO\'s typical signal and name it.',
      hidden: ({ document }) => document?.slug !== 'eclectic',
    }),
    defineField({
      name: 'watchHowLabelTemplate',
      title: 'Watch how: label template (Eclectic)',
      type: 'string',
      description:
        'Eclectic only. Label shown before a borrowed line, with a {tradition} token, e.g. "A {tradition} way to watch:" (WF §3.4).',
      hidden: ({ document }) => document?.slug !== 'eclectic',
    }),
    defineField({
      name: 'watchHowFallback',
      title: 'Watch how: neutral fallback (Eclectic)',
      type: 'object',
      description:
        'Eclectic only. Neutral lines shown, with no tradition label, until DLO typical signals and signal weights exist to drive the rule (WF §3.4, §8.1). Lines may use the {child} token.',
      hidden: ({ document }) => document?.slug !== 'eclectic',
      fields: watchKindTextFields(),
    }),
    defineField({
      name: 'notifyDefault',
      title: 'Notify default',
      type: 'string',
      description: 'Default watch-for notification timing for this tradition (WF §8.1). Unschooling defaults to Monday.',
      initialValue: 'planned',
      options: {
        list: [
          { title: 'When planned', value: 'planned' },
          { title: 'Monday', value: 'monday' },
        ],
      },
    }),
    defineField({
      name: 'watchHowConfirmedAt',
      title: 'Watch how confirmed at',
      type: 'datetime',
      description: 'When a human confirmed the watch-how lines. Unconfirmed lines never render.',
    }),
    defineField({
      name: 'watchHowConfirmedBy',
      title: 'Watch how confirmed by',
      type: 'string',
      description: 'Who confirmed the watch-how lines.',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'tagline' },
  },
});
