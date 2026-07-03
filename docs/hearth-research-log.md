<!-- Version: 1 | Date: 2026-06-10 | Changes: Initial creation. Append-only research log seeded with the six 2026-04-25 pilot issues; establishes the bug→regression-test convention and the coverage-gap matrix. -->

# Hearth Research Log

> **Purpose:** Append-only record of every piece of pilot-family evidence — emails to hello@hearthlearning.au, in-app feedback rows, observed sessions, analytics findings, regulator outcomes. This is where the gap between "what we believe" (specs, personas, journey map) and "what families actually do" gets closed.
> **Format:** `R<n> — <source>: <one-line finding>.` Then: verbatim quote (where one exists), spec affected, regression test (path, or "none — gap"), date. One entry per finding.
> **Rule:** Append only. Never edit a past entry — append a successor that corrects it. Mirror of `hearth-decisions-log-v1.md` conventions.

## The convention (binding)

1. **Every confirmed user-reported bug gets a regression test at the appropriate layer** — unit (`*.test.ts`, jsdom), integration (`*.integration.test.ts`, real Postgres), or e2e (Playwright) per `docs/test-pilot-runbook.md`. The log entry links the test. "None — gap" is an honest interim state, not a resting state.
2. **Every entry names the spec it validates or challenges.** A finding that touches no spec is a signal the spec set has a hole — say so in the entry.
3. **Triage path:** email / in-app feedback row → log entry here (within the SLA windows in `test-family-onboarding-packet.md`) → spec tag → test-gap check → fix PR links back to the `R<n>`.
4. **Persona linkage:** where the source family has a captured profile (`hearth-pilot-personas-v1.md` §7), cite it. Findings clear `[TO VALIDATE]` tags on personas and the journey map.

## Coverage-gap matrix (standing — update when a gap closes)

Known places where real family behaviour outruns the test suite, as of 2026-06-10:

| Gap | Layer that should cover it | Status |
|---|---|---|
| Onboarding happy path (`/api/onboarding/complete`, `/api/welcome/complete`) | integration | **Closed 2026-06-10** (R8) — `src/app/api/welcome/complete/route.integration.test.ts` covers the R1 family-name contract; `/api/onboarding/complete`'s Sanity starter-pack branch remains untested (non-blocking by design) |
| Mobile browser behaviour (one-handed logging, soft-keyboard, PWA) | e2e (Playwright mobile profile) | **Open** — Playwright runs desktop-only; only co-facilitator flow has e2e at all |
| Multi-session / multi-user auth (owner + editor in genuinely separate sessions) | e2e | **Open** — existing 45 e2e tests share one auth context |
| Analytics payload fidelity (hashed IDs actually leave the client correctly) | unit | **Open** |
| Offline capture (autosave, reconnect, queued upload) | unit + manual device matrix | **Partial** — unit coverage of draft persistence exists; no device-level verification |

---

## Entries

### R1 — Pilot walkthrough (2026-04-25): onboarding silently committed the Clerk surname as the family name.

The only genuinely user-facing defect of the pilot: a Douglas-Clerk identity produced a dashboard greeting for "Douglas" that the parent never chose. Trust-sensitive at the worst possible stage (journey Stage 1 — "hope wearing armor").
**Spec affected:** onboarding flow (no standalone spec — gap noted; closest is `hearth-family-settings-spec-v1.md` §onboarding gate).
**Regression test:** none — gap (onboarding-completion integration test; see coverage-gap matrix row 1).
**Fix:** branch `claude/fix-lastname-persistence-BXFXU`, 2026-05-06 — name derived from Clerk with explicit user override preserved.
**Date logged:** 2026-06-10 (retro-seeded from `test-pilot-issues.md`).

### R2 — Pilot walkthrough (2026-04-25): `source .env.local` failed on `&` in DATABASE_URL.

Operator-facing, not family-facing. Resolved by moving test scripts to `node --env-file-if-exists`.
**Spec affected:** `test-pilot-runbook.md` (process).
**Regression test:** n/a — process fix encoded in `package.json#scripts`; the failure mode can no longer occur.
**Date logged:** 2026-06-10 (retro-seeded).

### R3 — Pilot walkthrough (2026-04-25): Vitest 4 removed `test.poolOptions`.

Infra. Migrated to top-level options; in-file comment in `vitest.integration.config.ts` records it.
**Spec affected:** `test-pilot-runbook.md`.
**Regression test:** n/a — CI itself is the guard (config failure breaks every job).
**Date logged:** 2026-06-10 (retro-seeded).

### R4 — Pilot walkthrough (2026-04-25): Drizzle migration journal drifted from on-disk SQL (cascading into 3 reported symptoms).

The journal drift caused the "swallowed SQL errors," "schema-only forks," and "missing admin_audit_log" reports — one root cause, three symptoms. Resolved `e4fc25c`; June 8's deploy-time migrations (`2944303`) plus the CI schema-drift check close the class.
**Spec affected:** `deployment-runbook.md` v2.
**Regression test:** covered — `db:check-schema` runs in the CI typecheck job; migrations apply against a fresh container in every integration run.
**Date logged:** 2026-06-10 (retro-seeded; consolidates 3 `test-pilot-issues.md` items).

### R5 — Pilot setup (2026-04-25): Neon free tier rejected `suspend_timeout_seconds` config.

Infra. Field removed from `scripts/neon-test-branch.mjs`; ephemeral branch deleted in `finally` regardless.
**Spec affected:** `test-pilot-runbook.md` (Neon path — now non-default; local Docker is canonical).
**Regression test:** n/a.
**Date logged:** 2026-06-10 (retro-seeded).

### R6 — Pilot setup (2026-04-25): date-fns 4.1.0 local extraction dropped `index.d.ts` (28 tsc errors).

Infra/dependency. Clean-reinstall fix; long-term lint/typecheck debt item.
**Spec affected:** none (toolchain).
**Regression test:** covered — CI typecheck job fails on recurrence.
**Date logged:** 2026-06-10 (retro-seeded).

### R7 — Meta-finding (2026-06-10): the pilot's feedback channel captured zero feature/UX findings.

All six pilot findings (R1–R6) are infrastructure/config-level; five of six were found by the operator, not by families. Either the product had no UX friction in its first pilot exposure (unlikely), or **email-only feedback under-captures what families actually hit** (likely — reporting a UX papercut by composing an email is itself a >5-minute interaction). This finding motivates the in-app feedback capture (`/api/feedback` + Settings entry point) and is the standing null-hypothesis for this log: *silence is not satisfaction until the capture channel is cheap.*
**Spec affected:** `hearth-parent-journey-v1.md` (all stages — signal coverage), `test-family-onboarding-packet.md` (feedback channels).
**Regression test:** n/a — instrumentation finding.
**Date logged:** 2026-06-10.

### R8 — Convention applied (2026-06-10): R1 now has its regression test.

First exercise of this log's binding rule: the pilot's one user-facing defect (R1, onboarding family-name) is now covered by `src/app/api/welcome/complete/route.integration.test.ts` — new family born `"<Surname> Family"`, no-surname fallback, whitespace surname, and the load-bearing case: an existing (parent-chosen) family name is never overwritten by the Clerk surname. `asUser()` in `@/test/clerk-helpers` gained `firstName`/`lastName` overrides so tests never hand-roll Clerk mocks.
**Spec affected:** closes the R1 test gap; coverage-gap matrix row 1 updated.
**Regression test:** `src/app/api/welcome/complete/route.integration.test.ts` (integration layer).
**Date logged:** 2026-06-10.

### R9 — Code audit (2026-06-10): `pedagogy_set` from onboarding never reaches PostHog.

`PostHogProvider` (sole `initAnalytics()` caller) mounts only in the `(auth)` layout; the `(public)` onboarding page's `track('pedagogy_set', …)` hits the uninitialised early-return and silently drops. Stage-1 signal coverage in `hearth-parent-journey-v1.md` is therefore fictional for first-time onboarding — only Settings re-runs emit. Found during the instrumentation planning pass, not by a family (the event was never missed because it was never seen — instrumentation bugs are invisible by nature; this is the argument for funnel-shape sanity checks after each analytics deploy).
**Spec affected:** `hearth-parent-journey-v1.md` Stage 1 signal table.
**Regression test:** none — gap (planned in next-phase PR-A: assert `initAnalytics` is reachable from the public layout; see `hearth-next-phase-plan-v1.md`).
**Date logged:** 2026-06-10.

### R10 — Code audit (2026-06-10): Dashboard "Gentle Prompt" card can never render.

`DashboardClient` types `snapshot.recommendations` as an array, but the snapshot rebuild writes `{ suggested_next, subject_balance }` — `.length` is `undefined`, so the recommendations card has silently never shown for any scored snapshot. User-visible-on-fix, so the fix is deliberately held for a ship/hold decision (next-phase PR-D) rather than slipped into an unrelated PR mid-pilot.
**Spec affected:** dashboard spec (recommendations surface); `hearth-parent-journey-v1.md` Stage 5 (a "noticing" surface that never noticed).
**Regression test:** none — gap (PR-D will add: card renders from a scored-snapshot fixture).
**Date logged:** 2026-06-10.

### R11 — Convention applied (2026-06-10): R10 fixed and regression-tested.

Drew approved shipping the Gentle Prompt fix mid-pilot ("users will want that change"). `getGentlePrompt()` (`src/lib/dashboard/gentle-prompt.ts`) is typed against the canonical `SnapshotData['recommendations']` shape, so the R10 bug class — UI reading a different shape than the rebuild writes — now fails compile, and `gentle-prompt.test.ts` pins the runtime contract (renders from a scored fixture, null on empty/absent/blank). Demo + dev-preview mocks migrated off the legacy array shape they had been quietly keeping alive.
**Spec affected:** dashboard recommendations surface; journey Stage 5.
**Regression test:** `src/lib/dashboard/gentle-prompt.test.ts` (unit layer).
**Date logged:** 2026-06-10.

### R12 — UX compendium reconciliation (2026-06-14): Logger drafts were device-locked to `localStorage`.

Reconciling the UX use-case compendium (`hearth-ux-use-cases-logger-portfolio-capabilities-v1.md`, PR #188) against the live Logger confirmed UC-L-11 / E9: a draft autosaved on one device never appeared on another (device-locked `localStorage`), costly for the interruption-driven homeschool day. Resolved with a hybrid per-user Postgres mirror — `localStorage` stays the offline-first primary, the server copy is best-effort (`PUT` on autosave, `GET` + last-write-wins restore on mount, `DELETE` on clear), 7-day read-time expiry. Offline path (UC-L-10) deliberately unchanged. Decision D-LPS-8.
**Spec affected:** `hearth-ux-use-cases-logger-portfolio-capabilities-v1.md` UC-L-11/E9; `hearth-logger-spec-v1.md` §Open-Q#3 (now resolved).
**Regression test:** `src/lib/logger/draft.test.ts` (`pickNewerDraft`, unit); `src/hooks/use-logger-draft.test.tsx` (sync, unit); `src/app/api/logger/draft/route.integration.test.ts` (round-trip, 7-day expiry, per-user isolation — integration).
**Date logged:** 2026-06-14.

### R13 — UX compendium reconciliation (2026-06-14): parents couldn't tell a multi-child entry fans out per child.

UC-L-03 friction: a multi-child entry already fans out into one per-child portfolio record, but nothing at capture time said so — and the "Learning together" checkbox implied opting in to a thing that always happens (it was inert: `buildEntrySavePayload` ignored it, and it wasn't in the draft shape). Removed the dead toggle; `WhoSection` now shows a note once 2+ children are selected. Comprehension fix, behaviour unchanged. Decision D-LPS-9.
**Spec affected:** `hearth-ux-use-cases-logger-portfolio-capabilities-v1.md` UC-L-03 (form-length Open-Q9 still open).
**Regression test:** `src/app/(auth)/log/_components/WhoSection.test.tsx` (unit — note shows at 2+, hidden at 1, no checkbox).
**Date logged:** 2026-06-14.

### R14 — UX compendium reconciliation (2026-06-14): the completeness percentage read as a grade.

UC-L-13 friction: the save-bar ring's headline was a raw percentage, which reads as a grade of the parent. Hardened to readiness/wayfinding — once saveable the ring turns sage and shows a ✓ (number shows only while building), `role="progressbar"` + `aria-valuetext` carry "Ready to save" / the next action, and colour flips at the save gate (50/65) not 90. Scoring (`completeness.ts`) untouched, so the save gate did not move. Decision D-LPS-11.
**Spec affected:** `hearth-ux-use-cases-logger-portfolio-capabilities-v1.md` UC-L-13.
**Regression test:** `src/app/(auth)/log/_components/SectionHeader.test.tsx` (unit — ✓/aria at gate, number while building).
**Date logged:** 2026-06-14.

### R15 — UX compendium reconciliation (2026-06-14): voice-unsupported fell back to a native `alert()`.

UC-L-09 / E7: an unsupported browser fired a bare `alert()` — off-design and jarring. The hook now exposes `onUnsupported`; the Logger surfaces a themed toast ("Voice input needs Chrome or Edge.") and the mic button renders disabled with a tooltip so the limit is visible before the tap.
**Spec affected:** `hearth-ux-use-cases-logger-portfolio-capabilities-v1.md` UC-L-09/E7.
**Regression test:** `src/hooks/use-speech-recognition.test.ts` (unit — unsupported fires `onUnsupported` not `alert`; supported starts recognition).
**Date logged:** 2026-06-14.

### R16 — UX compendium reconciliation (2026-06-14): two Logger gaps confirmed deferred, not silently skipped.

The same reconciliation confirmed audio evidence capture (UC-L-06) and the offline submission/sync queue (UC-L-10) remain unbuilt; both are recorded as deliberate Phase-2 deferrals with entry criteria (service worker + IndexedDB blob queue for offline; CaptureTray/MediaRecorder + upload route for audio) rather than left as implied-done. Also corrected a stale doc claim: there is no `local://` photo-placeholder queue — an offline photo-add fails outright. Decision D-LPS-10.
**Spec affected:** `hearth-ux-use-cases-logger-portfolio-capabilities-v1.md` UC-L-06, UC-L-10.
**Regression test:** none — deferred features, no behaviour to pin (honest interim state; entry criteria in D-LPS-10).
**Date logged:** 2026-06-14.

---

### R17 — Logger reconciliation (2026-06-21): voice was Chrome/Edge-only, dead on the mobile-first audience.

The Logger's voice capture used the browser Web Speech API (`useSpeechRecognition`), which is solid in Chrome/Edge but unreliable-to-absent on iOS Safari and in-app webviews — exactly where time-poor parents are, and exactly the "hardest capture moment" the voice fallback exists for (UC-L-09 rationale: voice is the pressure-release valve when hands aren't free). The disabled "Voice input needs Chrome or Edge" state meant the feature didn't exist on the most common device. Replaced with record-then-transcribe: `MediaRecorder` → `POST /api/transcribe` → Deepgram `/v1/listen` (`smart_format` returns punctuated text, which also closes the raw-dictation cleanliness gap). Cross-browser incl. iOS; reuses the existing Deepgram key. Scoped runtime-AI exception — user-initiated and bounded; Decision D-LPS-12.
**Spec affected:** `hearth-ux-use-cases-logger-portfolio-capabilities-v1.md` UC-L-09 (voice support); touches UC-L-06 (audio still deferred for evidence storage).
**Regression test:** `src/lib/ai/transcribe.test.ts` (Deepgram client, unit); `src/hooks/use-audio-transcription.test.ts` (record→transcribe→permission-denied, unit).
**Date logged:** 2026-06-21.

---

### R18 — Operator feedback (2026-06-24): the Logger had crept back over the 5-minute promise.

Reviewing the live Logger before a demo, the six numbered sections (Who, What+discoveries+activity-grid+subjects, Engagement, When/Where, 24 observation chips, Evidence) plus the AI-insights rail rendered up-front — signalling "fill all of this" when only three fields are needed to save, and crowding the screen on mobile. The quick-first restructure that had been agreed (and recorded in memory as the deferred "Part B") had not actually been built; only the voice work (R17) had shipped. Built it: **Quick Log** is now the default surface (Who → What+voice → Engagement → Save), with the rest moved behind an explicit "switch to Full Log" link. Quick uses the lean save gate, so a minimum entry is reachable in well under a minute. Decision **D-LPS-13**.
**Spec affected:** `hearth-ux-use-cases-logger-portfolio-capabilities-v1.md` SIDEBAR #9 / Open-Q9 (form length) — resolved.
**Regression test:** `src/app/(auth)/log/_components/WhatSection.test.tsx` (unit — `minimal` hides discoveries / activity grid / subjects, keeps description + voice).
**Date logged:** 2026-06-24.

---

### R19 — Production runtime errors (2026-06-28): evidence photo uploads 503'd in prod since 5 June — `BLOB_READ_WRITE_TOKEN` was never set on Vercel.

Photo evidence upload had been silently broken in production since 2026-06-05 (12 errors / 3 users — `[evidence/upload] BLOB_READ_WRITE_TOKEN not set`; the `hearth-evidence` store held 0 files). Root cause was purely operational: the blob read-write token lived only in the local `.env.local` — so it worked in `next dev` and *looked* present — but was never added to the Vercel project's Production/Preview env, and `.env.local` never ships to a deployment. `BLOB_STORE_ID` + `BLOB_WEBHOOK_PUBLIC_KEY` had been added manually, masking the gap (three `BLOB_*` vars; only two present). Fixed by binding the token to Production + Preview (`vercel env add`, value sourced from the operator's `.env.local`) and redeploying; verified end-to-end — a real upload landed a 753 KB compressed blob, the error cluster went quiet, and the `get(pathname, { access: 'private' })` read proxy returns `statusCode 200`. A *secondary* code gap surfaced alongside: the in-session runner's `QuickCapture` uploaded the raw file (no client compression → a large HEIC can 413 past Vercel's 4.5 MB body limit) and swallowed `!res.ok` with no toast, unlike the Logger's `EvidenceModal`. Hardened to parity: `compressImageFile` before upload + a clear failure toast (413-specific). Preview render was briefly suspected broken but confirmed working same session after a hard refresh — the initial miss was a stale-cache / deploy-transition artifact, not a code defect; upload *and* read paths are both verified end-to-end.
**Spec affected:** `deployment-runbook.md` §1.2 (env-var provisioning for `BLOB_READ_WRITE_TOKEN` clarified — `.env.local` ≠ deployment env); runner evidence capture (parity with `EvidenceModal`).
**Regression test:** `src/app/(auth)/module/[id]/_components/QuickCapture.test.tsx` (unit — compresses before upload; 413 → oversized toast; non-OK → error toast; success → capture recorded). The token gap itself is env-config (no code test — guarded by the runbook checklist + the route's existing 503 degradation).
**Date logged:** 2026-06-28.

---

### R20 — Code audit (2026-07-03): the H6 alpha suppression was never implemented — the First Nations thread was live in all parent UI.

The decision record says H6 ("First Nations Australian Perspectives") is hidden from parent surfaces pending cultural consultation via `capability-alpha-suppression.ts`; that file was never committed on any branch (`git log --all` empty), so H6 rendered in the constellation, logger nudges, portfolio tags, and reports the whole time. Built fresh as one reversible switch applied at every parent-visible seam; evidence writes untouched so re-lighting loses nothing.
**Spec affected:** cultural-content governance (cr-cultural-framework draft, PR #234); constellation/logger/portfolio surfaces.
**Regression test:** `src/lib/capability-alpha-suppression.test.ts` (module + every pure seam); `src/app/api/capabilities/[learnerId]/route.integration.test.ts` (stale-snapshot read seam).
**Fix:** PR #249. **Date logged:** 2026-07-03.

### R21 — Code audit (2026-07-03): removing a pack left it driving recommendations and the active-library count.

All four `familyLibrary` reads in the snapshot rebuild ignored the `removedAt` soft-delete — and the removal itself fired the `library_change` rebuild that re-counted the removed pack and kept scoring its modules into dashboard recommendations.
**Spec affected:** library soft-delete contract (foundation re-land `b5bbe60`); dashboard recommendations surface.
**Regression test:** `src/lib/ai/__tests__/snapshot-rebuild.integration.test.ts` (full + fast-path soft-delete cases).
**Fix:** PR #250. **Date logged:** 2026-07-03.

### R22 — Code audit (2026-07-03): the library status board derived from a table nothing ever wrote.

`module_runs` had zero writers, so the board's `in_flight`/`abandoned`/`openRunId` statuses could never occur (the ghost-schema gap in PROJECT_STATUS). Minimal persistence landed: run opened on facilitate entry, touched on activity advance, finished by the entry save.
**Spec affected:** library status board (F4, `b81aee9`); `docs/hearth-refactor-postmortem-v1.md` delta table.
**Regression test:** `src/app/api/module-runs/route.integration.test.ts` (routes + entries stamping + board payoff).
**Fix:** PR #251. **Date logged:** 2026-07-03.

### R23 — Code audit (2026-07-03): a planned module offered no path into the runner.

Planner module cards only toggled status or deleted — the parent had to re-find the module through Explore. Card titles now open the runner (status dot keeps the toggle) and carry `plannerEntryId` provenance onto the saved entry. Whether a finished run auto-completes the plan stays a flagged product question.
**Spec affected:** planner↔runner integration (June content-hierarchy audit gap).
**Regression test:** `src/components/planner/ModuleCard.test.tsx`; `entries/route.integration.test.ts` planner-provenance cases.
**Fix:** PR #252 (stacked on #251). **Date logged:** 2026-07-03.

### R24 — Code audit (2026-07-03): browse counts promised draft content — fifth recurrence of the ungated-count() class.

`PACK_DETAIL_QUERY` per-activity asset/text counts (which also counted the R-known broken commonsText refs), `ALL_PROJECTS_QUERY` stage count, and `DISCOVERY_OWN_MODULES_QUERY` activity count (plus its ungated approaches deref) all counted drafts inside otherwise-gated queries. `check-sanity-gating.mjs` now flags bare `count()` over gated arrays, so CI catches the class.
**Spec affected:** Sanity gating invariant (`src/lib/sanity/queries.ts` header).
**Regression test:** the strengthened CI check itself (red on all four sites pre-fix, green post-fix).
**Fix:** PR #253. **Date logged:** 2026-07-03.

### R25 — Code audit (2026-07-03): a purchased pack could not be added to the library from its own detail page.

`PackDetailCta` rendered owned-but-not-in-library as a disabled "Owned — Add to Library" button. Now active (same add path as membership packs). Alongside it, `createFullModule` gained transactional publish — a mid-flight failure previously orphaned a module shell with dangling refs in Sanity.
**Spec affected:** marketplace CTA matrix (`MarketplaceCard` parity comment); `/api/modules/publish` integrity.
**Regression test:** `src/components/pack/PackDetailCta.test.tsx`; `src/lib/sanity/mutations.test.ts`.
**Fix:** PR #254. **Date logged:** 2026-07-03.

### R26 — Code audit (2026-07-03): load failures masqueraded as empty or first-use states in the runner and constellation.

A failed module load surfaced as an unhandled rejection plus "Module not available"/"Not in your library"; a failed capabilities read rendered the first-use "Capabilities emerge from logging" zero-state to established families ("couldn't load" must never read as "not yet observed"). Both now land in gentle retryable states; restored runner sessions clamp to the loaded activity list (a stale cursor rendered a blank facilitate view and mis-derived `sourceActivityIds`). Verified no-change-needed: the DLO confirm optimistic-override design was already refetch-safe.
**Spec affected:** `hearth-parent-journey-v1.md` Stage 2/3 trust contract ("not yet", never failure-as-emptiness).
**Regression test:** `src/app/(auth)/our-story/capabilities/page.test.tsx`; `src/lib/modules/completion.test.ts` clamp cases.
**Fix:** PR #255. **Date logged:** 2026-07-03.

---

*Next entry: R27. Append below; never edit above.*
