/**
 * INTEGRATION: declared DLO opportunities + corroboration (WS-6 / D-OS1).
 *
 * The decision (Drew, 2026-06-13): completing a targeted activity logs an
 * OPPORTUNITY, NOT evidence. The DLO link is promoted to observed evidence only
 * when corroborated by a per-child Haiku signal (or, later, a parent tap).
 *
 * These tests assert the evidence bar holds against a real DB:
 *   - persistDeclaredOpportunities writes 'opportunity' rows that DON'T move
 *     learner_dlo_status (a bare completion stays an opportunity).
 *   - learner_dlo_status rolls up from 'observed' rows only.
 *   - corroborateDloOpportunities promotes only the tier-exact matches.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import { learnerDloStatus, observationDloLinks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createFamily, createLearner, createEntry } from '@/test/db-factories';
import {
  persistDeclaredOpportunities,
  corroborateDloOpportunities,
  persistDloLinks,
} from '../dlo-persistence';

vi.mock('../dlo-cache', () => ({
  getValidDlos: vi.fn(async () => ({
    ids: new Set([
      'dlo.M1.emerging',
      'dlo.M1.developing',
      'dlo.M1.demonstrating',
      'dlo.L3.emerging',
      'dlo.L3.developing',
    ]),
    tierById: new Map<string, 'emerging' | 'developing' | 'demonstrating'>([
      ['dlo.M1.emerging', 'emerging'],
      ['dlo.M1.developing', 'developing'],
      ['dlo.M1.demonstrating', 'demonstrating'],
      ['dlo.L3.emerging', 'emerging'],
      ['dlo.L3.developing', 'developing'],
    ]),
    descriptorById: new Map<string, string>(),
  })),
}));

beforeEach(() => vi.clearAllMocks());

async function statusFor(learnerId: string, dloId: string) {
  const [row] = await db
    .select()
    .from(learnerDloStatus)
    .where(and(eq(learnerDloStatus.learnerId, learnerId), eq(learnerDloStatus.dloId, dloId)));
  return row;
}

describe('INTEGRATION: persistDeclaredOpportunities', () => {
  it('writes a declared opportunity that does NOT move learner_dlo_status', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const entry = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });

    const written = await persistDeclaredOpportunities({
      entryId: entry.id,
      learnerIds: [learner.id],
      // emerging only needs ≥1 observed link — proving this stays uncounted is
      // the strongest demonstration that an opportunity isn't evidence.
      targets: [{ threadId: 'M1', tier: 'emerging' }],
      observedAt: new Date(),
    });
    expect(written).toBe(1);

    const [link] = await db
      .select()
      .from(observationDloLinks)
      .where(eq(observationDloLinks.observationId, entry.id));
    expect(link.provenance).toBe('declared');
    expect(link.evidenceState).toBe('opportunity');
    expect(link.dloId).toBe('dlo.M1.emerging');
    expect(link.confidence).toBeNull();

    // No status row at all — the opportunity is not evidence.
    expect(await statusFor(learner.id, 'dlo.M1.emerging')).toBeUndefined();
  });

  it('drops targets whose DLO is not in the published catalog', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const entry = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });

    const written = await persistDeclaredOpportunities({
      entryId: entry.id,
      learnerIds: [learner.id],
      targets: [{ threadId: 'S1', tier: 'developing' }], // not in the fixture catalog
      observedAt: new Date(),
    });
    expect(written).toBe(0);

    const links = await db
      .select()
      .from(observationDloLinks)
      .where(eq(observationDloLinks.observationId, entry.id));
    expect(links).toHaveLength(0);
  });

  it('writes one opportunity row per learner on a multi-learner entry', async () => {
    const family = await createFamily(db);
    const a = await createLearner(db, { familyId: family.id, name: 'A' });
    const b = await createLearner(db, { familyId: family.id, name: 'B' });
    const entry = await createEntry(db, { familyId: family.id, learnerIds: [a.id, b.id] });

    const written = await persistDeclaredOpportunities({
      entryId: entry.id,
      learnerIds: [a.id, b.id],
      targets: [{ threadId: 'M1', tier: 'developing' }],
      observedAt: new Date(),
    });
    expect(written).toBe(2);
  });
});

describe('INTEGRATION: corroborateDloOpportunities', () => {
  it('an opportunity stays uncounted until a matching Haiku signal corroborates it', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const entry = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });

    await persistDeclaredOpportunities({
      entryId: entry.id,
      learnerIds: [learner.id],
      targets: [{ threadId: 'M1', tier: 'emerging' }],
      observedAt: new Date(),
    });

    // Before corroboration: still an opportunity, no status.
    expect(await statusFor(learner.id, 'dlo.M1.emerging')).toBeUndefined();

    const promoted = await corroborateDloOpportunities({
      entryId: entry.id,
      learnerIds: [learner.id],
      signals: [{ dlo_id: 'dlo.M1.emerging', confidence: 0.8 }],
      observedAt: new Date(),
    });
    expect(promoted).toBe(1);

    const [link] = await db
      .select()
      .from(observationDloLinks)
      .where(eq(observationDloLinks.observationId, entry.id));
    expect(link.evidenceState).toBe('observed');
    expect(link.provenance).toBe('declared');

    // Now it counts: one observed emerging → status 'emerging'.
    expect((await statusFor(learner.id, 'dlo.M1.emerging'))?.status).toBe('emerging');
  });

  it('only promotes tier-exact matches — a target cannot over-claim a tier Haiku did not see', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const entry = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });

    // Activity declares it develops M1 at 'developing'.
    await persistDeclaredOpportunities({
      entryId: entry.id,
      learnerIds: [learner.id],
      targets: [{ threadId: 'M1', tier: 'developing' }],
      observedAt: new Date(),
    });

    // But Haiku only saw 'emerging' for M1 — a lower tier, different DLO id.
    const promoted = await corroborateDloOpportunities({
      entryId: entry.id,
      learnerIds: [learner.id],
      signals: [{ dlo_id: 'dlo.M1.emerging', confidence: 0.7 }],
      observedAt: new Date(),
    });
    expect(promoted).toBe(0);

    const [link] = await db
      .select()
      .from(observationDloLinks)
      .where(eq(observationDloLinks.observationId, entry.id));
    expect(link.evidenceState).toBe('opportunity');
    expect(await statusFor(learner.id, 'dlo.M1.developing')).toBeUndefined();
  });

  it('mirrors the real enrich flow: declared developing + Haiku-inferred developing → developing', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const entry = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });
    const observedAt = new Date();

    // 1. Haiku independently infers developing → one observed link. ≥2 needed,
    //    so on its own this is not yet 'developing'.
    await persistDloLinks({
      entryId: entry.id,
      learnerIds: [learner.id],
      dlos: [{ dlo_id: 'dlo.M1.developing', tier: 'developing', confidence: 0.7 }],
      observedAt,
    });
    expect((await statusFor(learner.id, 'dlo.M1.developing'))?.status).toBe('not-started');

    // 2. The completed activity declared the same (thread, tier) → opportunity.
    await persistDeclaredOpportunities({
      entryId: entry.id,
      learnerIds: [learner.id],
      targets: [{ threadId: 'M1', tier: 'developing' }],
      observedAt,
    });

    // 3. The Haiku signal corroborates it → the opportunity is promoted. Now two
    //    observed developing links → 'developing'.
    const promoted = await corroborateDloOpportunities({
      entryId: entry.id,
      learnerIds: [learner.id],
      signals: [{ dlo_id: 'dlo.M1.developing', confidence: 0.7 }],
      observedAt,
    });
    expect(promoted).toBe(1);
    expect((await statusFor(learner.id, 'dlo.M1.developing'))?.status).toBe('developing');
  });

  it('a non-matching signal leaves the opportunity untouched', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const entry = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });

    await persistDeclaredOpportunities({
      entryId: entry.id,
      learnerIds: [learner.id],
      targets: [{ threadId: 'M1', tier: 'developing' }],
      observedAt: new Date(),
    });

    const promoted = await corroborateDloOpportunities({
      entryId: entry.id,
      learnerIds: [learner.id],
      signals: [{ dlo_id: 'dlo.L3.developing', confidence: 0.6 }],
      observedAt: new Date(),
    });
    expect(promoted).toBe(0);

    const [link] = await db
      .select()
      .from(observationDloLinks)
      .where(eq(observationDloLinks.observationId, entry.id));
    expect(link.evidenceState).toBe('opportunity');
  });
});

describe('INTEGRATION: learner_dlo_status excludes opportunities', () => {
  it('an observed link counts even when an opportunity for the same DLO also exists', async () => {
    const family = await createFamily(db);
    const learner = await createLearner(db, { familyId: family.id });
    const e1 = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });
    const e2 = await createEntry(db, { familyId: family.id, learnerIds: [learner.id] });
    const observedAt = new Date();

    // An opportunity for emerging from one entry.
    await persistDeclaredOpportunities({
      entryId: e1.id,
      learnerIds: [learner.id],
      targets: [{ threadId: 'M1', tier: 'emerging' }],
      observedAt,
    });
    // Status untouched by the opportunity.
    expect(await statusFor(learner.id, 'dlo.M1.emerging')).toBeUndefined();

    // A genuine observed emerging from a different entry.
    await persistDloLinks({
      entryId: e2.id,
      learnerIds: [learner.id],
      dlos: [{ dlo_id: 'dlo.M1.emerging', tier: 'emerging', confidence: 0.7 }],
      observedAt,
    });

    // emerging needs ≥1 observed — the observed link alone supplies it; the
    // lingering opportunity neither adds to nor blocks the count.
    expect((await statusFor(learner.id, 'dlo.M1.emerging'))?.status).toBe('emerging');
  });
});
