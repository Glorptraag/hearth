# Plan: PKB Completion Program

> Fable-authored 2026-07-08 (approved plan: `~/.claude/plans/swithc-to-planning-mode-pure-cat.md`). Worker models execute; every judgment call is pre-made here. Status: `status-pkb-completion.json`. Coordination files: `corpus-fanout/`.

## Overview

The PKB engine (retrieval / Voyage embeddings / webhook / write-time enrichment) shipped April 2026, flag-gated behind `PEDAGOGY_KB_ENABLED`. PR #258 landed the corpus vault (`corpus/pedagogy/`, licence-as-data compiler, 87 seeded entries). This program (a) closes the visible loop in the app, (b) grows the corpus to Wave-1 volume across all frameworks in parallel, (c) fixes three verified structural weaknesses: dead rerank metadata (F1), diverged chunk-metadata writers (F8), and eclectic-always-fallback (F3).

**Two tracks.** Track E = engine PRs. Track W = corpus fan-out (calibration-gated waves). They converge at the ops flag-flip (architecture doc §5).

## Key Context for All Sessions (read before any task)

- **Model routing labels:** `[SONNET]` code + drafting · `[HAIKU]` mechanical · `[OPUS]` calibration verifiers · `[DREW]` human gates. Never self-upgrade a task's scope.
- Sanity schemas live at `src/sanity/schemas/` (registered in `index.ts` already — PKB types exist; you only ADD FIELDS, never new types).
- Pedagogy keys use underscores (`charlotte_mason`, `waldorf_steiner`); vault framework dirs use hyphens (`charlotte-mason`, `waldorf-steiner`); ID short codes: `cm`, `classical`, `montessori`, `waldorf`, `us` (see `src/lib/pedagogy/corpus/types.ts`).
- Embeddings: **Voyage `voyage-3`, 1024 dims** (`src/lib/pedagogy/embedding.ts`). Never OpenAI. Free tier = 3 RPM.
- One Haiku call per Logger save (UC5) is inviolable. Nothing in this program adds an LLM call.
- The vault walker (`src/lib/pedagogy/corpus/vault.ts`) compiles **every** non-README `.md` under `corpus/pedagogy/<framework>/<layer>/`. Coordination/review files live in `.claude/plans/corpus-fanout/`, never in the vault.
- `suggestedDraft` is Drew's review gate: workers NEVER write `suggestedDraft: false`. Omit the key (defaults true). `vault.test.ts` pins CM-migrated entries at `false` — do not touch them.
- Unschooling SE/PP/WE/FV are commissioned-author territory (PKB12/13). Never author or edit them, even if you notice gaps.
- Copyright is a lookup: `corpus/pedagogy/sources.json`. Verbatim only from `allowVerbatim: true` sources; otherwise `isParaphrase: true` in Hearth's words with attribution. Never debate copyright in-session.
- Every PR: one deliverable, individually green (lint + typecheck + `npm test`; integration where specified via `npm run test:integration:local`). Corpus tasks: `npm run corpus:check` zero issues.
- Binding re-land pattern: foundations soak before dependents; no parallel merges of interdependent PRs.

---

## Track E — Engine PRs

### E1: `pkb-schema-metadata-fields` `[HAIKU]` (deps: none)
Additive optional fields on PKB Sanity schemas (`src/sanity/schemas/pedagogy*.ts`). Allocation: `ageRange` object `{min,max}` (numbers 0–18) on SourceExcerpt/PracticePattern/ObservationalMarker/Contraindication/WorkedExample; `capabilityThreads` string-array (tags layout) on PracticePattern/ObservationalMarker/WorkedExample; `activityType` string on WorkedExample only; FacilitationVocabulary unchanged. All optional, no `required()`. Descriptions mention "retrieval rerank boost". Deliberately NO `situationalTags` field (request side sends `situationalSignals: []` today — dead key). Touch nothing else. No tests (declarative schema).

### E2: `pkb-corpus-contract-metadata` `[SONNET]` (deps: E1)
Vault frontmatter + compiler passthrough for E1's fields. `src/lib/pedagogy/corpus/parse.ts` `LAYER_CONTRACTS` optionalKeys mirror E1's allocation exactly. Grammar (frontmatter supports only strings/booleans/string-arrays): `ageRange: 4-8` bare string `/^(\d{1,2})\s*-\s*(\d{1,2})$/`, 0≤min≤max≤18, compiled to `{min,max}`; `capabilityThreads: [L1, S2]` inline array, every code validated against `Object.keys(THREAD_TO_V2_DOMAIN)` from `@/lib/capability-universe-v2`; `activityType: nature_walk` `/^[a-z][a-z0-9_]*$/`. Invalid → push `CorpusIssue` (matching existing style in `compile.ts`), never throw. Spread into compiled docs only when present — absent keys stay absent (round-trip parity for the existing 87). Update the layer table in `corpus/pedagogy/README.md` with the new optional keys + one example. Do NOT touch `frontmatter.ts` grammar. Tests in `compile.test.ts`: valid compile shapes; `ageRange: 8-4` and `ageRange: banana` rejected; unknown thread code named in the issue; absent keys → absent on doc. `vault.test.ts` stays green untouched.

### E3: `pkb-chunk-metadata-unification` `[SONNET]` (deps: none — parallel with E1/E2)
Fixes F8 (diverged metadata writers; batch path lacks display fields, webhook path lacks tags; hash-skip swallows metadata-only edits).
- `src/lib/pedagogy/chunk-builder.ts` `buildChunkMetadata()`: add generic `if (Array.isArray(doc.tags)) meta.tags = doc.tags;`; hoist `capabilityThreads` from the WorkedExample branch into the generic block; add display fields — ObservationalMarker: `markerName`, `whatItIndicates`, `markersToLookFor`; Contraindication: `warnedAgainst` (keep existing `tensionWithOtherTraditions` line); WorkedExample: `scenarioPreview` = first 200 chars of `scenario`, word-boundary truncation + `…` (small local `preview()` helper), keep `activityType`; FacilitationVocabulary: `verbSample` = first 3 `verbs[].verb`, `verbCount` = `verbs.length` (when non-empty). SourceExcerpt/PracticePattern branches unchanged.
- `scripts/reembed-pedagogy-corpus.ts`: delete private `extractMetadata`; import/use `buildChunkMetadata` (GROQ projection already spreads `...` + `framework->{slug}`; cast to `SanityPKBDocument` — `resolvePedagogyKey` handles `framework.slug`). Hash-match branch: instead of skip-only, compute new metadata and `UPDATE pedagogy_knowledge_chunks SET metadata = ${json}::jsonb, updated_at = NOW() WHERE id = ${id} AND metadata::text IS DISTINCT FROM ${json}::text`; report `N unchanged, M metadata-refreshed`; `--dry-run` lists refreshes.
- **Do NOT touch `buildChunkText`** — changing it invalidates every `content_hash` and forces a full re-embed.
- New `src/lib/pedagogy/chunk-builder.test.ts`: per-layer metadata assertions (tags copied; generic capabilityThreads/ageRange; each display field; `scenarioPreview` truncation; `pedagogyKey` from `framework.slug` and from `framework._ref`).

### E4: `pkb-attribution-layer-cards` `[SONNET]` (deps: E3 contract; mergeable in parallel)
`src/components/logger/PedagogyAttribution.tsx` — `SourceCard` branches for the 4 missing layers (currently `return null`):
- `worked_example`: sans micro-caption "Worked example"; serif italic `metadata.scenarioPreview`; muted `activityType` chip when present.
- `observational_marker`: caption "What to watch for"; `markerName` semibold serif; `whatItIndicates` `text-xs text-text-muted`; up to 2 `markersToLookFor` as `Look for: …` lines.
- `contraindication`: caption "A caution from this tradition"; `warnedAgainst` semibold. Neutral `border-border-subtle` tokens — NO new colour tokens (ember = action only).
- `facilitation_vocabulary`: caption "Facilitation language"; `verbSample` joined with `·`.
- Every branch + unknown layers: generic fallback card with humanised layer label (`layer.replace(/_/g,' ')`) when the primary field is missing (covers pre-E3 chunks).
- Per-card muted framework label ONLY when `source.pedagogyKey` differs from the `frameworkTitle` prop (eclectic-readiness hook for E6). Serif for content, sans for captions, motion/token rules per CLAUDE.md.
- New `PedagogyAttribution.test.tsx` (jsdom): per-layer render, per-layer fallback, conditional framework label, empty-sources → null, expand toggle.

### E5: `pkb-attribution-pipeline-regression` `[SONNET]` (deps: E3)
Pin-only (if a bug surfaces, STOP and report — change no production code).
- New `src/test/pkb-factories.ts`: `unitVector(components: Record<number,number>): number[]` (1024-dim, L2-normalised; import `EMBEDDING_DIMENSIONS` from `@/lib/pedagogy/embedding`) and `insertPedagogyChunk(db, {id, pedagogyKey, layer, text?, metadata?, embedding})` via raw `db.execute(sql\`INSERT …\`)` with `[${embedding.join(',')}]::vector(1024)` (table has no Drizzle schema object).
- New `src/lib/ai/__tests__/pedagogy-attribution-pipeline.integration.test.ts` (mirror `dlo-persistence.integration.test.ts` conventions): `vi.stubEnv('PEDAGOGY_KB_ENABLED','true')`; mock `@/lib/pedagogy/embedding` (deterministic `unitVector`, keep `EMBEDDING_DIMENSIONS` via `importActual`); in-file Anthropic mock returning a complete valid enrichment JSON (the setup-level canned response is not a full shape — derive a passing one from `validateEnrichment` in `src/lib/ai/enrich.ts`); seed family with `pedagogyPreference: 'charlotte_mason'` + learner + entry (`@/test/db-factories`); insert 3 chunks (source_excerpt with `{text, sourceAttribution}`, practice_pattern with `{triggerTitle}`, worked_example with `{scenarioPreview}`), same embedding as the query vector. Run `enrichEntry`; assert `learningEntries.aiEnrichment.pedagogy_sources` persisted with display metadata; then invoke the `GET /api/entries/[id]` handler (per its existing integration test) and assert the response carries the same `pedagogy_sources`.
- Optional unit: `buildPedagogyContextWithSources` maps chunks→sources 1:1 (mock `@/lib/pedagogy/retrieval`) and returns `[]` + fallback prompt when the flag is off.

### E6: `pkb-eclectic-multi-lens` `[SONNET]` (deps: none in code)
- `src/lib/pedagogy/retrieval.ts`: `const isEclectic = opts.pedagogyKey === 'eclectic'`. Eclectic SQL: `pedagogy_key IN (charlotte_mason, classical, montessori, waldorf_steiner, unschooling)` with `LIMIT 100`; non-eclectic SQL stays byte-identical (`= key`, `LIMIT 50`). Selection: `isEclectic ? selectEclectic(candidates, topN, 3) : selectWithLayerBalance(...)`. New exported pure `selectEclectic(candidates, topN, maxPerFramework=3)`: pass 1 fills guarantees [source_excerpt×2, practice_pattern×1, worked_example×1, contraindication×1] in adjusted-score order under the per-framework cap; pass 2 fills remaining by score under the cap; pass 3 relaxes the cap if still short; return score-sorted top-N. Guaranteed contraindication gets matchReason `'tension surfacing (contraindication)'`. Structured log gains `eclectic` + `frameworksReturned`. Still exactly one embedding call + one DB round-trip. Fallback semantics unchanged.
- `src/lib/ai/pedagogy-context.ts`: eclectic-only prompt variant — references get `tradition="${c.pedagogyKey}"` attributes; wrapper instructs: family draws on multiple traditions; name the tradition when attributing; "Where a contraindication from one tradition tensions with another tradition's suggestion, surface the tension honestly rather than resolving it silently." Non-eclectic prompt byte-identical (pin with an equality assertion).
- New `src/lib/pedagogy/retrieval-select.test.ts`: guarantee fill, missing-CI graceful degradation, per-framework cap, relaxation, sort order; pedagogy-context unit: eclectic prompt has `tradition="` + tension sentence, non-eclectic unchanged.
- Do not announce the feature until ≥2 non-CM corpora are populated.

### E7: `pkb-retrieval-integration-harness` `[SONNET]` (deps: E5, E6 — split eclectic describe if E6 pending)
New `src/lib/pedagogy/retrieval.integration.test.ts` (real pgvector container; mock embeddings to `unitVector`s; seed via `insertPedagogyChunk`). Cases: framework filter; similarity ordering; ageRange boost + matchReason; thread boost cap ≤0.15; tags fallback; layer balance (minority layers surface in top 8); eclectic spread ≥2 frameworks / ≤3 per framework / CI guarantee + tension matchReason; empty table → `fallbackUsed: true`.

### E8: `pkb-golden-query-verifier` `[SONNET]` (deps: E6 + populated index; NOT CI)
`scripts/verify-pkb-retrieval.ts` + `scripts/data/pkb-golden-queries.json` + npm script `verify:pkb:retrieval`. Fixture: 5 queries per framework in logger-entry voice (derive from that framework's worked-example scenarios / practice-pattern triggers in the vault) + 3 eclectic queries; expectations at framework/layer level only (`minChunks`, `layersInclude`, `frameworksOnly` / `minFrameworks`), never doc-ids. Script calls `retrievePedagogyChunks` directly (real code path); sequential with `--delay` (Voyage free tier); `--framework`/`--query` filters; per-query rank/layer/score/matchReasons print; exit 1 on any expectation failure. Model env/client conventions on `scripts/verify-pkb-embeddings.ts`. Do not wire into CI.

### E9: `pkb-c-pl6-lens-signals-spec` `[SONNET]` (deps: none; SPEC-ONLY — zero code)
New `docs/pkb-c-pl6-lens-signals-spec.md`. Pre-made decisions to elaborate: enrichment gains `pedagogy_references_used?: string[]` — chunk ids the model reports actually using, validated by `validateEnrichment` against `pedagogy_sources` (hallucination guard); free-string pattern IDs explicitly rejected as unverifiable. FIS per-child `lensSignals` block `{patternCounts: Record<"<pedagogy>:<layer>", number>, referenceCounts, topThreads, activityShapes}` computed in `snapshot-rebuild.ts` from existing enrichment output — no new LLM call (C-PL6). All optional/backward-compatible; absence = "no signal". Open questions: windowing, decay, eclectic cross-tradition counts. Build PR is gated on the W1-PP audit memo + Drew reading this spec.

---

## Track W — Corpus fan-out

### W0 — Governance & plumbing

- **W0.1 `[SONNET]`** (deps: none): `corpus/pedagogy/tags.json` bootstrapped from the current tag universe (extract from all entries). Shape `{"<tag>": {"category": "situation|age_band|concept|tension|domain", "aliases"?: string[], "description"?: string}}`. Seed alias cluster: `external_rewards` canonical; `stickers`/`bribes`/`rewards` aliases.
- **W0.2 `[SONNET]`** (deps: W0.1): compiler soft-warnings. New `src/lib/pedagogy/corpus/tags.ts` (`parseTagRegistry`, mirroring `registry.ts`: shape validation, closed category set, alias uniqueness). `vault.ts`: load `tags.json` if present (absence is NOT an error); add `warnings: CorpusIssue[]` to `VaultCompileOutput` (novel tag / alias-used / format). CLI prints a `⚠` block after coverage; NEVER exit 1 on warnings. `vault.test.ts`: assert only that tags.json parses — never zero-warnings.
- **W0.3 `[HAIKU]`** (deps: W0.1, E3): rewards-cluster normalization in the 5 files carrying `stickers`/`bribes`/`rewards` tags (3 are confirmed CM entries — tags-only edits, `suggestedDraft: false` untouched). Note in PR body: recompile + reembed propagates via E3's metadata-refresh.
- **W0.4 `[SONNET]`** (deps: none): review ergonomics. `scripts/corpus-review-manifest.ts` (`npm run corpus:review`): consume `compileVault()`, group `suggestedDraft === true` entries by framework/layer, print + write `.claude/plans/corpus-fanout/review-queue.md` (id | clickable path | title-ish field | tags). `scripts/corpus-confirm.ts` (`npm run corpus:confirm -- --ids …`): explicit ids REQUIRED (no `--all`, ever); all-or-nothing validation (unknown/already-confirmed id → error, nothing written); layer-qualified ids accepted where ambiguous (`pp:montessori.003` — Montessori reuses numbers across layers); surgical frontmatter flip only; finish with compile check + delta print ("+N confirmed, now M retrievable; next: seed:pedagogy:corpus && seed:pedagogy:reembed").
- **W0.5 `[SONNET]`** (deps: none): register all wave sources in `sources.json` — CM vols 2–6 (public_domain, verbatim; PG numbers verified); `quintilian-institutio-oratoria` (pre-1930 translation, note edition), `plato-republic-jowett`, `aristotle-politics-jowett`, `comenius-great-didactic-1896` (Keatinge), `locke-some-thoughts-education-1693`, `milton-of-education-1644` (all public_domain/verbatim); `sayers-lost-tools-1947` (in_copyright, allowVerbatim false); `steiner-foundations-human-experience-1919`, `steiner-practical-advice-teachers-1919`, `steiner-discussions-with-teachers-1919` (in_copyright / allowVerbatim false by default — German PD, common English translations 1966+; upgrade only if a pre-1930 translation is verified; Drew rubber-stamps). Update `SOURCES.md` table. Add gitignored `corpus/.source-cache/` (one `.gitignore` line) for pre-downloaded texts. None of this blocks on Drew beyond PR review.
- **W0.6 `[HAIKU]`** (deps: E2; reembed after also needs E3): metadata backfill of the existing 87 entries — add `ageRange` / `capabilityThreads` (/ `activityType` on worked-examples) frontmatter where content clearly implies them (age-band tags like `age_4_to_6` translate directly; thread codes per `docs/hearth-capability-dlo-reference.md`; when unsure, omit — absence beats guesswork). Confirmed CM entries: frontmatter additions only, flag untouched. `npm run corpus:check` clean.

### Wave mechanics (applies to W1–W4)

`Wx-CAL [SONNET]` → `Wx-VERIFY [OPUS]` → `Wx-ACK [DREW]` → bulk tasks (parallel) → `Wx-CLOSE [HAIKU]`.

- **CAL**: the calibration batch below, authored per the worker prompt template (in `corpus-fanout/README.md` + approved plan). 6 entries for waves with voice anchors (W1, W2); 8 for greenfield (W3, W4 — must include the FV singleton + one entry of every layer; FV sets the voice).
- **VERIFY**: separate `[OPUS]` session (never the drafting instance). Reads the CAL files, the cited source text, 3–4 confirmed exemplars, `tags.json`, `sources.json`; runs `corpus:check`. Rubric per entry (pass/edit/fail): (1) source fidelity — verbatim matches the registered edition, `pageOrChapter` plausible, no invented doctrine; (2) licence-gate truthfulness — a lightly-reworded quote marked `isParaphrase: true` is a FAIL; (3) tag conventions — canonical per tags.json, novel tags proposed explicitly; (4) tradition voice — practice patterns stay interpretive not prescriptive (2026-05-13 reframe), worked-example scenarios read like real Logger entries, no cross-tradition bleed; (5) mechanical — check-clean, filename/id/range, `suggestedDraft` absent-or-true, wikilinks resolve. Output: `corpus-fanout/review-<wave>-calibration.md` with per-entry verdict table, wave verdict GO / GO-WITH-EDITS / RECALIBRATE (+ binding "calibration feedback" block on recalibrate), and `drew-ack: pending`.
- **ACK**: Drew flips `drew-ack: pending` → `go` in the review manifest. Bulk tasks are blocked until the file says `go`.
- **Bulk**: parallel within the wave; 4–6 entries per task; SE tasks slice by source, interpretive tasks by theme; workers append handoff lines to `corpus-fanout/wave-<n>-manifest.md` and NEVER edit framework READMEs.
- **CLOSE**: regenerate the framework README coverage table from `npm run corpus:check` output; reconcile the wave manifest.

### Wave task tables

**W1 Charlotte Mason (+48)** — CAL: SE cm.021–023 (vol 2) + WE cm.007–008 + CI cm.006 (6 entries).
Bulk: W1-SE-2 (cm.024–026, vol 2 rest) · W1-SE-3 (cm.027–032, vol 3 *School Education*) · W1-SE-4 (cm.033–038, vol 4 *Ourselves*) · W1-SE-5 (cm.039–044, vol 5 *Formation of Character*) · W1-SE-6 (cm.045–050, vol 6 *A Philosophy of Education*) · W1-PP (cm.008 new + **audit memo on cm.001–007 vs the Interpretive-Patterns reframe — notes into the wave manifest, NO edits to confirmed entries**) · W1-CI (cm.007–008) · W1-WE-1 (cm.009–013, habits/attention/narration) · W1-WE-2 (cm.014–018, outdoor life/masterly inactivity/screens) · W1-WE-3 (cm.019–020, will/rewards/multi-child).

**W2 Montessori (+31; ids preserve original numbering — gaps deliberate)** — CAL: **the load-bearing lost entries** — PP montessori.003 (material misuse) + PP montessori.004 (gross-motor before fine-motor; both cited by surviving pt2 worked examples — verifier checks coherence with `montessori-004`/`montessori-006` WEs) + OM montessori.003 (sensitive-period defence) + SE montessori.001–003 (*The Montessori Method* 1912).
Bulk: W2-PP (montessori.001–002, .005–.008: work cycle, presentation, normalization, control-of-error themes) · W2-OM (montessori.001–002) · W2-SE-1 (montessori.004–013, Method 1912) · W2-SE-2 (montessori.014–020, Own Handbook 1914). Optional W2B: WE montessori.009–020 (3 batches) + CI montessori.007–008.

**W3 Classical (93, greenfield; short code `classical`)** — source order: Quintilian + Comenius first (most operationally pedagogical PD texts), then Plato/Aristotle, then Locke/Milton/Erasmus; Sayers trivium framing paraphrase-only. CAL: FV singleton + SE classical.001–003 (Quintilian) + PP .001 + OM .001 + CI .001 + WE .001 (8 entries).
Bulk: W3-SE-1..2 (.004–.015, Quintilian Books 1–2) · W3-SE-3..4 (.016–.025, Comenius *Great Didactic*) · W3-SE-5 (.026–.033, Plato *Republic* II–IV+VII) · W3-SE-6 (.034–.040, Aristotle *Politics* VII–VIII/*Ethics*) · W3-SE-7 (.041–.046, Locke) · W3-SE-8 (.047–.050, Milton/Erasmus/Newman) · W3-PP-1..2 (.002–.008, stage-aware readings of common situations) · W3-OM (.002–.006) · W3-CI-1..2 (.002–.008, incl. cross-tradition tensions) · W3-WE-1..4 (.002–.020, thematic). Interpretive batches soft-gate on their source's SE bulk (wikilinks must resolve).

**W4 Waldorf (93, greenfield; short code `waldorf`)** — CAL: FV singleton + SE waldorf.001–003 (1911 essay, verbatim OK) + PP .001 + OM .001 + **CI .001 = the Montessori mirror entry (imaginative play before 7)** + WE .001 (8 entries).
Bulk: W4-SE-1..5 (.004–.033, 1911 essay, verbatim) · W4-SE-6..9 (.034–.050, 1919 lecture cycles — **`isParaphrase: true` mandatory** unless the registered translation is upgraded) · W4-PP-1..2 (.002–.008, seven-year phases/rhythm/imitation/will-before-intellect) · W4-OM (.002–.006) · W4-CI-1..2 (.002–.008, early intellectualization/media/rushing literacy + mirror tensions) · W4-WE-1..4 (.002–.020).

**W5 Unschooling (+4, in-house-eligible ONLY)** — single task: OM us.006 + CI us.006–008 (adolescence→university transition; single-parent/both-working households; "unschooling out of laziness") from `unschooling-movement-consensus` + Gray & Riley CC BY. W5-VERIFY reviews all 4 (the wave is its own calibration). HARD GUARD: no unschooling SE/PP/WE/FV.

---

## Ops (Drew — after waves + review)

Architecture doc §5 sequence: Sanity stray-doc hygiene → `seed:pedagogy:corpus` → review via `corpus:review` / `corpus:confirm` → prod migration 0014 check → `VOYAGE_API_KEY` (paid tier recommended for the ~360-doc embed) → `seed:pedagogy:reembed` → `verify:pkb` + `verify:pkb:retrieval` → Sanity webhook config → `PEDAGOGY_KB_ENABLED=true` → watch `pedagogy_retrieval` logs + AI-cost dashboard for a week.

## Out of scope / decided against

No unschooling operational authoring (commissioned, PKB12/13). No `situationalTags` schema field until enrichment sends situational signals. No runtime/LLM changes (UC5). No CI wiring of E8. No changes to `buildChunkText`.
