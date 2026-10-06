# Review — Wave 2 calibration (Montessori pt1 rebuild, W2-CAL)

**Verifier:** orchestrator session, 2026-10-06 (separate from the drafting agent, per plan). **Handoff from the drafting session:** `handoff-montessori-calibration.md`.

Rubric applied per entry (plan "Wave mechanics → VERIFY"): (1) source fidelity; (2) licence-gate truthfulness (a lightly reworded quote marked paraphrase is a FAIL; a verbatim claim that cannot be stood behind is worse); (3) tag conventions; (4) tradition voice (practice patterns interpretive not prescriptive; worked-example scenarios in Logger voice; no cross-tradition bleed); (5) mechanical (`npm run corpus:check` clean, filename/id/range, `suggestedDraft` absent-or-true, wikilinks resolve).

Mechanical checks run by the orchestrator over the whole batch: compile 0 issues (125 documents); every entry `status: published` + `suggestedDraft: true`; every SE carries an explicit `isParaphrase`; no "you must / you should / you need to" inside any `## Response`; cross-tradition vocabulary appears only inside a stated `Tension with other traditions:` paragraph; all `[[wikilinks]]` resolve. All passed. Novel tags were registered in `tags.json` with the categories the authoring session proposed (soft warnings cleared).

The authoring session's own handoff (what it could not verify, what Drew should check) is preserved verbatim at the path named above; the per-entry verdicts here lean on it.

## Per-entry verdicts

| entry | id | layer | verdict | note |
|---|---|---|---|---|
| `montessori/observational-markers/montessori-001-spontaneous-repetition-work-cycle.md` | `montessori.001` | observational-markers | **pass** |  |
| `montessori/observational-markers/montessori-002-normalisation-signs.md` | `montessori.002` | observational-markers | **edit** | "Normalisation" is later vocabulary (post-1929). Description is grounded in 1912/1914 passages that describe the phenomenon; decide whether `markerName` keeps the later term. |
| `montessori/observational-markers/montessori-003-sensitive-period-defence.md` | `montessori.003` | observational-markers | **edit** | The order-insistence `## Look for` bullet and the sentence attributing exact-order insistence to Montessori's later writing rest on post-1929 (unregistered) material — delete that clause or register a source. Marker name uses later vocabulary ("sensitive period") with the 1912/1914 phrasing alongside; Drew to decide. |
| `montessori/practice-patterns/montessori-003-material-misuse.md` | `montessori.003` | practice-patterns | **pass** | Interpretive (the directress "would typically do"); every quoted phrase traced to the 1912/1914 texts by the drafting session; coheres with WE 006 and the FV micro-script. Long (~970 words) by design. |
| `montessori/practice-patterns/montessori-004-gross-motor-before-fine-motor.md` | `montessori.004` | practice-patterns | **pass** | Interpretive; coheres with WE 004/005. |
| `montessori/source-excerpts/montessori-001-discipline-through-liberty.md` | `montessori.001` | source-excerpts | **pass** |  |
| `montessori/source-excerpts/montessori-002-limit-of-liberty-teacher-as-observer.md` | `montessori.002` | source-excerpts | **pass** |  |
| `montessori/source-excerpts/montessori-003-auto-education-control-of-error.md` | `montessori.003` | source-excerpts | **pass** |  |
| `montessori/source-excerpts/montessori-004-handbook-motor-education-disorderly-movement.md` | `montessori.004` | source-excerpts | **pass** |  |
| `montessori/source-excerpts/montessori-005-handbook-cylinders-control-of-error-repetition.md` | `montessori.005` | source-excerpts | **pass** |  |
| `montessori/source-excerpts/montessori-006-handbook-freedom-wait-while-observing.md` | `montessori.006` | source-excerpts | **pass** |  |
| `montessori/source-excerpts/montessori-007-child-defends-his-work.md` | `montessori.007` | source-excerpts | **pass** | Beyond the brief (Ch XXI, 1912 American-edition addition — no Italian original). Keep: OM 003 is grounded in it. |
| `montessori/source-excerpts/montessori-008-handbook-moral-factors-eliminate-disorder.md` | `montessori.008` | source-excerpts | **pass** | Beyond the brief; grounds OM 002. Keep. |
| `montessori/source-excerpts/montessori-009-handbook-dressing-frames-defend-themselves.md` | `montessori.009` | source-excerpts | **pass** | Beyond the brief; grounds OM 003. Keep. |

**Source fidelity note.** All nine SEs are `isParaphrase: false`. The drafting session obtained PG #39863 and #29635 plain text via the GITenberg mirror (gutenberg.org itself is egress-blocked), extracted every block programmatically and machine-compared it back (whitespace / italics / dash normalisation only). Omissions are marked `[…]`. `pageOrChapter` cites the 1912/1914 contents-page section starts only — no deeper page numbers invented. This is the strongest-provenance batch of the four.

## Wave verdict: **GO-WITH-EDITS**

The two edits above (OM 002 / OM 003 naming and the order-insistence clause) are Drew's call, not blockers for bulk W2 drafting. W2-PP .003/.004 and W2-OM .001–.003 are now done in this batch; the remaining W2 bulk is W2-PP (.001–.002, .005–.008), W2-SE-1 (.010–.013, Method 1912) and W2-SE-2 (.014–.020, Handbook 1914), which may proceed once the ack line reads `go`.

## Calibration feedback for bulk prompts (binding)

- Keep the GITenberg-mirror + machine-compare procedure for every verbatim block; never retype.
- Use period vocabulary in `markerName` / `triggerTitle` unless Drew confirms the later terms; period names in verbatim text always.
- PP length: aim for the CM exemplar range (300–500 words) unless a surviving WE presupposes a longer reading.

drew-ack: pending
