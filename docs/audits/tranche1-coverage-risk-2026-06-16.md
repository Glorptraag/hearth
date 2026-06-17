# Tranche-1 Coverage-Risk Audit — `ac-v9-qld`

> **Date:** 2026-06-16 · **Author:** outcomes-spine Phase 2 (B4) · **Mode:** read-only prod audit, no writes
> **Personas served:** **Renee** (Tracker, QLD/HEU) + **Mei-Lin** (Consumer, the persona who makes regulator-language matter) · **Journey stage:** **Stage 4 — First compliance event** (`docs/hearth-parent-journey-v1.md` §4). At Stage 4 the report must feel *already written* and speak the parent's regulator's language (HEU). A coverage report that reads **zero** at exactly this moment is the worst-case failure for both personas.
> **Source plan:** `docs/hearth-outcomes-spine-plan-v1.md` · WS-5 transposer · plan task **B4-coverage-risk**.

---

## 🚩 VERIFY WITH DREW BEFORE THE NEXT HEU SUBMISSION (live, parent-facing)

**Two QLD-framework families are materially under-reporting *right now*.** Since B3 seeded the 51 `ac-v9-qld` DLO mappings into prod Sanity, `getDeterministicCoverage` returns `mode: 'deterministic'` for every `ac-v9-qld` family (`src/lib/report/coverage.ts:63-66`). For both families below, the deterministic rollup is **0.0 across every subject**, while the old LLM/fallback path showed real coverage. If either is a live pilot family and generates a Compliance Report now, it will **under-report to HEU**.

| Family | Learners | Resolved framework | Deterministic coverage now | Old LLM-path coverage (snapshot) | Failure class |
|---|---|---|---|---|---|
| **Fox-Lewer** | 4 (M, J, R, RY) | `ac-v9-qld` (state **blank** → defaulted) | **0% all subjects** | HPE ~10%, Arts ~10% | **A — mapping gap** (tranche-2 fixable) |
| **Barkley** | 2 (Morris, Genevieve) | `ac-v9-qld` (state **blank** → defaulted) | **0% all subjects** | Morris: English **15%**, Science 10%, HASS 5% | **B — status-bar gap** (NOT tranche-2 fixable) |

**Two caveats Drew must close before acting:**
1. **Are these live pilot families or test fixtures?** Both have recent activity (Barkley last entry 2026-06-14; Fox-Lewer 2026-06-06) and real enrichment, but the audit can't tell a real family from a seeded one. Confirm before relying on either way.
2. **Both have `state` = blank**, not an explicit "QLD". The code defaults blank/empty `state` → `ac-v9-qld` (`frameworkKeyForState`, `deterministic-coverage.ts:91-94`). So they were **silently** flipped into the QLD deterministic path. **13 of the 18 `ac-v9-qld` families reached that framework via the blank-state default, not an explicit choice** — see §2.

---

## 1. The 17 mapped threads (tranche 1, `ac-v9-qld`)

Derived from the `dlo.{THREAD}.{tier}` ids in `scripts/data/dlo-regulatory-mappings.ts` (51 DLOs = 17 threads × 3 tiers). **Verified in prod Sanity: 51 `discreteLearningObjective` docs carry an `ac-v9-qld` mapping** (GROQ count, 2026-06-16). B3 landed.

| Domain → AC9 learning area | Threads (mapped) |
|---|---|
| English (`AC9E`) | **L1** Oral Communication · **L3** Reading Comprehension · **L5** Written Expression · **L7** Text Structure & Purpose · **L8** Persuasion & Argument · **L9** Literary Appreciation |
| English – Literature (`AC9E`) | **C1** Narrative & Storytelling *(seeded descriptor; see file caveat 3)* |
| Mathematics (`AC9M`) | **M1** Number Sense · **M2** Operations · **M5** Measurement · **M9** Mathematical Modelling |
| Science (`AC9S`) | **S1** Scientific Inquiry · **S5** Scientific Observation |
| HASS (`AC9HS`) | **H1** Historical Understanding · **H2** Source Analysis · **H3** Geographical Understanding |
| HPE (`AC9HP`) | **PS3** Self-Regulation |

**Deliberately excluded in tranche 1** (per the seed-file header): **EF5** Critical Thinking and **EF7** Metacognition — AC9 *general capabilities* with no learning-area content descriptor. This exclusion principle is central to the tranche-2 ranking below.

---

## 2. Who is affected

`frameworkKeyForState(state)` resolves a family's framework as `ac-v9-{state}`, **defaulting blank/missing `state` → QLD**. So the population now in deterministic mode is larger than the explicitly-QLD set:

| `family_settings.state` | Families | Framework | Affected by B3? |
|---|---|---|---|
| `QLD` | 5 | `ac-v9-qld` | **yes** |
| blank / empty | 11 | `ac-v9-qld` (default) | **yes** |
| *(no settings row)* | 2 | `ac-v9-qld` (default) | **yes** |
| WA / VIC / NSW / TAS | 9 | `ac-v9-{state}` | no — fallback (no mappings) |

**18 of 27 families are on `ac-v9-qld`** and therefore in deterministic mode. Of those 18, only **2 have any DLO evidence** (the rest are empty/test). Both of those 2 are materially under-reporting (§3).

---

## 3. Per-family: mapped vs unmapped evidence

"Counting evidence" = a `learner_dlo_status` row at `developing` or `demonstrating` — the *only* thing the deterministic rollup scores (`deterministic-coverage.ts:99-102`; `demonstrating`=1.0, `developing`=0.5, all else 0). Across all 27 families, **only 4 have any counting evidence**, and only the 2 `ac-v9-qld` ones are affected by B3:

| Family | Framework | Counting DLO rows | On **mapped** threads | On **UNMAPPED** threads | Flag |
|---|---|---|---|---|---|
| **Fox-Lewer** | `ac-v9-qld` ✅affected | 11 | **0** | **4 threads**: `P1`✦demo, `PS2`dev, `EF1`✦demo, `EF7`dev | 🚩 **material** |
| **Barkley** | `ac-v9-qld` ✅affected | 1 (status) | 0 | `EF1` dev | 🚩 **material** (see class B) |
| Par Fam | `ac-v9-nsw` (fallback) | 7 | 0 | C2, EF3, EF5, EF6✦, EF7, PS2✦ | not affected (NSW unmapped) |
| Jacobson | `ac-v9-tas` (fallback) | 3 | 1 (`PS3`✦) | EF1✦, PS2✦ | not affected (TAS unmapped) |

✦ = at `demonstrating`. **No `ac-v9-qld` family has any counting evidence on a mapped thread.** Tranche 1's 17 threads (drawn from the WS-3 golden set ∪ Starter Pack) simply miss where the actual prod pilot evidence has accumulated.

### Two distinct failure modes

- **Class A — mapping gap (tranche-2 fixable).** Evidence *reached* `developing`/`demonstrating` but on a thread tranche 1 didn't map. → **Fox-Lewer**: `P1` (Gross Motor) is at **demonstrating for 3 of 4 children**, `PS2` (Social Skills) at developing — both **HPE**, both mappable to `AC9HP…` codes in tranche 2. Mapping them turns Fox-Lewer's HPE from 0 → non-zero.
- **Class B — status-bar gap (NOT tranche-2 fixable).** The old LLM path scored coverage from *entry presence* (`coverage_percentage` ∝ `total_entries`); the deterministic path only scores `developing`/`demonstrating` DLO **status**. **Barkley** logged on threads that *are already mapped* — Haiku enrichment detected `L3`, `L9`, `H1`, `H3` and codes `AC9HH1K05`, `AC9HH3K04`, giving Morris **English 15% / Science 10% / HASS 5%** under the LLM path — but none reached `developing` status, so deterministic scores them **0**. **More mappings will not fix Barkley.** This is the deterministic-vs-LLM philosophy change biting: deterministic coverage is intrinsically more conservative, and *every* QLD family whose evidence sits below the developing-tier bar will see coverage fall, regardless of mapping completeness.

> **Implication:** tranche 2 addresses Class A only. Class B is a **product decision** (the count-based-vs-status-gated bar — D-OS4 / the C-series tier-derivation work) and is the larger systemic under-reporting driver. Flagged as a sidebar in §6.

---

## 4. End-to-end cross-check — Fox-Lewer

Confirms the deterministic path is provably lower than the LLM path for a real family.

- **Resolved framework:** `state` blank → `ac-v9-qld` → `mode: 'deterministic'` (B3 mappings present).
- **Rollup input:** 19 `learner_dlo_status` rows; 11 at developing/demonstrating; **0 of 11 on a mapped thread**. Counting DLOs are all `EF1`/`P1`/`PS2`/`EF7`. → `rollupCoverage` yields **weightedScore 0.0 for every subject** → the Compliance Report shows **zero curriculum coverage**.
- **Old LLM/fallback path (`snapshot.children[].curriculum_coverage`):** HPE ~10% and Arts ~10% per child; entry enrichment detected real AC9 codes **`AC9HP1K01`, `AC9HP3K01`, `AC9M5N01`, `AC9S5N03`** and capability threads incl. `M5`, `S5`, `C1`, `P1`, `PS2`.
- **Verdict:** deterministic coverage is **strictly lower** (0% vs 5–10% in HPE/Arts). Concretely, **three children at *demonstrating* gross motor (`P1`) show 0% HPE** — the clearest "this should count and doesn't" case, and exactly why `P1`+`PS2` lead the tranche-2 list.

---

## 5. Tranche-2 ranked priority

Unmapped threads ranked by **QLD pilot evidence** (counting `learner_dlo_status` weighted `demonstrating`×2 + `developing`×1, then `observation_dlo_links` corroboration). **Eligibility matters:** a thread that is an AC9 *general capability* cannot receive a learning-area code (same exclusion as EF5/EF7) — those are split out below, not ranked for AC9 codes.

### 5a. Learning-area eligible — get AC9 codes next (in order)

| # | Thread | → AC9 learning area | QLD counting evidence | QLD obs-links (learners) | Why this rank |
|---|---|---|---|---|---|
| **1** | **P1** Gross Motor | HPE Movement (`AC9HP…M`) | **3× demonstrating** (Fox-Lewer) | 3 (3) | Highest-tier QLD evidence; full-weight; **immediately repairs Fox-Lewer HPE 0→non-zero**. |
| **2** | **PS2** Social Skills | HPE Personal/Social (`AC9HP…P`) | 3× developing (Fox-Lewer) | 7 (4) | Broadest base — most QLD obs-links of any eligible thread + cross-state demo (NSW, TAS). |
| 3 | **C2** Music | The Arts (`AC9A`) | — | 1 (1) + NSW demo | Real demonstrating signal (NSW), QLD corroboration. |
| 4 | **C6** Design & Construction | Technologies (`AC9TD`) | — | 0 (cross-state: 6 links) | Strong pilot-wide signal; no QLD counting evidence yet. |
| 5 | **P2** Fine Motor | HPE Movement (`AC9HP…M`) | — | 0 (4 links, cross-state) | Pairs with P1; completes HPE Movement. |
| 6 | **L2** Phonological Awareness | English (`AC9E`) | — | 1 (1) | Early-literacy; fills an English gap below L3. |
| 7 | **M4** Algebraic Thinking | Mathematics (`AC9M`) | — | 2 links | Completes the Maths spine alongside M1/M2/M5/M9. |
| 8 | **S2 / S3 / S4** Bio / Chem / Physical Sciences | Science (`AC9S`) | — | 1–2 links each | Science content strands beyond inquiry (S1/S5). |
| 9 | **PS1** Empathy · **PS5** Responsibility · **PS6** Resilience · **EF6** Collaboration | HPE Personal/Social (`AC9HP…P`) | — | 1–2 links each | Round out HPE personal/social with PS3. |
| 10 | **L6** Spelling & Grammar · **M6** Spatial Reasoning | English / Maths | — | 1 link each | Long tail. |

> **Top recommendation:** map **P1 + PS2 together** (the "HPE pair"). They are the same subject and the same family (Fox-Lewer), and together they convert the single clearest live under-report from 0% to a credible HPE figure.

### 5b. NOT tranche-2 eligible — general-capability cluster (escalate separately)

These carry the **most raw pilot evidence in the entire dataset**, but are AC9 *general capabilities* with no learning-area content descriptor — the same structural reason EF5/EF7 were excluded from tranche 1. **No volume of learning-area mapping will let them contribute to AC9 coverage.**

| Thread | QLD obs-links (learners) | Counting | Note |
|---|---|---|---|
| **EF1** Sustained Attention | **8 (5)**, 7× demonstrating | demo×4 + dev×1 (QLD) | The single highest-volume unmapped thread; **drives most of Fox-Lewer's & Barkley's "evidence."** GC — needs the GC-continuum scheme. |
| **EF7** Metacognition | 7 (5) | dev (QLD) | Already excluded by design (tranche 1). |
| **EF5** Critical Thinking | 2 (2) | — (QLD) | Already excluded by design. |
| **EF3** Cognitive Flexibility · **EF4** Planning & Organisation | cross-state | — | Same GC class. |

---

## 6. Recommendations

1. **🚩 Live:** Have Drew confirm whether **Fox-Lewer** and **Barkley** are real pilot families. If either is and is near an HEU submission, **do not let a deterministic (0%) Compliance Report go out** until at least the HPE pair (P1+PS2) is mapped (Fox-Lewer) and/or the Class-B status-bar question is resolved (Barkley).
2. **Tranche 2, first cut:** map **P1 + PS2** (HPE), then **C2, C6, P2, L2, M4, S2/S3/S4** (§5a). Follow the B2/B3 pattern: verify codes against ACARA v9, lint against `AC9_CODE_PATTERN`, PR for review, then a gated prod seed avoiding mid-HEU-submission weeks.
3. **[SIDEBAR — Drew + Opus] General-capability transposer.** The highest-volume pilot evidence (EF1 especially) sits on executive-function GCs that the learning-area transposer *structurally cannot represent*. Decide: build the GC-continuum mapping scheme (distinct framework, out of `AC9_CODE_PATTERN` scope, as the seed-file header anticipates) or formally accept that EF threads never contribute to AC9 coverage and surface them elsewhere (Constellation only).
4. **[SIDEBAR — Drew + Opus] Class-B status-bar gap.** Deterministic coverage is strictly more conservative than the old entry-count LLM coverage. Even a complete 57-thread tranche won't stop a family like Barkley (logged on mapped threads, never promoted to `developing`) from dropping to 0%. Resolve the D-OS4 / C-series tier-derivation bar **before** QLD families rely on deterministic reports — otherwise the WS-5 "same report tomorrow" promise is honoured at the cost of a one-time coverage cliff.
5. **Blank-state default.** 13 of 18 affected families reached `ac-v9-qld` via the blank-`state` default, not an explicit choice. Consider (a) prompting for state before a first Compliance Report, or (b) requiring an explicit framework before flipping a family deterministic — so no family is silently zeroed.

---

### Method note (reproducibility)

Read-only against prod Neon (`neondb`, `ep-red-hat-a76y1fdq…ap-southeast-2`) and prod Sanity (`g5zhwbxg/production`), 2026-06-16. Evidence = `learner_dlo_status` (status `developing`/`demonstrating`) and `observation_dlo_links` (`evidence_state='observed'`), joined to `families`/`family_settings` for jurisdiction; framework resolved with `frameworkKeyForState`; thread parsed from `dlo_id` = `dlo.{thread}.{tier}`. LLM-path comparison from `family_intelligence_snapshots.snapshot_data.children[].curriculum_coverage` and `learning_entries.ai_enrichment`. No rows were written.
