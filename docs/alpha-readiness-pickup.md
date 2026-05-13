<!-- Version: 2 | Date: 2026-04-21 | Changes: Rewrote as living status doc reflecting the wizard / analytics / cost-dashboard sprint; consolidated honest caveats + known limitations; original 19 Apr handover preserved in History section. -->
<!-- Stale-caveat sweep: 2026-05-13 — caveats §8, §9 and the §16 list (Constellation L3, Portfolio card differentiation) were marked obsolete after audit verification against the code. See docs/pre-release-tracker.md §D. -->

# Alpha-Readiness — Status

> Living status of the alpha-readiness workstream. Updated whenever a
> session closes out items.
> Branch of record for the current sprint: `claude/fix-alpha-readiness-report-O9TNh`.

---

## Latest update — 21 April 2026

The full 8-item critical path from the original 2026-04 audit is now
shipped, plus the decision-free follow-ups (remaining pilot events,
admin cost dashboard, runbooks).

### What shipped this sprint (branch `claude/fix-alpha-readiness-report-O9TNh`)

| Area | Commit | What landed |
|---|---|---|
| Pedagogy wizard | `e580ef4` | Full 4-step wizard (Philosophy / Values / Practices / Review with demo activity); onboarding Step 3; "Re-run wizard" modal in Settings; 9 new adapter-contract tests. |
| Runbooks + branch hygiene | `f2bf51c` | `docs/deployment-runbook.md`, `docs/incident-runbook.md`, `docs/branch-hygiene.md`, `scripts/audit-stale-branches.mjs`. |
| PostHog events | `b69145f` | Remaining 5 events (`entry_enriched`, `module_added_to_library`, `report_exported`, `logger_completed_50pct`, `pedagogy_set`) + server-side capture helper. |
| AI cost dashboard | `5783437` | Admin "AI Cost" tab over `ai_pipeline_logs`, window selector, draft-vs-full split, top-20 families by spend. |
| Critical-review fixes | `229b62d` | Bug fixes (PostHog distinct-ID mismatch, onboarding-skip regression) + a11y fixes (focus trap, ARIA tabs, dialog semantics, duplicate header). |

Also carried forward from `claude/alpha-readiness-report-0RXUg` via
fast-forward: `3025c40`, `4917d1b`, `1c28145`, `1d7f92e`, `0ecd263`,
`ba24f65` (draft insights, Sentry + PostHog baseline, badge queue,
`.env.example`, CI workflow, Our Story tab fix, FamilyAccessPanel bug).

### Decisions resolved this sprint

| # | Decision | Resolution |
|---|---|---|
| I | Pedagogy wizard: build or defer? | **Build.** Full 4-step wizard shipped. |
| J | Demo activity for Step 4 | Hardcoded "Bug Observation Under Rocks" (matches spec Section 6). |
| K | Secret management | Stay on Vercel UI. Documented in deploy runbook §1.2. |
| L | Migration gating | Manual `drizzle-kit migrate` + runbook step. Documented in deploy runbook §1.4. |
| M | E2E in CI | Skip. Rely on Vercel preview manual QA. |
| N | Branch protection + trim process | Protection rules matrix + GitHub auto-delete + `scripts/audit-stale-branches.mjs`. Documented in `docs/branch-hygiene.md`. |

---

## Honest caveats / known limitations

> What we haven't actually verified, or what we know isn't complete. Be
> honest with yourself when you're about to promise these to a family.

### Didn't verify in this environment

1. **`next build` was not run.** This sandbox has no `DATABASE_URL`, so
   `npm run build` collects-page-data and fails during static analysis
   of API routes. We relied on `npx tsc --noEmit`, `eslint`, and
   `vitest run` (36/36 green). Before production deploy, do a local
   `npm run build` with env vars set.
2. **No browser QA of the pedagogy wizard.** Type-checked and linted,
   but no human has actually clicked through the 4 steps or the
   Settings re-run flow. First-deploy smoke test (deploy runbook §1.6
   #3) exercises this path — do not skip it.
3. **Cron endpoints assume Vercel injects the `CRON_SECRET` Bearer
   token.** The runbook suggests curl-ing them with the secret after
   deploy; if the route handlers expect the bearer in a specific
   header shape, this may not be exactly right. Worth verifying
   against the actual route code on first deploy.

### Known code-level limitations

4. **Co-facilitator double-counting in PostHog.** Both the client
   wrapper and the server helper identify on `hash(clerkUserId)`,
   which means one family with two Clerk users will appear as two
   PostHog persons. Client and server events for the same Clerk user
   DO join correctly (this was a bug, now fixed). The family-level
   aggregation fix still wants to happen — see
   `src/components/analytics/PostHogProvider.tsx`.
5. **22 pre-existing ESLint errors** (mostly `@typescript-eslint/no-explicit-any`
   plus one `@next/next/no-html-link-for-pages` and two setState-in-effect
   warnings). None in files touched this sprint. While they exist, the
   CI workflow keeps `lint` as `continue-on-error: true`. Clearing them
   is the gating task before lint becomes a required check.
6. **Pedagogy wizard prioritisation uses ↑↓ buttons, not drag.** The
   spec allows either; arrows are more accessible and have no dep
   cost. If real users ask for drag, revisit.
7. **Review-step demo insights are hardcoded per-philosophy.** Matches
   spec (template synthesis acceptable for MVP, Haiku-generated
   synthesis is a Phase-2 polish item).
8. ~~**Wizard does not persist partial progress.**~~ **[Superseded 2026-05-13]** Shipped per `production-readiness-tracker.md` #13 — `PedagogyWizard` reads/writes `hearth-pedagogy-wizard-draft` in localStorage on every state change.
9. ~~**Review-step tab keyboard navigation is partial.**~~ **[Superseded 2026-05-13]** Shipped per tracker #14 — arrow-key cycling + Home/End handle WAI-ARIA APG.
10. **Admin AI-cost pricing is hardcoded** to Haiku 4.5 rates ($0.80 /
    Mtok input, $4.00 / Mtok output) in `PRICING_PER_MTOK` inside
    `/api/admin/analytics/ai-cost/route.ts`. If the wired model
    changes, the dashboard USD figures will be wrong until the
    constant is updated.
11. **Cost dashboard family IDs are truncated to 8 characters.** Real
    UUIDs collide at that prefix with probability ≈ `1 in 2^32` — fine
    for pilot scale but verify by cross-checking admin → Families if
    you need to identify a specific family.
12. **`handleSkipWizard` in onboarding advances to Step 4 even if the
    settings PATCH fails.** The comment says lazy-create in
    `/api/settings` GET will fix it; true only if the server is up.
    If the whole settings API is down, the user hits an error later.
    Acceptable trade-off for a skip flow.
13. **`scripts/audit-stale-branches.mjs` assumes `origin/main` as
    base.** `BASE=origin/develop` works as an escape hatch, but the
    script has no auto-detect for differently-named default branches.
14. **In-memory rate limiter is single-region only.** When/if Hearth
    goes multi-region before Redis-backed limiting is added, the
    limiter becomes effectively permissive (each region counts
    separately). Flagged in `docs/incident-runbook.md §3`.

### Conscious omissions from this sprint

15. **No PR opened.** User hadn't asked for one.
16. **Phase-2 items from the original audit — partially out of date as of 2026-05-13:**
    - ~~Portfolio Journey/Milestone distinct card rendering~~ → **shipped.** Three colour treatments (coffee / ember / sage) live at `src/app/(auth)/our-story/portfolio/page.tsx:21-37`.
    - ~~Constellation L3 DLO panel~~ → **shipped, structurally.** Verified at `src/app/(auth)/our-story/capabilities/page.tsx`. **Data source as of 2026-05-13:** Sanity-loaded `discreteLearningObjective` documents via `ALL_DLOS_QUERY` (page.tsx → ConstellationRoute → buildDLOs). Falls back to `dlo-descriptors.ts` placeholder per-thread when Sanity has no published DLO for that thread; emits a one-shot `console.warn` per missing thread. **Open follow-ups:** (1) run `npx tsx scripts/seed-dlos.ts` against the production Sanity dataset — the seed script exists but no record of it having been run; (2) build the `learner_dlo_status` Postgres surface so per-DLO status stops being mechanically derived from `dlos_confirmed / dlos_total` arithmetic; (3) wire entry-to-DLO mapping in AI enrichment so the moments pip-row in `GalleryDLOs` can drill below tier granularity.
    - **Hub term summary AI narrative** → still falls back to template often; see `pre-release-tracker.md` F6.
    - **Offline support (PWA / sync queue)** → still Phase 2 (#16 on the Interaction Map); see tracker F5.

---

## Still open (for future sessions)

### Gated on decisions (none of these have them yet)

- Hub term summary: static template today, spec wants AI-generated
  monthly growth copy. (Now also tracked as `pre-release-tracker.md` F6.)
- ~~Portfolio Journey/Milestone distinct card rendering — architectural change.~~ **Shipped 2026-05-13 verification.**
- ~~Constellation L3 DLO panel — architectural change.~~ **Shipped 2026-05-13 verification.**
- Offline support — out of MVP per the original spec. (Now also tracked as `pre-release-tracker.md` F5.)

### Decision-free, ready to pick up

- Clear the 22 pre-existing ESLint errors → flip `continue-on-error` on
  the lint job to `false` in `.github/workflows/test.yml`.
- Arrow-key cycling between the Review-step insight tabs (caveat 9).
- Family-level PostHog identification (caveat 4).
- Drag-and-drop reordering for values/practices if user feedback asks.
- Model-aware pricing in the cost dashboard: accept a `model_used` →
  price map (caveat 10).

---

## Post-deploy observability checklist

After the first prod deploy:

- [ ] Sentry DSN wired; test event captured via
      `window.Sentry?.captureMessage('deploy-smoke-test')`.
- [ ] PostHog key + host wired; `entry_created` + `entry_enriched`
      appear as events on the same person (confirms client/server
      distinct-ID join works end-to-end).
- [ ] Admin → Analytics → AI Cost tab returns data for a recent
      window (requires at least one enrichment call).
- [ ] GitHub Settings → General → "Automatically delete head branches"
      is on.
- [ ] `node scripts/audit-stale-branches.mjs` runs cleanly from the
      operator's laptop.
- [ ] Cron secret rotated, value in Vercel env vars, both cron routes
      respond 200 to a manual curl with the bearer.

---

## History — original handover (19 April 2026)

> Content below preserved from the first alpha-readiness session on
> branch `claude/alpha-readiness-report-0RXUg`. Left in place for
> historical traceability — all open items from this section have
> since been closed.

### What shipped that session (5 commits)

| Plan | Commit | Status |
|---|---|---|
| 8. `useState`→`useEffect` bug in FamilyAccessPanel | `ba24f65` | Done |
| 7. Our Story Hub redundant tab strip removed | `ba24f65` | Done |
| 5a. `.env.example` with all 16 env vars | `ba24f65` | Done |
| 6a. GitHub Actions CI (typecheck + unit tests required, lint non-blocking) | `ba24f65` | Done |
| 3. Badge assessment queue + warmer toast copy | `0ecd263` | Done |
| 2. Sentry + self-hosted PostHog with hashed family IDs | `1d7f92e` | Done |
| 1. Debounced Haiku draft insights with cost caps | `1c28145` | Done |
| 1–3 (self-review) | `3025c40` | Done |

### Decisions that were open at handover (all now resolved — see §Decisions above)

- I/J — Pedagogy wizard build vs defer → **build** (shipped this sprint).
- K — Secret management → **Vercel UI** (runbook §1.2).
- L — Migration gating → **manual + runbook** (runbook §1.4).
- M — E2E in CI → **skip** (CI workflow unchanged).
- N — Branch protection → **on** (branch-hygiene doc).

### Observability events that were outstanding (all now wired)

- ✅ `entry_created`, `badge_awarded`, `badge_deferred` — prior session
- ✅ `entry_enriched`, `module_added_to_library`, `report_exported`,
     `logger_completed_50pct`, `pedagogy_set` — this sprint
