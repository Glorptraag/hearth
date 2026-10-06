# Review — Wave 5 (Unschooling in-house-eligible layers, W5-TASK)

**Verifier:** orchestrator session, 2026-10-06 (separate from the drafting agent, per plan). **Handoff from the drafting session:** `handoff-unschooling-calibration.md`.

**Hard guard verified:** no unschooling SE / PP / WE / FV file was created or edited (commissioned-author territory, PKB12/13). The batch is OM + CI only.

Rubric applied per entry (plan "Wave mechanics → VERIFY"): (1) source fidelity; (2) licence-gate truthfulness (a lightly reworded quote marked paraphrase is a FAIL; a verbatim claim that cannot be stood behind is worse); (3) tag conventions; (4) tradition voice (practice patterns interpretive not prescriptive; worked-example scenarios in Logger voice; no cross-tradition bleed); (5) mechanical (`npm run corpus:check` clean, filename/id/range, `suggestedDraft` absent-or-true, wikilinks resolve).

Mechanical checks run by the orchestrator over the whole batch: compile 0 issues (125 documents); every entry `status: published` + `suggestedDraft: true`; every SE carries an explicit `isParaphrase`; no "you must / you should / you need to" inside any `## Response`; cross-tradition vocabulary appears only inside a stated `Tension with other traditions:` paragraph; all `[[wikilinks]]` resolve. All passed. Novel tags were registered in `tags.json` with the categories the authoring session proposed (soft warnings cleared).

The authoring session's own handoff (what it could not verify, what Drew should check) is preserved verbatim at the path named above; the per-entry verdicts here lean on it.

## Per-entry verdicts

| entry | id | layer | verdict | note |
|---|---|---|---|---|
| `unschooling/contraindications/us-006-adolescence-to-university-transition.md` | `us.006` | contraindications | **edit** | Report II findings reported in Hearth's words with ranges, not percentages — correct posture. Verify: routes list + "little difficulty" characterisation; "uninterested classmates" as most frequent complaint; maths-gap attribution (Report I vs II). Llewellyn and Boles are name-checked only; register before closer use. Australian admissions detail is general and says so. |
| `unschooling/contraindications/us-007-working-households-without-redesign.md` | `us.007` | contraindications | **edit** | 2013 paper (CC BY-NC-ND) reported, not reproduced — correct. The in-text "(CC BY-NC-ND — cited here, not reproduced)" note surfaces to retrieval; move to `## Grounded in` (vault-only) unless Drew wants it visible. Verify the demographics claim and the challenge-category label. |
| `unschooling/contraindications/us-008-unschooling-out-of-laziness.md` | `us.008` | contraindications | **pass** | Strongest of the four. Report I disengagement finding matches `us-001`. `Tension with other traditions:` correctly records that CM's masterly inactivity and unschooling's trust AGREE here; `masterly_inactivity` reused deliberately as a stated comparison. |
| `unschooling/observational-markers/us-006-deliberate-resource-seeking.md` | `us.006` | observational-markers | **edit** | Grounded in Gray & Riley themes reported from memory (hosts egress-blocked). Soften or verify the "comfortable approaching lecturers" theme against Report II before flipping. |

**Source fidelity note.** Gray & Riley Report I / II and the 2013 paper were unreachable from the authoring session (hosts egress-blocked), so findings are reported from prior knowledge, hedged with ranges, and anchored to the vault's existing `us-001` SE (83% / 44% / 3 of 75). The specific claims to check against the PDFs are itemised per entry in the handoff.

## Wave verdict: **GO-WITH-EDITS**

With these four, the unschooling OM row reads 6/6 and the CI row 8/8 (README updated). No further in-house unschooling authoring is permitted; remaining layers await commissioned authors. Length note: the three CIs run ~900–1000 words, 3–4× the existing unschooling CIs — trim if the golden-query verifier (`npm run verify:pkb:retrieval`) later shows tighter chunks retrieve better.

## Calibration feedback for bulk prompts (binding)

- This wave is its own calibration; there is no bulk to unlock.
- Hard guard stands: no unschooling SE / PP / WE / FV authoring in-house.

drew-ack: pending
