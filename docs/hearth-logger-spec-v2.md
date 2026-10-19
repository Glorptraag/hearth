<!-- Version: 2 | Date: 2026-10-07 | Changes: Initial creation. Supersedes hearth-logger-spec-v1.md for the capture (Notice) and post-save (Confirm) surfaces. Written alongside the Logger rebuild (branch claude/hearth-logger-rebuild-0b8907); decisions D-LPS-14/15/16, evidence R27–R29. -->

# Hearth Logger v2 — Notice → Confirm

> **Status:** Build spec of record for `/log`, `/log/batch`, `/log/import` and the post-save surface. Zero migrations.
> **Supersedes:** `hearth-logger-spec-v1.md` §4 (completeness gate), §5 (insights panel) and §7.2 (density branch). v1 §3 field anatomy, §10 entry points and §11 data model remain useful history; where they disagree with this doc, this doc wins.
> **Companions:** `hearth-decisions-log-v1.md` (D-LPS-14/15/16), `hearth-research-log.md` (R27–R29), `hearth-outcomes-spine-plan-v1.md`, `hearth-constellation-architecture-v1.md`, `hearth-pilot-personas-v1.md`, `hearth-parent-journey-v1.md`.

---

## 1. Purpose and the line

The Logger is the heartbeat (Architecture Principle 1). Its job is to let a parent get a moment down in well under five minutes and then show them, honestly, what Hearth noticed — with nothing on the screen that Hearth cannot stand behind.

The brief is the owner's **"Hearth — Three Passes Toward a Coherent System" (v1, 2026-10-07)**, Pass 1 §1.4 and Pass 2 §2.5: **Logger = Notice; post-save = Confirm.** The full line is

**Notice → Match → Propose → Confirm → Show**

| Step | Who | Where it lives today |
|---|---|---|
| Notice | parent | `/log` (`NoticeForm`) — who, what, when, felt, noticed, evidence |
| Match | server | `enrichEntry` (Haiku) — subjects, threads, ≤3 `discrete_learning_objectives`, `per_child_signals` |
| Propose | server + client | `observation_dlo_links` rows (`inferred`/`declared`) → `deriveProposals()` renders them as chips |
| Confirm | parent | `ConfirmSurface` — one tap per chip → `confirmProposal()` |
| Show | Portfolio / Constellation / Report | unchanged consumers of `aiEnrichment`, `observation_dlo_links`, `learner_dlo_status` |

What is gone: the completeness score and ring, the Quick/Full view, the Guided/Quick mode, the while-typing insights rail (keyword matcher, draft-insight, coach hints), the 24 observation chips, activity grid, lesson subjects, duration/location, and the thin-entry fast path. **The proposal chips are the insight.** Decision **D-LPS-14**.

---

## 2. Capture schema (Notice)

Pure types live in `src/lib/logger/notice.ts` (`NoticeFields`, `FELT_LEVELS`, `saveBlock`, `toggleLearner`, date helpers). Felt experience is an ordinal 1..4 that maps 1:1 onto `engagementPerLearner`; Portfolio renders 😕😐🙂😊 for 1..4, so the order is load-bearing. Labels: **Loved it (4) · Into it (3) · Went along (2) · Hard going (1)**.

| Field | Scope | Required | Payload key (existing zod) | Read downstream by |
|---|---|---|---|---|
| `learnerIds` | — | yes | `learnerIds` | enrich childRecords, D-OS2 gate, snapshot, portfolio |
| `text` | shared | unless evidence ≥1 | `description` + `title` (`deriveEntryTitle(text)` else fallback) | enrich prompt, portfolio, report |
| `dateOccurred` | shared | no (null → today) | `dateOccurred` | snapshot streaks / weekly balance |
| `felt[id]` | per child | no | `engagementPerLearner` (pruned to `learnerIds`) | enrich prompt, portfolio emoji row |
| `noticed[id]` | per child | no | `discoveriesPerLearner` (trimmed, empties dropped, pruned) | enrich per-child block, portfolio |
| `evidence` | shared | no | `evidenceUrls` (photos) + `evidence[]` (`deriveEvidenceRows`) | portfolio, report work samples |
| source | — | derived | `source` ∈ `logger\|project_stage\|hearth_session`, `sourceSessionId`, **`sourceProjectId`**, **`sourceStageNumber: number`** | provenance (R27 fix) |
| — | — | — | `status: 'complete'` | triggers `after()` enrich |
| removed | | | `subjects` (server-filled, §4), `observationDetails`, `mode`, `projectId`, `stageNumber` | nothing reads them from the Logger |

`src/lib/logger/entry-payload.ts` keeps its file name (`evidence-db.ts` imports `EvidencePayloadItem`; `outbox.ts` imports `EntrySavePayload`) and exports `buildEntrySavePayload({ fields, source, now? })`, `deriveEntryTitle`, `deriveFallbackTitle` ("Photo on 6 Oct" · "Their words on 6 Oct" · "Link on 6 Oct" · "Learning on 6 Oct" — never empty, the server requires `title.min(1)`), plus the kept `pickSelectedLearners` / `derivePhotoEvidenceUrls` / `deriveEvidenceRows`. `check_in` sources coerce to `source: 'logger'` (not in `ENTRY_SOURCES`); `project_stage` with a null stage omits `sourceStageNumber`. `src/app/api/entries/route.ts` is **not touched**: old queued outbox records still replay because the non-strict zod strips the legacy `projectId`/`stageNumber` keys (pinned in `outbox.test.ts`).

---

## 3. Save gate

`saveBlock(fields)` is the whole gate: **≥1 child AND (any text OR any evidence)**. No score, no ring, no "N things left".

| Cause | Save button | Hint (sans, muted, `aria-describedby`) |
|---|---|---|
| `no-learner` | disabled | "Pick who was learning" |
| `nothing-noticed` | disabled | "Add a few words or a photo" |
| `null` | enabled | none — no "Ready to save" noise |

Single-child families: the only child is preselected on first mount, never over a restored draft that already has learners.

---

## 4. Subjects come from enrichment (D-LPS-15)

The activity grid and lesson-subject picker are gone, so `subjects` would go dark for Logger entries and the weekly/monthly subject balance in `snapshot-rebuild.ts` with it. Rule: **the server fills `subjects` from `subjects_detected` when the parent gave none, and never overwrites a writer-set value.**

- `src/lib/ai/subjects-normalise.ts` — `normaliseDetectedSubjects()` maps display names and aliases (Maths, Numeracy, The Arts, Digital Technologies, PE…) onto the lowercase `SUBJECTS` enum, drops unknowns, dedupes, preserves order; `subjectsFill(existing, detected)` returns `{ subjects }` or `{}` when `existing` is non-empty or nothing normalises.
- `src/lib/ai/enrich.ts` — spread into both `status: 'enriched'` writes (the main path and `sonnetFallback`, which gained an `existingSubjects` parameter because it has no entry row in scope).
- Why server-side: a client PATCH of `subjects` would trigger `needsReenrich` and loop. Living in `enrichEntry` means the parent retry route, PATCH re-enrich, batch and CSV import all benefit, and `rebuildSnapshot` (same `after()`) sees the fill. Runner, batch and Portfolio-set subjects are untouched.
- Trade-off: a failed enrichment leaves subjects empty until retry (SIDEBAR S4).

---

## 5. The Confirm surface

`src/components/logger/confirm/`. One surface, five honest states; the state machine is `ConfirmState` in `src/lib/logger/confirm-state.ts`, owned by `useNoticeSave`.

### 5.1 State table

| State | Heading (`.display` serif) | Sentence (serif, human-authored) | Body |
|---|---|---|---|
| `queued` | "Saved on this phone." | "It'll go through when you're back online." | exit row only |
| `pending` | "Saved." | "Reading it now…" | 3 chip-shaped `.hearth-skeleton` bars; exit row live immediately |
| `proposals` | "Saved. Here's what we noticed." | — | `ProposalGroup`s, helper line, `PedagogyAttribution` (collapsed, only if sources), attach link, `BadgeReadyRow`, exit row |
| `nothing` | "Saved." | single child: "Nothing to confirm from this one. It still counts." · `nobodyNamed`: "Hearth couldn't tell who did what here, so nothing is proposed. It still counts for {names}." · other multi: "Nothing to confirm from this one. It still counts for {names}." | attach link, `BadgeReadyRow`, exit row |
| `failed` | "Saved." | "We couldn't read this one just now. It's safe in your Portfolio — you can try again from there." | link "Open Portfolio" → `/our-story/portfolio`; button "Read it again" → `POST /api/entries/[id]/enrich` (existing, write-checked, 10/h) → back to `pending`; exit row |

Layout: `max-w-[560px] mx-auto px-md py-xl`, `role="region" aria-label="Moment saved"`, heading `tabIndex={-1}` focused on mount with `aria-live="polite"`. Shared: evidence pill ("1 photo" / "{n} pieces of evidence"); quiet sans attach link "From a module in your library? Link it" → existing `AttachToModuleModal`, then static "Linked to {title}" — hidden for `queued` (no `entryId`) and `hearth_session`; `BadgeReadyRow` renders `buildBadgeReadyToast()` as a persistent "{message} · Have a look" row (no auto-dismiss, D-LPS-4); exit row = ghost `Done` (→ `/dashboard`) and ember `Log another`. A `hearth_session` save opens `ReflectionModal` over the surface. `enrichment_viewed` fires once via `useViewedOnce`.

### 5.2 Provenance rule (binding)

Every rendered node is one of: (a) the parent's own words or counts; (b) a proposal with provenance (a chip); (c) human-authored copy from `confirmCopy.ts`; (d) licence attribution (`PedagogyAttribution`, collapsed, only when `pedagogy_sources` is non-empty). **No `insight_suggestions`, `journey_observation`, `profile_nudge`, "builds the X thread" line, or `WorkSamplePill`** on this surface. Portfolio still reads them. Whether a filtered Haiku observation returns is SIDEBAR S3. Forbidden words anywhere in Logger copy: "try this", "next time", "should", "sorry", "AI", "insight", "score", "complete", and the `→` glyph.

### 5.3 Chip derivation — `src/lib/logger/proposals.ts` (pure, client-safe)

`deriveProposals(enrichment, learners, { preferThreadId? })` returns `Proposal[]` (`key = learnerId:dloId`, learner name + colour token, `dloId`, `threadId`, `threadName`, `tier`, `confidence`):

1. `status !== 'enriched'` → `[]`.
2. `dlos = discrete_learning_objectives ?? []` (type `DloEnrichmentItem` now declared on `AiEnrichmentBody` in `src/types/enrichment.ts`; it was always persisted).
3. Keep only ids `parseDloId()` accepts.
4. **H6 suppression:** drop `isSuppressedThread(dlo_id)` — First Nations never appears on a parent surface.
5. Dedupe by `dlo_id`.
6. **D-OS2 mirror:** `attributedLearnerIds(learners, per_child_signals)` — ≤1 learner → that learner; else only learners whose trimmed, lower-cased name is a key of `per_child_signals`; nobody named → `[]`. This mirrors `gateLearnersByNamedSignals` in `dlo-persistence.ts` (not imported: that module pulls `@/lib/db`, and PR #288 edits it). A parity test pins the two together.
7. Cross product; **order** = learner selection order, then `preferThreadId` first, then confidence descending (≤3 per learner by construction).

`nobodyNamed(enrichment, learners)` = ≥2 learners, usable DLOs > 0, attributed learners = 0 — drives the honest `nothing` sentence.

Chip anatomy: grouped per child (`ProposalGroup`, `role="group"`, child dot from `LEARNER_COLOUR_MAP`); `ProposalChip` is a `<button aria-pressed>` reading **"{threadName} · {tier}?"**, 44px minimum, `.hearth-press`. Proposed = `border-border-subtle bg-surface-raised`; confirmed = `border-border-active bg-ember-glow` + check icon and the `?` drops (rule 9: `border-border-active` is the selected signal; sage stays reserved for growth). Helper line: "Tap one if it rings true. Tap again to undo."

### 5.4 Tap semantics and the swap seam (D-LPS-16)

`src/lib/logger/confirm-client.ts` is the **one** function the surface calls:

- First tap → optimistic confirmed → `confirmProposal(p, 'confirm')` → `POST /api/capabilities/[learnerId]/dlo/[dloId]/confirm` → `upsertParentAssertion` (an `asserted` row at the DLO's tier, idempotent).
- Second tap → optimistic proposed → `confirmProposal(p, 'dispute')` → `clearParentAssertion` (the `inferred` row stays).
- Failure reverts and toasts "Couldn't save that. Tap again to retry." One in-flight request per key (`useProposalConfirm`: `confirmed`, `busy`, `toggle`).
- Server hardening: the confirm route now runs `checkWritePermission` after the family lookup (viewer → 403, no row written).

When the proposed→confirmed ledger (Pass 2 §2.1) lands, it swaps in behind `confirmProposal()`; nothing in the surface changes. Under `PRODUCTION_TIER_BAR` a tap is the corroboration that can lift a thread to demonstrating — SIDEBAR S1. Every tap also triggers a full `rebuildSnapshot(family, 'manual')`; server-side coalescing is follow-up B5.

---

## 6. Date capture — `WhenRow`

Segmented sans control **Today · Yesterday · Another day** (`aria-pressed`, 44px). "Another day" reveals a native `<input type="date" max={todayIso}>` labelled "Pick the date". State is the resolved `yyyy-MM-dd` string (or `null` = today, resolved at save by `resolveDateOccurred`: null, future or unparsable → today). The highlighted segment is **derived** from the stored date by `whenKindFor()`, never stored, so a draft restored tomorrow still means what it meant. The old `'earlier'` option that silently meant today minus five days is gone (R28).

---

## 7. Source banner and deep links — `source.ts` + `SourceBanner`

`parseNoticeSource(searchParams)` → `NoticeSource`:

| Query | Kind | Banner (sans title / muted detail) | Effect |
|---|---|---|---|
| `?scaffold=<sessionId>[&hearthId=]` | `hearth_session` | "Logging from {hearthName}" / "{title} · {date} · pre-filled from the shared record" | `useScaffoldFetch.onLoad` pre-fills `text` and `learnerIds`; `sourceSessionId` on save; `ReflectionModal` after |
| `?source=project_stage&projectId=&stageNumber=` | `project_stage` | "Logging a project stage" / "Stage {n}" | `sourceProjectId` + numeric `sourceStageNumber` (NaN → omitted); missing `projectId` → `logger` |
| `?source=check-in[&learner=][&thread=]` | `check_in` | "Checking in on {Name}'s {threadName}" (or "Checking in on {Name}") / "Jot what you noticed — we'll look for it after you save." | learner preselected once (never over a restored draft); `threadId` dropped if unknown or suppressed, never persisted, passed to `deriveProposals` as `preferThreadId` (R29) |
| anything else, incl. `?resume=` | `logger` | none | draft restore is automatic; `resume` is a documented no-op (B7) |

The banner is `bg-surface-raised border-border-subtle` with a `ClipboardText` icon in `text-text-secondary` — a banner is not an action, so no ember.

---

## 8. Batch log and CSV import

`BatchLogForm` and `CsvImportForm` are unchanged and now mounted from their own routes: `/log/batch` (h1 "Batch log") and `/log/import` (h1 "Import a CSV"), each returning to `/log` on complete or cancel. The Notice form footer reads "Catching up on a few days? Batch log · Import a CSV". The Log tab stays active for `/log/*` (`navConfig.isDirectTabActive` and the `(auth)/layout.tsx` check both test `pathname === '/log' || pathname.startsWith('/log/')`).

---

## 9. Draft v2 and legacy migration — `draft.ts` + `useLoggerDraft`

`DRAFT_KEY = 'hearth:logger:draft'` is unchanged so old drafts are found. `LoggerDraft = NoticeFields & { v: 2; savedAt }`. `migrateDraft(raw, now)`:

- `v: 2` → sanitised (arrays and records defaulted, `felt` filtered to integers 1..4) → `{ draft, dateReset: false }`.
- Legacy (no `v`) → `learnerIds ← selectedLearners`, `text ← description`, `felt ← engagement` (1..4, ids in `learnerIds`), `noticed ← discoveries` (non-empty, ids in `learnerIds`), `evidence ← evidence` (type-checked), `dateOccurred ← whenDate === 'yesterday' ? savedAt − 1 day : null`, `dateReset ← whenDate === 'earlier'`. Everything else is dropped.
- Nothing restorable, or unknown `v` (e.g. `3`) → `null`, forward-safe.

`serializeDraft` always writes v2, so exposure to a migration bug is one load. The hybrid mirror (D-LPS-8) is kept: 10 s idle autosave, `PUT /api/logger/draft` (zod now `v: z.literal(2)`; a v1 PUT is a 400 the hook swallows), `GET` passes the stored blob through `migrateDraft`, `DELETE` on clear. Restored banner: "Picked up where you left off" (+ " — we've set the date to today; change it if it was another day." when `dateReset`) · Dismiss · Start fresh. `isStaleDraft`, `pickNewerDraft`, `DRAFT_STALE_MS`, `DRAFT_EXPIRY_MS` keep their semantics.

---

## 10. Honest states on the Notice side

| Condition | What the parent sees | Behaviour |
|---|---|---|
| Offline (`useOnlineStatus`) | banner "Offline — your draft is saved on this phone. Save will go through when you're back online." | Save stays enabled; a fetch failure while `navigator.onLine === false` → `queueEntry(payload)` → `queued`; outbox `null` → error toast, draft kept. Photo button disabled: "Photos need a connection". |
| 403 | toast "Your account can view this family's story but can't add to it." | not queued, draft kept |
| 429 | toast "Hearth is catching its breath — try again in a minute." | not queued, draft kept |
| other online failure | toast "Couldn't save. Your draft is safe — try again." | not queued (no 4xx is ever queued) |
| learners failed (`useLearnersFetch.failed`) | "We couldn't load your children. Check your connection and try again." + Try again (`reload()`) | never rendered as an empty family |
| no learners | "Add a child in Settings to start logging." → `/settings` | |
| voice errors | `useAudioTranscription`'s four strings via the global error toast | |

The form is silent while typing by intent (no keyword matcher), so the `pending` "Reading it now…" state is load-bearing.

---

## 11. Analytics (`src/lib/analytics/posthog.ts`)

| Event | Props |
|---|---|
| `entry_created` | `source_kind`, `learner_count`, `has_evidence`, `has_felt`, `has_noticed`, `when_kind`, `compose_ms`, `resumed_from_draft`, `draft_age_ms`, `entry_id` (the old `activity_type` / `thin` props are gone) |
| `enrichment_viewed` | `wait_ms`, `proposal_count`, `nobody_named`, `scaffolded`, `entry_id` |
| `logger_proposal_confirmed` / `logger_proposal_cleared` | `thread_id`, `tier`, `confidence_bucket` (`low`/`mid`/`high`), `learner_count` |
| `logger_attach_opened` | fired when the attach link opens the modal |
| `logger_completed_50pct` | **retired** 2026-10-07 — there is no completeness score; dashboards keyed on it need a note (B8) |

---

## 12. File map

- **Page** — `src/app/(auth)/log/page.tsx` (~240 lines, composition root only: `parseNoticeSource`, `useLearnersFetch`, `usePedagogy`, `useScaffoldFetch`, `useNoticeForm`, `useLoggerDraft`, `useOnlineStatus`, `useAudioTranscription`, `useNoticeSave`; renders `LoggerSkeleton` | `ConfirmSurface` | `NoticeForm`) · `log/batch/page.tsx` · `log/import/page.tsx`.
- **`src/app/(auth)/log/_components/`** — `NoticeForm`, `WhoRow`, `WhatField`, `PerChildRow`, `WhenRow`, `EvidenceRow`, `SourceBanner`, `SaveBar`, `noticeCopy.ts` (every Notice string); kept unchanged: `EvidenceModal`, `LoggerSkeleton`.
- **`src/components/logger/confirm/`** — `ConfirmSurface`, `ProposalGroup`, `ProposalChip`, `BadgeReadyRow`, `ConfirmExitRow`, `confirmCopy.ts`. `PedagogyAttribution` is remounted here.
- **Hooks** — `useNoticeForm` (reducer: `set-text`, `toggle-learner`, `set-felt`, `set-noticed`, `set-date`, `add-evidence`, `remove-evidence`, `restore`, `init-from-source`, `reset`), `useNoticeSave`, `useProposalConfirm`, `useLoggerDraft` (rewritten internals), `useLearnersFetch` (+ `failed`, `reload`), kept: `useScaffoldFetch`, `useAudioTranscription`, `useOnlineStatus`, `useViewedOnce`, `usePedagogy`.
- **Lib** — `src/lib/logger/{notice,source,proposals,confirm-client,confirm-state,entry-payload,draft}.ts`, `src/lib/ai/subjects-normalise.ts`; reused unchanged: `enrichment-poll`, `badge-check`, `outbox`.
- **Server / shared edits** — `ai/enrich.ts` (+8 lines), `api/logger/draft/route.ts` (v2 zod), `api/capabilities/[learnerId]/dlo/[dloId]/confirm/route.ts` (write check), `types/enrichment.ts`, `analytics/posthog.ts`, `nav/navConfig.ts` + `(auth)/layout.tsx`, `logger/coaching/types.ts` (CoachHint types pruned), `test/db-factories.ts` (v2 draft literal).

---

## 13. Tests by layer

**Unit (jsdom, node@24, `TZ=UTC`)** — `lib/logger/notice.test.ts` (gate by cause, `toggleLearner` prunes, `resolveDateOccurred` null/yesterday-across-month/explicit/future-clamp/invalid, `whenKindFor`) · `source.test.ts` (four kinds, NaN stage, suppressed and unknown thread dropped, `resume` ignored) · `entry-payload.test.ts` (felt→engagement, noticed→discoveries, pruning, title fallbacks, scaffold, `sourceProjectId` + numeric `sourceStageNumber`, check_in→logger, no removed keys) · `outbox.test.ts` (legacy-shape record replays byte-for-byte) · `draft.test.ts` (v2 round-trip, legacy map, yesterday anchored to `savedAt`, earlier → null + `dateReset`, corrupt → null, `v: 3` → null) · `proposals.test.ts` (single/multi/nobody named, H6 dropped, malformed id dropped, pending/failed → [], `preferThreadId` ordering, **parity with `gateLearnersByNamedSignals`** with `@/lib/db` mocked) · `confirm-client.test.ts` · `ai/subjects-normalise.test.ts` · hooks `use-notice-form`, `use-notice-save` (201→pending→proposals/nothing/failed, 403 no queue, 429, offline→queued, poll guard), `use-proposal-confirm` (optimistic + revert + busy), `use-logger-draft`, `use-learners-fetch` · components `ConfirmSurface.test.tsx` (five states, confirm then dispute, revert + toast, H6 never in DOM, attach hidden for queued/scaffold, no `→`; stubs `IntersectionObserver`, wraps `ToastProvider`), `ProposalChip`, `WhenRow`, `WhoRow`, `PerChildRow`, `SourceBanner`, `NoticeForm` · `nav/navConfig.test.ts` · `capability-alpha-suppression.test.ts` (seam swapped to `deriveProposals`).

**Integration (real Postgres)** — `api/entries/route.integration.test.ts` (project-stage provenance persists; legacy keys still 201) · `lib/ai/__tests__/enrich-subjects-fill.integration.test.ts` (`['Mathematics','The Arts']` → `['mathematics','arts']`; pre-set `['science']` untouched) · `api/logger/draft/route.integration.test.ts` (v2 round-trip, v1 PUT → 400, legacy GET passthrough) · `api/capabilities/[learnerId]/dlo/[dloId]/confirm/route.integration.test.ts` (viewer 403 + no row, owner confirm writes one `asserted` row, dispute clears, cross-family 404).

Gates: `npm run lint` (hard), `tsc`, unit, integration.

---

## 14. What was deleted and why

| Deleted | Why |
|---|---|
| `log/_components/WhoSection`, `WhatSection`, `EngagementSection`, `WhenWhereSection`, `ObserveSection`, `EvidenceSection`, `InsightsContent`, `SectionHeader` (+ tests), `childColors.ts`, `loggerConstants.ts` | six-section form replaced by the Notice rows; child colours come from `LEARNER_COLOUR_MAP`; option catalogs (activity grid, 24 chips, duration, location) captured data nothing read |
| `log/__tests__/completeness.test.ts`, `lib/logger/completeness.ts`, `hooks/use-completeness-ui`, `lib/logger/guided-copy.ts`, `components/logger/GuidedModeToggle` | the completeness score/ring and Guided/Quick mode are removed (D-LPS-14 supersedes D-LPS-11, D-LPS-13) |
| `components/logger/PostSaveSurface.tsx` | replaced by `ConfirmSurface` under the provenance rule |
| `components/logger/ObservationChipDetail`, `WatchForTodayStrip`, `ModuleLensHints` | observation chips and lens hints had no downstream reader |
| `hooks/use-keyword-match`, `lib/ai/keyword-matcher` (+ tests) | while-typing keyword "insights" were decoration; the chips are the insight |
| `hooks/use-draft-insight`, `lib/ai/draft-insight.ts`, `api/entries/draft-insight/route.ts` | the only runtime-adjacent Haiku call outside enrichment; retired with its `DRAFT_INSIGHTS_ENABLED` switch |
| `hooks/use-coach-hints`, `api/logger/coach-hints/route.ts`, `lib/logger/coaching/{resolve,retrieval-provider}` (+ tests); `CoachHint*` types pruned from `coaching/types.ts` | coach hints rendered only in the deleted insights rail |
| `hooks/use-logger-mode-and-snapshot` | Quick/Full view and mode switch are gone |
| `entry-payload` exports `coerceEntrySource`, `LoggerSaveMode`, `ACTIVITY_SUBJECT_MAP`, `THIN_ENTRY_*`, `deriveSubjects`, `isThinEntry`, `THIN_SAVE_MESSAGES`, `warmThinSaveMessage` | thin-entry branch collapsed; subjects now server-filled |
| `hearth_skip_attach` sessionStorage flag | the attach modal no longer pops; it is a quiet link on the Confirm surface |

Kept deliberately: `PedagogyAttribution` (only renderer of `pedagogy_sources`; three CC-BY corpus sources require attribution), `dlo-persistence.ts` (untouched; PR #288), `nudge-provider.ts` + `thread-nudges.ts` (imported by `enrich.ts`), `WorkSamplePill` (Portfolio/report), `framework-labels.ts` (Settings), `BatchLogForm`/`CsvImportForm`, `EvidenceModal`/`LoggerSkeleton` (PR #290 touches both), `demo/log` and `dev-preview/log` (standalone; B3). No columns are dropped — the Logger simply stops writing `subjects`, `observation_details`, `mode` and `families.logger_default_mode`.

---

## 15. Personas served

- **Renee** ("I'm already doing it; show me what it counts for") — journey **Stage 2 → 3** (first log → habit). One-handed, retrospective, often with a toddler on her hip: three rows and a Save button, no score to chase, and the chips tell her what it counted for without her asking. The `queued` state means a bad-signal paddock day still lands.
- **Mei-Lin** ("Tell me what to do until I trust myself") — journey **Stage 2** (the relief moment). The Confirm sentence and chips are the translation she needs ("Number Sense · developing?"), with no grandiose insight prose to over-claim; `nothing` says "It still counts" so a sparse entry does not read as failure. Framework names come from `frameworkLabel(pedagogy)`, never "HEU" to a non-QLD family.
- **Sandra** ("Our families do this together") — journey **Stage 5 → 6** (gatherer). The `hearth_session` source banner and pre-fill keep scaffold logging a two-tap job after a group session, and the attach link is hidden there because provenance already comes from the session.

---

## 16. Open SIDEBARs (deliberate with Drew + Opus; verbatim from the build plan)

- [SIDEBAR] S1 — What a chip tap means. Today the only backend is confirm → an `asserted` row at the DLO's tier, which under PRODUCTION_TIER_BAR is the corroboration that lifts a thread to demonstrating; proposals already count as `inferred` evidence before any tap, and undo clears only the parent's assertion (no 'not this' dismissal). Ship as designed (one tap = assertion, second tap = undo) vs gate 'demonstrating?' chips behind a second tap vs wait for the proposed→confirmed ledger. Design ships option 1.
- [SIDEBAR] S2 — Check-in provenance. 'check-in' is not an ENTRY_SOURCES value and there is no column for the thread; the design coerces to 'logger' and uses the thread only to sort the matching chip first. Should `thread` become a write-time declared target (provenance 'declared', corroboration-eligible)? Needs a column or the ledger.
- [SIDEBAR] S3 — The one sentence. Design 2's provenance rule makes the Confirm sentence human-authored and drops insight_suggestions / journey_observation / profile_nudge from the post-save screen (Portfolio still reads them). Keep generating all of them (and trim the prompt later), or bring a regex-filtered Haiku observation back onto Confirm (Design 1's PRESCRIPTIVE allowlist, interacts with #286's PKB logger context)?
- [SIDEBAR] S4 — Subjects now come only from enrichment: a failed or empty enrichment means no subject-balance credit for that entry (previously the parent's activity tap survived enrichment failure). Accept for the pilot, or add an optional one-tap subject row later?
- [SIDEBAR] S5 — Confirmation vocabulary must be shared with PR #288 ('parent confirmations as moments'). Both surfaces write the same `asserted` row through the same endpoint; agree once that a confirmed chip ↔ a parent-confirmed moment, and settle event names (logger_proposal_confirmed/cleared here vs #288's).
- [SIDEBAR] S6 — Every save shows the Confirm surface (thin fast-path collapsed; D-LPS-14 supersedes D-LPS-3/11/13). The pending state exposes the exit row immediately to hold the 5-minute rule. Confirm the trade; revisit if pilot parents find the extra tap heavy.
- [SIDEBAR] S7 — Felt-experience vocabulary on the existing 1–4 scale: 'Loved it / Into it / Went along / Hard going' (parent-voice, non-judging). Also retiring 'Note' from the evidence tools and the Guided-mode family setting from the UI (data model untouched).

## 17. BUILD follow-ups

- [BUILD] B1 — Project-stage provenance fix (sourceProjectId + numeric sourceStageNumber) with unit + integration regression tests; 'earlier' = −5 days fix; check-in preselect + banner; nav /log/* active-state fix. *(Shipped in the rebuild — listed for traceability to R27–R29.)*
- [BUILD] B2 — Add checkWritePermission to POST /api/capabilities/[learnerId]/dlo/[dloId]/confirm + its first integration test (viewer 403, owner confirm/dispute, cross-family 404). *(Shipped in the rebuild.)*
- [BUILD] B3 — demo/log and dev-preview/log still render the retired six-section form; update or delete in a standalone follow-up.
- [BUILD] B4 — After #288 lands or closes, extract gateLearnersByNamedSignals into a pure db-free module and import it on both server and client (replacing the mirror + parity test).
- [BUILD] B5 — Server-side coalescing of rebuildSnapshot('manual') on rapid confirm taps (each tap runs the full narrative-LLM path today).
- [BUILD] B6 — Trim mode/observationDetails from the POST /api/entries zod and the legacy observationDetails prompt block in enrich.ts once #285/#286 settle (left alone now to limit conflict surface).
- [BUILD] B7 — Pass projectTitle from /project/[id] so the source banner can name the project; `?resume=` notification link stays a documented no-op (draft restore is automatic).
- [BUILD] B8 — Open PRs #285/#286/#290 will conflict on page.tsx, log/_components/*, entry-payload.ts, draft.ts, enrich.ts; land the rebuild first, #290 rebases and drops hunks for deleted files, #285/#286 expected to close unmerged. PostHog dashboards keyed on entry_created.activity_type/thin or logger_completed_50pct need a note.
