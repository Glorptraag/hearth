const TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

export interface SynthesizeOptions {
  voiceName?: string;
  speakingRate?: number;
  languageCode?: string;
}

export async function synthesize(text: string, opts: SynthesizeOptions = {}): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_TTS_API_KEY is not set');
  }
  const languageCode = opts.languageCode ?? 'ja-JP';
  const voiceName = opts.voiceName ?? process.env.GOOGLE_TTS_DEFAULT_VOICE ?? 'ja-JP-Neural2-B';

  const res = await fetch(`${TTS_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode, name: voiceName },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: opts.speakingRate ?? 1.0,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Google TTS failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as { audioContent?: string };
  if (!json.audioContent) {
    throw new Error('Google TTS response missing audioContent');
  }
  return Buffer.from(json.audioContent, 'base64');
}

export function synthesizeJa(text: string, opts: Omit<SynthesizeOptions, 'languageCode'> = {}) {
  return synthesize(text, { ...opts, languageCode: 'ja-JP' });
}
