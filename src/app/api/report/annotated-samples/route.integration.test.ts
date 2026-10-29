/**
 * Integration test for GET /api/report/annotated-samples (W5.1).
 *
 * Real Postgres (rolled back per test) for family / learner / entry / evidence /
 * observation_dlo_links / report + slot rows; Sanity is mocked so we can hand
 * it fixture DLO plain-language lines. Pins the confirmed-DLO rule end to end
 * (the entry's observed link + the parent's observation-less assertion), the
 * no-photo and suppressed-thread exclusions against real rows, cross-family
 * isolation, and that the read never writes a work-sample slot.
 */

const mocks = vi.hoisted(() => ({
  sanityFetch: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/sanity/client', () => ({
  sanityClient: { fetch: mocks.sanityFetch },
  sanityServerClient: { fetch: mocks.sanityFetch },
}));

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { asSignedOut, asUser } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { complianceReports, workSamples } from '@/lib/db/schema';
import { createDloLink, createEntry, createEvidence, createFamily, createLearner } from '@/test/db-factories';
import { BAND_SENTENCE } from '@/lib/report/annotated-samples';
import { GET } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

function req(qs = '') {
  return new NextRequest(`http://x/api/report/annotated-samples${qs}`);
}

const DLO_DOCS = [
  { _id: 'dlo.S5.developing', threadId: 'S5', threadRef: 'capabilityThread.S5', tier: 'developing', descriptor: 'Records what they notice, in words or pictures' },
  { _id: 'dlo.L5.emerging', threadId: 'L5', threadRef: 'capabilityThread.L5', tier: 'emerging', descriptor: 'Writes a few words to say something' },
];

async function seed() {
  asUser({});
  await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
  const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'Sam' });
  return learner;
}

/** The entry's observed link (as enrichment writes it) + the parent's Confirm-surface assertion. */
async function confirm(entryId: string, learnerId: string, dloId: string, tier: string) {
  await createDloLink(db, { observationId: entryId, learnerId, dloId, tier, provenance: 'inferred' });
  await createDloLink(db, { observationId: null, learnerId, dloId, tier, provenance: 'asserted', confidence: '1' });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sanityFetch.mockResolvedValue(DLO_DOCS);
});

describe('GET /api/report/annotated-samples — real DB', () => {
  it('returns 401 when signed out', async () => {
    asSignedOut();
    const res = await GET(req('?learnerId=00000000-0000-0000-0000-000000000001'));
    expect(res.status).toBe(401);
  });

  it('returns 400 when learnerId is missing', async () => {
    await seed();
    const res = await GET(req(''));
    expect(res.status).toBe(400);
  });

  it('returns 404 when the learner belongs to another family', async () => {
    await seed();
    const otherFamilyId = '00000000-0000-0000-0000-00000000000d';
    await createFamily(db, { id: otherFamilyId, clerkUserId: 'user_other_owner' });
    const otherLearner = await createLearner(db, { familyId: otherFamilyId });
    const res = await GET(req(`?learnerId=${otherLearner.id}`));
    expect(res.status).toBe(404);
  });

  it('assembles a photo + confirmed-DLO entry as an annotated sample, grouped per learning area', async () => {
    const learner = await seed();
    const entry = await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learner.id],
      status: 'complete',
      title: 'Nature journal',
      description: 'Sam drew the leaves and wrote a word under each.',
      subjects: ['science'],
      dateOccurred: '2026-03-10',
      evidenceUrls: [],
    });
    await createEvidence(db, { entryId: entry.id, kind: 'photo', content: `evidence/${TEST_FAMILY_ID}/leaf.jpg`, caption: 'Leaf page' });
    await confirm(entry.id, learner.id, 'dlo.S5.developing', 'developing');

    const res = await GET(req(`?learnerId=${learner.id}`));
    expect(res.status).toBe(200);
    const { groups } = await res.json();
    expect(groups).toHaveLength(1);
    expect(groups[0].area).toBe('science');
    expect(groups[0].samples).toEqual([
      {
        entryId: entry.id,
        title: 'Nature journal',
        dateOccurred: '2026-03-10',
        parentWords: 'Sam drew the leaves and wrote a word under each.',
        noticed: null,
        photos: [{ ref: `evidence/${TEST_FAMILY_ID}/leaf.jpg`, caption: 'Leaf page' }],
        dlos: [
          {
            dloId: 'dlo.S5.developing',
            threadId: 'S5',
            threadName: 'Scientific Observation',
            tier: 'developing',
            line: 'Records what they notice, in words or pictures',
            bandSentence: BAND_SENTENCE.developing('Sam'),
          },
        ],
        requiredSlot: null,
      },
    ]);
  });

  it('falls back to legacy evidenceUrls for a pre-dual-write entry', async () => {
    const learner = await seed();
    const entry = await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learner.id],
      status: 'complete',
      subjects: ['english'],
      evidenceUrls: [`evidence/${TEST_FAMILY_ID}/old.jpg`],
    });
    await confirm(entry.id, learner.id, 'dlo.L5.emerging', 'emerging');

    const { groups } = await (await GET(req(`?learnerId=${learner.id}`))).json();
    expect(groups[0].samples[0].photos).toEqual([{ ref: `evidence/${TEST_FAMILY_ID}/old.jpg`, caption: null }]);
  });

  it('excludes no-photo entries, unconfirmed DLOs and the suppressed H6 thread', async () => {
    const learner = await seed();
    const noPhoto = await createEntry(db, {
      familyId: TEST_FAMILY_ID, learnerIds: [learner.id], status: 'complete', subjects: ['science'], evidenceUrls: [],
    });
    await confirm(noPhoto.id, learner.id, 'dlo.S5.developing', 'developing');

    const unconfirmed = await createEntry(db, {
      familyId: TEST_FAMILY_ID, learnerIds: [learner.id], status: 'complete', subjects: ['english'],
      evidenceUrls: [`evidence/${TEST_FAMILY_ID}/u.jpg`],
    });
    await createDloLink(db, { observationId: unconfirmed.id, learnerId: learner.id, dloId: 'dlo.L5.emerging', tier: 'emerging' });

    const suppressed = await createEntry(db, {
      familyId: TEST_FAMILY_ID, learnerIds: [learner.id], status: 'complete', subjects: ['hass'],
      evidenceUrls: [`evidence/${TEST_FAMILY_ID}/h.jpg`],
    });
    await confirm(suppressed.id, learner.id, 'dlo.H6.developing', 'developing');

    const res = await GET(req(`?learnerId=${learner.id}`));
    expect(res.status).toBe(200);
    expect((await res.json()).groups).toEqual([]);
  });

  it('tags a sample the parent chose for a slot, and never writes a slot itself', async () => {
    const learner = await seed();
    const entry = await createEntry(db, {
      familyId: TEST_FAMILY_ID, learnerIds: [learner.id], status: 'complete', subjects: ['science'],
      evidenceUrls: [`evidence/${TEST_FAMILY_ID}/s.jpg`],
    });
    const other = await createEntry(db, {
      familyId: TEST_FAMILY_ID, learnerIds: [learner.id], status: 'complete', subjects: ['english'],
      evidenceUrls: [`evidence/${TEST_FAMILY_ID}/t.jpg`],
    });
    await confirm(entry.id, learner.id, 'dlo.S5.developing', 'developing');
    await confirm(other.id, learner.id, 'dlo.L5.emerging', 'emerging');

    const [report] = await db
      .insert(complianceReports)
      .values({ familyId: TEST_FAMILY_ID, learnerId: learner.id, reportYear: 2026 })
      .returning();
    await db.insert(workSamples).values([
      { reportId: report.id, slot: 'early_choice', entryId: entry.id, status: 'selected' },
      { reportId: report.id, slot: 'early_writing', entryId: null, status: 'empty' },
    ]);
    const before = await db.select().from(workSamples).where(eq(workSamples.reportId, report.id));

    const { groups } = await (await GET(req(`?learnerId=${learner.id}&reportId=${report.id}`))).json();
    const byEntry = Object.fromEntries(
      groups.flatMap((g: { samples: Array<{ entryId: string; requiredSlot: string | null }> }) =>
        g.samples.map((s) => [s.entryId, s.requiredSlot])),
    );
    expect(byEntry).toEqual({ [entry.id]: 'early_choice', [other.id]: null });

    const after = await db.select().from(workSamples).where(eq(workSamples.reportId, report.id));
    expect(after).toEqual(before);
  });

  it("ignores another family's reportId and a malformed one", async () => {
    const learner = await seed();
    const entry = await createEntry(db, {
      familyId: TEST_FAMILY_ID, learnerIds: [learner.id], status: 'complete', subjects: ['science'],
      evidenceUrls: [`evidence/${TEST_FAMILY_ID}/s.jpg`],
    });
    await confirm(entry.id, learner.id, 'dlo.S5.developing', 'developing');

    const otherFamilyId = '00000000-0000-0000-0000-00000000000e';
    await createFamily(db, { id: otherFamilyId, clerkUserId: 'user_other_owner_2' });
    const otherLearner = await createLearner(db, { familyId: otherFamilyId });
    const [foreign] = await db
      .insert(complianceReports)
      .values({ familyId: otherFamilyId, learnerId: otherLearner.id, reportYear: 2026 })
      .returning();
    await db.insert(workSamples).values({ reportId: foreign.id, slot: 'early_choice', entryId: entry.id, status: 'selected' });

    for (const reportId of [foreign.id, 'not-a-uuid']) {
      const res = await GET(req(`?learnerId=${learner.id}&reportId=${reportId}`));
      expect(res.status).toBe(200);
      expect((await res.json()).groups[0].samples[0].requiredSlot).toBeNull();
    }
  });

  it('still renders samples with thread names when the Sanity read fails', async () => {
    const learner = await seed();
    const entry = await createEntry(db, {
      familyId: TEST_FAMILY_ID, learnerIds: [learner.id], status: 'complete', subjects: ['science'],
      evidenceUrls: [`evidence/${TEST_FAMILY_ID}/s.jpg`],
    });
    await confirm(entry.id, learner.id, 'dlo.S5.developing', 'developing');
    mocks.sanityFetch.mockRejectedValue(new Error('sanity down'));

    const res = await GET(req(`?learnerId=${learner.id}`));
    expect(res.status).toBe(200);
    expect((await res.json()).groups[0].samples[0].dlos[0].line).toBe('Scientific Observation');
  });
});
