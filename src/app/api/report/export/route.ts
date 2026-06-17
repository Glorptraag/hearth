import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { families, familySettings, learningEntries, learners, complianceReports, workSamples } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';
import { format, differenceInDays, differenceInYears } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getJurisdiction } from '@/config/jurisdictions';
import { routeHandler } from '@/lib/api-helpers';
import { getDeterministicCoverage } from '@/lib/report/coverage';
import { descriptorToSubject } from '@/lib/report/deterministic-coverage';
import { derivePosture, POSTURE_LABEL, subjectActivityLabel } from '@/lib/report/coverage-narrative';
import { resolveExportSlotData } from '@/lib/report/export-slots';

const SUBJECT_CONFIG: Record<string, { label: string; emoji: string }> = {
  english: { label: 'English', emoji: '📖' },
  mathematics: { label: 'Mathematics', emoji: '🔢' },
  science: { label: 'Science', emoji: '🔬' },
  hass: { label: 'HASS', emoji: '🌏' },
  arts: { label: 'Arts', emoji: '🎨' },
  technologies: { label: 'Technologies', emoji: '💻' },
  hpe: { label: 'HPE', emoji: '⚽' },
  languages: { label: 'Languages', emoji: '🗣️' },
};

const ALL_SUBJECTS = Object.keys(SUBJECT_CONFIG);

type AiEnrichment = {
  capability_threads?: { thread_id: string; confidence: number }[];
  curriculum_descriptors?: { code: string; confidence: number }[];
  subjects_detected?: string[];
} | null;

export const GET = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const learnerId = request.nextUrl.searchParams.get('learnerId');
  if (!learnerId) return NextResponse.json({ error: 'learnerId required' }, { status: 400 });

  // Fetch data in parallel
  const [learnerRows, settings, allEntries, familyRow] = await Promise.all([
    db.select().from(learners).where(
      and(eq(learners.familyId, family.id), eq(learners.id, learnerId))
    ),
    db.query.familySettings.findFirst({
      where: eq(familySettings.familyId, family.id),
    }),
    db.select().from(learningEntries).where(
      eq(learningEntries.familyId, family.id)
    ),
    db.query.families.findFirst({ where: eq(families.id, family.id) }),
  ]);

  const learner = learnerRows[0];
  if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 });

  const config = getJurisdiction(settings?.state ?? null);

  // Filter entries for this learner
  const entries = allEntries.filter(
    (e) => e.status === 'complete' && e.learnerIds?.includes(learnerId)
  );

  const now = new Date();
  const registrationDate = familyRow?.createdAt ? new Date(familyRow.createdAt) : now;
  const reportDueDate = settings?.nextReportDate ? new Date(settings.nextReportDate) : null;
  const daysUntilDue = reportDueDate ? differenceInDays(reportDueDate, now) : null;
  const learnerAge = learner.dateOfBirth
    ? differenceInYears(now, new Date(learner.dateOfBirth))
    : null;

  // Deterministic curriculum coverage (WS-5). When the family set an explicit
  // jurisdiction whose framework has authored DLO→framework mappings, curriculum
  // codes come from learner_dlo_status × the mapping — same history, same report.
  // A blank state or an unmapped framework yields `mode: 'fallback'` and we keep
  // today's LLM-recalled descriptor path verbatim — a blank-state family is never
  // silently scored against QLD's mappings here.
  const coverage = await getDeterministicCoverage({ learnerId, state: settings?.state ?? null });
  const isDeterministic = coverage.mode === 'deterministic';

  // Subject coverage
  const entryCounts: Record<string, number> = {};
  const descriptorSets: Record<string, Set<string>> = {};
  ALL_SUBJECTS.forEach((s) => { entryCounts[s] = 0; descriptorSets[s] = new Set(); });

  entries.forEach((e) => {
    const enrichment = e.aiEnrichment as AiEnrichment;
    const subjects = new Set([
      ...(e.subjects ?? []),
      ...(enrichment?.subjects_detected ?? []).map((s) => s.toLowerCase()),
    ]);
    subjects.forEach((s) => { if (s in entryCounts) entryCounts[s]++; });
    // Legacy path only — deterministic codes replace these below.
    if (!isDeterministic) {
      enrichment?.curriculum_descriptors?.forEach((d) => {
        const subj = descriptorToSubject(d.code);
        if (subj && descriptorSets[subj]) descriptorSets[subj].add(d.code);
      });
    }
  });

  if (coverage.mode === 'deterministic') {
    ALL_SUBJECTS.forEach((s) => {
      descriptorSets[s] = new Set(coverage.coverage[s]?.codes ?? []);
    });
  }

  const subjectCoverage = ALL_SUBJECTS.map((key) => ({
    key,
    label: SUBJECT_CONFIG[key].label,
    count: entryCounts[key],
    descriptors: descriptorSets[key].size,
  }));

  const coveredSubjects = subjectCoverage.filter((s) => s.count > 0).length;

  // Posture — shared, non-shaming wording (same source as the report screen).
  const postureLabel = POSTURE_LABEL[derivePosture(coveredSubjects, entries.length)];

  // The formal "curriculum outcomes" cell: a count when mapped, else "Building"
  // where the parent has logged activity, else "—". Never a bare "0".
  const curriculumCell = (s: { descriptors: number; count: number }) =>
    s.descriptors > 0 ? String(s.descriptors) : s.count > 0 ? 'Building' : '—';

  // ─── Generate PDF ───
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = new jsPDF() as any;
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(config.reportScreenTitle, pageW / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${format(now, 'd MMMM yyyy')}`, pageW / 2, y, { align: 'center' });
  y += 12;

  // Learner info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Learner Details', 14, y);
  y += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${learner.name}`, 14, y); y += 5;
  if (learnerAge !== null) { doc.text(`Age: ${learnerAge} years`, 14, y); y += 5; }
  if (settings?.registrationNumber) {
    doc.text(`${config.registrationLabel}: ${settings.registrationNumber}`, 14, y); y += 5;
  }
  doc.text(`Family: ${familyRow?.familyName ?? '—'}`, 14, y); y += 5;
  doc.text(`Registered: ${format(registrationDate, 'd MMM yyyy')}`, 14, y); y += 5;
  if (reportDueDate) {
    doc.text(`${config.reviewDateLabel}: ${format(reportDueDate, 'd MMM yyyy')}`, 14, y); y += 5;
    if (daysUntilDue !== null) {
      doc.text(daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days remaining`, 14, y);
      y += 5;
    }
  }
  y += 5;

  if (config.reportTier === 'cd_level') {
    // ─── CD-LEVEL tier (QLD, SA, NT) ───

    // Overall posture
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Compliance Status', 14, y); y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Status: ${postureLabel}`, 14, y); y += 5;
    doc.text(`Total Entries: ${entries.length}`, 14, y); y += 5;
    doc.text(`Subject Areas Covered: ${coveredSubjects} of 8`, 14, y); y += 10;

    // Curriculum coverage table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Curriculum Coverage', 14, y); y += 6;

    // Honest framing — outcomes shown are those formally mapped to date; the full
    // evidence base is the entry log + work samples. A lighter count early in the
    // cycle reflects mapping in progress, not absence of learning.
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(90, 90, 90);
    const coverageNote = doc.splitTextToSize(
      `Curriculum outcomes below are those formally mapped to ${config.curriculumFramework} to date. ${learner.name}'s full evidence base — every logged moment and work sample — appears in the Learning Entry Log. A lighter formal count early in the ${config.reviewTerminology} cycle reflects mapping in progress, not absence of learning.`,
      pageW - 28,
    );
    doc.text(coverageNote, 14, y);
    y += coverageNote.length * 4 + 3;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    autoTable(doc, {
      startY: y,
      head: [['Subject', 'Entries', 'Activity', 'Curriculum outcomes']],
      body: subjectCoverage.map((s) => [
        s.label,
        String(s.count),
        subjectActivityLabel(s.count),
        curriculumCell(s),
      ]),
      headStyles: { fillColor: [100, 80, 60], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      theme: 'grid',
      margin: { left: 14 },
    });

    y = doc.lastAutoTable.finalY + 10;

    // Work samples — 6-slot QLD structure. Slots are PERSISTED-ONLY: a slot
    // shows an entry only if the parent actually selected one (filled by the DB
    // merge below). The export must never auto-match an entry the parent never
    // chose into the compliance PDF — that diverged from the on-screen report
    // and could put an unvetted sample in front of the regulator.
    const WORK_SAMPLE_SLOTS = [
      { area: 'english', label: 'Early Writing' },
      { area: 'english', label: 'Later Writing' },
      { area: 'mathematics', label: 'Early Maths' },
      { area: 'mathematics', label: 'Later Maths' },
      { area: 'science', label: 'Early Science/HASS' },
      { area: 'science', label: 'Later Science/HASS' },
    ];

    // Fetch DB-backed work samples with annotations (if report exists)
    const reportId = request.nextUrl.searchParams.get('reportId');
    let dbSamples: Array<{
      slot: string;
      entryId: string | null;
      status: string;
      annotation: {
        observations: string | null;
        needsStrengths: string | null;
        adjustment: string | null;
        planning: string | null;
        progressionSummary: string | null;
        confirmedAt: Date | null;
      } | null;
    }> = [];

    if (reportId) {
      const report = await db.query.complianceReports.findFirst({
        where: and(eq(complianceReports.id, reportId), eq(complianceReports.familyId, family.id)),
      });
      if (report) {
        const samples = await db.query.workSamples.findMany({
          where: eq(workSamples.reportId, report.id),
        });
        const sampleIds = samples.map((s) => s.id);
        const annotations = sampleIds.length
          ? await db.query.workSampleAnnotations.findMany({
              where: (a, { inArray }) => inArray(a.workSampleId, sampleIds),
            })
          : [];
        const annotationMap = new Map(annotations.map((a) => [a.workSampleId, a]));

        dbSamples = samples.map((s) => {
          const a = annotationMap.get(s.id);
          return {
            slot: s.slot,
            entryId: s.entryId,
            status: s.status,
            annotation: a
              ? {
                  observations: a.observations,
                  needsStrengths: a.needsStrengths,
                  adjustment: a.adjustment,
                  planning: a.planning,
                  progressionSummary: a.progressionSummary,
                  confirmedAt: a.confirmedAt,
                }
              : null,
          };
        });
      }
    }

    // Persisted-only slot resolution (see lib/report/export-slots): a slot is
    // filled ONLY from its DB work-sample row, never auto-matched.
    const SLOT_KEY_MAP: Record<string, number> = {
      early_writing: 0, later_writing: 1, early_maths: 2, later_maths: 3, early_choice: 4, later_choice: 5,
    };
    const slotData = resolveExportSlotData(WORK_SAMPLE_SLOTS, SLOT_KEY_MAP, dbSamples, entries);

    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Required Work Samples', 14, y); y += 3;

    autoTable(doc, {
      startY: y,
      head: [['Slot', 'Subject Area', 'Status', 'Matched Entry']],
      body: slotData.map((ws) => [
        ws.label,
        SUBJECT_CONFIG[ws.area]?.label ?? ws.area,
        ws.status,
        ws.entryTitle,
      ]),
      headStyles: { fillColor: [100, 80, 60], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      theme: 'grid',
      margin: { left: 14 },
    });

    y = doc.lastAutoTable.finalY + 10;

    // Per-sample annotation pages
    const annotatedSamples = dbSamples.filter((s) => s.annotation?.confirmedAt);
    if (annotatedSamples.length > 0) {
      doc.addPage();
      y = 20;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Work Sample Annotations', pageW / 2, y, { align: 'center' });
      y += 12;

      for (const sample of annotatedSamples) {
        if (y > 220) { doc.addPage(); y = 20; }
        const slotIdx = SLOT_KEY_MAP[sample.slot];
        const slotInfo = slotIdx !== undefined ? slotData[slotIdx] : null;
        const entry = sample.entryId ? entries.find((e) => e.id === sample.entryId) : null;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(slotInfo?.label ?? sample.slot, 14, y);
        y += 6;

        if (entry) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Entry: ${entry.title ?? '—'}  •  ${format(new Date(entry.dateOccurred + 'T00:00:00'), 'd MMM yyyy')}`, 14, y);
          y += 7;
        }

        const a = sample.annotation;
        const fields = [
          { label: 'What I Observed', value: a?.observations },
          { label: 'Needs & Strengths', value: a?.needsStrengths },
          { label: 'How I Adjusted', value: a?.adjustment },
          { label: 'Where to Next', value: a?.planning },
        ];

        for (const field of fields) {
          if (!field.value) continue;
          if (y > 260) { doc.addPage(); y = 20; }
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 80, 60);
          doc.text(field.label, 14, y);
          y += 5;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          const lines = doc.splitTextToSize(field.value, pageW - 28);
          doc.text(lines, 14, y);
          y += lines.length * 4.5 + 3;
        }

        y += 8;
      }
    }

    // Progression summaries (one per subject pair where late slot has summary)
    const progressionPairs: Array<{ lateSlot: string; label: string }> = [
      { lateSlot: 'later_writing', label: 'English writing' },
      { lateSlot: 'later_maths', label: 'Mathematics' },
      { lateSlot: 'later_choice', label: 'Science / HASS' },
    ];
    const progressions = progressionPairs
      .map((p) => {
        const s = dbSamples.find((ds) => ds.slot === p.lateSlot);
        return s?.annotation?.progressionSummary ? { label: p.label, text: s.annotation.progressionSummary } : null;
      })
      .filter((p): p is { label: string; text: string } => p !== null);

    if (progressions.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Progression Summaries', 14, y); y += 8;

      for (const p of progressions) {
        if (y > 260) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 80, 60);
        doc.text(p.label, 14, y); y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const lines = doc.splitTextToSize(p.text, pageW - 28);
        doc.text(lines, 14, y);
        y += lines.length * 4.5 + 6;
      }
      y += 4;
    }

    // Areas to round out — opportunities, framed gently (no "Critical"/severity).
    const gaps = subjectCoverage.filter((s) => s.count <= 1);
    if (gaps.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Areas to round out', 14, y); y += 3;

      autoTable(doc, {
        startY: y,
        head: [['Subject', 'Entries', 'Note']],
        body: gaps.map((g) => [
          g.label,
          String(g.count),
          g.count === 0
            ? 'Not yet logged — a few activities here would round out the picture'
            : 'A light touch so far — one or two more would strengthen it',
        ]),
        headStyles: { fillColor: [100, 80, 60], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        theme: 'grid',
        margin: { left: 14 },
      });

      y = doc.lastAutoTable.finalY + 10;
    }

  } else {
    // ─── LEARNING_AREA tier (NSW, VIC, WA, TAS, ACT) ───

    // Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Learning Summary', 14, y); y += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Entries: ${entries.length}`, 14, y); y += 5;
    doc.text(`Learning Areas Covered: ${coveredSubjects} of 8`, 14, y); y += 10;

    // Learning area cards (one section per subject)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Learning Areas', 14, y); y += 6;

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(90, 90, 90);
    const areaNote = doc.splitTextToSize(
      `This report draws on every moment logged for ${learner.name}. Curriculum links shown are those mapped to the ${config.curriculumFramework} so far; the full record of learning appears in the Learning Entry Log below.`,
      pageW - 28,
    );
    doc.text(areaNote, 14, y);
    y += areaNote.length * 4 + 3;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    autoTable(doc, {
      startY: y,
      head: [['Learning Area', 'Entries', 'Activity', 'Curriculum Links']],
      body: subjectCoverage.map((s) => [
        s.label,
        String(s.count),
        subjectActivityLabel(s.count),
        curriculumCell(s),
      ]),
      headStyles: { fillColor: [100, 80, 60], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      theme: 'grid',
      margin: { left: 14 },
    });

    y = doc.lastAutoTable.finalY + 10;

    // Portfolio sections — entries grouped by learning area
    const areasWithEntries = subjectCoverage.filter((s) => s.count > 0);
    for (const area of areasWithEntries) {
      const areaEntries = entries.filter((e) => {
        const enrichment = e.aiEnrichment as AiEnrichment;
        const subjectSet = new Set([
          ...(e.subjects ?? []),
          ...(enrichment?.subjects_detected ?? []).map((s) => s.toLowerCase()),
        ]);
        return subjectSet.has(area.key);
      }).sort((a, b) => new Date(b.dateOccurred).getTime() - new Date(a.dateOccurred).getTime());

      if (areaEntries.length === 0) continue;

      if (y > 220) { doc.addPage(); y = 20; }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 80, 60);
      doc.text(area.label, 14, y); y += 6;
      doc.setTextColor(0, 0, 0);

      autoTable(doc, {
        startY: y,
        head: [['Date', 'Entry Title', 'Evidence']],
        body: areaEntries.slice(0, 20).map((e) => [
          format(new Date(e.dateOccurred + 'T00:00:00'), 'd MMM yyyy'),
          (e.title ?? '').slice(0, 70),
          (e.evidenceUrls?.length ?? 0) > 0 ? `${e.evidenceUrls!.length} item(s)` : '—',
        ]),
        headStyles: { fillColor: [100, 80, 60], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        theme: 'grid',
        margin: { left: 14 },
        columnStyles: { 1: { cellWidth: 90 } },
      });

      y = doc.lastAutoTable.finalY + 10;
    }

    // Areas to explore (softer language for learning_area tier)
    const areasToExplore = subjectCoverage.filter((s) => s.count <= 1);
    if (areasToExplore.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Areas to Explore', 14, y); y += 3;

      autoTable(doc, {
        startY: y,
        head: [['Learning Area', 'Entries', 'Note']],
        body: areasToExplore.map((g) => [
          g.label,
          String(g.count),
          g.count === 0 ? 'No entries yet — consider adding some activities' : 'Light coverage — a few more entries would round this out',
        ]),
        headStyles: { fillColor: [100, 80, 60], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        theme: 'grid',
        margin: { left: 14 },
      });

      y = doc.lastAutoTable.finalY + 10;
    }
  }

  // Entry log summary (shared across tiers)
  if (entries.length > 0) {
    if (y > 200) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Learning Entry Log', 14, y); y += 3;

    const sortedEntries = [...entries].sort(
      (a, b) => new Date(b.dateOccurred).getTime() - new Date(a.dateOccurred).getTime()
    );

    autoTable(doc, {
      startY: y,
      head: [['Date', 'Title', 'Subjects', 'Evidence']],
      body: sortedEntries.slice(0, 50).map((e) => [
        format(new Date(e.dateOccurred + 'T00:00:00'), 'd MMM yyyy'),
        (e.title ?? '').slice(0, 60),
        (e.subjects ?? []).join(', ') || '—',
        (e.evidenceUrls?.length ?? 0) > 0 ? `${e.evidenceUrls!.length} item(s)` : '—',
      ]),
      headStyles: { fillColor: [100, 80, 60], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      theme: 'grid',
      margin: { left: 14 },
      columnStyles: { 1: { cellWidth: 70 } },
    });
  }

  // Footer on each page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Hearth LMS — ${config.reportScreenTitle} — ${learner.name} — Page ${i} of ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  const filename = `hearth-report-${learner.name.toLowerCase().replace(/\s+/g, '-')}-${format(now, 'yyyy-MM-dd')}.pdf`;

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}, { route: 'GET /api/report/export' });
