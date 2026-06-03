import { describe, it, expect } from 'vitest';
import { aggregateModuleMaterials, withChecklistState } from './materials-aggregate';

const sampleModule = {
  approaches: [
    {
      _id: 'approach-1',
      title: 'Hands-on',
      activities: [
        {
          _id: 'act-1',
          title: 'Magnet circuit',
          materials: [
            { name: 'Paperclips', required: true },
            { name: 'Magnet', required: true, alternative: 'fridge magnet' },
            { name: 'paper', required: false },
          ],
        },
        {
          _id: 'act-2',
          title: 'Circuit drawing',
          materials: [
            { name: 'Paper', required: true }, // dup, different casing
            { name: 'Pencil', required: true },
          ],
        },
      ],
    },
  ],
};

describe('aggregateModuleMaterials', () => {
  it('flattens and dedupes by lowercased name', () => {
    const out = aggregateModuleMaterials(sampleModule);
    const names = out.map((m) => m.name);
    expect(names).toContain('Paperclips');
    expect(names).toContain('Magnet');
    expect(names).toContain('Pencil');
    // Dedup: paper / Paper merge into one entry (first-seen casing wins).
    const paperRows = out.filter((m) => m.key === 'paper');
    expect(paperRows).toHaveLength(1);
  });

  it('ORs `required` across duplicates', () => {
    const out = aggregateModuleMaterials(sampleModule);
    const paper = out.find((m) => m.key === 'paper');
    expect(paper?.required).toBe(true); // act-2 marks it required, wins over act-1 false
  });

  it('keeps the first non-empty alternative', () => {
    const out = aggregateModuleMaterials(sampleModule);
    const magnet = out.find((m) => m.key === 'magnet');
    expect(magnet?.alternative).toBe('fridge magnet');
  });

  it('tracks the originating activity', () => {
    const out = aggregateModuleMaterials(sampleModule);
    const pencil = out.find((m) => m.key === 'pencil');
    expect(pencil?.firstSeenIn.activityId).toBe('act-2');
    expect(pencil?.firstSeenIn.activityTitle).toBe('Circuit drawing');
  });

  it('sorts required-first then alphabetical', () => {
    const out = aggregateModuleMaterials({
      approaches: [
        {
          activities: [
            {
              materials: [
                { name: 'Zebra', required: false },
                { name: 'Apple', required: false },
                { name: 'Mango', required: true },
              ],
            },
          ],
        },
      ],
    });
    expect(out.map((m) => m.name)).toEqual(['Mango', 'Apple', 'Zebra']);
  });

  it('returns empty array for a module with no approaches', () => {
    expect(aggregateModuleMaterials({})).toEqual([]);
  });
});

describe('withChecklistState', () => {
  it('annotates each material with haveIt + source from state', () => {
    const state = {
      paper: { haveIt: true, source: 'home' },
      pencil: { haveIt: false },
    };
    const out = withChecklistState(sampleModule, state);
    const paper = out.find((m) => m.key === 'paper');
    const pencil = out.find((m) => m.key === 'pencil');
    const magnet = out.find((m) => m.key === 'magnet');
    expect(paper?.haveIt).toBe(true);
    expect(paper?.source).toBe('home');
    expect(pencil?.haveIt).toBe(false);
    expect(magnet?.haveIt).toBe(false);
    expect(magnet?.source).toBeNull();
  });
});
