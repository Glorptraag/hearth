# cr-cultural-framework — Sourcing & care policy for Indigenous and religious content (DRAFT OUTLINE)

> **NEEDS DREW + EXPERT/COMMUNITY REVIEW — DO NOT TREAT AS FINAL POLICY.**
> Deferred to post-pilot. This is a *scoping outline* to frame the decisions, not
> a finished policy. The final version must be shaped with First Nations
> advisor(s) and, where religious content is involved, with practitioners from
> the relevant traditions. I'm a starting point, not an authority on this.

## Why this exists

Hearth's enrichment path runs parent-written learning entries through an AI model
(Anthropic Haiku, write-time, `src/lib/ai/enrich.ts`) and produces curriculum
mappings, capability-thread tags (including **H6 Cultural Understanding**),
per-child signals, `insight_suggestions`, and warm `journey_observation` text.
Official content packs are authored separately through the **kindling** repo and
written into Sanity.

Both paths can touch culturally and spiritually significant material:

- **First Nations content** — Aboriginal and Torres Strait Islander histories,
  knowledges, Country, language, and practice. The Australian Curriculum V9 makes
  this a cross-curriculum priority, so families *will* log it, and packs *will*
  cover it.
- **Religious content** — many Australian home educators school for faith
  reasons; entries and packs will include scripture, devotional practice, and
  doctrine across multiple traditions.

The risk is not hypothetical. An AI model with no cultural grounding can flatten a
smoking ceremony into "scientific observation," secularise a scripture lesson
into generic "metacognition," misattribute sacred knowledge, or generate
confident text about material it has no standing to interpret. At pilot scale
(10–20 families) the blast radius is small, but the right time to set the policy
is before content packs scale.

## What's already mitigating this (and what isn't)

- **Pilot mitigation (shipping via cr-ai-content-framing):** AI insights get an
  honest "starting point, not a verdict" label and a care note inviting parents
  to trust their own read on culture, faith, and tender material. This is
  honesty + deference, not protection — it does not stop the model generating
  poor framings, it just stops us presenting them as authoritative.
- **Not yet addressed:** the enrichment `SYSTEM_PROMPT` has no cultural-care
  guardrails; there's no sourcing standard for Indigenous/religious content in
  packs; there's no escalation path when a family flags a harmful framing; and
  there's no review gate for packs that carry this material.

## Scope of this policy (when written)

1. **Enrichment-path behaviour** — how the write-time AI should (and shouldn't)
   handle entries touching Indigenous or religious material.
2. **Pack sourcing** — where official content about these topics may come from,
   how it's attributed, licensed, and reviewed before publish.
3. **Care handling** — labelling, parent deference, opt-outs, and escalation.
4. **Governance** — who decides, who reviews, how families give feedback.

## Principles to anchor it (for review, not settled)

**First Nations material** should be governed by established Australian
frameworks rather than invented in-house. The policy should draw on:

- **AIATSIS Code of Ethics for Aboriginal and Torres Strait Islander Research** —
  consent, respect, benefit, accountability.
- **Indigenous Cultural and Intellectual Property (ICIP)** protocols (e.g. Terri
  Janke's *True Tracks* principles) — attribution, consent for use, respect for
  custodianship, no use of sacred/secret knowledge.
- **CARE Principles for Indigenous Data Governance** (Collective benefit,
  Authority to control, Responsibility, Ethics) and the **Maiam nayri Wingara**
  Indigenous Data Sovereignty principles — relevant because enrichment turns
  family-logged cultural activity into stored, processed data.

Practical commitments that likely follow: source only community-authored or
community-authorised materials; attribute custodians; never reproduce sacred or
secret content; treat the family as the authority on their own cultural material;
and engage First Nations advisor(s) before publishing any pack in this space.

**Religious material** should be handled with cross-tradition neutrality
(consistent with Hearth's philosophy-neutral stance): represent a family's faith
in that faith's own terms, never reframe devotional content in secular
developmental language as if that were the "real" meaning, don't adjudicate
doctrine, and source pack content from within or in consultation with the
relevant tradition rather than third-party summaries.

**Shared commitments** across both: honesty that AI output is a starting point
(already shipping); a clear, low-friction way for a family to flag a framing as
wrong or harmful; the ability to suppress AI interpretation on entries a family
marks as culturally or spiritually significant; and human review before any
official pack carrying this material goes live.

## Candidate mechanisms (to evaluate post-pilot)

- A cultural-care section in the enrichment `SYSTEM_PROMPT` instructing the model
  to defer, not interpret, and not secularise when it detects this material — and
  to set `journey_observation` to null rather than risk a poor framing.
- A "this moment is culturally/spiritually significant" flag on an entry that
  suppresses AI interpretive text (keeps logging, drops the reflection).
- A sourcing + attribution checklist gating pack publish for these topics
  (extends the kindling build-mode review gate).
- A named review step with First Nations advisor(s) for relevant packs.
- A family-facing "report a framing" affordance feeding `admin_audit_log`.

## Open questions for Drew

1. Who is the First Nations advisor / review partner, and when do we engage them
   (the policy shouldn't be finalised without that voice)?
2. For the pilot, is the cr-ai-content-framing honesty/deference layer a
   sufficient stopgap, or do we also want the entry-level suppression flag sooner?
3. Should religious-content neutrality be an explicit written policy or is it
   covered well enough by the existing philosophy-neutral content principle?
4. Does any of this gate alpha, or is it all genuinely post-pilot (current
   assumption: post-pilot, with the honesty layer as the interim safeguard)?

## Status

Deferred / post-pilot. Outline only. Not code. Do not treat as approved policy.
