/**
 * Seeds the 15 canonical v2 capability domains into Sanity.
 *
 * Source: hearth-capability-universe-v2-architecture-spec-v1.md
 *   - §2 (domain architecture)
 *   - §2.2 (per-domain rationale and editorial summaries)
 *   - §3.1 (SuperDomainKey union)
 *   - §3.2 (Domain data model)
 *
 * Run order: this script MUST run BEFORE seed-capability-threads.ts.
 *
 * Idempotent: createOrReplace with deterministic IDs of the form
 *   capabilityDomain.{camelCaseKey}
 *
 * Usage:
 *   SANITY_API_TOKEN=<write-token> npx tsx scripts/seed-capability-domains.ts
 *
 * Reconciled: this is the spec-canonical Opus version (kebab-case
 * SuperDomainKey union per §3.1, full §3.2 field shape). It supersedes the
 * earlier PR #46 version, which used non-spec super-domain keys
 * (literacySymbolic | …) and a thinner domain shape. Field shape is the
 * conformance contract for src/sanity/schemas/capabilityDomain.ts.
 */

import { createClient } from '@sanity/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? process.env.SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? process.env.SANITY_DATASET ?? 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

// ─── Super-domain taxonomy (spec §3.1 SuperDomainKey union) ─────────────
type SuperDomainKey =
  | 'foundations'
  | 'cultural-inheritance'
  | 'classical-disciplines'
  | 'aesthetic-expression'
  | 'practical-vocational'
  | 'human-formation';

// ─── Domain definitions (spec §2.1 + §2.2) ──────────────────────────────
interface DomainSeed {
  key: string;
  numericId: number;
  name: string;
  shortName: string;
  superDomain: SuperDomainKey;
  summary: string;
  whatItIsNot: string;
  exampleObservations: string[];
  optIn?: boolean;
}

const DOMAINS: DomainSeed[] = [
  // ── Foundations (Domains 1–4) ────────────────────────────────────────
  {
    key: 'languageLiteracy',
    numericId: 1,
    name: 'Language & Literacy',
    shortName: 'Language',
    superDomain: 'foundations',
    summary:
      'The capabilities of a fluent reader, listener, writer, and speaker — phonological awareness, decoding, fluency, comprehension, written expression, oral expression, grammar and conventions, spelling, vocabulary.',
    whatItIsNot:
      'Classical languages live in Domain 7. Literary engagement as art and tradition lives in Domain 6. Communication-as-relation lives in Domain 14.',
    exampleObservations: [
      'Sounded out unfamiliar words in a chapter book without prompting',
      'Wrote a thank-you note unprompted using correct sentence structure',
      'Adjusted vocabulary when explaining a concept to a younger sibling',
    ],
  },
  {
    key: 'mathematicalThinking',
    numericId: 2,
    name: 'Mathematical Thinking',
    shortName: 'Maths',
    superDomain: 'foundations',
    summary:
      'Number sense, place value, operations, fractions, decimals, ratio, proportion, algebraic thinking, geometric reasoning, measurement, statistics, probability, mathematical proof. Stage-bands extend through tertiary calculus, linear algebra, and discrete mathematics.',
    whatItIsNot:
      'Formal mathematical logic at tertiary crosses into Domain 8. Applied measurement in physical making crosses into Domain 12.',
    exampleObservations: [
      'Partitioned 47 as "four tens and seven ones" without manipulatives',
      'Worked out change from $10 mentally during a shop visit',
      'Sketched a scale drawing of the back garden using a tape measure',
    ],
  },
  {
    key: 'scientificThinking',
    numericId: 3,
    name: 'Scientific Thinking',
    shortName: 'Science',
    superDomain: 'foundations',
    summary:
      'Observation, classification, experimentation, hypothesis, the scientific method, biological systems, physical systems, earth systems, chemistry, scientific communication. Understanding as the goal — distinct from technology, which is making.',
    whatItIsNot:
      'Technology and engineering live in Domain 4. Nature engagement as devotional practice crosses into Domain 13.',
    exampleObservations: [
      'Noticed and named the phases of the moon over a fortnight',
      'Hypothesised why one seed sprouted faster than another and tested it',
      'Explained why ice floats using density language',
    ],
  },
  {
    key: 'technologicalFluency',
    numericId: 4,
    name: 'Technological Fluency',
    shortName: 'Technology',
    superDomain: 'foundations',
    summary:
      'Computational thinking, digital literacy, coding, engineering design thinking, system design, computer hardware understanding, data literacy at the algorithmic level. v2 new — modern life requires it and AC v9 increasingly recognises it.',
    whatItIsNot:
      'Hand-tool mastery lives in Domain 12. Mathematical reasoning over data without computational tooling lives in Domain 2.',
    exampleObservations: [
      'Sequenced block-based instructions to navigate a maze',
      'Identified that a digital simulation gave the wrong answer and explained why',
      'Sketched a paper prototype before building a Lego mechanism',
    ],
  },

  // ── Cultural Inheritance (Domains 5–6) ───────────────────────────────
  {
    key: 'historicalCivicGeographic',
    numericId: 5,
    name: 'Historical, Civic & Geographic Understanding',
    shortName: 'History & Place',
    superDomain: 'cultural-inheritance',
    summary:
      'Chronological thinking, the long story of human history, civic and political life, geographic reasoning, place understanding, current events, ethics-in-history. History and geography studied together because geography is where history happens.',
    whatItIsNot:
      'Personal ethical reasoning lives in Domain 13. Literary engagement with historical narrative lives in Domain 6.',
    exampleObservations: [
      'Placed five family events on a timeline alongside three world events',
      'Found home, school, and grandparents\' house on a regional map',
      'Asked a thoughtful question about how a war started after a read-aloud',
    ],
  },
  {
    key: 'literaryTradition',
    numericId: 6,
    name: 'Literary & Narrative Tradition',
    shortName: 'Literature',
    superDomain: 'cultural-inheritance',
    summary:
      'The reader\'s relationship with great literature, the storytelling tradition, narrative form, literary criticism, the canon, and the writer\'s apprenticeship to the tradition. Distinct from Language & Literacy: this is being formed by what one reads.',
    whatItIsNot:
      'Decoding and reading craft live in Domain 1. Original creative writing-as-craft also lives in Domain 1.',
    exampleObservations: [
      'Retold a fairy tale in own words preserving structure and motifs',
      'Compared two versions of a myth and noticed what one chose to keep',
      'Recommended a book to a friend with reasons from character and theme',
    ],
  },

  // ── Classical Disciplines (Domains 7–9) ──────────────────────────────
  {
    key: 'classicalLanguages',
    numericId: 7,
    name: 'Classical Languages',
    shortName: 'Classical',
    superDomain: 'classical-disciplines',
    summary:
      'Latin, Greek, Hebrew, and the broader practice of engaging with languages whose primary purpose is access to historic textual traditions rather than contemporary communication. Each language is a strand within this domain, not a sub-domain.',
    whatItIsNot:
      'Modern language acquisition for communication lives in Domain 1 (v2) or in a future modern-languages domain.',
    exampleObservations: [
      'Identified the Latin root aqua in three English derivatives',
      'Read aloud a short Latin sentence with correct stress',
      'Translated a single sentence from a Latin primer with help',
    ],
  },
  {
    key: 'logicRhetoric',
    numericId: 8,
    name: 'Logic & Rhetoric',
    shortName: 'Logic & Rhetoric',
    superDomain: 'classical-disciplines',
    summary:
      'Formal logic (syllogisms, fallacies, propositional and predicate logic at higher stages), informal reasoning, dialectic and argumentation, rhetorical forms, persuasive composition, oratory. The Trivium\'s logic and rhetoric stages.',
    whatItIsNot:
      'Mathematical algebra and proof live in Domain 2. Persuasion-as-writing-craft also lives in Domain 1.',
    exampleObservations: [
      'Identified a false-cause fallacy in an advertisement',
      'Constructed a short argument with a stated reason and evidence',
      'Recited a memorised passage with deliberate phrasing and pace',
    ],
  },
  {
    key: 'theologyScripture',
    numericId: 9,
    name: 'Theology & Scriptural Literacy',
    shortName: 'Theology',
    superDomain: 'classical-disciplines',
    summary:
      'Engagement with sacred texts, doctrinal understanding, catechesis, ethical reasoning grounded in religious tradition, the history of religious thought. Opt-in at family level. Threads inside are tradition-specific.',
    whatItIsNot:
      'General ethical reasoning lives in Domain 13. Comparative-religion history lives in Domain 5.',
    exampleObservations: [
      'Recited the Lord\'s Prayer with comprehension of its petitions',
      'Retold a Gospel parable in own words and offered an interpretation',
      'Connected a verse to a moment in the family\'s week',
    ],
    optIn: true,
  },

  // ── Aesthetic Expression (Domains 10–11) ─────────────────────────────
  {
    key: 'visualPlasticArts',
    numericId: 10,
    name: 'Visual & Plastic Arts',
    shortName: 'Visual Arts',
    superDomain: 'aesthetic-expression',
    summary:
      'Drawing, painting, sculpture, printmaking, photography, design, architectural appreciation, visual art history, picture study, art criticism.',
    whatItIsNot:
      'Performative and time-based art forms live in Domain 11. Hand-craft for functional making lives in Domain 12.',
    exampleObservations: [
      'Drew a sustained observational study of a leaf showing veining and edge',
      'Discussed a painting using vocabulary of colour and composition',
      'Critiqued own work and revised one element deliberately',
    ],
  },
  {
    key: 'musicalPerformative',
    numericId: 11,
    name: 'Musical & Performative Arts',
    shortName: 'Music & Performance',
    superDomain: 'aesthetic-expression',
    summary:
      'Music (singing, instrumental performance, music theory, music appreciation, composition), drama and theatre, dance, recitation, oral storytelling, hymnody. The performative and embodied arts.',
    whatItIsNot:
      'Static visual arts live in Domain 10. Literary engagement with poetry lives in Domain 6; recitation and performative poetry lives here.',
    exampleObservations: [
      'Sang a song from memory with steady pitch and rhythm',
      'Performed a short scene with deliberate voice and gesture',
      'Recited a memorised poem with phrasing that respects the meaning',
    ],
  },

  // ── Practical & Vocational (Domain 12) ───────────────────────────────
  {
    key: 'practicalMastery',
    numericId: 12,
    name: 'Practical Mastery',
    shortName: 'Practical',
    superDomain: 'practical-vocational',
    summary:
      'Handwork (knitting, sewing, weaving, hobby-grade woodwork), domestic arts (cooking, baking, food preservation, household management), gardening, basic repair and maintenance, tool use and care, traditional crafts.',
    whatItIsNot:
      'Trades-grade vocational competence reserved for v3+ admissions. Visual-art making lives in Domain 10. Athletic body work lives in Domain 15.',
    exampleObservations: [
      'Threaded a needle and sewed a button on independently',
      'Followed a written recipe from start to finish with light supervision',
      'Identified the right tool for a small repair and used it correctly',
    ],
  },

  // ── Human Formation (Domains 13–15) ──────────────────────────────────
  {
    key: 'personalEthical',
    numericId: 13,
    name: 'Personal & Ethical Formation',
    shortName: 'Personal',
    superDomain: 'human-formation',
    summary:
      'The inner formation of the learner — sustained attention, working memory, self-regulation, persistence, will, the formation of virtues, self-knowledge, moral reasoning at the personal level, conscience, vocational awareness.',
    whatItIsNot:
      'Interpersonal relating lives in Domain 14. Embodied capability lives in Domain 15. Formal moral philosophy at tertiary crosses into Domain 8.',
    exampleObservations: [
      'Sustained attention to a self-chosen task for thirty minutes without supervision',
      'Recovered from a setback in a project after a calming break',
      'Articulated a personal goal and a small step toward it',
    ],
  },
  {
    key: 'socialRelational',
    numericId: 14,
    name: 'Social & Relational Formation',
    shortName: 'Social',
    superDomain: 'human-formation',
    summary:
      'Cooperation and collaboration, communication-as-relation, conflict resolution, empathy and perspective-taking, friendship and peer relations, family belonging, community participation, hospitality.',
    whatItIsNot:
      'Communication-as-craft (clarity, precision, written form) lives in Domain 1. Self-regulation that supports relating lives in Domain 13.',
    exampleObservations: [
      'Resolved a disagreement with a sibling without adult intervention',
      'Welcomed a guest and made them feel comfortable',
      'Took the lead in a shared task and adjusted when a peer wanted a different approach',
    ],
  },
  {
    key: 'physicalEmbodied',
    numericId: 15,
    name: 'Physical & Embodied Capability',
    shortName: 'Physical',
    superDomain: 'human-formation',
    summary:
      'Health and bodily knowledge, fundamental movement, sport and athletic capability, outdoor capability and bushcraft, embodied awareness (proprioception, balance, breath), physical courage and risk competence, manual dexterity at the body level.',
    whatItIsNot:
      'Tool-specific dexterity (sewing, woodwork) lives in Domain 12. Cooperation in team-sport contexts crosses into Domain 14.',
    exampleObservations: [
      'Climbed a tree to a sensible height and came down without help',
      'Held a balance pose steadily for twenty seconds',
      'Recovered breath after a sprint and resumed a game',
    ],
  },
];

// ─── Sanity document construction ───────────────────────────────────────
function toSanityDoc(domain: DomainSeed) {
  return {
    _id: `capabilityDomain.${domain.key}`,
    _type: 'capabilityDomain',
    numericId: domain.numericId,
    name: domain.name,
    shortName: domain.shortName,
    slug: { _type: 'slug', current: domain.key },
    superDomain: domain.superDomain,
    summary: domain.summary,
    whatItIsNot: domain.whatItIsNot,
    exampleObservations: domain.exampleObservations,
    optIn: domain.optIn ?? false,
    introducedInVersion: '2.0.0',
    status: 'active',
  };
}

// ─── Run ────────────────────────────────────────────────────────────────
async function run() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('SANITY_API_TOKEN is required.');
    process.exit(1);
  }

  console.log(`Seeding ${DOMAINS.length} canonical v2 capability domains...`);

  const transaction = client.transaction();
  for (const domain of DOMAINS) {
    transaction.createOrReplace(toSanityDoc(domain));
  }

  try {
    const result = await transaction.commit();
    console.log(`✓ Committed ${result.results.length} domain documents.`);
    const bySuper = DOMAINS.reduce<Record<string, number>>((acc, d) => {
      acc[d.superDomain] = (acc[d.superDomain] ?? 0) + 1;
      return acc;
    }, {});
    console.log('  Super-domain distribution:');
    for (const [k, n] of Object.entries(bySuper)) {
      console.log(`    ${k}: ${n}`);
    }
    console.log('\nNext: npx tsx scripts/seed-capability-threads.ts');
  } catch (err) {
    console.error('✗ Seed failed:', err);
    process.exit(1);
  }
}

run();
