// Deepgram Aura text-to-speech client (write-time only — see CLAUDE.md architecture
// principle #4: no runtime LLM/AI calls in the UI). Used by the commons-audio
// generation script to render read-aloud narration into MP3 assets.
//
// Replaces the earlier orphaned Google Cloud TTS scaffold. Uses the REST API
// directly rather than the Deepgram SDK to avoid a new dependency.

const DEEPGRAM_SPEAK_ENDPOINT = 'https://api.deepgram.com/v1/speak';

// Per-request input ceiling. Deepgram Aura accepts up to ~2000 characters; we keep
// a margin and expect callers to chunk via `splitForTts` in `read-aloud.ts`.
export const TTS_MAX_INPUT_CHARS = 1990;

// No Australian-accented Aura voice exists yet; this Aura-2 voice is a clear,
// warm en-US narrator well suited to children's read-alouds. Override per the
// DEEPGRAM_TTS_MODEL env var.
const DEFAULT_MODEL = 'aura-2-thalia-en';

export interface SynthesizeOptions {
  /** Deepgram Aura voice model, e.g. "aura-2-thalia-en". */
  model?: string;
  /** Output bit rate for MP3 (Deepgram supports 32000 or 48000). */
  bitRate?: number;
}

export interface SynthesizedAudio {
  audio: Buffer;
  contentType: string;
  model: string;
}

/** Synthesise a single chunk of text (≤ TTS_MAX_INPUT_CHARS) to an MP3 buffer. */
export async function synthesizeSpeech(
  text: string,
  opts: SynthesizeOptions = {}
): Promise<SynthesizedAudio> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY is not set');
  }
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('synthesizeSpeech called with empty text');
  }
  if (trimmed.length > TTS_MAX_INPUT_CHARS) {
    throw new Error(
      `Text exceeds Deepgram per-request limit (${trimmed.length} > ${TTS_MAX_INPUT_CHARS} chars); split with splitForTts first`
    );
  }

  const model = opts.model ?? process.env.DEEPGRAM_TTS_MODEL ?? DEFAULT_MODEL;
  const params = new URLSearchParams({
    model,
    encoding: 'mp3',
    bit_rate: String(opts.bitRate ?? 48000),
  });

  const res = await fetch(`${DEEPGRAM_SPEAK_ENDPOINT}?${params.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: trimmed }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Deepgram TTS failed (${res.status}): ${detail}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return {
    audio: Buffer.from(arrayBuffer),
    contentType: res.headers.get('content-type') ?? 'audio/mpeg',
    model,
  };
}
