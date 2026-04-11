// Voyage AI embedding service — write-time enrichment only.
// voyage-3 produces 1024-dimensional vectors; batch limit is 128 inputs per call.

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const MODEL = 'voyage-3';
export const EMBEDDING_DIMENSIONS = 1024;
const BATCH_LIMIT = 128;

export const EMBEDDING_CONFIG = {
  model: MODEL,
  dimensions: EMBEDDING_DIMENSIONS,
} as const;

interface VoyageResponse {
  data: Array<{ embedding: number[]; index: number }>;
  usage: { total_tokens: number };
}

async function callVoyage(inputs: string[]): Promise<number[][]> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) throw new Error('VOYAGE_API_KEY is not set');

  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, input: inputs }),
  });

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

export async function embedText(text: string): Promise<number[]> {
  const truncated = text.slice(0, 30000);
  const [embedding] = await callVoyage([truncated]);
  return embedding;
}

/**
 * Embed multiple texts. Automatically batches to stay within the 128-input limit.
 * Returns embeddings in the same order as the input array.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const truncated = texts.map((t) => t.slice(0, 30000));
  const results: number[][] = new Array(truncated.length);
  for (let i = 0; i < truncated.length; i += BATCH_LIMIT) {
    const batch = truncated.slice(i, i + BATCH_LIMIT);
    const embeddings = await callVoyage(batch);
    for (let j = 0; j < embeddings.length; j++) {
      results[i + j] = embeddings[j];
    }
  }
  return results;
}
