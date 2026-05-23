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
| A1 | `CommonsReader` audio button — `title="Audio coming soon"` (disabled) | `src/components/content/CommonsReader.tsx:140` | All users with commons text access | 🤔 Hide button until audio ships, or wire audio. |
| A2 | `CommonsReader` "Reading coming soon" fallback | `src/components/content/CommonsReader.tsx:206` | All users when content lacks reading variants | 🤔 Either ensure all commons texts have reading variants in Sanity, or render a less-leaky fallback. |
| A3 | `PrintSheet` "Download as separate files (coming soon)" disabled radio | `src/components/content/PrintSheet.tsx:270` | All users with printable items | 🤔 Hide the disabled option entirely; nothing about it should be visible. |
| A4 | `MaterialItemRow` "Coming soon" badge on audio assets | `src/components/content/MaterialItemRow.tsx:133` | All users browsing materials | 🤔 Hide the badge for audio rows until audio playback lands. |
| A5 | `MarketplaceCard` "Coming soon" button on premium packs without `stripePriceId` | `src/components/screens/MarketplaceCard.tsx:242` | All users on Marketplace | 🤔 Tied to B1 (Stripe). Either wire Stripe + assign price IDs, or remove premium packs from the public marketplace before pilot. |
| A6 | `QuickCapture` voice button `title="Coming soon"` (disabled) | `src/app/(auth)/module/[id]/_components/QuickCapture.tsx:81` | Authenticated users in facilitate mode | 🤔 Main Logger DOES have full Web Speech API wiring with `en-AU` locale. Either port the same hook into QuickCapture or hide the disabled button. |
| A7 | `FacilitateMode` "Coming soon" span on audio assets | `src/app/(auth)/module/[id]/_components/FacilitateMode.tsx:217` | Authenticated facilitators | 🤔 Same call as A4. |
| A8 | `AdminSidebar` Analytics tooltip "Coming soon" | `src/app/(admin)/admin/_components/AdminSidebar.tsx:74` | Admin only | 🟡 Low priority. Note: requires `disabled: true` on the NAV_ITEMS entry; verify whether any entry currently sets this. |
| A9 | `/dev-preview/log` placeholder route | `src/app/dev-preview/log/page.tsx:20` | Dev preview only | ⏳ Accept; not user-facing. |

**Recommended pre-pilot move:** Sweep A1–A7 in one PR. Default to hiding rather than building; accept a slimmer pilot surface area and ship audio + Stripe post-pilot.

---

## B. Code-level stubs

Verified to either throw, return 503, or be unreachable.

| # | Item | Where | Verdict |
|---|---|---|---|
| B1 | Stripe webhook returns 503 "Payments not configured" | `src/app/api/stripe/webhook/route.ts:4-5` | 🤔 Hold until pilot decision: free-only pilot, or wire Stripe. Currently MarketplaceCard handles missing `stripePriceId` via A5. |
| B2 | Stripe checkout returns 503 | `src/app/api/stripe/checkout/route.ts:4-5` | Same as B1. |
| B3 | `HaikuCoachProvider.getHints()` throws `"not yet implemented"` | `src/lib/logger/coaching/haiku-provider.ts:8-13` | 🤔 Hardcoded-unreachable via resolver (B5). Either implement + flip the flag, or delete the file. |
| B4 | `HybridCoachProvider.getHints()` throws `"not yet implemented"` | `src/lib/logger/coaching/hybrid-provider.ts:9-14` | Same as B3. |
| B5 | `LOGGER_COACH_PROVIDER` env flag silently overridden | `src/lib/logger/coaching/resolve.ts:10-16` — `getProviderKey()` warns then hardcodes `'retrieval'` | ⏳ Footgun. Either implement B3/B4 so the flag works, or remove the flag + warning so config can't drift. |
| B6 | `src/test/example.integration.test.ts:25` — `describe.skip(...)` on `POST /api/entries` real-DB suite | `src/test/example.integration.test.ts:25` | ⏳ Enable, port to a real spec under `src/app/api/entries/`, or delete the file. |

---

## C. Schema / data-layer gaps

Verified by reading schemas + queries + mutations.

| # | Item | Where | Verdict |
|---|---|---|---|
| C1 | `pack.creatorType` queried + consumed but **not defined in schema** | Query: `src/lib/sanity/queries.ts:4` · Consumer: `src/components/screens/MarketplaceCard.tsx:49,167` · Schema: `src/sanity/schemas/pack.ts` (missing) | 🤔 Add `creatorType` to the pack schema, or stop querying/consuming it. Currently relies on Sanity's schemaless runtime — values may exist in production but the schema doesn't enforce them. |
| C2 | `pack.intro` object defined, **never queried** | Schema: `src/sanity/schemas/pack.ts:23-55` | ⏳ Either expose via a query + UI surface, or remove the field. Dead schema fields rot quickly. |
| C3 | Three PKB schemas have **no CRUD path** — only used for embeddings indexing | Schemas exist for `pedagogyWorkedExample`, `pedagogyContraindication`, `pedagogyFacilitationVocabulary`. Zero hits in `src/lib/sanity/queries.ts` and `src/lib/sanity/mutations.ts`. | 🤔 Decide: (a) add Studio mutation helpers if these will be authored, or (b) keep as embeddings-only and document the seed path in `src/lib/pedagogy/chunk-builder.ts`. |
| C4 | `providerCodes` table is read-only | Schema: `src/lib/db/schema.ts:400-406` · Only reader: `src/app/api/provider-code/validate/route.ts:19-20` (`findFirst`) | ⏳ If admin needs to create provider codes via UI, add a write path. Otherwise document the out-of-band seeding path (probably Drizzle migration or admin SQL). |
| C5 | `docs/lms-database-schema.js` drift — missing `families.loggerDefaultMode`, missing `familyLibrary.sanityModuleId` (and its XOR constraint) | `docs/lms-database-schema.js` vs. `src/lib/db/schema.ts` | ⏳ Either regenerate the doc from Drizzle (or delete it — Drizzle is the source of truth and CLAUDE.md acknowledges it). |
| C6 | `docs/lms-api-endpoints.js` — currency unverified | `docs/lms-api-endpoints.js` | ⏳ Audit against actual `src/app/api/` tree, or delete. |
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
| E3 | `scripts/check-token-size.ts` | Orphan | 🤔 Wire or delete. |
| E4 | `scripts/debug-framework-slug.ts` | Orphan, "debug-" name | ⏳ Delete (debug one-shot). |
| E5 | `scripts/debug-full-query.ts` | Orphan, "debug-" name | ⏳ Delete. |
| E6 | `scripts/fix-pedagogy-key.ts` | Orphan, one-shot fix | ⏳ Delete after confirming the fix landed. |
| E7 | `scripts/ingest-pedagogy-corpus.ts` | Orphan | 🤔 Wire under `npm run seed:pedagogy` if it's the canonical ingestion path. |
| E8 | `scripts/reembed-pedagogy-corpus.ts` | Orphan | 🤔 Same as E7. |
| E9 | `scripts/seed-content.ts` | Orphan | 🤔 Reconcile with `src/scripts/seed-sample-packs/` (the actually-wired seeder). One source of truth. |
| E10 | `scripts/seed-pedagogy-frameworks.ts` | Orphan | 🤔 Wire under `npm run seed:pedagogy` or delete. |
| E11 | `scripts/test-enrichment-integration.ts` | Orphan | ⏳ Either move to `*.integration.test.ts` under vitest, or delete. |
| E12 | `scripts/test-retrieval.ts` | Orphan | ⏳ Same as E11. |
| E13 | `scripts/verify-pkb-embeddings.ts` | Orphan | 🤔 Wire as a post-seed verification step in the pedagogy ingestion flow. |
| E14 | `scripts/verify-sanity-docs.ts` | Orphan | 🤔 Same — useful as a verification gate, but only if wired into a script or CI. |

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

Open decisions, no implementation yet, in rough priority order:

1. Pilot is free-only → A5 + B1 + B2 (hide premium UI, accept Stripe stubs). Otherwise wire Stripe.
2. Audio assets in commons + materials → hide A1/A2/A4/A7 for pilot, or wire audio playback.
3. QuickCapture voice → port Logger's Web Speech hook, or hide A6.
4. Coach providers (Haiku/Hybrid) → implement and flip flag, or delete B3/B4 + remove flag B5.
5. Pack schema gaps → fix C1 (`creatorType`) before any new pack ships; decide C2 (`intro`) opportunistically.
6. PKB schemas C3 → embeddings-only or full Studio CRUD.
7. Docs sweep D1–D5 → 30-minute job; just do it.
8. Scripts sweep E → 30-minute job; just do it.
