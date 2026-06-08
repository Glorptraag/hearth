/**
 * Portfolio "By Thread" grouping — the default view groups each entry under its
 * highest-confidence capability thread (replacing the dead `suggested_thread`
 * read that sent everything to "Uncategorized").
 */
import { describe, it, expect } from 'vitest';
import {
  topThreadId,
  threadGroupName,
  groupEntriesByTopThread,
  UNCATEGORIZED_GROUP,
  THREAD_DISPLAY_CONFIDENCE_FLOOR,
} from './thread-grouping';

const ct = (thread_id: string, confidence: number) => ({ thread_id, confidence });
const entry = (...threads: { thread_id: string; confidence: number }[]) => ({
  aiEnrichment: { capability_threads: threads },
});

describe('topThreadId', () => {
  it('picks the highest-confidence qualifying thread', () => {
    expect(topThreadId([ct('M1', 0.6), ct('L3', 0.9), ct('S1', 0.7)])).toBe('L3');
  });

  it('returns null for no threads', () => {
    expect(topThreadId([])).toBeNull();
    expect(topThreadId(undefined)).toBeNull();
    expect(topThreadId(null)).toBeNull();
  });

  it('returns null when every thread is below the floor', () => {
    expect(topThreadId([ct('M1', 0.2), ct('L3', 0.49)])).toBeNull();
  });

  it('ignores below-floor threads even when they are the most numerous', () => {
    expect(topThreadId([ct('M1', 0.3), ct('M1', 0.3), ct('L3', 0.55)])).toBe('L3');
  });

  it('includes a thread exactly at the floor', () => {
    expect(topThreadId([ct('M2', THREAD_DISPLAY_CONFIDENCE_FLOOR)])).toBe('M2');
  });

  it('resolves a confidence tie to the first thread in array order (stable)', () => {
    expect(topThreadId([ct('M1', 0.8), ct('L3', 0.8)])).toBe('M1');
    expect(topThreadId([ct('L3', 0.8), ct('M1', 0.8)])).toBe('L3');
  });

  it('honours a custom floor', () => {
    expect(topThreadId([ct('M1', 0.4)], 0.3)).toBe('M1');
    expect(topThreadId([ct('M1', 0.4)], 0.5)).toBeNull();
  });
});

describe('threadGroupName', () => {
  it('maps the top thread id to its display name', () => {
    expect(threadGroupName([ct('M1', 0.9)])).toBe('Number Sense');
  });

  it('falls back to Uncategorized when nothing qualifies', () => {
    expect(threadGroupName([])).toBe(UNCATEGORIZED_GROUP);
    expect(threadGroupName([ct('M1', 0.1)])).toBe(UNCATEGORIZED_GROUP);
  });
});

describe('groupEntriesByTopThread', () => {
  it('groups each entry under exactly one (top) thread', () => {
    const groups = groupEntriesByTopThread([
      entry(ct('M1', 0.9)),
      entry(ct('M1', 0.6), ct('L3', 0.95)), // top is L3
      entry(ct('M1', 0.8)),
    ]);
    const map = new Map(groups);
    expect(map.get('Number Sense')).toHaveLength(2);
    expect(map.get('Reading Comprehension')).toHaveLength(1);
    // entries map to one group: totals sum to the entry count
    expect(groups.reduce((n, [, es]) => n + es.length, 0)).toBe(3);
  });

  it('sorts groups by entry count descending', () => {
    const groups = groupEntriesByTopThread([
      entry(ct('L3', 0.9)),
      entry(ct('M1', 0.9)),
      entry(ct('M1', 0.9)),
      entry(ct('M1', 0.9)),
    ]);
    expect(groups[0][0]).toBe('Number Sense');
    expect(groups[0][1]).toHaveLength(3);
    expect(groups[1][0]).toBe('Reading Comprehension');
  });

  it('buckets entries with no qualifying thread under Uncategorized', () => {
    const groups = groupEntriesByTopThread([
      entry(),
      entry(ct('M1', 0.2)),
      entry(ct('S1', 0.7)),
    ]);
    const map = new Map(groups);
    expect(map.get(UNCATEGORIZED_GROUP)).toHaveLength(2);
    expect(map.get('Scientific Inquiry')).toHaveLength(1);
  });

  it('tolerates a missing aiEnrichment', () => {
    const groups = groupEntriesByTopThread([{ aiEnrichment: null }, {}]);
    expect(new Map(groups).get(UNCATEGORIZED_GROUP)).toHaveLength(2);
  });
});
