/**
 * Text-similarity primitives — extracted from `sparse-content-checks.ts` so that
 * `overlap-check.ts` and any future similarity-based check can share one tokenizer
 * and one stopword list without import cycles.
 *
 * No I/O. Pure functions. Stable shape — STOPWORDS only grows; never reorder
 * or remove entries silently because callers may serialise based on them.
 */

// Common English stopwords plus a few content-bias terms that recur across
// understanding goals (e.g. "help", "between"). These are filtered before
// Jaccard so that high-frequency function words don't inflate similarity.
export const STOPWORDS: Set<string> = new Set([
  'with',
  'without',
  'when',
  'they',
  'this',
  'that',
  'their',
  'them',
  'from',
  'into',
  'have',
  'will',
  'about',
  'while',
  'some',
  'most',
  'over',
  'each',
  'than',
  'then',
  'these',
  'those',
  'where',
  'which',
  'what',
  'were',
  'been',
  'because',
  'help',
  'helps',
  'between',
]);

/**
 * Lowercase + split-on-non-alnum + drop tokens of length ≤ 3 + drop stopwords.
 * Returns a deduplicated array (call-site can wrap in Set if it wants set ops).
 */
export function tokens(s: string): string[] {
  if (!s) return [];
  const out = new Set<string>();
  for (const w of s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) {
    if (w.length > 3 && !STOPWORDS.has(w)) out.add(w);
  }
  return Array.from(out);
}

/**
 * Jaccard similarity between two token arrays. Empty inputs return 0.
 * Deduplication is done internally so callers can pass plain arrays.
 */
export function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let inter = 0;
  for (const x of setA) if (setB.has(x)) inter++;
  const union = setA.size + setB.size - inter;
  return union === 0 ? 0 : inter / union;
}
