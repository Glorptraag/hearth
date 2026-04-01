import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { aiPipelineLogs } from '@/lib/db/schema';
import { desc, gte } from 'drizzle-orm';
import { subDays } from 'date-fns';

export default async function TokensDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const adminIds = (process.env.ADMIN_CLERK_IDS ?? '').split(',').filter(Boolean);
  if (!adminIds.includes(userId)) redirect('/dashboard');

  const since = subDays(new Date(), 30);

  const logs = await db
    .select()
    .from(aiPipelineLogs)
    .where(gte(aiPipelineLogs.createdAt, since))
    .orderBy(desc(aiPipelineLogs.createdAt))
    .limit(200);

  const totalCalls = logs.length;
  const totalInput = logs.reduce((s, l) => s + (l.inputTokens ?? 0), 0);
  const totalOutput = logs.reduce((s, l) => s + (l.outputTokens ?? 0), 0);
  const avgLatency =
    totalCalls > 0
      ? Math.round(logs.reduce((s, l) => s + (l.latencyMs ?? 0), 0) / totalCalls)
      : 0;
  const retries = logs.filter((l) => l.retryTriggered).length;

  const byModel: Record<string, { calls: number; input: number; output: number }> = {};
  for (const log of logs) {
    const m = log.modelUsed ?? 'unknown';
    if (!byModel[m]) byModel[m] = { calls: 0, input: 0, output: 0 };
    byModel[m].calls++;
    byModel[m].input += log.inputTokens ?? 0;
    byModel[m].output += log.outputTokens ?? 0;
  }

  const summaryStats = [
    { emoji: '📊', label: 'API calls', value: totalCalls.toLocaleString() },
    { emoji: '📥', label: 'Input tokens', value: totalInput.toLocaleString() },
    { emoji: '📤', label: 'Output tokens', value: totalOutput.toLocaleString() },
    { emoji: '⚡', label: 'Avg latency', value: `${avgLatency}ms` },
  ];

  return (
    <div className="px-md py-lg max-w-4xl mx-auto">
      <div className="mb-xl">
        <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">
          Admin
        </p>
        <h1 className="font-serif text-2xl font-semibold text-text-primary mb-xs">
          AI Token Usage
        </h1>
        <p className="font-serif text-text-secondary text-sm">Last 30 days</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-md mb-xl">
        {summaryStats.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-panel rounded-lg border border-border-subtle p-md"
          >
            <span className="text-xl block mb-xs">{stat.emoji}</span>
            <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-xs">
              {stat.label}
            </p>
            <p className="font-sans text-xl font-semibold text-text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* By model breakdown */}
      <div className="bg-surface-panel rounded-lg border border-border-subtle p-xl mb-xl">
        <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted mb-md">
          By Model
        </p>
        <div className="divide-y divide-border-subtle">
          {Object.entries(byModel).map(([model, stats]) => (
            <div key={model} className="flex items-center justify-between py-sm">
              <div>
                <p className="font-serif text-sm font-semibold text-text-primary">{model}</p>
                <p className="font-sans text-xs text-text-muted">{stats.calls} calls</p>
              </div>
              <div className="text-right">
                <p className="font-sans text-sm text-text-secondary">
                  {stats.input.toLocaleString()} in
                </p>
                <p className="font-sans text-xs text-text-muted">
                  {stats.output.toLocaleString()} out
                </p>
              </div>
            </div>
          ))}
          {Object.keys(byModel).length === 0 && (
            <p className="font-serif text-sm text-text-muted py-md text-center">
              No calls recorded in this period.
            </p>
          )}
        </div>
      </div>

      {/* Retry indicator */}
      {retries > 0 && (
        <div className="bg-ember-glow/20 rounded-lg border border-ember/20 p-md mb-xl">
          <p className="font-sans text-sm text-text-secondary">
            <span className="text-ember font-semibold">⚠ {retries} retries</span> in the last 30
            days — low-confidence responses that triggered Sonnet fallback.
          </p>
        </div>
      )}

      {/* Recent calls table */}
      <div className="bg-surface-panel rounded-lg border border-border-subtle overflow-hidden">
        <div className="p-md border-b border-border-subtle">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-text-muted">
            Recent Calls
          </p>
        </div>
        <div className="divide-y divide-border-subtle max-h-[400px] overflow-y-auto">
          {logs.slice(0, 20).map((log) => (
            <div key={log.id} className="flex items-center gap-md px-md py-sm">
              <span className="font-sans text-[10px] text-text-muted w-[100px] flex-shrink-0">
                {log.createdAt
                  ? new Date(log.createdAt).toLocaleDateString('en-AU', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </span>
              <span className="font-sans text-xs text-text-secondary flex-shrink-0 w-[80px]">
                {log.modelUsed}
              </span>
              <span className="font-sans text-xs text-text-muted flex-1">
                {(log.inputTokens ?? 0) + (log.outputTokens ?? 0)} tokens · {log.latencyMs}ms
              </span>
              {log.retryTriggered && (
                <span className="font-sans text-[10px] text-ember bg-ember-glow px-xs py-[1px] rounded-full flex-shrink-0">
                  retry
                </span>
              )}
            </div>
          ))}
          {logs.length === 0 && (
            <p className="font-serif text-sm text-text-muted py-lg text-center">
              No recent calls.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
