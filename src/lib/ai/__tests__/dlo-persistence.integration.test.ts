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
import { persistDloLinks, gateLearnersByNamedSignals, upsertParentAssertion, clearParentAssertion } from '../dlo-persistence';

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

  it('D-OS2: only the named learner on a multi-child entry gets DLO links/status', async () => {
    // Mirrors the enrich.ts call site: gate by per_child_signals, then persist
    // only the attributed learner(s). The unnamed sibling must get nothing.
    const family = await createFamily(db);
    const named = await createLearner(db, { familyId: family.id, name: 'Lily' });
    const sibling = await createLearner(db, { familyId: family.id, name: 'Jake' });
    const entry = await createEntry(db, {
      familyId: family.id,
      learnerIds: [named.id, sibling.id],
    });

    const attributed = gateLearnersByNamedSignals({
      learners: [
        { id: named.id, name: 'Lily' },
        { id: sibling.id, name: 'Jake' },
      ],
      // Enrichment named only Lily.
      perChildSignals: { Lily: { engagement_score: 0.8, complexity_level: 'developing', notable: null } },
    });
    expect(attributed).toEqual([named.id]);

    await persistDloLinks({
      entryId: entry.id,
      learnerIds: attributed,
      dlos: [{ dlo_id: 'dlo.M1.developing', tier: 'developing', confidence: 0.7 }],
      observedAt: new Date(),
    });

    const namedLinks = await db
      .select()
      .from(observationDloLinks)
      .where(eq(observationDloLinks.learnerId, named.id));
    const siblingLinks = await db
      .select()
      .from(observationDloLinks)
      .where(eq(observationDloLinks.learnerId, sibling.id));
    expect(namedLinks).toHaveLength(1);
    expect(siblingLinks).toHaveLength(0);

    const namedStatus = await db
      .select()
      .from(learnerDloStatus)
      .where(eq(learnerDloStatus.learnerId, named.id));
    const siblingStatus = await db
      .select()
      .from(learnerDloStatus)
      .where(eq(learnerDloStatus.learnerId, sibling.id));
    expect(namedStatus).toHaveLength(1);
    expect(siblingStatus).toHaveLength(0);
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

  it('upsertParentAssertion lands an asserted/observed link with no observation and sets status', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });

    const res = await upsertParentAssertion({
      learnerId: learner.id,
      dloId: 'dlo.M1.demonstrating',
      observedAt: new Date(),
    });
    expect(res).toEqual({ tier: 'demonstrating' });

    const links = await db
      .select()
      .from(observationDloLinks)
      .where(eq(observationDloLinks.learnerId, learner.id));
    expect(links).toHaveLength(1);
    expect(links[0].provenance).toBe('asserted');
    expect(links[0].evidenceState).toBe('observed');
    expect(links[0].observationId).toBeNull();

    const [status] = await db
      .select()
      .from(learnerDloStatus)
      .where(and(eq(learnerDloStatus.learnerId, learner.id), eq(learnerDloStatus.dloId, 'dlo.M1.demonstrating')));
    expect(status.status).toBe('demonstrating');
  });

  it('upsertParentAssertion is idempotent — a re-confirm adds no duplicate row', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const dloId = 'dlo.M1.demonstrating';
    await upsertParentAssertion({ learnerId: learner.id, dloId, observedAt: new Date() });
    await upsertParentAssertion({ learnerId: learner.id, dloId, observedAt: new Date() });
    const links = await db
      .select()
      .from(observationDloLinks)
      .where(eq(observationDloLinks.learnerId, learner.id));
    expect(links).toHaveLength(1);
  });

  it('clearParentAssertion removes the assertion and recomputes status to not-started', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const dloId = 'dlo.M1.demonstrating';
    await upsertParentAssertion({ learnerId: learner.id, dloId, observedAt: new Date() });
    await clearParentAssertion({ learnerId: learner.id, dloId, observedAt: new Date() });

    const links = await db
      .select()
      .from(observationDloLinks)
      .where(eq(observationDloLinks.learnerId, learner.id));
    expect(links).toHaveLength(0);

    const [status] = await db
      .select()
      .from(learnerDloStatus)
      .where(and(eq(learnerDloStatus.learnerId, learner.id), eq(learnerDloStatus.dloId, dloId)));
    expect(status.status).toBe('not-started');
  });

  it('upsertParentAssertion returns null for a DLO not in the published catalog', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const res = await upsertParentAssertion({
      learnerId: learner.id,
      dloId: 'dlo.ZZ.demonstrating',
      observedAt: new Date(),
    });
    expect(res).toBeNull();
  });
});
