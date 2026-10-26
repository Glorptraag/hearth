/**
 * INTEGRATION: Photo Read inside enrichEntry (launch pivot W1.4; A1, A2, A3,
 * D-LP-2, D-LP-3, D-LP-4).
 *
 * Drives the real enrichEntry against real Postgres with the Anthropic SDK and
 * Vercel Blob mocked, and pins:
 *   - flag off → the request is byte-identical to the pre-Read request, no blob
 *     is fetched, nothing is written to read_output;
 *   - every gate (flag, allowlist, opt-in, photo) must hold before an image is
 *     sent, and it rides in the SAME single call (≤ 1 call per save);
 *   - a valid Read lands in learning_entries.read_output, never in ai_enrichment;
 *   - refusal / invalid output → empty Read (null), never invented;
 *   - the run tape tags the call `-read` so the cost dashboard sees it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from '@vercel/blob';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { aiPipelineLogs, learningEntries } from '@/lib/db/schema';
import { createEntry, createEvidence, createFamily, createLearner } from '@/test/db-factories';
import { bytesStream, fakeJpeg } from '@/test/image-bytes';
import { TEST_FAMILY_ID, TEST_USER_ID } from '../../../../vitest.setup';
import { SYSTEM_PROMPT, enrichEntry } from '../enrich';
import { READ_PROMPT_VERSION, buildReadPromptSection } from '../read-schema';

const { createMock, mockState } = vi.hoisted(() => {
  const mockState: { photoRead: unknown } = { photoRead: undefined };
  const createMock = vi.fn();
  return { createMock, mockState };
});

vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = { create: createMock };
  }
  return { default: MockAnthropic, Anthropic: MockAnthropic };
});

function enrichmentJson(extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    subjects_detected: ['Mathematics'],
    capability_threads: [{ thread_id: 'M1', confidence: 0.8 }],
    curriculum_descriptors: [],
    per_child_signals: { Sam: { engagement_score: 0.8, complexity_level: 'developing', notable: null } },
    insight_suggestions: [],
    confidence: 0.85,
    quality_indicators: { description_richness: 'adequate', evidence_present: true, multi_subject: false },
    journey_observation: null,
    discrete_learning_objectives: [],
    work_sample: { flag: false, quality: 0.4, rationale: 'Clear but short.' },
    ...extra,
  });
}

const VALID_READ = {
  seen: ['times-table worksheet', 'pencil'],
  doing: 'A child is writing numbers on a worksheet at a table.',
  artefact: 'worksheet',
  printedText: 'Math-U-See Alpha Lesson 12',
  peopleVisible: 1,
  confidence: 'high',
};

const PHOTO_REF = `evidence/${TEST_FAMILY_ID}/scoops.jpg`;

async function seed(opts: { optIn: boolean | null; photo?: boolean }) {
  await createFamily(db, { id: TEST_FAMILY_ID, clerkUserId: TEST_USER_ID, photoReadOptIn: opts.optIn });
  const learner = await createLearner(db, { familyId: TEST_FAMILY_ID, name: 'Sam' });
  const entry = await createEntry(db, {
    familyId: TEST_FAMILY_ID,
    learnerIds: [learner.id],
    status: 'complete',
    subjects: [],
    title: 'Photo on 6 Oct',
    description: 'Sam did his maths page.',
    evidenceUrls: opts.photo === false ? [] : [PHOTO_REF],
  });
  if (opts.photo !== false) {
    await createEvidence(db, { entryId: entry.id, kind: 'photo', content: PHOTO_REF, caption: null });
  }
  return entry;
}

async function readRow(id: string) {
  return db.query.learningEntries.findFirst({ where: eq(learningEntries.id, id) });
}

function sentContent(callIndex = 0) {
  const req = createMock.mock.calls[callIndex][0] as { messages: Array<{ content: unknown }> };
  return req.messages[0].content;
}

beforeEach(() => {
  createMock.mockReset();
  mockState.photoRead = undefined;
  createMock.mockImplementation(async () => ({
    id: 'msg_read',
    type: 'message',
    role: 'assistant',
    content: [
      {
        type: 'text',
        text: enrichmentJson(mockState.photoRead === undefined ? {} : { photo_read: mockState.photoRead }),
      },
    ],
    model: 'claude-haiku-4-5-20251001',
    stop_reason: 'end_turn',
    usage: { input_tokens: 900, output_tokens: 300 },
  }));
  vi.mocked(get).mockReset();
  vi.mocked(get).mockImplementation(async () => ({
    statusCode: 200,
    stream: bytesStream(fakeJpeg(768, 576)),
    blob: { contentType: 'image/jpeg', size: 64 },
  }) as unknown as Awaited<ReturnType<typeof get>>);
  vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'test-token');
  vi.stubEnv('PHOTO_READ_FAMILY_ALLOWLIST', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function readOn(allowlist = TEST_FAMILY_ID) {
  vi.stubEnv('PHOTO_READ_ENABLED', 'true');
  vi.stubEnv('PHOTO_READ_FAMILY_ALLOWLIST', allowlist);
}

describe('INTEGRATION: Photo Read flag off', () => {
  it('sends the byte-identical pre-Read request, fetches no blob and writes no Read', async () => {
    vi.stubEnv('PHOTO_READ_ENABLED', '');
    mockState.photoRead = VALID_READ; // even if the model volunteered one
    const entry = await seed({ optIn: true });

    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });

    expect(createMock).toHaveBeenCalledTimes(1);
    const req = createMock.mock.calls[0][0] as { messages: Array<{ content: string }> };
    const legacy = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: req.messages[0].content }],
    };
    expect(JSON.stringify(req)).toBe(JSON.stringify(legacy));
    expect(typeof req.messages[0].content).toBe('string');
    expect(req.messages[0].content).not.toContain('PHOTO READ');
    expect(get).not.toHaveBeenCalled();

    const row = await readRow(entry.id);
    expect(row?.readOutput).toBeNull();
    expect((row?.aiEnrichment as Record<string, unknown>).status).toBe('enriched');
    expect(row?.aiEnrichment).not.toHaveProperty('photo_read');

    const logs = await db.select().from(aiPipelineLogs).where(eq(aiPipelineLogs.entryId, entry.id));
    expect(logs.map((l) => l.modelUsed)).toEqual(['claude-haiku-4-5-20251001']);
  });
});

describe('INTEGRATION: Photo Read gates', () => {
  it('sends no image when the family is not on the allowlist', async () => {
    readOn('some-other-family');
    const entry = await seed({ optIn: true });
    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });
    expect(typeof sentContent()).toBe('string');
    expect(get).not.toHaveBeenCalled();
    expect((await readRow(entry.id))?.readOutput).toBeNull();
  });

  it('sends no image when the family never answered or said no', async () => {
    readOn();
    const entry = await seed({ optIn: null });
    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });
    expect(typeof sentContent()).toBe('string');

    createMock.mockClear();
    await db.update(learningEntries).set({ aiEnrichment: null }).where(eq(learningEntries.id, entry.id));
    const { families } = await import('@/lib/db/schema');
    await db.update(families).set({ photoReadOptIn: false }).where(eq(families.id, TEST_FAMILY_ID));
    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });
    expect(typeof sentContent()).toBe('string');
    expect(get).not.toHaveBeenCalled();
  });

  it('sends no image when the entry has no photo', async () => {
    readOn();
    const entry = await seed({ optIn: true, photo: false });
    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });
    expect(typeof sentContent()).toBe('string');
    expect(get).not.toHaveBeenCalled();
  });
});

describe('INTEGRATION: Photo Read on', () => {
  it('reads the photo in the same single call and stores the validated Read', async () => {
    readOn();
    mockState.photoRead = VALID_READ;
    const entry = await seed({ optIn: true });

    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });

    expect(createMock).toHaveBeenCalledTimes(1);
    expect(get).toHaveBeenCalledWith(PHOTO_REF, { access: 'private' });
    const content = sentContent() as Array<Record<string, unknown>>;
    expect(content[0]).toMatchObject({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg' } });
    expect((content[1].text as string).endsWith(buildReadPromptSection())).toBe(true);
    expect((createMock.mock.calls[0][0] as { max_tokens: number }).max_tokens).toBe(4096 + 250);

    const row = await readRow(entry.id);
    expect(row?.readOutput).toEqual({ ...VALID_READ, promptVersion: READ_PROMPT_VERSION });
    expect(row?.draftedBy).toBe('parent'); // the Read is a draft; the text is still the parent's
    expect(row?.description).toBe('Sam did his maths page.');
    expect(row?.aiEnrichment).not.toHaveProperty('photo_read');
    expect((row?.aiEnrichment as Record<string, unknown>).status).toBe('enriched');

    const logs = await db.select().from(aiPipelineLogs).where(eq(aiPipelineLogs.entryId, entry.id));
    expect(logs.map((l) => l.modelUsed)).toEqual(['claude-haiku-4-5-20251001-read']);
  });

  it('runs with no allowlist set (any opted-in family) when the flag is on', async () => {
    vi.stubEnv('PHOTO_READ_ENABLED', 'true');
    mockState.photoRead = VALID_READ;
    const entry = await seed({ optIn: true });
    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });
    expect(Array.isArray(sentContent())).toBe(true);
  });

  it('a refusal (photo_read: null) gives an empty Read, and the enrichment still lands', async () => {
    readOn();
    mockState.photoRead = null;
    const entry = await seed({ optIn: true });
    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });
    const row = await readRow(entry.id);
    expect(row?.readOutput).toBeNull();
    expect((row?.aiEnrichment as Record<string, unknown>).status).toBe('enriched');
  });

  it('an invalid Read is dropped whole, never repaired', async () => {
    readOn();
    mockState.photoRead = { ...VALID_READ, artefact: 'spaceship', peopleVisible: 'two' };
    const entry = await seed({ optIn: true });
    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });
    expect((await readRow(entry.id))?.readOutput).toBeNull();
  });

  it('blanks a Read sentence that names the child', async () => {
    readOn();
    mockState.photoRead = { ...VALID_READ, doing: 'Sam is writing numbers on a worksheet.' };
    const entry = await seed({ optIn: true });
    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });
    expect((await readRow(entry.id))?.readOutput).toMatchObject({ doing: '', printedText: VALID_READ.printedText });
  });

  it('an unparseable photo reply retries text-only (the existing failure path) with an empty Read', async () => {
    readOn();
    mockState.photoRead = VALID_READ;
    createMock.mockImplementationOnce(async () => ({
      id: 'msg_refusal',
      type: 'message',
      role: 'assistant',
      content: [{ type: 'text', text: 'I can’t help with this image.' }],
      model: 'claude-haiku-4-5-20251001',
      stop_reason: 'refusal',
      usage: { input_tokens: 900, output_tokens: 10 },
    }));
    const entry = await seed({ optIn: true });

    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });

    expect(createMock).toHaveBeenCalledTimes(2);
    expect(Array.isArray(sentContent(0))).toBe(true);
    expect(typeof sentContent(1)).toBe('string');
    const row = await readRow(entry.id);
    expect(row?.readOutput).toBeNull();
    expect((row?.aiEnrichment as Record<string, unknown>).status).toBe('enriched');
  });

  it('skips an image over the token budget instead of sending it', async () => {
    readOn();
    vi.mocked(get).mockImplementation(async () => ({
      statusCode: 200,
      stream: bytesStream(fakeJpeg(2400, 1800)),
      blob: { contentType: 'image/jpeg', size: 64 },
    }) as unknown as Awaited<ReturnType<typeof get>>);
    const entry = await seed({ optIn: true });
    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });
    expect(typeof sentContent()).toBe('string');
    expect((await readRow(entry.id))?.readOutput).toBeNull();
  });

  it('a later re-enrich with the flag off keeps the stored Read', async () => {
    readOn();
    mockState.photoRead = VALID_READ;
    const entry = await seed({ optIn: true });
    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });

    vi.stubEnv('PHOTO_READ_ENABLED', '');
    await enrichEntry({ entryId: entry.id, familyId: TEST_FAMILY_ID });
    expect((await readRow(entry.id))?.readOutput).toMatchObject({ printedText: VALID_READ.printedText });
  });
});
