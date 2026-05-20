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
| A1 | `CommonsReader` audio button — `title="Audio coming soon"` (disabled) | `src/components/content/CommonsReader.tsx:140` | All users with commons text access | ✅ Hidden 2026-05-20. |
| A2 | `CommonsReader` "Reading coming soon" fallback | `src/components/content/CommonsReader.tsx:206` | All users when content lacks reading variants | ✅ Stubbed 2026-05-20 — fallback copy changed to "Reading not available for this text." (no longer leaks future scope). |
| A3 | `PrintSheet` "Download as separate files (coming soon)" disabled radio | `src/components/content/PrintSheet.tsx:270` | All users with printable items | ✅ Hidden 2026-05-20. |
| A4 | `MaterialItemRow` "Coming soon" badge on audio assets | `src/components/content/MaterialItemRow.tsx:133` | All users browsing materials | ✅ Hidden 2026-05-20. |
| A5 | `MarketplaceCard` "Coming soon" button on premium packs without `stripePriceId` | `src/components/screens/MarketplaceCard.tsx:242` | All users on Marketplace | ✅ Hidden 2026-05-20 — marketplace page filters out `availability === 'premium' && !stripePriceId` so the disabled-button branch is no longer reached. Branch removed from `MarketplaceCard`. Re-surfaces automatically once Stripe wiring (decision #1) lands + price IDs are assigned. |
| A6 | `QuickCapture` voice button `title="Coming soon"` (disabled) | `src/app/(auth)/module/[id]/_components/QuickCapture.tsx:81` | Authenticated users in facilitate mode | ✅ Hidden 2026-05-20. Voice capture remains a post-pilot decision (no Web Speech hook in QuickCapture path). |
| A7 | `FacilitateMode` "Coming soon" span on audio assets | `src/app/(auth)/module/[id]/_components/FacilitateMode.tsx:217` | Authenticated facilitators | ✅ Hidden 2026-05-20. |
| A8 | `AdminSidebar` Analytics tooltip "Coming soon" | `src/app/(admin)/admin/_components/AdminSidebar.tsx:74` | Admin only | ✅ No-op 2026-05-20 — verified no NAV_ITEMS entry currently sets `disabled: true`, so the tooltip path is unreachable. |
| A9 | `/dev-preview/log` placeholder route | `src/app/dev-preview/log/page.tsx:20` | Dev preview only | ✅ Accepted 2026-05-20 — dev-only surface, never linked from authenticated UI. |

**Recommended pre-pilot move:** Sweep A1–A7 in one PR. Default to hiding rather than building; accept a slimmer pilot surface area and ship audio + Stripe post-pilot.

---

## B. Code-level stubs

Verified to either throw, return 503, or be unreachable.

| # | Item | Where | Verdict |
|---|---|---|---|
| B1 | Stripe webhook returns 503 "Payments not configured" | `src/app/api/stripe/webhook/route.ts:4-5` | 🟡 In flight. Decision #1 (2026-05-20): wire Stripe + build a free-code/trial system. Needs separate scoping PR. |
| B2 | Stripe checkout returns 503 | `src/app/api/stripe/checkout/route.ts:4-5` | Same as B1. |
| B3 | `HaikuCoachProvider.getHints()` throws `"not yet implemented"` | `src/lib/logger/coaching/haiku-provider.ts:8-13` | ✅ Accepted as intentional stub 2026-05-20 per decision #5. Reachable via `LOGGER_COACH_PROVIDER=haiku` env flag; will throw until the implementation lands. Pilot default (unset → `'retrieval'`) is unaffected. |
| B4 | `HybridCoachProvider.getHints()` throws `"not yet implemented"` | (deleted) | ✅ Deleted 2026-05-20 per decision #5 — collapsed to Retrieval + Haiku-stub only. |
| B5 | `LOGGER_COACH_PROVIDER` env flag silently overridden | `src/lib/logger/coaching/resolve.ts` | ✅ Fixed 2026-05-20 — flag accepts `'retrieval'` (default) or `'haiku'` (stub); unknown values warn + fall back. No more silent override. |
| B6 | `src/test/example.integration.test.ts:25` — `describe.skip(...)` on `POST /api/entries` real-DB suite | `src/test/example.integration.test.ts:25` | ✅ Deleted 2026-05-20 — pure scaffold (all code inside `describe.skip` was commented out). Real entries integration coverage lives at `src/app/api/entries/route.integration.test.ts`. |

---

## C. Schema / data-layer gaps

Verified by reading schemas + queries + mutations.

| # | Item | Where | Verdict |
|---|---|---|---|
| C1 | `pack.creatorType` queried + consumed but **not defined in schema** | Query: `src/lib/sanity/queries.ts:4` · Consumer: `src/components/screens/MarketplaceCard.tsx:49,167` · Schema: `src/sanity/schemas/pack.ts` | ✅ Added 2026-05-20 — `creatorType` field with `content-team \| educator \| parent` enum list now in `src/sanity/schemas/pack.ts`. |
| C2 | `pack.intro` object defined, **never queried** | Schema: `src/sanity/schemas/pack.ts:23-55` | ✅ Resolved 2026-05-20 — read-side wired (`PACKS_QUERY` projects `intro{ title, keyPoints }`; marketplace detail modal renders both). **Authoring side is kindler-owned** per decision #7 follow-up: richer `intro.body` (Portable Text) + `furtherReading[]` content is written by `claude-kindling/` during pack build, not via Studio. No Hearth-side ticket. Flip condition: a non-Drew editor needs to update pack intros without git access. |
| C3 | Three PKB schemas have **no CRUD path** — only used for embeddings indexing | Schemas exist for `pedagogyWorkedExample`, `pedagogyContraindication`, `pedagogyFacilitationVocabulary`. Zero hits in `src/lib/sanity/queries.ts` and `src/lib/sanity/mutations.ts`. | ✅ Resolved 2026-05-20 — **kindler-owned, no Hearth Studio CRUD** per decision #8. Authored externally in `claude-kindling/` via deterministic-ID mutations; pointer comment in `src/lib/pedagogy/chunk-builder.ts`. Flip condition: a non-Drew editor needs to update PKB corpus without git access. Until then, do not add Studio mutation helpers in Hearth. |
| C4 | `providerCodes` table is read-only | Schema: `src/lib/db/schema.ts:400-410` · Reader: `src/app/api/provider-code/validate/route.ts` · Admin: `src/app/(admin)/admin/provider-codes/` | ✅ Built 2026-05-20 per decision #9 (full scope). Migration `0012_provider_codes_admin.sql` adds `expires_at`, `heu_label`, `notes`, `created_by_admin_id`. New admin page at `/admin/provider-codes` with status filters, search, and bulk-create modal (1–100 codes per request). Validate route now honors `expires_at`. |
| C5 | `docs/lms-database-schema.js` drift | (deleted) | ✅ Deleted 2026-05-20 per decision #11 — Drizzle (`src/lib/db/schema.ts`) is the source of truth; CLAUDE.md + COMPONENT_REGISTRY.md + AI architecture doc updated to point at it. |
| C6 | `docs/lms-api-endpoints.js` — currency unverified | (deleted) | ✅ Deleted 2026-05-20 per decision #11 — the `src/app/api/` tree IS the spec; CLAUDE.md updated to point at it. |
| C7 | `scripts/seed-dlos.ts` has never been run against the production Sanity dataset | `scripts/seed-dlos.ts` · GROQ: `src/lib/sanity/queries.ts` (ALL_DLOS_QUERY) | 🚧 **Ops checklist item (cannot be done from Claude Code sandbox).** Add to deployment runbook: run `npx tsx scripts/seed-dlos.ts` with `SANITY_API_TOKEN` set before pilot. Idempotent (deterministic IDs + createOrReplace). Until then, constellation Depth-3 renders the `dlo-descriptors.ts` fallback + one `console.warn` per thread — functional, just chatty in logs. Mark resolved when the seed has been run against production Sanity. |
| C8 | `learner_dlo_status` Postgres surface is unbuilt | Referenced in `docs/hearth-badge-assessment-spec.md:291,302` · Not in `src/lib/db/schema.ts` | ⏳ **Accepted as post-pilot.** Blocks the Badge Assessment spec end-to-end, but per-DLO status is currently mechanical at `topology.ts::statusFor()` and the pilot doesn't depend on parent-assessment confirmations persisting. Revisit once badge assessment moves out of stub state. |
| C9 | No entry-to-DLO mapping in AI enrichment | `aiEnrichment.capability_threads[]` has `thread_id` + `confidence`, no `dlo_id` | ⏳ **Accepted as post-pilot.** Phase-6 AI-pipeline work — either enrichment prompt update or downstream classifier. Pilot ships with per-tier bucketed moments at Depth-4 (current behaviour). Revisit alongside C8. |

---

## D. Documentation hygiene — *the root cause of false negatives*

These docs were misleading our audits. Fixing them is cheap and prevents future audit-loops chasing ghosts.

| # | Item | Where | Verdict |
|---|---|---|---|
| D1 | `docs/alpha-readiness-pickup.md §8` "Wizard does not persist partial progress" — STALE | `docs/alpha-readiness-pickup.md:87-89` | ✅ Already shipped per `production-readiness-tracker.md` #13. Caveat already marked superseded inline in the doc (2026-05-13 sweep). |
| D2 | `docs/alpha-readiness-pickup.md §9` "Review-step tab keyboard navigation is partial" — STALE | `docs/alpha-readiness-pickup.md:90-93` | ✅ Already shipped per tracker #14. Caveat already marked superseded inline in the doc (2026-05-13 sweep). |
| D3 | `docs/alpha-readiness-pickup.md §16` "Constellation L3 DLO panel… untouched" — STALE | `docs/alpha-readiness-pickup.md` | ✅ Built. UI shipped (PR #42); placeholder data swapped for Sanity-loaded DLOs on `claude/constellation-dlo-swap` (2026-05-13). See C7 / C8 / C9 below for the remaining follow-ups (run seed, build `learner_dlo_status`, entry→DLO mapping). |
| D4 | `docs/alpha-readiness-pickup.md §16` "Portfolio Journey/Milestone distinct card rendering… untouched" — STALE | `docs/alpha-readiness-pickup.md:119-122` | ✅ Built. Three colour treatments (coffee / ember / sage) verified at `src/app/(auth)/our-story/portfolio/page.tsx:21-37,492,699`. |
| D5 | `docs/alpha-readiness-pickup.md "Still open / Gated on decisions"` — STALE | `docs/alpha-readiness-pickup.md:128-135` | ✅ Updated 2026-05-20 — dropped the redundant struck-through Portfolio + Constellation lines and the now-obsolete "Arrow-key cycling (caveat 9)" entry. Hub narrative + Offline retained. |
| D6 | `docs/hearth-module-builder-pathways-architecture-v2.md` pathway naming drift | Spec display names vs `module.createdVia` slugs at `src/app/(auth)/build/modules/page.tsx:15`. | ✅ Resolved 2026-05-20 per decision #10 — spec now carries an explicit §1.3.1 "Spec ↔ Code Naming" mapping table, with a semantic note that `'goal'` (parent framing) was deliberately kept over `'understanding'` (system-inferred output). No code change. |
| D7 | Pedagogy KB corpus docs — `-v1`/`-v2` variants | `docs/hearth-pedagogy-corpus-licensing-needs-v1.md` + `-v2.md` (the others are v1-only proof-of-concept files) | ✅ Verified 2026-05-20 — only `licensing-needs` has a v2, and `licensing-needs-v1.md` is already annotated as ARCHIVED → see v2 at the top of the file. `montessori-v1-pt2`, `unschooling-v1`, `charlotte-mason-v1` have no `-v2` and are explicitly proof-of-concept; nothing to supersede. |

**Why this section exists:** every false negative in the original audit traced back to a stale caveat or spec doc. Keeping a "stale docs to fix" lane prevents future audits from re-flagging the same ghosts.

---

## E. Orphan scripts

13 of 14 files in `scripts/` are not referenced anywhere actionable. One (`audit-stale-branches.mjs`) is documented as intentional manual; the rest are debug / one-shots that worked once.

| # | Script | Status | Verdict |
|---|---|---|---|
| E1 | `scripts/neon-test-branch.mjs` | ✅ Wired (`npm run test:integration`) | Keep. |
| E2 | `scripts/audit-stale-branches.mjs` | 📖 Documented as manual in `docs/branch-hygiene.md:68` | Keep, optionally wire into a monthly cron or GH Action. |
| E3 | `scripts/check-token-size.ts` | Orphan | ✅ Deleted 2026-05-20 — debug helper for PKB chunk-builder token counts; recreate from `chunk-builder.ts` if needed. |
| E4 | `scripts/debug-framework-slug.ts` | Orphan, "debug-" name | ✅ Deleted 2026-05-20. |
| E5 | `scripts/debug-full-query.ts` | Orphan, "debug-" name | ✅ Deleted 2026-05-20. |
| E6 | `scripts/fix-pedagogy-key.ts` | Orphan, one-shot fix | ✅ Deleted 2026-05-20 — one-shot Postgres fix for empty `pedagogy_key` values; assumed run. |
| E7 | `scripts/ingest-pedagogy-corpus.ts` | Wired as `npm run seed:pkb` | ✅ Wired 2026-05-20 — `npm run seed:pkb`. |
| E8 | `scripts/reembed-pedagogy-corpus.ts` | Wired as `npm run pkb:reembed` | ✅ Wired 2026-05-20 — `npm run pkb:reembed`. |
| E9 | `scripts/seed-content.ts` | (deleted) | ✅ Deleted 2026-05-20 per decision #12 — superseded by `src/scripts/seed-sample-packs/`. |
| E10 | `scripts/seed-pedagogy-frameworks.ts` | Wired as `npm run seed:pedagogy:frameworks` | ✅ Wired 2026-05-20 — `npm run seed:pedagogy:frameworks`. |
| E11 | `scripts/test-enrichment-integration.ts` | Orphan | ✅ Deleted 2026-05-20 — recreate as a proper `*.integration.test.ts` under vitest if needed. |
| E12 | `scripts/test-retrieval.ts` | Orphan | ✅ Deleted 2026-05-20 — same as E11. |
| E13 | `scripts/verify-pkb-embeddings.ts` | Wired as `npm run verify:pkb` | ✅ Wired 2026-05-20 — `npm run verify:pkb`. Run after `seed:pkb` / `pkb:reembed` as a verification gate. |
| E14 | `scripts/verify-sanity-docs.ts` | Wired as `npm run verify:sanity` | ✅ Wired 2026-05-20 — `npm run verify:sanity`. |

**Recommended:** spend one PR to `chore: prune scripts/` — keep E1/E2/E7/E8/E9/E10/E13/E14 if useful (wire each), delete the rest.

---

## F. Phase-2 scaffolding (acknowledge, don't ship)

These are intentionally inert. Worth a line in the tracker so future audits don't re-discover them as "gaps".

| # | Item | Where | Verdict |
|---|---|---|---|
| F1 | `SnapshotRecommendation` interface marked "Phase 2" | `src/types/snapshot.ts:23` | ⏳ Leave. Note in spec when work resumes. |
| F2 | `SnapshotPlannerSuggestion` interface marked "Phase 2" | `src/types/snapshot.ts:36` | ⏳ Leave. |
| F3 | Redis rate limiter migration plan | `docs/redis-rate-limiter-plan.md` + `src/lib/rate-limit.ts` in-memory | ⏳ Tracker #30 says "Do NOT implement yet" — keep deferred until multi-region trigger. |
| F4 | Custom illustrator-bespoke icons (`ChildShape*`, `HearthBrandMark`) currently alias to Phosphor `Star` / `Flame` | `src/components/icons/index.tsx:292-305` + `ChildShape*.tsx`, `HearthBrandMark.tsx` | 🚧 Blocked on illustrator deliverable, not on engineering decision. Phosphor fallback is intentional per `docs/hearth-icon-system-v1.md` — swap the aliases when assets land. |
| F5 | Logger PWA / offline sync queue | (no implementation) | ⏳ Phase 2 per `production-readiness-tracker.md` #29. Current `useOnlineStatus` + localStorage autosave is the alpha minimum. |
| F6 | Hub monthly term-summary narrative | `src/lib/ai/generate-monthly-narrative.ts` + `src/app/api/snapshot/regenerate-narrative/route.ts` | ✅ Resolved 2026-05-20 — Dashboard fires `POST /api/snapshot/regenerate-narrative` on mount (once per session, fire-and-forget). Server checks: any child with month entries + empty narrative? If yes and last rebuild > 1h ago, calls `rebuildSnapshot(family.id, 'manual')` (which runs `generateMonthlyNarrative`). Idempotent + throttled — predictable cost (~1 Haiku call per child per hour at most). |
| F7 | Editorial workbench: rich-block instruction picker (sayBlock / pauseNote / watchBlock) | TODO at `src/app/(admin)/admin/content/_components/editors/ActivityEditor.tsx:36-42` and `src/lib/content-studio/sanity-transform.ts:18-22` | ✅ Accepted post-pilot 2026-05-20 — plain-text emit works today; rich-block picker is editorial polish that only pays off at higher editorial volume. |
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
