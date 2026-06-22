import { describe, it, expect } from 'vitest';
import { resolveExportSlotData, resolveScreenSlots, type ExportSlotEntry } from './export-slots';

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

describe('resolveScreenSlots', () => {
  const SCREEN_SLOTS = [
    { slotKey: 'early_writing', area: 'english', label: 'Early Writing', termHalf: 'early' as const },
    { slotKey: 'early_maths', area: 'mathematics', label: 'Early Maths', termHalf: 'early' as const },
  ];
  // An entry that WOULD auto-match early_writing by subject+date under the old
  // fallback — the regression guard proves it never leaks back in.
  const screenEntries = [
    { id: 'e1', title: 'Recount', subjects: ['english'], dateOccurred: '2026-03-01', evidenceUrls: ['x'] },
    { id: 'e2', title: 'Counting', subjects: ['mathematics'], dateOccurred: '2026-03-02', evidenceUrls: [] },
  ];

  it('returns Empty for an unselected slot — NEVER auto-matches a subject/date candidate', () => {
    const r = resolveScreenSlots(SCREEN_SLOTS, [], screenEntries);
    expect(r.map((s) => s.status)).toEqual(['empty', 'empty']);
    expect(r.every((s) => s.matchedEntry === null)).toBe(true);
  });

  it('fills a slot only from its persisted DB entry and maps status (selected→partial)', () => {
    const r = resolveScreenSlots(
      SCREEN_SLOTS,
      [{ slot: 'early_writing', entryId: 'e1', status: 'selected' }],
      screenEntries,
    );
    expect(r[0].matchedEntry?.id).toBe('e1');
    expect(r[0].status).toBe('partial');
    expect(r[1].status).toBe('empty'); // untouched
  });

  it('maps complete/annotated DB status to complete', () => {
    const r = resolveScreenSlots(
      SCREEN_SLOTS,
      [
        { slot: 'early_writing', entryId: 'e1', status: 'complete' },
        { slot: 'early_maths', entryId: 'e2', status: 'annotated' },
      ],
      screenEntries,
    );
    expect(r[0].status).toBe('complete');
    expect(r[1].status).toBe('complete');
  });

  it('treats a selected-but-deleted entry as empty (parity with export)', () => {
    const r = resolveScreenSlots(
      SCREEN_SLOTS,
      [{ slot: 'early_writing', entryId: 'gone', status: 'selected' }],
      screenEntries,
    );
    expect(r[0].status).toBe('empty');
    expect(r[0].matchedEntry).toBeNull();
  });

  it('preserves the slot config + carries the dbSample through', () => {
    const sample = { slot: 'early_writing', entryId: 'e1', status: 'selected' };
    const r = resolveScreenSlots(SCREEN_SLOTS, [sample], screenEntries);
    expect(r[0].label).toBe('Early Writing');
    expect(r[0].dbSample).toBe(sample);
    expect(r[1].dbSample).toBeNull();
  });
});
