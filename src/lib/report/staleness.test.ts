import { describe, it, expect } from 'vitest';
import { reportEditedSinceExport } from './staleness';

const EXPORT = '2026-06-01T10:00:00.000Z';
const BEFORE = '2026-05-20T10:00:00.000Z';
const AFTER = '2026-06-05T10:00:00.000Z';

describe('reportEditedSinceExport', () => {
  it('is false when never exported (no pill before first export)', () => {
    expect(reportEditedSinceExport(null, [AFTER])).toBe(false);
    expect(reportEditedSinceExport(undefined, [AFTER])).toBe(false);
  });

  it('is true when any content was updated after the last export', () => {
    expect(reportEditedSinceExport(EXPORT, [BEFORE, AFTER])).toBe(true);
  });

  it('is false when all content predates (or equals) the last export', () => {
    expect(reportEditedSinceExport(EXPORT, [BEFORE, EXPORT])).toBe(false);
  });

  it('ignores null/undefined/malformed timestamps without false positives', () => {
    expect(reportEditedSinceExport(EXPORT, [null, undefined, 'not-a-date'])).toBe(false);
    expect(reportEditedSinceExport(EXPORT, [null, AFTER])).toBe(true);
  });

  it('is false when the lastExportedAt itself is malformed', () => {
    expect(reportEditedSinceExport('garbage', [AFTER])).toBe(false);
  });

  it('is false on empty content', () => {
    expect(reportEditedSinceExport(EXPORT, [])).toBe(false);
  });
});
