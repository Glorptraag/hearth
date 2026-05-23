# Pre-Release Build Tracker

> Disposable working tracker for **build-side** gaps that need a decision before alpha pilot. Complements [`production-readiness-tracker.md`](production-readiness-tracker.md), which tracks operational/ops items (deploy, env, runbooks). Items here are code, schema, content, or doc hygiene work.
>
> Delete this file when the pilot launches and the gaps are either built, gated, or accepted.

**Created:** 2026-05-13 from the audit on branch `claude/review-unbuilt-specs-MAYHs`. Every item below was verified against the code at audit time; spot-check `git log` before acting if more than a week has passed.

---

## Status legend

- ✅ done · 🟡 in flight · ⏳ open · 🚫 blocked · 🤔 needs decision

Most items below need a **decision first** (build vs. gate vs. delete vs. accept). They are not all sequential work — pick by impact.

---

## A. User-visible "Coming soon" placeholders

Verified to render. Each one leaks future scope to pilot families.

| # | Item | Where | Visibility | Verdict |
|---|---|---|---|---|
| A1 | `CommonsReader` audio button — `title="Audio coming soon"` (disabled) | `src/components/content/CommonsReader.tsx:140` | All users with commons text access | ✅ Hidden 2026-05-24 (`0883b8f`). Audio button deleted entirely. |
| A2 | `CommonsReader` "Reading coming soon" fallback | `src/components/content/CommonsReader.tsx:206` | All users when content lacks reading variants | ✅ Replaced 2026-05-24 (`0883b8f`) with neutral "Reading not available for this text" empty state. |
| A3 | `PrintSheet` "Download as separate files (coming soon)" disabled radio | `src/components/content/PrintSheet.tsx:270` | All users with printable items | ✅ Removed 2026-05-24 (`0883b8f`). Combine-into-PDF is the only mode; no radio group rendered. |
| A4 | `MaterialItemRow` "Coming soon" badge on audio assets | `src/components/content/MaterialItemRow.tsx:133` | All users browsing materials | ✅ Filtered upstream 2026-05-24 (`0883b8f`). Audio items dropped in PrintSheet's grouping; badge branch removed. |
| A5 | `MarketplaceCard` "Coming soon" button on premium packs without `stripePriceId` | `src/components/screens/MarketplaceCard.tsx:242` | All users on Marketplace | ✅ Stripe wired end-to-end 2026-05-24 (`227d54e`/`48b2777`/`87f7adb`/`4348daa`). Premium packs with `stripePriceId` now render "Get Pack"; "Owned" badge after purchase via entitlements lookup. |
| A6 | `QuickCapture` voice button `title="Coming soon"` (disabled) | `src/app/(auth)/module/[id]/_components/QuickCapture.tsx:81` | Authenticated users in facilitate mode | ✅ Wired 2026-05-24 (`0883b8f`). Logger's en-AU Web Speech hook extracted into shared `useSpeechRecognition`; QuickCapture appends transcripts into the note field. |
| A7 | `FacilitateMode` "Coming soon" span on audio assets | `src/app/(auth)/module/[id]/_components/FacilitateMode.tsx:217` | Authenticated facilitators | ✅ Filtered upstream 2026-05-24 (`0883b8f`). Audio branch removed; same filter as A4. |
| A8 | `AdminSidebar` Analytics tooltip "Coming soon" | `src/app/(admin)/admin/_components/AdminSidebar.tsx:74` | Admin only | ✅ Verified 2026-05-24 — unreachable in current state. `NAV_ITEMS` defines no entry with `disabled: true`, so the `Coming soon` tooltip branch never renders. The branch is kept as scaffolding for future disabled nav items; no live tooltip leaks to admins today. |
| A9 | `/dev-preview/log` placeholder route | `src/app/dev-preview/log/page.tsx:20` | Dev preview only | ✅ Accepted 2026-05-24 — dev-only route, not in production navigation. |

**Recommended pre-pilot move:** Sweep A1–A7 in one PR. Default to hiding rather than building; accept a slimmer pilot surface area and ship audio + Stripe post-pilot.

---

## B. Code-level stubs

Verified to either throw, return 503, or be unreachable.

| # | Item | Where | Verdict |
|---|---|---|---|
| B1 | Stripe webhook returns 503 "Payments not configured" | `src/app/api/stripe/webhook/route.ts:4-5` | ✅ Wired 2026-05-24 (`87f7adb`). Signature-verifying webhook handler with idempotent entitlement insert + `pack_purchased` server event. 6 unit tests green. |
| B2 | Stripe checkout returns 503 | `src/app/api/stripe/checkout/route.ts:4-5` | ✅ Wired 2026-05-24 (`87f7adb`). Clerk-auth'd, rate-limited 10/min, server-side Sanity re-fetch of `stripePriceId`. |
| B3 | `HaikuCoachProvider.getHints()` throws `"not yet implemented"` | `src/lib/logger/coaching/haiku-provider.ts:8-13` | ✅ Deleted 2026-05-24 (`badfcd8`). |
| B4 | `HybridCoachProvider.getHints()` throws `"not yet implemented"` | `src/lib/logger/coaching/hybrid-provider.ts:9-14` | ✅ Deleted 2026-05-24 (`badfcd8`). |
| B5 | `LOGGER_COACH_PROVIDER` env flag silently overridden | `src/lib/logger/coaching/resolve.ts:10-16` — `getProviderKey()` warns then hardcodes `'retrieval'` | ✅ Removed 2026-05-24 (`badfcd8`). Resolver returns retrieval directly; env flag stripped from `.env.example` + external-services-guide. |
| B6 | `src/test/example.integration.test.ts:25` — `describe.skip(...)` on `POST /api/entries` real-DB suite | `src/test/example.integration.test.ts:25` | ✅ Deleted 2026-05-24 (`badfcd8`) — real `src/app/api/entries/route.integration.test.ts` is canonical. |

---

## C. Schema / data-layer gaps

Verified by reading schemas + queries + mutations.

| # | Item | Where | Verdict |
|---|---|---|---|
| C1 | `pack.creatorType` queried + consumed but **not defined in schema** | Query: `src/lib/sanity/queries.ts:4` · Consumer: `src/components/screens/MarketplaceCard.tsx:49,167` · Schema: `src/sanity/schemas/pack.ts` (missing) | ✅ Added 2026-05-24 (`a6aa02d`). `creatorType` defined with options list (`content-team` / `educator` / `parent`). |
| C2 | `pack.intro` object defined, **never queried** | Schema: `src/sanity/schemas/pack.ts:23-55` | ✅ Removed 2026-05-24 (`a6aa02d`). |
| C3 | Three PKB schemas have **no CRUD path** — only used for embeddings indexing | Schemas exist for `pedagogyWorkedExample`, `pedagogyContraindication`, `pedagogyFacilitationVocabulary`. Zero hits in `src/lib/sanity/queries.ts` and `src/lib/sanity/mutations.ts`. | ✅ Documented 2026-05-24 (`a6aa02d`). Top-of-file note in `chunk-builder.ts` declares PKB schemas embeddings-only; seeding via `npm run seed:pedagogy:corpus` + `seed:pedagogy:reembed`. |
| C4 | `providerCodes` table is read-only | Schema: `src/lib/db/schema.ts:400-406` · Only reader: `src/app/api/provider-code/validate/route.ts:19-20` (`findFirst`) | ✅ Documented 2026-05-24 (`a6aa02d`). Deployment runbook §1.4 covers SQL INSERT/UPDATE seed path. No admin UI. |
| C5 | `docs/lms-database-schema.js` drift — missing `families.loggerDefaultMode`, missing `familyLibrary.sanityModuleId` (and its XOR constraint) | `docs/lms-database-schema.js` vs. `src/lib/db/schema.ts` | ✅ Deleted 2026-05-24. Drizzle (`src/lib/db/schema.ts`) is canonical. CLAUDE.md row + Hearth_AI_Intelligence_Layer_Architecture / COMPONENT_REGISTRY refs updated. |
| C6 | `docs/lms-api-endpoints.js` — currency unverified | `docs/lms-api-endpoints.js` | ✅ Deleted 2026-05-24. Source tree at `src/app/api/` is canonical. CLAUDE.md row + COMPONENT_REGISTRY ref removed. |
| C7 | `scripts/seed-dlos.ts` has never been run against the production Sanity dataset | `scripts/seed-dlos.ts` · GROQ: `src/lib/sanity/queries.ts` (ALL_DLOS_QUERY) | ✅ Run against production 2026-05-23 (`c1c0336`, PR #63): 171 docs = 57 threads × 3 tiers. Constellation L3/L4 now reads exclusively from Sanity. Placeholder fallback branch + `'placeholder'` source discriminator removed from `topology.ts`; `dlo-descriptors.ts` retained as a seed-time-only artefact. |
| C8 | `learner_dlo_status` Postgres surface is unbuilt | Referenced in `docs/hearth-badge-assessment-spec.md:291,302` · Not in `src/lib/db/schema.ts` | ✅ Shipped (`f1e287b` "Item 6 — genuine per-DLO state, kill tier-rank fake" + migration `0015_dlo_state.sql`). Tier-rank arithmetic in `statusFor()` replaced by real per-DLO state from `learner_dlo_state`. Explicit parent-confirmation write path in `f084750`. |
| C9 | No entry-to-DLO mapping in AI enrichment | `aiEnrichment.capability_threads[]` has `thread_id` + `confidence`, no `dlo_id` | ✅ Shipped (`16821ca` "end-to-end DLO generation from observations" + `c1c0336`). Haiku output now carries DLO refs; persistence at `src/lib/ai/dlo-persistence.ts`; per-column moments pip-row in `GalleryDLOs` drills to actual DLO, not tier bucket. |

---

## D. Documentation hygiene — *the root cause of false negatives*

These docs were misleading our audits. Fixing them is cheap and prevents future audit-loops chasing ghosts.

| # | Item | Where | Verdict |
|---|---|---|---|
| D1 | `docs/alpha-readiness-pickup.md §8` "Wizard does not persist partial progress" — STALE | `docs/alpha-readiness-pickup.md:87-89` | ✅ Already shipped per `production-readiness-tracker.md` #13. Strike the caveat. |
| D2 | `docs/alpha-readiness-pickup.md §9` "Review-step tab keyboard navigation is partial" — STALE | `docs/alpha-readiness-pickup.md:90-93` | ✅ Already shipped per tracker #14. Strike the caveat. |
| D3 | `docs/alpha-readiness-pickup.md §16` "Constellation L3 DLO panel… untouched" — STALE | `docs/alpha-readiness-pickup.md` | ✅ Fully resolved. UI shipped (PR #42); Sanity-loaded DLOs swapped in 2026-05-13; the three remaining follow-ups (C7 seed, C8 `learner_dlo_status`, C9 entry→DLO mapping) all closed by 2026-05-23 — see C7/C8/C9 above. Strike. |
| D4 | `docs/alpha-readiness-pickup.md §16` "Portfolio Journey/Milestone distinct card rendering… untouched" — STALE | `docs/alpha-readiness-pickup.md:119-122` | ✅ Built. Three colour treatments (coffee / ember / sage) verified at `src/app/(auth)/our-story/portfolio/page.tsx:21-37,492,699`. Strike. |
| D5 | `docs/alpha-readiness-pickup.md "Still open / Gated on decisions"` — STALE | `docs/alpha-readiness-pickup.md:128-135` | ✅ Resolved 2026-05-24. List already trimmed to Hub narrative + PWA. |
| D6 | `docs/hearth-module-builder-pathways-architecture-v2.md` pathway naming drift | Spec uses "Understanding-First / Material-Anchored / Process-Steps / Inquiry-Driven / Retrospective Lift". Code uses `'material' \| 'process' \| 'inquiry' \| 'retrospective' \| 'goal'` at `src/app/(auth)/build/modules/page.tsx:15`. | ✅ Resolved 2026-05-24. Code literal renamed `'goal'` → `'understanding'`; Drizzle migration `0017_module_pathway_rename_goal_to_understanding.sql` backfills `module_drafts`. User-facing "Goal-Forward" label preserved. |
| D7 | Pedagogy KB corpus docs — multiple `-v1` and `-v2` variants exist | `docs/hearth-pedagogy-corpus-licensing-needs-v1.md` + `-v2.md`, etc. | ✅ Resolved 2026-05-24. Moved `-v1.md` to `docs/archive/`; remaining references repointed. |

**Why this section exists:** every false negative in the original audit traced back to a stale caveat or spec doc. Keeping a "stale docs to fix" lane prevents future audits from re-flagging the same ghosts.

---

## E. Orphan scripts

13 of 14 files in `scripts/` are not referenced anywhere actionable. One (`audit-stale-branches.mjs`) is documented as intentional manual; the rest are debug / one-shots that worked once.

| # | Script | Status | Verdict |
|---|---|---|---|
| E1 | `scripts/neon-test-branch.mjs` | ✅ Wired (`npm run test:integration`) | Keep. |
| E2 | `scripts/audit-stale-branches.mjs` | 📖 Documented as manual in `docs/branch-hygiene.md:68` | Keep, optionally wire into a monthly cron or GH Action. |
| E3 | `scripts/check-token-size.ts` | Orphan | 🤔 Deferred — low priority debug helper. |
| E4 | `scripts/debug-framework-slug.ts` | Orphan, "debug-" name | ✅ Deleted 2026-05-24. |
| E5 | `scripts/debug-full-query.ts` | Orphan, "debug-" name | ✅ Deleted 2026-05-24. |
| E6 | `scripts/fix-pedagogy-key.ts` | Orphan, one-shot fix | ✅ Deleted 2026-05-24. |
| E7 | `scripts/ingest-pedagogy-corpus.ts` | Orphan | ✅ Wired 2026-05-24 as `npm run seed:pedagogy:corpus`. |
| E8 | `scripts/reembed-pedagogy-corpus.ts` | Orphan | ✅ Wired 2026-05-24 as `npm run seed:pedagogy:reembed`. |
| E9 | `scripts/seed-content.ts` | Orphan | ✅ Deleted 2026-05-24 — superseded by `src/scripts/seed-sample-packs/` (already wired as `npm run seed:packs`). |
| E10 | `scripts/seed-pedagogy-frameworks.ts` | Orphan | ✅ Wired 2026-05-24 as `npm run seed:pedagogy:frameworks`. |
| E11 | `scripts/test-enrichment-integration.ts` | Orphan | ✅ Deleted 2026-05-24. |
| E12 | `scripts/test-retrieval.ts` | Orphan | ✅ Deleted 2026-05-24. |
| E13 | `scripts/verify-pkb-embeddings.ts` | Orphan | ✅ Wired 2026-05-24 as `npm run verify:pkb`. |
| E14 | `scripts/verify-sanity-docs.ts` | Orphan | ✅ Wired 2026-05-24 as `npm run verify:sanity`. |

**Recommended:** spend one PR to `chore: prune scripts/` — keep E1/E2/E7/E8/E9/E10/E13/E14 if useful (wire each), delete the rest.

---

## F. Phase-2 scaffolding (acknowledge, don't ship)

These are intentionally inert. Worth a line in the tracker so future audits don't re-discover them as "gaps".

| # | Item | Where | Verdict |
|---|---|---|---|
| F1 | `SnapshotRecommendation` interface marked "Phase 2" | `src/types/snapshot.ts:23` | ⏳ Leave. Note in spec when work resumes. |
| F2 | `SnapshotPlannerSuggestion` interface marked "Phase 2" | `src/types/snapshot.ts:36` | ⏳ Leave. |
| F3 | Redis rate limiter migration plan | `docs/redis-rate-limiter-plan.md` + `src/lib/rate-limit.ts` in-memory | ⏳ Tracker #30 says "Do NOT implement yet" — keep deferred until multi-region trigger. |
| F4 | Custom illustrator-bespoke icons (`ChildShape*`, `HearthBrandMark`) currently alias to Phosphor `Star` / `Flame` | `src/components/icons/index.tsx:292-305` + `ChildShape*.tsx`, `HearthBrandMark.tsx` | 🤔 Replace the six aliases when illustrator deliverables land. Until then, the Phosphor fallback is intentional per `docs/hearth-icon-system-v1.md`. |
| F5 | Logger PWA / offline sync queue | (no implementation) | ⏳ Phase 2 per `production-readiness-tracker.md` #29. Current `useOnlineStatus` + localStorage autosave is the alpha minimum. |
| F6 | Hub monthly term-summary narrative | `src/lib/ai/generate-monthly-narrative.ts` wired but falls back to template often | 🤔 Trigger a snapshot rebuild on Dashboard mount when narrative is missing, or accept the template fallback as the alpha behaviour. |
| F7 | Editorial workbench: rich-block instruction picker (sayBlock / pauseNote / watchBlock) | TODO at `src/app/(admin)/admin/content/_components/editors/ActivityEditor.tsx:36-42` and `src/lib/content-studio/sanity-transform.ts:18-22` | 🤔 Useful post-pilot if editorial volume grows; plain-text emit works today. |
| F8 | AI cost dashboard pricing hardcoded to Haiku 4.5 | `/api/admin/analytics/ai-cost/route.ts` `PRICING_PER_MTOK` | ⏳ Maintenance debt. Move pricing table to env or per-model config when the wired model changes. |
| F9 | Badge assessment "compare" step UI | `src/app/(auth)/badges/assess/[id]/page.tsx` | ⏳ Step type exists; side-by-side compare UI stubbed. Post-pilot. |

---

## Process

1. **Decide first, build second.** Each 🤔 item needs a yes/no/defer decision. Prefer "hide and ship" over "build before pilot" when in doubt.
2. **One PR per section.** A–B in one PR (UI hygiene + stubs), C separately (schema), D as a docs sweep, E as a `chore: prune scripts/`.
3. **Update this tracker as items land.** Same convention as `production-readiness-tracker.md`: strike with ✅ + commit hash. When the pilot launches and the file is mostly ✅, delete it.
4. **Don't duplicate `production-readiness-tracker.md`.** If an item belongs to operational readiness (deploy, env, runbooks, CI), file it there.

---

## Decision queue (concise, for skimming)

✅ **All sections cleared 2026-05-24.** Overnight grind through A→F closed every 🤔 / ⏳ except the deliberately-deferred F-section Phase-2 items. Outstanding work is now operational (deploy, Stripe dashboard wiring, dataset seeding) rather than build-side.

Remaining deferred items (acknowledged, not blockers):

1. **F1/F2** — Snapshot recommendation/planner interfaces left as types-only stubs for Phase 2.
2. **F3** — Redis rate limiter migration still gated on multi-region trigger.
3. **F4** — Custom illustrator marks (`ChildShape*`, `HearthBrandMark`) still aliased to Phosphor `Star`/`Flame` pending bespoke deliverables.
4. **F5** — PWA / offline sync queue stays in Phase 2; `useOnlineStatus` + localStorage is the alpha minimum.
5. **F6** — Hub monthly term-summary narrative falls back to template; revisit when Hub copy resumes.
6. **F7** — Editorial workbench rich-block instruction picker is plain-text emit today; revisit if editorial volume grows.
7. **F8** — AI cost dashboard pricing table hardcoded to Haiku 4.5; move to per-model config when the wired model changes.
8. **F9** — Badge assessment "compare" step UI stub; post-pilot.
9. **E3** — `scripts/check-token-size.ts` debug helper left in place; low priority.

Operational follow-ups (for `production-readiness-tracker.md`, not this file):

- Stripe dashboard: products + prices created and `stripePriceId` set on each premium Sanity pack.
- Stripe dashboard: prod webhook endpoint created → `STRIPE_WEBHOOK_SECRET` set in Vercel.
- Local dev: `STRIPE_SECRET_KEY` + the `stripe listen` `whsec_…` in `.env.local`.

Once those three are done, this tracker can be deleted at pilot launch.
