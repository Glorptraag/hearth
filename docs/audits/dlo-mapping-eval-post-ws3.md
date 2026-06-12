# DLO Mapping Eval — Post-WS-3 (descriptor-grounded)

**Run date:** 2026-06-12
**Model:** `claude-haiku-4-5-20251001`
**Prompt phase:** Descriptor-grounded — candidate-thread DLO descriptors injected into the **user** prompt (system prompt byte-identical, still cache-controlled)
**Golden set:** `scripts/data/dlo-golden-set.ts` (15 entries)
**Command:** `node scripts/eval-dlo-mapping.mjs` (vs `--baseline` for the before)

This is a **controlled A/B**: both runs use the same harness, same golden set, same 2048-token ceiling, same 400 ms pacing, run back-to-back. The **only** variable is whether the `CANDIDATE DLO DESCRIPTORS` block is present in the user prompt. Descriptors are sourced from the in-repo fixture `scripts/data/dlo-descriptors.ts` (canonical text from `docs/hearth-capability-dlo-reference.md`) and primed into the dlo-cache — no Sanity, no DB. See the baseline doc for why (production is pre-migration for DLOs; seeding is parked behind a human gate).

> **⚠️ Gold labels need Drew's review (G3 gate).** The two regressions below are both `developing`-vs-`demonstrating` boundary calls on entries a reasonable reviewer could grade either way. Whether they are model errors or gold-label errors is exactly the editorial question for the gate. Review `scripts/data/dlo-golden-set.ts` before treating the delta as final.

---

## Before / after — aggregate

| Metric | Baseline | Descriptor-grounded | Δ |
|---|---|---|---|
| **Precision (id)** | 0.422 | **0.589** | **+0.167** (+40% rel.) |
| **Recall (id)** | 0.567 | **0.633** | **+0.066** (+12% rel.) |
| **Tier agreement (TP ids)** | 1.000 | 1.000 | held |
| Avg input tokens | 1,642 | 1,866 | +224 |
| Avg output tokens | 705 | 657 | −48 |
| **Avg total tokens/entry** | 2,347 | **2,523** | **+176** (+7.5%) |
| Total tokens (15) | 35,208 | 37,845 | +2,637 |
| Errors | 0 / 15 | 0 / 15 | — |

**Exit criteria (from the plan & baseline doc):**
- ✅ Golden-set mapping quality **improves** (P +40%, R +12%; 6 entries improved, 7 held, 2 regressed).
- ✅ Tier-id mismatch (WS-2 metric) **does not worsen** — tier agreement held at 1.000; the dominant tier-inflation failures that registered as id misses were partially corrected (gs-04).
- ✅ Cost delta **documented** and inside the ≤3,500 tok/entry guardrail (actual 2,523/entry; +176/entry for the descriptor block).
- ⚠️ P=0.589 clears the P≥0.55 target; R=0.633 clears R≥0.60. Both are still modest in absolute terms on a deliberately hard 15-entry set — this is a floor, not a ceiling.

---

## Per-entry before / after (P / R + total-token delta)

| Entry | Base P/R | Desc P/R | Outcome | Base tok | Desc tok | Δtok |
|---|---|---|---|---|---|---|
| gs-01-thin | 0.00 / 0.00 | **1.00 / 1.00** | ✅ win — dropped the spurious `M1.emerging` FP, returned `[]` | 1,953 | 1,859 | −94 |
| gs-02-thin-multi | 1.00 / 1.00 | 1.00 / 1.00 | held | 1,767 | 1,774 | +7 |
| gs-03-number-sense-emerging | 1.00 / 1.00 | 1.00 / 1.00 | held | 2,282 | 2,240 | −42 |
| gs-04-number-sense-developing | 0.00 / 0.00 | **1.00 / 1.00** | ✅ win — tier inflation fixed (`M1.demonstrating`→`M1.developing`) | 2,413 | 2,439 | +26 |
| gs-05-operations-demonstrating | 0.50 / 0.50 | 0.50 / 0.50 | held (still misses M9; swaps one spurious id for another) | 2,334 | 2,829 | +495 |
| gs-06-reading-comp-developing | 0.00 / 0.00 | 0.00 / 0.00 | held — L3 still inflated to `demonstrating` | 2,496 | 2,582 | +86 |
| gs-07-written-expression-demonstrating | 0.33 / 1.00 | **0.50 / 1.00** | ✅ win — shed one spurious id | 2,473 | 2,634 | +161 |
| gs-08-oral-multi-child | 0.00 / 0.00 | 0.00 / 0.00 | held — L1/L8 still inflated; shed 2 spurious ids | 2,685 | 2,476 | −209 |
| gs-09-scientific-inquiry-demonstrating | 0.50 / 1.00 | **1.00 / 1.00** | ✅ win — dropped spurious EF7 | 2,318 | 2,590 | +272 |
| gs-10-historical-emerging | 1.00 / 1.00 | 1.00 / 1.00 | held | 2,291 | 2,304 | +13 |
| gs-11-metacognition-demonstrating | 0.67 / 1.00 | **1.00 / 1.00** | ✅ win — dropped spurious EF5 | 2,460 | 2,884 | +424 |
| gs-12-self-regulation-developing | 0.50 / 1.00 | **0.00 / 0.00** | ⚠️ regression — `PS3.developing`→`PS3.demonstrating` (boundary call) | 2,274 | 2,536 | +262 |
| gs-13-rich-multi-subject | 0.33 / 0.50 | **0.00 / 0.00** | ⚠️ regression — `H1.developing`→`H1.demonstrating` (boundary call) | 2,520 | 2,777 | +257 |
| gs-14-with-activity-id | 0.50 / 0.50 | 0.50 / 0.50 | held — S5 tier still off by one band | 2,372 | 2,791 | +419 |
| gs-15-critical-thinking | 0.00 / 0.00 | **0.33 / 0.50** | ✅ win — surfaced the missed `L3.demonstrating` gold id | 2,570 | 3,130 | +560 |

---

## What changed, and why

**The mechanism is precision, via two routes:**

1. **Spurious-id suppression.** Bounding the model to a candidate set and showing it the descriptors stopped Haiku from tagging every reflective entry with `EF5`/`EF7` metacognition ids it couldn't ground (gs-07, gs-09, gs-11). This is the bulk of the +0.167 precision gain.
2. **Thin-entry restraint + one clean tier fix.** With the `emerging` descriptor visible, the model stopped firing on the <20-word entry (gs-01) and corrected the clearest tier inflation (gs-04: `M1.demonstrating`→`developing`).

**Recall rose modestly** because grounding surfaced a gold id the baseline missed entirely (gs-15 `L3.demonstrating`).

**The two regressions are honest and instructive.** gs-12 (Ruby self-regulating) and gs-13 (Oliver at the museum) both flipped a previously-correct `developing` id to `demonstrating`. In both, the child's behaviour sits on the developing/demonstrating seam — Ruby "started doing this fairly consistently"; Oliver (age 12) is doing genuine source analysis. Showing Haiku the richer `demonstrating` descriptor nudged it upward. Whether that is the model over-reading or the **gold label under-reading** is the precise editorial call WS-3 hands to Drew at G3. Net of these, descriptor grounding still improved 6 entries and held 7.

**Persistent failure (not yet solved):** tier inflation on `developing` reading/oral entries (gs-06, gs-08) survived descriptor injection. The descriptors help but do not eliminate the model's pull toward `demonstrating` on fluent-sounding prose. If the gate review confirms these gold labels, a targeted prompt note ("prefer the lower tier when the entry shows the capability only in a single familiar context") is the obvious next lever — tracked, not done here.

**Non-determinism caveat.** Haiku runs at default temperature; this is a single controlled pair, not a multi-seed average. The aggregate direction (precision via spurious-id suppression) is a systematic effect and reproduced the original 3.1 baseline closely (P 0.43→0.42 across runs), but individual borderline entries (gs-12/13) may land differently on a re-run. A multi-seed pass is cheap future work if the gate wants tighter confidence intervals.

---

## Cost budget (for the PR / AI-cost dashboard)

- Descriptor block adds **+224 input tokens/entry** (10 candidate threads × 3 descriptors, capped). Output fell **−48 tokens/entry** (rationale grounded in supplied text is more concise).
- **Net +176 tokens/entry (+7.5%)**, landing at **2,523 tokens/entry** — comfortably inside the ≤3,500/entry guardrail. Noisy-family thresholds unchanged.
- The descriptor block rides in the **user** prompt; the cache-controlled **system** prompt is byte-identical, so the prompt-cache hit rate is unaffected.

## Run config

```
Before:  node scripts/eval-dlo-mapping.mjs --baseline
After:   node scripts/eval-dlo-mapping.mjs
Model:   claude-haiku-4-5-20251001 · max_tokens 2048 · delay 400ms · 15 entries
DB writes: none · Sanity calls: none (dlo-cache primed from in-repo fixture)
Raw per-run JSON: docs/audits/_eval-dlo-run-{baseline,descriptor}.json (gitignored)
```
