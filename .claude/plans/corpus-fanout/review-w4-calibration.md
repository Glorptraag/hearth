# Review — Wave 4 calibration (Waldorf / Steiner, greenfield, W4-CAL)

**Verifier:** orchestrator session, 2026-10-06 (separate from the drafting agent, per plan). **Handoff from the drafting session:** `handoff-waldorf-steiner-calibration.md`.

Rubric applied per entry (plan "Wave mechanics → VERIFY"): (1) source fidelity; (2) licence-gate truthfulness (a lightly reworded quote marked paraphrase is a FAIL; a verbatim claim that cannot be stood behind is worse); (3) tag conventions; (4) tradition voice (practice patterns interpretive not prescriptive; worked-example scenarios in Logger voice; no cross-tradition bleed); (5) mechanical (`npm run corpus:check` clean, filename/id/range, `suggestedDraft` absent-or-true, wikilinks resolve).

Mechanical checks run by the orchestrator over the whole batch: compile 0 issues (125 documents); every entry `status: published` + `suggestedDraft: true`; every SE carries an explicit `isParaphrase`; no "you must / you should / you need to" inside any `## Response`; cross-tradition vocabulary appears only inside a stated `Tension with other traditions:` paragraph; all `[[wikilinks]]` resolve. All passed. Novel tags were registered in `tags.json` with the categories the authoring session proposed (soft warnings cleared).

The authoring session's own handoff (what it could not verify, what Drew should check) is preserved verbatim at the path named above; the per-entry verdicts here lean on it.

## Per-entry verdicts

| entry | id | layer | verdict | note |
|---|---|---|---|---|
| `waldorf-steiner/contraindications/waldorf-001-early-intellectualisation.md` | `waldorf.001` | contraindications | **pass** | The Montessori mirror entry; Montessori terms appear only inside the stated comparison; `montessori_tension` present. |
| `waldorf-steiner/facilitation-vocabulary/waldorf.md` | `waldorf` | facilitation-vocabulary | **pass** | Voice anchor: rhythm, imitation, picture-before-concept, will-before-intellect, warmth, protective holding-back. No Montessori / CM vocabulary. |
| `waldorf-steiner/observational-markers/waldorf-001-imitation-of-adult-work.md` | `waldorf.001` | observational-markers | **pass** |  |
| `waldorf-steiner/practice-patterns/waldorf-001-five-year-old-asks-to-read.md` | `waldorf.001` | practice-patterns | **pass** | Interpretive (reads the request as imitation / belonging; warm non-refusal). `ageRange: 4-7`, `[L2, L7]`. |
| `waldorf-steiner/source-excerpts/waldorf-001-three-births-change-of-teeth.md` | `waldorf.001` | source-excerpts | **pass** | Paraphrase of a public-domain source (1911 Rajput text was egress-blocked). `## Context` names the "births" passage as the verbatim-upgrade candidate — one check against PG #55586. |
| `waldorf-steiner/source-excerpts/waldorf-002-imitation-and-example.md` | `waldorf.002` | source-excerpts | **pass** | Paraphrase; the "two magic words" sentence and napkin-doll passage are upgrade candidates. The limping-parent illustration was deliberately omitted (unconfirmed in the 1911 text). |
| `waldorf-steiner/source-excerpts/waldorf-003-authority-picture-memory.md` | `waldorf.003` | source-excerpts | **pass** | Paraphrase; the "teacher must believe the picture" sentence is an upgrade candidate. |
| `waldorf-steiner/source-excerpts/waldorf-004-writing-before-reading-from-drawing.md` | `waldorf.004` | source-excerpts | **edit** | `isParaphrase: true` is mandatory (1919 cycle, `allowVerbatim: false`) — correct. Lecture numbering (Lecture 1 / Lectures 4–5) is medium confidence; verify before any citation is parent-visible. |
| `waldorf-steiner/source-excerpts/waldorf-005-educators-inner-attitude.md` | `waldorf.005` | source-excerpts | **edit** | Paraphrase, mandatory. Verify "Lecture 1, 21 August 1919" against the Foundations edition. |
| `waldorf-steiner/worked-examples/waldorf-001-farmer-with-barrow.md` | `waldorf.001` | worked-examples | **pass** | Logger voice, QLD texture. `activityType: imitative_play` passes the regex; no canonical activityType list exists yet — consider `free_play` for cross-framework consistency. |

**Source fidelity note.** All five SEs are paraphrases although the 1911 text is public domain — the drafting session could not reach PG #55586 and declined to assert 1911 wording from memory of other translations. Substance confidence high; upgrading to verbatim is a one-step check per SE.

## Wave verdict: **GO-WITH-EDITS**

Nothing blocks bulk drafting. Open vocabulary item for Drew: an `under_seven` age-band tag would be cleaner than `under_six` + `age_5_to_7` for the change-of-teeth threshold.

## Calibration feedback for bulk prompts (binding)

- 1911 essay: `pageOrChapter` is positional (no chapter divisions) — keep describing the section; never invent pages.
- 1919 cycles: `isParaphrase: true` always; cite lecture number + date and say "verify" in `## Context` when numbering is from memory.
- Carry the Montessori mirror discipline: other traditions' terms only inside `Tension with other traditions:`.
- Next-pass candidates named by the drafting session: PP "the day has lost its rhythm", OM "readiness at the change of teeth", a southern-hemisphere festival-year entry.

drew-ack: pending
