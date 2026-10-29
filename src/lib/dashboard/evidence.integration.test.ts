/**
 * INTEGRATION: the Dashboard's evidence reads (W5.3, HC-1c) against real Postgres.
 *
 *   - learner_dlo_status rows are grouped per child, and another family's rows
 *     never leak in (the caller passes only its own learner ids).
 *   - only a parent assertion (provenance 'asserted', no observation) counts
 *     as a confirmed chip.
 *   - the 14-day thread counts include only observed links inside the window.
 */
import { describe, expect, it } from 'vitest';
import { subDays } from 'date-fns';
import { db } from '@/lib/db';
import { learnerDloStatus } from '@/lib/db/schema';
import { createDloLink, createEntry, createFamily, createLearner } from '@/test/db-factories';
import { loadDashboardEvidence } from './evidence';

describe('INTEGRATION: loadDashboardEvidence', () => {
  it('returns empty evidence for no learners', async () => {
    const out = await loadDashboardEvidence([]);
    expect(out.statusRowsByLearner).toEqual({});
    expect(out.assertedKeys.size).toBe(0);
    expect(out.threadLogCounts14d).toEqual({});
  });

  it('groups status per child, reads parent assertions, and counts recent observed links per thread', async () => {
    const now = new Date('2026-10-26T09:00:00Z');
    const family = await createFamily(db);
    const sam = await createLearner(db, { familyId: family.id, name: 'Sam' });
    const ivy = await createLearner(db, { familyId: family.id, name: 'Ivy' });
    const entry = await createEntry(db, { familyId: family.id, learnerIds: [sam.id, ivy.id] });

    const other = await createFamily(db, { clerkUserId: 'user_other_family' });
    const stranger = await createLearner(db, { familyId: other.id });

    await db.insert(learnerDloStatus).values([
      { learnerId: sam.id, dloId: 'dlo.M1.emerging', status: 'emerging' },
      { learnerId: ivy.id, dloId: 'dlo.M1.developing', status: 'developing' },
      { learnerId: stranger.id, dloId: 'dlo.L1.emerging', status: 'emerging' },
    ]);

    const recent = subDays(now, 2);
    await createDloLink(db, { observationId: entry.id, learnerId: sam.id, dloId: 'dlo.M1.emerging', createdAt: recent });
    await createDloLink(db, { observationId: entry.id, learnerId: ivy.id, dloId: 'dlo.M1.developing', tier: 'developing', createdAt: recent });
    await createDloLink(db, { observationId: entry.id, learnerId: sam.id, dloId: 'dlo.L1.emerging', createdAt: recent });
    // Outside the window, an opportunity, and another family: none count.
    await createDloLink(db, { observationId: entry.id, learnerId: sam.id, dloId: 'dlo.L2.emerging', createdAt: subDays(now, 20) });
    await createDloLink(db, { observationId: entry.id, learnerId: sam.id, dloId: 'dlo.L4.emerging', evidenceState: 'opportunity', createdAt: recent });
    // A parent assertion: no observation, provenance 'asserted'.
    await createDloLink(db, {
      observationId: null,
      learnerId: ivy.id,
      dloId: 'dlo.M1.developing',
      tier: 'developing',
      provenance: 'asserted',
      createdAt: subDays(now, 30),
    });

    const out = await loadDashboardEvidence([sam.id, ivy.id], now);

    expect(out.statusRowsByLearner[sam.id]).toEqual([{ dloId: 'dlo.M1.emerging', status: 'emerging' }]);
    expect(out.statusRowsByLearner[ivy.id]).toEqual([{ dloId: 'dlo.M1.developing', status: 'developing' }]);
    expect(out.statusRowsByLearner[stranger.id]).toBeUndefined();

    expect([...out.assertedKeys]).toEqual([`${ivy.id}:dlo.M1.developing`]);

    expect(out.threadLogCounts14d).toEqual({ M1: 2, L1: 1 });
  });
});
