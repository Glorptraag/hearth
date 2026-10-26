<!-- Version: 1 | Date: 2026-10-26 | Changes: Initial creation. -->

# 02 — The Logger

> Part of the [Hearth Technical Handbook](./README.md). Charted against `main` at `e6ca4b5`.

## In one paragraph

The Logger (`/log`, the centre tab of the bottom nav) is where parents record learning after it happens. It is the heartbeat of the product: everything else in Hearth is built from what goes in here. It is designed so a parent can log a moment **in under a minute** (who, what happened, how engaged they were) and optionally add more (observations, where, how long, photos, quotes). It protects the parent's typing at every step: a draft is saved every 10 seconds, can be picked up on another device, and a save made with no signal is queued and sent later. Pressing Save stores the entry straight away. The AI work happens afterwards, in the background (see [03](./03-the-learning-cycle.md)).

## How it works

### 1. What the parent fills in

The form is a stack of short sections. Only the first three are needed for a quick log.

| Section | What it captures | Needed to save? |
|---|---|---|
| **Who** | Which child or children took part | Yes |
| **What** | A description, typed or spoken, plus an optional activity type and subjects | Yes (more than 20 characters scores fully) |
| **Engagement** | How engaged each child was (a rating per child), plus optional per-child "discoveries" | Yes, for the quick threshold |
| **When / where** | Today / yesterday / an earlier date the parent picks; location; duration | Date is pre-filled |
| **Observe** | Tap-chips for what the parent noticed (e.g. persistence, curiosity), each with optional detail | No, adds depth |
| **Evidence** | Photos, quotes, notes, links | No, adds depth |

**Two views.** The Logger opens in a lean **quick** view (Who + What + Engagement → Save). A **full** view reveals every section. Quick is the primary path by design (decision D-LPS-13).

**Two modes.** Separately from the view, the Logger runs in **guided** or **quick** mode:
- *Guided* gives more prompts and coaching and asks for a little more before Save unlocks.
- Families start in guided mode for their **first 20 entries**, then move to quick mode, unless they've chosen a default in Settings.

**The save threshold.** A completeness score (0–100) fills a ring as the parent works. Save unlocks at **50** in quick mode and **65** in guided mode. A child + a 20-character description + an engagement rating is enough to clear 50. The scoring lives in `src/lib/logger/completeness.ts`.

### 2. Help while typing

Three helpers run while the parent types. None of them writes anything.

| Helper | What it does | Uses AI? |
|---|---|---|
| **Keyword hints** | After 1.5 seconds of idle typing, spots subjects and themes in the text and suggests reflection prompts | No. Runs entirely in the browser |
| **Coach hints** | Suggests what to look for, based on the child's current threads and (when enabled) the pedagogy knowledge base | No AI model call. Retrieval only |
| **Draft insights** | Once the description passes 50 characters, waits 2 seconds after typing stops, then asks Claude Haiku for a live insight | **Yes.** One of the deliberate runtime AI exceptions. Capped at 20 calls per Logger visit and 20 per minute per family. Can be switched off with `DRAFT_INSIGHTS_ENABLED=false` |

### 3. Voice

The microphone button records a short clip in the browser, sends it to `/api/transcribe`, and drops the text into the description. Transcription is done by **Deepgram** (Australian English, `en-AU`). The audio is not stored. The route writes nothing, is limited to 20 clips per minute per user, and requires edit permission. This replaced the browser's built-in speech recognition, which doesn't work reliably on iPhone Safari or inside in-app browsers.

### 4. Protecting the parent's work

| Safety net | How it works | Where |
|---|---|---|
| **Autosave draft** | Every 10 seconds the form is saved to the browser (`localStorage`, key `hearth:logger:draft`). Restored when the Logger reopens. Flagged as "stale" after 4 hours | `src/lib/logger/draft.ts`, `src/hooks/use-logger-draft.ts` |
| **Cross-device draft** | The same draft is mirrored to the database per user, so a draft started on a phone can be finished on a laptop. Two co-facilitators in one family never overwrite each other. Expires after 7 days. When both copies exist, the newer one wins | `/api/logger/draft`, `logger_drafts` table |
| **Offline outbox** | If Save is pressed with no connection, the entry is queued on the device (IndexedDB database `hearth-logger`, store `outbox`) and sent automatically when the connection returns or the app is reopened. The parent sees "Saved offline — it'll sync when you're back online." | `src/lib/logger/outbox.ts`, `src/components/logger/OutboxFlusher.tsx` |
| **Offline banner** | The Logger shows a banner when the device is offline | `useOnlineStatus()` |

**Outbox rules:** losing the connection doesn't count as a failed attempt. An entry the server actively rejects is retried up to **5 times**, then dropped so the queue can drain. **Photos can't be queued offline:** a photo uploads at the moment it's attached, so it needs a connection. Text, quotes, notes and links queue fine.

### 5. Pressing Save

1. The browser builds the save payload (`buildEntrySavePayload` in `src/lib/logger/entry-payload.ts`). This includes the "logger context": the chips, activity type, where and how long. The AI reads this context later.
2. It is sent to `POST /api/entries`. The server checks the parent is signed in, belongs to a family, has **owner or editor** rights, and hasn't saved more than **30 entries in the last minute**. It then writes the entry to `learning_entries`, marked "enrichment pending".
3. The server replies at once ("201 Created"). **The parent is never kept waiting for the AI.**
4. What the parent sees next depends on the entry:
   - A **thin** entry (short description, no observation details, no evidence, completeness below 55) gets a quick, warm "saved" message.
   - A **substantive** entry gets the **post-save screen**. It shows a placeholder while Hearth checks for the AI result every 1.5 seconds, for up to 30 seconds. When the result lands, it shows insights, pedagogy sources and a nudge about the child's profile. If 30 seconds pass with no result, it shows a "couldn't add insights" state so the parent can move on. ("Never a spinner that hangs.")
5. After a free-text save, the parent may be offered to **attach the entry to a module** in their library ("Skip" hides this for the rest of the session).
6. In the background, Hearth checks whether the entry has made a child **ready for a badge** and shows a toast if so. The Notification Centre also records it, in case the toast is missed.

### Other ways in

| Path | What it is |
|---|---|
| **Batch log** | Log one activity for several children at once |
| **CSV import** | Bulk-import past entries (`/api/entries/import`) |
| **From a module or project** | Finishing a module activity or project stage opens the Logger with the source already attached (`?source=module` / `project`) |
| **From a hearth session** | A shared community session opens the Logger "scaffolded" with that session's details, followed by a short reflection |

## Where it lives

| Thing | Location |
|---|---|
| The page (a thin wiring layer) | `src/app/(auth)/log/page.tsx` |
| Form sections | `src/app/(auth)/log/_components/` (`WhoSection`, `WhatSection`, `EngagementSection`, `WhenWhereSection`, `ObserveSection`, `EvidenceSection`) |
| Form state | `src/hooks/use-logger-*.ts` |
| Save, draft, outbox and poll logic (all unit-tested) | `src/lib/logger/` |
| Save endpoint | `src/app/api/entries/route.ts` |
| Live AI insight | `src/app/api/entries/draft-insight/route.ts`, `src/lib/ai/draft-insight.ts` |
| Voice | `src/app/api/transcribe/route.ts`, `src/lib/ai/transcribe.ts`, `src/hooks/use-audio-transcription.ts` |
| Product spec | [`docs/hearth-logger-spec-v1.md`](../hearth-logger-spec-v1.md), [`docs/hearth-logger-short-mode-spec-v1.md`](../hearth-logger-short-mode-spec-v1.md) |

The Logger was a single ~1,500-line file until June 2026. It was split into the hooks, sections and library above **with behaviour unchanged**. That makes it much easier for an engineer to change one part safely.

## What can go wrong

| Parent says… | What's probably happening | What to tell them / do |
|---|---|---|
| "The Save button is greyed out" | The completeness score is below the threshold (50 quick / 65 guided) | Pick a child, write a sentence, and rate engagement. In guided mode, a little more is needed |
| "It said *Failed to save*" | The server returned an error while the device was online | The draft is safe on their device. Ask them to try again. If it keeps happening, check Sentry for `POST /api/entries` |
| "It said *Too many requests*" | More than 30 saves in a minute (usually a script or a stuck button) | Wait a minute. If a real parent hits this, see [08](./08-operations-and-support.md) on rate limits |
| "I logged it offline and it never appeared" | The entry is still in the device's outbox | Open Hearth on **the same device** while online. Entries don't sync across devices until they're sent. See the on-call cheatsheet |
| "My photo wouldn't attach offline" | Expected: photos need a connection | Wait for a signal and save then. Or save the text now and log the photo as a separate entry once online. Evidence can't be added to an entry after it's saved (`PATCH /api/entries/[id]` deliberately doesn't accept evidence) |
| "The microphone does nothing" | Mic permission denied, or Deepgram unavailable | Check the browser's mic permission. Typing always works |
| "My half-written entry vanished" | The draft is older than 7 days, or browser data was cleared | Drafts expire after 7 days. Nothing to recover |
| "I saved but there are no insights" | The background AI is slow or failed. This is a [Learning Cycle](./03-the-learning-cycle.md#what-can-go-wrong) question, not a Logger one | See section 03 |
| "It offered me guided mode again" | They have fewer than 20 entries and no default set | Set a default mode in Settings |

## Status and known gaps

- **Working:** quick/full views, guided/quick modes, voice via Deepgram, autosave plus the cross-device draft, offline outbox for text entries, the post-save screen with its 30-second limit, badge-ready toasts, batch and CSV import.
- **Not built:** offline photo capture. A full offline sync queue for the whole app is Phase 2 of the native plan.
- **Deliberate limits:** the Logger never schedules or plans anything. It records what already happened (Architecture Principle 1, "retrospective logging is the core interaction").

> **Going deeper:** [`docs/hearth-logger-spec-v1.md`](../hearth-logger-spec-v1.md) · [`docs/hearth-ux-use-cases-logger-portfolio-capabilities-v1.md`](../hearth-ux-use-cases-logger-portfolio-capabilities-v1.md) · [`docs/hearth-native-app-plan-v1.md`](../hearth-native-app-plan-v1.md) (offline) · the "Logger screen architecture" row in `CLAUDE.md`
