# Review — Wave 3 calibration (Classical, greenfield, W3-CAL)

**Verifier:** orchestrator session, 2026-10-06 (separate from the drafting agent, per plan). **Handoff from the drafting session:** `handoff-classical-calibration.md`.

Rubric applied per entry (plan "Wave mechanics → VERIFY"): (1) source fidelity; (2) licence-gate truthfulness (a lightly reworded quote marked paraphrase is a FAIL; a verbatim claim that cannot be stood behind is worse); (3) tag conventions; (4) tradition voice (practice patterns interpretive not prescriptive; worked-example scenarios in Logger voice; no cross-tradition bleed); (5) mechanical (`npm run corpus:check` clean, filename/id/range, `suggestedDraft` absent-or-true, wikilinks resolve).

Mechanical checks run by the orchestrator over the whole batch: compile 0 issues (125 documents); every entry `status: published` + `suggestedDraft: true`; every SE carries an explicit `isParaphrase`; no "you must / you should / you need to" inside any `## Response`; cross-tradition vocabulary appears only inside a stated `Tension with other traditions:` paragraph; all `[[wikilinks]]` resolve. All passed. Novel tags were registered in `tags.json` with the categories the authoring session proposed (soft warnings cleared).

The authoring session's own handoff (what it could not verify, what Drew should check) is preserved verbatim at the path named above; the per-entry verdicts here lean on it.

## Per-entry verdicts

| entry | id | layer | verdict | note |
|---|---|---|---|---|
| `classical/contraindications/classical-001-abstract-analysis-grammar-stage.md` | `classical.001` | contraindications | **pass** | `Tension with other traditions:` covers unschooling and Charlotte Mason fairly; `charlotte_mason_tension` registered. |
| `classical/facilitation-vocabulary/classical.md` | `classical` | facilitation-vocabulary | **pass** | Voice anchor. Sayers' stage framing paraphrased and attributed each time; `## Restraints` uses the `- **Term** — description` form (CM exemplar uses plain sentences) — house-style choice for Drew, both compile. |
| `classical/observational-markers/classical-001-readiness-for-logic-stage.md` | `classical.001` | observational-markers | **pass** |  |
| `classical/practice-patterns/classical-001-child-resists-memory-work.md` | `classical.001` | practice-patterns | **pass** |  |
| `classical/source-excerpts/classical-001-quintilian-begin-early-make-it-play.md` | `classical.001` | source-excerpts | **pass** | Honest paraphrase; confirmed Watson fragments listed in `## Context` as verbatim-upgrade candidates (I.1.20). |
| `classical/source-excerpts/classical-002-quintilian-memory-and-imitation.md` | `classical.002` | source-excerpts | **edit** | Verbatim (Watson, Inst. Or. I.3.1–2). Two wording doubts to check against the Bohn 1856 scan: "of which the excellence is twofold" vs "the excellence of which is twofold"; comma vs colon after "provision". Correct in place; do not downgrade to paraphrase. |
| `classical/source-excerpts/classical-003-quintilian-rest-play-no-rod.md` | `classical.003` | source-excerpts | **pass** | Honest paraphrase; I.3.14 named as a verbatim-upgrade candidate. |
| `classical/source-excerpts/classical-004-comenius-no-leaps.md` | `classical.004` | source-excerpts | **edit** | Verbatim (Keatinge, Great Didactic XVI, two principle headings). Confirm these are Ch XVI's 6th/7th principles, not Ch XVII's parallel list. |
| `classical/source-excerpts/classical-005-comenius-senses-first.md` | `classical.005` | source-excerpts | **pass** | Paraphrase; the "golden rule" sentence (Ch XX) is the natural verbatim upgrade. |
| `classical/worked-examples/classical-001-clancy-recitation-argument.md` | `classical.001` | worked-examples | **pass** | Logger voice, Australian (Paterson, Nan on the phone); poem named, not quoted. |

**Source fidelity note.** Every registered text host was egress-blocked; wording was checked by exact-phrase web-search hits on pages hosting Watson / Keatinge, not by reading the scans. Hence 3/5 SEs are paraphrases and the two verbatim SEs are short. Confidence on the paraphrased content is high.

## Wave verdict: **GO-WITH-EDITS**

Two verbatim wording checks before `suggestedDraft` flips; nothing blocks bulk drafting. Suggest Drew make the "trivium-as-stages is Sayers 1947, not the ancient trivium" point explicit in the FV for Eclectic families.

## Calibration feedback for bulk prompts (binding)

- Until a readable scan is available in-session, SE bulk should default to `isParaphrase: true` and record confirmed fragments in `## Context`; cut verbatim SEs in a later upgrade pass from the scan.
- Keep Sayers paraphrase-only and attributed; never set `source: sayers-lost-tools-1947` on an SE.
- Prefer existing tags (`memory_exercise`, `timing`, `appropriate_challenge`) over coining; the 15 tags coined here are now registered.

drew-ack: pending
