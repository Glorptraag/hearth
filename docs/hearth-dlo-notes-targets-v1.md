<!-- Version: 1 | Date: 2026-10-19 | Changes: initial. Ranked list of 50 F–Y3 DLOs that get "watch for next" notes first (launch pivot W4.2), split into 5 batches of 10 for drafting and confirmation. -->

# Hearth DLO "Watch for next" note targets v1

**Purpose.** Pick and rank the ~50 discrete learning objectives (DLOs) that get a hand-confirmed "Watch for next" note before the launch pivot demo. This is the input to W4.3: Claude drafts each batch as unpublished Sanity drafts, and Drew confirms each batch in Studio. A note renders only after it has `confirmedAt` (decision A5, `docs/hearth-launch-pivot-plan-v1.md`).

**Source of truth for ids and descriptors.** `docs/hearth-capability-dlo-reference.md` (57 threads × 3 tiers). DLO ids use the runtime form `dlo.<THREAD>.<tier>`, the same key that `src/lib/ai/dlo-persistence.ts` and `src/lib/ai/enrich.ts` write to `learner_dlo_status`. Every id below resolves to a thread code and tier in that reference.

## How the ranking was done

1. **Age band F–Y3 (about 4–9).** Most targets are `emerging` or `developing`. A `demonstrating` DLO is included only when Y2–Y3 children commonly reach it: L2 (fluent decoding) and M1 (flexible place value).
2. **Demo hits.** Each DLO was scored by how many of the 10 photo fixtures (W1.5) and the 4 Shelf wave-1 resources would plausibly surface it on a Confirm chip. A note only shows under a confirmed chip, so a DLO that the demo never lights up adds nothing on the day.
3. **Priority domains.** Early literacy, early number, science and nature, and art and making. These are ranked ahead of executive-function and social threads.
4. **Report tie-break.** Where two DLOs scored about the same, the one in an AC v9-mapped thread (tranche 1, so it counts toward deterministic report coverage in W5) ranks higher.
5. **Batch 1 is the strongest demo.** It covers every fixture category except the tablet screen, and all four wave-1 resources. Batches 2–5 broaden coverage, roughly in the order they're likely to be needed.

### Hit legend

| Code | Photo fixture (W1.5) | | Code | Shelf wave-1 resource |
|---|---|---|---|---|
| F1 | Worksheet with header | | MUS | Math-U-See (Primer → Gamma) |
| F2 | Worksheet without header | | TGTB | The Good and the Beautiful (Language Arts, Science) |
| F3 | Child's drawing | | AAR | All About Reading (Pre-reading → Level 3) |
| F4 | LEGO build | | SOTW | Story of the World (Vol. 1) |
| F5 | Creek / rocks | | | |
| F6 | Baking | | | |
| F7 | Reading a picture book | | | |
| F8 | Handwriting page | | | |
| F9 | Nature table | | | |
| F10 | Tablet screen | | | |

The fixture codes F1–F10 are labels used only in this doc. Use the W1.5 fixture names as the canonical names.

**AC9** column: `Y` means the thread has AC v9 regulatory mappings in prod (tranche 1). A confirmed status there feeds report coverage.

---

## Batch 1: highest demo value (draft Fri 23 Oct)

| # | DLO id | Thread | Tier | Why | Hit by | AC9 |
|---|---|---|---|---|---|---|
| 1 | `dlo.L2.developing` | L2 Phonological Awareness & Decoding | developing | CVC blending and letter–sound matching is the centre of F–Y1 reading and the most common thing a parent wants to know "what's next" about. | F7, F2 · AAR, TGTB | |
| 2 | `dlo.M2.developing` | M2 Operations & Computation | developing | Mental strategies (counting on, doubles, making 10) are the core of Math-U-See Alpha and Beta pages. This is the likeliest maths chip from a worksheet photo. | F1, F2 · MUS | Y |
| 3 | `dlo.L3.developing` | L3 Reading Comprehension | developing | Predicting and retelling is what a picture-book photo and a narration session show. | F7 · AAR, SOTW, TGTB | Y |
| 4 | `dlo.L6.developing` | L6 Handwriting & Text Production | developing | Consistent letter size and spacing is the first thing a handwriting page shows. | F8, F1 · TGTB | |
| 5 | `dlo.M1.developing` | M1 Number Sense & Place Value | developing | Tens and ones, and skip counting, run through Math-U-See Beta (place value with the blocks). | F1, F2 · MUS | Y |
| 6 | `dlo.S5.developing` | S5 Scientific Observation | developing | Noticing changes and comparing details is the natural read of a creek or nature-table photo. | F5, F9 · TGTB | Y |
| 7 | `dlo.C5.developing` | C5 Visual Expression & Design | developing | Recognisable subjects with growing detail is the typical F–Y3 drawing, and TGTB art lessons sit here. | F3 · TGTB | |
| 8 | `dlo.C6.emerging` | C6 Design & Construction | emerging | Purposeful building is what a LEGO photo most plainly shows. | F4 | |
| 9 | `dlo.M5.emerging` | M5 Measurement Sense | emerging | Comparing and using informal measurement language (more, heavy, full) comes up in baking and Math-U-See Primer. | F6 · MUS | Y |
| 10 | `dlo.L9.emerging` | L9 Literary Response & Appreciation | emerging | Enjoying a read-aloud and reacting to it is the warmest picture-book and Story of the World moment. | F7 · AAR, SOTW | Y |

## Batch 2: younger end of the core (F–Y1)

| # | DLO id | Thread | Tier | Why | Hit by | AC9 |
|---|---|---|---|---|---|---|
| 11 | `dlo.L2.emerging` | L2 Phonological Awareness & Decoding | emerging | Rhyme, syllables and first sounds: the All About Reading Pre-reading level. | F7 · AAR, TGTB | |
| 12 | `dlo.M2.emerging` | M2 Operations & Computation | emerging | Combining and taking away with blocks: Math-U-See Primer pages. | F1, F2, F6 · MUS | Y |
| 13 | `dlo.M1.emerging` | M1 Number Sense & Place Value | emerging | One-to-one counting and numeral recognition for 4–5 year olds. | F2, F6, F9 · MUS | Y |
| 14 | `dlo.L6.emerging` | L6 Handwriting & Text Production | emerging | Functional grip, recognisable letters, writes own name (often on a drawing). | F8, F3 · TGTB | |
| 15 | `dlo.L5.emerging` | L5 Written Expression | emerging | Labels on pictures and dictated sentences show up on drawings and handwriting pages. | F3, F8 · TGTB | Y |
| 16 | `dlo.S5.emerging` | S5 Scientific Observation | emerging | Pointing out one detail and asking "what's that?" is the early-years creek moment. | F5, F9 | Y |
| 17 | `dlo.S2.emerging` | S2 Living Systems | emerging | Living versus non-living, needs, and features is what a nature table shows. | F9, F5 · TGTB | |
| 18 | `dlo.L4.emerging` | L4 Spelling & Word Knowledge | emerging | Invented spelling is readable on handwriting and worksheet photos. | F8, F2, F3 · AAR, TGTB | |
| 19 | `dlo.H1.emerging` | H1 Historical Thinking & Chronology | emerging | Old versus new and interest in the past is where Story of the World Vol. 1 lands for 5–7 year olds. | SOTW | Y |
| 20 | `dlo.C6.developing` | C6 Design & Construction | developing | Plans, tests and modifies a build. This is the older-child LEGO read. | F4 | |

## Batch 3: broadening literacy, number, nature

| # | DLO id | Thread | Tier | Why | Hit by | AC9 |
|---|---|---|---|---|---|---|
| 21 | `dlo.L3.emerging` | L3 Reading Comprehension | emerging | Matches pictures to text and answers "what happened?". | F7 · AAR | Y |
| 22 | `dlo.L4.developing` | L4 Spelling & Word Knowledge | developing | Spelling patterns and word families: TGTB spelling lists and All About Reading word cards. | F8, F2 · TGTB, AAR | |
| 23 | `dlo.M5.developing` | M5 Measurement Sense | developing | Cups, scales and clocks: baking with measuring tools, and Math-U-See time and money pages. | F6, F1 · MUS | Y |
| 24 | `dlo.M4.emerging` | M4 Algebraic Thinking & Patterns | emerging | Copying repeating patterns and sorting by one attribute: LEGO colour runs and nature-table sorting. | F4, F9, F2 · MUS | |
| 25 | `dlo.S3.developing` | S3 Earth & Environmental Systems | developing | Identifying rocks, soil and landscapes is exactly the creek / rocks fixture. | F5 · TGTB | |
| 26 | `dlo.S1.emerging` | S1 Scientific Inquiry | emerging | Exploring with the senses and asking "why" comes up at the creek, the nature table and the mixing bowl. | F5, F9, F6 · TGTB | Y |
| 27 | `dlo.P2.emerging` | P2 Fine Motor & Manipulation | emerging | Grip on crayons, small LEGO pieces and dough: a frequent secondary chip for 4–5 year olds. | F3, F4, F6, F8 | |
| 28 | `dlo.H1.developing` | H1 Historical Thinking & Chronology | developing | Timeline placement and "people lived differently" is the Story of the World activity-book work. | SOTW | Y |
| 29 | `dlo.L1.developing` | L1 Oral Communication & Listening | developing | Retelling in sequence is Story of the World narration and picture-book retelling. | F7 · SOTW, AAR | Y |
| 30 | `dlo.M3.emerging` | M3 Fractional Thinking | emerging | "Half" and fair shares come up most in baking (half a cup, cutting the slice). | F6 | |

## Batch 4: Y2–Y3 stretch and second-tier science and art

| # | DLO id | Thread | Tier | Why | Hit by | AC9 |
|---|---|---|---|---|---|---|
| 31 | `dlo.L2.demonstrating` | L2 Phonological Awareness & Decoding | demonstrating | Blends, digraphs and expression: All About Reading Levels 2–3, TGTB Level 2. This is the Y2–Y3 reader. | F7 · AAR, TGTB | |
| 32 | `dlo.M1.demonstrating` | M1 Number Sense & Place Value | demonstrating | Flexible composing and decomposing into hundreds: Math-U-See Beta and Gamma for Y3. | F1, F2 · MUS | Y |
| 33 | `dlo.M4.developing` | M4 Algebraic Thinking & Patterns | developing | Equals as "the same as" and finding missing numbers: Math-U-See Alpha's solve-for-the-unknown pages. | F1, F2 · MUS | |
| 34 | `dlo.S2.developing` | S2 Living Systems | developing | Life cycles and grouping by features: nature-table specimens and TGTB science units. | F9, F5 · TGTB | |
| 35 | `dlo.S3.emerging` | S3 Earth & Environmental Systems | emerging | Natural features and weather at the creek, for the younger child. | F5, F9 | |
| 36 | `dlo.S4.emerging` | S4 Physical & Chemical Sciences | emerging | Heating changes materials (batter to cake) and grouping by property. | F6, F4 | |
| 37 | `dlo.C5.emerging` | C5 Visual Expression & Design | emerging | Free exploration of paint, collage and crayon: the 4–5 year-old drawing. | F3 · TGTB | |
| 38 | `dlo.P2.developing` | P2 Fine Motor & Manipulation | developing | Detailed drawing, cutting on the line, precise construction. | F3, F8, F4 | |
| 39 | `dlo.H3.emerging` | H3 Geography & Environmental Awareness | emerging | Names natural features, plus simple maps (Story of the World map work). | F5 · SOTW, TGTB | Y |
| 40 | `dlo.L9.developing` | L9 Literary Response & Appreciation | developing | Explains likes and dislikes with reference to the text, and discusses character motives. | F7 · AAR, SOTW | Y |

## Batch 5: making, attention, digital, poetry

| # | DLO id | Thread | Tier | Why | Hit by | AC9 |
|---|---|---|---|---|---|---|
| 41 | `dlo.EF1.developing` | EF1 Sustained Attention & Focus | developing | 15–20 minutes on task. EF1 is one of the highest-volume threads in pilot data, and a long LEGO build or a full worksheet shows it. | F1, F4 · MUS | |
| 42 | `dlo.EF3.developing` | EF3 Memory & Recall | developing | Recalls facts from earlier learning: Story of the World narration-from-memory and Math-U-See fact retrieval. | SOTW, MUS | |
| 43 | `dlo.C1.emerging` | C1 Narrative & Storytelling | emerging | Simple stories and imaginative play with props: LEGO scenes, story drawings, retelling a picture book. | F4, F3, F7 | Y |
| 44 | `dlo.M6.emerging` | M6 Spatial Reasoning & Geometry | emerging | Names 2D shapes and position words: LEGO and Math-U-See Primer shape pages. | F4, F2 · MUS | |
| 45 | `dlo.M6.developing` | M6 Spatial Reasoning & Geometry | developing | Properties of 3D shapes and symmetry: LEGO builds. | F4 | |
| 46 | `dlo.M7.emerging` | M7 Data & Statistical Thinking | emerging | Sorting into categories and counting each: nature-table collections. | F9 | |
| 47 | `dlo.C7.emerging` | C7 Digital Creation | emerging | Drawing apps and camera use: the only strong read of the tablet-screen fixture. | F10 | |
| 48 | `dlo.PS7.emerging` | PS7 Digital Citizenship | emerging | Supervised device use. Pairs with C7 so a tablet photo has a note on both of its likely chips. | F10 | |
| 49 | `dlo.L5.developing` | L5 Written Expression | developing | Connected sentences with a beginning, middle and end: TGTB writing and Y2–Y3 handwriting pages. | F8 · TGTB | Y |
| 50 | `dlo.C3.emerging` | C3 Poetic & Rhythmic Expression | emerging | Rhyme and wordplay: All About Reading rhyming activities, TGTB poems, rhyming picture books. | F7 · AAR, TGTB | |

---

## Reserve (swap-ins, not counted in the 50)

Use these if Drew rejects a target or a batch needs a substitute. All are valid ids in the reference.

| DLO id | Why it's on the bench |
|---|---|
| `dlo.EF7.emerging` | High-volume in pilot data, but less likely to be lit by a single photo. |
| `dlo.EF8.emerging` | Free experimentation with materials (LEGO, drawing). Overlaps C5/C6 chips. |
| `dlo.H2.emerging` | "Photos and objects tell about the past". A secondary Story of the World read. |
| `dlo.S4.developing` | Reversible and irreversible changes in baking. Stronger for Y3+. |
| `dlo.S1.developing` | Prediction before testing. Needs a parent-described investigation, not just a photo. |
| `dlo.PS1.developing` | Discussing character feelings in a picture book. |

## Deliberately excluded

- **H6 (First Nations Australian Perspectives).** Suppressed in alpha (H6 suppression). No notes until that decision changes.
- **PS5 (Environmental Stewardship).** The seeded descriptors are placeholder-short ("Looks after own belongings") and don't match the thread title. Writing notes on them would lock in drift.
- **M8, H4, H5, P1, P3–P5, PS2–PS4, PS6, EF2, EF4–EF6, C2, C4, L7, L8, M9.** These are valid F–Y3 threads, but no fixture or wave-1 resource reliably surfaces them on a Confirm chip. They come after the first 50.
- **`demonstrating` tiers outside L2 and M1.** These are mostly Y4+ behaviours. A note here would describe what an F–Y3 child is unlikely to show next.
