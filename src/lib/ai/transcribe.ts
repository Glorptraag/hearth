// Deepgram speech-to-text client. Unlike the rest of src/lib/ai (write-time
// only — CLAUDE.md architecture principle #4), this is a SCOPED runtime
// exception: it transcribes a single user-initiated voice clip on demand from
// the Logger. It is bounded (one button press → one short clip), never ambient
// or per-render, so it keeps the spirit of "no automatic LLM calls in the UI"
// while making voice capture work cross-browser (incl. iOS Safari, where the
// Web Speech API is unreliable-to-absent). Decision D-LPS-12.
//
// Uses the Deepgram REST API directly (mirrors tts.ts) to avoid a new
// dependency. `smart_format=true` returns punctuated, capitalized text so raw
// dictation lands clean.

const DEEPGRAM_LISTEN_ENDPOINT = 'https://api.deepgram.com/v1/listen';

// Hard ceiling on a single clip's audio payload. The Logger caps recording
// duration client-side; this is the server-side backstop against an oversized
// or malformed upload. ~25MB ≈ several minutes of Opus at speech bitrates.
export const TRANSCRIBE_MAX_BYTES = 25 * 1024 * 1024;

// nova-2 has solid en-AU support; override the model/language via env. The
// Logger audience is Australian families, so en-AU is the default accent model.
const DEFAULT_MODEL = 'nova-2';
const DEFAULT_LANGUAGE = 'en-AU';

export interface TranscribeOptions {
  /** Deepgram model, e.g. "nova-2". Defaults to DEEPGRAM_STT_MODEL or nova-2. */
  model?: string;
  /** BCP-47 language, e.g. "en-AU". Defaults to DEEPGRAM_STT_LANGUAGE or en-AU. */
  language?: string;
  /** MIME type of the audio buffer (e.g. "audio/webm", "audio/mp4"). */
  contentType?: string;
}

export interface TranscriptionResult {
  /** The recognised text (smart-formatted: punctuation + capitalization). */
  transcript: string;
  model: string;
}

interface DeepgramListenResponse {
  results?: {
    channels?: Array<{
      alternatives?: Array<{ transcript?: string }>;
    }>;
  };
}

/**
 * Transcribe a single audio clip to text via Deepgram. Throws on a missing
 * key, an empty/oversized buffer, or a non-ok Deepgram response.
 */
export async function transcribeAudio(
  audio: Buffer,
  opts: TranscribeOptions = {}
): Promise<TranscriptionResult> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPGRAM_API_KEY is not set');
  }
  if (audio.length === 0) {
    throw new Error('transcribeAudio called with empty audio');
  }
  if (audio.length > TRANSCRIBE_MAX_BYTES) {
    throw new Error(
      `Audio exceeds Deepgram per-request limit (${audio.length} > ${TRANSCRIBE_MAX_BYTES} bytes)`
    );
  }

  const model = opts.model ?? process.env.DEEPGRAM_STT_MODEL ?? DEFAULT_MODEL;
  const language = opts.language ?? process.env.DEEPGRAM_STT_LANGUAGE ?? DEFAULT_LANGUAGE;
  // smart_format already applies punctuation + capitalization (and date/number
  // formatting), so a separate punctuate flag would be redundant.
  const params = new URLSearchParams({
    model,
    language,
    smart_format: 'true',
  });

  const res = await fetch(`${DEEPGRAM_LISTEN_ENDPOINT}?${params.toString()}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': opts.contentType || 'audio/webm',
    },
    // Wrap in a fresh ArrayBuffer-backed view: a Node Buffer types as
    // Buffer<ArrayBufferLike>, which no longer satisfies fetch's BodyInit.
    body: new Uint8Array(audio),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Deepgram STT failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as DeepgramListenResponse;
  const transcript =
    json.results?.channels?.[0]?.alternatives?.[0]?.transcript?.trim() ?? '';

  return { transcript, model };
}
