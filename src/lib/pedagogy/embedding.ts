const EMBEDDING_MODEL = 'voyage-3';
const EMBEDDING_DIMENSIONS = 1024;
const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';
const MAX_BATCH_SIZE = 128;

export const EMBEDDING_CONFIG = {
  model: EMBEDDING_MODEL,
  dimensions: EMBEDDING_DIMENSIONS,
} as const;

async function callVoyageAPI(input: string | string[]): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) throw new Error('VOYAGE_API_KEY is not set');

  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: Array.isArray(input) ? input : [input],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Voyage API error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as {
    data: Array<{ embedding: number[]; index: number }>;
  };

  return data.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

export async function embedText(text: string): Promise<number[]> {
  const truncated = text.slice(0, 30000);
  const results = await callVoyageAPI(truncated);
  return results[0];
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  if (texts.length > MAX_BATCH_SIZE) {
    throw new Error(
      `Batch size ${texts.length} exceeds Voyage limit of ${MAX_BATCH_SIZE}; split into multiple calls`
    );
  }

  const truncated = texts.map((t) => t.slice(0, 30000));
  return callVoyageAPI(truncated);
}
