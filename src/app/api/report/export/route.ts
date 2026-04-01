import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { families, familySettings, learningEntries, learners } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and, inArray } from 'drizzle-orm';
import { format, differenceInDays, differenceInYears } from 'date-fns';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const SUBJECT_CONFIG: Record<string, { label: string }> = {
  english: { label: 'English' },
  mathematics: { label: 'Mathematics' },
  science: { label: 'Science' },
  hass: { label: 'HASS' },
  arts: { label: 'Arts' },
  technologies: { label: 'Technologies' },
  hpe: { label: 'HPE' },
  languages: { label: 'Languages' },
};

const ALL_SUBJECTS = Object.keys(SUBJECT_CONFIG);

const AC9_SUBJECT_MAP: Record<string, string> = {
  AC9E: 'english', AC9M: 'mathematics', AC9S: 'science',
  AC9HAS: 'hass', AC9HI: 'hass', AC9GE: 'hass', AC9CI: 'hass', AC9EB: 'hass',
  AC9AR: 'arts', AC9MU: 'arts', AC9DR: 'arts', AC9DA: 'arts', AC9MA: 'arts',
  AC9TD: 'technologies', AC9TDI: 'technologies', AC9HP: 'hpe', AC9LA: 'languages',
};

function descriptorToSubject(code: string): string | null {
  for (const [prefix, subject] of Object.entries(AC9_SUBJECT_MAP)) {
    if (code.startsWith(prefix)) return subject;
  }
  return null;
}

type AiEnrichment = {
  capability_threads?: { thread_id: string; confidence: number }[];
  curriculum_descriptors?: { code: string; confidence: number }[];
  subjects_detected?: string[];
} | null;

export async function GET(request: NextRequest) {
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

  // Filter entries for this learner
  const entries = allEntries.filter(
    (e) => e.status === 'complete' && e.learnerIds?.includes(learnerId)
  );

  const now = new Date();
  const registrationDate = familyRow?.createdAt ? new Date(familyRow.createdAt) : now;
  const reportDueDate = settings?.heuNextReportDate ? new Date(settings.heuNextReportDate) : null;
  const daysUntilDue = reportDueDate ? differenceInDays(reportDueDate, now) : null;
  const learnerAge = learner.dateOfBirth
    ? differenceInYears(now, new Date(learner.dateOfBirth))
    : null;

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
    enrichment?.curriculum_descriptors?.forEach((d) => {
      const subj = descriptorToSubject(d.code);
      if (subj && descriptorSets[subj]) descriptorSets[subj].add(d.code);
    });
  });

  const total = entries.length || 1;
  const subjectCoverage = ALL_SUBJECTS.map((key) => ({
    key,
    label: SUBJECT_CONFIG[key].label,
    count: entryCounts[key],
    descriptors: descriptorSets[key].size,
    pct: Math.round((entryCounts[key] / total) * 100),
  }));

  const coveredSubjects = subjectCoverage.filter((s) => s.count > 0).length;

  // Posture
  let postureLabel: string;
  if (coveredSubjects >= 6 && entries.length >= 5) postureLabel = 'On Track';
  else if (coveredSubjects >= 4 || entries.length >= 3) postureLabel = 'Needs Attention';
  else postureLabel = 'At Risk';

  // Work sample slots
  const reportYear = reportDueDate?.getFullYear() ?? now.getFullYear();
  const WORK_SAMPLE_SLOTS = [
    { area: 'english', label: 'Early Writing', termHalf: 'early' as const },
    { area: 'english', label: 'Later Writing', termHalf: 'late' as const },
    { area: 'mathematics', label: 'Early Maths', termHalf: 'early' as const },
    { area: 'mathematics', label: 'Later Maths', termHalf: 'late' as const },
    { area: 'science', label: 'Early Science/HASS', termHalf: 'early' as const, altArea: 'hass' },
    { area: 'science', label: 'Later Science/HASS', termHalf: 'late' as const, altArea: 'hass' },
  ];

  const workSamples = WORK_SAMPLE_SLOTS.map((slot) => {
    const candidates = entries.filter((e) => {
      const d = new Date(e.dateOccurred + 'T00:00:00');
      if (d.getFullYear() !== reportYear) return false;
      const month = d.getMonth() + 1;
      const inHalf = slot.termHalf === 'early' ? month <= 6 : month >= 7;
      if (!inHalf) return false;
      const enrichment = e.aiEnrichment as AiEnrichment;
      const subjectSet = new Set([
        ...(e.subjects ?? []),
        ...(enrichment?.subjects_detected ?? []).map((s) => s.toLowerCase()),
      ]);
      return subjectSet.has(slot.area) || (slot.altArea ? subjectSet.has(slot.altArea) : false);
    });
    const match = candidates[0] ?? null;
    const status = match
      ? (match.evidenceUrls?.length ?? 0) > 0 ? 'Complete' : 'Partial'
      : 'Empty';
    return { ...slot, entryTitle: match?.title ?? '—', status };
  });

  // Gap analysis
  const gaps = subjectCoverage.filter((s) => s.count <= 1);

  // ─── Generate PDF ───
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = new jsPDF() as any;
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('HEU Compliance Report', pageW / 2, y, { align: 'center' });
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
  if (settings?.heuRegistrationNumber) { doc.text(`HEU Registration: ${settings.heuRegistrationNumber}`, 14, y); y += 5; }
  doc.text(`Family: ${familyRow?.familyName ?? '—'}`, 14, y); y += 5;
  doc.text(`Registered: ${format(registrationDate, 'd MMM yyyy')}`, 14, y); y += 5;
  if (reportDueDate) {
    doc.text(`Report Due: ${format(reportDueDate, 'd MMM yyyy')}`, 14, y); y += 5;
    if (daysUntilDue !== null) {
      doc.text(daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days remaining`, 14, y);
      y += 5;
    }
  }
  y += 5;

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
  doc.text('Curriculum Coverage', 14, y); y += 3;

  doc.autoTable({
    startY: y,
    head: [['Subject', 'Entries', 'Coverage %', 'Curriculum Descriptors']],
    body: subjectCoverage.map((s) => [
      s.label,
      String(s.count),
      `${s.pct}%`,
      s.descriptors > 0 ? `${s.descriptors} matched` : '—',
    ]),
    headStyles: { fillColor: [100, 80, 60], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    theme: 'grid',
    margin: { left: 14 },
  });

  y = doc.lastAutoTable.finalY + 10;

  // Work samples table
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Required Work Samples (QHE)', 14, y); y += 3;

  doc.autoTable({
    startY: y,
    head: [['Slot', 'Subject Area', 'Status', 'Matched Entry']],
    body: workSamples.map((ws) => [
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

  // Gap analysis
  if (gaps.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Gap Analysis', 14, y); y += 3;

    doc.autoTable({
      startY: y,
      head: [['Subject', 'Entries', 'Severity']],
      body: gaps.map((g) => [
        g.label,
        String(g.count),
        g.count === 0 ? 'Critical — No entries' : 'Moderate — Only 1 entry',
      ]),
      headStyles: { fillColor: [100, 80, 60], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      theme: 'grid',
      margin: { left: 14 },
    });

    y = doc.lastAutoTable.finalY + 10;
  }

  // Entry log summary (last page)
  if (entries.length > 0) {
    if (y > 200) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Learning Entry Log', 14, y); y += 3;

    const sortedEntries = [...entries].sort(
      (a, b) => new Date(b.dateOccurred).getTime() - new Date(a.dateOccurred).getTime()
    );

    doc.autoTable({
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
      `Hearth LMS — HEU Compliance Report — ${learner.name} — Page ${i} of ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  const filename = `hearth-heu-report-${learner.name.toLowerCase().replace(/\s+/g, '-')}-${format(now, 'yyyy-MM-dd')}.pdf`;

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
