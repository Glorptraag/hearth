/**
 * The Sanity → pgvector webhook must enforce the same retrievable-set gate as
 * the batch reembed script: a chunk exists only for a document that is
 * `status: published` AND `suggestedDraft: false` (the PKB9 human review
 * gate). Before this test existed the route embedded any non-draft publish
 * whose `suggestedDraft` was not literally `true` — so an unreviewed entry
 * (absent flag) and a draft-status entry both reached retrieval.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  // Parameterised so `mock.calls[n][0]` is typed (a zero-arg vi.fn types calls
  // as empty tuples — see snapshot-rebuild.integration.test.ts for the same).
  execute: vi.fn(async (_query?: unknown): Promise<{ rows: unknown[] }> => ({ rows: [] })),
  embedText: vi.fn(async () => [1, 0, 0]),
}));

vi.mock('@/lib/db', () => ({ db: { execute: mocks.execute } }));
vi.mock('@/lib/pedagogy/embedding', () => ({ embedText: mocks.embedText }));

import { POST } from './route';

const SECRET = 'test-webhook-secret';

function request(body: Record<string, unknown>, auth = `Bearer ${SECRET}`) {
  return new Request('http://localhost/api/pedagogy/sanity-webhook', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: auth },
    body: JSON.stringify(body),
  });
}

const baseDoc = {
  _id: 'pedagogySourceExcerpt.cm.001',
  _type: 'pedagogySourceExcerpt',
  text: 'Education is an atmosphere, a discipline, a life.',
  framework: { _ref: 'pedagogicalFramework.charlotte_mason' },
};

/** The SQL text of the nth db.execute call (drizzle sql`` → queryChunks). */
function sqlOfCall(n: number): string {
  const arg = mocks.execute.mock.calls[n]?.[0] as { queryChunks?: unknown[] } | undefined;
  return JSON.stringify(arg?.queryChunks ?? arg ?? '');
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('SANITY_WEBHOOK_SECRET', SECRET);
});

describe('POST /api/pedagogy/sanity-webhook — retrievable-set gate', () => {
  it('rejects a bad bearer token', async () => {
    const res = await POST(request(baseDoc, 'Bearer nope') as never);
    expect(res.status).toBe(401);
  });

  it('embeds and upserts a published, human-confirmed document', async () => {
    const res = await POST(
      request({ ...baseDoc, status: 'published', suggestedDraft: false }) as never,
    );
    const json = await res.json();
    expect(json.action).toBe('created');
    expect(mocks.embedText).toHaveBeenCalledTimes(1);
    expect(sqlOfCall(mocks.execute.mock.calls.length - 1)).toContain('INSERT INTO pedagogy_knowledge_chunks');
  });

  it('removes the chunk when suggestedDraft is absent (vault contract: absent = awaiting review)', async () => {
    const res = await POST(request({ ...baseDoc, status: 'published' }) as never);
    const json = await res.json();
    expect(json).toMatchObject({ action: 'deleted', reason: 'not_retrievable' });
    expect(mocks.embedText).not.toHaveBeenCalled();
    expect(sqlOfCall(0)).toContain('DELETE FROM pedagogy_knowledge_chunks');
  });

  it('removes the chunk when suggestedDraft is true', async () => {
    const res = await POST(
      request({ ...baseDoc, status: 'published', suggestedDraft: true }) as never,
    );
    expect((await res.json()).action).toBe('deleted');
    expect(mocks.embedText).not.toHaveBeenCalled();
  });

  it('removes the chunk when status is not published, even if confirmed', async () => {
    const res = await POST(
      request({ ...baseDoc, status: 'draft', suggestedDraft: false }) as never,
    );
    expect((await res.json()).action).toBe('deleted');
    expect(mocks.embedText).not.toHaveBeenCalled();
  });

  it('removes the chunk on a Sanity draft id or a delete operation', async () => {
    const draft = await POST(
      request({ ...baseDoc, _id: 'drafts.pedagogySourceExcerpt.cm.001', status: 'published', suggestedDraft: false }) as never,
    );
    expect(await draft.json()).toMatchObject({ action: 'deleted', reason: 'sanity_draft', id: 'pedagogySourceExcerpt.cm.001' });
    const del = await POST(
      request({ ...baseDoc, operation: 'delete', status: 'published', suggestedDraft: false }) as never,
    );
    expect(await del.json()).toMatchObject({ action: 'deleted', reason: 'delete' });
  });

  it('refreshes metadata without re-embedding when the content hash is unchanged', async () => {
    // First call: SELECT content_hash → return a matching hash so the route
    // takes the metadata-only branch.
    const { computeContentHash } = await import('@/lib/pedagogy/chunk-builder');
    const hash = computeContentHash(baseDoc.text);
    mocks.execute.mockResolvedValueOnce({ rows: [{ content_hash: hash }] });
    const res = await POST(
      request({ ...baseDoc, status: 'published', suggestedDraft: false }) as never,
    );
    expect((await res.json()).action).toBe('metadata_updated');
    expect(mocks.embedText).not.toHaveBeenCalled();
    expect(sqlOfCall(1)).toContain('IS DISTINCT FROM');
  });

  it('ignores non-PKB document types', async () => {
    const res = await POST(request({ _id: 'module.x', _type: 'module' }) as never);
    expect((await res.json()).action).toBe('ignored');
  });
});
