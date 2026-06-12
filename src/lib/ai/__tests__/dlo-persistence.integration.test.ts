/**
 * INTEGRATION: DLO persistence against a real Neon branch.
 *
 * Verifies the rollup arithmetic in persistDloLinks against the actual DB:
 *   - inserts observation_dlo_links per learner × dlo
 *   - upserts learner_dlo_status with the correct aggregated status
 *
 * Aggregation policy (mirrors dlo-persistence.ts):
 *   ≥1 demonstrating → 'demonstrating'
 *   else ≥2 developing → 'developing'
 *   else ≥1 emerging  → 'emerging'
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { learnerDloStatus, observationDloLinks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createFamily, createLearner, createEntry } from '@/test/db-factories';
import { persistDloLinks } from '../dlo-persistence';

vi.mock('../dlo-cache', () => ({
  getValidDlos: vi.fn(async () => ({
    ids: new Set(['dlo.M1.emerging', 'dlo.M1.developing', 'dlo.M1.demonstrating']),
    tierById: new Map<string, 'emerging' | 'developing' | 'demonstrating'>([
      ['dlo.M1.emerging', 'emerging'],
      ['dlo.M1.developing', 'developing'],
      ['dlo.M1.demonstrating', 'demonstrating'],
    ]),
    descriptorById: new Map<string, string>([
      ['dlo.M1.emerging', 'Counts objects with one-to-one correspondence.'],
      ['dlo.M1.developing', 'Uses skip counting purposefully.'],
      ['dlo.M1.demonstrating', 'Composes and decomposes numbers flexibly.'],
    ]),
  })),
}));

beforeEach(() => vi.clearAllMocks());

describe('INTEGRATION: persistDloLinks', () => {
  it('inserts links and computes status=emerging from a single emerging observation', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const entry = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });

    await persistDloLinks({
      entryId: entry.id,
      learnerIds: [learner.id],
      dlos: [{ dlo_id: 'dlo.M1.emerging', tier: 'emerging', confidence: 0.8 }],
      observedAt: new Date(),
    });

    const links = await db
      .select()
      .from(observationDloLinks)
      .where(eq(observationDloLinks.observationId, entry.id));
    expect(links).toHaveLength(1);
    expect(links[0].tier).toBe('emerging');

    const [status] = await db
      .select()
      .from(learnerDloStatus)
      .where(
        and(
          eq(learnerDloStatus.learnerId, learner.id),
          eq(learnerDloStatus.dloId, 'dlo.M1.emerging'),
        ),
      );
    expect(status.status).toBe('emerging');
  });

  it('promotes to developing once two developing-tier observations have landed', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const e1 = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });
    const e2 = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });

    await persistDloLinks({
      entryId: e1.id,
      learnerIds: [learner.id],
      dlos: [{ dlo_id: 'dlo.M1.developing', tier: 'developing', confidence: 0.7 }],
      observedAt: new Date(),
    });

    let [status] = await db
      .select()
      .from(learnerDloStatus)
      .where(eq(learnerDloStatus.learnerId, learner.id));
    // 1 developing only — does not yet meet the ≥2 threshold.
    expect(status.status).toBe('not-started');

    await persistDloLinks({
      entryId: e2.id,
      learnerIds: [learner.id],
      dlos: [{ dlo_id: 'dlo.M1.developing', tier: 'developing', confidence: 0.75 }],
      observedAt: new Date(),
    });

    [status] = await db
      .select()
      .from(learnerDloStatus)
      .where(eq(learnerDloStatus.learnerId, learner.id));
    expect(status.status).toBe('developing');
  });

  it('a single demonstrating observation jumps straight to demonstrating', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const entry = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });

    await persistDloLinks({
      entryId: entry.id,
      learnerIds: [learner.id],
      dlos: [{ dlo_id: 'dlo.M1.demonstrating', tier: 'demonstrating', confidence: 0.9 }],
      observedAt: new Date(),
    });

    const [status] = await db
      .select()
      .from(learnerDloStatus)
      .where(eq(learnerDloStatus.learnerId, learner.id));
    expect(status.status).toBe('demonstrating');
  });

  it('writes a link row per learner on a multi-learner entry', async () => {
    const family = await createFamily(db);
    const a = await createLearner(db, { familyId: family.id, name: 'A' });
    const b = await createLearner(db, { familyId: family.id, name: 'B' });
    const entry = await createEntry(db, { familyId: family.id, learnerIds: [a.id, b.id] });

    await persistDloLinks({
      entryId: entry.id,
      learnerIds: [a.id, b.id],
      dlos: [{ dlo_id: 'dlo.M1.emerging', tier: 'emerging', confidence: 0.6 }],
      observedAt: new Date(),
    });

    const links = await db
      .select()
      .from(observationDloLinks)
      .where(eq(observationDloLinks.observationId, entry.id));
    expect(links).toHaveLength(2);
    expect(new Set(links.map((l) => l.learnerId))).toEqual(new Set([a.id, b.id]));
  });

  it('stores provenance=inferred by default and claimed_tier=null when tier is coherent', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const entry = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });

    await persistDloLinks({
      entryId: entry.id,
      learnerIds: [learner.id],
      dlos: [{ dlo_id: 'dlo.M1.emerging', tier: 'emerging', confidence: 0.7 }],
      observedAt: new Date(),
    });

    const [link] = await db
      .select()
      .from(observationDloLinks)
      .where(eq(observationDloLinks.observationId, entry.id));
    expect(link.provenance).toBe('inferred');
    expect(link.claimedTier).toBeNull();
  });

  it('stores claimed_tier when provenance=declared is passed', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const entry = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });

    await persistDloLinks({
      entryId: entry.id,
      learnerIds: [learner.id],
      dlos: [{ dlo_id: 'dlo.M1.developing', tier: 'developing', confidence: 0.8 }],
      observedAt: new Date(),
      provenance: 'declared',
    });

    const [link] = await db
      .select()
      .from(observationDloLinks)
      .where(eq(observationDloLinks.observationId, entry.id));
    expect(link.provenance).toBe('declared');
  });
});
