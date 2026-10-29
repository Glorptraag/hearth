/**
 * Integration test for GET /api/report/export — annotated work samples (W5.1).
 *
 * Real Postgres (rolled back per test); Sanity and Blob are mocked. Pins that
 * both report tiers print the annotated-samples section from real rows, embed
 * the photo through the family-scoped blob read, and print nothing for a
 * learner with no confirmed photo sample. jsPDF writes text uncompressed, so
 * the drawn strings are searchable in the raw bytes (same technique as
 * route.integration.test.ts).
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
import { get } from '@vercel/blob';
import { asUser } from '@/test/clerk-helpers';
import { db } from '@/lib/db';
import { familySettings } from '@/lib/db/schema';
import { createDloLink, createEntry, createFamily, createLearner } from '@/test/db-factories';
import { GET } from './route';
import { TEST_USER_ID, TEST_FAMILY_ID } from '../../../../../vitest.setup';

const PNG = Uint8Array.from(
  Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAIAAAA2iEnWAAAAEElEQVR4nGP438AARAwoFABkUAj7XH75jwAAAABJRU5ErkJggg==',
    'base64',
  ),
);

async function seed(state: string) {
  asUser({});
  await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID });
  await db.insert(familySettings).values({ familyId: TEST_FAMILY_ID, state });
  return createLearner(db, { familyId: TEST_FAMILY_ID, name: 'Sam' });
}

async function confirmedPhotoEntry(learnerId: string) {
  const entry = await createEntry(db, {
    familyId: TEST_FAMILY_ID,
    learnerIds: [learnerId],
    status: 'complete',
    title: 'Nature journal',
    description: 'Sam drew the leaves and wrote a word under each.',
    subjects: ['science'],
    evidenceUrls: [`evidence/${TEST_FAMILY_ID}/leaf.png`],
  });
  await createDloLink(db, { observationId: entry.id, learnerId, dloId: 'dlo.S5.developing', tier: 'developing' });
  await createDloLink(db, {
    observationId: null, learnerId, dloId: 'dlo.S5.developing', tier: 'developing', provenance: 'asserted',
  });
  return entry;
}

async function pdfText(learnerId: string): Promise<{ status: number; type: string | null; text: string }> {
  const res = await GET(new NextRequest(`http://x/api/report/export?learnerId=${learnerId}`));
  const buf = Buffer.from(await res.arrayBuffer());
  return { status: res.status, type: res.headers.get('Content-Type'), text: buf.toString('latin1') };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sanityFetch.mockResolvedValue([
    { _id: 'dlo.S5.developing', threadId: 'S5', tier: 'developing', descriptor: 'Records what they notice, in words or pictures' },
  ]);
  vi.mocked(get).mockImplementation(async () => ({
    statusCode: 200,
    stream: new ReadableStream({ start(c) { c.enqueue(PNG); c.close(); } }),
    blob: { contentType: 'image/png', size: PNG.byteLength },
  }) as never);
});

describe('GET /api/report/export — annotated work samples', () => {
  it.each([['QLD (cd_level)', 'QLD'], ['NSW (learning_area)', 'NSW']])(
    'prints the section with the parent words, objective and band — %s',
    async (_label, state) => {
      const learner = await seed(state);
      await confirmedPhotoEntry(learner.id);

      const { status, type, text } = await pdfText(learner.id);
      expect(status).toBe(200);
      expect(type).toBe('application/pdf');
      expect(text).toContain('Annotated Work Samples');
      expect(text).toContain('Sam drew the leaves and wrote a word under each.');
      expect(text).toContain('Records what they notice, in words or pictures');
      expect(text).toContain('Sam is showing this more often, with growing independence.');
      // The photo was read under the family's own prefix and embedded.
      expect(get).toHaveBeenCalledWith(`evidence/${TEST_FAMILY_ID}/leaf.png`, { access: 'private' });
      expect(text).toContain('/Subtype /Image');
    },
  );

  it('prints no section for a learner without a confirmed photo sample', async () => {
    const learner = await seed('QLD');
    await createEntry(db, {
      familyId: TEST_FAMILY_ID,
      learnerIds: [learner.id],
      status: 'complete',
      subjects: ['science'],
      evidenceUrls: [`evidence/${TEST_FAMILY_ID}/leaf.png`],
    });

    const { status, text } = await pdfText(learner.id);
    expect(status).toBe(200);
    expect(text).not.toContain('Annotated Work Samples');
    expect(get).not.toHaveBeenCalled();
  });
});
