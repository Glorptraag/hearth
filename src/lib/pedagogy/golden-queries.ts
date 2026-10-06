/**
 * Golden-query evaluation for the PKB retrieval verifier
 * (scripts/verify-pkb-retrieval.ts, PLAN-pkb-completion E8). Pure, so the
 * expectation logic and the fixture shape are unit-tested here while the
 * script itself stays an ops tool that needs a populated index and a Voyage
 * key. Expectations are framework/layer-level only — never document ids — so
 * corpus growth does not break them.
 */
import type { RetrievalResponse } from './retrieval';

export type GoldenQuery = {
  id: string;
  pedagogyKey: string;
  text: string;
  situationalSignals?: string[];
  childAges?: number[];
  capabilityThreads?: string[];
  activityType?: string;
  /** Frameworks not yet populated: an unmet expectation is reported, not failed. */
  optional?: boolean;
  expect: {
    minChunks?: number;
    layersInclude?: string[];
    frameworksOnly?: string[];
    minFrameworks?: number;
  };
};

export const GOLDEN_EXPECTATION_KEYS = ['minChunks', 'layersInclude', 'frameworksOnly', 'minFrameworks'] as const;

export type GoldenVerdict = {
  id: string;
  pedagogyKey: string;
  optional: boolean;
  passed: boolean;
  failures: string[];
  returned: number;
  totalMatched: number;
  latencyMs: number;
  fallbackUsed: boolean;
  rows: Array<{ rank: number; id: string; layer: string; framework: string; score: string; reasons: string }>;
};

export function evaluateGoldenQuery(q: GoldenQuery, res: RetrievalResponse): GoldenVerdict {
  const failures: string[] = [];
  const layers = new Set(res.chunks.map((c) => c.layer));
  const frameworks = new Set(res.chunks.map((c) => c.pedagogyKey));

  if (q.expect.minChunks != null && res.chunks.length < q.expect.minChunks) {
    failures.push(`expected ≥${q.expect.minChunks} chunks, got ${res.chunks.length}`);
  }
  for (const layer of q.expect.layersInclude ?? []) {
    if (!layers.has(layer)) failures.push(`expected a ${layer} chunk in the top ${res.chunks.length}`);
  }
  if (q.expect.frameworksOnly) {
    const allowed = new Set(q.expect.frameworksOnly);
    for (const f of frameworks) if (!allowed.has(f)) failures.push(`unexpected framework ${f}`);
  }
  if (q.expect.minFrameworks != null && frameworks.size < q.expect.minFrameworks) {
    failures.push(`expected ≥${q.expect.minFrameworks} frameworks, got ${frameworks.size}`);
  }

  return {
    id: q.id,
    pedagogyKey: q.pedagogyKey,
    optional: q.optional === true,
    passed: failures.length === 0,
    failures,
    returned: res.chunks.length,
    totalMatched: res.totalMatched,
    latencyMs: res.retrievalLatencyMs,
    fallbackUsed: res.fallbackUsed,
    rows: res.chunks.map((c, i) => ({
      rank: i + 1,
      id: c.id,
      layer: c.layer,
      framework: c.pedagogyKey,
      score: c.similarityScore.toFixed(3),
      reasons: c.matchReasons.join('; ') || '—',
    })),
  };
}
