/**
 * The enrichment request with Photo Read OFF is byte-identical to the request
 * enrichEntry sent before Photo Read existed (launch pivot W1.4, D-LP-3).
 *
 * The legacy literal below is copied verbatim from enrich.ts at the commit
 * before W1.4 (`client.messages.create({ model, max_tokens, system, messages })`),
 * and the system prompt is pinned by its SHA-256 at that commit. If either
 * assertion fails, the no-photo request changed — that breaks the prompt cache
 * and the "flag off = nothing changed" promise the ZDR gate (A3) relies on.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: {} }));
vi.mock('../snapshot-rebuild', () => ({ rebuildSnapshot: vi.fn() }));
vi.mock('@/lib/sanity/client', () => ({ sanityClient: { fetch: vi.fn() }, sanityServerClient: { fetch: vi.fn() } }));

import { ENRICH_MAX_TOKENS, ENRICH_MODEL, SYSTEM_PROMPT, buildEnrichRequest } from '../enrich';
import { buildReadPromptSection } from '../read-schema';
import type { ReadImage } from '../read-images';

/** sha256(SYSTEM_PROMPT) at the commit before Photo Read (5,029 chars). */
const PRE_READ_SYSTEM_PROMPT_SHA256 = '2fda3d1fdc5652cb0b0d7235abefca788be50e0948cc5281233acdcea886dbc5';

const USER_PROMPT = 'FAMILY CONTEXT:\nChildren on this entry: Sam (age 6)\n\nENTRY TO ENRICH:\nTitle: Counting scoops';

/** The pre-W1.4 request, exactly as enrich.ts built it inline. */
function legacyRequest(userPrompt: string) {
  return {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userPrompt }],
  };
}

const IMAGE: ReadImage = { mediaType: 'image/jpeg', data: 'AAAA', width: 768, height: 576, estimatedTokens: 590 };

describe('buildEnrichRequest — Photo Read off', () => {
  it('keeps the system prompt byte-identical to the pre-Read prompt', () => {
    expect(SYSTEM_PROMPT.length).toBe(5029);
    expect(createHash('sha256').update(SYSTEM_PROMPT).digest('hex')).toBe(PRE_READ_SYSTEM_PROMPT_SHA256);
  });

  it('serialises byte-for-byte like the pre-Read request (no images)', () => {
    expect(JSON.stringify(buildEnrichRequest(USER_PROMPT))).toBe(JSON.stringify(legacyRequest(USER_PROMPT)));
    expect(JSON.stringify(buildEnrichRequest(USER_PROMPT, []))).toBe(JSON.stringify(legacyRequest(USER_PROMPT)));
  });

  it('never mentions the Read when no image is sent', () => {
    const body = JSON.stringify(buildEnrichRequest(USER_PROMPT));
    expect(body).not.toContain('photo_read');
    expect(body).not.toContain('PHOTO READ');
  });
});

describe('buildEnrichRequest — Photo Read on', () => {
  const req = buildEnrichRequest(USER_PROMPT, [IMAGE]);

  it('is still one Haiku call with the same cache-controlled system prompt', () => {
    expect(req.model).toBe(ENRICH_MODEL);
    expect(req.system).toEqual(legacyRequest(USER_PROMPT).system);
    expect(req.messages).toHaveLength(1);
  });

  it('puts the image first, then the user prompt plus the Read section', () => {
    const content = req.messages[0].content as unknown as Array<Record<string, unknown>>;
    expect(content[0]).toEqual({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'AAAA' } });
    expect(content[1]).toEqual({ type: 'text', text: `${USER_PROMPT}\n\n${buildReadPromptSection()}` });
    expect(content).toHaveLength(2);
  });

  it('adds only the Read output headroom (≤ 250 tokens) to max_tokens', () => {
    expect(req.max_tokens).toBe(ENRICH_MAX_TOKENS + 250);
  });
});
