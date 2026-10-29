/**
 * What the Confirm surface may take from a Photo Read (W3.3). The draft row
 * exists only when there is a valid Read with a sentence AND the parent wrote
 * no words; the Working-from chip only when the photo had a printed header.
 */
import { describe, expect, it } from 'vitest';
import { confirmReadFor, workingFromLabel } from './read-draft';

const READ = {
  seen: ['worksheet'],
  doing: 'A child is writing numbers on a worksheet.',
  artefact: 'worksheet',
  printedText: 'Math-U-See Alpha Lesson 12',
  peopleVisible: 1,
  confidence: 'high',
  promptVersion: 'read-v1',
};

describe('confirmReadFor', () => {
  it('offers the draft and the header on a photo-only entry', () => {
    expect(confirmReadFor({ readOutput: READ, description: '', draftedBy: 'parent' })).toEqual({
      draft: READ.doing,
      printedText: READ.printedText,
    });
  });

  it('never offers a draft over the parent’s own words, but keeps the header', () => {
    expect(confirmReadFor({ readOutput: READ, description: 'We did maths.', draftedBy: 'parent' })).toEqual({
      draft: null,
      printedText: READ.printedText,
    });
  });

  it('offers no second draft once one was taken', () => {
    expect(confirmReadFor({ readOutput: READ, description: READ.doing, draftedBy: 'read' })?.draft).toBeNull();
  });

  it('is null with no Read, an invalid Read, or nothing to offer', () => {
    expect(confirmReadFor(null)).toBeNull();
    expect(confirmReadFor({ readOutput: null, description: '' })).toBeNull();
    expect(confirmReadFor({ readOutput: { doing: 'x' }, description: '' })).toBeNull();
    expect(
      confirmReadFor({ readOutput: { ...READ, doing: '', printedText: '', confidence: 'low' }, description: '' }),
    ).toBeNull();
  });

  it('a low-confidence Read offers no sentence (parseReadOutput blanks it)', () => {
    expect(confirmReadFor({ readOutput: { ...READ, confidence: 'low' }, description: '' })).toEqual({
      draft: null,
      printedText: READ.printedText,
    });
  });
});

describe('workingFromLabel', () => {
  it('names the resource, its level and lesson', () => {
    expect(workingFromLabel('Math-U-See', 'Alpha', '12')).toBe('Math-U-See Alpha · Lesson 12');
    expect(workingFromLabel('Math-U-See', 'Alpha', null)).toBe('Math-U-See Alpha');
    expect(workingFromLabel('My own plan')).toBe('My own plan');
    expect(workingFromLabel('All About Reading', 'Level 1', 3)).toBe('All About Reading Level 1 · Lesson 3');
  });

  it('does not repeat a level already in the title', () => {
    expect(workingFromLabel('Story of the World Volume 1', 'Volume 1', '4')).toBe('Story of the World Volume 1 · Lesson 4');
  });
});
