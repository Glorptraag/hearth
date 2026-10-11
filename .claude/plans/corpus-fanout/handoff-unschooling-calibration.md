# HANDOFF — Unschooling batch W5 (observational marker + contraindications)

Framework dir: `unschooling` · short code `us` · 4 entries · all `status: published`, `suggestedDraft: true`.

**Hard guard honoured:** this batch touched **no** source-excerpt, practice-pattern, worked-example or facilitation-vocabulary file. Those layers remain commissioned-author territory (PKB12/PKB13, licensing-needs-v2 §6). No file under the repo was modified; all output is under `corpus-out/unschooling/`.

## 1. Entries

| filename | id | layer | source (SE only) | verbatim/paraphrase (SE only) | confidence in source fidelity | tags proposed as novel (not in tags.json) |
|---|---|---|---|---|---|---|
| `observational-markers/us-006-deliberate-resource-seeking.md` | `us.006` | observational-markers | — | — | **medium** — Gray & Riley Report I/II themes (self-direction, knowing how to find what they need, ease approaching lecturers/adults) reported from memory; the papers' host (academicworks.cuny.edu) and every mirror were blocked by the egress proxy, so wording was not re-checked against the text | `resource_seeking` (concept), `child_asks_for_help` (situation) |
| `contraindications/us-006-adolescence-to-university-transition.md` | `us.006` | contraindications | — | — | **medium** — Report II findings reported in Hearth's words; headline figures match the vault's existing `us-001` SE (83% / 44%); the finer-grained claims are flagged in §2 for verification | `university_transition` (concept), `age_14_to_18` (age_band), `classical_tension` (tension) |
| `contraindications/us-007-working-households-without-redesign.md` | `us.007` | contraindications | — | — | **medium** — Gray & Riley 2013 (CC BY-NC-ND) findings reported, not reproduced or adapted; sample-shape and challenge-category claims flagged in §2 | `parent_availability` (concept), `single_parent` (situation) |
| `contraindications/us-008-unschooling-out-of-laziness.md` | `us.008` | contraindications | — | — | **high** for the Report I "disengagement" finding (already in `us-001` SE); **medium-high** for the Dodd "not doing nothing / not un-parenting" attribution (widely circulated; no page cited) | `trust_vs_neglect` (concept) |

Suggested `tags.json` stanzas for the eight novel tags (paste-ready; descriptions optional per the file's existing convention):

```json
"resource_seeking":    { "category": "concept",  "description": "The child deliberately locating a resource or person to go further — the learner's half of the strewing exchange." },
"child_asks_for_help": { "category": "situation", "description": "Child makes a specific, purposeful request for help or a resource (distinct from asking to be entertained)." },
"university_transition": { "category": "concept", "description": "The late-teen move from home education toward university, TAFE, apprenticeship or work." },
"age_14_to_18":        { "category": "age_band" },
"classical_tension":   { "category": "tension" },
"parent_availability": { "category": "concept",  "description": "Whether an engaged adult is actually present for most of the child's waking day — the invisible infrastructure of home education." },
"single_parent":       { "category": "situation", "description": "Household context: one parent, or both parents working, carrying home education." },
"trust_vs_neglect":    { "category": "concept",  "description": "The distinction between active, watchful trust and parental disengagement wearing the tradition's language." }
```

Existing tags reused on purpose that Drew may want to eyeball: `masterly_inactivity` (a Charlotte Mason concept tag) sits on CI `us.008` because its `Tension with other traditions:` paragraph is a stated comparison with Mason — this is the allowed exception to the no-bleed rule, not an accident. `HEU_report_context` on CI `us.006` is there because the entry speaks to what the HEU annual report should look like in the senior years.

Retrieval metadata set: OM `us.006` → `capabilityThreads: [EF4, EF7]` (planning & organisation; metacognition). CI `us.006` → `ageRange: 13-18`. The other two CIs are all-ages and carry no `ageRange`.

Wikilinks: every `[[...]]` resolves to an existing file in `corpus/pedagogy/unschooling/` or to the OM created in this batch (`us-006-deliberate-resource-seeking`). No cross-framework wikilinks; Charlotte Mason, Classical and Montessori are named in prose only.

## 2. What I could not do / what Drew should check

**Network:** `academicworks.cuny.edu`, `jual.nipissingu.ca`, `psychologytoday.com`, `api.semanticscholar.org` and `core.ac.uk` are all blocked by the session's egress proxy, so none of the Gray & Riley texts could be re-read. Everything below is reported from my prior knowledge of the papers and should be checked against the PDFs before `suggestedDraft` is flipped. The vault's own `us-001` SE (83% pursued higher education; 44% completed/enrolled in a bachelor's; 3 of 75 unhappy, from homes marked by depression and disengagement) was treated as the anchor and nothing in this batch contradicts it.

Specific claims to verify, by entry:

- **CI `us.006` (Report II, CC BY):**
  - "most of those who went on to university got in without serious difficulty", by community-college transfer, admissions test, or interview + portfolio — verify the routes list and that "little difficulty" is the paper's characterisation.
  - "friction with the form — deadlines, examinations, lectures, and most often classmates who seemed to have no interest in learning" — verify that the uninterested-peers complaint is the most frequent one named.
  - "A minority named gaps, maths most commonly" — I recall this from the disadvantages discussion (possibly Report I rather than II); confirm which report and the wording.
  - "a large majority were in work that grew directly out of childhood interests, around half were self-employed, creative and technical fields heavily represented" — my recollection is roughly three-quarters / just over half / about half creative; I deliberately used ranges rather than percentages. If Drew wants the exact figures in-text, CC BY permits it.
  - "sample was self-selected through Gray's own readership and has no comparison group" — confirm the authors state both caveats (I am confident they do).
  - Australian admissions detail: TAFE articulation, enabling/preparation programmes, OUA units, the STAT, portfolio/early-entry schemes — all true in general but eligibility is institution- and year-specific (the entry says so). "TAFE will often enrol a sixteen-year-old directly into a certificate" and "HEU registration and annual reporting continue through the senior years" are general statements; confirm against current QLD HEU material if a firmer line is wanted.
  - Grace Llewellyn and Blake Boles are named as practitioners (no quotation, no adaptation), under the registry's `unschooling-movement-consensus` convention of naming practitioners where known. Neither is registered in `sources.json`; if Drew wants anything closer than a name-check from *The Teenage Liberation Handbook*, register it first.
- **CI `us.007` (2013 paper, CC BY-NC-ND — reported only):**
  - "respondents were predominantly households with a parent, almost always the mother, at home" — verify against the demographics section; I did not assert counts of single-parent or dual-working households for exactly this reason.
  - "challenges they named included the time and energy the approach demands, the loss of a second income, and finding time for themselves" — I recall a time/energy/finance challenge category alongside social-pressure and parental-deschooling; confirm the category label and that income loss and time-for-self appear in it.
  - The entry says "(CC BY-NC-ND — cited here, not reproduced)" in-text; confirm Drew is comfortable with that explicit licence note surfacing in retrieval, or move it to `## Grounded in` (which is vault-only).
  - Dodd "unschooling is not un-parenting", Fetteroll and Laricchia on presence — attributed as circulating formulations, not quoted. Fine under `unschooling-movement-consensus`; a commissioned author would supersede.
- **CI `us.008`:**
  - "Sandra Dodd has written for years against treating unschooling as 'doing nothing'" — I am confident of the position, not of a specific page title; attributed in Hearth's words.
  - The Mason description ("authority and attention, not indifference") paraphrases the CM vault's own reading in `cm-002` / `cm-007` rather than quoting *School Education*; it does not cite a page.
- **OM `us.006`:**
  - "several reported being comfortable approaching lecturers and other adults because they had grown up treating adults as people to ask" — this is my recollection of a Report II theme; confirm or soften.

**Choices Drew may want to revisit:**

- OM topic: I chose **deliberate resource-seeking / asking for help** over **self-initiated documentation**. Reason: it grounds more strongly in the registered CC BY material and in the existing SEs (Holt, Illich, strewing), and it fills a gap the other five markers do not touch (`us-001` has one bullet on seeking additional material; this entry is about the *competence* of knowing where to look and the ease of asking). Self-initiated documentation would be a good `us.007` OM later, ideally from a commissioned author, since its grounding is practitioner lore rather than the Gray & Riley papers.
- `classical_tension` is proposed on CI `us.006` because the paragraph names Classical first; it also names Charlotte Mason's upper forms. I did **not** propose `charlotte_mason_tension` there, nor on CI `us.008` where the CM comparison records agreement rather than tension. Add either if you want the CM mentions indexed for Eclectic retrieval.
- CI `us.007`'s tension paragraph contrasts Montessori and Charlotte Mason on *where adult time is spent*, not on doctrine, so it carries no `*_tension` tag.
- Entry length: the three CIs run ~900–1000 words, longer than the existing `us-001`–`us-005` CIs (~150–250). The brief asked each to carry the evidence, the movement's own guidance and the counter-position; trimming is easy if the chunker prefers shorter entries.

**Not touched:** `README.md` for the framework (its OM row would move to 6/6 and CI row to 8/8 once these land — repo is read-only for this session).

## 3. Practice patterns

None in this batch (PP is commissioned-author territory under the hard guard), so there are no interpretive-vs-prescriptive assertions to make. For the record, the three CIs are written as the tradition's own warnings and counter-positions ("the tradition's honest position is…", "practitioners describe…", "Honest status: …") and avoid "you must"; the OM describes what the tradition notices, not what the parent should do.
