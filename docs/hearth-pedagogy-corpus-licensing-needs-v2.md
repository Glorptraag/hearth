<!-- Version: 2 | Date: 2026-04-11 | Changes: Unschooling section completely rewritten with concrete research findings — named practitioners with contact details, Holt rights split (Hachette + HoltGWS), CC-licensed Gray & Riley papers identified, Australian fair dealing position resolved, recommended commissioning sequence with pricing anchors. Other pedagogy sections largely unchanged from v1. Priority summary table updated to reflect commissioned-author-first strategy for Wave 5. Supersedes hearth-pedagogy-corpus-licensing-needs-v1.md. -->

# Hearth Pedagogy Corpora — Licensing Needs (v2)

> **Status:** Action document. Supersedes v1.
> **Architecture reference:** `hearth-pedagogy-knowledge-base-architecture-v1.md`
> **Companion v1 corpus:** `hearth-pedagogy-corpus-unschooling-v1.md` (proof of concept built around the commissioned-author strategy below)

---

## What Changed Since v1

The v1 of this document was speculative about Unschooling and unsure whether to recommend Holt licensing or guest-author commissioning. Deep research closed that question. The v2 Unschooling section is concrete: named practitioners, contact details, Holt's split rights structure, the Australian legal position, and the recommended commissioning sequence.

The other pedagogies (Charlotte Mason, Classical, Montessori, Waldorf) are unchanged from v1 in substance — the Mason corpus is built and shipped, and the Classical/Montessori/Waldorf strategies remain "build from public domain primary sources." Those sections are retained for completeness; if you only want what's new, skip to §6.

---

## 1. Australian Legal Position (One Mention, Then Move On)

For all six pedagogies, the operative jurisdiction is Australia. Australian fair dealing does not cover Hearth's use case (commercial AI retrieval pipeline with embedded attributed excerpts). The Productivity Commission proposed a text-and-data-mining exception in August 2025; Attorney-General Michelle Rowland rejected it in October 2025. As of April 2026, Australia has no TDM exception and no general fair use defence. **Licensing or original authorship are the only paths.** This is settled and does not need re-litigating per pedagogy below.

---

## 2. Charlotte Mason — No Action Needed

Mason died 1923. Six-volume Home Education Series fully public domain worldwide, all on Project Gutenberg. CM corpus v1 already shipped (`hearth-pedagogy-corpus-charlotte-mason-v1.md`). Wave 1 authoring sprint to bring it to ~100 entries proceeds without any rights conversation.

---

## 3. Classical — Largely Free, One Optional Licensing Decision

Ancient and medieval foundations (Plato, Aristotle, Quintilian, Augustine, Aquinas, Erasmus, Comenius, Milton, Locke, Newman) all public domain. Charlotte Mason herself can also be drawn on as part of the Classical corpus. Modern articulations (Sayers' "Lost Tools of Learning" 1947, Bauer's *Well-Trained Mind*, Wilson, Bortins, Hicks) are in copyright.

**Recommended action:** Build Wave 2 entirely from public domain foundations. Optionally pursue Sayers licensing through David Higham Associates (UK) if direct quotation of the founding modern essay matters — estimated £300–£1,500. Decide after Wave 2 v1 is drafted, not before.

---

## 4. Montessori — Pre-1929 Translations Cover v1

Pre-1929 English translations (*The Montessori Method* 1912, *Pedagogical Anthropology* 1913, *Dr. Montessori's Own Handbook* 1914, *Spontaneous Activity in Education* 1917) are public domain in the US and available on Project Gutenberg. These contain prepared environment, sensitive periods, work cycle, self-correction, practical life, sensorial education. A full v1 corpus is buildable from them alone.

Post-1929 works (*The Absorbent Mind*, *The Secret of Childhood*) controlled by Montessori-Pierson Publishing in Amsterdam. Italian originals public domain worldwide since 2023 (Montessori died 1952; life+70). Modern English translations remain in copyright. If late-career concepts are needed, options are: translate from Italian directly (legally clean, requires Italian competency), license from Montessori-Pierson, or paraphrase with attribution.

**Recommended action:** Build Wave 3 from pre-1929 PD English translations. Defer post-1929 licensing decision until corpus is drafted.

---

## 5. Waldorf/Steiner — 1911 Rajput Translation Covers v1

*The Education of Children from the Standpoint of Theosophy* (1911 Rajput Press, Chicago) is the foundational text and is public domain (pre-1929 US publication). Available on Project Gutenberg eBook #55586. The 1919 founding lectures for the first Waldorf school (*The Foundations of Human Experience*, *Practical Advice to Teachers*, *Discussions with Teachers*) are also pre-1929 in their German originals; pre-1929 English translations exist for some.

**Recommended action:** Build Wave 4 from 1911 Rajput translation plus any pre-1929 English versions of the 1919 lectures. No licensing conversation needed.

---

## 6. Unschooling — Commission a Practitioner, Don't License the Founders

**This section is completely rewritten from v1 based on research findings.**

The Holt-licensing path is the wrong primary strategy. Holt's works are dated 1960s–80s primary texts that were never written in the operational, scenario-driven format Hearth's six-layer architecture needs. They would need extensive recontextualisation even after licensing. The contemporary unschooling movement, by contrast, is full of practitioners who already produce structured guidance content commercially — books, podcasts, coaching frameworks, paid memberships. Commissioning one of them to author the operational layers of the Unschooling corpus is faster, cheaper, more contemporary in voice, and produces material genuinely shaped for Hearth's use rather than retrofitted.

### 6.1 Holt Rights Reality (For The Record)

Holt's works are split between two rights holders:

- **Hachette Book Group** publishes *How Children Fail* (1964/1982), *How Children Learn* (1967), *Learning All the Time* (1989), and *Teach Your Own* (2021 revised edition co-authored by Pat Farenga). Permissions: `permissions.Generic@hbgusa.com`. Hachette explicitly charges for permissions.
- **HoltGWS LLC** (Pat Farenga's entity, successor to Holt Associates) publishes the titles whose rights reverted: *Freedom and Beyond* (2017 2nd ed.), *Escape from Childhood* (2013), *Instead of Education*, plus the *Growing Without Schooling* magazine archive (141 issues, 1977–2001). Contact: johnholtgws.com/contact. Pat Farenga is approachable, mission-aligned, and actively running the legacy.

No public precedent exists for Holt content being licensed for an edtech or AI product. Hearth would be pioneering. This means no established pricing framework — and no template to anchor negotiation against.

**Decision:** Hold Holt licensing as a low-priority secondary enrichment, not the primary strategy. Pursue only after the commissioned-author v2 of the Unschooling corpus is substantially complete and only if a small number of direct foundational quotations are still needed.

### 6.2 The Commissioned-Author Strategy (Primary)

Commission a contemporary practitioner to write Practice Patterns, Worked Examples, and Facilitation Vocabulary directly. Source Excerpts can be a mix of paraphrased foundational ideas (Holt, Neill, Illich in Hearth's words with attribution — already done in `hearth-pedagogy-corpus-unschooling-v1.md`) and the commissioned author's own framings.

**Primary candidates** (full profiles in research report):

| Candidate | Location | Why | Engagement signal |
|---|---|---|---|
| **Pam Laricchia** | Ontario, Canada | 5 books, 300+ podcast episodes, paid membership community, commercially structured. Sandra Dodd endorses. Already produces Hearth-shaped content. | livingjoyfully.ca — has consulting offer, sells courses |
| **Sue Patterson** | Texas, USA | Coaching practice, 21 published guides, online course, group membership. 30 years experience. Practical, structured tone. | unschoolingmom2mom.com — $75/half hour 1:1 rate as pricing anchor |
| **Joyce Fetteroll** | Massachusetts, USA | Carnegie Mellon engineer background; technical-writer style. "Five Steps to Unschooling" essay is literally a step-by-step framework. Stylistically the strongest fit. | joyfullyrejoycing.com — uncertain current activity level; conditional candidate |

**Australian-essential candidate:**

- **Sue Elvis** — NSW. 27 years successful NSW unschooling registration, three published books, currently co-hosting podcast with Sandra Dodd through 2025. The single most credible voice on translating unschooling into Australian regulatory documentation. Should author or co-author all Australian-context Worked Examples and the registration-related Practice Pattern regardless of who handles the international layers.
  - storiesofanunschoolingfamily.com

**Australian secondary candidates:**

- **Sara Macdonald** — NSW. Master's in Clinical Psychology, four children, 19,000+ Instagram. Largest unschooling blog. happinessishereblog.com
- **Freya Dawson** — NSW (Wollongong). Former University of Wollongong law lecturer, 15+ years unschooling, runs commercial unschooling courses (The Deschooling Course; Making Peace with Screens; Joyful Parenting). Most commercially active Australian unschooling practitioner. Deepest publicly available NSW registration writing. freyadawson.com.au
- **BarefootChild** — QLD. Shares approved QLD unschooling learning plans and end-of-year reports — the most practical Queensland documentation examples available. barefootchild.info
- **Beverley Paine** — SA. "Grandmother of Australian homeschooling," active since 1986, runs Australia's largest online home educating Facebook community. Broad-spectrum rather than strict unschooler. homeschoolaustralia.com

### 6.3 The Free Evidence Layer (Available Now)

The single body of openly-licensed substantive material is **Peter Gray and Gina Riley's research papers**:

| Paper | Year | Licence | Use |
|---|---|---|---|
| "The Challenges and Benefits of Unschooling, According to 232 Families" | 2013 | CC BY-NC-ND 4.0 | Reference link only — non-commercial restriction prevents direct adaptation |
| "Grown Unschoolers' Evaluations of Their Unschooling Experiences: Report I" | 2015 | **CC BY 3.0** | Directly adaptable with attribution. Already integrated into `hearth-pedagogy-corpus-unschooling-v1.md` SE-US-001 |
| "Grown Unschoolers' Experiences with Higher Education and Employment: Report II" | 2015 | **CC BY 3.0** | Directly adaptable with attribution |

The CC BY 3.0 papers can be paraphrased, adapted, and integrated into the Observational Markers and Source Excerpts layers immediately, with no rights conversation. They are the empirical anchor of the Unschooling corpus and they are free.

Peter Gray's *Psychology Today* "Freedom to Learn" columns are owned by Sussex Publishers (all rights reserved on the platform), but Gray himself can potentially be approached directly for permission to use his blog content in Hearth.

### 6.4 Recommended Engagement Sequence

1. **Within the next two weeks:** Reach out to **Pam Laricchia** (livingjoyfully.ca contact) and **Sue Elvis** (storiesofanunschoolingfamily.com) simultaneously with a clear scoping note. Frame: Hearth is an Australian homeschool platform building a structured pedagogy knowledge base; we want to commission you to author the operational substance of the Unschooling corpus; we have a structural template ready (`hearth-pedagogy-corpus-unschooling-v1.md`); we are looking for [N] Practice Patterns, [N] Worked Examples, [N] Source Excerpts at [agreed rate]; we will publish your name as the named author of these layers; you retain right to republish your contributions on your own platforms.
2. **Within the same window:** Reach out to **Sue Patterson** (unschoolingmom2mom.com) as an alternative or complement to Laricchia, depending on Laricchia's response and availability.
3. **Within 30 days:** Reach out to **Freya Dawson** (freyadawson.com.au) specifically for Australian registration / regulatory content, in case Sue Elvis is unavailable or wants to share that workload.
4. **Optional, after commissioned content is largely complete:** Reach out to **Pat Farenga** (johnholtgws.com/contact) for HoltGWS-controlled titles, and to Hachette permissions for the Hachette-controlled Holt titles, if direct foundational quotations are still wanted.
5. **Optional, parallel to all of above:** Reach out to **Peter Gray** directly via petergray.org for permission to quote his blog content — likely favourable response given mission alignment.

### 6.5 Pricing Anchors

No public precedents for edtech licensing of unschooling content exist. Pricing must be inferred from adjacent signals:

- Sue Patterson's $75/half hour coaching rate (≈ $150/hour direct)
- Pam Laricchia's paid membership community and course sales (commercially sophisticated; would have her own quote)
- Standard work-for-hire rates for educational content commissioning ($0.50–$2.00 per word for experienced practitioners; structured framework documents typically commissioned at flat-fee per piece, $300–$2,000 per substantial entry depending on scope and author profile)

**Estimated total commissioning budget for a v2 Unschooling corpus** (~30 Practice Patterns and Worked Examples authored fresh, plus refinement of existing v1 entries): **AUD $10,000–$25,000**, depending on chosen author and depth of engagement. This is not cheap, but it produces a corpus that is legally clean, contemporary, contributable, and uniquely Hearth's — and it avoids the open-ended legal exposure of relying on dated copyrighted texts via fair dealing arguments that don't apply.

For comparison: a single licensing conversation with Hachette for, say, 25 short Holt excerpts could realistically cost AUD $3,000–$10,000 with no guarantee of approval, no operational content (only foundational quotes), and no Australian context.

### 6.6 What This Replaces

This strategy completely replaces v1's "Option A / Option B / Option C" Holt-focused framing. Holt licensing is now strictly secondary and optional. The commissioning-first approach is the recommended path.

---

## 7. Priority Summary (Updated)

| Priority | Action | Why | Cost | Timeline |
|---|---|---|---|---|
| 1 | **CM Wave 1 full corpus authoring** | v1 shipped, expansion ready | £0 | In progress |
| 2 | **Wave 2 Classical from PD foundations** | Plato through Comenius is more than enough | £0 | After CM full |
| 3 | **Wave 3 Montessori from pre-1929 translations** | Foundational concepts all covered | £0 | After Classical |
| 4 | **Wave 4 Waldorf from 1911 Rajput translation** | Foundational text PD, no licensing | £0 | After Montessori |
| 5 | **Wave 5 Unschooling — commission Pam Laricchia or Sue Patterson** | Primary Unschooling strategy. Contemporary, structured, commercially deliverable. | AUD $10,000–$25,000 | Begin reach-out within two weeks |
| 6 | **Wave 5 Unschooling — commission Sue Elvis for Australian content** | Essential for AU regulatory authority. | AUD $2,000–$5,000 estimate | Parallel with #5 |
| 7 | **Adapt Gray & Riley CC BY 3.0 papers** | Free immediate evidence base for Wave 5 | £0 | Already done in unschooling-v1 |
| 8 | Optional: License Sayers "Lost Tools" via David Higham | Modern Classical voice enhancement | £300–£1,500 | After Classical v1 drafted |
| 9 | Optional: Approach Pat Farenga / HoltGWS | Direct foundational Holt quotes | $500–$3,000 estimate | After Unschooling commissioned content done |
| 10 | Optional: Approach Hachette for Holt titles | Direct quotes from canonical Holt | $3,000–$10,000 estimate | After #9 |
| 11 | Optional: Approach Peter Gray directly | Psychology Today blog content | $0–$1,000 honorarium | Anytime |

**Essential spend to ship all six pedagogies at v1 quality:** £0 + AUD $12,000–$30,000 (Wave 5 commissioning).

**Optional enhancements:** an additional £500–£15,000 depending on which licensing conversations are pursued.

The single biggest change from v1: Wave 5 is no longer "free" — it costs real money in the form of commissioning. But the alternative was a Wave 5 corpus built from Holt paraphrases that would have been operationally weaker and would still have triggered eventual licensing decisions. Spending the commissioning budget is the cleaner strategic move and produces a higher-quality corpus.

---

## 8. Contact Sheet (Practical Reference)

**Unschooling commissioning candidates:**

- Pam Laricchia — livingjoyfully.ca/contact
- Sue Patterson — unschoolingmom2mom.com (coaching contact)
- Joyce Fetteroll — joyfullyrejoycing.com (verify activity level first)
- Sue Elvis — storiesofanunschoolingfamily.com
- Sara Macdonald — happinessishereblog.com
- Freya Dawson — freyadawson.com.au
- Beverley Paine — homeschoolaustralia.com

**Holt rights conversations (if pursued later):**

- Hachette Book Group permissions: permissions.Generic@hbgusa.com
- HoltGWS LLC / Pat Farenga: johnholtgws.com/contact

**Other rights holders for reference:**

- Sayers estate / Classical: David Higham Associates, UK (davidhigham.co.uk)
- Montessori-Pierson Publishing: montessori-pierson.com (Amsterdam)
- Marion Boyars Publishers / Illich: acquired by Equinox Publishing 2024 (Janet Joyce, jjoyce@equinoxpub.com)
- A. S. Neill / *Summerhill*: St. Martin's Griffin / Macmillan permissions
- John Taylor Gatto: estate contact unclear; New Society Publishers for *Dumbing Us Down*

---

*Supersedes `hearth-pedagogy-corpus-licensing-needs-v1.md`. v1 should be added to the superseded files table in COMPONENT_REGISTRY.md.*
