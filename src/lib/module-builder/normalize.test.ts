/**
 * Unit tests for draft → editor rehydration. Drafts land in module_drafts in
 * two shapes (editor-shaped SharedEditData vs raw pathway entry fields), and
 * AI enrichment may have filled blanks on either. draftToEditData is what the
 * resume flow trusts to reopen any of them safely.
 */
import { describe, it, expect } from 'vitest';
import { draftDisplayTitle, draftToEditData, normalizeToEditData } from './normalize';

describe('normalizeToEditData', () => {
  it('seeds material drafts with template steps and provenance', () => {
    const out = normalizeToEditData('material', {
      resourceType: 'book',
      resourceName: 'The Secret Garden',
      usageIntents: ['read'],
    });
    expect(out.title).toBe('The Secret Garden');
    expect(out.steps.length).toBeGreaterThan(0);
    expect(out.provenance.type).toBe('sourceResource');
  });

  it('splits process whatHappens lines into steps', () => {
    const out = normalizeToEditData('process', {
      activityName: 'Sourdough',
      whatHappens: 'Mix the starter\nKnead\nBake',
    });
    expect(out.steps).toHaveLength(3);
    expect(out.steps[1].instructions).toBe('Knead');
  });
});

describe('draftToEditData', () => {
  it('passes editor-shaped drafts through with sanitized types', () => {
    const out = draftToEditData('inquiry', {
      pathway: 'inquiry',
      title: 'Why do leaves change colour?',
      targetUnderstanding: 'Seasons drive visible change',
      steps: [{ id: 's1', title: 'Observe', instructions: 'Collect leaves', observationHint: '' }],
      subjects: ['Science'],
      capabilities: [{ threadId: 'S2', confidence: 'explicit' }],
      // fields a malformed/old row might lack entirely:
    });
    expect(out.title).toBe('Why do leaves change colour?');
    expect(out.steps).toHaveLength(1);
    expect(out.capabilities).toEqual([{ threadId: 'S2', confidence: 'explicit' }]);
    expect(out.watchFor).toBe('');
    expect(out.materials).toEqual([]);
    expect(out.setting).toBe('either');
  });

  it('normalizes entry-shaped drafts the same way Continue would', () => {
    const out = draftToEditData('material', {
      resourceType: 'book',
      resourceName: 'The Secret Garden',
      usageIntents: ['read'],
      subjects: ['English'],
    });
    expect(out.title).toBe('The Secret Garden');
    expect(out.steps.length).toBeGreaterThan(0);
    expect(out.subjects).toEqual(['English']);
  });

  it('overlays AI-enriched fields onto entry-shaped drafts where blanks remain', () => {
    const out = draftToEditData('inquiry', {
      question: 'Why is the sky blue?',
      targetUnderstanding: 'Light scatters differently by wavelength',
      watchFor: 'Moments they connect colour to light',
      steps: [{ title: 'Wonder together', instructions: 'Talk about sunsets', observationHint: '' }],
    });
    expect(out.title).toBe('Why is the sky blue?');
    expect(out.targetUnderstanding).toBe('Light scatters differently by wavelength');
    expect(out.watchFor).toBe('Moments they connect colour to light');
    expect(out.steps).toHaveLength(1);
    expect(out.steps[0].id).toBe('step-0');
  });

  it('never crashes on junk rows', () => {
    const out = draftToEditData('process', { steps: 'not-an-array', title: 42 });
    expect(out.title).toBe('');
    expect(out.steps).toEqual([]);
  });
});

describe('draftDisplayTitle', () => {
  it('prefers the first present name-ish field', () => {
    expect(draftDisplayTitle('material', { resourceName: 'Planet Earth II' })).toBe('Planet Earth II');
    expect(draftDisplayTitle('inquiry', { question: 'Why do magnets stick?' })).toBe('Why do magnets stick?');
    expect(draftDisplayTitle('understanding', { goal: 'Confidence with fractions' })).toBe('Confidence with fractions');
  });

  it('falls back to a pathway label, never an empty string', () => {
    expect(draftDisplayTitle('retrospective', {})).toBe('Lifted from logs');
    expect(draftDisplayTitle('material', { resourceName: '   ' })).toBe('Resource module');
  });
});
