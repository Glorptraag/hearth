import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiPipelineLogs } from '@/lib/db/schema';
import { desc, gte } from 'drizzle-orm';
import { subDays } from 'date-fns';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminIds = (process.env.ADMIN_CLERK_IDS ?? '').split(',').filter(Boolean);
  if (!adminIds.includes(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const since = subDays(new Date(), 30);

  const logs = await db
    .select({
      modelUsed: aiPipelineLogs.modelUsed,
      inputTokens: aiPipelineLogs.inputTokens,
      outputTokens: aiPipelineLogs.outputTokens,
      latencyMs: aiPipelineLogs.latencyMs,
      retryTriggered: aiPipelineLogs.retryTriggered,
      createdAt: aiPipelineLogs.createdAt,
    })
    .from(aiPipelineLogs)
    .where(gte(aiPipelineLogs.createdAt, since))
    .orderBy(desc(aiPipelineLogs.createdAt))
    .limit(500);

  const totalCalls = logs.length;
  const totalInputTokens = logs.reduce((s, l) => s + (l.inputTokens ?? 0), 0);
  const totalOutputTokens = logs.reduce((s, l) => s + (l.outputTokens ?? 0), 0);
  const avgLatencyMs =
    totalCalls > 0
      ? Math.round(logs.reduce((s, l) => s + (l.latencyMs ?? 0), 0) / totalCalls)
      : 0;
  const retryCount = logs.filter((l) => l.retryTriggered).length;

  const byModel: Record<string, { calls: number; inputTokens: number; outputTokens: number }> = {};
  for (const log of logs) {
    const m = log.modelUsed ?? 'unknown';
    if (!byModel[m]) byModel[m] = { calls: 0, inputTokens: 0, outputTokens: 0 };
    byModel[m].calls += 1;
    byModel[m].inputTokens += log.inputTokens ?? 0;
    byModel[m].outputTokens += log.outputTokens ?? 0;
  }

  return NextResponse.json({
    totalCalls,
    totalInputTokens,
    totalOutputTokens,
    avgLatencyMs,
    retryCount,
    byModel,
    recentLogs: logs.slice(0, 20),
  });
}
