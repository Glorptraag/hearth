import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { transcribeAudio, TRANSCRIBE_MAX_BYTES } from './transcribe';

const okResponse = (transcript = 'Hello there.') => ({
  ok: true,
  status: 200,
  json: async () => ({
    results: { channels: [{ alternatives: [{ transcript }] }] },
  }),
  text: async () => '',
});

const clip = (bytes = 16) => Buffer.alloc(bytes, 1);

describe('transcribeAudio', () => {
  beforeEach(() => {
    process.env.DEEPGRAM_API_KEY = 'test-key';
    delete process.env.DEEPGRAM_STT_MODEL;
    delete process.env.DEEPGRAM_STT_LANGUAGE;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.DEEPGRAM_API_KEY;
  });

  it('throws when the API key is missing', async () => {
    delete process.env.DEEPGRAM_API_KEY;
    await expect(transcribeAudio(clip())).rejects.toThrow('DEEPGRAM_API_KEY is not set');
  });

  it('throws on empty audio', async () => {
    await expect(transcribeAudio(Buffer.alloc(0))).rejects.toThrow('empty audio');
  });

  it('throws when audio exceeds the per-request limit', async () => {
    await expect(transcribeAudio(clip(TRANSCRIBE_MAX_BYTES + 1))).rejects.toThrow(
      /exceeds Deepgram per-request limit/
    );
  });

  it('posts to Deepgram /listen with model, language, smart_format, auth, and audio body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('The galah landed.'));
    vi.stubGlobal('fetch', fetchMock);

    const result = await transcribeAudio(clip(), { contentType: 'audio/webm' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('https://api.deepgram.com/v1/listen');
    expect(url).toContain('model=nova-2');
    expect(url).toContain('language=en-AU');
    expect(url).toContain('smart_format=true');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Token test-key');
    expect(init.headers['Content-Type']).toBe('audio/webm');

    expect(result.transcript).toBe('The galah landed.');
    expect(result.model).toBe('nova-2');
  });

  it('honours the DEEPGRAM_STT_MODEL / DEEPGRAM_STT_LANGUAGE overrides', async () => {
    process.env.DEEPGRAM_STT_MODEL = 'nova-3';
    process.env.DEEPGRAM_STT_LANGUAGE = 'en';
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal('fetch', fetchMock);

    const result = await transcribeAudio(clip());
    expect(fetchMock.mock.calls[0][0]).toContain('model=nova-3');
    expect(fetchMock.mock.calls[0][0]).toContain('language=en');
    expect(result.model).toBe('nova-3');
  });

  it('returns an empty string when Deepgram yields no transcript', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ results: { channels: [{ alternatives: [] }] } }),
      text: async () => '',
    }));
    const result = await transcribeAudio(clip());
    expect(result.transcript).toBe('');
  });

  it('throws with the status code on a non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
      json: async () => ({}),
    }));
    await expect(transcribeAudio(clip())).rejects.toThrow('Deepgram STT failed (401): Unauthorized');
  });
});
