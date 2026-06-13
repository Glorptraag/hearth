import { describe, it, expect } from 'vitest';
import { resolveExportSlotData, type ExportSlotEntry } from './export-slots';

const SLOTS = [
  { area: 'english', label: 'Early Writing' },
  { area: 'mathematics', label: 'Early Maths' },
];
const KEY_MAP = { early_writing: 0, early_maths: 1 };

const entries: ExportSlotEntry[] = [
  { id: 'e1', title: 'Recount of the marble run' },
  { id: 'e2', title: 'Counting to 100' },
];

describe('resolveExportSlotData', () => {
  it('leaves a slot Empty with no persisted entry — never auto-matches', () => {
    // No DB samples at all → both slots Empty, even though `entries` could match.
    const resolved = resolveExportSlotData(SLOTS, KEY_MAP, [], entries);
    expect(resolved).toEqual([
      { area: 'english', label: 'Early Writing', entryTitle: '—', status: 'Empty' },
      { area: 'mathematics', label: 'Early Maths', entryTitle: '—', status: 'Empty' },
    ]);
  });

  it('fills a slot only from its persisted DB sample', () => {
    const resolved = resolveExportSlotData(
      SLOTS,
      KEY_MAP,
      [{ slot: 'early_writing', entryId: 'e1', annotation: null }],
      entries,
    );
    expect(resolved[0]).toEqual({ area: 'english', label: 'Early Writing', entryTitle: 'Recount of the marble run', status: 'Selected' });
    expect(resolved[1].status).toBe('Empty'); // untouched
  });

  it('marks a slot Confirmed when its annotation is confirmed', () => {
    const resolved = resolveExportSlotData(
      SLOTS,
      KEY_MAP,
      [{ slot: 'early_maths', entryId: 'e2', annotation: { confirmedAt: new Date('2026-06-01') } }],
      entries,
    );
    expect(resolved[1].status).toBe('Confirmed');
    expect(resolved[1].entryTitle).toBe('Counting to 100');
  });

  it('ignores a DB sample with no entryId (cleared slot stays Empty)', () => {
    const resolved = resolveExportSlotData(
      SLOTS,
      KEY_MAP,
      [{ slot: 'early_writing', entryId: null, annotation: null }],
      entries,
    );
    expect(resolved[0].status).toBe('Empty');
    expect(resolved[0].entryTitle).toBe('—');
  });

  it('ignores a sample whose entry no longer exists', () => {
    const resolved = resolveExportSlotData(
      SLOTS,
      KEY_MAP,
      [{ slot: 'early_writing', entryId: 'deleted', annotation: null }],
      entries,
    );
    expect(resolved[0].status).toBe('Empty');
  });
});
