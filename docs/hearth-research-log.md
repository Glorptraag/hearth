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

---

*Next entry: R12. Append below; never edit above.*
