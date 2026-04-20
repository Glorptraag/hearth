# Alpha-Readiness — Handover for Next Session

> Generated 19 Apr 2026 after a focused sprint on the 8-item critical path.
> Branch: `claude/alpha-readiness-report-0RXUg`.
> Read `docs/alpha-readiness-report-2026-04.md` for the full audit context,
> or refer to the report delivered in the chat transcript that produced this file.

---

## What shipped this session (5 commits on this branch)

| Plan | Commit | Status |
|---|---|---|
| 8. `useState`→`useEffect` bug in FamilyAccessPanel | `ba24f65` | ✅ Done |
| 7. Our Story Hub redundant tab strip removed | `ba24f65` | ✅ Done |
| 5a. `.env.example` with all 16 env vars | `ba24f65` | ✅ Done |
| 6a. GitHub Actions CI (typecheck + unit tests required, lint non-blocking) | `ba24f65` | ✅ Done |
| 3. Badge assessment queue + warmer toast copy | `0ecd263` | ✅ Done |
| 2. Sentry + self-hosted PostHog with hashed family IDs | `1d7f92e` | ✅ Done |
| 1. Debounced Haiku draft insights with cost caps | `1c28145` | ✅ Done |

All shipped commits pass `npx tsc --noEmit` and `npm test` (27/27).

---

## Still TODO — decisions required before work can start

### Plan 4 — Pedagogy Engine 4-step wizard (or formally drop)

**Why it matters.** Hearth's thesis is pedagogy-neutral content with runtime overlays. Values/Practices currently only surface in Settings — first-time families never see them, so every downstream screen's tone adaptation runs on an empty profile. Big thesis-fidelity gap.

**Decisions open**

- **I — Big call: wizard or defer?**
  - (a) **Build the wizard** (~1.5–2 days). Full 4 steps: Philosophy → Values (multi-select, max 5, drag-to-prioritise) → Practices (chips by category) → Review (demo activity preview + Eclectic caveat).
  - (b) **Defer and simplify spec** (~30 min). Update `docs/hearth-pedagogy-engine-spec-v1.md` to say "v1 ships with Philosophy-only onboarding + Values/Practices in Settings; full wizard is Phase 2." Add a Dashboard right-panel callout nudging week-1 families to Settings.
- **J — If (a), which seeded activity is the Step 4 demo preview?** Ideally the highest-engagement activity in the Starter Pack.

**Reference material**
- Spec: `docs/hearth-pedagogy-engine-spec-v1.md`
- Prototype: `prototypes/hearth-pedagogy-engine-v2.jsx`
- Current adapter: `src/lib/pedagogy/adapter.ts` + `adapter.test.ts`
- Current simplified selector: `src/components/settings/PedagogySelector.tsx`
- Current values/practices panel: `src/components/settings/PedagogyProfilePanel.tsx`
- Onboarding entry point: `src/app/(public)/onboarding/page.tsx` (Step 2)

**Execution outline if (a)**
1. Extend `PedagogyProfilePanel` into a step-oriented `<PedagogyWizard step={1..4} />`.
2. Wire drag-to-prioritise (HTML5 or `@dnd-kit`) for values.
3. Add a Review step that fetches one seeded activity and reframes it with the live adapter.
4. Replace Onboarding Step 2's pedagogy buttons with the wizard.
5. Add "Re-run wizard" link in Settings → Pedagogy that pre-fills prior selections.
6. Persist to `familySettings.pedagogyProfile` JSONB (already in schema).
7. Extend `adapter.test.ts` with wizard-output → adapter-input contract tests.

---

### Plan 5b — Deploy runbook

**Status.** `.env.example` is committed. The runbook itself is not.

**Decisions open**

- **K — Secret management.** Stay on Vercel UI, or move to Doppler/1Password? Recommended for solo-dev pilot: stay on Vercel UI.
- **L — Migration gating.** Auto-run `drizzle-kit migrate` as a Vercel build step, or keep manual with a documented runbook step? Recommended for pilot: manual + runbook.

**Pages to create**
- `docs/deployment-runbook.md`
  - First-deploy checklist (env vars, Vercel project settings, Pro-tier cron confirmation, Neon branch setup)
  - Migration sequence + rollback
  - Sanity dataset config + write-token rotation
  - Cron verification (`/api/admin/retention` Sun 02:00 UTC; `/api/admin/invitations/expire` daily 20:00 UTC)
  - Smoke test: health → sign in → one entry → enrichment fires → snapshot row appears → Sentry event captured → PostHog event captured
- `docs/incident-runbook.md`
  - Enrichment failing → check Sentry issues tagged `pipeline:enrich-entry` → check `aiPipelineLogs.modelUsed` ratios → flip `DRAFT_INSIGHTS_ENABLED=false` if cost spike
  - Rate limits tripping → check in-memory limiter (pre-Redis) is a single-instance fact; confirm only one Vercel region
  - Anthropic outage → keyword matcher remains the fallback for the Logger

**Estimate.** ~2 hours once K and L are answered.

---

### Plan 6b — CI extensions

**Status.** `.github/workflows/test.yml` has typecheck (required), unit tests (required), lint (`continue-on-error: true` until pre-existing 22 errors are cleared).

**Decisions open**

- **M — E2E secrets in CI.** Options:
  - (a) Dedicated Neon dev branch, rotated weekly, used by Playwright in CI.
  - (b) Ephemeral postgres container spun up in the GH Actions runner.
  - (c) Skip e2e in CI; rely on Vercel preview manual QA.
  Recommended for week 1: (c). Upgrade to (a) once Plan 1 is battle-tested.
- **N — Branch protection.** Fine being unable to `git push main` directly once protection is on? Required-status-checks: `typecheck`, `unit-tests`.

**Additional cleanup that will unblock lint gating**
- 22 pre-existing ESLint errors (mostly `@typescript-eslint/no-explicit-any` + one `@next/next/no-html-link-for-pages` + two `Calling setState synchronously within an effect`). Not in files this sprint touched; fix them in a separate PR, then remove `continue-on-error: true` from the workflow.

**Estimate.**
- (c) + branch protection: 15 min.
- (a) + lint cleanup: half-day.

---

## Observability plumbing — next steps after deploy

1. **Point `NEXT_PUBLIC_SENTRY_DSN`** at a Sentry project (free tier).
2. **Stand up a self-hosted PostHog** (per decision E) and set `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST`.
3. **Instrument the remaining pilot events** — only 3 of the 8 planned events are wired so far:
   - ✅ `entry_created`
   - ✅ `badge_awarded`
   - ✅ `badge_deferred`
   - ⬜ `entry_enriched` — fire after `enrichEntry()` resolves in `/api/entries` POST
   - ⬜ `module_added_to_library` — fire in Marketplace "Add to Library" click
   - ⬜ `report_exported` — fire in HEU Report export click
   - ⬜ `logger_completed_50pct` — fire once when completeness crosses 50%
   - ⬜ `pedagogy_set` — fire when pedagogy profile saves
   Each is a 2-line change in the relevant component. Event allowlist lives in `src/lib/analytics/posthog.ts` — keep adding to it.
4. **Build an admin cost dashboard** querying `aiPipelineLogs` grouped by `modelUsed` (filter for `-draft` suffix to separate draft-insight spend).

---

## Things to watch during the first week of the pilot

- **Haiku draft-insight spend.** Check `SELECT sum(input_tokens), sum(output_tokens), count(*) FROM ai_pipeline_logs WHERE model_used LIKE '%-draft' AND created_at > now() - interval '7 days'` weekly. Flip `DRAFT_INSIGHTS_ENABLED=false` if approaching $3/month.
- **Badge queue UX.** If parents routinely reach 3+ badges in one save, consider surfacing the list up front instead of walking sequentially. (Decision H said sequential — revisit if data says otherwise.)
- **Sentry noise.** The three pipeline catches will report every JSON parse or Haiku 5xx. If Haiku has a bad hour and Sentry spams, add a sampled capture rate.
- **PostHog identifies on Clerk user ID, not family ID.** If co-facilitators join (multiple Clerk users per family), events will be double-counted per family. Adjust `PostHogProvider.tsx` to identify on `family.id` via a server-fetched value when that happens.

---

## Branch and merge

Branch: `claude/alpha-readiness-report-0RXUg` (pushed). No PR opened — user had not requested one at time of handover. When ready to merge, create a PR with the alpha-readiness report as the description.

## Open questions I did not touch

These were listed in the original audit as pre-existing open design questions (not decision-free fixes, not in the 8-item critical path):

- Hub term summary narrative (static today, spec wants AI-generated monthly growth copy) — needs AI pipeline extension.
- Portfolio Journey/Milestone distinct card rendering — architectural change.
- Constellation L3 DLO panel — architectural change.
- Offline support (#16 on Interaction Map) — open, out of MVP.
