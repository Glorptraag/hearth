/**
 * Server loader for annotated work samples (W5.1).
 *
 * Reads the rows `assembleAnnotatedSamples` needs and hands them over. Shared by
 * `GET /api/report/annotated-samples` (the Report screen) and the PDF export so
 * the two print the same samples. Read-only: never writes a work-sample slot,
 * an annotation or an evidence link. No model call.
 *
 * Callers must have already checked that `learnerId` belongs to `familyId`.
 */
import { db } from '@/lib/db';
import {
  complianceReports,
  learningEntries,
  learningEntryEvidence,
  observationDloLinks,
  workSamples,
} from '@/lib/db/schema';
import { and, arrayContains, asc, eq, inArray } from 'drizzle-orm';
import { sanityServerClient } from '@/lib/sanity/client';
import { ALL_DLOS_QUERY } from '@/lib/sanity/queries';
import { entryPhotoEvidence } from '@/lib/evidence';
import {
  assembleAnnotatedSamples,
  type AnnotatedSampleEntryInput,
  type AnnotatedSampleGroup,
  type AnnotatedSampleSlotInput,
} from './annotated-samples';

type DloDoc = { _id: string; descriptor: string | null };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Published DLO plain-language lines, `coalesce(parentVersion, descriptor)`
 * via ALL_DLOS_QUERY. Authed read: the dotted-id DLO docs are dark to the
 * tokenless client in prod. A failed read yields an empty map and the
 * assembly falls back to the authored thread name; it never blocks the report.
 */
async function fetchDloLines(): Promise<Map<string, string>> {
  try {
    const docs = await sanityServerClient.fetch<DloDoc[]>(ALL_DLOS_QUERY);
    const out = new Map<string, string>();
    for (const d of docs ?? []) {
      if (d && typeof d._id === 'string' && typeof d.descriptor === 'string') out.set(d._id, d.descriptor);
    }
    return out;
  } catch (err) {
    console.warn('[annotated-samples] DLO descriptor read failed; using thread names:', err);
    return new Map();
  }
}

async function fetchSlots(
  familyId: string,
  learnerId: string,
  reportId: string | null | undefined,
): Promise<AnnotatedSampleSlotInput[]> {
  // A malformed id would throw on the uuid column; it simply tags nothing.
  if (!reportId || !UUID_RE.test(reportId)) return [];
  const report = await db.query.complianceReports.findFirst({
    where: and(
      eq(complianceReports.id, reportId),
      eq(complianceReports.familyId, familyId),
      eq(complianceReports.learnerId, learnerId),
    ),
  });
  if (!report) return [];
  const rows = await db
    .select({ slot: workSamples.slot, entryId: workSamples.entryId })
    .from(workSamples)
    .where(eq(workSamples.reportId, report.id));
  return rows;
}

export async function loadAnnotatedSamples(args: {
  familyId: string;
  learnerId: string;
  learnerName: string;
  reportId?: string | null;
}): Promise<AnnotatedSampleGroup[]> {
  const { familyId, learnerId, learnerName, reportId } = args;

  const links = await db
    .select({
      observationId: observationDloLinks.observationId,
      dloId: observationDloLinks.dloId,
      provenance: observationDloLinks.provenance,
      evidenceState: observationDloLinks.evidenceState,
    })
    .from(observationDloLinks)
    .where(
      and(
        eq(observationDloLinks.learnerId, learnerId),
        eq(observationDloLinks.evidenceState, 'observed'),
      ),
    );

  // Nothing confirmed → no samples; skip the entry, Sanity and slot reads.
  if (!links.some((l) => l.provenance === 'asserted')) return [];

  const tiedEntryIds = [
    ...new Set(links.map((l) => l.observationId).filter((id): id is string => typeof id === 'string')),
  ];
  if (tiedEntryIds.length === 0) return [];

  const entryRows = await db
    .select({
      id: learningEntries.id,
      title: learningEntries.title,
      description: learningEntries.description,
      dateOccurred: learningEntries.dateOccurred,
      status: learningEntries.status,
      learnerIds: learningEntries.learnerIds,
      subjects: learningEntries.subjects,
      aiEnrichment: learningEntries.aiEnrichment,
      discoveriesPerLearner: learningEntries.discoveriesPerLearner,
      evidenceUrls: learningEntries.evidenceUrls,
    })
    .from(learningEntries)
    .where(
      and(
        eq(learningEntries.familyId, familyId),
        eq(learningEntries.status, 'complete'),
        arrayContains(learningEntries.learnerIds, [learnerId]),
        inArray(learningEntries.id, tiedEntryIds),
      ),
    );
  if (entryRows.length === 0) return [];

  // Sanity runs beside the DB reads; the DB reads stay sequential (one
  // connection in a transaction must not interleave queries).
  const descriptorsPromise = fetchDloLines();
  const evidenceRows = await db
      .select({
        entryId: learningEntryEvidence.entryId,
        kind: learningEntryEvidence.kind,
        content: learningEntryEvidence.content,
        caption: learningEntryEvidence.caption,
      })
      .from(learningEntryEvidence)
      .where(
        and(
          inArray(learningEntryEvidence.entryId, entryRows.map((e) => e.id)),
          eq(learningEntryEvidence.kind, 'photo'),
        ),
      )
      .orderBy(asc(learningEntryEvidence.sortOrder), asc(learningEntryEvidence.createdAt));
  const slots = await fetchSlots(familyId, learnerId, reportId);
  const descriptors = await descriptorsPromise;

  const evidenceByEntry = new Map<string, Array<{ kind: string; content: string; caption: string | null }>>();
  for (const r of evidenceRows) {
    const list = evidenceByEntry.get(r.entryId) ?? [];
    list.push({ kind: r.kind, content: r.content, caption: r.caption });
    evidenceByEntry.set(r.entryId, list);
  }

  const entries: AnnotatedSampleEntryInput[] = entryRows.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    dateOccurred: String(e.dateOccurred),
    status: e.status,
    learnerIds: e.learnerIds,
    subjects: e.subjects,
    subjectsDetected: Array.isArray(e.aiEnrichment?.subjects_detected) ? e.aiEnrichment.subjects_detected : [],
    discoveriesPerLearner: (e.discoveriesPerLearner ?? {}) as Record<string, unknown>,
    // Caption-carrying evidence rows first, legacy evidenceUrls for older rows.
    photos: entryPhotoEvidence({ evidence: evidenceByEntry.get(e.id) ?? null, evidenceUrls: e.evidenceUrls }),
  }));

  return assembleAnnotatedSamples({ learnerId, learnerName, entries, links, descriptors, slots });
}
