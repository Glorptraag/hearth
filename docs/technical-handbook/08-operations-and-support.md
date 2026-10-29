<!-- Version: 1 | Date: 2026-10-26 | Changes: Initial creation. -->

# 08 — Operations and support

> Part of the [Hearth Technical Handbook](./README.md). Charted against `main` at `e6ca4b5`.

## In one paragraph

Hearth is run by one developer at pilot scale (10–20 families), so operations are built to be **quiet by default and safe to fail**. Saves never depend on the AI. Every AI call is logged with its cost. Every outside service has a free tier with headroom. The few things that can go badly wrong have a documented first move. This section brings together what anyone supporting Hearth needs: where to look, which switches exist, what runs on a schedule, the limits that protect the system, a triage playbook for parent reports, and a **handover checklist** for moving support to someone other than Drew.

## Where to look

| Need | Where |
|---|---|
| Errors (app and background AI jobs) | **Sentry**. Filter `tags:pipeline:enrich-entry` for enrichment failures |
| What parents are doing | **PostHog**: live events, the pilot event list in [`docs/deployment-runbook.md`](../deployment-runbook.md) §4 |
| Deploys, logs, crons | **Vercel**: Deployments, Logs, Settings → Crons |
| Database and recovery | **Neon** console (point-in-time recovery, 6-hour window) |
| AI spend | **Anthropic** console (usage) and **`/admin/analytics` → AI Cost** (per family, per model) |
| In-app admin | `/admin`: analytics, AI cost, families, invitations, feedback, content QA, audit log |
| Parent feedback | `/admin` → feedback (from the in-app feedback form, `feedback` table) |

Fill-in-the-blank URLs and ready-made SQL are in [`docs/oncall-cheatsheet.md`](../oncall-cheatsheet.md).

## Kill switches

Use them sparingly, and write down afterwards what you used and why.

| Switch | Effect | How |
|---|---|---|
| `DRAFT_INSIGHTS_ENABLED=false` | Stops live AI insights in the Logger. Saving and enrichment carry on | Vercel → Settings → Environment Variables → Redeploy (~1 min) |
| `PEDAGOGY_KB_ENABLED` unset or not `true` | Enrichment and coaching stop drawing on the pedagogy knowledge base | Same |
| `NEXT_PUBLIC_DISABLE_SW=1` | Removes the installed app shell (service worker) and its caches on each device's next load. **Needed after a bad deploy that left users on stale files; rolling back alone doesn't fix this** | Same |
| Roll back a deploy | Production returns to an earlier build | Vercel → Deployments → previous green build → "Promote to Production" |
| Pause a cron | Stops a scheduled job | Vercel → Settings → Crons → Pause |
| `ENRICH_TAPE=1` | Not a kill switch: turns on step-by-step enrichment logging for diagnosis | Same; turn it off afterwards |

**Note on rollbacks:** database migrations run on every deploy. Rolling back the *code* doesn't undo a *database* change. If a migration is the problem, check [`docs/drizzle-snapshot-recovery.md`](../drizzle-snapshot-recovery.md) and the incident write-ups before acting.

## Scheduled jobs

Defined in `vercel.json`. Both are protected by a `CRON_SECRET`.

| Job | Schedule (UTC) | In Australian time | What it does |
|---|---|---|---|
| `/api/admin/retention` | `0 2 * * 0`, **Sundays 02:00** | Sunday ~12:00–13:00 (AEST/AEDT) | Dismisses expired and long-snoozed notifications. Deletes module drafts untouched for 90+ days. Flags any family that used more than 200k AI tokens **in the previous 24 hours** (audit-log row + Sentry breadcrumb; threshold via `NOISY_FAMILY_TOKEN_THRESHOLD`) |
| `/api/admin/invitations/expire` | `0 20 * * *`, **daily 20:00** | Daily ~06:00–07:00 (AEST/AEDT) | Expires pilot invitation codes past their expiry date |

> **Gap:** because the noisy-family check runs weekly and looks back only 24 hours, it misses spikes on the other six days. Until the schedule changes, review the AI Cost panel at least weekly.

## Built-in limits

These protect the AI bill and the system from runaway loops. They are per user or per family, and they **reset when the server restarts**, because they're held in memory.

| What | Limit |
|---|---|
| Saving entries | 30 / minute / user |
| Retrying enrichment | 10 / hour / family |
| Live draft insights | 20 / minute / family (+ 20 per Logger visit) |
| Coach hints | 60 / minute / user |
| Voice transcription | 20 / minute / user |
| Evidence upload | 10 / minute / user |
| Viewing evidence | 240 / minute |
| Stripe checkout | 10 / minute / user |
| Print bundle | 10 / minute |
| Creating a hearth | 5 / minute / family |
| Account delete attempts | 3 / hour / user |
| Dashboard-triggered snapshot refresh | Once per 24 h / family |

**Single-region assumption:** the limits are held in the server's memory (`src/lib/rate-limit.ts`). That's correct only while Hearth runs in **one** Vercel region. A move to Redis/Upstash is designed and ready ([`docs/redis-rate-limiter-plan.md`](../redis-rate-limiter-plan.md)) but deliberately deferred until it's needed.

## Costs

| | Monthly (pilot) |
|---|---|
| Everything except AI | $0 (free tiers) |
| Anthropic | ~$40 (≈ $2 per family) |
| Deepgram | Pennies |
| **Alert line** | **$3 per family per month** in AI spend |

Per-call costs are recorded in `ai_pipeline_logs` and priced by `/api/admin/analytics/ai-cost`. When a model changes, update the pricing constants in that route. The full free-tier limits and upgrade triggers are in [`docs/external-services-guide.md`](../external-services-guide.md).

## Support playbook: from a parent's report to an answer

Work through these in order.

1. **Capture it.** Who (family), what they did, what they expected, what they saw, when, which device and browser, and whether they were online.
2. **Is it known?** Search [`docs/hearth-research-log.md`](../hearth-research-log.md) and [`docs/test-pilot-issues.md`](../test-pilot-issues.md). Check the open-defects list below.
3. **Find the section.** Use the "What can go wrong" table in the matching handbook section:

   | It's about… | Go to |
   |---|---|
   | Saving, drafts, voice, offline | [02 — The Logger](./02-the-logger.md#what-can-go-wrong) |
   | Insights, dashboard, "Hearth noticed", notifications | [03 — The Learning Cycle](./03-the-learning-cycle.md#what-can-go-wrong) |
   | Tiers, objectives, the Constellation | [04 — Capabilities](./04-capabilities-and-evidence.md#what-can-go-wrong) |
   | Report, coverage, PDF, portfolio | [05 — Reporting](./05-reporting-and-portfolio.md#what-can-go-wrong) |
   | Library, modules, planner, payments | [06 — Content](./06-content-modules-and-planning.md#what-can-go-wrong) |
   | Sign-in, roles, invites, deletion | [07 — Accounts](./07-families-accounts-and-access.md#what-can-go-wrong) |
   | Whole site, many families at once | [01 — Platform](./01-platform-and-services.md#what-can-go-wrong) and [`docs/incident-runbook.md`](../incident-runbook.md) |

4. **Reassure accurately.** The two things parents worry about most have firm answers. **A saved entry isn't lost when insights fail**, and **a draft survives a refresh, a closed tab and (for text) a lost signal**. Don't promise compliance outcomes. Hearth presents evidence; the regulator decides.
5. **Record it.** Every finding from a real user goes into `docs/hearth-research-log.md`. Every confirmed bug gets a regression test at the right level (unit or integration) when it's fixed. That's the project's convention.
6. **Escalate** to Drew anything involving data loss, privacy (including **all account-deletion requests**), payments, or more than one family at once.

## Open defects and pending decisions (as of `e6ca4b5`)

Support needs to know about these:

| Item | Impact on support | Owner | Reference |
|---|---|---|---|
| **Account deletion fails** for most families; Clerk user and photos survive | All deletion requests must be handled manually | Drew (product decision) | [`hearth-account-deletion-defect-v1.md`](../hearth-account-deletion-defect-v1.md) |
| Offline photos can't be queued | Advise saving photos when online | Native plan, Phase 2 | [`hearth-native-app-plan-v1.md`](../hearth-native-app-plan-v1.md) |
| Tier rubric wording undecided | Explain tier rules from [04](./04-capabilities-and-evidence.md); don't promise a published rubric | Drew | [`hearth-tier-rubric-drift-v1.md`](../hearth-tier-rubric-drift-v1.md) |
| Coverage precision depends on per-state mappings | Coverage reads as "Building" or uses the fallback until mappings exist | Content | [`hearth-reporting-pipeline-v1.md`](../hearth-reporting-pipeline-v1.md) §6 |
| H6 thread hidden pending cultural consultation | Explain it's deliberate | Drew | `src/lib/capability-alpha-suppression.ts` |
| Weekly-only noisy-family check | Review AI Cost manually each week | Engineering | `vercel.json` |
| Vestigial `/constellation` route | None for parents (unlinked) | Drew (keep or delete) | [`hearth-constellation-architecture-v1.md`](../hearth-constellation-architecture-v1.md) |

`docs/PROJECT_STATUS.md` is the live source for this list. Check it before quoting status to anyone.

## Handover checklist: moving support off the developer

To reallocate support work, the incoming person or team needs each of the following. Tick these off with Drew.

**Access (least privilege first)**
- [ ] Sentry: read access to the production project
- [ ] PostHog: read access
- [ ] Vercel: viewer access (enough to see deploys, logs and crons); deploy rights only if they'll operate kill switches
- [ ] Hearth admin: their Clerk user ID added to `ADMIN_CLERK_IDS`
- [ ] Anthropic console: usage view
- [ ] Neon: read-only role for the diagnostic SQL in the on-call cheatsheet (not the owner credentials)
- [ ] Sanity: viewer, or editor if they'll fix content
- [ ] Stripe: read access to payments and webhook deliveries

**Knowledge**
- [ ] Read this handbook (README + sections 02, 03 and 08 at minimum)
- [ ] Read [`docs/oncall-cheatsheet.md`](../oncall-cheatsheet.md) and bookmark its dashboards
- [ ] Walk through a log → insights → constellation → report cycle on a test family ([`docs/test-family-onboarding-packet.md`](../test-family-onboarding-packet.md))
- [ ] Know the escalation rules (playbook step 6) and the open-defects table

**Agreements**
- [ ] Who may flip kill switches and roll back deploys without asking
- [ ] Response-time expectations for pilot families
- [ ] How account-deletion requests are logged and fulfilled until the defect is fixed
- [ ] Who keeps this handbook and `PROJECT_STATUS.md` current. Rule: same pull request as the change

**Clean-up owed to the docs** (found while writing this handbook; see the [README](./README.md#corrections-this-handbook-makes-to-older-docs))
- [ ] Fix the keyword-fallback claim in `docs/oncall-cheatsheet.md` and `docs/external-services-guide.md`
- [ ] Make `CLAUDE.md`'s "daily retention cron" match `vercel.json`, or change the schedule
- [ ] Note the documented runtime AI exceptions next to the "no runtime AI" rule in `docs/system-map.md`

> **Going deeper:** [`docs/oncall-cheatsheet.md`](../oncall-cheatsheet.md) · [`docs/incident-runbook.md`](../incident-runbook.md) · [`docs/deployment-runbook.md`](../deployment-runbook.md) · [`docs/hearth-local-runs-v1.md`](../hearth-local-runs-v1.md) · [`docs/branch-hygiene.md`](../branch-hygiene.md)
