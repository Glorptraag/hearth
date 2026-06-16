<!-- Version: 1 | Date: 2026-04-11 | Changes: Initial architecture spec. Shifts pedagogy treatment from thin framework definitions to structured knowledge base corpora with retrieval-augmented write-time AI. Supersedes sections 7-8 of hearth-pedagogy-engine-spec-v1.md and adds new Sanity document types. Resolves open questions on storage, scope, and sequencing per Drew's 2026-04-11 direction. -->

# Hearth Pedagogy Knowledge Base — Architecture Specification

> **Status:** Canonical. Supersedes sections of `hearth-pedagogy-engine-spec-v1.md` and `hearth-pedagogy-integration-framework.md` concerning runtime pedagogy interpretation.
> **Related:** `hearth-pack-data-architecture-v1.md` (adds new content types), `hearth-alpha-use-case-verification-v1.md` (UC5 two-layer AI, UC6 pedagogy overlays).
> **Priority:** HIGH — blocks the next iteration of the Pedagogy Engine and the write-time enrichment service.

---

## 1. The Problem This Solves

Hearth's current pedagogy model treats each of the six philosophies (Charlotte Mason, Classical, Montessori, Waldorf/Steiner, Unschooling, Eclectic) as a thin styling layer. Each lives in Sanity as a `pedagogicalFramework` document with roughly seven fields: title, description, keyPrinciples, parentRole, and a few others. This is enough to filter Activity Discovery or apply vocabulary swaps, but it is not enough to carry the weight the platform asks of it.

The consequence shows up once packs are well-built: the packs are the same for every family, and the pedagogy is the only thing differentiating the experience. When that differentiation is just a few hundred words of framework definition fed to Haiku as prompt context, the AI produces a gloss of a tradition — not an interpretation grounded in the tradition. The "Charlotte Mason lens" on a Logger entry ends up being a sprinkling of CM vocabulary rather than something a CM practitioner would recognise as their own. The pentagon of pedagogies flattens into a palette of adjectives.

The fix is structural, not cosmetic. Each pedagogy needs its own substance — a curated, tagged, retrieval-ready corpus dense enough that AI calls become retrieval-and-synthesis against real source material, not riffs on a style guide. That is what this document specifies.

This is the thick layer Drew identified as missing. It is also a long-term retention play: once the knowledge base exists, a Pedagogy Wiki, a Settings-based reading path into the family's tradition, and a richer onboarding wizard all fall out of the same corpus with no additional architectural work.

---

## 2. Guiding Principles

**Pedagogies are knowledge domains, not style tags.** Each philosophy is a body of thought with primary sources, practice patterns, observational commitments, and worked examples. Hearth's job is to make that body of thought usable at the right moments in a parent's day, not to approximate it from a framework summary.

**Retrieval, not riff.** Write-time AI enrichment retrieves specific, relevant chunks from the knowledge base and synthesises from them. The prompt context shifts from ~200 tokens of framework bullet points to ~2000 tokens of actual source material tagged as relevant to this entry's capability threads, age, and activity type. Hallucination drops because the model is grounded in quoted, attributed text. Quality rises because the synthesis is on top of real thought, not a summary of a summary.

**No new runtime LLM calls.** The write-time Haiku call is extended with a retrieval preamble; read-time screens still consume pre-computed snapshots. UC5 (two-layer AI) holds. The only new operational cost is an embedding index lookup, which is cheap PG work.

**Human-authored or human-confirmed.** Source excerpts are authored by hand from attributed public domain texts or from licensed/paraphrased contemporary sources. Worked examples are hand-written. Practice patterns are hand-written. AI assists in drafting but never publishes without human review. This is the same quality gate as pedagogy overlays per `hearth-pack-data-architecture-v1.md` PDA9.

**Corpora build in parallel with packs.** This work does not block Starter Pack v3 or Jumpstart Classical content authoring. The knowledge base is a parallel workstream that becomes active once Charlotte Mason is seeded.

**Pedagogies that cannot be represented with integrity are deferred.** If a pedagogy's primary sources cannot be licensed and cannot be authentically reconstructed from public domain material, it does not get a shallow corpus as a placeholder. It either ships with full depth or it ships in a later wave.

---

## 3. The Six Layers of a Pedagogy Corpus

Each pedagogy, once fully built, comprises six structured layers. The layers are separate Sanity document types with their own schemas. They exist as separate types precisely so retrieval can target the right layer for the right context — a Logger entry needs different material than a Module Prep panel, which needs different material than a Settings reading path.

### 3.1 Source Excerpts (target: ~50 per pedagogy)

Short, attributed passages from the tradition's primary literature. Each excerpt is a standalone retrieval unit: typically 2–6 sentences, always with full bibliographic attribution including volume and page where applicable.

Every excerpt is tagged with:

- `pedagogyKey` — which tradition
- `themes` — e.g., "narration", "concentration", "rhythm", "interest", "habit", "authority", "observation", "living-books"
- `appliesAtAges` — age range where the excerpt's guidance is most relevant
- `capabilityThreadRelevance` — which of Hearth's capability threads this excerpt speaks to
- `situationalRelevance` — what kind of Logger entry or module context this would usefully surface during (e.g., "child resisted the activity", "child achieved unusual focus", "parent feels the day was unproductive")
- `sourceAttribution` — full citation, including public domain status and URL if available

The point of the tagging is that when a Logger entry comes in about a five-year-old who narrated a story back to her mother after a nature walk, the retrieval step can pull two or three excerpts from Mason's own writings on narration from that specific age range — not from a framework summary of what narration is.

### 3.2 Practice Patterns (target: ~15 per pedagogy)

Structured operational entries describing how the tradition handles a specific situation. Not vocabulary — patterns. Each pattern is authored as a short document (roughly 200–400 words) with fields for trigger, tradition's response, example, and anti-pattern (what the tradition explicitly warns against doing in this situation).

Example trigger categories:

- Child resists a planned activity
- Child becomes obsessed with a single topic
- Parent feels burned out or inadequate
- Sibling friction during shared learning
- Child produces work the parent finds disappointing
- Child appears to have "regressed" on a previously mastered skill
- Child asks a question the parent cannot answer
- Unexpected long absence from the planned curriculum
- Child is bored
- Child is overstimulated

Each pedagogy answers these differently, from within its own frame. A Practice Pattern for "child resists" in the Charlotte Mason tradition references habit of attention, short lessons, and the role of will. The same trigger in the Montessori tradition references the prepared environment, whether the work matches the sensitive period, and the role of observation before intervention. The same trigger in Unschooling references strewing, the role of deschooling, and trust.

Practice Patterns are the single highest-value retrieval target for the Logger insight panel. When an entry signals one of these triggers, the corresponding pattern is pulled into the prompt context as operational guidance the tradition itself has authored.

### 3.3 Observational Markers (target: 6 per pedagogy, structured)

What the tradition actually looks for as evidence of learning. This is the layer that makes the Capabilities Constellation feel different between a CM family and a Montessori family even though the underlying capability threads are the same.

Each marker is a tagged document with:

- `markerName` — e.g., "quality of narration", "concentration cycle duration", "spontaneous self-correction", "imitative play sequences", "interest persistence across days"
- `pedagogyKey`
- `whatItIndicates` — short prose explaining what the tradition reads this signal as meaning about learning or development
- `capabilityThreadMapping` — which of Hearth's capability threads this marker contributes evidence toward
- `sourceReferences` — links to specific Source Excerpts that ground the marker

Observational Markers are read-time material. They do not require LLM calls — they are pre-tagged mappings between the tradition's own evidence priorities and Hearth's capability thread system. A CM family's Constellation view highlights capability thread progress that CM markers read as significant; a Montessori family's Constellation highlights the same threads but surfaces different markers as "things you'd notice if you were paying Montessori attention."

### 3.4 Facilitation Vocabulary (target: 1 structured doc per pedagogy)

The operational grammar of how the parent intervenes, drawn from the tradition's own language. This is a single document per pedagogy but with a fairly rich internal structure — verbs the tradition uses for what the parent does ("prepare the environment", "set the feast", "give the lesson", "strew", "observe without interrupting"), characteristic restraints ("withdraw after presentation", "do not fill the silence after a narration", "wait for the sensitive period"), and example micro-scripts showing how a parent following this tradition actually speaks to the child during and after an activity.

This is what today's `pedagogicalFramework` document is an impoverished version of. The replacement is structured, grounded in source citations, and drafted from the tradition's own phrasing rather than from a modern paraphrase of it.

### 3.5 Contraindications and Tensions (target: ~8 per pedagogy)

What the tradition explicitly warns against and — honestly — where it differs from other traditions Hearth supports. This layer matters because it's what lets the AI say genuinely tradition-grounded things. Without it, every pedagogy's output collapses into "this is great, try more of it." With it, a CM interpretation can legitimately say that a particular worksheet-heavy approach would be cautioned against for training attention mechanically rather than through interest, and it can say so because Mason wrote that explicitly.

Each contraindication is a short tagged document naming the practice warned against, the tradition's reasoning, and a Source Excerpt grounding the warning.

The tensions sub-layer is what makes the Eclectic lens work — it's where the knowledge base explicitly flags where traditions disagree with each other, so that Eclectic families see honest multi-lens interpretations rather than a homogenised average.

### 3.6 Worked Examples (target: ~20 per pedagogy)

Real or composite Logger-style entries with the tradition's authentic interpretation written out in full. These are the single most important retrieval anchors in the knowledge base. They teach the AI how this tradition reads a moment.

Each worked example includes:

- An anonymised or composite Logger entry scenario (2–4 sentences describing what the child did, how the parent facilitated, what was observed)
- Tagged with age range, capability threads touched, activity type
- A 3–6 sentence interpretation written in the tradition's own voice, naming what the tradition notices as significant and why, and what it would suggest as a next step
- Source citations supporting the interpretation

When a real Logger entry comes in that matches a worked example by age, capability thread, and activity type, that worked example is pulled into retrieval as a grounded reference. The Haiku prompt then has something much stronger than a framework summary to synthesise from: it has a concrete example of how a human practitioner of this tradition interpreted a similar moment, plus the reasoning behind that interpretation.

---

## 4. Storage Architecture

Per Drew's direction on 2026-04-11, the clean split is:

**Sanity CMS** holds the authored documents. All six layers live as Sanity document types with editorial workflow, publish/draft states, and human review gates. Sanity remains the source of truth. Content authors and Drew work in Sanity Studio (the in-app Content Studio was retired #117). This is the same authoring surface used for pack content.

**PostgreSQL with `pgvector`** holds the embedding index. When a Sanity document is published, a webhook triggers an embedding job that computes vectors over the document's retrievable text and stores them in a `pedagogy_knowledge_chunks` table keyed by Sanity document ID. This table is the runtime retrieval target.

**Write-time retrieval service** is a new server module that accepts a Logger entry's context (pedagogy key, capability threads, age range, activity type, situational signals) and returns the top-N most relevant chunks across all layers. "Top-N" is typically 5–8 chunks spanning two or three layers — for example, one Practice Pattern matching the situational trigger, two Source Excerpts matching capability threads and age, one Worked Example matching activity type.

The retrieval service is the only new piece of runtime infrastructure. Everything downstream of it is the existing write-time Haiku enrichment pipeline, with an expanded prompt context.

### Data Flow at Write-Time

```
Logger save
    ↓
Existing entry context assembly (unchanged)
    ↓
NEW: Pedagogy retrieval step
    - Input: pedagogy_key from family profile, capability thread suggestions,
             learner age, activity type, situational signals from entry text
    - Query: pgvector similarity search over pedagogy_knowledge_chunks
    - Filter: chunks matching pedagogy_key
    - Output: top-N chunk IDs with their attributed source text
    ↓
Existing Haiku call (prompt now includes retrieved chunks as context)
    ↓
Enrichment written to Postgres (entries table)
    ↓
FIS rebuild queued (async, existing pattern)
```

### Schema Additions

New Sanity document types (field names follow `hearth-sanity-document-json-reference-v1.md` conventions):

- `pedagogySourceExcerpt`
- `pedagogyPracticePattern`
- `pedagogyObservationalMarker`
- `pedagogyFacilitationVocabulary`
- `pedagogyContraindication`
- `pedagogyWorkedExample`

All six reference the existing `pedagogicalFramework` document by `pedagogyKey`. The existing `pedagogicalFramework` doc becomes a parent/index document rather than the sole carrier of the pedagogy's substance.

New PostgreSQL table (rough shape; implementation left to schema architect):

```
pedagogy_knowledge_chunks
  id                  text  -- derived from Sanity doc id
  pedagogy_key        text
  layer               text  -- 'source_excerpt' | 'practice_pattern' | ...
  text                text  -- the chunked retrievable text
  embedding           vector(1536)  -- OpenAI ada-002 or equivalent
  metadata            jsonb  -- tags: themes, ages, threads, triggers, etc.
  sanity_doc_id       text  -- back-reference
  updated_at          timestamp
```

Sanity-to-PG sync runs on publish webhook. Embedding computation is a one-off per document edit. Re-embedding the entire corpus (e.g., if the embedding model changes) is a batch job.

---

## 5. Integration Points — Where the Corpus Surfaces

The knowledge base changes how five existing surfaces feel without requiring architectural changes to any of them. It also enables two new surfaces that were previously impractical.

### Write-time Logger enrichment (changed)

The single biggest impact. The AI insights panel on the Logger workspace is now grounded in real retrieved source material. Output quality rises. The same architecture applies to Module Log mode. The write-time Haiku call remains the only LLM call per save; UC5 holds.

### Pedagogy Engine onboarding wizard (enriched)

The wizard can now show real attributed quotes during philosophy selection. A family reading the Charlotte Mason card sees Mason's own words on what education is, not a platform-paraphrased summary. The weight of the selection shifts — it feels like meeting a tradition, not picking a theme.

### Family Settings — "Learn more about your approach" (new surface)

A reading path into the tradition, built from the Source Excerpts layer. The growing-into-it parent has somewhere to go. This is the single most direct answer to the original retention question: what do power users do once they're competent? They deepen. The knowledge base gives them somewhere to deepen into.

### Module Experience facilitation panels (changed)

The "Why This Matters" panel and facilitation guidance in Module Experience can pull a real Practice Pattern relevant to the activity rather than generated copy. Attribution makes the guidance feel like reference material, not content marketing.

### Capabilities Constellation — tradition-specific markers (changed)

The Observational Markers layer lets the Constellation surface tradition-specific interpretations over the same underlying capability thread data. No LLM calls — the markers are pre-tagged mappings. This is the feature that makes the Constellation feel materially different to a CM family vs. a Montessori family.

### HEU/Learning Report gap recommendations (changed)

Gap recommendations are now backed by a Practice Pattern document the parent can click through and read. Defensible, attributable, not riffed.

### Pedagogy Wiki (new surface, Phase 3)

Once the corpora exist, a browsable parent-facing wiki is mostly built — it's a read-only view of the same knowledge base the retrieval service reads. This was on the long-term roadmap as a power-user retention play; the knowledge base architecture makes it nearly free to ship.

---

## 6. Scope and Sequencing

### v1 Scope Per Pedagogy

Target counts for a "full" pedagogy corpus:

| Layer | Target | Notes |
|---|---|---|
| Source Excerpts | ~50 | Minimum ~30 to be usable |
| Practice Patterns | ~15 | Minimum ~10 to cover core triggers |
| Observational Markers | 6 | Structured, not approximate |
| Facilitation Vocabulary | 1 rich doc | Structured internal fields |
| Contraindications | ~8 | Honest, including cross-tradition tensions |
| Worked Examples | ~20 | Minimum ~12 to be usable |

Total: approximately 100 documents per pedagogy at full depth.

### Sequencing

**Wave 1 — Charlotte Mason (immediate, starting now).**

CM has the deepest public domain corpus of any of Hearth's six pedagogies and the largest natural overlap with the Starter Pack's texture. Mason's complete six-volume *Home Education* series is public domain worldwide; every volume is available on Project Gutenberg with verified attribution.

The proof-of-concept CM corpus (`hearth-pedagogy-corpus-charlotte-mason-v1.md`) is delivered alongside this spec with real attributed excerpts across all six layers, at roughly 30% of target volume. This is enough to prove the retrieval architecture end-to-end. Full CM corpus (~100 docs) is a content-authoring sprint that runs in parallel with Starter Pack v3 content revision.

**Wave 2 — Classical.**

Classical education's primary sources are a mix. The ancient and medieval foundations (Plato's *Republic*, Aristotle, Quintilian's *Institutio Oratoria*, Augustine, Aquinas, Erasmus, Comenius) are all unambiguously public domain. The modern articulation of classical education (Sayers' "The Lost Tools of Learning", Susan Wise Bauer, Andrew Kern, Doug Wilson) is in copyright and needs licensing or paraphrased interpretation. See the licensing needs document.

Classical is Wave 2 because Jumpstart Classical content authoring is already in the queue, and the corpora can be built by the same authors working against the same sources. Economies of attention.

**Wave 3 — Montessori.**

Montessori's pre-1929 English works — *The Montessori Method* (1912), *Dr. Montessori's Own Handbook* (1914), *Spontaneous Activity in Education* (1917), *Pedagogical Anthropology* (1913), *The Advanced Montessori Method* (1917) — are public domain in the US and in most other jurisdictions under the life+70 rule (she died 1952, so her full corpus became PD in most of the world in 2023). These pre-1929 works contain almost all the foundational Montessori concepts: prepared environment, sensitive periods, work cycle, self-correction, practical life, sensorial materials. Post-1929 works (*The Absorbent Mind*, *The Secret of Childhood*) are controlled by Montessori Pierson Publishing and need licensing if quoted. See the licensing needs document.

**Wave 4 — Waldorf/Steiner.**

Steiner's "The Education of Children from the Standpoint of Theosophy" (Chicago, 1911, Rajput Press, English translation by W. B.) is public domain and is the foundational text for Waldorf education. His 1919 founding lectures for the first Waldorf school (*The Foundations of Human Experience*, *Practical Advice to Teachers*, *Discussions with Teachers*) are pre-1929 US publications and PD in the US; they are PD worldwide under life+70 (he died 1925). This gives Waldorf a deeper PD source base than might be expected. Modern Waldorf practitioners (Eugene Schwartz, Jack Petrash) need licensing.

**Wave 5 — Unschooling.**

Unschooling has the hardest licensing picture. John Holt (died 1985) — the movement's founder — has all works still in copyright, controlled by Holt Associates / John Holt's Bookstore. A.S. Neill's *Summerhill* (1960) is in copyright. Ivan Illich's *Deschooling Society* (1971) is in copyright. Contemporary practitioners (Sandra Dodd, Pam Sorooshian, Pat Farenga) have some freely available web material under permissive personal-use terms. See the licensing needs document.

Unschooling is Wave 5 because its corpus cannot be built authentically from public domain material alone — at minimum, Holt needs to be licensed or carefully paraphrased with attribution. This is worth doing (unschooling is a significant segment of homeschool families and Hearth's audience) but requires legal steps that the earlier waves do not.

**Eclectic — no separate corpus.**

Eclectic is a meta-lens. It has no primary texts of its own. Its corpus is a retrieval strategy: pull from all other pedagogies' knowledge bases and synthesise, flagging cross-tradition tensions explicitly. No separate authoring work. The retrieval service gains an "eclectic mode" that queries across pedagogies.

### Parallelism with Existing Work

This work does not block or displace:

- Starter Pack v3 content revision (independent workstream)
- Jumpstart Classical authoring (independent, but shares source list with Wave 2 above)
- Admin tooling (Provider Code Management remains the beta-blocking priority)
- Alpha testing of the current build

The knowledge base is additive. The current thin `pedagogicalFramework` documents continue to work until the per-pedagogy corpora are ready to replace them.

---

## 7. Authoring Pipeline

### Corpus Building Workflow

For each pedagogy:

1. **Source inventory.** Identify the corpus of public domain primary texts plus any in-copyright texts that need licensing. Produce a sourcing document (for CM this is trivial; Mason's six volumes on Project Gutenberg. For Unschooling this is more complex; see licensing doc).

2. **Opus-assisted excerpt extraction.** Feed primary texts to an Opus session with instructions to propose candidate Source Excerpts tagged by theme, age, capability thread relevance, and situational applicability. The session produces a draft list of candidates. This is a content QA pipeline task and mirrors the same pattern used for pack content.

3. **Human review and approval.** Drew or a designated content reviewer accepts, modifies, or rejects each candidate. Approved excerpts are pushed to Sanity as `pedagogySourceExcerpt` documents in draft state.

4. **Practice Pattern authoring.** Hand-written by a reviewer who has read deeply in the tradition. Opus can draft from the approved Source Excerpts but the authorial voice needs to belong to someone who knows the tradition. For CM Wave 1, Drew authors directly; for subsequent waves, this can be contracted to a CM/Classical/Montessori practitioner.

5. **Observational Markers, Contraindications, Facilitation Vocabulary.** Hand-authored following the same pattern.

6. **Worked Examples.** Hand-authored. These are the hardest to produce well because they require both domain depth and realistic Logger-entry-shaped scenarios. Composite examples drawn from anonymised alpha-tester entries would be ideal sources once the alpha produces enough data.

7. **Publish to Sanity, trigger embedding, verify retrieval.** Standard content pipeline.

### Quality Gates

- No Source Excerpt publishes without verified attribution (volume, chapter/page, edition, PD/licensed status).
- No Practice Pattern publishes without a tradition-grounded reasoning section.
- No Worked Example publishes without a matched Source Excerpt citation.
- Opus-drafted material is always marked `suggestedDraft: true` until a human confirms publication. This mirrors the existing overlay pipeline quality gate.
- Banned-phrase list from `hearth-alpha-use-case-verification-v1.md` UC6 applies to all generated material.

### Volume Expectations

The full CM corpus (~100 documents) is roughly 3–5 full working days of focused authoring by someone who knows the tradition well, assuming Opus-assisted drafting. Subsequent pedagogies are comparable. The full six-pedagogy build at target depth is roughly 15–25 working days of author-reviewer time plus engineering time for the retrieval service and embedding pipeline.

---

## 8. Relationship to Existing Documents

**Supersedes:**
- `hearth-pedagogy-engine-spec-v1.md` section 7 (runtime consumption) and section 8 (per-screen overlay behaviour) are partially superseded. The Pedagogy Engine still captures the family profile; the consumption side is now driven by the knowledge base rather than by framework document injection. The spec needs a v2 revision once this architecture is implemented.
- `hearth-pedagogy-integration-framework.md` prompt templates section. The templates were designed for framework-definition-in-prompt. They now need to be refactored to accept retrieved chunks as context. Refactor happens as part of retrieval service implementation.

**Extends:**
- `hearth-pack-data-architecture-v1.md` PDA9 (pre-authored overlays). The pedagogy knowledge base is a parallel and complementary content store. Per-activity pedagogy overlays remain a Sanity field on activity documents. The knowledge base is a separate, retrievable layer that overlays can reference or that retrieval can consult when overlays are absent.
- `hearth-alpha-use-case-verification-v1.md` UC5 (two-layer AI) holds exactly. The new retrieval step is a database call, not an LLM call. UC6 (pedagogy question overlays) is complemented but not replaced; overlays remain the per-activity content-time artifact, and the knowledge base provides the deeper context for write-time Logger enrichment.

**New documents introduced alongside this spec:**
- `hearth-pedagogy-corpus-charlotte-mason-v1.md` — proof-of-concept corpus with real PD excerpts across all six layers.
- `archive/hearth-pedagogy-corpus-licensing-needs-v1.md` (archived; superseded by `-v2.md`) — list of in-copyright sources needing licensing for the Montessori, Classical, and Unschooling waves.

---

## 9. Open Items for Later Resolution

These are flagged but do not block starting Wave 1:

1. **Embedding model choice.** OpenAI `text-embedding-3-small` (cheap, capable), `text-embedding-3-large` (better retrieval quality), or a self-hosted open model. Recommendation: start with `text-embedding-3-small`; the corpus is small enough that batch re-embedding against a better model later is trivial.

2. **Retrieval service deployment target.** Next.js API route against Neon directly, or a dedicated microservice. Recommendation: Next.js API route. The operation is a single query, well within serverless budget, and the codebase stays unified.

3. **Pedagogy Wiki surface design.** Listed as a Phase 3 opportunity. Drew to decide whether this gets spec'd in the same wave as the corpus build or deferred to post-alpha.

4. **Content-time overlay regeneration.** Once the CM corpus exists, existing pre-authored overlays on Starter Pack modules could be regenerated at higher quality using the knowledge base. Worth scoping as a v2 pass on the Starter Pack after its v3 content revision lands, not before.

5. **Anonymised alpha entries as Worked Example source.** Alpha-tester Logger entries, with consent and anonymisation, are the best possible source for realistic Worked Examples in Wave 2 onward. Requires a clear opt-in flow and a curation step. Drew to decide whether to add the opt-in to the alpha consent.

---

## 10. Success Criteria

The architecture is working when all of the following hold:

- A CM family and a Montessori family log structurally similar entries and receive materially different AI insights — different in substance, not just vocabulary. The differences are traceable to specific retrieved source material.
- A parent can click through from any AI-generated insight to the Source Excerpt or Practice Pattern that grounded it. Attribution is visible.
- The Capabilities Constellation view for a CM family highlights different observational markers than the same view for the same child under a Montessori profile — without any additional LLM calls.
- A parent in Family Settings can read a curated path of Source Excerpts specific to their chosen tradition, presented as reference material, not as marketing.
- Drew can point to a section of a Mason volume in Project Gutenberg and trace how a specific phrase from that section is shaping a specific insight the parent saw yesterday.
- No new runtime LLM calls have been introduced. UC5 verification still passes.

When these hold, the pentagon is no longer a set of style tags. It is a set of traditions Hearth meaningfully gives parents access to.

---

## Appendix A — Attribution and Quotation Standards

Every Source Excerpt document carries a `sourceAttribution` object with:

- `authorFullName` (e.g., "Mason, Charlotte M.")
- `workTitle` (e.g., "Home Education")
- `volumeOrSeriesInfo` (e.g., "Home Education Series, Volume 1")
- `publisher` and `yearOfPublication` (first edition and the edition quoted)
- `chapterOrSection`
- `pageReference` (inclusive range)
- `copyrightStatus` — one of: `public_domain_worldwide`, `public_domain_us_only`, `licensed`, `paraphrase_with_attribution`
- `sourceUrl` — direct link to Project Gutenberg, Internet Archive, or licensed digital copy
- `retrievedDate`

Quotations from public domain sources may be reproduced at any length consistent with the source; the 15-word limit that applies to copyrighted material does not apply to public domain text. However, excerpt length is kept to 2–6 sentences for retrieval efficiency, not copyright compliance.

Quotations from licensed sources follow the licensing terms. Paraphrased material from in-copyright sources must be structurally and linguistically different from the original, and must always name the source and author.

---

*This document governs the Pedagogy Knowledge Base architecture. Revisions should preserve the two-layer AI principle, the human-authored quality gate, and the attribution standard. Any future work that proposes runtime LLM calls against the knowledge base, or publishing AI-drafted content without human review, must be rejected.*
