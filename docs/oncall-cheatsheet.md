<!-- Version: 1 | Date: 2026-04-26 | Changes: Initial one-page oncall reference for the alpha pilot. -->

# Hearth — Oncall Cheat Sheet

> One-page emergency reference. Solo-dev pilot scale (10–20 families). For depth on any incident, jump to [`docs/incident-runbook.md`](./incident-runbook.md). For env/deploy context, [`docs/deployment-runbook.md`](./deployment-runbook.md). For the full free-tier matrix + tip points on every external service, [`docs/external-services-guide.md`](./external-services-guide.md).

## When to use this doc

A real user reports breakage, OR Sentry / PostHog / Anthropic / Neon throws an alert. Walk top-to-bottom: dashboards, kill switches, then the symptom table. Bring novel incidents back into the runbook so the next occurrence is fast.

## Critical dashboards (open these first)

| Need | URL pattern (fill in your IDs) |
|---|---|
| Sentry errors, last 1h | `https://sentry.io/organizations/<org>/projects/hearth-prod/issues/?statsPeriod=1h` |
| PostHog live events | `https://<your-posthog-host>/project/<id>/events` |
| Vercel deployments | `https://vercel.com/<org>/hearth-prod` |
| Vercel cron logs | `https://vercel.com/<org>/hearth-prod/settings/crons` |
| Neon project (data + PITR) | `https://console.neon.tech/app/projects/<id>` |
| Anthropic usage / spend | `https://console.anthropic.com/settings/usage` |

Save these as a browser folder. The five seconds spent typing them mid-incident are the worst five seconds of an incident.

## Kill switches (use sparingly, document afterwards)

| Switch | Effect | How |
|---|---|---|
| `DRAFT_INSIGHTS_ENABLED=false` | Kills the live Logger draft-insight stream. Write-time enrichment still runs; entries are unaffected. | Vercel → Project → Settings → Environment Variables → flip → Redeploy (~1 min) |
| Roll back a bad deploy | Reverts prod to a known-good build | Vercel → Deployments → pick the previous green build → "Promote to Production" |
| Pause a noisy cron | Stops `/api/admin/retention` or `/api/admin/invitations/expire` from firing | Vercel → Project → Settings → Crons → Pause |
| Anthropic budget hit | Anthropic auto-enforces the workspace cap; your key returns 429s | Wait for window reset OR raise cap in Anthropic console (only if you trust the spike) |

## Symptom → first move

| Symptom | First move | Depth |
|---|---|---|
| Parent reports "entry saved but no insights" | `/admin/analytics` → AI Cost; Sentry filter `tags:pipeline:enrich-entry` last 1h | [incident-runbook §1](./incident-runbook.md) |
| Anthropic spend trending past $3 / family / month | `/admin/analytics` → AI Cost → Top families by spend table | [incident-runbook §2](./incident-runbook.md) |
| Multiple users hitting 429s | Check `ai_pipeline_logs.retry_triggered` recent rows; look for one user dominating | [incident-runbook §3](./incident-runbook.md) |
| Anthropic outage (status page red) | No action — `src/lib/ai/enrich.ts` falls back to keyword matcher; entries persist | [incident-runbook §4](./incident-runbook.md) |
| Sentry quota near cap | Lower `tracesSampleRate` or filter noisy event signature | [incident-runbook §5](./incident-runbook.md) |
| Cron didn't fire | Vercel → Project → Settings → Crons; check last invocation time + error | [incident-runbook §6](./incident-runbook.md) |
| Account export / delete user-reported failure | Verify in `ai_pipeline_logs` + `learning_entries` that the family rows still exist; see #21 dry-run notes | tracker #21 |
| Anything else | Triage from scratch | [incident-runbook §6](./incident-runbook.md) |

## Useful SQL (`DATABASE_URL` from `.env.local` pointed at prod)

```sql
-- Pipeline health, last hour
SELECT status, count(*) FROM ai_pipeline_logs
WHERE created_at > now() - interval '1 hour' GROUP BY status;

-- Stale snapshots (families whose snapshots haven't rebuilt in 24h)
SELECT family_id, max(updated_at) AS last_snapshot
FROM family_intelligence_snapshots
WHERE updated_at < now() - interval '24 hours' GROUP BY 1;

-- Noisy families this week (top 10 by token spend)
SELECT family_id, sum(input_tokens + output_tokens) AS toks
FROM ai_pipeline_logs
WHERE created_at > now() - interval '7 days'
GROUP BY 1 ORDER BY 2 DESC LIMIT 10;

-- Entries created but never enriched (sanity check the pipeline)
SELECT count(*) FROM learning_entries e
LEFT JOIN ai_pipeline_logs l ON l.entry_id = e.id
WHERE e.status = 'complete'
  AND e.created_at > now() - interval '24 hours'
  AND l.id IS NULL;
```

## Postmortem checklist (always do after a real incident)

1. Append a "Recent incidents" entry to [`docs/incident-runbook.md`](./incident-runbook.md): symptom, root cause, mitigation, time to recovery.
2. If the fix is code, ship a regression test (unit or integration) before closing the loop.
3. If the fix is config, screenshot the before/after of whichever dashboard surfaced it; paste in the runbook entry.
4. If a new symptom — add a row to the symptom table above so it's discoverable next time.

## Escalation

Solo-dev pilot: there is no second pager. If the incident is bigger than one head, reach out to the small set of testing families with a status note rather than letting them discover it. Their patience is the project's most valuable resource.
