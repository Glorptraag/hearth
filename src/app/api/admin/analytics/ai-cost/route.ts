import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';
import { routeHandler } from '@/lib/api-helpers';
import { priceFor } from '@/config/ai-pricing';

/**
 * Aggregates `ai_pipeline_logs` for the admin AI Cost dashboard.
 *
 * Splits draft (`%-draft` model_used suffix) from full enrichment so the
 * draft-insight kill-switch threshold ($3/family/month, see deployment
 * runbook §3) is observable separately from write-time enrichment spend.
 *
 * Pricing is model-aware and lives in `src/config/ai-pricing.ts` —
 * `priceFor(model)` resolves any `model_used` value to per-Mtok rates.
 */

export const GET = routeHandler(async (req: NextRequest) => {
  const admin = await requireAdmin();
  if (!isAdminContext(admin)) return admin;

  const days = clamp(Number(req.nextUrl.searchParams.get('days') ?? '30'), 1, 180);

  // Per-day rollup, split draft vs full.
  const dailyRows = await db.execute(sql`
    SELECT
      date_trunc('day', created_at)::date AS day,
      CASE
        WHEN model_used LIKE '%-draft' THEN 'draft'
        ELSE 'full'
      END                                   AS kind,
      model_used                            AS model,
      COUNT(*)::int                         AS calls,
      SUM(input_tokens)::bigint             AS input_tokens,
      SUM(output_tokens)::bigint            AS output_tokens,
      AVG(latency_ms)::int                  AS avg_latency_ms,
      SUM(CASE WHEN retry_triggered THEN 1 ELSE 0 END)::int AS retries
    FROM ai_pipeline_logs
    WHERE created_at >= now() - (${days}::int * interval '1 day')
    GROUP BY 1, 2, 3
    ORDER BY 1 DESC, 2 DESC, 3 DESC
  `);

  const daily = (dailyRows.rows as Array<{
    day: string;
    kind: 'draft' | 'full';
    model: string;
    calls: number;
    input_tokens: string | number;
    output_tokens: string | number;
    avg_latency_ms: number;
    retries: number;
  }>).map((r) => {
    const inToks = Number(r.input_tokens);
    const outToks = Number(r.output_tokens);
    const price = priceFor(r.model);
    const usd = (inToks * price.input + outToks * price.output) / 1_000_000;
    return {
      day: r.day,
      kind: r.kind,
      model: r.model,
      calls: r.calls,
      inputTokens: inToks,
      outputTokens: outToks,
      avgLatencyMs: r.avg_latency_ms,
      retries: r.retries,
      usd: Number(usd.toFixed(4)),
    };
  });

  // Per-family rollup (kind- and model-split) for the noisy-family
  // check. We group by model so the price is accurate when a family
  // gets pushed onto a different model (e.g. fallback to Sonnet).
  const perFamilyRows = await db.execute(sql`
    SELECT
      family_id::text                       AS family_id,
      CASE
        WHEN model_used LIKE '%-draft' THEN 'draft'
        ELSE 'full'
      END                                   AS kind,
      model_used                            AS model,
      COUNT(*)::int                         AS calls,
      SUM(input_tokens)::bigint             AS input_tokens,
      SUM(output_tokens)::bigint            AS output_tokens
    FROM ai_pipeline_logs
    WHERE created_at >= now() - (${days}::int * interval '1 day')
    GROUP BY 1, 2, 3
    ORDER BY (SUM(input_tokens) + SUM(output_tokens)) DESC
    LIMIT 40
  `);

  const families = (perFamilyRows.rows as Array<{
    family_id: string;
    kind: 'draft' | 'full';
    model: string;
    calls: number;
    input_tokens: string | number;
    output_tokens: string | number;
  }>).map((r) => {
    const inToks = Number(r.input_tokens);
    const outToks = Number(r.output_tokens);
    const price = priceFor(r.model);
    const usd = (inToks * price.input + outToks * price.output) / 1_000_000;
    return {
      familyId: r.family_id,
      kind: r.kind,
      model: r.model,
      calls: r.calls,
      inputTokens: inToks,
      outputTokens: outToks,
      usd: Number(usd.toFixed(4)),
    };
  });

  // Period totals.
  const totals = daily.reduce(
    (acc, row) => {
      const bucket = row.kind === 'draft' ? acc.draft : acc.full;
      bucket.calls += row.calls;
      bucket.inputTokens += row.inputTokens;
      bucket.outputTokens += row.outputTokens;
      bucket.usd = Number((bucket.usd + row.usd).toFixed(4));
      return acc;
    },
    {
      draft: { calls: 0, inputTokens: 0, outputTokens: 0, usd: 0 },
      full: { calls: 0, inputTokens: 0, outputTokens: 0, usd: 0 },
    },
  );

  // Build a model→price map covering every model seen in the period.
  // The UI renders this as a footnote so the admin can see exactly what
  // rate produced each row's USD.
  const modelsSeen = new Set<string>([...daily.map((d) => d.model), ...families.map((f) => f.model)]);
  const pricing: Record<string, { input: number; output: number }> = {};
  for (const m of modelsSeen) {
    pricing[m] = priceFor(m);
  }

  return NextResponse.json({
    days,
    daily,
    families,
    totals,
    pricing,
    generatedAt: new Date().toISOString(),
  });
}, { route: 'GET /api/admin/analytics/ai-cost' });

function clamp(n: number, lo: number, hi: number) {
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}
