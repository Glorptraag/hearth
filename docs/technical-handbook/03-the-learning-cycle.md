<!-- Version: 1 | Date: 2026-10-26 | Changes: Initial creation. -->

# 03 — The Learning Cycle

> Part of the [Hearth Technical Handbook](./README.md). Charted against `main` at `e6ca4b5`.

## In one paragraph

The Learning Cycle is what happens between a parent pressing **Save** and that moment showing up across Hearth. It has three stages, all running in the background after the entry is already safely stored: **(1) enrichment**, where Claude Haiku reads the entry once and adds structure (subjects, capability threads, learning objectives, insights); **(2) evidence roll-up**, where any learning objectives the AI found are recorded and each child's progress is recalculated; and **(3) the snapshot rebuild**, where Hearth recomputes a single summary of the whole family that every screen then reads. The cycle normally takes a few seconds. If any stage fails, the entry is never lost. Only the extra insight is missing, and it can be retried.

## The cycle at a glance

```
 ① SAVE (instant)                ② ENRICH (background, ~2–10 s)          ③ ROLL UP + REBUILD (background)
 ─────────────────               ─────────────────────────────           ─────────────────────────────────
 Parent presses Save             Gather context:                         Record learning-objective evidence
   │                               · the entry + Logger taps               (observation_dlo_links)
   ▼                               · each child's current threads          │
 Entry written to                  · pedagogy passages (if enabled)        ▼
 learning_entries,               Ask Claude Haiku once (retry once)      Recalculate each child's
 marked "pending"                  │                                     objective status (learner_dlo_status)
   │                               ▼                                       │
   ▼                             Check the answer against the            ▼
 Parent told "saved"             real framework; store it on             Rebuild the family snapshot
 (never waits for AI)            the entry, marked "enriched"            (family_intelligence_snapshots)
                                 Log tokens + cost (ai_pipeline_logs)      │
                                   │                                       ▼
                                 Low confidence? → re-run with           Fire notifications (badge ready,
                                 a stronger model in the background      nudges) · Screens now show it
```

## How it works

### Stage ① — Save

Covered in [02 — The Logger](./02-the-logger.md#5-pressing-save). What matters here: the entry is written with `aiEnrichment.status = "pending"` and the parent gets a response **before** any AI runs. The background work is scheduled with Next.js's `after()`. This keeps the server function alive after the reply has been sent, for up to **60 seconds**.

> **Why `after()` matters:** before it was used, the background work was cut off the moment the server replied. Entries saved, Anthropic billed for the call, and nothing was written back, with no error anywhere. This was production-readiness tracker item #34. The fix is in `src/app/api/entries/route.ts`, and a comment there warns against reverting it.

### Stage ② — Enrichment

`enrichEntry()` in `src/lib/ai/enrich.ts` does the following, in order:

1. **Gathers context.** It reads the entry, the family's children, the structured Logger taps (chips, activity type, where, how long), and each child's **active threads from the current snapshot**, so the AI knows what the child has been working on.
2. **Adds pedagogy grounding (optional).** If `PEDAGOGY_KB_ENABLED=true`, the Logger taps and the child's age are turned into search tags (`src/lib/pedagogy/situational-signals.ts`). Hearth then pulls a few reviewed passages about the family's teaching philosophy from the knowledge base. With the flag off, this step is skipped cleanly.
3. **Asks Claude Haiku once** (`claude-haiku-4-5-20251001`, up to 4,096 output tokens). The fixed instructions are cached by Anthropic, so repeat calls are cheaper. If the call fails or returns unreadable output, it is **retried once**.
4. **Checks the answer.** The result is validated against the real data: child names must match the children on the entry, and every capability thread and learning objective must exist in the framework (`validateEnrichment`, `validateDlos`). Anything invented is dropped.
5. **Attributes evidence to the right child.** On an entry with several children, a learning objective is credited only to the child or children the AI actually named. It is never copied to everyone (decision D-OS2).
6. **Stores the result** on the entry (`aiEnrichment`, status `enriched`) and writes a cost record to `ai_pipeline_logs`: model, input/output tokens, latency, confidence, and whether a retry happened.
7. **Escalates if unsure.** If the AI's own confidence is below **0.5**, a second pass using a stronger model (Claude Sonnet) runs in the background and overwrites the result. Saving is never slowed by this.

**Two layers of thread mapping.** Besides the AI's *inferred* threads, an entry logged from a module activity also gets that activity's *declared* threads (`threadLinks`), set by the content author. The two layers complement each other.

**What the AI produces** (stored on the entry): detected subjects, capability threads per child, candidate learning objectives (DLOs) with tiers, Australian Curriculum (v9) descriptors, per-child signals, insight suggestions, a profile nudge, pedagogy sources, and a confidence score. The full schema is the `EnrichmentResult` type in `src/lib/ai/enrich.ts`.

### Stage ③ — Evidence roll-up and snapshot rebuild

**Evidence roll-up.** Each learning objective the AI found becomes a row in `observation_dlo_links`. Each child's status per objective (`learner_dlo_status`) is then recalculated from *all* their evidence to date. The rules are explained in [04 — Capabilities and evidence](./04-capabilities-and-evidence.md).

**Snapshot rebuild.** `rebuildSnapshot()` in `src/lib/ai/snapshot-rebuild.ts` reads every completed entry, every child, the settings, badges, library and planner, and writes one pre-computed summary per family to `family_intelligence_snapshots`. Per child, it includes:

| Part of the snapshot | Shown where |
|---|---|
| Active threads, with first-evidence date, recency and trajectory (rising / steady) | Constellation, Logger coaching |
| "Hearth noticed": a short feed of recent observations, milestones, newly lit threads and tier rises | Dashboard |
| Week stats (this week's activity) | Dashboard "This Week" |
| Subject balance and evidence quality | Dashboard, report readiness |
| Gap analysis and suggested focus threads | Logger hints, recommendations |
| Recommended modules (matched by tags, not AI) and planner suggestions | Explore, Planner |
| Monthly narrative (a short AI-written summary) | Dashboard |

The **"Hearth noticed" feed is built without any AI call.** It is assembled from enrichment results that already exist (`src/lib/ai/insights-feed.ts`). The **monthly narrative** is the only AI call in the rebuild, and it is **cached**: if nothing that feeds it has changed (`narrativeSignature`), the previous text is reused and no AI call is made.

**What triggers a rebuild:** saving, editing, completing, importing or retrying an entry; publishing a module or changing the library; changing settings; awarding a badge; overriding a tier or confirming an objective; and opening the dashboard when the narrative is stale (at most **once per 24 hours** per family). A library change takes a faster path that only refreshes recommendations.

**Notifications** come out of the rebuild: badge ready, compliance nudges, streak prompts, module nudges, "recommendations refreshed", and constellation honesty notices. They are written to the `notifications` table and shown in the Notification Centre.

### Reading: why screens are fast

Every screen (dashboard, constellation, report, portfolio) **reads the stored snapshot and stored enrichment**. None of them calls the AI. This is Architecture Principle 4, "two-layer AI": the expensive work happens once at write time, and reading is cheap and repeatable.

### The deliberate exceptions

These AI calls happen while a person is using a screen. Each is documented, rate-limited and scoped:

| Exception | Where | Why it's allowed | Limit / switch |
|---|---|---|---|
| Live draft insights in the Logger | `/api/entries/draft-insight` | Coaching while the parent writes | 20/min per family, 20 per visit; `DRAFT_INSIGHTS_ENABLED=false` kills it |
| Voice transcription | `/api/transcribe` (Deepgram, not Anthropic) | Turns speech into text. Writes nothing | 20/min per user |
| Report annotation draft | `/api/report/…/samples/…/draft` | Parent asks for a first draft of a work-sample note | Parent-initiated; edits are protected (see [05](./05-reporting-and-portfolio.md)) |
| Report progression summary | `/api/report/…/progression` | Parent asks for an early→late summary | Parent-initiated; edits are protected |

Other AI calls run at write time but outside the entry cycle: enriching a module draft in the Module Builder (`src/lib/ai/enrich-module.ts`), and summarising a community hearth session's reflections (`src/lib/ai/hearth-narrative.ts`). All of them log to `ai_pipeline_logs`.

## Where it lives

| Thing | Location |
|---|---|
| Save + scheduling the background work | `src/app/api/entries/route.ts` |
| Enrichment | `src/lib/ai/enrich.ts` |
| Pedagogy retrieval | `src/lib/ai/pedagogy-context.ts`, `src/lib/pedagogy/situational-signals.ts`, `src/lib/pedagogy/retrieval.ts` |
| Learning-objective evidence | `src/lib/ai/dlo-persistence.ts` |
| Snapshot rebuild | `src/lib/ai/snapshot-rebuild.ts` |
| "Hearth noticed" feed | `src/lib/ai/insights-feed.ts` → `src/components/dashboard/HearthNoticed.tsx` |
| Monthly narrative | `src/lib/ai/generate-monthly-narrative.ts` |
| Parent retry | `POST /api/entries/[id]/enrich` |
| Post-save polling | `src/lib/logger/enrichment-poll.ts` |
| Notification triggers | `src/lib/notifications/triggers.ts` |
| Tables | `learning_entries`, `ai_pipeline_logs`, `observation_dlo_links`, `learner_dlo_status`, `family_intelligence_snapshots`, `notifications` |

## What can go wrong

| Symptom | What's happening | What to do |
|---|---|---|
| "Saved, but no insights" (one entry) | Enrichment failed or ran past the 30-second wait on the post-save screen. It may still finish | Ask them to look again in a minute. If the entry shows "couldn't add insights", they can **retry** (up to 10 retries per hour per family) |
| "Saved, but no insights" (many families) | Anthropic outage, an exhausted Anthropic budget (the API returns 429), or a code regression | Check status.anthropic.com and the Anthropic console. In Sentry, filter `tags:pipeline:enrich-entry`. Use the "entries created but never enriched" SQL in [`docs/oncall-cheatsheet.md`](../oncall-cheatsheet.md). Entries are safe. Once the cause is fixed, parents retry, or an engineer re-runs enrichment |
| Insights mention the wrong child | Multi-child entry where the AI misattributed the activity | Rare, because names are validated. Log it in `docs/hearth-research-log.md` with the entry ID |
| Dashboard looks out of date | The snapshot didn't rebuild (a rebuild failure doesn't stop the save) | Saving or retrying any entry triggers a full rebuild. (The admin-panel "rebuild" only flags the snapshot; it doesn't run the rebuild itself.) The "stale snapshots" SQL is in the on-call cheatsheet |
| Monthly narrative hasn't changed | Expected if the underlying data hasn't changed (cached), or it was refreshed within the last 24 hours | Nothing to fix |
| AI spend climbing | A noisy family (a script, a loop) or a draft-insight spike | `/admin/analytics` → AI Cost. An automatic check flags any family above 200k tokens in 24 hours, but it only runs **weekly** (see [08](./08-operations-and-support.md#scheduled-jobs)), so check the AI Cost panel directly when spend looks odd |

**Important correction:** older docs say an Anthropic outage "falls back to the keyword matcher". **It doesn't.** The keyword matcher only runs in the browser while the parent types. On the server, a failed enrichment is retried once, marked `failed`, and reported to Sentry. See the [README](./README.md#corrections-this-handbook-makes-to-older-docs).

## Status and known gaps

- **Working:** the full cycle in production, the low-confidence Sonnet re-run, the cached narrative, the AI-free "Hearth noticed" feed, the parent retry, and per-call cost logging.
- **Known limits:**
  - No automatic bulk re-enrichment after an outage. Recovery is per-entry (a parent retry), or an engineer runs it by hand.
  - The pedagogy knowledge base is off unless `PEDAGOGY_KB_ENABLED=true` is set.
  - The low-confidence re-run is fire-and-forget. If it fails, the original Haiku result stands, and the failure is logged.
- **Cost envelope:** about $2 per family per month at pilot volume. The alert line in the on-call cheatsheet is **$3 per family per month**.

> **Going deeper:** [`docs/Hearth_AI_Intelligence_Layer_Architecture.md`](../Hearth_AI_Intelligence_Layer_Architecture.md) · [`docs/incident-runbook.md`](../incident-runbook.md) §1–4 · [`docs/hearth-pedagogy-system-architecture-v1.md`](../hearth-pedagogy-system-architecture-v1.md) · [`docs/system-map.md`](../system-map.md) §4
