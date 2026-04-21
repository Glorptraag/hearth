// Voyage AI embedding service — write-time enrichment only.
// voyage-3 produces 1024-dimensional vectors; batch limit is 128 inputs per call.

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const MODEL = 'voyage-3';
export const EMBEDDING_DIMENSIONS = 1024;
const BATCH_LIMIT = 128;

// Free tier: 3 RPM and 10K TPM. ~4 chars/token → stay under ~32K chars per request.
// Wait 65s between requests so the 1-minute token window resets.
const CHARS_PER_REQUEST = 32_000;
const RPM_DELAY_MS = 65_000;
const MAX_RETRIES = 4;

export const EMBEDDING_CONFIG = {
  model: MODEL,
  dimensions: EMBEDDING_DIMENSIONS,
} as const;

interface VoyageResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage: { total_tokens: number };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function callVoyage(inputs: string[]): Promise<number[][]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error('VOYAGE_API_KEY is not set');

  let lastErr: Error | null = null;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const wait = RPM_DELAY_MS * attempt;
      console.log(`  Retrying in ${wait / 1000}s (attempt ${attempt + 1}/${MAX_RETRIES})…`);
      await sleep(wait);
    }

    const res = await fetch(VOYAGE_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, input: inputs }),
    });

    if (res.status === 429) {
      const body = await res.text();
      lastErr = new Error(`Voyage AI error ${res.status}: ${body}`);
      const wait = RPM_DELAY_MS * (attempt + 1);
      console.log(`  Rate limited. Waiting ${wait / 1000}s before retry…`);
      await sleep(wait);
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Voyage AI error ${res.status}: ${body}`);
    }

    const json = (await res.json()) as VoyageResponse;
    return json.data
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  }

  throw lastErr ?? new Error('Voyage AI: max retries exceeded');
}

export async function embedText(text: string): Promise<number[]> {
  const truncated = text.slice(0, 30000);
  const [embedding] = await callVoyage([truncated]);
  return embedding;
}

/**
 * Embed multiple texts. Batches by character count (not fixed count) to stay
 * under the free-tier 10K TPM limit (~32K chars per request). Inserts a 65s
 * delay between requests so the 1-minute token window resets.
 * Also never exceeds BATCH_LIMIT (128) inputs per request.
 * Returns embeddings in the same order as the input array.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const truncated = texts.map((t) => t.slice(0, 30000));
  const results: number[][] = new Array(truncated.length);

  // Split into sub-batches that fit within CHARS_PER_REQUEST
  const batches: Array<{ indices: number[]; texts: string[] }> = [];
  let currentBatch: { indices: number[]; texts: string[] } = { indices: [], texts: [] };
  let currentChars = 0;

  for (let i = 0; i < truncated.length; i++) {
    const t = truncated[i];
    const willExceedChars = currentChars + t.length > CHARS_PER_REQUEST && currentBatch.indices.length > 0;
    const willExceedCount = currentBatch.indices.length >= BATCH_LIMIT;
    if (willExceedChars || willExceedCount) {
      batches.push(currentBatch);
      currentBatch = { indices: [], texts: [] };
      currentChars = 0;
    }
    currentBatch.indices.push(i);
    currentBatch.texts.push(t);
    currentChars += t.length;
  }
  if (currentBatch.indices.length > 0) batches.push(currentBatch);

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    if (b > 0) {
      console.log(`  Waiting ${RPM_DELAY_MS / 1000}s between batches (rate limit)…`);
      await sleep(RPM_DELAY_MS);
    }
    console.log(`  Batch ${b + 1}/${batches.length}: ${batch.texts.length} texts, ~${Math.round(batch.texts.reduce((s, t) => s + t.length, 0) / 4)} tokens`);
    const embeddings = await callVoyage(batch.texts);
    for (let j = 0; j < embeddings.length; j++) {
      results[batch.indices[j]] = embeddings[j];
    }
  }
  return results;
}
