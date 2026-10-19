# Waldorf / Steiner calibration batch — HANDOFF (plan task W4-CAL)

Framework dir `waldorf-steiner`, short code `waldorf`. Greenfield: all six layer directories created. 10 entries: FV 1, SE 5, PP 1, OM 1, CI 1, WE 1. Every entry is `status: published`, `suggestedDraft: true` (explicit). A Python mirror of the compiler contract (frontmatter grammar, layer keys/sections, pair-list and list grammars, licence gate, ageRange / capabilityThreads / activityType, wikilink existence) reports 0 errors; the orchestrator's `npm run corpus:check` is still the authority.

## 1. Entry table

| filename | id | layer | source (SE only) | verbatim / paraphrase (SE only) | confidence in source fidelity | tags proposed as novel |
|---|---|---|---|---|---|---|
| `facilitation-vocabulary/waldorf.md` | `waldorf` | facilitation-vocabulary | — | — | high (tradition voice; 8 verbs / 9 restraints / 7 micro-scripts) | — (FV carries no tags) |
| `source-excerpts/waldorf-001-three-births-change-of-teeth.md` | `waldorf.001` | source-excerpts | `steiner-education-of-the-child-1911` | paraphrase | high (substance); 1911 wording not seen | `change_of_teeth` |
| `source-excerpts/waldorf-002-imitation-and-example.md` | `waldorf.002` | source-excerpts | `steiner-education-of-the-child-1911` | paraphrase | high (substance); 1911 wording not seen | `imitation` |
| `source-excerpts/waldorf-003-authority-picture-memory.md` | `waldorf.003` | source-excerpts | `steiner-education-of-the-child-1911` | paraphrase | high (substance); 1911 wording not seen | `authority`, `imaginative_picture`, `storytelling`, `early_intellectualisation` |
| `source-excerpts/waldorf-004-writing-before-reading-from-drawing.md` | `waldorf.004` | source-excerpts | `steiner-practical-advice-teachers-1919` | paraphrase (mandatory, `allowVerbatim: false`) | high (substance) / medium (lecture numbering) | `writing_before_reading` |
| `source-excerpts/waldorf-005-educators-inner-attitude.md` | `waldorf.005` | source-excerpts | `steiner-foundations-human-experience-1919` | paraphrase (mandatory, `allowVerbatim: false`) | high (substance) / medium (lecture numbering) | — |
| `practice-patterns/waldorf-001-five-year-old-asks-to-read.md` | `waldorf.001` | practice-patterns | — | — | high | `child_asks_to_read` |
| `observational-markers/waldorf-001-imitation-of-adult-work.md` | `waldorf.001` | observational-markers | — | — | high | — (reuses `imitation`) |
| `contraindications/waldorf-001-early-intellectualisation.md` | `waldorf.001` | contraindications | — | — | high; mirror of `montessori-001-fantasy-before-six`, carries `montessori_tension` | — (reuses `early_intellectualisation`, `imaginative_picture`) |
| `worked-examples/waldorf-001-farmer-with-barrow.md` | `waldorf.001` | worked-examples | — | — | high | `rhythm` |

Novel tag set (9), with suggested `tags.json` categories: `child_asks_to_read` (situation); `authority`, `change_of_teeth`, `early_intellectualisation`, `imaginative_picture`, `imitation`, `rhythm`, `storytelling`, `writing_before_reading` (concept). All lowercase snake_case. Every other tag used is already in `tags.json`.

Retrieval metadata added: SE.001 `ageRange: 0-7`; SE.002 `0-7`; SE.003 `7-14`; SE.004 `6-8`; PP.001 `4-7` + `[L2, L7]`; OM.001 `2-7` + `[P1, PS5]`; CI.001 `0-7`; WE.001 `5-7` + `[P1, EF1, PS5]` + `activityType: imitative_play`. SE.005 carries none (it is about the adult).

## 2. What I could not do / what Drew should check

- **No verbatim excerpts, despite a public-domain source.** Network egress from the authoring session to gutenberg.org (PG #55586), archive.org and wikisource was blocked, so the registered 1911 Rajput Press text was never in front of me. Rather than claim wording from memory of *other* translations (Adams 1927/1965), all five SEs are honest paraphrases with the section named in `pageOrChapter`. Each SE's `## Context` names the natural verbatim candidate for an upgrade pass: the "births" passage (SE.001); the "two magic words" sentence and the napkin-doll passage (SE.002); the sentence insisting the teacher must believe the picture (SE.003). Upgrading is a one-step check against #55586 and a flip of `isParaphrase` plus replacing `## Text`.
- **`pageOrChapter` for the 1911 essay is positional, not paginated.** The essay has no chapter divisions; I gave section descriptions ("roughly the first third", "the section on education before the change of teeth"). No page numbers were invented.
- **One illustration deliberately omitted.** The often-repeated example of a child's gait taking on a parent's limp was left out of SE.002 because I could not confirm it is in the 1911 text. The money-drawer anecdote and the napkin doll are retained (high confidence).
- **1919 lecture references to verify.** SE.004 cites Lecture 1 plus "the early lectures on the first writing lessons (Lectures 4–5 in the usual editions)"; SE.005 cites Lecture 1 of *Foundations* (21 August 1919). Substance is high-confidence; numbering is medium. Check against the edition to hand before any citation is shown to parents.
- **`steiner-discussions-with-teachers-1919` is registered but not drawn on** in this batch (nothing in the eight asked-for entries needed it; the temperaments material there is a natural Wave 4 OM/PP source).
- **"Will before intellect".** The brief listed it as a fourth 1911 theme. SE.003 carries the essay's actual framing (memory and feeling before judgement; abstract judgement after puberty). The "will before intellect" shorthand appears in the FV and CI as the tradition's own summary, not attributed to the 1911 text. If Drew knows a passage in #55586 that states it directly, SE.003's Context flags where to add it.
- **Montessori vocabulary in the CI.** The `Tension with other traditions:` paragraph names sensitive periods, sandpaper letters, the movable alphabet and the absorbent mind — Montessori's own terms, used only inside the stated comparison per the brief's no-bleed rule. Nowhere else in the batch does Montessori or Charlotte Mason vocabulary appear (grep-checked).
- **Age-band tag mismatch.** Waldorf's threshold is seven, but the nearest existing age tag is `under_six`; I used `under_six` + `age_5_to_7` together to cover the change-of-teeth boundary. If the Waldorf wave grows, an `under_seven` age_band tag would be cleaner than keeping this workaround.
- **`activityType: imitative_play`** on WE.001 — I could not find a list of existing activityType values; it passes the compiler regex, but Drew may prefer an existing value (e.g. `free_play`) for consistency with other frameworks.
- **Not written (candidates for the next pass):** the second PP suggested in the brief ("the day has lost its rhythm and the child is unsettled" — the FV's **Breathe out** verb carries the reading for now); the second OM option ("signs of readiness at the change of teeth"); a southern-hemisphere festival-year entry (the FV's **Warm the home** / **Hold the rhythm** only gesture at it).

## 3. Practice patterns — interpretive assertion

- `waldorf-001-five-year-old-asks-to-read` — stays interpretive: the Response explains how the tradition *reads* the request (as imitation and belonging, not as the intellect announcing readiness; the second teeth, not the request, are the sign) and what a Waldorf parent *would typically* do with it (warm non-refusal; story, rhyme, drawing, visible adult literacy; letting the child's own picking-up ripen; letters through pictures and writing-before-reading after the change of teeth). No "you must"; the Anti-pattern lists the moves the tradition would avoid, framed as what the tradition protects against, not as instructions to the parent.
