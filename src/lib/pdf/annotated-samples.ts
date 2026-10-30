/**
 * PDF section for annotated work samples (W5.1, D-LP-7).
 *
 * One block per sample, grouped per learning area: the photo, the parent's own
 * words, then each confirmed objective's plain-language line and band sentence.
 * All text comes from `assembleAnnotatedSamples` (parent-owned or authored);
 * nothing here composes a sentence about the child.
 *
 * Shared by both report tiers. Renders nothing when there are no samples, so a
 * report never prints an empty claim.
 */
import type { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import {
  ANNOTATED_SAMPLES_COPY,
  BAND_LABEL,
  SLOT_LABEL,
  type AnnotatedSampleGroup,
} from '@/lib/report/annotated-samples';
import { loadEvidenceImage, type PdfImage } from './evidence-images';

/** Upper bound on photos fetched for one PDF, to keep the export quick. */
export const MAX_PDF_SAMPLE_IMAGES = 40;

const MARGIN = 14;
const PAGE_BOTTOM = 275;
const PHOTO_MAX_W = 48;
const PHOTO_MAX_H = 48;
const PHOTO_GAP = 6;
const BODY_LINE = 4.5;
const SMALL_LINE = 3.8;
const BROWN: [number, number, number] = [100, 80, 60];
const GREY: [number, number, number] = [90, 90, 90];

/**
 * Fetch the first photo of each sample (capture order), up to the cap, keyed
 * by entry id. Loads run in parallel; a missing or unreadable photo is simply
 * absent from the map.
 */
export async function loadSampleImages(
  groups: readonly AnnotatedSampleGroup[],
  familyId: string,
  maxImages: number = MAX_PDF_SAMPLE_IMAGES,
): Promise<Map<string, PdfImage>> {
  const wanted: Array<{ entryId: string; ref: string }> = [];
  for (const g of groups) {
    for (const s of g.samples) {
      if (wanted.length >= maxImages) break;
      const ref = s.photos[0]?.ref;
      if (ref) wanted.push({ entryId: s.entryId, ref });
    }
  }
  const loaded = await Promise.all(
    wanted.map(async (w) => [w.entryId, await loadEvidenceImage(w.ref, familyId)] as const),
  );
  const out = new Map<string, PdfImage>();
  for (const [entryId, img] of loaded) if (img) out.set(entryId, img);
  return out;
}

type Line = { text: string; size: number; style: 'normal' | 'bold' | 'italic'; color: [number, number, number]; gapAfter?: number };

function sampleLines(
  doc: jsPDF,
  sample: AnnotatedSampleGroup['samples'][number],
  width: number,
): Line[] {
  const out: Line[] = [];
  const push = (text: string, size: number, style: Line['style'], color: Line['color'], gapAfter = 0) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const parts = doc.splitTextToSize(text, width) as string[];
    parts.forEach((t, i) => out.push({ text: t, size, style, color, gapAfter: i === parts.length - 1 ? gapAfter : 0 }));
  };

  push(ANNOTATED_SAMPLES_COPY.yourWords, 8, 'bold', BROWN);
  if (sample.parentWords) push(sample.parentWords, 9, 'normal', [0, 0, 0], 2);
  else push(ANNOTATED_SAMPLES_COPY.noWords, 9, 'italic', GREY, 2);

  if (sample.noticed) {
    push(ANNOTATED_SAMPLES_COPY.noticed, 8, 'bold', BROWN);
    push(sample.noticed, 9, 'normal', [0, 0, 0], 2);
  }

  for (const d of sample.dlos) {
    push(d.line, 9, 'bold', [0, 0, 0]);
    push(`${BAND_LABEL[d.tier]} · ${d.threadName}`, 8, 'normal', GREY);
    push(d.bandSentence, 9, 'italic', [0, 0, 0], 2);
  }

  if (sample.requiredSlot && SLOT_LABEL[sample.requiredSlot]) {
    push(ANNOTATED_SAMPLES_COPY.requiredSlot(SLOT_LABEL[sample.requiredSlot]), 8, 'normal', GREY);
  }
  return out;
}

function lineHeight(l: Line): number {
  return (l.size >= 9 ? BODY_LINE : SMALL_LINE) + (l.gapAfter ?? 0);
}

function photoBox(doc: jsPDF, img: PdfImage | undefined): { w: number; h: number } | null {
  if (!img) return null;
  try {
    const props = doc.getImageProperties(img.data);
    if (!props.width || !props.height) return null;
    const scale = Math.min(PHOTO_MAX_W / props.width, PHOTO_MAX_H / props.height);
    return { w: props.width * scale, h: props.height * scale };
  } catch {
    return null;
  }
}

function dateLabel(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? iso : format(d, 'd MMM yyyy');
}

/**
 * Draw the section starting at `startY` and return the y after it. Starts on a
 * fresh page. Returns `startY` untouched when there is nothing to draw.
 */
export function renderAnnotatedSamples(
  doc: jsPDF,
  args: {
    groups: readonly AnnotatedSampleGroup[];
    images: ReadonlyMap<string, PdfImage>;
    learnerName: string;
    startY: number;
  },
): number {
  const { groups, images, learnerName } = args;
  if (groups.every((g) => g.samples.length === 0)) return args.startY;

  const pageW = doc.internal.pageSize.getWidth();
  const fullWidth = pageW - MARGIN * 2;

  doc.addPage();
  let y = 20;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Annotated Work Samples', pageW / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GREY);
  const intro = doc.splitTextToSize(ANNOTATED_SAMPLES_COPY.intro(learnerName), fullWidth) as string[];
  doc.text(intro, MARGIN, y);
  y += intro.length * SMALL_LINE + 6;

  for (const group of groups) {
    if (group.samples.length === 0) continue;
    if (y > PAGE_BOTTOM - 40) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BROWN);
    doc.text(group.label, MARGIN, y);
    y += 7;

    for (const sample of group.samples) {
      const img = images.get(sample.entryId);
      const box = photoBox(doc, img);
      const textX = box ? MARGIN + PHOTO_MAX_W + PHOTO_GAP : MARGIN;
      const textW = box ? fullWidth - PHOTO_MAX_W - PHOTO_GAP : fullWidth;

      const lines = sampleLines(doc, sample, textW);
      if (!box && sample.photos.length > 0) {
        lines.push({ text: ANNOTATED_SAMPLES_COPY.photoOnFile, size: 8, style: 'italic', color: GREY });
      }
      const headH = 6;
      const textH = lines.reduce((h, l) => h + lineHeight(l), 0);
      const blockH = headH + Math.max(box?.h ?? 0, textH) + 8;
      if (y + blockH > PAGE_BOTTOM && y > 40) { doc.addPage(); y = 20; }

      // Heading: date + entry title.
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      const heading = doc.splitTextToSize(
        `${dateLabel(sample.dateOccurred)}  •  ${sample.title || '—'}`,
        fullWidth,
      ) as string[];
      doc.text(heading[0], MARGIN, y);
      y += headH;

      if (box && img) {
        try {
          doc.addImage(img.data, img.format, MARGIN, y - 3, box.w, box.h);
        } catch {
          // An undecodable image leaves the text block intact.
        }
      }

      let ty = y;
      for (const l of lines) {
        if (ty > PAGE_BOTTOM) { doc.addPage(); ty = 20; y = 20; }
        doc.setFontSize(l.size);
        doc.setFont('helvetica', l.style);
        doc.setTextColor(...l.color);
        doc.text(l.text, textX, ty);
        ty += lineHeight(l);
      }
      y = Math.max(ty, y + (box?.h ?? 0)) + 8;
    }
    y += 2;
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  return y;
}
