import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { embedText } from './embedding';

export interface RetrievalRequest {
  pedagogyKey: string;
  capabilityThreads: string[];
  ageRange: { min: number; max: number };
  activityType?: string;
  situationalSignals: string[];
  loggerEntryText?: string;
  topN?: number;
}

export interface RetrievedChunk {
  id: string;
  pedagogyKey: string;
  layer: string;
  text: string;
  metadata: Record<string, unknown>;
  similarityScore: number;
  matchReasons: string[];
}

export interface RetrievalResponse {
  chunks: RetrievedChunk[];
  totalMatched: number;
  retrievalLatencyMs: number;
  fallbackUsed: boolean;
}

interface RankedCandidate {
  id: string;
  pedagogyKey: string;
  layer: string;
  text: string;
  metadata: Record<string, unknown>;
  rawScore: number;
  adjustedScore: number;
  matchReasons: string[];
}

export async function retrievePedagogyChunks(
  opts: RetrievalRequest
): Promise<RetrievalResponse> {
  const startTime = Date.now();
  const topN = opts.topN ?? 8;

  try {
    // 1. Compose query text
    const queryText = opts.loggerEntryText
      ? opts.loggerEntryText
      : [
          opts.situationalSignals.join(' '),
          `capability threads: ${opts.capabilityThreads.join(' ')}`,
          `age ${opts.ageRange.min}-${opts.ageRange.max}`,
          `activity: ${opts.activityType ?? 'general'}`,
        ]
          .filter(Boolean)
          .join(' | ');

    // 2. Embed the query
    const queryEmbedding = await embedText(queryText);
    const embeddingLiteral = `[${queryEmbedding.join(',')}]`;

    // 3. Vector search with pedagogy filter
    const result = await db.execute(sql`
      SELECT
        id,
        pedagogy_key,
        layer,
        text,
        metadata,
        1 - (embedding <=> ${embeddingLiteral}::vector) AS similarity_score
      FROM pedagogy_knowledge_chunks
      WHERE pedagogy_key = ${opts.pedagogyKey}
      ORDER BY embedding <=> ${embeddingLiteral}::vector
      LIMIT 50
    `);

    type ChunkRow = {
      id: string;
      pedagogy_key: string;
      layer: string;
      text: string;
      metadata: Record<string, unknown>;
      similarity_score: number;
    };

    const rows = result.rows as ChunkRow[];

    if (rows.length === 0) {
      const latency = Date.now() - startTime;
      logRetrieval(opts, 0, 0, latency, true);
      return { chunks: [], totalMatched: 0, retrievalLatencyMs: latency, fallbackUsed: true };
    }

    // 4. Rerank with metadata boosts
    const candidates: RankedCandidate[] = rows.map((row) => {
      const reasons: string[] = [];
      let boost = 0;
      const meta = row.metadata ?? {};

      // Age range overlap
      const docAges = (meta.appliesAtAges ?? meta.ageRange) as
        | { min: number; max: number }
        | undefined;
      if (docAges && agesOverlap(docAges, opts.ageRange)) {
        boost += 0.05;
        reasons.push(`matched age range ${docAges.min}-${docAges.max}`);
      }

      // Capability thread overlap
      const docThreads = (meta.capabilityThreadRelevance ??
        meta.capabilityThreadMapping ??
        meta.capabilityThreads) as string[] | undefined;
      if (docThreads && opts.capabilityThreads.length > 0) {
        const overlap = opts.capabilityThreads.filter((t) =>
          docThreads.includes(t)
        );
        if (overlap.length > 0) {
          const threadBoost = Math.min(overlap.length * 0.05, 0.15);
          boost += threadBoost;
          reasons.push(`matched threads: ${overlap.join(', ')}`);
        }
      }

      // Situational signal match
      const docSignals = (meta.situationalRelevance ?? meta.situationalTriggers) as
        | string[]
        | undefined;
      if (docSignals && opts.situationalSignals.length > 0) {
        const signalMatches = opts.situationalSignals.filter((s) =>
          docSignals.includes(s)
        );
        if (signalMatches.length > 0) {
          boost += signalMatches.length * 0.1;
          reasons.push(`matched signals: ${signalMatches.join(', ')}`);
        }
      }

      // Tags-based match (covers chunks with only tags metadata)
      const docTags = meta.tags as string[] | undefined;
      if (docTags && docTags.length > 0) {
        // Match situational signals against tags
        const tagSignalMatches = opts.situationalSignals.filter((s) =>
          docTags.some((t) => t === s || t.includes(s) || s.includes(t))
        );
        if (tagSignalMatches.length > 0) {
          boost += Math.min(tagSignalMatches.length * 0.05, 0.15);
          reasons.push(`tags matched signals: ${tagSignalMatches.join(', ')}`);
        }

        // Match capability threads against tags
        const tagThreadMatches = opts.capabilityThreads.filter((thread) =>
          docTags.some((t) => t === thread || t.includes(thread) || thread.includes(t))
        );
        if (tagThreadMatches.length > 0) {
          boost += Math.min(tagThreadMatches.length * 0.03, 0.09);
          reasons.push(`tags matched threads: ${tagThreadMatches.join(', ')}`);
        }

        // Semantic label for all chunks: summarise tags as reason
        if (reasons.length === 0 && docTags.length > 0) {
          reasons.push(`semantic match (tags: ${docTags.slice(0, 3).join(', ')})`);
        }
      }

      // Activity type match
      if (opts.activityType && meta.activityType === opts.activityType) {
        boost += 0.05;
        reasons.push(`matched activity type: ${opts.activityType}`);
      }

      return {
        id: row.id,
        pedagogyKey: row.pedagogy_key,
        layer: row.layer,
        text: row.text,
        metadata: row.metadata,
        rawScore: row.similarity_score,
        adjustedScore: row.similarity_score + boost,
        matchReasons: reasons,
      };
    });

    // 5. Sort by adjusted score
    candidates.sort((a, b) => b.adjustedScore - a.adjustedScore);

    // 6. Layer balance selection
    const selected = selectWithLayerBalance(candidates, topN);

    const latency = Date.now() - startTime;
    logRetrieval(opts, rows.length, selected.length, latency, false);

    return {
      chunks: selected.map((c) => ({
        id: c.id,
        pedagogyKey: c.pedagogyKey,
        layer: c.layer,
        text: c.text,
        metadata: c.metadata,
        similarityScore: c.adjustedScore,
        matchReasons: c.matchReasons,
      })),
      totalMatched: rows.length,
      retrievalLatencyMs: latency,
      fallbackUsed: false,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('[pedagogy_retrieval] Error:', error);
    logRetrieval(opts, 0, 0, latency, true, String(error));
    return { chunks: [], totalMatched: 0, retrievalLatencyMs: latency, fallbackUsed: true };
  }
}

function selectWithLayerBalance(
  candidates: RankedCandidate[],
  topN: number
): RankedCandidate[] {
  const selected: RankedCandidate[] = [];
  const remaining = [...candidates];

  // Guarantee slots for key layers (if available)
  const guarantees: Array<{ layer: string; count: number }> = [
    { layer: 'source_excerpt', count: 2 },
    { layer: 'practice_pattern', count: 1 },
    { layer: 'worked_example', count: 1 },
  ];

  for (const { layer, count } of guarantees) {
    let filled = 0;
    for (let i = 0; i < remaining.length && filled < count; i++) {
      if (remaining[i].layer === layer) {
        selected.push(remaining[i]);
        remaining.splice(i, 1);
        i--;
        filled++;
      }
    }
  }

  // Fill remaining slots from highest adjusted score
  for (const candidate of remaining) {
    if (selected.length >= topN) break;
    selected.push(candidate);
  }

  // Sort final selection by adjusted score (highest first)
  selected.sort((a, b) => b.adjustedScore - a.adjustedScore);

  return selected.slice(0, topN);
}

function agesOverlap(
  a: { min: number; max: number },
  b: { min: number; max: number }
): boolean {
  return a.min <= b.max && a.max >= b.min;
}

function logRetrieval(
  opts: RetrievalRequest,
  totalMatched: number,
  topNReturned: number,
  retrievalLatencyMs: number,
  fallbackUsed: boolean,
  error?: string
) {
  console.log(
    JSON.stringify({
      event: 'pedagogy_retrieval',
      pedagogyKey: opts.pedagogyKey,
      capabilityThreadsCount: opts.capabilityThreads.length,
      situationalSignalsCount: opts.situationalSignals.length,
      totalMatched,
      topNReturned,
      retrievalLatencyMs,
      fallbackUsed,
      ...(error ? { error } : {}),
    })
  );
}
