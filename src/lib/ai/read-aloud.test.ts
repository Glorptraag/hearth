import { describe, it, expect } from 'vitest';
import {
  portableTextToPlainText,
  toNarrationText,
  readAloudToNarration,
  splitForTts,
} from './read-aloud';

const block = (text: string) => ({
  _type: 'block',
  children: [{ _type: 'span', text }],
});

describe('portableTextToPlainText', () => {
  it('joins block children and separates paragraphs with blank lines', () => {
    expect(portableTextToPlainText([block('First line.'), block('Second line.')])).toBe(
      'First line.\n\nSecond line.'
    );
  });

  it('concatenates multiple spans within a block', () => {
    expect(
      portableTextToPlainText([
        { _type: 'block', children: [{ _type: 'span', text: 'Hello ' }, { _type: 'span', text: 'world' }] },
      ])
    ).toBe('Hello world');
  });

  it('returns empty string for nullish or non-array input', () => {
    expect(portableTextToPlainText(undefined)).toBe('');
    expect(portableTextToPlainText(null)).toBe('');
    expect(portableTextToPlainText([])).toBe('');
  });

  it('ignores empty / malformed blocks', () => {
    expect(portableTextToPlainText([block(''), block('Kept.'), 'junk' as unknown as object])).toBe('Kept.');
  });
});

describe('toNarrationText — delivery directions', () => {
  it('strips a standalone pacing cue', () => {
    expect(toNarrationText('He ran far ahead. (pause)')).toBe('He ran far ahead.');
  });

  it('strips directions with an em-dash', () => {
    expect(toNarrationText('they comfort me. (pause — this is the heart of the psalm)')).toBe(
      'they comfort me.'
    );
  });

  it('strips multi-word and adverbial directions', () => {
    expect(toNarrationText('for ever. (slowly, with weight)')).toBe('for ever.');
    expect(toNarrationText('the goal! (with surprise)')).toBe('the goal!');
  });
});

describe('toNarrationText — pronunciation glosses', () => {
  it('replaces an archaic word with its single-word gloss', () => {
    expect(toNarrationText('He maketh (makes) me to lie down')).toBe('He makes me to lie down');
  });

  it('replaces with a two-word gloss', () => {
    expect(toNarrationText('thou anointest (you anoint) my head')).toBe('thou you anoint my head');
  });

  it('handles back-to-back glosses', () => {
    expect(toNarrationText('Thou (you) art with thy (your) staff')).toBe('you art with your staff');
  });
});

describe('readAloudToNarration', () => {
  it('flattens Portable Text and normalises cues end to end', () => {
    const blocks = [
      block('He maketh (makes) me to lie down in green pastures. (pause)'),
      block('Yea (yes), though I walk through the valley.'),
    ];
    expect(readAloudToNarration(blocks)).toBe(
      'He makes me to lie down in green pastures.\n\nyes, though I walk through the valley.'
    );
  });
});

describe('splitForTts', () => {
  it('returns a single chunk when under the limit', () => {
    expect(splitForTts('Short text.')).toEqual(['Short text.']);
  });

  it('returns nothing for empty input', () => {
    expect(splitForTts('   ')).toEqual([]);
  });

  it('splits on paragraph boundaries and keeps every chunk under the limit', () => {
    const para = 'A'.repeat(120);
    const text = Array.from({ length: 10 }, () => para).join('\n\n');
    const chunks = splitForTts(text, 300);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(300);
    // No content lost (ignoring the join whitespace).
    expect(chunks.join('').replace(/\s/g, '').length).toBe(text.replace(/\s/g, '').length);
  });

  it('hard-wraps a single oversized sentence', () => {
    const giant = 'x'.repeat(500);
    const chunks = splitForTts(giant, 200);
    expect(chunks.every((c) => c.length <= 200)).toBe(true);
  });
});
