import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { synthesizeSpeech, TTS_MAX_INPUT_CHARS } from './tts';

const okResponse = (bytes = 8, contentType = 'audio/mpeg') => ({
  ok: true,
  status: 200,
  headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? contentType : null) },
  arrayBuffer: async () => new ArrayBuffer(bytes),
  text: async () => '',
});

describe('synthesizeSpeech', () => {
  beforeEach(() => {
    process.env.DEEPGRAM_API_KEY = 'test-key';
    delete process.env.DEEPGRAM_TTS_MODEL;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.DEEPGRAM_API_KEY;
  });

  it('throws when the API key is missing', async () => {
    delete process.env.DEEPGRAM_API_KEY;
    await expect(synthesizeSpeech('Hello')).rejects.toThrow('DEEPGRAM_API_KEY is not set');
  });

  it('throws on empty text', async () => {
    await expect(synthesizeSpeech('   ')).rejects.toThrow('empty text');
  });

  it('throws when text exceeds the per-request limit', async () => {
    await expect(synthesizeSpeech('a'.repeat(TTS_MAX_INPUT_CHARS + 1))).rejects.toThrow(
      /exceeds Deepgram per-request limit/
    );
  });

  it('posts to Deepgram with the model, mp3 encoding, auth header, and text body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal('fetch', fetchMock);

    const result = await synthesizeSpeech('Read me aloud.');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('https://api.deepgram.com/v1/speak');
    expect(url).toContain('model=aura-2-thalia-en');
    expect(url).toContain('encoding=mp3');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Token test-key');
    expect(JSON.parse(init.body)).toEqual({ text: 'Read me aloud.' });

    expect(Buffer.isBuffer(result.audio)).toBe(true);
    expect(result.contentType).toBe('audio/mpeg');
    expect(result.model).toBe('aura-2-thalia-en');
  });

  it('honours the DEEPGRAM_TTS_MODEL override', async () => {
    process.env.DEEPGRAM_TTS_MODEL = 'aura-asteria-en';
    const fetchMock = vi.fn().mockResolvedValue(okResponse());
    vi.stubGlobal('fetch', fetchMock);

    const result = await synthesizeSpeech('Hi');
    expect(fetchMock.mock.calls[0][0]).toContain('model=aura-asteria-en');
    expect(result.model).toBe('aura-asteria-en');
  });

  it('throws with the status code on a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: { get: () => null },
        text: async () => 'Unauthorized',
        arrayBuffer: async () => new ArrayBuffer(0),
      })
    );
    await expect(synthesizeSpeech('Hi')).rejects.toThrow('Deepgram TTS failed (401): Unauthorized');
  });
});
