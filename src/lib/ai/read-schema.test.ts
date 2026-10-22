import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseReadOutput,
  buildReadPromptSection,
  READ_PROMPT_VERSION,
  READ_OUTPUT_KEY,
  READ_LIMITS,
} from './read-schema';

const valid = {
  seen: ['times-table worksheet', 'pencil', 'kitchen table'],
  doing: 'A child is writing numbers on a worksheet at a table.',
  artefact: 'worksheet',
  printedText: 'Lesson 12: Multiplying by 3',
  peopleVisible: 1,
  confidence: 'high',
};

const words = (n: number, w = 'word') => Array.from({ length: n }, (_, i) => `${w}${i}`).join(' ');

describe('parseReadOutput — valid input', () => {
  it('returns a well-formed Read unchanged', () => {
    expect(parseReadOutput(valid)).toEqual(valid);
  });

  it('accepts a JSON string', () => {
    expect(parseReadOutput(JSON.stringify(valid))).toEqual(valid);
  });

  it('normalises artefact and confidence case', () => {
    const r = parseReadOutput({ ...valid, artefact: ' Book ', confidence: 'HIGH' });
    expect(r?.artefact).toBe('book');
    expect(r?.confidence).toBe('high');
  });

  it('floors a fractional peopleVisible', () => {
    expect(parseReadOutput({ ...valid, peopleVisible: 2.7 })?.peopleVisible).toBe(2);
  });

  it('defaults missing seen / doing / printedText to empty, never invented', () => {
    const r = parseReadOutput({ artefact: 'nature', peopleVisible: 0, confidence: 'high' });
    expect(r).toEqual({
      seen: [],
      doing: '',
      artefact: 'nature',
      printedText: '',
      peopleVisible: 0,
      confidence: 'high',
    });
  });

  it('blanks doing when confidence is low', () => {
    const r = parseReadOutput({ ...valid, confidence: 'low' });
    expect(r?.doing).toBe('');
    expect(r?.seen).toEqual(valid.seen);
  });
});

describe('parseReadOutput — truncation', () => {
  it('keeps at most 8 seen phrases', () => {
    const seen = Array.from({ length: 12 }, (_, i) => `thing ${i}`);
    const r = parseReadOutput({ ...valid, seen });
    expect(r?.seen).toHaveLength(READ_LIMITS.seenMax);
    expect(r?.seen[0]).toBe('thing 0');
  });

  it('clamps each seen phrase to 6 words and drops empty / non-string items', () => {
    const r = parseReadOutput({ ...valid, seen: [words(10), '   ', 42, null, 'pencil'] });
    expect(r?.seen).toEqual([words(6), 'pencil']);
  });

  it('clamps doing to 20 words', () => {
    const r = parseReadOutput({ ...valid, doing: words(35) });
    expect(r?.doing.split(' ')).toHaveLength(READ_LIMITS.doingWords);
  });

  it('clamps printedText to 12 words so page body never survives', () => {
    const r = parseReadOutput({ ...valid, printedText: words(80) });
    expect(r?.printedText.split(' ')).toHaveLength(READ_LIMITS.printedTextWords);
  });

  it('collapses internal whitespace', () => {
    expect(parseReadOutput({ ...valid, doing: '  A child   is\nbuilding.  ' })?.doing).toBe(
      'A child is building.',
    );
  });
});

describe('parseReadOutput — refusal and invalid output', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['refusal prose', "I'm sorry, I can't describe people in this image."],
    ['malformed JSON string', '{"seen": ['],
    ['array', [valid]],
    ['number', 3],
    ['empty object', {}],
  ])('returns null for %s', (_label, raw) => {
    expect(parseReadOutput(raw)).toBeNull();
  });

  it('returns null for an artefact outside the enum', () => {
    expect(parseReadOutput({ ...valid, artefact: 'maths' })).toBeNull();
  });

  it('returns null for a confidence outside high|low', () => {
    expect(parseReadOutput({ ...valid, confidence: 0.9 })).toBeNull();
    expect(parseReadOutput({ ...valid, confidence: 'medium' })).toBeNull();
  });

  it('returns null for a negative or non-numeric peopleVisible', () => {
    expect(parseReadOutput({ ...valid, peopleVisible: -1 })).toBeNull();
    expect(parseReadOutput({ ...valid, peopleVisible: '2' })).toBeNull();
    expect(parseReadOutput({ ...valid, peopleVisible: Number.NaN })).toBeNull();
  });

  it('returns null when a required field is missing', () => {
    const noArtefact: Record<string, unknown> = { ...valid };
    delete noArtefact.artefact;
    expect(parseReadOutput(noArtefact)).toBeNull();
  });

  it('returns null when doing is not a string', () => {
    expect(parseReadOutput({ ...valid, doing: ['writing'] })).toBeNull();
  });
});

describe('parseReadOutput — forbidden names', () => {
  it('blanks doing and drops seen phrases that name a child', () => {
    const r = parseReadOutput(
      {
        ...valid,
        doing: 'Mia is writing numbers on a worksheet.',
        seen: ["Mia's drawing", 'pencil', 'MIA name tag'],
      },
      { forbiddenNames: ['Mia', 'Tom'] },
    );
    expect(r?.doing).toBe('');
    expect(r?.seen).toEqual(['pencil']);
  });

  it('matches whole words only', () => {
    const r = parseReadOutput(
      { ...valid, doing: 'A child is using a tomato as a counter.', seen: ['tomato'] },
      { forbiddenNames: ['Tom'] },
    );
    expect(r?.doing).toBe('A child is using a tomato as a counter.');
    expect(r?.seen).toEqual(['tomato']);
  });

  it('leaves printedText alone (titles can contain names)', () => {
    const r = parseReadOutput({ ...valid, printedText: "Charlotte's Web" }, { forbiddenNames: ['Charlotte'] });
    expect(r?.printedText).toBe("Charlotte's Web");
  });
});

describe('buildReadPromptSection', () => {
  const section = buildReadPromptSection();

  it('names the output key and every artefact', () => {
    expect(section).toContain(`"${READ_OUTPUT_KEY}"`);
    expect(section).toContain('worksheet|book|writing|drawing|build|nature|cooking|screen|other');
  });

  it('carries the safety rules', () => {
    expect(section).toMatch(/only what is visible/i);
    expect(section).toMatch(/Never name a skill, subject, learning outcome/);
    expect(section).toMatch(/Never guess who anyone is/);
    expect(section).toMatch(/Never transcribe the body/);
    expect(section).toMatch(/When confidence is "low", set doing to ""/);
  });

  it('is mirrored verbatim in read.prompt.md, with a matching version', () => {
    const md = readFileSync(join(__dirname, 'read.prompt.md'), 'utf8');
    const header = md.split('\n')[0];
    expect(header).toContain(`Version: ${READ_PROMPT_VERSION} |`);
    const body = md.match(/<!-- BEGIN PROMPT -->\n([\s\S]*?)\n<!-- END PROMPT -->/)?.[1];
    expect(body).toBe(section);
  });
});
