import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { requireAdmin, isAdminContext } from '@/lib/admin/guard';

/**
 * Aggregates `ai_pipeline_logs` for the admin AI Cost dashboard.
 *
 * Splits draft (`%-draft` model_used suffix) from full enrichment so the
 * draft-insight kill-switch threshold ($3/family/month, see deployment
 * runbook §3) is observable separately from write-time enrichment spend.
 *
 * Pricing reflects Anthropic's published Haiku 4.5 pricing as of pilot
 * launch — update PRICING below if a different model is wired in. The
 * server returns USD totals; the UI adds no further math.
 */

const PRICING_PER_MTOK: Record<string, { input: number; output: number }> = {
  // Defaults — Haiku 4.5
  default: { input: 0.8, output: 4.0 },
};

function priceFor(model: string) {
  // Strip the `-draft` suffix so draft and full enrichment use the same
  // base price; we already separate them in the rollup row.
  const base = model.replace(/-draft$/, '');
  return PRICING_PER_MTOK[base] ?? PRICING_PER_MTOK.default;
}

export async function GET(req: NextRequest) {
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

  const days_ = (dailyRows.rows as Array<{
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

  // Per-family rollup (kind-split) for the noisy-family check.
  const perFamilyRows = await db.execute(sql`
    SELECT
      family_id::text                       AS family_id,
      CASE
        WHEN model_used LIKE '%-draft' THEN 'draft'
        ELSE 'full'
      END                                   AS kind,
      COUNT(*)::int                         AS calls,
      SUM(input_tokens)::bigint             AS input_tokens,
      SUM(output_tokens)::bigint            AS output_tokens
    FROM ai_pipeline_logs
    WHERE created_at >= now() - (${days}::int * interval '1 day')
    GROUP BY 1, 2
    ORDER BY (SUM(input_tokens) + SUM(output_tokens)) DESC
    LIMIT 20
  `);

  const families = (perFamilyRows.rows as Array<{
    family_id: string;
    kind: 'draft' | 'full';
    calls: number;
    input_tokens: string | number;
    output_tokens: string | number;
  }>).map((r) => {
    const inToks = Number(r.input_tokens);
    const outToks = Number(r.output_tokens);
    const price = PRICING_PER_MTOK.default;
    const usd = (inToks * price.input + outToks * price.output) / 1_000_000;
    return {
      familyId: r.family_id,
      kind: r.kind,
      calls: r.calls,
      inputTokens: inToks,
      outputTokens: outToks,
      usd: Number(usd.toFixed(4)),
    };
  });

  // Period totals.
  const totals = days_.reduce(
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

  return NextResponse.json({
    days,
    days_,
    families,
    totals,
    pricing: PRICING_PER_MTOK.default,
    generatedAt: new Date().toISOString(),
  });
}

function clamp(n: number, lo: number, hi: number) {
  if (Number.isNaN(n)) return lo;
  return Math.min(hi, Math.max(lo, n));
}
