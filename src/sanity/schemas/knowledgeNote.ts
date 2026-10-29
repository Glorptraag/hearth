import { defineType, defineField } from 'sanity';

// Hearth Cycle knowledge note (build plan §2.2, pulled forward for kinds `craft`
// and `pattern`). One document type with a `kind` discriminator; later kinds
// (`method`, `practice`, `signal`, `guide`, `ageGuide`, `list`) land in HC-2b+.
//
// Field names mirror the authored drafts in content/craft-notes/*.yaml and
// content/lesson-patterns/*.yaml field for field. The YAML `id` (e.g.
// `craft.wait-time`, `pattern.read-tell-back`) is the document `_id`.
// Validation copies content/README.md "Validation rules" (WF §8.1, Brief §4.1).
//
// Unconfirmed notes never render: app reads filter on
// `status == "published" && defined(confirmedAt)`.

type NoteDoc = { kind?: string; stage?: string } | undefined;

const TRADITION_OPTIONS = [
  { title: 'Charlotte Mason', value: 'charlotte_mason' },
  { title: 'Classical', value: 'classical' },
  { title: 'Montessori', value: 'montessori' },
  { title: 'Waldorf / Steiner', value: 'waldorf_steiner' },
  { title: 'Unschooling', value: 'unschooling' },
  { title: 'Eclectic', value: 'eclectic' },
];

const EVIDENCE_KIND_OPTIONS = [
  { title: 'Does', value: 'does' },
  { title: 'Says', value: 'says' },
  { title: 'Makes', value: 'makes' },
  { title: 'Chooses', value: 'chooses' },
];

/** Fixed trigger-kind list (content/README.md; one row each of WF §7.7). */
const TRIGGER_KIND_OPTIONS = [
  { title: 'Same not-yet sign repeats on one DLO', value: 'notyet-repeat' },
  { title: '"Didn\'t come up" repeats across watch-fors', value: 'didnt-come-up-repeat' },
  { title: 'A method outcome repeats', value: 'outcome-repeat' },
  { title: 'Partly / Not yet with no parent move (E3+)', value: 'no-parent-move' },
  { title: 'Saw-it rate high on one thread', value: 'saw-it-rate-high' },
  { title: 'Sessions moved or skipped on one weekday', value: 'weekday-skips' },
  { title: 'Tried a tool, then Partly rate drops', value: 'tried-then-partly-drops' },
];

const PARENT_ACTION_SLOTS = new Set(['activity', 'child']);

function wordCount(value: unknown): number {
  return typeof value === 'string' ? value.trim().split(/\s+/).filter(Boolean).length : 0;
}

function maxWords(limit: number) {
  return (value: unknown) =>
    wordCount(value) > limit ? `Keep this to ${limit} words or fewer (now ${wordCount(value)})` : true;
}

const isCraft = (doc: NoteDoc) => doc?.kind === 'craft';
const isPattern = (doc: NoteDoc) => doc?.kind === 'pattern';
const hideUnlessCraft = ({ document }: { document?: unknown }) => !isCraft(document as NoteDoc);
const hideUnlessPattern = ({ document }: { document?: unknown }) => !isPattern(document as NoteDoc);

/** Required only when the note is of the given kind. */
function requiredFor(kind: 'craft' | 'pattern') {
  return (value: unknown, context: { document?: unknown }) => {
    if ((context.document as NoteDoc)?.kind !== kind) return true;
    const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
    return empty ? `Required for ${kind} notes` : true;
  };
}

export const knowledgeNote = defineType({
  name: 'knowledgeNote',
  title: 'Knowledge Note',
  type: 'document',
  fields: [
    // ─── Shared ──────────────────────────────────────────────────────────
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      description: 'Build plan §2.2. Craft = WF §8.1 craft card; pattern = Brief §4.1 lesson pattern.',
      options: {
        list: [
          { title: 'Craft', value: 'craft' },
          { title: 'Lesson pattern', value: 'pattern' },
        ],
        layout: 'radio',
      },
      validation: (r) => r.required(),
    }),
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (r) => r.required() }),
    defineField({
      name: 'stage',
      title: 'Stage',
      type: 'string',
      description: 'Minimum educator stage that sees this note (WF §8.1).',
      options: {
        list: [
          { title: 'E1', value: 'E1' },
          { title: 'E2', value: 'E2' },
          { title: 'E3', value: 'E3' },
          { title: 'E4', value: 'E4' },
        ],
      },
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
      validation: (r) => r.required(),
    }),
    defineField({
      name: 'confirmedAt',
      title: 'Confirmed at',
      type: 'datetime',
      description: 'When a human confirmed this text. Unconfirmed notes never render.',
    }),
    defineField({
      name: 'confirmedBy',
      title: 'Confirmed by',
      type: 'string',
      description: 'Who confirmed this text.',
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      description: 'The spec section this note comes from, e.g. "docs/hearth-watch-for-v1.md §8.2".',
    }),

    // ─── Craft (WF §8.1) ─────────────────────────────────────────────────
    defineField({
      name: 'strand',
      title: 'Strand',
      type: 'string',
      description: 'WF §7.1.',
      hidden: hideUnlessCraft,
      options: {
        list: [
          { title: 'Prime', value: 'prime' },
          { title: 'Notice', value: 'notice' },
          { title: 'Record', value: 'record' },
          { title: 'Respond', value: 'respond' },
          { title: 'Craft', value: 'craft' },
        ],
      },
      validation: (r) => r.custom(requiredFor('craft')),
    }),
    defineField({
      name: 'card',
      title: 'Card',
      type: 'string',
      hidden: hideUnlessCraft,
      options: {
        list: [
          { title: 'Try', value: 'try' },
          { title: 'Understand', value: 'understand' },
          { title: 'Notice', value: 'notice' },
        ],
      },
      validation: (r) => r.custom(requiredFor('craft')),
    }),
    defineField({
      name: 'tradition',
      title: 'Tradition',
      type: 'string',
      description: '`neutral` or a pedagogicalFramework slug.',
      hidden: hideUnlessCraft,
      initialValue: 'neutral',
      options: { list: [{ title: 'Neutral', value: 'neutral' }, ...TRADITION_OPTIONS] },
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 4,
      description: '≤ 40 words at E1–E2, ≤ 90 words at E3–E4 (WF §8.1).',
      hidden: hideUnlessCraft,
      validation: (r) =>
        r.custom((value, context) => {
          const doc = context.document as NoteDoc;
          if (!isCraft(doc)) return true;
          if (!value) return 'Required for craft notes';
          const limit = doc?.stage === 'E3' || doc?.stage === 'E4' ? 90 : 40;
          return maxWords(limit)(value);
        }),
    }),
    defineField({
      name: 'why',
      title: 'Why',
      type: 'object',
      hidden: hideUnlessCraft,
      fields: [
        defineField({
          name: 'short',
          title: 'Short',
          type: 'string',
          description: 'One line, ≤ 15 words.',
          validation: (r) => r.custom(maxWords(15)),
        }),
        defineField({
          name: 'deeper',
          title: 'Deeper',
          type: 'text',
          rows: 3,
          description: 'Optional. E3+ `understand` cards only; left out of E1–E2 notes.',
        }),
      ],
    }),
    defineField({
      name: 'relates',
      title: 'Relates',
      type: 'object',
      hidden: hideUnlessCraft,
      fields: [
        defineField({
          name: 'dlos',
          title: 'DLOs',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'DLO IDs (dlo.<THREAD>.<tier>).',
        }),
        defineField({
          name: 'practices',
          title: 'Practices',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'PL §5.7 practice-note IDs, e.g. cm.narration.',
        }),
        defineField({
          name: 'methods',
          title: 'Methods',
          type: 'array',
          of: [{ type: 'string' }],
          description: 'LC §5 method IDs, e.g. cm.living-book.',
        }),
      ],
    }),
    defineField({
      // YAML key is singular `trigger` (content/craft-notes/*.yaml).
      name: 'trigger',
      title: 'Triggers',
      type: 'array',
      description: 'Optional. Kinds come from the fixed list (WF §7.7). Windows default to 14 days.',
      hidden: hideUnlessCraft,
      of: [
        {
          type: 'object',
          name: 'craftTrigger',
          fields: [
            defineField({
              name: 'kind',
              title: 'Kind',
              type: 'string',
              options: { list: TRIGGER_KIND_OPTIONS },
              validation: (r) => r.required(),
            }),
            defineField({ name: 'count', title: 'Count', type: 'number' }),
            defineField({ name: 'days', title: 'Days', type: 'number' }),
            defineField({ name: 'method', title: 'Method (outcome-repeat)', type: 'string' }),
            defineField({ name: 'outcome', title: 'Outcome (outcome-repeat)', type: 'string' }),
            defineField({ name: 'rate', title: 'Rate (saw-it-rate-high)', type: 'number' }),
            defineField({ name: 'note', title: 'Note (tried-then-partly-drops)', type: 'string' }),
          ],
          preview: {
            select: { kind: 'kind', count: 'count', days: 'days' },
            prepare({ kind, count, days }) {
              const params = [count != null ? `×${count}` : null, days != null ? `${days}d` : null]
                .filter(Boolean)
                .join(' / ');
              return { title: kind ?? '(no kind)', subtitle: params };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'cooldown',
      title: 'Cooldown (days)',
      type: 'number',
      description: 'Days before the same note can show again (WF §5.3).',
      hidden: hideUnlessCraft,
      initialValue: 28,
    }),

    // ─── Pattern (Brief §4.1) ────────────────────────────────────────────
    defineField({
      name: 'moves',
      title: 'Moves',
      type: 'array',
      description: '3–5 moves. parentAction ≤ 20 words; its only slots are {activity} and {child}.',
      hidden: hideUnlessPattern,
      of: [
        {
          type: 'object',
          name: 'patternMove',
          fields: [
            defineField({ name: 'key', title: 'Key', type: 'string', validation: (r) => r.required() }),
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (r) => r.required() }),
            defineField({
              name: 'parentAction',
              title: 'Parent action',
              type: 'text',
              rows: 2,
              validation: (r) =>
                r.required().custom((value) => {
                  const words = maxWords(20)(value);
                  if (words !== true) return words;
                  const bad = [...String(value ?? '').matchAll(/\{([^}]*)\}/g)]
                    .map((m) => m[1])
                    .filter((slot) => !PARENT_ACTION_SLOTS.has(slot));
                  return bad.length ? `Only {activity} and {child} slots are allowed (found {${bad.join('}, {')}})` : true;
                }),
            }),
          ],
          preview: { select: { title: 'label', subtitle: 'parentAction' } },
        },
      ],
      validation: (r) =>
        r.custom((value, context) => {
          if (!isPattern(context.document as NoteDoc)) return true;
          const n = Array.isArray(value) ? value.length : 0;
          return n >= 3 && n <= 5 ? true : `A lesson pattern has 3–5 moves (now ${n})`;
        }),
    }),
    defineField({
      name: 'watchForSlot',
      title: 'Watch-for slot',
      type: 'object',
      hidden: hideUnlessPattern,
      fields: [
        defineField({ name: 'prompt', title: 'Prompt', type: 'string' }),
        defineField({
          name: 'evidenceKinds',
          title: 'Evidence kinds',
          type: 'array',
          description: 'Subset of does · says · makes · chooses (WF §3.4).',
          of: [{ type: 'string' }],
          options: { list: EVIDENCE_KIND_OPTIONS },
        }),
      ],
      validation: (r) => r.custom(requiredFor('pattern')),
    }),
    defineField({
      name: 'whyItWorks',
      title: 'Why it works',
      type: 'text',
      rows: 4,
      description: '2–3 sentences.',
      hidden: hideUnlessPattern,
      validation: (r) => r.custom(requiredFor('pattern')),
    }),
    defineField({
      name: 'commonMistakes',
      title: 'Common mistakes',
      type: 'array',
      description: '2–4 lines, written parent to parent.',
      hidden: hideUnlessPattern,
      of: [{ type: 'string' }],
      validation: (r) =>
        r.custom((value, context) => {
          if (!isPattern(context.document as NoteDoc)) return true;
          const n = Array.isArray(value) ? value.length : 0;
          return n >= 2 && n <= 4 ? true : `Give 2–4 common mistakes (now ${n})`;
        }),
    }),
    defineField({
      name: 'traditionFit',
      title: 'Tradition fit',
      type: 'array',
      description: 'Tradition specifics live only here; the rest of the pattern stays philosophy-neutral.',
      hidden: hideUnlessPattern,
      of: [
        {
          type: 'object',
          name: 'patternTraditionFit',
          fields: [
            defineField({
              name: 'tradition',
              title: 'Tradition',
              type: 'string',
              options: { list: TRADITION_OPTIONS },
              validation: (r) => r.required(),
            }),
            defineField({ name: 'natural', title: 'Natural fit', type: 'boolean', initialValue: false }),
            defineField({ name: 'note', title: 'Note', type: 'text', rows: 2 }),
          ],
          preview: {
            select: { tradition: 'tradition', natural: 'natural', note: 'note' },
            prepare({ tradition, natural, note }) {
              return { title: `${tradition ?? '?'}${natural ? ' · natural' : ''}`, subtitle: note };
            },
          },
        },
      ],
    }),
    defineField({
      name: 'usedByMethods',
      title: 'Used by methods',
      type: 'array',
      description: 'LC §5 method IDs that use this pattern, e.g. cm.living-book.',
      hidden: hideUnlessPattern,
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'practices',
      title: 'Practices',
      type: 'array',
      description: 'PL §5.7 practice-note IDs.',
      hidden: hideUnlessPattern,
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'ageBand',
      title: 'Age band',
      type: 'object',
      hidden: hideUnlessPattern,
      fields: [
        defineField({ name: 'min', title: 'Min age', type: 'number' }),
        defineField({ name: 'max', title: 'Max age', type: 'number' }),
      ],
    }),
    defineField({
      name: 'example',
      title: 'Example',
      type: 'object',
      hidden: hideUnlessPattern,
      fields: [
        defineField({ name: 'activity', title: 'Activity', type: 'string' }),
        defineField({ name: 'filledMoves', title: 'Filled moves', type: 'array', of: [{ type: 'text', rows: 2 }] }),
        defineField({ name: 'watchFor', title: 'Watch for', type: 'text', rows: 2 }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', kind: 'kind', stage: 'stage' },
    prepare({ title, kind, stage }) {
      return { title: title ?? '(untitled)', subtitle: [kind, stage].filter(Boolean).join(' · ') };
    },
  },
});
