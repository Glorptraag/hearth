/**
 * Unit tests for the snapshot-backed active-thread derivation used by
 * assembleContext (enrich.ts). The helper is pure; module mocks below only
 * exist so importing enrich.ts doesn't boot the DB or Sanity.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('../snapshot-rebuild', () => ({ rebuildSnapshot: vi.fn() }));
vi.mock('../pedagogy-context', () => ({
  buildPedagogyContextWithSources: vi.fn(async () => ({ prompt: '', sources: [] })),
}));
vi.mock('@/lib/sanity/client', () => ({ sanityClient: { fetch: vi.fn() }, sanityServerClient: { fetch: vi.fn() } }));
vi.mock('../dlo-cache', () => ({ getValidDlos: vi.fn(async () => ({ ids: new Set(), tierById: new Map(), descriptorById: new Map() })) }));

import { snapshotActiveThreadIds } from '../enrich';
import type { SnapshotData, SnapshotActiveThread } from '@/types/snapshot';

function thread(partial: Partial<SnapshotActiveThread> & { thread_id: string }): SnapshotActiveThread {
  return {
    thread_name: partial.thread_id,
    observation_count: 1,
    last_evidence_date: '2026-01-01',
    suggested_tier: 'emerging',
    current_badge_level: null,
    next_badge: null,
    next_badge_progress: 0,
    trajectory: 'new',
    recent_evidence_quality: 'weak',
    ...partial,
  };
}

function snapshotWith(learnerId: string, rows: SnapshotActiveThread[]): SnapshotData {
  return {
    children: { [learnerId]: { active_threads: rows } },
  } as unknown as SnapshotData;
}

describe('snapshotActiveThreadIds', () => {
  it('returns [] with no snapshot or no block for the learner', () => {
    expect(snapshotActiveThreadIds(null, 'kid')).toEqual([]);
    expect(snapshotActiveThreadIds(undefined, 'kid')).toEqual([]);
    expect(snapshotActiveThreadIds(snapshotWith('other', [thread({ thread_id: 'L1' })]), 'kid')).toEqual([]);
  });

  it('orders most-recently-evidenced first, then by observation volume', () => {
    const snap = snapshotWith('kid', [
      thread({ thread_id: 'M1', observation_count: 12, last_evidence_date: '2026-09-01' }),
      thread({ thread_id: 'L3', observation_count: 3, last_evidence_date: '2026-10-01' }),
      thread({ thread_id: 'S1', observation_count: 7, last_evidence_date: '2026-09-01' }),
    ]);
    expect(snapshotActiveThreadIds(snap, 'kid')).toEqual(['L3', 'M1', 'S1']);
  });

  it('drops ids outside the canonical thread set', () => {
    const snap = snapshotWith('kid', [
      thread({ thread_id: 'L1' }),
      thread({ thread_id: 'capabilityThread.L2' }),
      thread({ thread_id: 'ZZ9' }),
    ]);
    expect(snapshotActiveThreadIds(snap, 'kid')).toEqual(['L1']);
  });
});
