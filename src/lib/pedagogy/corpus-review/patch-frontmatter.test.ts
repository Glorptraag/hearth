import { describe, it, expect } from 'vitest';
import { setSuggestedDraftFalse } from './patch-frontmatter';

describe('setSuggestedDraftFalse', () => {
  it('replaces an existing `suggestedDraft: true` line in place', () => {
    const raw = [
      '---',
      'id: montessori.004',
      'tags: [work_cycle, praise]',
      'status: published',
      'suggestedDraft: true',
      '---',
      '',
      '## Scenario',
      '',
      'Body text.',
      '',
    ].join('\n');

    const updated = setSuggestedDraftFalse(raw);

    expect(updated).toBe(
      [
        '---',
        'id: montessori.004',
        'tags: [work_cycle, praise]',
        'status: published',
        'suggestedDraft: false',
        '---',
        '',
        '## Scenario',
        '',
        'Body text.',
        '',
      ].join('\n')
    );
  });

  it('inserts a new line right after `status:` when the key is absent', () => {
    const raw = ['---', 'id: us.001', 'tags: [a, b]', 'status: published', '---', '', '## Trigger', '', 'x'].join(
      '\n'
    );

    const updated = setSuggestedDraftFalse(raw);
    const lines = updated.split('\n');

    expect(lines).toEqual([
      '---',
      'id: us.001',
      'tags: [a, b]',
      'status: published',
      'suggestedDraft: false',
      '---',
      '',
      '## Trigger',
      '',
      'x',
    ]);
  });

  it('inserts before the closing delimiter when there is no `status:` line', () => {
    const raw = ['---', 'id: us.001', '---', ''].join('\n');
    const updated = setSuggestedDraftFalse(raw);
    expect(updated.split('\n')).toEqual(['---', 'id: us.001', 'suggestedDraft: false', '---', '']);
  });

  it('touches nothing else in the file', () => {
    const raw = [
      '---',
      'id: cm.021',
      'source: cm-home-education-1906',
      'pageOrChapter: "Part I, p. 12"',
      'isParaphrase: false',
      'tags:',
      '  - habit',
      '  - atmosphere',
      'status: published',
      'suggestedDraft: true',
      '---',
      '',
      '## Text',
      '',
      'Some verbatim text with "quotes" and — an em dash.',
      '',
    ].join('\n');

    const updated = setSuggestedDraftFalse(raw);
    const originalLines = raw.split('\n');
    const updatedLines = updated.split('\n');

    expect(updatedLines).toHaveLength(originalLines.length);
    for (let i = 0; i < originalLines.length; i++) {
      if (originalLines[i] === 'suggestedDraft: true') {
        expect(updatedLines[i]).toBe('suggestedDraft: false');
      } else {
        expect(updatedLines[i]).toBe(originalLines[i]);
      }
    }
  });

  it('rejects a file with no frontmatter delimiter', () => {
    expect(() => setSuggestedDraftFalse('# Just markdown')).toThrow(/must start/);
  });

  it('rejects a file missing the closing delimiter', () => {
    expect(() => setSuggestedDraftFalse(['---', 'id: a'].join('\n'))).toThrow(/closing/);
  });
});
