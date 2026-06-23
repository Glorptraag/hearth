import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { families, learningEntries, learners } from '@/lib/db/schema';
import { getFamilyByClerkId } from '@/lib/auth/helpers';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { routeHandler } from '@/lib/api-helpers';
import {
  groupEntriesByTopThread,
  THREAD_DISPLAY_CONFIDENCE_FLOOR,
  type ConfidenceThread,
} from '@/lib/portfolio/thread-grouping';

/**
 * GET /api/portfolio/export?learnerId=<id>
 *
 * The learner's portfolio as a PDF — every complete moment, grouped by its top
 * capability thread (the same "By Thread" grouping the screen uses), with date,
 * subjects and a short description. This is the narrative companion to the
 * compliance report (/api/report/export): a portrait of the child's learning,
 * not a curriculum-coverage artifact. The `portfolio_exported` analytics event
 * fires client-side on the button (mirrors report_exported).
 *
 * Cross-family isolation: 404 if the learner isn't in the signed-in family.
 */
const SUBJECT_LABELS: Record<string, string> = {
  english: 'English',
  mathematics: 'Mathematics',
  science: 'Science',
  hass: 'HASS',
  arts: 'Arts',
  technologies: 'Technologies',
  hpe: 'HPE',
  languages: 'Languages',
};

type PortfolioEntry = {
  title: string;
  description: string | null;
  dateOccurred: string;
  subjects: string[] | null;
  aiEnrichment: { capability_threads?: ConfidenceThread[] } | null;
};

export const GET = routeHandler(async (request: NextRequest) => {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const family = await getFamilyByClerkId(userId);
  if (!family) return NextResponse.json({ error: 'Family not found' }, { status: 404 });

  const learnerId = request.nextUrl.searchParams.get('learnerId');
  if (!learnerId) return NextResponse.json({ error: 'learnerId required' }, { status: 400 });

  const [learnerRows, familyRow, allEntries] = await Promise.all([
    db.select().from(learners).where(and(eq(learners.familyId, family.id), eq(learners.id, learnerId))),
    db.query.families.findFirst({ where: eq(families.id, family.id) }),
    db.select().from(learningEntries).where(eq(learningEntries.familyId, family.id)),
  ]);

  const learner = learnerRows[0];
  if (!learner) return NextResponse.json({ error: 'Learner not found' }, { status: 404 });

  const now = new Date();

  // Complete entries that include this learner, newest first.
  const entries: PortfolioEntry[] = allEntries
    .filter((e) => e.status === 'complete' && (e.learnerIds ?? []).includes(learnerId))
    .map((e) => ({
      title: e.title,
      description: e.description,
      dateOccurred: e.dateOccurred,
      subjects: e.subjects,
      aiEnrichment: e.aiEnrichment as PortfolioEntry['aiEnrichment'],
    }))
    .sort((a, b) => b.dateOccurred.localeCompare(a.dateOccurred));

  const subjectSet = new Set<string>();
  const threadSet = new Set<string>();
  for (const e of entries) {
    for (const s of e.subjects ?? []) subjectSet.add(s);
    for (const t of e.aiEnrichment?.capability_threads ?? []) {
      if (typeof t?.confidence === 'number' && t.confidence >= THREAD_DISPLAY_CONFIDENCE_FLOOR) {
        threadSet.add(t.thread_id);
      }
    }
  }

  const grouped = groupEntriesByTopThread(entries);

  // ─── Generate PDF ───
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = new jsPDF() as any;
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${learner.name}'s Learning Portfolio`, pageW / 2, y, { align: 'center' });
  y += 9;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${format(now, 'd MMMM yyyy')}`, pageW / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(`${familyRow?.familyName ?? 'Family'}`, pageW / 2, y, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 12;

  doc.setFontSize(11);
  doc.text(
    `${entries.length} ${entries.length === 1 ? 'moment' : 'moments'} · ${subjectSet.size} ${subjectSet.size === 1 ? 'subject' : 'subjects'} · ${threadSet.size} ${threadSet.size === 1 ? 'thread' : 'threads'}`,
    14,
    y,
  );
  y += 10;

  if (entries.length === 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(90, 90, 90);
    doc.text(`No moments logged for ${learner.name} yet.`, 14, y);
  } else {
    for (const [threadName, threadEntries] of grouped) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`${threadName} (${threadEntries.length})`, 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [['Date', 'Moment', 'Subjects']],
        body: threadEntries.map((e) => [
          format(new Date(e.dateOccurred), 'd MMM yyyy'),
          e.description ? `${e.title}\n${e.description}` : e.title,
          (e.subjects ?? []).map((s) => SUBJECT_LABELS[s] ?? s).join(', ') || '—',
        ]),
        headStyles: { fillColor: [100, 80, 60], fontSize: 9 },
        bodyStyles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 26 }, 2: { cellWidth: 38 } },
        theme: 'grid',
        margin: { left: 14, right: 14 },
      });
      y = doc.lastAutoTable.finalY + 8;
    }
  }

  // Footer on every page.
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Hearth LMS — Learning Portfolio — ${learner.name} — Page ${i} of ${pageCount}`,
      pageW / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' },
    );
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  const filename = `hearth-portfolio-${learner.name.toLowerCase().replace(/\s+/g, '-')}-${format(now, 'yyyy-MM-dd')}.pdf`;

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}, { route: 'GET /api/portfolio/export' });
