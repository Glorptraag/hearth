/**
 * Seeds the 15 canonical v2 capability domains into Sanity.
 *
 * Source: hearth-capability-universe-v2-architecture-spec-v1.md §2.2
 * Run order: this script MUST run BEFORE seed-capability-threads.ts
 *   (threads carry a required domain reference that resolves to documents
 *    seeded here).
 *
 * Idempotent: uses createOrReplace with deterministic IDs of the form
 *   capabilityDomain.{camelCaseKey}
 *
 * Usage:
 *   SANITY_API_TOKEN=<write-token> npx tsx scripts/seed-capability-domains.ts
 *
 * Field-shape note for Claude Code: this script writes the field names
 * inferred from capabilityDomain.ts in the repo. If the deployed schema
 * uses different field names, adapt the `DomainSeed` interface and the
 * mapping in `toSanityDoc` — do NOT change the _id values, since the
 * thread seed depends on them.
 */

import { createClient } from '@sanity/client';

// ─── Sanity client ──────────────────────────────────────────────────────
// Match the project's existing client setup in scripts/seed-content.ts.
// If that file uses a shared client export, prefer importing it.
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID ?? 'g5zhwbxg',
  dataset: process.env.SANITY_DATASET ?? 'production',
  apiVersion: '2025-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// ─── Super-domain taxonomy ──────────────────────────────────────────────
// Per spec §2.2: 6 super-domains group the 15 domains. Super-domains are
// taxonomic only — they don't render as their own entities in the
// constellation; they exist to inform proximity and routing.
const SUPER_DOMAINS = {
  literacySymbolic: 'Literacy & Symbolic Domains',
  quantitativeAnalytical: 'Quantitative & Analytical Domains',
  inquiryWorld: 'Inquiry & World Understanding',
  technologicalPractical: 'Technological & Practical Domains',
  aestheticExpressive: 'Aesthetic & Expressive Domains',
  formativeEmbodied: 'Formative & Embodied Domains',
} as const;

type SuperDomainKey = keyof typeof SUPER_DOMAINS;

// ─── Domain definitions ─────────────────────────────────────────────────
interface DomainSeed {
  key: string;                  // becomes _id suffix: capabilityDomain.{key}
  name: string;
  superDomain: SuperDomainKey;
  summary: string;
  optIn?: boolean;              // true for Domain 9 (Theology) per spec
  v1Successor?: boolean;        // true if this domain has v1 threads migrating in
}

const DOMAINS: DomainSeed[] = [
  // ── Literacy & Symbolic ─────────────────────────────────────────────
  {
    key: 'languageLiteracy',
    name: 'Language & Literacy',
    superDomain: 'literacySymbolic',
    summary:
      'The substrate of spoken and written language — phonological awareness, decoding, vocabulary, comprehension, written expression, handwriting, and the structural understanding of how texts work. The craft of language as production and reception.',
    v1Successor: true,
  },
  {
    key: 'literaryTradition',
    name: 'Literary & Narrative Tradition',
    superDomain: 'literacySymbolic',
    summary:
      'Engagement with literature as a tradition — narrative form, the canon, oral storytelling traditions, poetic and literary appreciation. Distinct from Language & Literacy: this domain is about being formed by what one reads, not the craft of reading itself.',
    v1Successor: true,
  },
  {
    key: 'classicalLanguages',
    name: 'Classical Languages',
    superDomain: 'literacySymbolic',
    summary:
      'Latin, Greek, and Hebrew as classical languages of Western and Judeo-Christian intellectual tradition. Studied for their formative effect on thought and their role in accessing primary sources, not merely for communication. v2 net-new domain; no v1 successor.',
  },

  // ── Quantitative & Analytical ───────────────────────────────────────
  {
    key: 'mathematicalThinking',
    name: 'Mathematical Thinking',
    superDomain: 'quantitativeAnalytical',
    summary:
      'Number sense, operations, fractional reasoning, algebra, measurement, geometry, statistics, probability, and mathematical modelling. The domain of quantitative reasoning and the language of pattern.',
    v1Successor: true,
  },
  {
    key: 'logicRhetoric',
    name: 'Logic & Rhetoric',
    superDomain: 'quantitativeAnalytical',
    summary:
      'Formal logic, dialectic, argumentation, rhetorical forms, and oratory. The classical Trivium\'s second and third arts. Includes informal reasoning at foundational stages and propositional or predicate logic at advanced stages.',
    v1Successor: true,
  },

  // ── Inquiry & World Understanding ───────────────────────────────────
  {
    key: 'scientificThinking',
    name: 'Scientific Thinking',
    superDomain: 'inquiryWorld',
    summary:
      'The inquiry, observation, and explanation of natural phenomena. Living systems, earth and environmental systems, physical and chemical sciences, plus the disposition of careful observation and the understanding of science as a human endeavour.',
    v1Successor: true,
  },
  {
    key: 'historicalCivicGeographic',
    name: 'Historical, Civic & Geographic Understanding',
    superDomain: 'inquiryWorld',
    summary:
      'Historical thinking, source analysis, geography of place and people, civic and economic understanding, inquiry skills, and the cultivation of historical and geographical imagination. History and geography studied together as the human story in place.',
    v1Successor: true,
  },

  // ── Technological & Practical ───────────────────────────────────────
  {
    key: 'technologicalFluency',
    name: 'Technological Fluency',
    superDomain: 'technologicalPractical',
    summary:
      'Computational thinking, coding, data literacy, engineering design thinking, hardware and systems understanding, and the ethical conduct of digital citizenship. The domain of mediated capability through technological tools.',
    v1Successor: true,
  },
  {
    key: 'practicalMastery',
    name: 'Practical Mastery',
    superDomain: 'technologicalPractical',
    summary:
      'Handwork, textile crafts, woodwork and construction, domestic arts and food skills, gardening and land skills, repair and tool use. The domain of competence in the physical and material world. Hobby-grade in v2; trades-grade reserved for v3+.',
    v1Successor: true,
  },

  // ── Aesthetic & Expressive ──────────────────────────────────────────
  {
    key: 'visualPlasticArts',
    name: 'Visual & Plastic Arts',
    superDomain: 'aestheticExpressive',
    summary:
      'Drawing, painting, sculpture, photography, design, and the appreciation of visual art. Picture study and the engagement with great works as a formative practice in their own right.',
    v1Successor: true,
  },
  {
    key: 'musicalPerformative',
    name: 'Musical & Performative Arts',
    superDomain: 'aestheticExpressive',
    summary:
      'Musical expression, dramatic performance, recitation and hymnody, dance. The performative and embodied arts — distinct from visual/plastic arts in that the work exists in time and through the body of the performer.',
    v1Successor: true,
  },

  // ── Formative & Embodied ────────────────────────────────────────────
  {
    key: 'theologyScripture',
    name: 'Theology & Scriptural Literacy',
    superDomain: 'formativeEmbodied',
    summary:
      'Engagement with scriptural and theological tradition. Bible literacy (narrative, doctrinal, devotional), catechesis, ethical reasoning grounded in religious tradition, church history. Other traditions (Jewish, comparative) opened in later library versions.',
    optIn: true,
  },
  {
    key: 'personalEthical',
    name: 'Personal & Ethical Formation',
    superDomain: 'formativeEmbodied',
    summary:
      'Executive function, self-regulation, attention and memory, planning, metacognition, identity, virtue, and ethical reasoning. The intrapersonal and dispositional substrate of the formed person.',
    v1Successor: true,
  },
  {
    key: 'socialRelational',
    name: 'Social & Relational Formation',
    superDomain: 'formativeEmbodied',
    summary:
      'Empathy, perspective-taking, cooperation, collaboration, conflict resolution, hospitality, community participation. The interpersonal substrate of the formed person.',
    v1Successor: true,
  },
  {
    key: 'physicalEmbodied',
    name: 'Physical & Embodied Capability',
    superDomain: 'formativeEmbodied',
    summary:
      'Gross and fine motor capability, health and body awareness, sport and cooperative games, risk assessment, outdoor capability and bushcraft. The body as a site of capability and learning, not merely health.',
    v1Successor: true,
  },
];

// ─── Sanity document construction ───────────────────────────────────────
function toSanityDoc(domain: DomainSeed) {
  return {
    _id: `capabilityDomain.${domain.key}`,
    _type: 'capabilityDomain',
    name: domain.name,
    slug: { _type: 'slug', current: domain.key },
    superDomain: domain.superDomain,
    summary: domain.summary,
    optIn: domain.optIn ?? false,
    introducedInVersion: '2.0.0',
    status: 'active',
  };
}

// ─── Run ────────────────────────────────────────────────────────────────
async function run() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('SANITY_API_TOKEN is required. Set it in .env.local or pass inline.');
    process.exit(1);
  }

  console.log(`Seeding ${DOMAINS.length} canonical v2 capability domains...`);

  const transaction = client.transaction();
  for (const domain of DOMAINS) {
    const doc = toSanityDoc(domain);
    transaction.createOrReplace(doc);
  }

  try {
    const result = await transaction.commit();
    console.log(`✓ Committed ${result.results.length} domain documents.`);
    console.log('  Super-domain distribution:');
    const bySuper = DOMAINS.reduce<Record<string, number>>((acc, d) => {
      acc[d.superDomain] = (acc[d.superDomain] ?? 0) + 1;
      return acc;
    }, {});
    for (const [k, n] of Object.entries(bySuper)) {
      console.log(`    ${SUPER_DOMAINS[k as SuperDomainKey]}: ${n}`);
    }
    console.log('\nNext: npx tsx scripts/seed-capability-threads.ts');
  } catch (err) {
    console.error('✗ Seed failed:', err);
    process.exit(1);
  }
}

run();
