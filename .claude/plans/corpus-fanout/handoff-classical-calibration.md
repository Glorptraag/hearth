# Classical calibration batch (W3-CAL) — handoff

Greenfield framework: no prior `classical/` entries existed, so all six layer directories were created here. 10 entries: 1 FV, 5 SE, 1 PP, 1 OM, 1 CI, 1 WE. Every entry carries `status: published` and an explicit `suggestedDraft: true`.

## 1. Entry table

| filename | id | layer | source (SE only) | verbatim / paraphrase (SE only) | confidence in source fidelity | novel tags proposed |
|---|---|---|---|---|---|---|
| facilitation-vocabulary/classical.md | classical | FV | — | — | high (tradition facts; Sayers framing paraphrased and attributed, Quintilian / Comenius / Erasmus named without quotation) | — (FV takes no tags) |
| source-excerpts/classical-001-quintilian-begin-early-make-it-play.md | classical.001 | SE | quintilian-institutio-oratoria | paraphrase | high on content; exact Watson wording unverified (see §2) | play_as_learning, emulation |
| source-excerpts/classical-002-quintilian-memory-and-imitation.md | classical.002 | SE | quintilian-institutio-oratoria | **verbatim** | medium-high — every word believed Watson's; one clause-order and one punctuation doubt flagged in `## Context` | imitation |
| source-excerpts/classical-003-quintilian-rest-play-no-rod.md | classical.003 | SE | quintilian-institutio-oratoria | paraphrase | high on content; three Watson phrases confirmed, surrounding clauses not, hence paraphrase | anti_corporal_punishment, play_as_learning |
| source-excerpts/classical-004-comenius-no-leaps.md | classical.004 | SE | comenius-great-didactic-1896 | **verbatim** (two principle headings only) | high on wording (both headings confirmed word-for-word via a reprint of Keatinge's list); medium on the ordinal numbering (sixth / seventh) | sequence |
| source-excerpts/classical-005-comenius-senses-first.md | classical.005 | SE | comenius-great-didactic-1896 | paraphrase | medium-high on content; "golden rule" exact text unverified | senses_first |
| practice-patterns/classical-001-child-resists-memory-work.md | classical.001 | PP | — | — | high (grounded in SE 001–004) | child_resists_memory_work, recitation |
| observational-markers/classical-001-readiness-for-logic-stage.md | classical.001 | OM | — | — | high (Sayers paraphrased and attributed; no quotation) | logic_stage, readiness, child_argues, child_asks_why |
| contraindications/classical-001-abstract-analysis-grammar-stage.md | classical.001 | CI | — | — | high | grammar_stage, sequence, charlotte_mason_tension |
| worked-examples/classical-001-clancy-recitation-argument.md | classical.001 | WE | — | — | high (composite scenario; Paterson d. 1941, poem named not quoted) | recitation, child_argues, logic_stage, poetry |

Full novel-tag set (15, all lowercase snake_case): `recitation`, `imitation`, `logic_stage`, `grammar_stage`, `child_argues`, `child_asks_why`, `child_resists_memory_work`, `readiness`, `play_as_learning`, `anti_corporal_punishment`, `emulation`, `sequence`, `senses_first`, `poetry`, `charlotte_mason_tension`. Suggested categories for `tags.json`: situation — child_argues, child_asks_why, child_resists_memory_work; tension — charlotte_mason_tension; concept — the rest (`poetry` could be domain). Existing tags were preferred wherever one fit (`memory_exercise` rather than a new `memory_work`; `timing` rather than `starting_early`; `appropriate_challenge`, `overpressure`, `direct_knowledge`, `things_vs_words`, `unschooling_tension`, age bands). `classical_tension` was not needed in this batch (it is for other traditions tagging against Classical).

## 2. What I could not do / what Drew should check

- **No online access to any registered text.** The egress proxy denied archive.org (the registered Watson and Keatinge scans), Project Gutenberg, Wikisource (the Comenius mirror named in the registry), the Wayback Machine, and the Honeycutt mirror on kairos.technorhetoric.net. Only web *search* worked, so wording was checked by exact-phrase search hits on pages known to host Watson's / Keatinge's text, not by reading the page. That is why 3 of 5 SEs are paraphrases and the two verbatim SEs are short.
- **classical.002 (verbatim, Quintilian I.3.1–2)** — check against the Bohn 1856 scan: (a) "of which the excellence is twofold" vs "the excellence of which is twofold"; (b) comma vs colon after "provision". Every word is believed correct; only those two points are in doubt. If the scan differs, correct the text in place — do not downgrade to paraphrase (that would make it a lightly-reworded quote).
- **classical.004 (verbatim, Comenius XVI)** — confirm the two headings are the sixth and seventh principles of Chapter XVI in Keatinge, and that the wording in the 1896 print matches (the confirming source may be the 1907 second edition; wording is not expected to differ). Note that Chapter XVII has a parallel list whose sixth principle is "Nature does not hurry, but advances slowly" — not the one quoted.
- **classical.001 / .003 (paraphrases)** — if Drew wants a verbatim I.1.20 ("Let his instruction be an amusement to him…") or I.3.14 ("…a punishment fit for slaves…") in the vault, the Context notes say exactly which phrases were confirmed; a new SE can be cut from the scan in a few minutes. I deliberately did not splice confirmed fragments into a verbatim claim.
- **classical.005 (paraphrase)** — the "golden rule for teachers" sentence in Keatinge's Chapter XX is a strong candidate for a future verbatim SE once the scan is readable.
- **Sayers** — the trivium-as-stages framing in the FV, OM and CI is paraphrased and attributed to Sayers 1947 each time; no Sayers wording is used, and `source:` is not set on those entries (it is optional for non-SE layers and the registry entry is paraphrase-only). The ancient trivium was a curriculum of language arts, not a developmental theory; the FV and OM say so implicitly ("the stage reading… that Sayers proposed") — Drew may want that made explicit for Eclectic families.
- **Unregistered sources named but not excerpted:** Erasmus (De Copia) and the medieval disputatio are referred to as historical facts in the FV; Plato's Socratic method likewise. No excerpt is drawn from them, so no registration is needed for this batch. If a Plato SE is wanted later, `plato-republic-jowett` is already registered (Republic VII 536e–537a on compulsion vs amusement would be the natural passage).
- **Restraints format** — the FV `## Restraints` uses the brief's `- **Term** — description` form. The compiler parses that section with `parseListSection` (plain `- item`), so it compiles either way; the existing CM exemplar uses plain sentences. Pick one house style.
- **Age bands** — a 10-year-old does not fit a single existing band cleanly; I used `age_8_to_10` + `age_11_to_13` on the OM and `age_8_to_10` on the WE rather than proposing `age_9_to_11`.

## 3. Practice patterns — interpretive assertion

- **classical.001 "Child resists memory work"** — stays interpretive: the Response states how the tradition *reads* resistance (as information about the drill's form, size and content, and in older children as the logic appetite), cites what Quintilian and Comenius held, and describes what a classical tutor typically does as the tradition's reading ("the classical home has always met this with…", "the tradition's reading is…"). No sentence is addressed to the parent as a command; there is no "you must" / "you should". The Anti-pattern is framed as what the tradition's own first teacher ruled out.

## 4. Counts

FV 1 · SE 5 (2 verbatim, 3 paraphrase) · PP 1 · OM 1 · CI 1 · WE 1 = 10 files, plus this HANDOFF. All `[[wikilinks]]` in `## Grounded in` resolve to files in this batch.
