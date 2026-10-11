// Retrieval-based CoachHintProvider — the v1 implementation.
// Wraps the pedagogy knowledge base with a tight budget (top-k 2, ~400 tokens)
// and session-caches results on (description_hash, learnerIds.sorted,
// activityType). No LLM call. Returns [] cleanly when PEDAGOGY_KB_ENABLED=false
// or retrieval fails.

import { createHash } from 'crypto';
import {
  retrievePedagogyChunks,
  type RetrievedChunk,
} from '@/lib/pedagogy/retrieval';
import { deriveSituationalSignals } from '@/lib/pedagogy/situational-signals';
import type {
  CoachHintProvider,
  CoachHintInput,
  CoachHint,
} from './types';

const MAX_HINTS = 2;
const TOKEN_BUDGET = 400;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — mirrors Claude prompt cache

type RetrievalFn = typeof retrievePedagogyChunks;
type FrameworkLookup = (familyId: string) => Promise<string>;

type CacheEntry = {
  hints: CoachHint[];
  expiresAt: number;
};

export class RetrievalCoachProvider implements CoachHintProvider {
  private cache = new Map<string, CacheEntry>();

  constructor(
    // DI seams so the unit test can pass mocks without booting the DB.
    private readonly retrieve: RetrievalFn = retrievePedagogyChunks,
    private readonly getFramework: FrameworkLookup = defaultFrameworkLookup,
  ) {}

  async getHints(input: CoachHintInput): Promise<CoachHint[]> {
    if (process.env.PEDAGOGY_KB_ENABLED !== 'true') return [];

    const key = this.cacheKey(input);
    const now = Date.now();
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > now) return hit.hints;

    let hints: CoachHint[] = [];
    try {
      const framework = await this.getFramework(input.familyId);
      const activeThreads = [...new Set(
        Object.values(input.snapshotSignals?.perChild ?? {}).flatMap((s) => s.active ?? []),
      )];

      // Chip labels and the UI activity key are translated into the corpus
      // vocabulary; the raw labels ("Deeply focused") matched no tag at all.
      const situational = deriveSituationalSignals({
        context: { activityType: input.activityType, observations: input.observations },
      });

      const result = await this.retrieve({
        pedagogyKey: framework,
        capabilityThreads: activeThreads,
        ageRange: { min: 0, max: 18 },
        activityType: situational.activityType,
        situationalSignals: situational.signals,
        loggerEntryText: input.description.slice(0, 400),
        topN: MAX_HINTS,
      });

      if (!result.fallbackUsed) {
        hints = mapChunksToHints(result.chunks);
      }
    } catch (err) {
      console.error('[retrieval-provider] retrieval failed:', err);
      hints = [];
    }

    this.cache.set(key, { hints, expiresAt: now + CACHE_TTL_MS });
    return hints;
  }

  private cacheKey(input: CoachHintInput): string {
    const descHash = createHash('sha1')
      .update(input.description.trim().toLowerCase())
      .digest('hex')
      .slice(0, 16);
    const learners = [...input.learnerIds].sort().join(',');
    const activity = input.activityType ?? 'none';
    // Observations are a retrieval input, so they belong in the key — a chip
    // toggled mid-sentence previously served the stale pre-chip hints.
    const chips = [...input.observations].sort().join(',');
    return `${descHash}|${learners}|${activity}|${chips}`;
  }
}

// Chunk → CoachHint mapping. Metadata drives the title (heading/title/concept
// fall back to a formatted layer label); first sentence of the chunk body
// becomes the hint body. Kept pure so the test can exercise it directly.
export function mapChunksToHints(chunks: RetrievedChunk[]): CoachHint[] {
  const out: CoachHint[] = [];
  let tokenBudget = TOKEN_BUDGET;

  for (const chunk of chunks) {
    if (out.length >= MAX_HINTS) break;
    const { title, body } = splitChunkToHint(chunk);
    const tokens = Math.ceil((title.length + body.length) / 4);
    if (tokens > tokenBudget) break;
    tokenBudget -= tokens;

    out.push({
      id: `hint-${chunk.id}`,
      kind: hintKindForLayer(chunk.layer),
      title,
      body,
      sourceRef: `${chunk.pedagogyKey}:${chunk.layer}:${chunk.id}`,
    });
  }

  return out;
}

function splitChunkToHint(chunk: RetrievedChunk): { title: string; body: string } {
  const meta = chunk.metadata ?? {};
  const metaTitle =
    (meta.heading as string | undefined) ??
    (meta.title as string | undefined) ??
    (meta.concept as string | undefined);

  const firstSentence = chunk.text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)[0]
    ?.slice(0, 220) ?? '';

  const title = (metaTitle ?? layerLabel(chunk.layer)).slice(0, 80);
  return { title, body: firstSentence };
}

function hintKindForLayer(layer: string): CoachHint['kind'] {
  const l = layer.toLowerCase();
  if (l.includes('question')) return 'question';
  if (l.includes('pattern')) return 'pattern';
  return 'teaching';
}

function layerLabel(layer: string): string {
  return layer.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

async function defaultFrameworkLookup(familyId: string): Promise<string> {
  const { db } = await import('@/lib/db');
  const { familySettings } = await import('@/lib/db/schema');
  const { eq } = await import('drizzle-orm');
  const rows = await db
    .select({ framework: familySettings.pedagogyPreference })
    .from(familySettings)
    .where(eq(familySettings.familyId, familyId))
    .limit(1);
  return rows[0]?.framework ?? 'eclectic';
}
