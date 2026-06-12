# DLO Mapping Eval — Baseline (pre-WS-3 descriptor injection)

**Run date:** 2026-06-12  
**Model:** `claude-haiku-4-5-20251001`  
**Prompt phase:** Baseline — system prompt shows only `dlo.{thread}.{tier}` id pattern; no descriptor text  
**Golden set:** `scripts/data/dlo-golden-set.ts` (15 entries)  
**Script:** `node scripts/eval-dlo-mapping.mjs`

> **⚠️ Drew's review requested:** Gold labels in the golden set are hand-authored by T3 against the descriptor text in `docs/hearth-capability-dlo-reference.md`. The tier boundary calls (e.g. `developing` vs `demonstrating`) are editorial judgements — please review `scripts/data/dlo-golden-set.ts` and flag any labels you'd adjust before the post-WS-3 delta is taken at face value. G3 gate.

---

## Aggregate results

| Metric | Value |
|---|---|
| **Precision (id)** | **0.433** |
| **Recall (id)** | **0.567** |
| **Tier agreement (on TP ids)** | **1.000** |
| Avg input tokens | 1,642 |
| Avg output tokens | 694 |
| Avg total tokens/entry | 2,336 |
| Total tokens (15 entries) | 35,031 |
| Errors | 1 / 15 |

*Macro-average. Precision and recall are computed over DLO id sets (not just thread ids). Tier agreement is computed only over true-positive ids (cases where both gold and predicted agree on the exact dlo_id).*

---

## Per-entry results

| Entry ID | P | R | Tier | in\_tok | out\_tok | Notes |
|---|---|---|---|---|---|---|
| gs-01-thin | 0.00 | 0.00 | N/A | 1,581 | 360 | FP: Haiku mapped `dlo.M1.emerging` despite < 20 words |
| gs-02-thin-multi | 1.00 | 1.00 | N/A | 1,594 | 178 | ✓ Correctly returned [] for ultra-thin entry |
| gs-03-number-sense-emerging | 1.00 | 1.00 | 1.00 | 1,626 | 572 | ✓ Both gold IDs matched at correct tiers |
| gs-04-number-sense-developing | 0.00 | 0.00 | N/A | 1,636 | 714 | **Tier inflation**: `dlo.M1.demonstrating` predicted; gold=`dlo.M1.developing` |
| gs-05-operations-demonstrating | 0.50 | 0.50 | 1.00 | 1,640 | 656 | Missed M9; hit M2 correctly |
| gs-06-reading-comp-developing | 0.00 | 0.00 | N/A | 1,648 | 916 | **Tier inflation**: predicted `dlo.L3.demonstrating`; gold=`dlo.L3.developing` |
| gs-07-written-expression-demonstrating | 0.33 | 1.00 | 1.00 | 1,649 | 886 | Gold ID hit; 2 extra spurious IDs (precision drag) |
| gs-08-oral-multi-child | 0.00 | 0.00 | N/A | 1,654 | 1,024 | **Error**: JSON truncated — max\_tokens=1024 hit on rich multi-child entry |
| gs-09-scientific-inquiry-demonstrating | 1.00 | 1.00 | 1.00 | 1,656 | 630 | ✓ |
| gs-10-historical-emerging | 0.50 | 1.00 | 1.00 | 1,645 | 758 | Gold H1.emerging hit; extra H2.emerging (plausible FP) |
| gs-11-metacognition-demonstrating | 1.00 | 1.00 | 1.00 | 1,671 | 760 | ✓ |
| gs-12-self-regulation-developing | 0.50 | 1.00 | 1.00 | 1,637 | 657 | Gold PS3.developing hit; extra EF7.developing (plausible) |
| gs-13-rich-multi-subject | 0.00 | 0.00 | N/A | 1,668 | 793 | **Tier inflation**: predicted H1/H2.demonstrating; gold=developing |
| gs-14-with-activity-id | 0.33 | 0.50 | 1.00 | 1,652 | 765 | H3.developing correct; S5.developing vs gold S5.emerging (tier miss in ID space); spurious EF7 |
| gs-15-critical-thinking | 0.33 | 0.50 | 1.00 | 1,669 | 736 | L3.demonstrating correct; EF5.demonstrating vs gold EF5.developing |

---

## Failure mode analysis

**1. Tier inflation (most common, most important)**  
Haiku systematically over-promotes to `demonstrating` when evidence supports `developing`. This is the defining failure of mapping without descriptor text — without knowing what `demonstrating` actually requires, the model defaults to the highest tier it can justify from surface reading. Entries 4, 6, 13, 14, 15 all show this pattern.  
*Expected fix:* WS-3 descriptor injection — showing Haiku the actual descriptor text gives it a standard to check against.

**2. Precision drag from spurious extra IDs**  
Entries 7, 10, 12: the gold ID is correctly included, but Haiku also adds 1–2 plausible-but-not-gold IDs. This lowers precision without lowering recall. Some of these (e.g. EF7 on entries with clear metacognitive activity) may be labelling errors in the gold set rather than model errors — Drew to review.

**3. Max-tokens truncation (entry 8)**  
The multi-child oral entry generated 1,024 output tokens, truncating the JSON. In production `validateDlos` would handle the malformed JSON gracefully (it would return []). The eval script should use `max_tokens: 2048` in subsequent runs to avoid this. Eval note: this entry's result is excluded from tier aggregate.

**4. Thin-entry FP (entry 1)**  
"Emma counted to 20" (< 20 words) produced `dlo.M1.emerging` at confidence ≥ 0.4. The system prompt says "return minimal mappings with low confidence" for thin entries — the model interpreted "minimal" as "one mapping" rather than "none". Gold=none. This may also be a gold-label question: a count-to-20 entry arguably does justify `dlo.M1.emerging` at low confidence.

---

## Run config

```
Script:     node scripts/eval-dlo-mapping.mjs
Model:      claude-haiku-4-5-20251001  
Max tokens: 1024 (note: too low for entry 8; post-WS-3 run uses 2048)
Delay:      500ms between calls
Entries:    15 (all)
DB writes:  none
```

---

## What WS-3 targets

The descriptor injection in WS-3 directly addresses failure modes 1 and 2:

- **Tier inflation**: Seeing the `developing` vs `demonstrating` descriptor text gives the model a concrete behavioural standard to compare against. "Independent fluency across contexts" (demonstrating) is visibly different from "reliably present in familiar contexts" (developing).
- **Spurious IDs**: Candidate-thread scoping (active threads ∪ declared-from-activities) gives the model a bounded set of expected IDs, reducing hallucination into adjacent DLOs.

**Expected improvement target:** P ≥ 0.55, R ≥ 0.65, tier agreement ≥ 0.90 (currently 1.00 but on a very small TP set).  
**Cost target:** ≤ 3,500 tokens/entry (baseline: ~2,336). Descriptor injection adds ~800–1,200 tokens/entry depending on candidate thread count.
