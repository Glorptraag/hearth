import { z } from 'zod';

// Photo Read (launch pivot W1.3). The Read is a plain, literal description of
// what a photo shows. It rides inside the existing enrichEntry Haiku call as
// one extra top-level key (READ_OUTPUT_KEY) — it is not a separate LLM call.
//
// The prompt text below is mirrored verbatim in read.prompt.md (the reviewable,
// versioned copy). read-schema.test.ts fails if the two drift, so edit both and
// bump READ_PROMPT_VERSION together.

export const READ_PROMPT_VERSION = 'read-v1';

export const READ_OUTPUT_KEY = 'photo_read';

export const READ_ARTEFACTS = [
  'worksheet',
  'book',
  'writing',
  'drawing',
  'build',
  'nature',
  'cooking',
  'screen',
  'other',
] as const;

export type ReadArtefact = (typeof READ_ARTEFACTS)[number];

export const READ_LIMITS = {
  seenMax: 8,
  seenPhraseWords: 6,
  doingWords: 20,
  printedTextWords: 12,
} as const;

export type ReadOutput = {
  seen: string[];
  doing: string;
  artefact: ReadArtefact;
  printedText: string;
  peopleVisible: number;
  confidence: 'high' | 'low';
};

const READ_PROMPT_SECTION = `PHOTO READ (only when one or more photos are attached to this entry):
Add one more top-level key to your JSON, "${READ_OUTPUT_KEY}". If no photo is attached, or you cannot or will not describe it, set "${READ_OUTPUT_KEY}": null.

"${READ_OUTPUT_KEY}": {
  "seen": ["string"],
  "doing": "string",
  "artefact": "${READ_ARTEFACTS.join('|')}",
  "printedText": "string",
  "peopleVisible": 0,
  "confidence": "high|low"
}

PHOTO READ RULES:
- Describe only what is visible in the photo. Do not infer what happened before or after it was taken.
- seen: at most ${READ_LIMITS.seenMax} short noun phrases (${READ_LIMITS.seenPhraseWords} words or fewer each) for the main visible things, e.g. "times-table worksheet", "pencil", "wooden blocks".
- doing: one present-tense sentence of ${READ_LIMITS.doingWords} words or fewer saying what is observably happening, e.g. "A child is writing numbers on a worksheet at a table." No evaluation (never "well", "carefully", "beautifully", "struggling"), no names.
- Never name a skill, subject, learning outcome, curriculum area, age, year level or quality of work. Those belong to the rest of this JSON, not to the Read.
- Never guess who anyone is. Say "a child" or "an adult", never a name, even if a name appears in the entry text or in the photo.
- artefact: the single best fit from the list. Use "other" when none fits.
- printedText: transcribe only a visible title, lesson name or page header, ${READ_LIMITS.printedTextWords} words or fewer. Never transcribe the body of a page, book, worksheet or screen. Use "" when there is no clear header.
- peopleVisible: how many people can be seen, including partly (hands count). 0 when none.
- confidence: "high" only when the photo is clear and you are sure of the description. Otherwise "low". When confidence is "low", set doing to "".
- The Read must stay within about 250 output tokens.`;

export function buildReadPromptSection(): string {
  return READ_PROMPT_SECTION;
}

function clampWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, maxWords).join(' ');
}

export const ReadOutputSchema = z.object({
  seen: z.array(z.unknown()).optional().default([]),
  doing: z.string().optional().default(''),
  artefact: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.enum(READ_ARTEFACTS)),
  printedText: z.string().optional().default(''),
  peopleVisible: z.number().finite().nonnegative().transform((n) => Math.floor(n)),
  confidence: z
    .string()
    .transform((s) => s.trim().toLowerCase())
    .pipe(z.enum(['high', 'low'])),
});

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function mentionsAny(text: string, names: string[]): boolean {
  return names.some((name) => new RegExp(`\\b${escapeRegExp(name)}\\b`, 'i').test(text));
}

/**
 * Validate the model's Read. Refusal, a non-object, or any structurally
 * invalid field returns null — a Read is never repaired into something the
 * model did not say. Over-long fields are truncated to the documented limits.
 *
 * `forbiddenNames` (e.g. the entry's child names) blanks `doing` and drops any
 * `seen` phrase that names one, enforcing the no-names rule after the fact.
 */
export function parseReadOutput(
  raw: unknown,
  opts: { forbiddenNames?: string[] } = {},
): ReadOutput | null {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;

  const parsed = ReadOutputSchema.safeParse(value);
  if (!parsed.success) return null;
  const r = parsed.data;

  const names = (opts.forbiddenNames ?? []).map((n) => n.trim()).filter((n) => n.length > 1);

  const seen = r.seen
    .filter((s): s is string => typeof s === 'string')
    .map((s) => clampWords(s, READ_LIMITS.seenPhraseWords))
    .filter((s) => s.length > 0 && !mentionsAny(s, names))
    .slice(0, READ_LIMITS.seenMax);

  let doing = r.confidence === 'low' ? '' : clampWords(r.doing, READ_LIMITS.doingWords);
  if (doing && mentionsAny(doing, names)) doing = '';

  return {
    seen,
    doing,
    artefact: r.artefact,
    printedText: clampWords(r.printedText, READ_LIMITS.printedTextWords),
    peopleVisible: r.peopleVisible,
    confidence: r.confidence,
  };
}
