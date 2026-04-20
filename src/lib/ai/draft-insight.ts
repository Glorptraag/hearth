import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/db';
import { aiPipelineLogs } from '@/lib/db/schema';

/**
 * Lightweight in-Logger Haiku call that mirrors back subjects, threads, and
 * a single warm reflective sentence while the parent is still writing.
 *
 * Intentionally smaller than enrich.ts:
 *  - 256 output tokens (cap cost)
 *  - no curriculum descriptors, no per-child signals, no journey observations
 *  - ephemeral prompt cache on the leaner system prompt
 *
 * Cost posture (decision B): firm caps, monitored against a $3/month ceiling.
 *  - Per-family rate limit: 20 draft calls / minute (enforced at the API
 *    route), well above normal debounced typing rate.
 *  - Per-call cost ceiling: max_tokens=256 output, ~500 input tokens amortised
 *    via cache. At Haiku list prices that's ~$0.004/call uncached, <$0.001
 *    cached. Even a heavy pilot (20 families × 200 calls/month) stays <$2.
 */

const VALID_THREAD_IDS = new Set([
  'L1','L2','L3','L4','L5','L6','L7','L8','L9',
  'M1','M2','M3','M4','M5','M6','M7','M8','M9',
  'S1','S2','S3','S4','S5','S6','S7',
  'H1','H2','H3','H4','H5','H6',
  'P1','P2','P3','P4','P5',
  'PS1','PS2','PS3','PS4','PS5','PS6','PS7',
  'C1','C2','C3','C4','C5','C6','C7',
  'EF1','EF2','EF3','EF4','EF5','EF6','EF7','EF8',
]);

const DRAFT_SYSTEM_PROMPT = `You are Hearth's draft insight helper. A parent is still writing a learning-moment description; reflect back what you're noticing in one warm, gentle sentence and a short structured tag set.

OUTPUT SCHEMA (JSON only, no markdown, no preamble):
{
  "subjects": ["string"],
  "threads": ["string"],
  "reflection": "string"
}

RULES:
- "subjects" uses only: Mathematics, English, Science, HASS, The Arts, Technologies, HPE, Languages. 0–3 items.
- "threads" uses only IDs from this list: L1–L9, M1–M9, S1–S7, H1–H6, P1–P5, PS1–PS7, C1–C7, EF1–EF8. 0–5 items.
- "reflection" is ONE sentence, max 25 words, written to the parent (second person "you" is fine), warm and observational tone. Never clinical. Never a judgement. Never a recommendation.
- If the description is too short or too vague to tell, return empty arrays and a reflection like "Tell me more — I'm not quite seeing it yet."
- Return ONLY valid JSON.`;

export type DraftInsight = {
  subjects: string[];
  threads: string[];
  reflection: string;
};

export async function generateDraftInsight(input: {
  description: string;
  childNames: string[];
  familyId: string;
}): Promise<DraftInsight | null> {
  const { description, childNames, familyId } = input;
  if (description.trim().length < 20) return null;

  const startTime = Date.now();

  try {
    const client = new Anthropic();

    const userPrompt = [
      childNames.length > 0 ? `Children present: ${childNames.join(', ')}.` : null,
      `Parent is writing:`,
      `"""`,
      description.slice(0, 800),
      `"""`,
    ]
      .filter(Boolean)
      .join('\n');

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: [
        {
          type: 'text',
          text: DRAFT_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    const raw = JSON.parse(text) as Partial<DraftInsight>;

    // Validate and clamp
    const validated: DraftInsight = {
      subjects: Array.isArray(raw.subjects) ? raw.subjects.slice(0, 3) : [],
      threads: Array.isArray(raw.threads)
        ? raw.threads.filter((t) => typeof t === 'string' && VALID_THREAD_IDS.has(t)).slice(0, 5)
        : [],
      reflection: typeof raw.reflection === 'string' ? raw.reflection.slice(0, 200) : '',
    };

    // Log to aiPipelineLogs with a distinguishing model label so admin
    // analytics can separate draft-vs-save spend. Fire and forget.
    db.insert(aiPipelineLogs)
      .values({
        familyId,
        entryId: null,
        modelUsed: 'claude-haiku-4-5-20251001-draft',
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        latencyMs: Date.now() - startTime,
        confidence: null,
        retryTriggered: false,
      })
      .catch(() => {
        // non-fatal
      });

    return validated;
  } catch {
    return null;
  }
}
