/**
 * Annotated work samples (W5.1, P7 / D-LP-7: the hero output).
 *
 * An entry with a photo and a confirmed DLO renders as an annotated sample: the
 * parent's own words, the DLO's plain-language line and a band sentence. Samples
 * are grouped per learning area for the Report screen and the PDF.
 *
 * Pure and client-safe: no I/O, no model call. The server loader
 * (`annotated-samples-data.ts`) reads the rows; this module decides what counts.
 *
 * "Confirmed" uses the same rule as the Confirm surface and the evidence
 * pipeline: a parent assertion (`observation_dlo_links.provenance = 'asserted'`)
 * for the (learner, DLO). The parent assertion carries no entry
 * (`observation_id` is null), so the entry → DLO tie is the entry's own
 * observed link for that learner and DLO. A DLO is printed against an entry
 * only when both exist:
 *   1. the entry carries an `observed` link for this learner and DLO
 *      (an uncorroborated `opportunity` never ties), and
 *   2. the parent has asserted that DLO for this learner.
 *
 * Every sentence is parent-owned or authored:
 *   - parent's words: the entry text (`description`) and the parent's own
 *     per-child "noticed" note. The 60-char derived title is only a heading.
 *   - DLO line: the published DLO's `coalesce(parentVersion, descriptor)`
 *     (authored Sanity content), else the authored thread name.
 *   - band sentence: `BAND_SENTENCE` below.
 * Model rationale on the link row is never read here.
 *
 * Curation: annotated samples never fill or reorder the six persisted
 * work-sample slots (those stay parent-selected only, per
 * `export-slots.ts`). When a sample's entry is also the parent's pick for a
 * slot, the sample carries that slot key so the surface can say so.
 */
import { parseDloId, TIER_ORDER } from '@/lib/ai/thread-tier';
import { getThreadName } from '@/lib/capability-threads';
import { isSuppressedThread } from '@/lib/capability-alpha-suppression';
import { SUBJECT_KEYS } from './deterministic-coverage';
import type { ObservationTier } from '@/types/capability-universe';

export type SampleTier = ObservationTier;

/** The entry fields this assembly reads. */
export type AnnotatedSampleEntryInput = {
  id: string;
  title: string | null;
  description: string | null;
  dateOccurred: string;
  status: string;
  learnerIds: string[] | null;
  subjects: string[] | null;
  subjectsDetected?: string[] | null;
  discoveriesPerLearner?: Record<string, unknown> | null;
  /** Photo evidence refs, in the parent's capture order (blob pathname or legacy URL). */
  photos: Array<{ ref: string; caption: string | null }>;
};

/** One `observation_dlo_links` row for the learner. */
export type AnnotatedSampleLinkInput = {
  observationId: string | null;
  dloId: string;
  provenance: string;
  evidenceState: string;
};

/** A persisted work-sample slot (the parent's own pick), for the "also a required sample" tag. */
export type AnnotatedSampleSlotInput = { slot: string; entryId: string | null };

export type AnnotatedSampleDlo = {
  dloId: string;
  threadId: string;
  threadName: string;
  tier: SampleTier;
  /** Authored plain-language line for the objective. */
  line: string;
  /** Authored sentence for the band, naming the child. */
  bandSentence: string;
};

export type AnnotatedSample = {
  entryId: string;
  /** Heading only (the entry title). */
  title: string;
  dateOccurred: string;
  /** The parent's entry text, or null when they saved a photo with no words. */
  parentWords: string | null;
  /** The parent's own per-child "noticed" note for this learner, if any. */
  noticed: string | null;
  photos: Array<{ ref: string; caption: string | null }>;
  dlos: AnnotatedSampleDlo[];
  /** Persisted slot key when the parent also chose this entry for a required slot. */
  requiredSlot: string | null;
};

export type AnnotatedSampleGroup = {
  /** A subject key from `SUBJECT_KEYS`, or `OTHER_AREA`. */
  area: string;
  label: string;
  samples: AnnotatedSample[];
};

export const OTHER_AREA = 'other';

export const AREA_LABEL: Record<string, string> = {
  english: 'English',
  mathematics: 'Mathematics',
  science: 'Science',
  hass: 'HASS',
  arts: 'The Arts',
  technologies: 'Technologies',
  hpe: 'Health and Physical Education',
  languages: 'Languages',
  [OTHER_AREA]: 'Across learning areas',
};

/** Persisted slot key → the label the report already prints for it. */
export const SLOT_LABEL: Record<string, string> = {
  early_writing: 'Early Writing',
  later_writing: 'Later Writing',
  early_maths: 'Early Maths',
  later_maths: 'Later Maths',
  early_choice: 'Early Science/HASS',
  later_choice: 'Later Science/HASS',
};

/**
 * Authored band sentences. Plain words a parent and an HEU reader both read
 * the same way. Never a score, never a deficit.
 */
export const BAND_SENTENCE: Record<SampleTier, (name: string) => string> = {
  emerging: (name) => `${name} is beginning to show this, often with support or in a familiar setting.`,
  developing: (name) => `${name} is showing this more often, with growing independence.`,
  demonstrating: (name) => `${name} shows this confidently and independently, across different settings.`,
};

export const BAND_LABEL: Record<SampleTier, string> = {
  emerging: 'Emerging',
  developing: 'Developing',
  demonstrating: 'Demonstrating',
};

/** Copy for the section, shared by the screen and the PDF so they never drift. */
export const ANNOTATED_SAMPLES_COPY = {
  overline: 'Evidence',
  heading: 'Annotated work samples',
  intro: (name: string) =>
    `Moments with a photo where you confirmed what ${name} showed. Each one pairs your own words with the learning objective and where ${name} is with it.`,
  empty: (name: string) =>
    `When you save a moment with a photo and confirm what ${name} showed, it appears here as an annotated sample.`,
  yourWords: 'In your words',
  noticed: 'You noticed',
  noWords: 'Saved with a photo only.',
  requiredSlot: (slotLabel: string) => `Also your ${slotLabel} sample`,
  photoOnFile: 'Photo kept in Hearth',
} as const;

const TIER_RANK = new Map<SampleTier, number>(TIER_ORDER.map((t, i) => [t, i]));

function primaryArea(entry: AnnotatedSampleEntryInput): string {
  const candidates = [
    ...(entry.subjects ?? []),
    ...(entry.subjectsDetected ?? []),
  ].map((s) => (typeof s === 'string' ? s.trim().toLowerCase() : ''));
  for (const s of candidates) {
    if (SUBJECT_KEYS.includes(s)) return s;
  }
  return OTHER_AREA;
}

function textOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function descriptorLookup(
  descriptors: ReadonlyMap<string, string> | Readonly<Record<string, string>>,
): (id: string) => string | null {
  if (descriptors instanceof Map) return (id) => textOrNull(descriptors.get(id));
  const rec = descriptors as Readonly<Record<string, string>>;
  return (id) => (Object.prototype.hasOwnProperty.call(rec, id) ? textOrNull(rec[id]) : null);
}

/**
 * Assemble the annotated samples for one learner, grouped per learning area.
 *
 * Exclusions (each pinned under test): an entry that is not complete or not
 * this learner's; an entry with no photo; a DLO the parent has not confirmed;
 * an entry → DLO tie that is only an `opportunity`; a suppressed thread (H6);
 * a malformed DLO id. An entry left with no confirmed DLO is not a sample.
 *
 * Order: areas in the canonical subject order, then "Across learning areas";
 * samples oldest first within an area (so early → later reads as growth), ties
 * by entry id; DLO lines by thread id, then band low → high.
 */
export function assembleAnnotatedSamples(input: {
  learnerId: string;
  learnerName: string;
  entries: readonly AnnotatedSampleEntryInput[];
  links: readonly AnnotatedSampleLinkInput[];
  descriptors: ReadonlyMap<string, string> | Readonly<Record<string, string>>;
  slots?: readonly AnnotatedSampleSlotInput[];
}): AnnotatedSampleGroup[] {
  const { learnerId, learnerName, entries, links, slots = [] } = input;
  const describe = descriptorLookup(input.descriptors);

  // Parent assertions for this learner: the "confirmed" set.
  const confirmed = new Set<string>();
  // Observed entry → DLO ties.
  const tiesByEntry = new Map<string, Set<string>>();
  for (const l of links) {
    if (l.evidenceState !== 'observed') continue;
    if (l.provenance === 'asserted') {
      confirmed.add(l.dloId);
      // An assertion with no entry is the Confirm-surface confirm; an asserted
      // row that does carry an entry also ties that entry.
      if (l.observationId === null) continue;
    }
    if (!l.observationId) continue;
    const set = tiesByEntry.get(l.observationId) ?? new Set<string>();
    set.add(l.dloId);
    tiesByEntry.set(l.observationId, set);
  }

  const slotByEntry = new Map<string, string>();
  for (const s of slots) {
    if (s.entryId && !slotByEntry.has(s.entryId)) slotByEntry.set(s.entryId, s.slot);
  }

  const byArea = new Map<string, AnnotatedSample[]>();

  for (const entry of entries) {
    if (entry.status !== 'complete') continue;
    if (!entry.learnerIds?.includes(learnerId)) continue;
    const photos = entry.photos.filter((p) => typeof p.ref === 'string' && p.ref.trim().length > 0);
    if (photos.length === 0) continue;

    const ties = tiesByEntry.get(entry.id);
    if (!ties) continue;

    const dlos: AnnotatedSampleDlo[] = [];
    for (const dloId of ties) {
      if (!confirmed.has(dloId)) continue;
      if (isSuppressedThread(dloId)) continue;
      const parsed = parseDloId(dloId);
      if (!parsed) continue;
      const threadName = getThreadName(parsed.threadId);
      dlos.push({
        dloId,
        threadId: parsed.threadId,
        threadName,
        tier: parsed.tier,
        line: describe(dloId) ?? threadName,
        bandSentence: BAND_SENTENCE[parsed.tier](learnerName),
      });
    }
    if (dlos.length === 0) continue;

    dlos.sort(
      (a, b) =>
        a.threadId.localeCompare(b.threadId, 'en', { numeric: true }) ||
        (TIER_RANK.get(a.tier) ?? 0) - (TIER_RANK.get(b.tier) ?? 0),
    );

    const area = primaryArea(entry);
    const sample: AnnotatedSample = {
      entryId: entry.id,
      title: textOrNull(entry.title) ?? '',
      dateOccurred: entry.dateOccurred,
      parentWords: textOrNull(entry.description),
      noticed: textOrNull(entry.discoveriesPerLearner?.[learnerId]),
      photos,
      dlos,
      requiredSlot: slotByEntry.get(entry.id) ?? null,
    };
    const list = byArea.get(area) ?? [];
    list.push(sample);
    byArea.set(area, list);
  }

  const order = [...SUBJECT_KEYS, OTHER_AREA];
  const groups: AnnotatedSampleGroup[] = [];
  for (const area of order) {
    const samples = byArea.get(area);
    if (!samples || samples.length === 0) continue;
    samples.sort(
      (a, b) => a.dateOccurred.localeCompare(b.dateOccurred) || a.entryId.localeCompare(b.entryId),
    );
    groups.push({ area, label: AREA_LABEL[area] ?? area, samples });
  }
  return groups;
}

/** Total samples across groups. */
export function countAnnotatedSamples(groups: readonly AnnotatedSampleGroup[]): number {
  return groups.reduce((n, g) => n + g.samples.length, 0);
}
