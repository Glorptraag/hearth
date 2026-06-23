// Capability Universe v2 — runtime domain taxonomy for the constellation.
//
// Single client-side source of truth for the 15 v2 domains and the v1→v2
// thread→domain assignment. The thread→domain map is the primary-domain
// mapping authored in the v1→v2 migration table and seeded by
// scripts/seed-capability-threads.ts — extracted verbatim from that script so
// the rendered constellation, the Sanity seed, and the migration table cannot
// drift. Spec: hearth-capability-universe-v2-architecture-spec-v1.md §2, §3.2.
//
// Each domain owns a dedicated --color-capdomain-{numericId} token (defined in
// globals.css for both themes) — a 15-colour, colour-blind-aware palette that
// replaced the earlier stop-gap of reusing the 8 --color-domain-* subject
// tokens (which collided: 3 domains shared HPE, etc.). Emoji are placeholders
// per the decorative-emoji standing rule.

export type SuperDomainKey =
  | 'foundations'
  | 'cultural-inheritance'
  | 'classical-disciplines'
  | 'aesthetic-expression'
  | 'practical-vocational'
  | 'human-formation';

export type V2Domain = {
  numericId: number;
  key: string;
  name: string;
  shortName: string;
  superDomain: SuperDomainKey;
  /** Existing design-system colour token (colour assignment deferred). */
  colourVar: string;
  emoji: string;
};

export const V2_DOMAINS: V2Domain[] = [
  { numericId: 1, key: 'languageLiteracy', name: 'Language & Literacy', shortName: 'Language', superDomain: 'foundations', colourVar: '--color-capdomain-1', emoji: '📚' },
  { numericId: 2, key: 'mathematicalThinking', name: 'Mathematical Thinking', shortName: 'Maths', superDomain: 'foundations', colourVar: '--color-capdomain-2', emoji: '🔢' },
  { numericId: 3, key: 'scientificThinking', name: 'Scientific Thinking', shortName: 'Science', superDomain: 'foundations', colourVar: '--color-capdomain-3', emoji: '🔬' },
  { numericId: 4, key: 'technologicalFluency', name: 'Technological Fluency', shortName: 'Technology', superDomain: 'foundations', colourVar: '--color-capdomain-4', emoji: '💻' },
  { numericId: 5, key: 'historicalCivicGeographic', name: 'Historical, Civic & Geographic Understanding', shortName: 'History & Place', superDomain: 'cultural-inheritance', colourVar: '--color-capdomain-5', emoji: '🌏' },
  { numericId: 6, key: 'literaryTradition', name: 'Literary & Narrative Tradition', shortName: 'Literature', superDomain: 'cultural-inheritance', colourVar: '--color-capdomain-6', emoji: '📖' },
  { numericId: 7, key: 'classicalLanguages', name: 'Classical Languages', shortName: 'Classical', superDomain: 'classical-disciplines', colourVar: '--color-capdomain-7', emoji: '🏛️' },
  { numericId: 8, key: 'logicRhetoric', name: 'Logic & Rhetoric', shortName: 'Logic & Rhetoric', superDomain: 'classical-disciplines', colourVar: '--color-capdomain-8', emoji: '⚖️' },
  { numericId: 9, key: 'theologyScripture', name: 'Theology & Scriptural Literacy', shortName: 'Theology', superDomain: 'classical-disciplines', colourVar: '--color-capdomain-9', emoji: '✝️' },
  { numericId: 10, key: 'visualPlasticArts', name: 'Visual & Plastic Arts', shortName: 'Visual Arts', superDomain: 'aesthetic-expression', colourVar: '--color-capdomain-10', emoji: '🎨' },
  { numericId: 11, key: 'musicalPerformative', name: 'Musical & Performative Arts', shortName: 'Music & Performance', superDomain: 'aesthetic-expression', colourVar: '--color-capdomain-11', emoji: '🎭' },
  { numericId: 12, key: 'practicalMastery', name: 'Practical Mastery', shortName: 'Practical', superDomain: 'practical-vocational', colourVar: '--color-capdomain-12', emoji: '🛠️' },
  { numericId: 13, key: 'personalEthical', name: 'Personal & Ethical Formation', shortName: 'Personal', superDomain: 'human-formation', colourVar: '--color-capdomain-13', emoji: '🧭' },
  { numericId: 14, key: 'socialRelational', name: 'Social & Relational Formation', shortName: 'Social', superDomain: 'human-formation', colourVar: '--color-capdomain-14', emoji: '🤝' },
  { numericId: 15, key: 'physicalEmbodied', name: 'Physical & Embodied Capability', shortName: 'Physical', superDomain: 'human-formation', colourVar: '--color-capdomain-15', emoji: '🏃' },
];

export const V2_DOMAINS_BY_KEY: Record<string, V2Domain> = Object.fromEntries(
  V2_DOMAINS.map((d) => [d.key, d]),
);

// v1 thread short-code → v2 domain key. Primary-domain assignment per the
// migration table; extracted verbatim from scripts/seed-capability-threads.ts
// (57 threads). Domains 7 (Classical Languages) and 9 (Theology) have no v1
// successor threads — they render present-but-unlit per spec §9.1 / D9.
export const THREAD_TO_V2_DOMAIN: Record<string, string> = {
  // Domain 1 — Language & Literacy
  L1: 'languageLiteracy', L2: 'languageLiteracy', L3: 'languageLiteracy',
  L4: 'languageLiteracy', L5: 'languageLiteracy', L6: 'languageLiteracy',
  L7: 'languageLiteracy',
  // Domain 8 — Logic & Rhetoric
  L8: 'logicRhetoric',
  // Domain 6 — Literary & Narrative Tradition
  L9: 'literaryTradition', C1: 'literaryTradition',
  // Domain 2 — Mathematical Thinking
  M1: 'mathematicalThinking', M2: 'mathematicalThinking', M3: 'mathematicalThinking',
  M4: 'mathematicalThinking', M5: 'mathematicalThinking', M6: 'mathematicalThinking',
  M7: 'mathematicalThinking', M8: 'mathematicalThinking', M9: 'mathematicalThinking',
  // Domain 3 — Scientific Thinking
  S1: 'scientificThinking', S2: 'scientificThinking', S3: 'scientificThinking',
  S4: 'scientificThinking', S5: 'scientificThinking', S6: 'scientificThinking',
  // Domain 5 — Historical, Civic & Geographic Understanding
  H1: 'historicalCivicGeographic', H2: 'historicalCivicGeographic',
  H3: 'historicalCivicGeographic', H4: 'historicalCivicGeographic',
  H5: 'historicalCivicGeographic', H6: 'historicalCivicGeographic',
  // Domain 15 — Physical & Embodied Capability
  P1: 'physicalEmbodied', P2: 'physicalEmbodied', P3: 'physicalEmbodied',
  P4: 'physicalEmbodied', P5: 'physicalEmbodied',
  // Domain 14 — Social & Relational Formation
  PS1: 'socialRelational', PS2: 'socialRelational', EF6: 'socialRelational',
  // Domain 13 — Personal & Ethical Formation
  PS3: 'personalEthical', PS4: 'personalEthical', PS5: 'personalEthical',
  PS6: 'personalEthical', EF1: 'personalEthical', EF2: 'personalEthical',
  EF3: 'personalEthical', EF4: 'personalEthical', EF5: 'personalEthical',
  EF7: 'personalEthical', EF8: 'personalEthical',
  // Domain 4 — Technological Fluency
  PS7: 'technologicalFluency', C7: 'technologicalFluency',
  // Domain 11 — Musical & Performative Arts
  C2: 'musicalPerformative', C3: 'musicalPerformative', C4: 'musicalPerformative',
  // Domain 10 — Visual & Plastic Arts
  C5: 'visualPlasticArts',
  // Domain 12 — Practical Mastery
  C6: 'practicalMastery',
};

export function getV2DomainKey(threadId: string): string | null {
  return THREAD_TO_V2_DOMAIN[threadId] ?? null;
}
