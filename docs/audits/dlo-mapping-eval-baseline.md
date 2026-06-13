# DLO Mapping Eval — Baseline (pre-WS-3 descriptor injection)

**Run date:** 2026-06-12
**Model:** `claude-haiku-4-5-20251001`
**Prompt phase:** Baseline — system prompt shows only the `dlo.{thread}.{tier}` id pattern; **no descriptor text** in the prompt
**Golden set:** `scripts/data/dlo-golden-set.ts` (15 entries)
**Command:** `node scripts/eval-dlo-mapping.mjs --baseline`

> **⚠️ Drew's review requested (G3 gate):** Gold labels in the golden set are hand-authored by T3 against the descriptor text in `docs/hearth-capability-dlo-reference.md`. The tier-boundary calls (e.g. `developing` vs `demonstrating`) are editorial judgements — please review `scripts/data/dlo-golden-set.ts` and flag any labels you'd adjust before the post-WS-3 delta is taken at face value. Several of the post-WS-3 "regressions" are borderline boundary calls (see the post-WS-3 doc).

> **Hermetic harness note:** the `g5zhwbxg/production` Sanity dataset is pre-migration for the capability layer (0 `discreteLearningObjective` docs; `capabilityThread` docs are UUID-keyed without codes). The eval therefore sources descriptors from the in-repo fixture `scripts/data/dlo-descriptors.ts` (canonical text from the DLO reference) and primes the dlo-cache directly — no Sanity, no DB. `--baseline` primes the cache empty so no descriptor block is built, reproducing the pre-WS-3 prompt exactly. Production DLO seeding remains parked behind a human gate (plan task P-2/P-3).

> **🕒 Truth pass (annotated 2026-06-13 — plan task A4):** The production-state claim above — *"0 `discreteLearningObjective` docs; `capabilityThread` docs are UUID-keyed without codes"* — was **true at this eval's run-time** but is **stale now.** Production has since been seeded: **171 published DLO docs and 57 coded capability threads** (verified 2026-06-12). The original wording is left intact: it records the dataset state the hermetic harness was built around, and the eval result is unchanged either way — the harness deliberately never reads Sanity or the DB. Note that the *regulatory-mapping* seed (`scripts/seed-dlo-mappings.ts`, now plan task B3) is a separate step that **remains** parked behind a human gate.

---

## Aggregate results

| Metric | Value |
|---|---|
| **Precision (id)** | **0.422** |
| **Recall (id)** | **0.567** |
| **Tier agreement (on TP ids)** | **1.000** |
| Avg input tokens | 1,642 |
| Avg output tokens | 705 |
| Avg total tokens/entry | 2,347 |
| Total tokens (15 entries) | 35,208 |
| Errors | 0 / 15 |

*Macro-average. Precision and recall are computed over DLO id sets (not just thread ids). Tier agreement is computed only over true-positive ids (cases where both gold and predicted agree on the exact `dlo_id`). Because the tier is encoded in the id, a true-positive id is necessarily a tier match — so tier agreement reads 1.000 whenever any id matches; tier errors surface as id misses in precision/recall, not as tier disagreements.*

---

## Per-entry results

| Entry ID | P | R | Tier | in\_tok | out\_tok | Baseline prediction vs gold |
|---|---|---|---|---|---|---|
| gs-01-thin | 0.00 | 0.00 | N/A | 1,581 | 372 | FP: `dlo.M1.emerging`@0.72 on a <20-word entry; gold = none |
| gs-02-thin-multi | 1.00 | 1.00 | N/A | 1,594 | 173 | ✓ Correctly returned `[]` |
| gs-03-number-sense-emerging | 1.00 | 1.00 | 1.00 | 1,626 | 656 | ✓ M1+M2 emerging |
| gs-04-number-sense-developing | 0.00 | 0.00 | N/A | 1,636 | 777 | **Tier inflation**: `M1.demonstrating` (gold `developing`) + spurious M2 |
| gs-05-operations-demonstrating | 0.50 | 0.50 | 1.00 | 1,640 | 694 | M2.demonstrating ✓; missed M9; spurious M1.demonstrating |
| gs-06-reading-comp-developing | 0.00 | 0.00 | N/A | 1,648 | 848 | **Tier inflation**: `L3.demonstrating` (gold `developing`) + L7 spurious |
| gs-07-written-expression-demonstrating | 0.33 | 1.00 | 1.00 | 1,649 | 824 | L5.demonstrating ✓; 2 spurious (L7, EF7) drag precision |
| gs-08-oral-multi-child | 0.00 | 0.00 | N/A | 1,654 | 1,031 | **Tier inflation**: L1/L8 `demonstrating` (gold `developing`) + EF3 spurious |
| gs-09-scientific-inquiry-demonstrating | 0.50 | 1.00 | 1.00 | 1,656 | 662 | S1.demonstrating ✓; spurious EF7 |
| gs-10-historical-emerging | 1.00 | 1.00 | 1.00 | 1,645 | 646 | ✓ H1.emerging |
| gs-11-metacognition-demonstrating | 0.67 | 1.00 | 1.00 | 1,671 | 789 | EF7+M2 ✓; spurious EF5.demonstrating |
| gs-12-self-regulation-developing | 0.50 | 1.00 | 1.00 | 1,637 | 637 | PS3.developing ✓; spurious EF7.developing |
| gs-13-rich-multi-subject | 0.33 | 0.50 | 1.00 | 1,668 | 852 | H1.developing ✓; H2.demonstrating (gold `developing`); EF5 spurious |
| gs-14-with-activity-id | 0.50 | 0.50 | 1.00 | 1,652 | 720 | H3.developing ✓; S5.developing (gold `emerging`) |
| gs-15-critical-thinking | 0.00 | 0.00 | N/A | 1,669 | 901 | Missed both gold ids; H2/L8/EF5 instead |

---

## Failure-mode analysis

**1. Tier inflation (most common, most important)**
Haiku systematically over-promotes to `demonstrating` when the evidence supports `developing`. This is the defining failure of mapping without descriptor text — without a concrete behavioural standard for what `demonstrating` requires, the model defaults to the highest tier it can justify from surface reading. Entries 4, 6, 8, 13 all show this. Because tier is encoded in the id, each inflation registers as an id miss (precision **and** recall), which is why it dominates the aggregate.
*WS-3 target:* show Haiku the `developing` vs `demonstrating` descriptor text so it has a standard to check against.

**2. Precision drag from spurious extra IDs**
Entries 5, 7, 9, 11, 13: the gold id is present, but Haiku also adds 1–2 plausible-but-not-gold ids (often `EF5`/`EF7` metacognition tags on any reflective entry). This lowers precision without lowering recall.
*WS-3 target:* candidate-thread scoping bounds the expected id set, reducing hallucination into adjacent DLOs.

**3. Thin-entry false positive (entry 1)**
"Emma counted to 20" (<20 words) produced `dlo.M1.emerging`@0.72. The system prompt says "return [] when no DLO clearly applies"; the model fired anyway. (Arguably a gold-label question — a count-to-20 entry could justify `M1.emerging` at low confidence — Drew to review.)

---

## Run config

```
Command:    node scripts/eval-dlo-mapping.mjs --baseline
Model:      claude-haiku-4-5-20251001
Max tokens: 2048   (no truncation at this ceiling — entry 8 completes cleanly)
Delay:      400ms between calls
Entries:    15 (all)
Descriptors: NONE injected (baseline)
DB writes:  none · Sanity calls: none (cache primed empty)
```

---

## What WS-3 targets

The descriptor injection in WS-3 directly addresses failure modes 1 and 2 — see `dlo-mapping-eval-post-ws3.md` for the controlled before/after measured against this baseline (same harness, same 2048 ceiling, descriptors the only variable).

**Improvement targets going in:** P ≥ 0.55, R ≥ 0.60, tier agreement held, cost ≤ 3,500 tokens/entry.
