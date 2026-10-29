# Hearth Logger — Handoff (v1)

> **Purpose:** one place that ties the Logger's spec, decisions, code layout, current status and open work together. Read this first on any Logger task, then follow the pointers.
> **Written:** 2026-10-20 against `main` at `d796ccc` (branch `claude/sharp-keller-q9j5g9`). Statuses below are verified against code and docs on that date, not carried over from older docs. Update this file in the same PR as any Logger change, or add a "trails reality" caveat.
> **Serves:** Priya, journey Stage 2 ("First log") → Stage 3. The 5-minute rule is this stage's contract (`hearth-parent-journey-v1.md`).

---

## 1. What the Logger is

`/log` is the retrospective Logger: a parent records learning *after* it happened. It is the product's heartbeat (architecture principle #1) and must be completable in under 5 minutes (principle #2). Saving writes a `learning_entries` row, then write-time Haiku enrichment produces DLO/thread evidence and feeds the Family Intelligence Snapshot. There are no runtime LLM calls in the Logger UI, with one scoped exception: voice transcription (§5).

## 2. Read in this order

| Doc | Status | Use it for |
|---|---|---|
| `docs/hearth-logger-spec-v1.md` | Authoritative for field/section behaviour. **Dated March 2026**; written against the prototype, with inline `[RESOLVED …]` notes added since. | Fields, completeness scoring (§4), insights panel (§5), per-child model (§6), save flow (§7), data model (§11). |
| `docs/hearth-decisions-log-v1.md` → **D-LPS-1…13** | Authoritative decisions. | Why things are the way they are. |
| `docs/hearth-research-log.md` (R12–R19, R27–R33 touch the Logger) | Append-only evidence. | Whether a behaviour is a known issue; which regression test pins it. |
| `docs/hearth-logger-short-mode-spec-v1.md` | **Decision-draft, header still says "AWAITING DREW APPROVAL".** Largely overtaken by D-LPS-13 (see §4). | Residual open questions only. |
| `docs/hearth-ux-use-cases-logger-portfolio-capabilities-v1.md` | UC-L-* compendium (reconciled 2026-06-14). | Use-case IDs the research log cites. |
| `docs/hearth-native-app-plan-v1.md` | Plan of record for PWA/offline/Capacitor. | Anything touching the offline outbox or service worker. |
| `CLAUDE.md` → "Logger screen architecture", "Logger capture context → RAG" | Current code map. | Navigating the code. |

**Dangling reference:** the spec and Architecture doc cite `docs/hearth-logger-post-save-resolution-v1.md` (source of D-LPS-1…7, `PostSaveSurface`). **That file is not in `docs/`** (or `docs/archive/`). The decisions survive in the decisions log; the original brief does not. Fix the pointers or restore the file.

## 3. Code map

`src/app/(auth)/log/page.tsx` (~1,120 lines) is a composition root, not a monolith. It wires hooks and sections and keeps `handleSave` as the orchestrator.

- **State hooks** (`src/hooks/use-logger-*` and siblings): `useLoggerDraft`, `useLearnersFetch`, `useScaffoldFetch`, `useLoggerModeAndSnapshot`, `useKeywordMatch`, `useCoachHints`, `useCompletenessUi`.
- **Pure logic** (`src/lib/logger/`, unit-tested): `entry-payload` (`buildEntrySavePayload`, `buildLoggerContext`, `isThinEntry`), `completeness` (`scoreCompleteness`, thresholds), `badge-check`, `enrichment-poll`, `draft`, `outbox` (IndexedDB offline queue), `guided-copy`, `thread-nudges`, `coaching/` (retrieval/nudge providers for coach hints).
- **Sections** (`src/app/(auth)/log/_components/`): `WhoSection`, `WhatSection` (has a `minimal` prop for Quick view), `EngagementSection`, `WhenWhereSection`, `ObserveSection`, `EvidenceSection` + `EvidenceModal`, `InsightsContent`, `SectionHeader`, `LoggerSkeleton`; constants in `loggerConstants.ts`, `childColors.ts`.
- **Logger components** (`src/components/logger/`): `PostSaveSurface` (post-save second screen), `GuidedModeToggle`, `ObservationChipDetail`, `ModuleLensHints`, `PedagogyAttribution`, `WatchForTodayStrip`, `BatchLogForm`, `CsvImportForm`, `OutboxFlusher`.
- **API routes:** `POST /api/entries` (save + enrichment kick-off), `POST /api/entries/[id]/enrich` (parent-initiated retry, rate-limited 10/hr/family), `/api/entries/draft-insight`, `/api/entries/import`, `/api/logger/draft` (cross-device draft mirror), `/api/logger/coach-hints`, `/api/evidence` + `/api/evidence/upload` (Vercel Blob, private, authed read proxy), `/api/transcribe` (Deepgram STT).
- **Tables:** `learning_entries` (incl. `logger_context` JSONB, migration 0030), `learning_entry_evidence`, `logger_drafts`, `module_runs` (entry save finishes the run).

## 4. Current behaviour (what a parent sees)

- **Quick Log is the default** (D-LPS-13, 2026-06-24): Who → What (description + voice) → Engagement → Save. Implemented as a `view: 'quick' | 'full'` switch in `page.tsx`; form state is shared, so nothing is lost switching. Quick view always uses the lean `quick` save threshold regardless of the mode toggle. Minimum viable save = one learner + description > 20 chars + one engagement rating = 53 ≥ the 50 gate.
- **Full Log** is behind "Add more detail — switch to Full Log": per-child discoveries, activity-type grid, subjects, When/Where, 24 observation chips, evidence, the insights panel/drawer, Guided/Quick toggle, Batch/Import.
- **Completeness ring** is wayfinding, not a grade (D-LPS-11): ✓ / "Ready" at the gate. Thresholds in `completeness.ts`: `QUICK_THRESHOLD = 50`, `GUIDED_THRESHOLD = 65`.
- **Post-save** is a designed second screen with density branches (thin / substantive-pending / substantive-enriched / failed). Enrichment failure is **visible** (D-LPS-5); retry is parent-initiated only (D-LPS-7). No forward-prescription language there (D-LPS-4).
- **Drafts:** `localStorage` autosave every 10s is primary; best-effort Postgres mirror, per-Clerk-user, last-write-wins, 7-day read-time expiry (D-LPS-8).
- **Offline:** banner + offline-aware save error; a save made offline goes to the IndexedDB outbox and replays on reconnect (`outbox.ts`, `OutboxFlusher`).
- **Voice:** record → `/api/transcribe` → Deepgram (en-AU, `smart_format`), cross-browser incl. iOS (D-LPS-12). Rate-limited 20/min/user, 25 MB cap.
- **Multi-child:** entries fan out per child automatically; a capture-time note makes that legible (D-LPS-9).
- **"Earlier" date** is a bounded date picker (R30), not a fixed five days ago.
- **Capture context reaches enrichment and RAG** (R31–R33): chips, activity, where and duration persist as `logger_context`; `situational-signals.ts` is the only place Logger vocabulary maps to `tags.json`. Entries saved before 2026-10-19 have `logger_context = null`.
- **H6** ("First Nations Australian Perspectives") is suppressed on parent-facing surfaces including Logger nudges, pending cultural consultation (`capability-alpha-suppression`).

### Short-mode draft vs what shipped

The short-mode draft (2026-06-21) proposed Short / Expanded / Full states, **one** engagement tap per entry, and renaming Guided/Quick to Short/Full. D-LPS-13 (2026-06-24) shipped a related but different design: a Quick/Full *view* switch, with engagement still **per-child**. So:

- Q5a (one tap vs per-child) was effectively answered as per-child, but never recorded as a decision against that draft.
- Q5c (rename "Guided"/"Quick") is **still open**. `GuidedModeToggle` still says Guided/Quick and lives only in Full view, so "Quick" now names both a view and a save-gate mode. That is a naming collision a parent can hit.
- Q5b (remember "Add more") is not built.

Recommendation: mark the draft superseded by D-LPS-13, carry 5b/5c forward here, and delete the rest.

## 5. Invariants — do not break

1. **No runtime LLM in the UI.** The only runtime-AI exception is voice STT (D-LPS-12). Coach hints use retrieval/nudge providers, not a model call by default.
2. **5-minute rule / Quick is the floor.** Don't add a required field to Quick view.
3. **Quick view uses the `quick` threshold** regardless of mode. Tests in `completeness.test.ts` pin the scoring.
4. **Enrichment failure must be visible** (D-LPS-5); never add a silent auto-retry queue.
5. **Retry is parent-initiated**, one Haiku call per tap, via `enrichEntry()` (D-LPS-7).
6. **Offline photo evidence is not queued** — photos upload at evidence-add time. An offline photo-add fails outright (deliberate, native plan Phase 1).
7. **Navigations are never cached by the service worker** — children's data must not persist to disk. Kill switch: `NEXT_PUBLIC_DISABLE_SW=1`.
8. **Every confirmed bug gets a regression test** and a research-log R-entry (PR-1 convention).
9. Design/motion rules from `CLAUDE.md` apply (tokens, `.hearth-*` motion classes, `motion-conformance.test.ts`).

## 6. Tests

| Layer | Where |
|---|---|
| Unit | `src/lib/logger/*.test.ts` (entry-payload, completeness, draft, badge-check, enrichment-poll, outbox), section tests in `log/_components/` (`WhoSection`, `WhatSection`, `WhenWhereSection`, `SectionHeader`), hook tests (`use-logger-draft`, `use-logger-mode-and-snapshot`, `use-learners-fetch`, `use-scaffold-fetch`, `use-keyword-match`, `use-coach-hints`, `use-completeness-ui`), `log/__tests__/completeness.test.ts`, `PedagogyAttribution.test.tsx`, `situational-signals.test.ts`, `retrieval-provider.test.ts` |
| Integration (real Postgres) | `api/entries/route.integration.test.ts` (persists `logger_context`), `api/logger/draft/route.integration.test.ts`, `api/entries/[id]/route.integration.test.ts`, `ai/__tests__/enrich-context.integration.test.ts` |
| E2E | `e2e/offline-pwa.spec.ts`; `e2e/critical-flows.spec.ts` only checks that `/log` requires auth |
| Retrieval | `npm run verify:pkb:retrieval` (20 Logger-voice golden queries) |

Run per `docs/test-pilot-runbook.md`: `npm test`, `npm run test:integration:local`.

**Coverage gaps I noticed (not verified by running anything):** no unit test for `EngagementSection`, `ObserveSection`, `EvidenceSection`/`EvidenceModal`, `InsightsContent`, or `PostSaveSurface`; no e2e covers an actual save through Quick Log; no test pins the Quick↔Full view switch preserving state (only `WhatSection`'s `minimal` prop is tested).

## 7. Open work and caveats

**Decisions waiting on Drew**
- Short-mode draft: formally supersede it, and decide Q5c (rename Guided/Quick vs Short/Full) and Q5b (remember "Add more").
- Audio *evidence* capture (UC-L-06) is deferred (D-LPS-10). `kind: 'audio'` exists only as a data-model placeholder. Entry criteria: CaptureTray/MediaRecorder UI, audio upload route, `kind='audio'` UI.

**Known gaps**
- Offline photo evidence is not queued (see invariant 6).
- Spec §14 items still open: observation chip extensibility (#5), insight-card interaction/`rejected` status (#6), and the **accessibility audit** (#8: aria-labels on emoji buttons, `aria-valuenow` on the completeness ring, drawer focus trap). No evidence an audit happened; WCAG AA is the project target, so treat this as unconfirmed rather than done.
- Spec §14 #2: "Earlier" is now a bounded picker; the 30-day-plus "custom date" backdating (spec Known Gap #8) should be checked against the actual bound in code before relying on it.
- The spec text is still March 2026 and describes a two-column workspace with the insights rail up-front. Quick view no longer shows it. Read §4 above first.
- Telemetry: `logger_completed_50pct` and `entry_enriched` exist, but the journey doc wants **enrichment *viewed*** (not just produced) and time-per-entry; spec §1 notes the instrumentation is pending.

**Pilot-data caveats**
- Entries before 2026-10-19 have no `logger_context`; enrichment and retrieval for those ran on free text alone.
- PKB retrieval is behind `PEDAGOGY_KB_ENABLED`; the 38 calibration-batch corpus entries stay `suggestedDraft: true` until Drew acks each wave, so Logger pedagogy attribution may be sparse.
- Existing snapshots fill in lazily (next save or dashboard load).
- Photo evidence silently failed in prod 2026-06-05→06-28 (missing `BLOB_READ_WRITE_TOKEN`, R19). Fixed; the lesson is that the token lives in Vercel env, not just `.env.local`.

## 8. Quick triage

| Symptom | First look |
|---|---|
| Save button disabled | `scoreCompleteness` vs threshold; Quick view always uses 50 |
| Entry saved but nothing "noticed" | Enrichment status on the entry; `POST /api/entries/[id]/enrich`; `docs/incident-runbook.md` |
| Photo upload 503 | `BLOB_READ_WRITE_TOKEN` in Vercel Production/Preview (R19) |
| Voice mic dead | `/api/transcribe`, Deepgram key, mic permission; 20/min rate limit |
| Draft missing on another device | `/api/logger/draft`; 7-day expiry; last-write-wins |
| Offline save "vanished" | IndexedDB outbox + `OutboxFlusher`; service worker kill switch |
| Logger works for one family only | Family-scoped data; `asOtherFamily()` isolation tests |
